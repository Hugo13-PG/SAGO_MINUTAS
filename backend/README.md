# SAGO API (backend)

API REST de **SAGO Minutas** construida con **Node.js + Express 5 + TypeScript**.

**Estado actual (Fase 1, WP1):** núcleo operativo disponible (`/health`, manejo global de errores con formato `{ "error": { "code", "message" } }`, CORS, documentación Swagger/OpenAPI) con pruebas automatizadas y configuración de despliegue (Docker/Render).
Los endpoints de autenticación están definidos como *stubs* y responden `501 NOT_IMPLEMENTED` hasta la implementación de WP2 (Firebase/Google Sign-In y validación real de identidad).

## Requisitos

- **Node.js** >= 20
- **npm**
- (Opcional) **Docker** para build/ejecución en contenedor

## Instalación

Desde la carpeta `backend/`:

```bash
npm install
```

## Configuración

1. Copia la plantilla de variables de entorno:

   ```powershell
   Copy-Item .env.example .env
   ```
2. Ajusta los valores en `.env` según tu entorno. **`.env` no se versiona** (está en `.gitignore`); `.env.example` sí se versiona y no debe contener secretos reales.

### Variables de entorno

| Variable                            | Descripción                                    | Nota                                                                               |
| ----------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| `NODE_ENV`                        | Entorno de ejecución                           | `development` / `production` / `test`                                        |
| `PORT`                            | Puerto HTTP del servidor                        | En local ej. `3000`. En Render lo inyecta la plataforma (no fijarlo manualmente) |
| `FIREBASE_PROJECT_ID`             | ID del proyecto Firebase (WP2)                  | Ej. `sago-minutas`                                                               |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | Credencial de servicio en base64 (WP2)          | **Secreto**: configurar fuera del repo                                       |
| `ADMIN_EMAILS`                    | Correos con rol admin, separados por coma (WP2) | Puede quedar vacío en local                                                       |
| `CORS_ORIGINS`                    | Orígenes permitidos, separados por coma        | Ej. `http://localhost:5173,http://localhost:3000`                                |

## Scripts

| Comando                | Descripción                                                     |
| ---------------------- | ---------------------------------------------------------------- |
| `npm run dev`        | Desarrollo con recarga automática (`tsx watch src/server.ts`) |
| `npm run build`      | Compila TypeScript a `dist/` (`tsc -p tsconfig.json`)        |
| `npm start`          | Ejecuta la versión compilada (`node dist/server.js`)          |
| `npm run typecheck`  | Verificación de tipos sin emitir (`tsc --noEmit`)             |
| `npm test`           | Ejecuta pruebas con Vitest (`vitest run`)                      |
| `npm run test:watch` | Ejecuta pruebas en modo watch                                    |

## Ejecución local

### Desarrollo

```bash
npm run dev
```

Por defecto la API queda disponible en `http://localhost:3000` (según `PORT`):

- `GET /health` — estado del servicio
- `GET /docs` — Swagger UI
- `GET /openapi.json` — especificación OpenAPI en JSON

### Producción local (build)

```bash
npm run build
npm start
```

## Endpoints actuales

| Método  | Ruta                    | Estado | Descripción                                       |
| -------- | ----------------------- | ------ | -------------------------------------------------- |
| `GET`  | `/health`             | ✅     | Health check; no depende de Firebase               |
| `GET`  | `/docs`               | ✅     | Documentación interactiva (Swagger UI)            |
| `GET`  | `/openapi.json`       | ✅     | Contrato OpenAPI en JSON                           |
| `POST` | `/api/v1/auth/google` | 🚧 501 | Stub: responde `NOT_IMPLEMENTED` (pendiente WP2) |
| `GET`  | `/api/v1/auth/me`     | 🚧 501 | Stub: responde `NOT_IMPLEMENTED` (pendiente WP2) |

## Contrato y documentación (OpenAPI)

- **Fuente de verdad:** `openapi.yaml` (raíz de `backend/`).
- **Swagger UI:** `GET /docs`
- **OpenAPI JSON:** `GET /openapi.json`

El servidor carga `openapi.yaml` al iniciar. En ejecución compilada/contenedor, el archivo debe estar disponible en la ruta esperada por el runtime (en Docker se copia a `/app/openapi.yaml`, al mismo nivel que `dist/`).

## Manejo de errores

Las respuestas de error siguen el formato:

```json
{
  "error": {
    "code": "CODIGO_ERROR",
    "message": "Descripción del error"
  }
}
```

Códigos contemplados en el contrato: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `INTERNAL_ERROR`, `NOT_IMPLEMENTED`, `PAYLOAD_TOO_LARGE`.

## Pruebas

```bash
npm test
```

- Framework: **Vitest** + **Supertest**.
- Las pruebas usan `createApp()` (sin abrir un puerto real ni depender de Firebase).
- Cobertura actual (WP1): `GET /health`, respuestas 404 (ruta inexistente y método no soportado), 400 por JSON mal formado, 413 por payload superior a 1 MB, comportamiento CORS (origen permitido/denegado y preflight) y stubs 501 de autenticación.

## Docker

El proyecto incluye un `Dockerfile` multi-stage:

1. **build:** instala dependencias, copia código/contrato y ejecuta `npm run build`.
2. **runtime:** instala solo dependencias de producción y copia `dist/` y `openapi.yaml`.

### Construir imagen

Desde `backend/`:

```bash
docker build -t sago-api:local .
```

### Ejecutar contenedor

Ejemplo (ajusta las variables según tu entorno; `PORT` y `CORS_ORIGINS` son requeridas por la validación de entorno):

```bash
docker run --rm -p 3000:3000 \
  -e PORT=3000 \
  -e NODE_ENV=production \
  -e CORS_ORIGINS=http://localhost:5173 \
  sago-api:local
```

En PowerShell:

```powershell
docker run --rm -p 3000:3000 `
  -e PORT=3000 `
  -e NODE_ENV=production `
  -e CORS_ORIGINS=http://localhost:5173 `
  sago-api:local
```

Verificación rápida:

- `GET http://localhost:3000/health`
- `GET http://localhost:3000/openapi.json`
- `GET http://localhost:3000/docs`

## Despliegue (Render)

- `render.yaml` define un servicio **web** con `runtime: docker`, `plan: free` y `healthCheckPath: /health`.
- **`PORT`:** lo proporciona Render automáticamente; no debe fijarse manualmente.
- Configura en el dashboard de Render las variables sensibles/marcadas como `sync: false` (por ejemplo `FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT_BASE64`, `ADMIN_EMAILS`) y ajusta `CORS_ORIGINS` al origen real del frontend.
- En el plan free puede haber *cold start*; la primera petición puede tardar unos instantes.

## Estructura del proyecto

```text
backend/
├── src/
│   ├── app.ts                 # Composición de la app Express
│   ├── server.ts              # Arranque del servidor y manejo de señales
│   ├── auth/
│   │   └── auth.routes.ts     # Rutas de auth (stubs en WP1)
│   ├── config/
│   │   ├── cors.ts
│   │   ├── env.ts
│   │   └── swagger.ts
│   ├── middlewares/
│   │   └── error.ts           # 404 y manejador global de errores
│   ├── routes/
│   │   └── health.ts
│   └── types/
│       └── express.d.ts       # Extensión de tipos Express (req.usuario)
├── tests/
│   └── health.test.ts
├── openapi.yaml               # Contrato OpenAPI (fuente de verdad)
├── Dockerfile
├── render.yaml
├── .env.example
├── package.json
├── tsconfig.json
└── vitest.config.mts
```

## Notas

- `GET /health` está pensado como chequeo de disponibilidad del proceso (útil para Render/monitoreo) y no consulta servicios externos.
- La autenticación real (verificación de Firebase ID Token, `firebase-admin`, resolución de roles/usuarios) se implementará en **WP2**; mientras tanto `/api/v1/auth/*` responde `501`.
- No commitear `.env` ni credenciales; usar el gestor de secretos del entorno de despliegue.
