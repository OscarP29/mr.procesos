# Proyecto de software

Este repositorio contiene un servidor API desarrollado en Python con
[FastAPI](https://fastapi.tiangolo.com/). La API muestra información de los
procesos que se están ejecutando en el equipo.

## Requisitos

- Windows.
- [Python](https://www.python.org/downloads/) 3.12 o posterior.
- [uv](https://docs.astral.sh/uv/getting-started/installation/) para gestionar
  el entorno virtual y las dependencias.

El servidor utiliza `pywin32` para leer la descripción de los archivos de los
procesos, por lo que actualmente está preparado para ejecutarse en Windows.

Comprueba que las herramientas están disponibles:

```powershell
python --version
uv --version
```

## Instalación

Desde la raíz del repositorio, entra en el proyecto del servidor e instala sus
dependencias:

```powershell
cd api-server
uv sync
```

Las dependencias y los metadatos del proyecto están definidos en
[`api-server/pyproject.toml`](api-server/pyproject.toml), y sus versiones
resueltas se registran en `api-server/uv.lock`.

## Iniciar el servidor

Desde la carpeta `api-server`, ejecuta:

```powershell
uv run uvicorn api_server.main:app --reload
```

El servidor estará disponible en <http://127.0.0.1:8000>. La opción `--reload`
reinicia el servidor cuando detecta cambios en el código; puedes quitarla para
ejecutarlo sin recarga automática.

FastAPI genera documentación interactiva automáticamente:

- Swagger UI: <http://127.0.0.1:8000/docs>
- ReDoc: <http://127.0.0.1:8000/redoc>

## Endpoints

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
      "nombre": "nombre-del-proceso",
      "descripcion": "Descripción del proceso",
      "usuario": "usuario",
      "cpu": 0,
      "mem": 0,
      "prioridad": "Unknown"
    }
  ]
}
```

Los valores dependen de los procesos activos en el equipo. `total` indica
cuántos elementos se han incluido en `processList`, no necesariamente el total
de procesos del sistema. La descripción se obtiene de los metadatos del archivo
cuando están disponibles; en caso contrario, se genera una descripción
predeterminada.
