# Proyecto de software

Este repositorio contiene dos proyectos:

- **`api-server`**: API desarrollada con Python y FastAPI que consulta procesos
  activos y devuelve datos como PID, nombre, descripción, usuario, CPU y memoria.
  Persiste los catálogos de procesos en SQLite mediante SQLAlchemy.
- **`desktop-app`**: aplicación de escritorio desarrollada con Electron, React
  y TypeScript. Incluye vistas para procesos y una simulación visual de procesos.
  La interfaz todavía no está conectada a la API; utiliza datos de ejemplo.

## Estructura

```text
api-server/   API FastAPI y lógica para consultar procesos
desktop-app/  Aplicación de escritorio Electron y React
```

## API (`api-server`)

### Requisitos

- Windows. El servidor utiliza `pywin32` para leer la descripción de los
  archivos de los procesos.
- [Python](https://www.python.org/downloads/) 3.12 o posterior.
- [uv](https://docs.astral.sh/uv/getting-started/installation/) para gestionar
  el entorno virtual y las dependencias.

Comprueba que las herramientas están disponibles:

```powershell
python --version
uv --version
```

### Instalación y ejecución

Desde la raíz del repositorio:

```powershell
cd api-server
uv sync
uv run uvicorn api_server.main:app --reload
```

El servidor estará disponible en <http://127.0.0.1:8000>. La opción `--reload`
lo reinicia cuando detecta cambios; puedes quitarla para ejecutarlo sin recarga
automática. Las dependencias están definidas en
[`api-server/pyproject.toml`](api-server/pyproject.toml) y sus versiones
resueltas en `api-server/uv.lock`.

Ejecuta la consola **como administrador** para que la API pueda leer también los
procesos propiedad de otras cuentas, como los servicios del sistema. Sin
privilegios, `GET /process/` los descarta.

FastAPI genera documentación interactiva automáticamente:

- Swagger UI: <http://127.0.0.1:8000/docs>
- ReDoc: <http://127.0.0.1:8000/redoc>

### Endpoints

| Método | Ruta        | Descripción                               |
| ------ | ----------- | ----------------------------------------- |
| `GET`  | `/`         | Devuelve el mensaje `Hi Mom!`.            |
| `GET`  | `/process/` | Devuelve información de procesos activos. |

El endpoint de procesos acepta el parámetro opcional `limit`, que determina el
número máximo de procesos a devolver. Su valor predeterminado es `10` y acepta
valores entre `1` y `500`.

La respuesta tiene esta estructura:

```json
{
  "total": 1,
  "processList": [
    {
      "pid": 123,
      "name": "process-name",
      "description": "Descripción del proceso",
      "user": "usuario",
      "cpu": 0,
      "memory_mb": 0,
      "preemption": 1
    }
  ]
}
```

Los valores dependen de los procesos activos en el equipo. `total` indica
cuántos elementos se han incluido en `processList`, no necesariamente el total
de procesos del sistema. La descripción se obtiene de los metadatos del archivo
cuando están disponibles; en caso contrario, se genera una descripción
predeterminada. `preemption` sigue la convención `0 = expulsivo` y
`1 = no expulsivo`, y se calcula a partir de la cuenta propietaria del proceso:
si el usuario contiene `system` (por ejemplo `NT AUTHORITY\SYSTEM`) el proceso
es del sistema y se marca como `1`; en cualquier otro caso se marca como `0`.

### Persistencia (ORM y base de datos)

La persistencia usa [SQLAlchemy](https://www.sqlalchemy.org/) 2.0 sobre un
archivo SQLite local. No hay servidor de base de datos: el archivo se crea solo
en el primer arranque y queda en `api-server/data/processes.db`, ruta que está
en `.gitignore` porque es un dato generado, no código.

El esquema se crea automáticamente con `create_all` al iniciar el servidor (en el
`lifespan` de FastAPI), sin necesidad de migraciones manuales.

#### Estructura del paquete de datos

```text
api-server/src/api_server/models/
├── database.py        engine, SessionLocal, get_db, init_db
├── catalog_model.py   Catalog (tabla catalogs) y el enum Preemption
├── process_model.py   Process (tabla processes)
└── api_models.py      modelos de entrada/salida HTTP (valida el query param limit)
```

#### Esquema

| Tabla | Columna | Tipo | Descripción |
| --- | --- | --- | --- |
| `catalogs` | `id` | `INTEGER` PK AI | Identificador interno del catálogo. |
| | `name` | `VARCHAR(100)` UNIQUE | Nombre que define el usuario. No se repiten. |
| | `created_at` | `DATETIME` | Fecha de creación. |
| `processes` | `id` | `INTEGER` PK AI | Identificador interno de la fila. No es el PID. |
| | `catalog_id` | `INTEGER` FK | Catálogo al que pertenece. `ON DELETE CASCADE`: al borrar el catálogo se borran sus procesos. |
| | `pid` | `INTEGER` | PID real del proceso en el sistema operativo. |
| | `name` | `VARCHAR(120)` | Nombre del proceso. |
| | `user` | `VARCHAR(120)` | Cuenta propietaria del proceso. |
| | `description` | `TEXT` | Descripción del proceso. |
| | `preemption` | `INTEGER` | `0` expulsivo, `1` no expulsivo. |
| | `cpu` | `FLOAT` | Porcentaje de CPU en el momento del catálogo. |
| | `memory_mb` | `FLOAT` | Memoria en megabytes. |

## Aplicación de escritorio (`desktop-app`)

### Tecnologías y estado actual

El frontend de escritorio está construido con:

- [Electron](https://www.electronjs.org/) y
  [electron-vite](https://electron-vite.org/) para la aplicación y su flujo de
  desarrollo.
- [React](https://react.dev/) y TypeScript para la interfaz.
- [HeroUI](https://www.heroui.com/) (`@heroui/react` y `@heroui/styles`) para
  los componentes de interfaz.
- [Tailwind CSS](https://tailwindcss.com/) para personalizar los componentes
  con clases de utilidad.
- [lucide-react](https://lucide.dev/) para iconos.

HeroUI proporciona los componentes de interfaz —pestañas, campos de entrada,
selectores, botones, tooltips, tablas y modales—. Sus estilos base se cargan
desde `@heroui/styles` en `global.css`, y Tailwind CSS se utiliza para adaptar
la distribución y apariencia.

La aplicación incluye los procesos principales de Electron (`main`, `preload`
y `renderer`) y tres secciones de navegación:

- **Procesos**: vista tabular con PID, nombre, descripción, usuario, CPU,
  memoria y prioridad; incluye controles de búsqueda y guardado como parte del
  prototipo.
- **Simulación**: esquema visual con procesos en las colas de listos,
  ejecución, espera y terminados, además de controles de reproducción.
- **Configuración**: sección inicial pendiente de implementar.

La vista de procesos y la selección de categorías de la simulación siguen usando
datos de ejemplo; el frontend todavía no consume la API. La simulación ya cuenta
con una implementación de Round Robin en el proceso principal y sus controles
permiten iniciar, pausar, reanudar y reiniciar la ejecución.

#### Simulación Round Robin

La simulación recibe una lista de procesos, un quantum y una velocidad en
milisegundos. Los procesos avanzan por turnos y los que no han terminado vuelven
al final de la cola. El proceso principal administra la planificación y los
workers procesan el trabajo de cada turno; el estado actualizado se envía a la
interfaz de escritorio.

La implementación actual también contempla tiempos de llegada y el campo
`preemption` de los procesos. Los datos y categorías todavía son de ejemplo, y
la integración con la API está pendiente. Para conocer en detalle los datos de
entrada y salida, el flujo del algoritmo, el uso de workers, los archivos
generados y las limitaciones actuales, consulta
[la documentación detallada del algoritmo](desktop-app/src/main/round-robin.md).

#### Vista de procesos

![Vista de procesos de la aplicación de escritorio](desktop-app/src/renderer/src/assets/image-3.png)

#### Vista de simulación

![Vista de simulación de procesos](desktop-app/src/renderer/src/assets/image-4.png)

#### Historial de diseños

Estas capturas corresponden a versiones anteriores de la interfaz y se
conservan como referencia de su evolución.

![Diseño anterior de la aplicación de escritorio](desktop-app/src/renderer/src/assets/image-1.png)

![Diseño previo de la aplicación de escritorio](desktop-app/src/renderer/src/assets/image-2.png)

### Requisitos

- [Bun](https://bun.sh/) para instalar las dependencias usando el archivo
  `bun.lock`.

Electron incluye su propio runtime de Node.js, así que no hace falta instalar
Node.js por separado para ejecutar los comandos documentados aquí. Comprueba que
Bun está disponible:

```powershell
bun --version
```

### Instalación y modo desarrollo

Desde la raíz del repositorio:

```powershell
cd desktop-app
bun install
bun run dev
```

`bun run dev` inicia la aplicación de escritorio con recarga de desarrollo.
Para volver a iniciarla después, ejecuta el comando desde la carpeta
`desktop-app`.

### Comprobaciones y compilación

Los scripts disponibles permiten comprobar los tipos y generar la compilación:

```powershell
bun run typecheck
bun run build
```

`build` ejecuta primero la comprobación de TypeScript y luego compila la
aplicación. También hay comandos de empaquetado en
`desktop-app/package.json`, como `build:win`, `build:mac` y `build:linux`.

### Alias de importación

En el renderer se puede importar desde `src/renderer/src` usando el alias `@/`.
Por ejemplo:

```tsx
import MiComponente from "@/components/MiComponente";
```
