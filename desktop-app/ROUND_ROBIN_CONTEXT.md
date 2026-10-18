# Contexto del simulador Round Robin

## Objetivo

Implementar en `desktop-app` una simulación del algoritmo de planificación Round Robin. La simulación debe recibir una lista de procesos, un quantum y una velocidad expresada en milisegundos; mostrar los procesos conforme avanzan y ofrecer controles para iniciar, pausar y reiniciar.

## Lo que ya existe

### Modelo de procesos y configuración

- Hay tipos compartidos en el proceso principal y en el renderer para describir un proceso Round Robin: PID, nombre, descripción, usuario, prioridad, estado, progreso, total y salida.
- Los estados definidos son `ready`, `running`, `finished` y `waiting`.
- También está definido el tipo de configuración con `quantum` y `delay` (la velocidad entre turnos).
- Los tipos están duplicados en `src/main/types-round-robin.ts` y `src/renderer/src/types/types-round-robin.ts`; todavía no hay un contrato compartido único entre ambos lados.

### Lógica de simulación en el proceso principal

En `src/main/service/round-robin-service.ts` existe una clase `RoundRobinService` que:

1. Recibe una ventana de Electron y una configuración al construirse.
2. Inicializa los procesos con estado `ready`, progreso cero y el total basado en la longitud de su descripción.
3. Crea un worker por proceso y prepara una carpeta `round-robin` dentro de `app.getPath('userData')`.
4. Recorre una cola de procesos, ejecutando cada uno por turnos y volviendo a encolar los que no hayan terminado.
5. Emite actualizaciones `round-robin:update` para reflejar cambios de estado y progreso.
6. Finaliza los workers cuando termina el ciclo o se produce un error.

El turno delega en el worker el avance de hasta `quantum` caracteres. Después de cada turno, el servicio espera `delay` milisegundos antes de continuar.

### Worker

`src/main/workers/process-workers.ts` implementa la ejecución de un turno:

- Recibe el PID, la descripción y la ruta del archivo de salida.
- Escribe los caracteres procesados en un archivo `<pid>.txt` en la carpeta de datos de la aplicación.
- Al procesar cada carácter, informa el nuevo progreso y el carácter generado.
- Al terminar el quantum, informa que el turno se completó y si el proceso acabó.

### Puente entre Electron y React

- `src/preload/index.ts` expone `window.api.roundRobin.start(...)` y una suscripción `onUpdate(...)`.
- `src/preload/index.d.ts` define los tipos que usa el renderer para esas operaciones.
- `src/renderer/src/hook/use-round-robin.tsx` escucha las actualizaciones y ofrece `processes`, `isRunning` y `start(...)`.

### Interfaz empezada

- La página `src/renderer/src/pages/simulador.tsx` muestra controles para seleccionar una categoría, especificar velocidad, cargar y desplegar los controles de simulación.
- `src/renderer/src/components/controls.tsx` ya presenta botones de reproducción y reinicio.
- `src/renderer/src/components/schema-simulator.tsx` propone las secciones visuales de listos, ejecución, espera y terminados.

## Lo que falta

### 1. Conectar la simulación a Electron

- Registrar en `src/main/index.ts` el manejador IPC `round-robin:start`.
- Crear e integrar `RoundRobinService` desde el proceso principal, pasando la ventana y la configuración activa.
- Definir cómo se entregan `quantum` y `delay` desde el renderer: actualmente `start` solo recibe la lista de procesos, aunque el servicio necesita ambos valores en su configuración.
- Propagar errores del proceso principal de forma que el renderer pueda mostrarlos; hoy el hook solo restablece `isRunning` en un bloque `finally`.
- Revisar la ruta del worker: el servicio busca `../workers/process.worker.js`, mientras que el archivo fuente del worker se llama `process-workers.ts`. Confirmar la ruta/nombre que genera electron-vite en desarrollo y en el build, y ajustarlos para que funcionen en ambos modos.

### 2. Completar las acciones del ciclo de vida

- Implementar pausa y reanudación, incluyendo un estado pausado que preserve la cola y el progreso. No existe actualmente una operación de pausa en el servicio, el preload ni el hook.
- Implementar reinicio: detener una ejecución activa, limpiar su estado y archivos de salida según el comportamiento que se defina, y dejar la simulación lista para volver a empezar.
- Evitar iniciar dos simulaciones simultáneas y definir qué ocurre si el usuario intenta iniciar, pausar o reiniciar en un estado no permitido.
- Añadir controles y estados accesibles para inicio, pausa/reanudación y reinicio. Los botones actuales no tienen callbacks ni estados deshabilitados.

### 3. Hacer configurables los parámetros

- Conectar un campo numérico de quantum y validar que sea un entero positivo.
- Conectar la velocidad en milisegundos y validar el rango permitido, incluyendo el mínimo cero si se desea permitir una simulación sin espera.
- Conectar la categoría/carga seleccionada a una lista real de procesos. El selector y sus opciones actuales son de ejemplo y el botón `Cargar` no está conectado.
- Definir el origen de los procesos: la página de procesos usa actualmente `dataExample`; no se observa una integración desde esa página hacia el simulador.

### 4. Renderizar el estado real

- Conectar `useRoundRobin()` con la página de simulación.
- Reemplazar las tarjetas repetidas y valores estáticos de `schema-simulator.tsx` por los procesos recibidos del hook.
- Distribuir los procesos por estado (`ready`, `running`, `waiting`, `finished`) y mostrar datos reales de PID, quantum/progreso y ejecuciones según lo que se quiera comunicar.
- Acordar el significado visual de `waiting`: el servicio actual no asigna ese estado; solo utiliza `ready`, `running` y `finished`.
- Mostrar el avance/salida de cada proceso y el estado global (en ejecución, pausado, finalizado o con error).

### 5. Robustecer y validar la implementación

- Validar la entrada en el límite IPC y en la lógica de simulación: quantum, velocidad, procesos repetidos por PID y descripciones vacías.
- Revisar el manejo de workers en escenarios de error, pausa, reinicio y cierre de ventana. La limpieza actual ocurre al salir de `start`; no hay una operación explícita para interrumpir el ciclo desde fuera.
- Sustituir los tipos `unknown[]` de la API del preload por los tipos Round Robin correspondientes y evitar que renderer y main mantengan contratos divergentes.
- Añadir pruebas del algoritmo para quantum, orden circular, progreso, finalización y casos límite; agregar pruebas de integración para el contrato IPC y la comunicación con los workers.
- Ejecutar el typecheck/build de `desktop-app` después de integrar el worker y los handlers IPC.

## Estado resumido

| Área | Estado observado |
|---|---|
| Tipos y estructura del proceso | Iniciados |
| Cola Round Robin y turnos por quantum | Implementación parcial en el servicio |
| Worker que procesa y escribe progreso | Implementado como archivo fuente; ruta de ejecución por verificar |
| Envío de actualizaciones main → renderer | Preparado en el servicio y el preload |
| Handler IPC para iniciar | Pendiente |
| Quantum y velocidad editables desde la UI | Pendiente |
| Selección/carga real de procesos | Pendiente |
| Visualización conectada al estado de simulación | Pendiente |
| Pausa, reanudación y reinicio | Pendiente |
| Pruebas automatizadas del algoritmo | No se encontraron en la revisión |

## Orden sugerido para continuar

1. Resolver e integrar el worker y el handler IPC de inicio con configuración y procesos explícitos.
2. Conectar la UI y el hook para poder iniciar una simulación visible con datos reales.
3. Implementar pausa/reanudación y reinicio en el servicio, el preload y los controles.
4. Añadir validaciones y pruebas del algoritmo, del ciclo de vida y del empaquetado.

## Archivos relacionados

- Lógica: `src/main/service/round-robin-service.ts`
- Worker: `src/main/workers/process-workers.ts`
- Tipos del proceso principal: `src/main/types-round-robin.ts`
- Proceso principal de Electron: `src/main/index.ts`
- API del preload: `src/preload/index.ts` y `src/preload/index.d.ts`
- Hook del renderer: `src/renderer/src/hook/use-round-robin.tsx`
- Página de simulación: `src/renderer/src/pages/simulador.tsx`
- Controles: `src/renderer/src/components/controls.tsx`
- Diagrama visual: `src/renderer/src/components/schema-simulator.tsx`
