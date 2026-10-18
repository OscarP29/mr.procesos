# Algoritmo Round Robin: funcionamiento actual

Este documento describe la implementación que existe actualmente en el proceso principal de Electron, no una especificación ideal del algoritmo. Las referencias de código son relativas a `desktop-app/src/main`.

## Resumen

La simulación mantiene una cola circular de procesos listos. En cada turno selecciona el primer PID de la cola y delega el trabajo a un `Worker` de Node.js. El worker avanza el proceso una cantidad de caracteres determinada por el quantum; al terminar el turno, el proceso se marca como terminado o se vuelve a agregar al final de la cola.

La descripción de cada proceso representa su trabajo: completar una unidad de cadena equivale a una unidad de trabajo. El código usa `String.length` y `String.slice`, por lo que esas unidades son unidades de código UTF-16 de JavaScript y no siempre coinciden con un carácter Unicode completo. La velocidad (`delay`, en milisegundos por unidad) determina cuánto tiempo visible se espera por las unidades procesadas durante un turno. Además, la implementación usa esa velocidad para convertir los tiempos de llegada declarados en unidades a milisegundos de reloj virtual.

Los componentes involucrados son:

- `index.ts`: recibe y valida las solicitudes IPC, crea el servicio y expone las acciones de control.
- `service/round-robin-service.ts`: administra el estado, el reloj virtual, las colas, los workers y las actualizaciones a la ventana.
- `workers/process-workers.ts`: procesa el fragmento de descripción de un turno y escribe ese fragmento a un archivo.
- `types-round-robin.ts`: define los tipos de proceso y configuración.

## Datos de entrada

### Solicitud IPC para iniciar

El proceso principal escucha el canal `round-robin:start`. La carga útil esperada es:

```ts
{
  processes: RoundRobinProcess[]
  quantum: number
  delay: number
}
```

`quantum` y `delay` son leídos y validados en `index.ts`. El arreglo de procesos se pasa al constructor del servicio como fuente de la simulación.

### Configuración

| Campo | Tipo | Significado y uso actual |
|---|---|---|
| `quantum` | `number` | Máximo de caracteres que puede procesar un proceso por turno cuando `preemption` no es `1`. IPC exige que sea un entero mayor o igual que `1`. |
| `delay` | `number` | Milisegundos por carácter/unidad de trabajo. IPC exige un número finito mayor o igual que `0`. Se usa para calcular el tiempo de llegada y la duración visible del turno. |

### Proceso

El tipo `RoundRobinProcess` contiene:

| Campo | Tipo | Uso actual |
|---|---|---|
| `pid` | `number` | Identifica el proceso en las colas, el mapa de workers y el nombre del archivo de salida. Se espera que sea único. |
| `name` | `string` | Nombre descriptivo. Se conserva en el estado enviado a la interfaz; no afecta al algoritmo. |
| `description` | `string` | Trabajo simulado. Cada unidad UTF-16 cuenta como una unidad de progreso y el texto procesado se guarda como salida. |
| `user` | `string` | Dato descriptivo conservado; no afecta al algoritmo. |
| `preemption` | `0 \| 1` | La lógica actual lo usa para decidir cuánto trabajo realizar en el turno: con `1` procesa todo lo restante; en otro caso procesa como máximo el quantum. |
| `state` | `ProcessStatus` | Estado de ejecución. Al iniciar una simulación el servicio lo establece en `ready`, independientemente del valor de entrada. |
| `progress` | `number` | Caracteres procesados. El servicio lo inicializa en `0` y el worker devuelve el nuevo valor tras cada turno. |
| `total` | `number` | El servicio lo inicializa con `description.length`. |
| `executions` | `number` | Número de turnos iniciados. Se inicializa en `0` y aumenta cada vez que el proceso es seleccionado. |
| `output` | `string` | Texto acumulado procesado. Se inicializa vacío y se actualiza después de cada turno. |
| `arrivalTime` | `number` | El tipo lo declara obligatorio. Si falta en tiempo de ejecución, el servicio usa `0`; luego convierte el valor a reloj virtual multiplicándolo por `delay`. |
| `burst` | `number` | El servicio lo calcula como `description.length * delay`. Actualmente se reporta como dato, pero no participa en la decisión del quantum. |
| `finishTime` | `number \| null` | Reloj virtual en que termina el proceso. Se inicializa en `null` y se actualiza al completarse. |
| `turnaround` | `number \| null` | Tiempo de retorno calculado como `finishTime - arrivalTime` (ambos en la escala del reloj virtual). Se inicializa en `null`. |

## Inicialización

Al construir `RoundRobinService`, se guardan la ventana, la configuración y la lista original de procesos, y se llama a `init()`.

`init()` prepara una copia de cada proceso y establece:

- `state = 'ready'`
- `progress = 0`
- `total = description.length`
- `output = ''`
- `executions = 0`
- `arrivalTime = (arrivalTime de entrada o 0) * delay`
- `burst = description.length * delay`
- `finishTime = null`
- `turnaround = null`

El reloj virtual `clock` comienza en cero. Los PID se agregan a `pending` ordenados por tiempo de llegada. Después, `admit()` mueve a `queue` todos los procesos cuya llegada sea menor o igual al reloj actual. Por lo tanto, los procesos con llegada cero comienzan listos desde el principio.

## Ejecución paso a paso

### 1. Inicio

Al recibir `round-robin:start`, `index.ts`:

1. Comprueba que `quantum` sea un entero positivo, que `delay` sea finito y no negativo, y que exista al menos un proceso.
2. Reinicia un servicio anterior, si lo hay.
3. Obtiene la ventana Electron asociada al emisor IPC.
4. Construye un nuevo `RoundRobinService` con la ventana, la configuración y la lista de procesos.
5. Llama a `start()`.

El servicio solo permite `start()` desde el estado `idle`. Al iniciarse, borra y vuelve a crear el directorio de resultados, crea un worker por proceso, cambia el estado global a `running`, emite una actualización y comienza el ciclo de ejecución en segundo plano.

### 2. Admisión por llegada

Antes de cada turno, el ciclo comprueba que haya procesos listos:

- Si `queue` no está vacía, toma el proceso del principio.
- Si `queue` está vacía pero quedan procesos pendientes, avanza `clock` directamente al tiempo de llegada del siguiente proceso y llama a `admit()`.

El servicio no simula espera de CPU mientras no haya procesos listos: salta el reloj virtual hasta la próxima llegada.

### 3. Selección y tamaño del turno

El PID seleccionado se quita del principio de la cola y el proceso pasa a `running`. `executions` aumenta en uno.

Se calcula el trabajo del turno con el progreso actual:

```text
remaining = total - progress

si preemption === 1:
    chars = remaining
si no:
    chars = min(quantum, remaining)
```

En consecuencia, aunque la clase se llama Round Robin, los procesos con `preemption === 1` no son limitados por el quantum: procesan todo lo que les falta en ese turno. Para obtener turnos limitados por quantum, el proceso debe tener otro valor (`0`). La interpretación exacta puede resultar contraintuitiva y conviene confirmarla con el significado que se desea dar a ese campo.

### 4. Trabajo del worker

Cada worker recibe al crearse:

```ts
{
  pid: number
  description: string
  filePath: string
}
```

`filePath` apunta a `<userData>/round-robin/<pid>.txt`. El worker crea o trunca este archivo al inicializarse.

Para cada turno, el servicio envía al worker:

```ts
{ type: 'turn', quantum: chars }
```

Aquí el valor llamado `quantum` en el mensaje es el tamaño efectivo calculado para ese turno; puede ser el quantum configurado o todo el trabajo restante, según `preemption`.

El worker calcula el fragmento desde la posición actual hasta el final permitido, lo agrega al archivo y actualiza su contador local de progreso. Responde al proceso principal con:

```ts
{
  pid: number
  progress: number
  chunk: string
  finished: boolean
}
```

`finished` es verdadero cuando el progreso alcanza la longitud de `description`.

### 5. Actualización y duración visible

Al recibir la respuesta del worker, el servicio actualiza `progress` y concatena `chunk` a `output`. El proceso permanece visualmente en `running` mientras espera:

```text
duración visible del turno = longitud(chunk) * delay milisegundos
```

La escritura del worker sucede antes de esta espera; el retraso es una pausa del proceso principal para controlar la velocidad de la simulación, no una demora por carácter dentro del worker.

Al acabar esa espera, el reloj virtual aumenta por la misma duración. El servicio admite cualquier proceso cuya llegada ya se haya alcanzado, marca el proceso actual como `finished` o `ready` y, si aún tiene trabajo, lo agrega al final de la cola. Entre turnos espera además `150 ms`, independientemente del valor de `delay`.

### 6. Fin

El ciclo termina cuando no hay procesos en la cola ni pendientes. Si el estado sigue siendo `running`, el servicio cambia el estado global a `finished`, termina los workers y emite la última actualización.

## Datos que salen

### Actualizaciones a la interfaz

El canal `round-robin:update` envía un objeto con esta forma:

```ts
{
  processes: RoundRobinProcess[]
  status: 'idle' | 'running' | 'paused' | 'finished'
}
```

El arreglo contiene el estado más reciente de cada proceso, incluyendo progreso, salida, ejecuciones, llegada, burst y tiempos de finalización/retorno. Se emite una actualización al iniciar, al cambiar estado o progreso, al pausar/reanudar/reiniciar y al finalizar.

### Archivos

La salida procesada de cada worker se agrega en:

```text
app.getPath('userData')/round-robin/<pid>.txt
```

Al iniciar una simulación, el servicio elimina recursivamente el directorio `round-robin` y lo crea de nuevo. Un `reset()` también elimina ese directorio.

## Controles IPC implementados

| Canal | Acción | Efecto |
|---|---|---|
| `round-robin:start` | Iniciar | Valida configuración básica, reemplaza el servicio actual y comienza una simulación nueva. |
| `round-robin:pause` | Pausar | Cambia el estado global a `paused` si estaba `running` y emite el estado. |
| `round-robin:resume` | Reanudar | Cambia el estado global a `running` si estaba `paused`; si no hay un ciclo activo, inicia uno. |
| `round-robin:reset` | Reiniciar | Invalida el ciclo actual, pone el estado en `idle`, termina workers, elimina archivos y reinicializa procesos. |

Al cerrar todas las ventanas, `index.ts` llama a `reset()` para intentar limpiar los workers y archivos.

## Límites y comportamientos a tener en cuenta

- La validación IPC solo comprueba quantum, delay y que la lista tenga elementos. No valida completamente los campos de cada proceso, IDs duplicados, valores de llegada, ni que `description` sea una cadena.
- Se presupone que cada PID es único. Los workers se almacenan en un `Map` por PID y los archivos también se nombran por PID; los PID repetidos pueden sobrescribir o asociar incorrectamente el worker.
- `ProcessStatus` también declara `waiting`, pero el servicio actual no asigna ese estado. Los procesos aún no admitidos permanecen en `pending`; no se incluyen como procesos `waiting` explícitamente.
- `preemption === 1` procesa todo el resto del proceso en un solo turno, por lo que deja de comportarse como Round Robin para ese proceso.
- `delay = 0` es válido: los tiempos calculados y la espera por caracteres son cero; aún se mantiene la pausa fija de `150 ms` entre turnos.
- `arrivalTime` se multiplica por `delay`, de modo que no se interpreta directamente como milisegundos absolutos. Además, con `delay = 0`, todas las llegadas convertidas quedan en cero.
- `burst` se calcula, pero actualmente no interviene en la planificación.
- Una pausa no interrumpe inmediatamente un turno que ya está esperando al worker o el retraso visual. El turno actual puede terminar antes de que el ciclo se detenga.
- `reset()` incrementa una generación para invalidar el ciclo, pero `runTurn()` no escucha el evento `exit` del worker ni cancela explícitamente su promesa. Si el worker se termina mientras esa promesa espera un mensaje, la ejecución vieja podría quedarse esperando.
- Los errores del worker se rechazan desde `runTurn()`, pero el ciclo no tiene una captura local que los convierta en un estado de error para la UI. No hay estado global `error` definido.
- El servicio actualiza el progreso de la UI por fragmento/turno, no carácter por carácter. El worker escribe el fragmento completo de forma síncrona.
- `output` refleja el texto procesado acumulado en memoria y el archivo contiene los fragmentos agregados por el worker; el estado enviado al renderer es independiente del contenido que la UI decida mostrar.
- Como el progreso cuenta unidades UTF-16, un quantum puede dividir un par sustituto Unicode entre dos fragmentos; conviene contar puntos de código o grafemas si se espera procesar texto Unicode arbitrario.

## Ejemplo de planificación

Supóngase `quantum = 2`, `delay = 100 ms`, tres procesos con `preemption = 0`, todos con llegada cero:

| Proceso | Descripción | Trabajo total |
|---|---|---:|
| P1 | `ABCDE` | 5 |
| P2 | `XYZ` | 3 |
| P3 | `12` | 2 |

La cola comienza como `[P1, P2, P3]`. Ignorando el intervalo visual fijo de `150 ms` entre turnos, la secuencia es:

| Turno | Proceso | Fragmento | Reloj virtual al terminar | Cola después del turno |
|---:|---|---|---:|---|
| 1 | P1 | `AB` | 200 ms | `[P2, P3, P1]` |
| 2 | P2 | `XY` | 400 ms | `[P3, P1, P2]` |
| 3 | P3 | `12` | 600 ms | `[P1, P2]` |
| 4 | P1 | `CD` | 800 ms | `[P2, P1]` |
| 5 | P2 | `Z` | 900 ms | `[P1]` |
| 6 | P1 | `E` | 1000 ms | `[]` |

Al final, P1, P2 y P3 tienen `state = 'finished'`, `progress = total` y `output` igual a su descripción. `finishTime` es, respectivamente, 1000, 900 y 600 ms; como sus llegadas son cero, sus valores `turnaround` coinciden con esos tiempos. El tiempo real transcurrido en la aplicación también incluye el retraso fijo de `150 ms` entre turnos y el overhead de workers/UI; ese intervalo fijo no se suma a `clock`.
