# Proyecto de software

Este repositorio contiene un servidor API desarrollado con [Bun](https://bun.sh/) y [Elysia](https://elysiajs.com/). La API permite consultar procesos del sistema.

## Requisitos

- [Bun](https://bun.sh/) instalado.
- Un sistema operativo compatible con la dependencia `systeminformation`.

Comprueba que Bun está instalado ejecutando:

```bash
bun --version
```

## Instalación

Desde la carpeta raíz del repositorio, instala las dependencias del servidor:

```bash
bun run install:api
```

Este comando ejecuta `bun install --cwd api-server` e instala las dependencias definidas en `api-server/package.json`.

## Comandos disponibles

Los comandos están definidos en el `package.json` de la raíz:

| Comando               | Descripción                                              |
| --------------------- | -------------------------------------------------------- |
| `bun run install:api` | Instala las dependencias de `api-server`.                |
| `bun run start:api`   | Inicia el servidor API usando el workspace `api-server`. |

Para iniciar el servidor, ejecuta desde la raíz:

```bash
bun run start:api
```

El servidor queda escuchando en el puerto `3000`. También puedes iniciarlo desde `api-server` con:

```bash
bun run start
```

Este último comando ejecuta `bun run index.ts`. Actualmente no hay comandos de prueba o compilación definidos en los `package.json`.

## Uso de la API

Con el servidor en ejecución, puedes consultar:

- `GET http://localhost:3000/` — responde `Hello Mom!`.
- `GET http://localhost:3000/process/` — devuelve los procesos del sistema.
- `GET http://localhost:3000/process/?limit=20` — limita la respuesta a 20 procesos.

El parámetro `limit` es opcional, debe ser un número entre `1` y `500`, y por defecto se consultan 10 procesos.
La respuesta del endpoint de procesos tiene esta estructura:

```json
{
  "total": 1,
  "processList": [
    {
      "pid": 123,
      "nombre": "nombre-del-proceso",
      "usuario": "usuario",
      "cpu": 0,
      "mem": 0,
      "prioridad": "Unknown"
    }
  ]
}
```

Los valores concretos dependen de los procesos activos en el equipo donde se ejecuta el servidor. `total` indica cuántos elementos se devuelven, no necesariamente el total de procesos del sistema.

> **Nota:** la API expone nombres de procesos y usuarios del equipo. Úsala solo en un entorno de confianza y no la publiques en una red sin añadir autenticación y controles de acceso.
