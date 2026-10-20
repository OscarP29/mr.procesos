# Documentación: desktop-app

Aplicación de escritorio construida con **Electron + React + TypeScript** (bundler `electron-vite`) que simula la planificación de procesos con el algoritmo **Round Robin**.

- Raíz del proyecto: `desktop-app/`
- Script de desarrollo: `npm run dev` (también `lint`, `typecheck`, `build`, `build:win`)
- Dependencias clave: `electron`, `react`, `@heroui/react` (UI), `zustand` (estado), `axios` (HTTP al `api-server`), `recharts` (gráficas).

---

## 1. Arquitectura general

Electron divide la app en tres procesos, y cada uno vive en una carpeta de `src/`:

```
desktop-app/src
├── main/                      # Proceso principal (Node.js)
│   ├── index.ts               # Arranque, ventana, handlers IPC
│   ├── service/
│   │   └── round-robin-service.ts   # ★ Núcleo del algoritmo
│   ├── workers/
│   │   └── process-workers.ts       # ★ Worker por proceso (worker_threads)
│   ├── types-round-robin.ts         # Tipos del dominio
│   └── round-robin.md               # Notas internas del algoritmo
├── preload/
│   ├── index.ts               # Puente seguro: expone window.api
│   └── index.d.ts             # Tipos del puente
└── renderer/                  # UI React
    └── src
        ├── App.tsx            # Navegación por pestañas
        ├── pages/             # Procesos, Simulador, Configuración
        ├── components/        # UI de la simulación
        ├── hook/use-round-robin.tsx   # Suscripción al estado del algoritmo
        ├── store/use-store.ts         # Ajustes persistentes (zustand)
        ├── api/api.ts                 # Cliente HTTP al api-server
        └── types/                     # Tipos de API y de Round Robin
```

Flujo de datos de una simulación:

```
Renderer (UI)  --invoke-->  Preload (window.api)  --ipcMain.handle-->  main/index.ts
     ^                                                             |
     |                      RoundRobinService (colas + reloj)       |
     |                                                             v
     +----------------  round-robin:update  <---------------  emite estado
                                                                 |
                                                              Worker threads
                                                              (escriben .txt)
```

---

## 2. Núcleo: el algoritmo Round Robin

Archivos principales:

| Archivo | Rol |
|---|---|
| `src/main/service/round-robin-service.ts` | Implementa el planificador: colas, reloj virtual, turnos, ciclo de vida. |
| `src/main/workers/process-workers.ts` | Hilo de ejecución que procesa el "trabajo" de un proceso y lo escribe a disco. |
| `src/main/types-round-robin.ts` | Tipos `RoundRobinProcess` y `RoundRobinConfig`. |
| `src/main/index.ts` | Valida la entrada IPC y crea/administra la instancia del servicio. |

### 2.1 Modelo de datos

**Configuración (`RoundRobinConfig`)**

| Campo | Tipo | Significado |
|---|---|---|
| `quantum` | `number` | Máximo de unidades de trabajo por turno (entero ≥ 1). |
| `delay` | `number` | Milisegundos por unidad de trabajo (velocidad de simulación). |
| `outputDir` | `string?` | Carpeta base donde se crean los archivos de salida. Si no viene, se usa `app.getPath('userData')`. |

**Proceso (`RoundRobinProcess`)**

El "trabajo" de un proceso es su campo `description` (un string). Cada unidad de la cadena = 1 unidad de progreso, así que `total = description.length`.

| Campo | Rol en el algoritmo |
|---|---|
| `pid` | Identificador único. Se usa como clave del `Map` de workers, para nombrar el archivo de salida y para buscar en las colas. |
| `description` | Trabajo simulado. Se procesa de izquierda a derecha con `slice`. |
| `preemption` | `0` = limitado por quantum (Round Robin clásico). `1` = procesa **todo lo restante** en un solo turno (no expulsivo / "sistema"). |
| `state` | `ready` \| `running` \| `finished` (`waiting` está declarado pero no se usa). |
| `progress` / `total` | Unidades ya procesadas / unidades totales. |
| `executions` | Contador de turnos en los que ha participado. |
| `output` | Texto acumulado que el proceso ha "ejecutado" (se concatena el `chunk` de cada turno). |
| `arrivalTime` | Tiempo de llegada. Se recibe en unidades y se convierte a reloj virtual: `arrivalTime * delay`. |
| `burst` | Se calcula como `description.length * delay`; es solo informativo, no interviene en la planificación. |
| `finishTime` / `turnaround` | Reloj virtual al terminar y `finishTime - arrivalTime`. |

### 2.2 Inicialización (`init()`)

Al construir `RoundRobinService` (y también en cada `reset()`):

1. Se copian los procesos de la fuente y se les pone el estado inicial: `state='ready'`, `progress=0`, `total=description.length`, `output=''`, `executions=0`.
2. Se convierten tiempos: `arrivalTime = (arrivalTime ?? 0) * delay`, `burst = description.length * delay`.
3. `clock = 0` (reloj virtual de la simulación).
4. Se llena `pending` con los PID ordenados por tiempo de llegada.
5. `queue = []` (cola de listos) y se llama a `admit()`.

`admit()` transfiere de `pending` a `queue` todos los procesos cuyo `arrivalTime <= clock`. Como al inicio `clock = 0`, todos los procesos con llegada 0 entran de inmediato a la cola.

### 2.3 Ciclo de ejecución (`loop()`)

Es un `async` que corre en segundo plano mientras `status === 'running'`. En cada iteración hace un **turno completo**:

1. **CPU ociosa**: si `queue` está vacía pero queda gente en `pending`, se salta el `clock` directamente al `arrivalTime` del siguiente proceso y se vuelve a llamar a `admit()`. No se simula espera muerta.
2. **Selección**: se extrae el primer PID de la cola (`queue.shift()`) — aquí está la circularidad de Round Robin: al terminar el turno sin finalizar, el proceso se inserta **al final** de la cola.
3. **Se marca `running`** y se incrementa `executions`.
4. **Tamaño del turno**:

   ```text
   remaining = total - progress
   chars = (preemption === 1) ? remaining : min(quantum, remaining)
   ```

   Es decir, con `preemption = 1` el proceso se ejecuta hasta el final sin ser interrumpido; con `preemption = 0` se limita al quantum.
5. **Se delega al worker** con `runTurn(pid, chars)` y se espera su respuesta (promise).
6. **Actualización visual**: `progress` pasa al nuevo valor y `output` concatena el `chunk` devuelto. El proceso se queda en `running` mientras ocurre la espera.
7. **Duración visible**: `await sleep(chunk.length * delay)` — la simulación tarda lo que le toca al proceso según la velocidad configurada.
8. **Avance del reloj**: `clock += chunk.length * delay` y se llama otra vez a `admit()` (pueden llegar procesos nuevos en mitad de la ejecución).
9. **Fin del turno**: si el worker respondió `finished`, el proceso pasa a `finished` y se le calcula `finishTime` y `turnaround`; si no, vuelve a `ready` y se **empuja al final de la cola** (`queue.push(pid)`).
10. Pausa fija de `150 ms` entre turnos (overhead visual, no se suma al reloj virtual).

**Control de cancelación (generación)**: `reset()` incrementa `this.generation`. Cada `await` del ciclo compara `gen !== this.generation` y aborta si la simulación fue reiniciada, de modo que un loop viejo no siga escribiendo estado.

**Fin de la simulación**: el `while` termina cuando no hay procesos en la cola ni pendientes. El estado global pasa a `finished` y se terminan todos los workers.

### 2.4 Los workers (`process-workers.ts`)

Cada proceso tiene su propio hilo (`node:worker_threads`). El servicio los crea en `start()`:

```ts
new Worker(workerPath, {
  workerData: { pid, description, filePath: join(dir, `${pid}-${name}.txt`) }
})
```

- `workerPath` se obtiene con el import especial `../workers/process-workers?modulePath`, que hace que `electron-vite` compile el worker y entregue la ruta correcta tanto en desarrollo como en build.
- Todos los workers se guardan en un `Map<number, Worker>` indexado por PID.
- Al crearse, el worker hace `writeFileSync(filePath, '')`, que crea/vacía su archivo de salida.

**Protocolo de mensajes**

| Dirección | Mensaje | Contenido |
|---|---|---|
| servicio → worker | `{ type: 'turn', quantum: chars }` | "Ejecuta `chars` unidades ahora". El `quantum` del mensaje es el tamaño **efectivo** del turno (puede ser el quantum configurado o el resto entero del proceso). |
| worker → servicio | `{ pid, progress, chunk, finished }` | Fragmento escrito, nuevo progreso y si terminó. |

**Qué hace el worker en cada turno** (todo síncrono, en su propio hilo):

```ts
const end = Math.min(progress + msg.quantum, description.length)
const chunk = description.slice(progress, end)
appendFileSync(filePath, chunk)   // escribe el fragmento en su .txt
progress = end
parentPort.postMessage({ pid, progress, chunk, finished: progress >= description.length })
```

Puntos importantes:

- El worker **no duerme ni controla la velocidad**: hace su trabajo de golpe y responde. La "velocidad" de la simulación la impone el proceso principal con el `sleep(chunk.length * delay)`.
- El worker es quien persiste la salida en disco; el proceso principal solo guarda el `output` en memoria para la UI.
- El worker solo entiende el mensaje `type: 'turn'`; cualquier otro se ignora.
- El servicio espera la respuesta con `w.once('message', resolve)` y `w.once('error', reject)` en `runTurn()`.

**Terminación**: `killWorkers()` hace `terminate()` a todos y limpia el `Map`. Se llama al finalizar la simulación, en `reset()` y al cerrar la ventana (`window-all-closed` en `index.ts`).

### 2.5 Ciclo de vida y controles

| Acción | Efecto |
|---|---|
| `start()` | Solo desde `idle`. Borra y recrea el directorio de salida, crea un worker por proceso, pone `running` y lanza `loop()`. |
| `pause()` | Solo desde `running` → `paused`. El `while` del ciclo se detiene al llegar a la comprobación (un turno en curso puede completarse). |
| `resume()` | Solo desde `paused` → `running`; si no hay un ciclo activo, vuelve a lanzarlo. |
| `reset()` | Incrementa `generation` (invalida el loop), `idle`, mata workers, borra el directorio y llama a `init()` para reconstruir el estado. |

**Directorio de salida**: `<outputDir ?? userData>/MrProcesos-round-robin/`. Cada proceso escribe en `<pid>-<name>.txt`. Tanto `start()` como `reset()` eliminan el directorio completo (`rmSync recursive`), así que la carpeta elegida por el usuario debe considerarse de uso exclusivo de la simulación.

### 2.6 Ejemplo de planificación

Con `quantum = 2`, `delay = 100 ms`, tres procesos con `preemption = 0` y llegada 0:

| Proceso | Descripción | Total |
|---|---|---:|
| P1 | `ABCDE` | 5 |
| P2 | `XYZ` | 3 |
| P3 | `12` | 2 |

Cola inicial `[P1, P2, P3]`:

| Turno | Proceso | Chunk | Reloj al terminar | Cola después |
|---:|---|---|---:|---|
| 1 | P1 | `AB` | 200 ms | `[P2, P3, P1]` |
| 2 | P2 | `XY` | 400 ms | `[P3, P1, P2]` |
| 3 | P3 | `12` | 600 ms | `[P1, P2]` |
| 4 | P1 | `CD` | 800 ms | `[P2, P1]` |
| 5 | P2 | `Z` | 900 ms | `[P1]` |
| 6 | P1 | `E` | 1000 ms | `[]` |

Al final los tres quedan en `finished` con `output` igual a su descripción. El tiempo real de la app agrega además los 150 ms fijos entre turnos y el overhead de la UI; ese intervalo no se suma al `clock`.

### 2.7 Aspectos a tener en cuenta

- La validación IPC solo comprueba `quantum` (entero ≥ 1), `delay` (finito ≥ 0), que la lista no esté vacía y que `outputDir` exista si viene. No valida PID duplicados ni el resto de campos.
- PID duplicados rompen el `Map` de workers y el nombre de archivo (se pisan).
- Con `preemption = 1` el proceso deja de comportarse como Round Robin: ejecuta todo en un turno.
- `delay = 0` es válido: los tiempos calculados son 0, pero sigue existiendo la pausa fija de 150 ms.
- `arrivalTime` no son milisegundos directos: se multiplica por `delay`.
- Las unidades son códigos UTF-16 de JavaScript (`String.length`/`slice`), por lo que un quantum podría dividir un par sustituto de Unicode.
- `runTurn()` no escucha el evento `exit` del worker: si este muriera mientras se espera la promesa, esa espera podría quedarse colgada.
- No existe estado global `error`; si un worker falla, la promesa se rechaza pero la UI no recibe un estado de error.
- El progreso se actualiza por turno (fragmento), no carácter a carácter.

---

## 3. Componentes que usan el algoritmo

### 3.1 Proceso principal: `src/main/index.ts`

Registra los manejadores IPC que controlan la simulación:

| Canal | Tipo | Qué hace |
|---|---|---|
| `round-robin:start` | `handle` | Valida `quantum`, `delay`, lista de procesos y `outputDir`; reinicia un servicio anterior, crea un `RoundRobinService` con la ventana emisora y lo inicia. |
| `round-robin:pause` / `resume` / `reset` | `handle` | Delegan en la instancia única `rr`. |
| `dialog:openDirectory` | `handle` | Abre el diálogo nativo para elegir la carpeta de salida. |

También llama a `rr?.reset()` al cerrar todas las ventanas para limpiar workers y archivos.

### 3.2 Preload: `src/preload/index.ts`

Expone `window.api` vía `contextBridge`:

```ts
window.api.roundRobin.start({ processes, quantum, delay, outputDir })
window.api.roundRobin.pause() / resume() / reset()
window.api.roundRobin.onUpdate(cb)   // suscribe 'round-robin:update', devuelve el unsubscribe
window.api.selectDirectory()
```

Es la única frontera entre la UI y el proceso principal (context isolation activo).

### 3.3 Hook: `use-round-robin.tsx`

Envuelve el puente IPC en estado de React:

- Mantiene `processes`, `status` y `error`.
- Se suscribe a `onUpdate` en un `useEffect` (devuelve el cleanup del listener).
- `start(list, quantum, delay, outputDir)` invoca el IPC y captura el mensaje de error de la validación en `error`.
- Devuelve también `pause`, `resume` y `reset`.

### 3.4 Página Simulador: `pages/simulador.tsx`

Es la única pantalla que dispara la simulación:

1. Carga las categorías de procesos desde la API (`getCategories` / `getCategory`).
2. Mapea los procesos de la categoría al tipo `RoundRobinProcess` con valores por defecto (`arrivalTime: 0`, etc.) mediante un `useMemo`.
3. Permite configurar **Velocidad (ms)** = `delay` y **Quantium** = `quantum` (por defecto 1000 y 10).
4. Al pulsar Iniciar, guarda `activeDelay`/`activeQuantum` (para que la UI no cambie si el usuario edita los inputs a mitad de simulación) y llama a `start(...)` con el directorio elegido en Configuración (`useAppStore.directory`).
5. Renderiza el resultado en función del estado: si hay actualizaciones del servicio muestra `SchemaSimulator` + `Results` + `Chart`; si solo hay procesos cargados, `TableProcess`; si nada, `EmplyState`.

### 3.5 Controles: `components/controls.tsx`

Botones Play/Pausa/Reiniciar. Traduce el `status` global en acciones: `idle` → `onStart`, `paused` → `onResume`, `running` → `onPause`. Se deshabilita el play cuando `finished` y el reset cuando `idle`.

### 3.6 Visualización del estado: `schema-simulator.tsx`, `sections-process.tsx`, `process-progress.tsx`

- `SchemaSimulator` agrupa los procesos según su `state` en cuatro secciones: **Listos** (`ready` con `executions <= 1`), **Espera** (`ready` con `executions >= 1`), **Ejecutando** (`running`) y **Finalizados** (`finished`). Es decir, deriva subestados de la cola de listos usando el contador de ejecuciones.
- `SectionsProcess` pinta las tarjetas de cada proceso (PID, `progress/total`, ejecuciones), aplica un efecto de "heartbeat" al que está `running` (con duración = `delay`) y resalta en color accent los de `preemption === 1` (sistema).
- `ProcessProgress` dibuja la barra de progreso animando el relleno con `transitionDuration = chars * delay` y `steps(chars)`, replicando visualmente la duración del turno que calcula el servicio. El valor de `progress` llega actualizado por cada turno.

### 3.7 Resultados: `results.tsx`, `table-results.tsx`, `chart.tsx`

- `Results` divide la lista en "Procesos expulsivos" (`preemption = 0`) y "no expulsivos" (`preemption = 1`).
- `ResultTable` muestra por proceso: llegada (`arrivalTime`), ráfaga (`burst`), prioridad (`preemption`), retorno (`turnaround`) y finalización (`finishTime`).
- `Chart` (recharts) grafica el `turnaround` de cada proceso en un barras.

### 3.8 Leyenda: `process-legend.tsx`

Pequeña leyenda de colores: Sistema (`preemption = 1`) vs Usuario (`preemption = 0`).

### 3.9 Página Configuración: `pages/settings.tsx` + `store/use-store.ts`

No ejecuta el algoritmo, pero lo condiciona:

- **Almacenamiento**: selecciona el directorio (`window.api.selectDirectory`) que se usará como `outputDir` de la simulación. La advertencia en la UI recuerda que el contenido de esa carpeta se borra en cada simulación.
- **API**: URL del `api-server` (por defecto `http://localhost:8000`) con botón de prueba (`GET /`).
- **Apariencia**: tema claro/oscuro.
- Todo se persiste con `zustand/persist` bajo la clave `app-settings`.

---

## 4. Componentes ajenos al algoritmo

- **`pages/process.tsx`**: pide al api-server la lista de procesos reales del sistema (`GET /process?limit&sort_by`) y la muestra en `TableProcess`. Permite guardarlas como categoría con `ModalSave` (`POST /catalogs`, manejando el 409 de nombre duplicado).
- **`components/table-process.tsx`**: tabla memoizada con PID, nombre, descripción, usuario, CPU, memoria y prioridad.
- **`components/modal-save.tsx`**: modal para nombrar y guardar un conjunto de procesos como categoría.
- **`components/header.tsx`**, **`emply-state.tsx`**, **`tooltip.tsx`**: cabeceras, estado vacío y tooltips de ayuda.
- **`api/api.ts`**: cliente axios con `getHelloMom`, `getProcess`, `getCategories`, `getCategory`, `saveCategory`; lee `apiUrl` del store en cada llamada.
- **`App.tsx`**: layout con tres pestañas verticales (Procesos, Simulación, Configuración) usando `Tabs` de HeroUI.

---

## 5. Relación con el resto del repositorio

- `api-server/` (Python) expone los endpoints que consumen las páginas Procesos y Simulador (`/process`, `/catalogs`).
- El escritorio no depende del servidor para **ejecutar** la simulación: una vez cargados los procesos, todo el algoritmo y los workers corren localmente en el proceso principal de Electron.
- `docs/` es la carpeta de documentación del proyecto; este archivo es la referencia del lado `desktop-app`.
