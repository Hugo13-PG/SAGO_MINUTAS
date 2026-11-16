# Fase 1 — API REST, autenticación y Swagger

**Duración estimada:** 2 sesiones de 3 h (o 2 días) · **Equipo:** 3 personas · **Rama base:** `develop`

**Resultado esperado:** una API propia en Node.js + Express + TypeScript, desplegada en la nube, con
`/health`, login con Google (Firebase ID token), roles y documentación Swagger. La app Android **no se
modifica todavía**: solo se prepara el contrato que consumirá en la Fase 3.

---

## 0. Dónde encaja esta fase

```text
Fase 0  ✅ Repo, ramas, PRs, tablero
Fase 1  ⬅ API base + auth + Swagger + deploy        (esta fase)
Fase 2    CRUD de minutas/clientes/usuarios + fotos + reglas Firestore
Fase 3    Refactor Android (Screaming Architecture) + Retrofit
Fase 4    Room + offline
Fase 5    3rd party en la app + IA + colas
Fase 6    Web contra API + CI/CD + traducciones
Fase 7    Documentación, tests, demo
```

Sin Fase 1 no se pueden ganar los 15 pts de "API Cloud & Swagger" ni preparar los 15 pts de
"3rd Party". Es la fase con mayor impacto de la rúbrica después de Git.

---

## 1. Antes y después

### Antes (hoy)

- El APK y el panel web hablan **directo con Firestore** (`FirebaseFirestore.getInstance()`).
- El login compara `usuarios.contrasena` en texto plano desde el cliente.
- No existe carpeta `backend/`, ni API, ni Swagger, ni URL pública.
- No hay roles: cualquier usuario que sepa el nombre y la contraseña entra.
- Los errores se muestran con `Toast`; no hay contrato de errores.
- La configuración de Firebase está hardcodeada en `app/web/src/firebase.js`.
- No hay tests ni despliegue del backend.

### Después de la Fase 1

| Aspecto | Antes | Después |
|---------|-------|---------|
| Acceso a datos | Cliente → Firestore directo | Auth vía **API**; las minutas siguen directo a Firestore hasta la Fase 2 |
| Login | Nombre + contraseña plana | **Google Sign-In** → Firebase ID token verificado |
| Identidad | Sin `uid`; se busca por nombre | `usuarios/{uid}` con email y rol |
| Roles | No existen | `operador` / `gerente` validados en middleware |
| Documentación | Ninguna | **Swagger UI en `/docs`** + `openapi.json` |
| Backend | No existe | Express + TypeScript desplegado en Render |
| Secretos | Config hardcodeada | Variables de entorno; service account fuera del repo |
| Errores | Toast / texto libre | JSON `{ error: { code, message } }` |
| Tests | Plantillas | Vitest + Supertest |
| URL | Solo local | `https://sago-api.onrender.com` (ejemplo) |

### Lo que **no** cambia todavía

- La app Android sigue usando Firestore y el login por nombre/contraseña.
- El panel web sigue leyendo Firestore directo.
- Las minutas aún no tienen endpoints (llegan en la Fase 2).
- Las reglas de Firestore siguen abiertas (se cierran en la Fase 2).

Esto es intencional: primero se construye y se prueba la API; después se migran los clientes. Así no
se rompe la demo mientras avanzan.

> En la Fase 1 la API es la puerta de la **identidad**, no todavía la de las minutas. El cierre total
> del acceso directo a Firestore ocurre en las fases 2 (endpoints) y 3 (Android).

---

## 2. Alcance de la fase

### Incluido

- Proyecto `backend/` con Express + TypeScript.
- `GET /health` para el health check del hosting.
- `POST /api/v1/auth/google` y `GET /api/v1/auth/me`.
- Firebase Admin inicializado por variables de entorno.
- Middleware `verifyToken` y `requireRole`.
- Swagger UI (`/docs`) y OpenAPI (`/openapi.json`).
- Tests de health, autenticación y roles.
- Deploy público en Render (o Railway).
- `.env.example`, `backend/README.md`, colección Postman y `docs/API_CONTRACT.md`.
- Evidencias para la rúbrica.

### Fuera de alcance

- CRUD de minutas, clientes y usuarios (Fase 2).
- Subida de fotos (Fase 2).
- Reglas de Firestore (Fase 2).
- Cambios en Android o en el panel web (Fases 3 y 6).
- RabbitMQ, Gemini, CI/CD y traducciones (Fases 5 y 6).

---

## 3. Prerrequisitos

### 3.1 Fase 0 mínima

- `develop` existe y está protegida.
- Los 3 integrantes son colaboradores con permiso **Write**.
- Cada uno tiene su rama y sabe abrir un PR.
- Si la Fase 0 aún no está cerrada, trabajen esta fase en ramas desde `develop` y no hagan push directo.

### 3.2 Firebase Console — runbook (lo hace una sola persona y comparte captura)

**Quién lo hace:** una sola persona con rol **Owner** o **Editor** del proyecto Firebase. Las demás no
necesitan acceso a la consola; solo reciben el Project ID y la lista de correos gerentes. **Nunca** se
comparte el JSON de la service account por chat, WhatsApp, Discord, issue ni PR: se pasa por el canal
seguro acordado (gestor de contraseñas o variable de entorno directamente en Render).

**Datos ya confirmados del proyecto** (leídos de `app/google-services.json`):

| Dato | Valor |
|------|-------|
| `project_id` | `sago-minutas` |
| `project_number` | `672807690917` |
| `storage_bucket` | `sago-minutas.firebasestorage.app` |
| Paquete Android | `com.example.sgominutas` |
| `oauth_client` | **vacío** → Google Sign-In aún no está configurado para la app |

#### 3.2.1 Habilitar el proveedor Google

1. Abrir <https://console.firebase.google.com> e iniciar sesión con la cuenta dueña del proyecto.
2. Seleccionar el proyecto **`sago-minutas`**.
3. Menú izquierdo → **Build → Authentication**.
4. Si es la primera vez: **Get started**.
5. Pestaña **Sign-in method** → **Google** → activar el interruptor **Enable**.
6. Completar:
   - **Project public-facing name:** `SAGO Minutas`
   - **Project support email:** el correo del equipo (no tiene que ser el de gerentes).
7. **Save**.

**Verificación:** Google aparece como `Enabled` y la tarjeta muestra un *Web client ID*. No hace falta
copiarlo: el cliente Android usa el SDK de Firebase, no el client ID a mano.

> Este paso **no** requiere SHA-1. El SHA-1 solo es necesario para el Google Sign-In nativo de Android
> (Fase 5), no para que el backend verifique un Firebase ID token.

#### 3.2.2 Generar la service account

1. Rueda dentada (⚙️) → **Project settings** → pestaña **Service accounts**.
2. Sección **Firebase Admin SDK** → botón **Generate new private key** → **Generate key**.
3. Se descarga un archivo con nombre similar a
   `sago-minutas-firebase-adminsdk-abc12-3f9c8b7a61.json`.
4. **Sacarlo de `Downloads` inmediatamente** y guardarlo fuera del repositorio:

```powershell
# Crear carpeta segura fuera del repo
New-Item -ItemType Directory -Force "$env:USERPROFILE\secrets\sago" | Out-Null

# Mover el JSON descargado (ajusta el patrón si el nombre difiere)
Move-Item "$env:USERPROFILE\Downloads\sago-minutas-firebase-adminsdk-*.json" `
         "$env:USERPROFILE\secrets\sago\serviceAccount.json"
```

5. Comprobar el contenido **sin imprimir la clave privada**:

```powershell
$sa = Get-Content "$env:USERPROFILE\secrets\sago\serviceAccount.json" -Raw | ConvertFrom-Json
$sa.type          # debe ser "service_account"
$sa.project_id    # debe ser "sago-minutas"
$sa.client_email  # termina en @sago-minutas.iam.gserviceaccount.com
```

6. Comprobar que no quedó nada dentro del repo:

```powershell
git status --short
Get-ChildItem -Recurse -File -Include "serviceAccount*.json","*adminsdk*.json" |
  Where-Object { $_.FullName -notmatch "node_modules" }
# Debe devolver vacío
```

> El JSON contiene `private_key`: es equivalente a la contraseña raíz del proyecto. Si se filtra, hay
> que **rotarlo** en la misma pantalla (borrar la clave antigua y generar una nueva) y actualizar
> Render. No se puede "deshacer".

#### 3.2.3 Convertir el JSON a base64 (para Render)

```powershell
$b64 = [Convert]::ToBase64String(
  [IO.File]::ReadAllBytes("$env:USERPROFILE\secrets\sago\serviceAccount.json")
)
$b64.Length          # referencia: suele estar entre 3000 y 4500 caracteres
$b64 | Set-Clipboard # queda en el portapapeles, NO se imprime en pantalla
```

- Pegar ese valor en Render → **Environment → `FIREBASE_SERVICE_ACCOUNT_BASE64`** cuando se cree el
  servicio (lo hace Bryan en WP1).
- Guardar una copia de respaldo en el gestor de contraseñas del equipo.
- **No** ejecutar `$b64` a secas: quedaría en el historial de la terminal.

#### 3.2.4 Definir `ADMIN_EMAILS`

Lista de correos que serán **gerente** al registrarse por primera vez:

```dotenv
ADMIN_EMAILS=correo.gerente1@gmail.com,correo.gerente2@gmail.com
```

Reglas:

- Separados por **coma**, sin espacios.
- En minúsculas y exactamente iguales al correo de la cuenta Google (Gmail ignora los puntos, la API no).
- Deben existir como cuentas Google reales del equipo; no se inventan.
- Si un usuario ya existe en `usuarios/{uid}`, **se respeta su rol** aunque esté en esta lista.
- Los documentos viejos con ID automático y `contrasena` no se tocan en esta fase.

#### 3.2.5 SHA-1 (solo referencia para la Fase 5)

No se agrega ahora. Cuando toque el Google Sign-In nativo en Android:

```powershell
keytool -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" `
  -alias androiddebugkey -storepass android -keypass android
```

Se copia el **SHA1** en Firebase → Project settings → Your apps → app Android →
**Add fingerprint**. Al hacerlo, `google-services.json` se actualiza y aparecen entradas en
`oauth_client`.

#### 3.2.6 Evidencias de este paso

Guardar en `docs/evidencias/fase-1/firebase/`:

- captura de **Authentication → Sign-in method** con Google en `Enabled`;
- captura de **Project settings → Service accounts** (sin claves visibles);
- captura de **Project settings → General** mostrando `Project ID: sago-minutas`;
- nota en `docs/EVIDENCIAS.md` con la fecha y quién lo hizo.

**Nunca** capturar ni adjuntar el JSON, su `private_key` ni el base64.

#### 3.2.7 Checklist de salida (3.2 terminada)

- [ ] Google habilitado en Authentication.
- [ ] Service account generada y guardada **fuera** del repo.
- [ ] `project_id` verificado = `sago-minutas`.
- [ ] `FIREBASE_SERVICE_ACCOUNT_BASE64` generado y guardado en el gestor de contraseñas.
- [ ] `ADMIN_EMAILS` definido y compartido con el equipo.
- [ ] `git status` no muestra ningún archivo de credenciales.
- [ ] Evidencias guardadas en `docs/evidencias/fase-1/firebase/`.

### 3.3 Cuentas y herramientas

**Esto NO es el despliegue.** Aquí solo se crean la cuenta y se verifica el entorno. El servidor se
despliega después, cuando el código de `backend/` ya exista y esté en una rama del repo (tarea 8 de
Bryan en la sección 5.1 y paso 7 de la sección 7). No se puede desplegar un servicio que todavía no
tiene `package.json`.

**Quién crea la cuenta de Render:** el dueño del repositorio (**Bryan**), porque el repo
`bryan171005/SAGO_MINUTAS` es privado y Render solo ve repos a los que su cuenta de GitHub tiene
acceso. Hugo y el Tercero no necesitan cuenta de Render: consumen la URL pública. Si otro integrante
la crea, primero debe ser colaborador del repo y aun así Render necesita autorización explícita sobre
ese repositorio.

- Cuenta en [Render](https://render.com) con **Sign up with GitHub** (plan **Free**).
  - Si pide tarjeta para un *Web Service* gratuito, detente y avisa: el plan free no la necesita.
  - Alternativa equivalente: [Railway](https://railway.app).
- Node.js 20+ local y `npm` 11 (ya verificado en el equipo: Node `v26.11.1`, npm `11.20.0`).
  - En Render se fija la versión con `"engines": { "node": ">=20" }` en `package.json` o con la
    variable `NODE_VERSION=22`. No se depende de que Render use la misma versión local.
- No hay `gh` instalado: los PRs y la configuración de Render se hacen por la web.

**Verificación local de 3.3:**

```powershell
node -v      # v20 o superior
npm -v       # 10 u 11
git --version
```

**Advertencia del plan gratuito de Render:** el servicio se suspende tras ~15 minutos sin tráfico y
la primera petición tarda ~50 segundos en despertar. Para la demo: hacer un `GET /health` 10 minutos
antes de presentar.

**Evidencia de 3.3:** captura del dashboard de Render vacío (cuenta creada) y de `node -v` / `npm -v`.

### 3.4 Estructura objetivo

```text
backend/
├── src/
│   ├── server.ts                 # arranque HTTP
│   ├── app.ts                    # middlewares + rutas + Swagger
│   ├── config/
│   │   ├── env.ts                # validación con Zod
│   │   ├── firebase.ts           # Admin SDK (lazy)
│   │   ├── cors.ts
│   │   └── swagger.ts
│   ├── middlewares/
│   │   ├── auth.ts               # verifyToken, requireRole
│   │   ├── error.ts
│   │   └── notFound.ts
│   ├── auth/
│   │   ├── auth.routes.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.schemas.ts
│   ├── usuarios/
│   │   └── usuarios.repository.ts
│   ├── routes/health.ts
│   └── types/express.d.ts
├── openapi.yaml
├── tests/
│   ├── health.test.ts
│   ├── auth.test.ts
│   └── helpers/
├── .env.example
├── .gitignore
├── Dockerfile
├── render.yaml
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

---

## 4. Contrato de API

Base: `https://<servicio>.onrender.com/api/v1`

### 4.1 `GET /health`

```json
{ "status": "ok", "uptime": 123.45, "timestamp": "2026-11-13T18:00:00.000Z" }
```

### 4.2 `POST /auth/google`

Recibe el **Firebase ID token** que el cliente obtiene después de Google Sign-In. No es el token crudo
de Google: es el token de Firebase (`user.getIdToken()`), que el backend verifica con el Admin SDK.

Request:

```http
POST /api/v1/auth/google
Content-Type: application/json

{ "idToken": "eyJhbGciOiJSUzI1NiIs..." }
```

Response `200`:

```json
{
  "usuario": {
    "uid": "AbC123...",
    "nombre": "Hugo Ponce",
    "email": "hugo@example.com",
    "rol": "operador",
    "activo": true,
    "proveedor": "google",
    "fechaAlta": "2026-11-13T18:00:00.000Z",
    "ultimoAcceso": "2026-11-13T18:00:00.000Z"
  }
}
```

Errores:

| Código | `code` | Cuándo |
|--------|--------|--------|
| 400 | `VALIDATION_ERROR` | Falta `idToken` o el body no es JSON |
| 401 | `UNAUTHORIZED` | Token inválido, expirado o sin email |
| 403 | `FORBIDDEN` | Usuario inactivo |
| 500 | `INTERNAL_ERROR` | Falla inesperada |

### 4.3 `GET /auth/me`

```http
GET /api/v1/auth/me
Authorization: Bearer <Firebase ID token>
```

Response `200`: el mismo objeto `usuario`.

### 4.4 Formato de error

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token inválido o expirado"
  }
}
```

### 4.5 Modelo `usuarios/{uid}`

```text
uid           string   (ID del documento, coincide con Firebase Auth)
nombre        string
email         string
rol           "operador" | "gerente"
activo        boolean
proveedor     "google"
fechaAlta     ISO string
ultimoAcceso  ISO string
```

**No se guarda `contrasena`.** Los documentos viejos con contraseña se migran en la Fase 2.

### 4.6 Regla de asignación de rol

1. Si el documento ya existe, se conserva su `rol`.
2. Si es nuevo y su email está en `ADMIN_EMAILS`, entra como `gerente`.
3. En cualquier otro caso, `operador`.
4. Si `activo` es `false`, la API responde `403`.

> Los documentos viejos de `usuarios` (ID automático, con `contrasena`) siguen existiendo hasta la
> migración de la Fase 2. Los nuevos usuarios se guardan por `uid`; el panel puede mostrar ambos
> temporalmente. No borres datos en esta fase.

---

## 5. Reparto del trabajo en 3 personas

> Ajusten los nombres si el equipo cambia. Cada persona tiene **una rama, un PR y un reviewer
> distinto**. Nadie aprueba su propio PR.

| Persona | Rol | Rama | PR revisado por | Entregable principal |
|---------|-----|------|-----------------|----------------------|
| **Bryan** | Infraestructura, Express y deploy | `feature/backend-core` | Hugo | API viva con `/health` |
| **Hugo** | Autenticación, Firebase y roles | `feature/auth-google` | Tercero | Login Google + `/auth/me` |
| **Tercero** | Contrato, Swagger, tests y QA | `feature/swagger-tests` | Bryan | `/docs` + tests + Postman |

### 5.1 Bryan — Backend Core (WP1)

**Archivos que posee:**

- `backend/package.json`, `tsconfig.json`, `vitest.config.ts`
- `src/server.ts`, `src/app.ts`
- `src/config/env.ts`, `src/config/cors.ts`
- `src/middlewares/error.ts`, `src/middlewares/notFound.ts`
- `src/routes/health.ts`
- `.env.example`, `.gitignore`, `Dockerfile`, `render.yaml`, `backend/README.md`

**Tareas:**

1. Crear el proyecto con Node 20+, Express 5 y TypeScript estricto.
2. Configurar `helmet`, `cors`, `express.json()` y `morgan`.
3. Validar variables de entorno con Zod (sin romper los tests si faltan secretos). Cargar `.env` con
   `import "dotenv/config"` al inicio de `config/env.ts`.
4. Implementar `GET /health`.
5. Crear un router `/api/v1` con un stub de `auth.routes.ts` para que Hugo lo llene sin tocar
   `app.ts`.
6. Implementar el manejador global de errores y el 404.
7. Dejar `setupSwagger(app)` importado desde `config/swagger.ts` (el stub lo completa el Tercero).
8. Crear `Dockerfile` y `render.yaml`; desplegar en Render con `/health` como health check.
9. Documentar en `backend/README.md` cómo correr, testear y desplegar.

**Criterio de aceptación:**

- `npm run dev` levanta en `http://localhost:3000`.
- `GET /health` responde 200.
- La URL pública `https://.../health` responde 200.
- `npm run typecheck` limpio.

**Riesgo principal:** conflictos en `app.ts`. Por eso Bryan es el único que lo edita; los demás solo
crean routers y se los entrega.

### 5.2 Hugo — Auth y Firestore (WP2)

**Archivos que posee:**

- `src/config/firebase.ts`
- `src/middlewares/auth.ts`
- `src/auth/auth.routes.ts`, `auth.controller.ts`, `auth.service.ts`, `auth.schemas.ts`
- `src/usuarios/usuarios.repository.ts`
- `src/types/express.d.ts`
- `tests/auth.test.ts` (en coordinación con el Tercero)

**Tareas:**

1. Inicializar Firebase Admin de forma **lazy**:
   - Si `FIREBASE_SERVICE_ACCOUNT_BASE64` existe, decodificarlo y usar `cert()`.
   - Si no, usar `applicationDefault()` para desarrollo local.
2. Implementar `POST /auth/google`:
   - Validar el body con Zod.
   - `admin.auth().verifyIdToken(idToken)`.
   - Upsert en `usuarios/{uid}` con la regla de rol de la sección 4.6.
   - Actualizar `ultimoAcceso`.
   - Devolver `{ usuario }`.
3. Implementar `GET /auth/me` con `verifyToken`.
4. Implementar `verifyToken` y `requireRole(...roles)`.
5. Manejar 401/403 y usuarios inactivos.
6. Escribir tests unitarios con dependencias inyectadas (sin pegarle a Firebase real):
   - token ausente → 401;
   - token inválido → 401;
   - body inválido → 400;
   - rol insuficiente → 403.

**Criterio de aceptación:**

- Un token real de Firebase devuelve el perfil en `/auth/google` y `/auth/me`.
- Sin token → 401.
- Un `operador` no puede acceder a una ruta de gerente (se prueba con el middleware o una ruta de
  prueba temporal que se elimina antes del merge).

**Riesgo principal:** confundir el token de Google con el de Firebase. La API solo acepta el
**Firebase ID token** (`getIdToken()`), no el `idToken` crudo de Google.

### 5.3 Tercero — Contrato, Swagger, tests y QA (WP3)

**Archivos que posee:**

- `openapi.yaml` (raíz de `backend/`)
- `src/config/swagger.ts`
- `tests/health.test.ts`, `tests/helpers/`
- `postman/SAGO.postman_collection.json`
- `docs/API_CONTRACT.md`

**Tareas:**

1. Escribir **primero** `openapi.yaml` como fuente de verdad: health, auth, schemas, errores,
   `bearerAuth`, ejemplos y servidores local/producción.
2. Servir Swagger UI en `/docs` y el JSON en `/openapi.json`.
3. Configurar Vitest + Supertest y los tests de health/404.
4. Revisar que todos los endpoints estén documentados y que "Try it out" funcione en producción.
5. Exportar la colección Postman con variables `baseUrl` y `token`.
6. Escribir `docs/API_CONTRACT.md` para el equipo de Android:
   - URL base, header de auth, endpoints, request/response, códigos de error y ejemplo de llamada.
7. QA final: `npm run typecheck`, `npm test`, `/docs` en producción, CORS desde el panel web.

**Criterio de aceptación:**

- `/docs` lista los 3 endpoints con ejemplos y autenticación.
- `/openapi.json` devuelve un OpenAPI 3 válido.
- `npm test` en verde.
- Postman y `API_CONTRACT.md` fusionados.

**Riesgo principal:** documentar rutas que aún no existen o que cambian. Mitigación: el contrato se
escribe antes y se ajusta en el mismo PR que la implementación.

---

## 6. Cronograma

### Sesión 1 (3 h) — base y contrato

| Hora | Bryan | Hugo | Tercero |
|------|-------|------|---------|
| 0:00–0:20 | Kickoff: leer contrato y repartir archivos | Kickoff | Kickoff |
| 0:20–0:50 | Scaffold, `package.json`, `app.ts`, `/health` | Firebase Console: Google provider, service account, `ADMIN_EMAILS` | Escribir `openapi.yaml` |
| 0:50–1:40 | Env, CORS, errores, router stub | `firebase.ts`, `auth.service.ts`, repositorio | Swagger UI + `/openapi.json` |
| 1:40–2:30 | Dockerfile, `render.yaml`, deploy | `auth.routes/controller`, middlewares | Vitest + tests de health |
| 2:30–3:00 | PR + deploy `/health` | PR + pruebas locales | PR + tests base |

**Checkpoint:** la URL pública responde `/health`; los 3 PRs están abiertos.

### Sesión 2 (3 h) — integración y cierre

| Hora | Actividad |
|------|-----------|
| 0:00–0:30 | Merge de `feature/backend-core` → `develop` (revisa Hugo) |
| 0:30–1:15 | Rebase de auth; pruebas con token real; merge (revisa el Tercero) |
| 1:15–2:00 | Rebase de Swagger/tests; `/docs` en producción; merge (revisa Bryan) |
| 2:00–2:30 | CORS, variables de Render, prueba end-to-end con Postman |
| 2:30–2:50 | Evidencias: `/docs`, `/health`, token, PRs, tablero |
| 2:50–3:00 | Tag `v0.2.0-fase1` y retro |

### Orden de merge (importante)

```text
1. feature/backend-core   → develop   (health + infra)
2. feature/auth-google    → develop   (rebase antes del merge)
3. feature/swagger-tests  → develop   (rebase al final; toca app.ts solo para /docs)
4. develop                → main      (release + tag)
```

Si dos PRs tocan `src/app.ts`, gana el orden anterior y el segundo hace `git rebase origin/develop`
antes de pedir revisión.

---

## 7. Paso a paso — Bryan (WP1)

```powershell
# 1. Rama
git checkout develop
git pull origin develop
git checkout -b feature/backend-core

# 2. Proyecto
mkdir backend
cd backend
npm init -y
npm i express cors helmet morgan zod firebase-admin swagger-ui-express js-yaml dotenv
npm i -D typescript tsx vitest supertest @types/express @types/cors @types/morgan @types/node @types/supertest @types/js-yaml

# 3. Verificar que arranca
npm run dev
# GET http://localhost:3000/health
```

`package.json` (scripts esperados):

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/server.js",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  }
}
```

`tsconfig.json` mínimo:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src"]
}
```

`src/app.ts` debe verse así (los routers se importan ya montados):

```ts
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGINS.split(",") }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", healthHandler);
app.use("/api/v1/auth", authRouter);   // stub creado por Bryan, lo llena Hugo
setupSwagger(app);                      // stub creado por Bryan, lo completa el Tercero
app.use(notFound);
app.use(errorHandler);
```

Al terminar:

```powershell
git add backend
git commit -m "feat(api): crear esqueleto Express, health y configuracion de deploy"
git push -u origin feature/backend-core
```

Abrir PR contra `develop`, reviewer Hugo.

---

## 8. Paso a paso — Hugo (WP2)

### 8.1 Configurar Firebase Admin

```ts
// src/config/firebase.ts (idea)
import admin from "firebase-admin";
import { env } from "./env";

let app: admin.app.App | null = null;

export function getFirebaseAdmin() {
  if (app) return app;

  const credential = env.FIREBASE_SERVICE_ACCOUNT_BASE64
    ? admin.credential.cert(
        JSON.parse(
          Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8")
        )
      )
    : admin.credential.applicationDefault();

  app = admin.initializeApp({ credential, projectId: env.FIREBASE_PROJECT_ID });
  return app;
}

export function getDb() {
  return getFirebaseAdmin().firestore();
}
```

Para generar el base64 en Windows:

```powershell
$b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes(".\serviceAccount.json"))
$b64 | Set-Clipboard
# Pegar en Render → Environment → FIREBASE_SERVICE_ACCOUNT_BASE64
```

### 8.2 Implementar el servicio de auth

```ts
// src/auth/auth.service.ts (idea)
export async function loginConGoogle(idToken: string) {
  const decoded = await getFirebaseAdmin().auth().verifyIdToken(idToken);
  if (!decoded.email) throw new HttpError(401, "UNAUTHORIZED", "Token sin email");

  const ref = getDb().collection("usuarios").doc(decoded.uid);
  const snap = await ref.get();
  const existente = snap.data();

  if (existente?.activo === false) {
    throw new HttpError(403, "FORBIDDEN", "Usuario inactivo");
  }

  const rol =
    existente?.rol ??
    (env.ADMIN_EMAILS.split(",").includes(decoded.email) ? "gerente" : "operador");

  const usuario = {
    uid: decoded.uid,
    nombre: existente?.nombre ?? decoded.name ?? decoded.email.split("@")[0],
    email: decoded.email,
    rol,
    activo: existente?.activo ?? true,
    proveedor: "google",
    fechaAlta: existente?.fechaAlta ?? new Date().toISOString(),
    ultimoAcceso: new Date().toISOString(),
  };

  await ref.set(usuario, { merge: true });
  return usuario;
}
```

### 8.3 Middlewares

```ts
// verifyToken: lee "Authorization: Bearer <idToken>", verifica con Admin y adjunta req.auth
// requireRole("gerente"): lee usuarios/{uid}.rol y responde 403 si no coincide
```

### 8.4 Pruebas locales

1. Obtén un Firebase ID token:
   - desde la app Android (Fase 5), o
   - desde una consola web con Firebase Auth, o
   - con Postman usando la API REST de Firebase Auth (solo para pruebas).
2. Prueba:

```powershell
curl.exe -X POST http://localhost:3000/api/v1/auth/google `
  -H "Content-Type: application/json" `
  -d '{"idToken":"PEGAR_TOKEN"}'
```

3. Verifica en Firestore que se creó `usuarios/{uid}` con el rol correcto.

**No commitees** el service account ni el token. El `.gitignore` ya excluye
`serviceAccount*.json` y `.env`.

Al terminar:

```powershell
# Desde la raíz del repo
git add backend/src/config/firebase.ts backend/src/auth backend/src/middlewares/auth.ts backend/src/usuarios backend/src/types
git commit -m "feat(api): agregar login con Google, perfiles y middleware de roles"
git push -u origin feature/auth-google
```

PR contra `develop`, reviewer el Tercero.

---

## 9. Paso a paso — Tercero (WP3)

### 9.1 Contrato primero

Escribe `backend/openapi.yaml` con:

- `openapi: 3.0.3`, `info`, `servers` (local y producción).
- `/health`, `/api/v1/auth/google`, `/api/v1/auth/me`.
- `components.securitySchemes.bearerAuth`.
- `components.schemas`: `Usuario`, `Error`, `Health`.
- Ejemplos de request/response y todos los códigos de error.

### 9.2 Swagger UI

```ts
// src/config/swagger.ts (idea)
import swaggerUi from "swagger-ui-express";
import yaml from "js-yaml";
import fs from "node:fs";
import path from "node:path";

const spec = yaml.load(
  fs.readFileSync(path.join(process.cwd(), "openapi.yaml"), "utf8")
);

export function setupSwagger(app) {
  app.get("/openapi.json", (_req, res) => res.json(spec));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec));
}
```

> El YAML vive en la raíz de `backend/`, junto a `package.json`. Render ejecuta `npm start` desde esa
> carpeta, así que `process.cwd()` lo encuentra sin depender de que `tsc` copie archivos a `dist/`.

### 9.3 Tests

```ts
// tests/health.test.ts
import request from "supertest";
import { app } from "../src/app";

it("GET /health responde 200", async () => {
  const res = await request(app).get("/health");
  expect(res.status).toBe(200);
  expect(res.body.status).toBe("ok");
});
```

Para auth, inyecta dependencias falsas:

```ts
// tests/auth.test.ts (idea)
const service = createAuthService({
  verifyIdToken: async () => ({ uid: "u1", email: "hugo@test.com", name: "Hugo" }),
  repo: fakeRepo,
  adminEmails: ["jefe@test.com"],
});
```

### 9.4 Postman y contrato para Android

- `backend/postman/SAGO.postman_collection.json` con variables `baseUrl` y `token`.
- `docs/API_CONTRACT.md` con ejemplos de Kotlin/Retrofit para la Fase 3.

Al terminar:

```powershell
# Desde la raíz del repo
git add backend/openapi.yaml backend/src/config/swagger.ts backend/tests backend/postman docs/API_CONTRACT.md
git commit -m "docs(api): agregar Swagger, pruebas y contrato para clientes"
git push -u origin feature/swagger-tests
```

PR contra `develop`, reviewer Bryan.

---

## 10. Variables de entorno

`backend/.env.example`:

```dotenv
NODE_ENV=development
PORT=3000
FIREBASE_PROJECT_ID=sago-minutas
FIREBASE_SERVICE_ACCOUNT_BASE64=
ADMIN_EMAILS=correo.gerente@example.com
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

En Render:

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `FIREBASE_PROJECT_ID` | `sago-minutas` |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | base64 del JSON (secreto) |
| `ADMIN_EMAILS` | correos de gerentes separados por coma |
| `CORS_ORIGINS` | URL del panel web y localhost |

Nunca subas `.env` ni el JSON. Ya están en `.gitignore`.

> Si Render limita el tamaño de la variable, sube el JSON como **Secret File** y configura
> `GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/serviceAccount.json`. El código debe soportar ambos
> caminos (`FIREBASE_SERVICE_ACCOUNT_BASE64` o `applicationDefault()`).

---

## 11. Verificación y evidencias

### Checklist técnico

- [ ] `GET /health` local y en producción → 200.
- [ ] `POST /auth/google` con token real → 200 y documento en Firestore.
- [ ] `GET /auth/me` con Bearer → 200.
- [ ] Sin token / token inválido → 401.
- [ ] Usuario inactivo → 403.
- [ ] Rol `gerente` asignado por `ADMIN_EMAILS`.
- [ ] `/docs` con "Try it out" y `bearerAuth`.
- [ ] `/openapi.json` válido.
- [ ] `npm run typecheck` y `npm test` en verde.
- [ ] CORS permite el origen del panel web.
- [ ] `.env` y service account fuera de Git.
- [ ] 3 PRs fusionados con 3 autores y revisiones cruzadas.

### Evidencias para la rúbrica

- Captura de `/docs` en producción.
- Captura de `/health`.
- Captura de Firestore con `usuarios/{uid}` y rol.
- Captura de Postman con 200/401.
- URL pública y captura del servicio en Render.
- Lista de PRs y network graph.
- Tag `v0.2.0-fase1`.

Guardar en `docs/evidencias/fase-1/`.

---

## 12. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Service account filtrado | Crítico | Solo en Render Environment; `.gitignore`; rotar si se filtra |
| Token de Google crudo en vez de Firebase ID token | Alto | Documentar `getIdToken()`; probar con token real |
| Render free duerme | Medio | Health check + ping 10 min antes de la demo |
| Conflictos en `app.ts` | Medio | Solo Bryan lo edita; los demás crean routers |
| Firestore sigue abierto | Alto | Se cierra en Fase 2; no esperar a la entrega |
| Tests dependen de Firebase real | Medio | Inyectar dependencias y mockear |
| Swagger YAML no se copia al build | Medio | Verificar `/docs` en producción antes de cerrar |
| Falta de permisos en Render/Firebase | Medio | Asegurar que un integrante sea admin del proyecto |

---

## 13. Definition of Done de la Fase 1

- [ ] API desplegada con URL pública.
- [ ] `/health`, `/auth/google` y `/auth/me` funcionando.
- [ ] Swagger UI y OpenAPI publicados.
- [ ] Roles y middleware probados.
- [ ] Tests y typecheck en verde.
- [ ] `backend/README.md` y `.env.example` completos.
- [ ] Postman y `docs/API_CONTRACT.md` listos para la Fase 3.
- [ ] 3 PRs fusionados con revisión cruzada.
- [ ] Tag `v0.2.0-fase1`.
- [ ] Evidencias guardadas.

---

## 14. Qué NO se hace en esta fase

- No se toca la app Android ni el panel web.
- No se implementa CRUD de minutas (Fase 2).
- No se suben fotos (Fase 2).
- No se cierran las reglas de Firestore (Fase 2).
- No se agrega Room, Gemini ni RabbitMQ (Fases 4–5).
- No se hace push directo a `main` ni `develop`.

---

## 15. Primeros 15 minutos (resumen)

1. **Kickoff (10 min):** leer este documento, confirmar nombres/ramas y abrir los 3 issues en el tablero.
2. **Bryan:** `git checkout develop && git pull && git checkout -b feature/backend-core` y crear el
   proyecto `backend/`.
3. **Hugo:** habilitar Google en Firebase Auth y generar el service account; guardarlo fuera del repo.
4. **Tercero:** escribir la primera versión de `openapi.yaml` con `/health` y `/auth/google`.
5. **Todos:** acordar que `app.ts` solo lo edita Bryan y que el orden de merge es
   core → auth → swagger.
