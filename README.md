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

Desde la carpeta raíz del repositorio, entra en `api-server` e instala sus dependencias:

```bash
cd api-server
bun install
```

Las dependencias están definidas en `api-server/package.json`.

## Comandos disponibles

El servidor define el siguiente comando en `api-server/package.json`:

| Comando         | Descripción             |
| --------------- | ----------------------- |
| `bun run start` | Inicia el servidor API. |

Para iniciar el servidor, ejecuta desde `api-server` (la misma carpeta donde instalaste las dependencias):

```bash
bun run start
```

El comando ejecuta `bun run index.ts` y el servidor queda escuchando en el puerto `3000`. Actualmente no hay comandos de prueba o compilación definidos.

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
