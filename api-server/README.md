# API de procesos (`api-server`)

API desarrollada con Python y FastAPI que consulta procesos activos del sistema
operativo y permite guardar y administrar catálogos de procesos en SQLite.

## Requisitos

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

## Instalación y ejecución

```powershell
cd api-server
uv sync
uv run uvicorn api_server.main:app --reload
```

El servidor estará disponible en <http://127.0.0.1:8000>. La opción `--reload`
lo reinicia cuando detecta cambios; puedes quitarla para ejecutarlo sin recarga
automática. Las dependencias están definidas en
[`pyproject.toml`](pyproject.toml) y sus versiones resueltas en `uv.lock`.

Ejecuta la consola **como administrador** para que la API pueda leer también los
procesos propiedad de otras cuentas, como los servicios del sistema. Sin
privilegios, `GET /process/` los descarta.

FastAPI genera documentación interactiva automáticamente:

- Swagger UI: <http://127.0.0.1:8000/docs>
- ReDoc: <http://127.0.0.1:8000/redoc>

---

## Endpoints de procesos

| Método | Ruta        | Descripción                               |
| ------ | ----------- | ----------------------------------------- |
| `GET`  | `/`         | Devuelve el mensaje `Hi Mom!`.            |
| `GET`  | `/process/` | Devuelve información de procesos activos. |

El endpoint de procesos acepta el parámetro opcional `limit`, que determina el
número máximo de procesos a devolver. Su valor predeterminado es `10` y acepta
valores entre `1` y `500`. Se pide desde la URL, sin tocar código:

```text
http://127.0.0.1:8000/process/?limit=50
```

Un valor fuera del rango devuelve `422`.

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
predeterminada.

`preemption` sigue la convención `0 = expulsivo` y `1 = no expulsivo`, y se
calcula a partir de la cuenta propietaria del proceso: si el usuario contiene
`system` (por ejemplo `NT AUTHORITY\SYSTEM`) el proceso es del sistema y se marca
como `1`; en cualquier otro caso se marca como `0`.

---

## Endpoints de catálogos

Permiten guardar conjuntos de procesos y administrarlos. Un catálogo tiene un
nombre elegido por el usuario y los procesos que le pertenecen.

| Método | Ruta | DTO de entrada | DTO de salida | Código |
| --- | --- | --- | --- | --- |
| `POST` | `/catalogs/` | `CatalogCreate` | `CatalogDetail` | `201` |
| `GET` | `/catalogs/` | — | `list[CatalogSummary]` | `200` |
| `GET` | `/catalogs/{catalog_id}/` | — | `CatalogDetail` | `200` |
| `DELETE` | `/catalogs/{catalog_id}/` | — | `CatalogDetail` | `200` |
| `DELETE` | `/catalogs/{catalog_id}/processes/{pid}/` | — | `ProcessResponse` | `200` |

Los catálogos se identifican por su `id`, no por su nombre. El nombre es único y
sirve como etiqueta.

## Filtrado y ordenamiento por CPU/RAM

`GET /process/` permite filtrar y ordenar los procesos por consumo de CPU o
memoria. Todos los parámetros son opcionales:

| Parámetro | Valores | Predeterminado | Descripción |
| --- | --- | --- | --- |
| `limit` | De `1` a `500` | `10` | Cantidad máxima de procesos devueltos. |
| `sort_by` | `cpu` o `memory` | Sin ordenar | Campo usado para ordenar. `memory` corresponde a `memory_mb`. |
| `order` | `asc` o `desc` | `desc` | Dirección del orden, aplicada cuando se especifica `sort_by`. |
| `min_cpu` | De `0` a `100` | Sin mínimo | Porcentaje mínimo de CPU; incluye procesos con ese valor o superior. |
| `min_memory_mb` | Mayor o igual a `0` | Sin mínimo | Memoria mínima en MB; incluye procesos con ese valor o superior. |

Ejemplos:


http://127.0.0.1:8000/process/?sort_by=cpu&order=desc&limit=10
http://127.0.0.1:8000/process/?sort_by=memory&order=desc&min_memory_mb=100&limit=20
http://127.0.0.1:8000/process/?min_cpu=5&min_memory_mb=50


Los filtros se aplican antes del ordenamiento y del límite. Los procesos sin
una medición de memoria no coinciden con `min_memory_mb`; al ordenar por
memoria, esos valores quedan al final. Si no se envía `sort_by`, no se aplica
ordenamiento. `total` indica cuántos procesos se devolvieron tras aplicar los
filtros y `limit`. Los valores fuera de los rangos permitidos devuelven `422`.

### Los DTO

Un DTO (*Data Transfer Object*) es la forma que tiene la información de entrar y
salir por la API. Son distintos de las tablas de la base de datos: las tablas
definen cómo se guarda el dato, los DTOs definen qué ve el cliente. Por eso los
DTOs de entrada y de salida están separados.

Los DTOs de entrada heredan de `BaseModel` de Pydantic y llevan reglas de
validación. Los de salida solo declaran los campos.

### DTOs de entrada

`ProcessCreate`, dentro de `CatalogCreate.processes`:

| Campo | Tipo | Regla |
| --- | --- | --- |
| `pid` | `int` | obligatorio |
| `name` | `str` | de 1 a 120 caracteres |
| `user` | `str` | de 1 a 120 caracteres |
| `description` | `str` | mínimo 1 carácter |
| `preemption` | `int` | solo `0` o `1` |
| `cpu` | `float` | obligatorio |
| `memory_mb` | `float \| null` | opcional |

`CatalogCreate`, el cuerpo del `POST`:

| Campo | Tipo | Regla |
| --- | --- | --- |
| `name` | `str` | de 1 a 100 caracteres |
| `processes` | `list[ProcessCreate]` | opcional, por defecto lista vacía |

Como `processes` es opcional, se puede crear un catálogo sin procesos.

### DTOs de salida

`ProcessResponse`: igual que `ProcessCreate` más los dos campos que solo existen
ya guardado en la base de datos.

| Campo | Tipo | Nota |
| --- | --- | --- |
| `id` | `int` | identificador interno de la fila |
| `catalog_id` | `int` | catálogo al que pertenece |
| `pid` | `int` | |
| `name` | `str` | |
| `user` | `str` | |
| `description` | `str` | |
| `preemption` | `int` | `0` expulsivo, `1` no expulsivo |
| `cpu` | `float` | |
| `memory_mb` | `float \| null` | |

`CatalogSummary`, el listado:

| Campo | Tipo |
| --- | --- |
| `id` | `int` |
| `name` | `str` |
| `process_count` | `int` |

No incluye los procesos: el listado solo los cuenta.

`CatalogDetail`, el catálogo con sus procesos:

| Campo | Tipo |
| --- | --- |
| `id` | `int` |
| `name` | `str` |
| `created_at` | `datetime` |
| `processes` | `list[ProcessResponse]` |

El `POST` y el `GET` por id devuelven esta misma forma, para que el cliente no
necesite un tipo distinto para el mismo concepto.

### Formas del JSON

#### `POST /catalogs/`

Entrada:

```json
{
  "name": "catalogo_prueba",
  "processes": [
    {
      "pid": 100,
      "name": "Code.exe",
      "user": "ADMIN",
      "description": "Editor de código",
      "preemption": 0,
      "cpu": 1.5,
      "memory_mb": 120.5
    }
  ]
}
```

Un catálogo sin procesos:

```json
{ "name": "vacio" }
```

Salida (`201`):

```json
{
  "id": 1,
  "name": "catalogo_prueba",
  "created_at": "2026-10-17T20:07:15.250504",
  "processes": [
    {
      "id": 1,
      "catalog_id": 1,
      "pid": 100,
      "name": "Code.exe",
      "user": "ADMIN",
      "description": "Editor de código",
      "preemption": 0,
      "cpu": 1.5,
      "memory_mb": 120.5
    }
  ]
}
```

Si no se mandaron procesos, `processes` viene como lista vacía.

#### `GET /catalogs/`

Salida (`200`): una lista con el nombre y la cantidad de procesos de cada
catálogo.

```json
[
  { "id": 1, "name": "catalogo_prueba", "process_count": 3 },
  { "id": 2, "name": "vacio", "process_count": 0 }
]
```

Un catálogo sin procesos aparece con `process_count` en `0`.

#### `GET /catalogs/{catalog_id}/`

Salida (`200`): la misma forma de `CatalogDetail` que devuelve el `POST`.

```json
{
  "id": 1,
  "name": "catalogo_prueba",
  "created_at": "2026-10-17T20:07:15.250504",
  "processes": [ /* ... */ ]
}
```

#### `DELETE /catalogs/{catalog_id}/`

Salida (`200`): el catálogo que se borró, con sus procesos.

```json
{
  "id": 1,
  "name": "catalogo_prueba",
  "created_at": "2026-10-17T20:07:15.250504",
  "processes": [ /* ... */ ]
}
```

Borrar el catálogo borra también sus procesos. Ambos `DELETE` devuelven el objeto
eliminado para que el cliente pueda confirmar qué se quitó.

#### `DELETE /catalogs/{catalog_id}/processes/{pid}/`

Salida (`200`): el proceso borrado, en forma `ProcessResponse`.

```json
{
  "id": 3,
  "catalog_id": 1,
  "pid": 100,
  "name": "Code.exe",
  "user": "ADMIN",
  "description": "Editor de código",
  "preemption": 0,
  "cpu": 1.5,
  "memory_mb": 120.5
}
```

El mismo `pid` puede estar en distintos catálogos: la búsqueda del borrado
incluye el `catalog_id`, así que cada catálogo es independiente.

### Errores

| Código | Cuándo | Cuerpo |
| --- | --- | --- |
| `409 Conflict` | El nombre del catálogo ya existe | `{ "detail": "El catálogo 'X' ya existe" }` |
| `404 Not Found` | No existe el catálogo con ese id | `{ "detail": "El catálogo con id 999 no existe" }` |
| `404 Not Found` | No existe ese pid dentro del catálogo | `{ "detail": "El proceso con pid 100 no existe en el catálogo con id 1" }` |
| `422 Unprocessable Entity` | El JSON no cumple las reglas del DTO | detalle de Pydantic |

El `422` lo genera Pydantic automáticamente, sin código propio: por ejemplo,
mandar `preemption` con un valor distinto de `0` o `1` lo rechaza.

---

## Persistencia (ORM y base de datos)

La persistencia usa [SQLAlchemy](https://www.sqlalchemy.org/) 2.0 sobre un
archivo SQLite local. No hay servidor de base de datos: el archivo se crea solo
en el primer arranque y queda en `data/processes.db`, ruta que está en
`.gitignore` porque es un dato generado, no código.

El esquema se crea automáticamente con `create_all` al iniciar el servidor (en el
`lifespan` de FastAPI), sin necesidad de migraciones manuales.

### Estructura del paquete de datos

```text
src/api_server/models/
├── database.py        engine, SessionLocal, get_db, init_db
├── catalog_model.py   Catalog (tabla catalogs) y el enum Preemption
├── process_model.py   Process (tabla processes)
├── api_models.py      valida el query param limit de /process/
└── dtos/
    ├── catalog_dtos.py    CatalogCreate, CatalogSummary, CatalogDetail
    └── process_dtos.py    ProcessCreate, ProcessResponse
```

### Esquema

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
| | `description` | `TEXT` | Descripción del proceso. Su longitud en caracteres se usa para calcular la ráfaga (`TR = TH * caracteres`). |
| | `preemption` | `INTEGER` | `0` expulsivo, `1` no expulsivo. `CHECK (preemption IN (0, 1))`. |
| | `cpu` | `FLOAT` | Porcentaje de CPU en el momento del catálogo. |
| | `memory_mb` | `FLOAT` | Memoria en megabytes. |

