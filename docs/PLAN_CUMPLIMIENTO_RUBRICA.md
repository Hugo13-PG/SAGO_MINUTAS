# Plan de cumplimiento al 100% — SAGO Minutas
### Proyecto Integrador · Desarrollo Móvil con Android
**Fecha de análisis:** 12/11/2026 · **Meta:** 100 pts base + 15 pts extra = **115 pts**

---

## 1. Resumen ejecutivo

SAGO es una app Android (Kotlin + Jetpack Compose) para que operadores de una empresa de llantas registren "minutas" de visitas a clientes (actividades realizadas, notas y foto de evidencia), más un panel web (React) para que el gerente valide esas minutas. **La idea del problema real es buena y ya existe un flujo funcional básico**, pero el proyecto está muy lejos de la rúbrica:

| # | Criterio | Peso | Estado actual | Puntos estimados |
|---|----------|------|---------------|------------------|
| 1 | Arquitectura & Lenguaje | 15 | Kotlin + Compose sí, pero **monolítico**: Firestore y validaciones dentro de los composables, sin ViewModel/Repository/Entities/Services | **7.5 / 15** |
| 2 | Resolución del Problema Real | 15 | Problema claro y útil, pero la foto no se guarda y el flujo es mínimo (1 pantalla + login inseguro) | **10 / 15** |
| 3 | API Cloud & Swagger | 15 | **No existe API propia**. La app habla directo con Firestore | **0 / 15** |
| 4 | Base de Datos Cloud | 10 | Firestore (nube, NoSQL) ya integrado, pero con fallas de seguridad (contraseñas en texto plano) y sin reglas | **7.5 / 10** |
| 5 | Servicios 3rd Party | 15 | Solo SDK de Firebase de forma indirecta; sin Google Sign-In, Maps, Gemini, etc. | **0–5 / 15** |
| 6 | Git & Colaboración | 15 | **1 solo commit**, todas las ramas apuntan al mismo commit, sin PRs | **0 / 15** |
| 7 | Exposición & Diapositivas | 5 | No hay evidencia | **0 / 5** |
| 8 | Demo en Vivo | 5 | Flujo parcial (login + guardar); sin foto, sin admin móvil | **2.5 / 5** |
| 9 | Código de Vestimenta | 5 | No depende del código | **0 / 5** |
| | **Total estimado** | **100** | | **≈ 27.5 – 45 / 100** |

**Puntos extra actuales:** Firestore NoSQL (+3) · Room (0) · Colas (0) · IA documentada (0) · CI/CD + traducciones (0) → **≈ 3 / 15**.

> **Conclusión:** hoy el proyecto está en ≈ 30–45/100. Para llegar a 115 hay que **construir el backend con Swagger, refactorizar la app a Screaming Architecture, autenticar con Google, persistir fotos, agregar Room/offline, colas, CI/CD, traducciones y rehacer el flujo de Git con ramas y PRs de los 3 integrantes**.

---

## 2. Análisis de la estructura actual

### 2.1 Árbol real del proyecto

```
SAGO_MINUTAS/
├── app/
│   ├── build.gradle.kts              # Firebase BOM 33.1.0, navigation 2.7.7, sin Hilt/Room/Retrofit
│   ├── google-services.json          # Config Firebase (commiteada)
│   ├── src/main/
│   │   ├── AndroidManifest.xml       # Sin <uses-permission INTERNET> explícito
│   │   └── java/com/example/sgominutas/
│   │       ├── MainActivity.kt        # NavHost login/minuta, sin logout, sin roles
│   │       ├── ui/theme/             # Tema template (morado, sin usar en MainActivity)
│   │       └── uisago/screens/
│   │           ├── loginscreen.kt     # ⚠ package incorrecto + password en texto plano
│   │           └── minutascreen.kt    # ⚠ formulario + Firestore + cámara todo en el composable
│   └── web/                           # Dashboard React (Vite) que lee Firestore directo
│       └── src/
│           ├── App.jsx                # ⚠ "login" que solo cambia un boolean (sin auth real)
│           ├── Dashboard.jsx          # CRUD de minutas/usuarios directo a Firestore
│           └── firebase.js            # ⚠ config hardcodeada
├── docs/                              # (nuevo) este plan
├── gradle/libs.versions.toml
├── build.gradle.kts / settings.gradle.kts
└── .gitignore
```

### 2.2 Hallazgos críticos (por prioridad)

**🔴 Bloqueantes para la rúbrica**

1. **No hay API REST ni Swagger.** `loginscreen.kt` y `minutascreen.kt` usan `FirebaseFirestore.getInstance()` directamente. No existe carpeta `backend/`, ni OpenAPI, ni URL desplegada.
2. **No hay capas.** Toda la lógica (estado, validación, acceso a datos, navegación, UI) vive en 2 composables de 180 y 350 líneas. No hay `ViewModel`, `Repository`, `Entity`, `Service` ni inyección de dependencias.
3. **Git inválido para la rúbrica.** `git rev-list --all --count` = **1**. Las 6 ramas (`master`, `Copia`, `CopiaHugo`, `Hugo`, `origin/copia-main`…) apuntan al mismo commit. No hay PRs, ni autores múltiples, ni estrategia de ramas.
4. **No hay servicios de terceros reales.** Firebase no cuenta como "3rd party" porque ya se está usando para la BD; se necesita algo explícito como **Google Sign-In**, **Gemini** o **Maps**.

**🟠 Seguridad y funcionalidad**

5. **Contraseñas en texto plano** en Firestore (`usuarios.contrasena`) y comparación directa en el cliente (`loginscreen.kt:131-146`). Firebase Auth está en dependencias pero **no se usa**.
6. **La foto se captura y se descarta.** `bitmapFoto` (minutascreen.kt:57-66) nunca se sube ni se guarda; la "evidencia fotográfica" no forma parte de la minuta. Esto resta en "Resolución del problema real" y en la demo.
7. **Reglas de Firestore abiertas** (no hay `firestore.rules` en el repo): cualquiera con la config web puede leer/escribir. El panel web escribe directo a la BD, saltándose cualquier API.
8. **Login web falso**: `App.jsx` solo hace `setLogeado(true)`, no valida credenciales.
9. **Sin cierre de sesión** en la app; `SharedPreferences` guarda el nombre, pero no hay sesión real ni rol.
10. **Errores por `Toast`** dentro de la UI, sin estados de carga/error/vacío formales.

**🟡 Arquitectura, calidad y presentación**

11. **Package incorrecto**: `loginscreen.kt` declara `package com.example.sgominutas` aunque está en `uisago/screens`. Es una señal de desorganización que el jurado puede notar.
12. **Strings hardcodeados** en todos los composables → imposible traducir sin refactor (necesario para el extra de traducciones).
13. **Tema template sin usar**: `MainActivity` no envuelve en `SGOMINUTASTheme`; los colores SAGO están hardcodeados en cada pantalla.
14. **Sin tests reales** (solo `ExampleUnitTest` / `ExampleInstrumentedTest`).
15. **Sin README raíz, sin diagramas, sin documentación de API, sin `.env.example`, sin CI**.
16. **`app/web` dentro de `app/`** confunde la estructura; debería ser `/web` en la raíz o un repo aparte.
17. **Versiones viejas**: Firebase BOM 33.1.0 (2024), navigation 2.7.7; `firebase-auth-ktx` quedó en el catálogo pero se borró de dependencias (configuración muerta).
18. **`menuAnchor()` sin tipo** (Material3 reciente exige `MenuAnchorType.PrimaryNotEditable`), riesgo de romper al actualizar el BOM.

### 2.3 Lo que sí está bien (hay que conservarlo)

- **Compila correctamente**: `gradlew assembleDebug` → `BUILD SUCCESSFUL` (verificado el 12/11/2026), con solo 2 warnings (`Divider` deprecado y `menuAnchor()` deprecado).
- Kotlin + Jetpack Compose al 100%.
- Caso de uso real y entendible: control de visitas/minutas de una empresa de llantas.
- Ya existe Firestore en la nube con datos y un panel web de administración.
- UI cuidada, con identidad de marca SAGO (rojo/negro), cámara y dropdown.
- `minSdk 24`, `targetSdk 36` correctos.

---

## 3. Arquitectura objetivo

### 3.1 Decisión tecnológica recomendada

| Capa | Tecnología | ¿Por qué? |
|------|-----------|-----------|
| App | Kotlin + Compose + **MVVM + Hilt** | Requisito de la rúbrica; capas limpias |
| Red | **Retrofit + OkHttp + kotlinx.serialization** | Consumo de la API propia |
| Local | **Room + DataStore + WorkManager** | Extra +3 y offline real para la demo |
| Auth | **Firebase Authentication + Google Sign-In** (Credential Manager) | 3rd party Google + elimina contraseñas planas |
| Archivos | **Firebase Storage** | Guardar la foto de evidencia |
| Backend | **Node.js + Express + TypeScript + Firebase Admin SDK** | Rápido, mismo lenguaje que el panel web, deploy gratis |
| API docs | **Swagger UI + OpenAPI 3** (`swagger-jsdoc` / `swagger-ui-express`) | Requisito obligatorio |
| BD | **Firestore** (NoSQL en la nube) | Ya existe, +3 extra |
| 3rd party | **Google Sign-In + Gemini API** | 15 pts + evidencia de IA |
| Colas | **RabbitMQ (CloudAMQP free)** con productor/consumidor | Extra +3 |
| Web | React + Vite consumiendo la **API REST** | Panel gerencial |
| Deploy | **Render/Railway** (API), **Vercel/Firebase Hosting** (web) | URL pública para la demo |
| CI/CD | **GitHub Actions** | Extra +3 |

> Alternativa si el equipo prefiere un solo lenguaje: backend en **Kotlin + Ktor**. Es igual de válido, pero más lento de montar y desplegar. La recomendación es Node/Express por tiempo y porque ya hay JavaScript en el repo.

### 3.2 Android — Screaming Architecture (por feature, no por capa)

```
com.sago.minutas/
├── SagoApplication.kt                 # @HiltAndroidApp
├── MainActivity.kt                    # solo host + tema + NavHost
├── core/
│   ├── di/                            # AppModule, NetworkModule, DatabaseModule
│   ├── network/                       # ApiClient, AuthInterceptor, ApiResult, safeApiCall
│   ├── session/                       # SessionManager (DataStore: token, rol, uid)
│   ├── ui/                            # SagoTheme, SagoButton, SagoTextField, Loading, ErrorState
│   └── util/                          # DateUtils, Validators, NetworkMonitor
├── navigation/                        # Routes.kt, SagoNavHost.kt
├── auth/
│   ├── data/                          # AuthApi, AuthRepositoryImpl, GoogleSignInDataSource, dto/
│   ├── domain/                        # Usuario, Rol, AuthRepository, LoginUseCase
│   └── ui/                            # LoginScreen, LoginViewModel, LoginUiState
├── minutas/                           # ⬅ feature principal
│   ├── data/
│   │   ├── remote/                    # MinutaApi, dto/MinutaDto, mapper
│   │   ├── local/                     # MinutaDao, MinutaEntity, SagoDatabase
│   │   └── MinutaRepositoryImpl.kt
│   ├── domain/                        # Minuta, Actividades, Estatus, MinutaRepository,
│   │                                  # CrearMinutaUseCase, GetMinutasUseCase, SyncPendientesUseCase
│   └── ui/
│       ├── form/                      # MinutaFormScreen + MinutaFormViewModel
│       ├── list/                      # MinutaListScreen + MinutaListViewModel
│       ├── detail/                    # MinutaDetailScreen + MinutaDetailViewModel
│       └── components/                # ClienteDropdown, ActividadesSelector, FotoEvidencia
├── clientes/ {data, domain, ui}       # catálogo de clientes desde la API
├── perfil/   {data, domain, ui}       # datos del usuario, idioma, logout
└── admin/    {data, domain, ui}       # (opcional) validar minutas desde el móvil
```

**Reglas de dependencia:** `ui → domain ← data`. La UI nunca importa Retrofit, Room ni Firebase. El `Repository` implementa una interfaz del `domain`. Los `UseCase` orquestan. Los `dto` se mapean a modelos de dominio.

### 3.3 Backend — estructura por feature

```
backend/
├── src/
│   ├── server.ts / app.ts
│   ├── config/            # env.ts (zod), firebase.ts, swagger.ts, queue.ts
│   ├── middlewares/       # verifyToken, requireRole, errorHandler, validate(zod)
│   ├── auth/              # routes, controller, service, schema
│   ├── usuarios/          # routes, controller, service, repository, schema
│   ├── clientes/
│   ├── minutas/           # CRUD + cambio de estatus + subida de foto
│   ├── metricas/          # resumen para el dashboard
│   ├── eventos/           # productor RabbitMQ + consumidor + auditoría
│   └── docs/openapi.yaml  # o anotaciones swagger-jsdoc
├── tests/                 # Vitest + Supertest
├── Dockerfile
├── render.yaml
├── .env.example
└── package.json
```

**Endpoints mínimos (todos documentados en Swagger):**

| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| POST | `/api/v1/auth/google` | Verifica ID token de Google, devuelve sesión | público |
| GET | `/api/v1/auth/me` | Perfil del usuario autenticado | autenticado |
| GET | `/api/v1/minutas` | Lista con filtros, paginación y orden | autenticado |
| POST | `/api/v1/minutas` | Crea minuta (y publica evento) | operador |
| GET | `/api/v1/minutas/{id}` | Detalle | autenticado |
| PATCH | `/api/v1/minutas/{id}/estatus` | Autorizar / rechazar | gerente |
| POST | `/api/v1/minutas/{id}/foto` | Sube evidencia a Storage | operador |
| GET | `/api/v1/clientes` | Catálogo | autenticado |
| GET | `/api/v1/usuarios` | Lista | gerente |
| POST | `/api/v1/usuarios` | Alta (invita/crea perfil) | gerente |
| DELETE | `/api/v1/usuarios/{id}` | Baja lógica | gerente |
| GET | `/api/v1/metricas/resumen` | Totales para dashboard | gerente |
| GET | `/api/v1/eventos` | Eventos consumidos (evidencia de cola) | gerente |
| GET | `/docs` · `/openapi.json` | Swagger UI + contrato | público |

**Reglas de seguridad:** el backend usa Firebase Admin (service account en variables de entorno, **nunca en el repo**); Firestore se cierra a clientes (`allow read, write: if false`) y **solo la API** escribe. El rol se valida en `middlewares/requireRole.ts`. Validación de payloads con Zod. Rate limiting + Helmet + CORS.

### 3.4 Modelo de datos (Firestore)

```
usuarios/{uid}       { nombre, email, rol: "operador"|"gerente", activo, fechaAlta }
clientes/{id}        { nombre, direccion, contacto, activo }
minutas/{id}         { vendedorId, vendedorNombre, clienteId, clienteNombre,
                       fecha, hora, actividades: { talachear, semaforear,
                       recolectarDesecho, recolectarRenovado },
                       detalles, estatus: "Pendiente"|"Autorizado"|"Rechazado",
                       fotoUrl, resumenIA, createdAt, updatedAt, syncOrigen }
eventos/{id}         { tipo: "minuta.creada"|"minuta.autorizada", minutaId,
                       payload, consumidoEn, createdAt }
```

### 3.5 Flujo offline-first (clave para la demo)

```
UI → ViewModel → UseCase → Repository
                              ├── Room (guarda con estado "pendiente_sync")
                              ├── WorkManager (reintenta al recuperar red)
                              └── Retrofit → API → Firestore
```

Al crear una minuta sin internet: se guarda en Room y se muestra en la lista con un badge "Sin sincronizar". Al volver la red, `SyncPendientesUseCase` la sube, actualiza el ID local y borra el flag. **Esto se puede demostrar en vivo con modo avión** y es un diferenciador fuerte.

---

## 4. Matriz rúbrica → qué hacer exactamente

### 4.1 Criterios obligatorios (100 pts)

| Criterio | Qué falta hoy | Acciones concretas | Evidencia para el jurado |
|----------|---------------|--------------------|--------------------------|
| **Arquitectura & Lenguaje (15)** | Capas inexistentes | Refactor completo al árbol 3.2; Hilt; ViewModels; repositorios; entidades; servicios; tests | Árbol de paquetes en el README, diagrama de capas, fragmento de `MinutaRepository` vs `MinutaRepositoryImpl` |
| **Problema real (15)** | Flujo mínimo, foto perdida | Roles, historial, filtros, foto en Storage, resumen con IA, métricas, offline | Slide "antes/después", datos reales, demo de 3 roles |
| **API Cloud & Swagger (15)** | No existe | Backend Node/Express desplegado en Render con Swagger UI y OpenAPI 3 | URL `/docs` abierta en vivo + colección Postman |
| **BD Cloud (10)** | Firestore sin reglas, passwords planos | Firestore con reglas cerradas, índices y datos migrados; backend Admin SDK | Consola de Firestore, `firestore.rules`, captura de índices |
| **3rd Party (15)** | Ninguno explícito | Google Sign-In con Firebase Auth + llamada a Gemini desde el backend | Video del login con Google y respuesta de Gemini en la minuta |
| **Git (15)** | 1 commit, todo en main | Git Flow simplificado, 3 autores, PRs revisados, branch protection | Network graph, lista de PRs con 3 autores, `git shortlog -sne`, captura de reglas de rama |
| **Exposición (5)** | Sin slides | 8–10 diapositivas, ensayo cronometrado a 5 min | PDF de slides + cronómetro |
| **Demo (5)** | Parcial | Guion de 15 min, datos sembrados, respaldo en video | Ensayo general 2 veces |
| **Vestimenta (5)** | — | Acordar vestimenta formal | Foto del equipo |

### 4.2 Puntos extra (15 pts)

| Extra | Cómo ganarlo | Entregable | Pts |
|-------|--------------|-----------|-----|
| **NoSQL (+3)** | Firestore ya es NoSQL; formalizarlo con modelo, índices y consultas compuestas | Diagrama de colecciones + consola | 3 |
| **Colas (+3)** | RabbitMQ en CloudAMQP: `POST /minutas` publica `minuta.creada`; un worker consume, escribe `eventos` y envía notificación | Pestaña de RabbitMQ + endpoint `/eventos` + log del worker | 3 |
| **IA documentada (+3)** | `docs/AI_USAGE.md` con 6–8 prompts avanzados, decisiones, diffs y capturas; además Gemini genera el resumen de la minuta | Documento + commit refs + funcionalidad | 3 |
| **Room (+3)** | Room para caché + cola de pendientes con WorkManager | Demo en modo avión | 3 |
| **CI/CD + traducciones (+3)** | GitHub Actions (Android, backend, web) + `values-en/strings.xml`, selector de idioma y `locales_config.xml` | Checks verdes en un PR + cambio de idioma en vivo | 3 |
| **Total** | | | **+15** |

> Ojo: el extra de CI/CD **exige las dos cosas** (CI/CD **y** traducciones). No basta con una.

---

## 5. Plan de ejecución paso a paso

### Fase 0 — Preparación y orden (0.5 día)

**Objetivo:** dejar el repo listo para trabajar en equipo sin romper nada.

1. **Renombrar `master` → `main`** y poner `main` como rama por defecto en GitHub.
2. **Eliminar ramas huérfanas** (`Copia`, `CopiaHugo`, `Hugo`, `origin/copia-main`) tras verificar que no tienen trabajo único.
3. Crear `develop` desde `main`.
4. Crear `.github/`:
   - `PULL_REQUEST_TEMPLATE.md`
   - `CODEOWNERS`
   - `ISSUE_TEMPLATE/bug_report.md`, `feature_request.md`
   - `workflows/` (se llenan en la Fase 6)
5. Agregar `README.md` raíz con: problema, stack, arquitectura, cómo correr app/backend/web, variables de entorno, autores.
6. Agregar `CONTRIBUTING.md` con convención de ramas y commits.
7. Proteger `main` y `develop`: requerir PR, 1 aprobación, checks verdes, sin force-push, sin pushes directos.
8. Crear el tablero de GitHub Projects con el backlog de las fases 1–7 y asignar responsables.

**Comandos base:**

```bash
git checkout master
git branch -m master main
git push -u origin main
# En GitHub: Settings → Branches → cambiar default a main
git checkout -b develop
git push -u origin develop

# Limpieza de ramas viejas (solo si no tienen commits únicos)
git branch -d Copia CopiaHugo Hugo
git push origin --delete Copia CopiaHugo Hugo copia-main   # revisar antes
```

> ⚠️ No reescribir el commit inicial ni inventar historial. La evidencia de colaboración se construye **de ahora en adelante** con trabajo real.

---

### Fase 1 — Backend + autenticación (2 días)

**Rama:** `feature/backend-api` · **Responsable sugerido:** Integrante A · **Revisores:** B y C

1. Crear `backend/` con Node 20 + Express + TypeScript.
2. Configurar Firebase Admin con service account **por variable de entorno** (`FIREBASE_SERVICE_ACCOUNT` en base64 o `GOOGLE_APPLICATION_CREDENTIALS` en Render Secret Files).
3. Implementar `POST /auth/google`: recibe el ID token de Google, lo verifica con `admin.auth().verifyIdToken()`, crea/actualiza `usuarios/{uid}` con rol y devuelve el perfil + token de sesión.
4. Middleware `verifyToken` y `requireRole("gerente")`.
5. Configurar **Swagger**: `swagger-jsdoc` + `swagger-ui-express`, montar `/docs` y `/openapi.json`, con `bearerAuth`.
6. `GET /health` para el health check del hosting.
7. Tests de humo con Vitest + Supertest.
8. Desplegar en **Render** (o Railway) con variables de entorno y verificar URL pública.
9. Documentar en `backend/README.md` y `.env.example`.

**Criterio de aceptación:** `/docs` abre desde internet, el endpoint `/health` responde 200 y `POST /auth/google` valida un token real.

---

### Fase 2 — API de negocio + Firestore seguro (2 días)

1. CRUD de `minutas` con Zod, paginación (`?page=&limit=`), filtros (`estatus`, `cliente`, `vendedor`, rango de fechas) y orden.
2. `PATCH /minutas/{id}/estatus` con validación de rol y transición (`Pendiente → Autorizado/Rechazado`).
3. CRUD de `clientes` y `usuarios` (baja lógica).
4. `GET /metricas/resumen` (totales por estatus, por cliente, por día).
5. Subida de foto: `POST /minutas/{id}/foto` con `multer` → Firebase Storage → guardar `fotoUrl`.
6. **Reglas de Firestore** en `firestore.rules`: denegar acceso cliente; agregar `firebase.json` + reglas de Storage.
7. Índices compuestos (`firestore.indexes.json`).
8. Migrar los datos existentes: quitar el campo `contrasena`, asignar `uid`/rol a los usuarios actuales.
9. Ampliar Swagger con todos los endpoints, ejemplos y códigos de error.
10. Colección Postman exportada en `docs/`.

**Criterio de aceptación:** se puede crear, listar, filtrar y autorizar una minuta solo con la API documentada; Firestore rechaza escrituras directas del cliente.

---

### Fase 3 — Refactor Android a Screaming Architecture (3 días)

**Rama:** `feature/android-architecture` · **Responsable:** Integrante B

1. Reorganizar paquetes al árbol 3.2 y **corregir** `loginscreen.kt` (`package com.sago.minutas.auth.ui`).
2. Agregar dependencias: Hilt + KSP, Retrofit/OkHttp/kotlinx.serialization, Room + KSP, DataStore, WorkManager, Coil, lifecycle-viewmodel-compose, Google Credential Manager, Firebase Auth/Storage, AppCompat.
3. Crear `core/network` (`AuthInterceptor` que inyecta el token, `ApiResult`, `safeApiCall`) y `core/session/SessionManager` (DataStore).
4. Implementar `auth`: login con Google (Credential Manager), `LoginViewModel`, estado de sesión y **logout**.
5. Implementar `minutas`: DTOs, mappers, `MinutaApi`, `MinutaRepositoryImpl`, `MinutaDao`/`MinutaEntity`, casos de uso y `MinutaFormViewModel`/`MinutaListViewModel`.
6. Convertir `minutascreen.kt` en `MinutaFormScreen` + `components/` sin acceso directo a Firebase; estados `loading/error/success` y validación en el ViewModel.
7. Navegación por roles: operador → formulario/historial; gerente → bandeja de validación.
8. Aplicar `SagoTheme` en `MainActivity` y mover colores/tipografía a `core/ui`.
9. Mover **todos** los textos a `strings.xml`.
10. Agregar tests unitarios de ViewModel/UseCase y un test de UI de Compose para el formulario.

**Criterio de aceptación:** `grep -r "FirebaseFirestore" app/src/main` no devuelve nada en la capa UI; la app compila y el flujo login → crear → listar funciona contra la API.

---

### Fase 4 — Room, offline y foto (2 días)

1. Room: entidad `MinutaEntity`, `MinutaDao`, `SagoDatabase`, mapper `Entity ↔ Domain`.
2. Estrategia de lectura: Room primero (Flow) + refresh desde API; escritura: API y caché.
3. `WorkManager`: `SyncPendientesWorker` con restricción de red y backoff exponencial.
4. Foto: capturar con `TakePicturePreview` (o CameraX), comprimir, subir a Storage vía API y guardar `fotoUrl`.
5. Mostrar la foto en la lista y el detalle con Coil; manejo de error si falla la subida.
6. **Demo de modo avión:** crear minuta sin red → aparece "Sin sincronizar" → activar red → se sincroniza sola.

**Criterio de aceptación:** apagar datos, crear 2 minutas, cerrar la app, abrirla, reactivar red y ver las 2 minutas en Firestore con foto.

---

### Fase 5 — 3rd party, IA y colas (2 días)

**Rama:** `feature/third-party-ai-queue` · **Responsable:** Integrante A + C

1. **Google Sign-In** completo en Android (Credential Manager + Firebase Auth) → evidencia del criterio de 15 pts.
2. **Gemini API** desde el backend (`POST /minutas/{id}/resumen`): recibe cliente + actividades + notas y devuelve un resumen profesional; se guarda en `resumenIA` y se muestra en la app/dashboard. La API key vive solo en Render.
3. **RabbitMQ (CloudAMQP):**
   - `config/queue.ts` con conexión y canal.
   - Productor en `POST /minutas` y en `PATCH /estatus`.
   - Consumidor `eventos/consumer.ts` que escribe en `eventos` y (opcional) envía FCM al gerente.
   - `GET /eventos` para demostrar que el mensaje se consumió.
   - Si el hosting no permite worker separado, iniciar el consumidor en el mismo proceso y documentarlo.
4. Documentar en Swagger el endpoint de resumen y los eventos.

**Criterio de aceptación:** en vivo se ve un mensaje publicado y consumido, y una minuta con resumen generado por IA.

---

### Fase 6 — Panel web + CI/CD + traducciones (2 días)

**Rama:** `feature/web-ci-cd` · **Responsable:** Integrante C

1. Migrar el dashboard React de Firestore directo a la **API REST** (`fetch`/axios con token). Eliminar `firebase.js` o reducirlo a Auth.
2. Login real del panel con Google (misma cuenta/rol gerente).
3. Pantallas: bandeja de pendientes, historial, detalle con foto, métricas, usuarios.
4. Variables de entorno `VITE_API_URL`, `VITE_FIREBASE_*` (rotar la API key y restringirla por dominio).
5. **GitHub Actions:**
   - `android.yml`: JDK 17, caché Gradle, `ktlintCheck`, `testDebugUnitTest`, `lintDebug`, `assembleDebug`, artefacto APK; en `main` → Firebase App Distribution (opcional).
   - `backend.yml`: `npm ci`, `tsc --noEmit`, `vitest`, deploy hook de Render en `main`.
   - `web.yml`: `npm ci`, `npm run lint`, `npm run build`, deploy a Vercel/Firebase Hosting.
6. **Traducciones:** `values/strings.xml` (es) + `values-en/strings.xml`, `res/xml/locales_config.xml`, `android:localeConfig` en el manifest y selector de idioma en `perfil` con `AppCompatDelegate.setApplicationLocales`.
7. Activar los checks como obligatorios en la protección de ramas.

**Criterio de aceptación:** un PR muestra 3 checks verdes; la app cambia entre español e inglés sin reiniciar; el panel web funciona contra la URL pública.

---

### Fase 7 — Documentación, pruebas y cierre (1.5 días)

1. `README.md` raíz con diagramas (arquitectura, ER, flujo offline, CI/CD). Usar Mermaid.
2. `docs/API.md` (resumen + enlace a Swagger) y colección Postman.
3. `docs/AI_USAGE.md`: herramienta, prompts, resultados, revisión humana, capturas y commits.
4. `docs/EVIDENCIAS.md`: checklist con capturas de cada criterio (esto se convierte en las diapositivas).
5. Tests: unitarios (UseCases/ViewModels), integración de API (Supertest), UI de Compose (1–2 flujos).
6. Sembrar datos de demo (3 clientes, 2 usuarios, 8 minutas en distintos estatus).
7. Ensayo general cronometrado y **video de respaldo** de la demo.
8. Congelar `main` 24 h antes (`code freeze`), solo fixes críticos por PR.

---

## 6. Estrategia de Git y trabajo en equipo

### 6.1 Modelo de ramas (Git Flow simplificado)

```
main        ●────────●────────●────────●   (solo releases, protegida)
             \      / \      / \      /
develop       ●────●───●────●───●────●     (integración, protegida)
               \  /     \  /     \  /
feature/*       ●●       ●●       ●●       (una por tarea, PR a develop)
```

- `main`: lo que se presenta. Solo merges desde `develop`.
- `develop`: integración continua.
- `feature/<area>-<descripcion>`: ej. `feature/api-minutas`, `feature/android-room`, `feature/web-rest`, `feature/ci-translations`.
- `fix/<descripcion>` y `docs/<descripcion>` para cambios pequeños.
- Ramas cortas (≤ 3 días) y PRs pequeños (≤ 400 líneas si se puede).

### 6.2 Convención de commits (Conventional Commits)

```
feat(api): agregar endpoint de autorización de minutas
fix(android): corregir package de la pantalla de login
refactor(android): mover acceso a Firestore al repositorio
test(api): cubrir POST /minutas con Vitest
docs(readme): diagrama de arquitectura
ci(actions): pipeline de build y tests de Android
chore(deps): actualizar Firebase BOM
```

### 6.3 Flujo diario de cada integrante

```bash
git checkout develop
git pull origin develop
git checkout -b feature/api-minutas

# ... trabajo ...

git add .
git commit -m "feat(api): agregar CRUD de minutas"
git push -u origin feature/api-minutas
gh pr create --base develop --title "feat(api): CRUD de minutas" --body "Closes #12"
```

Reglas:
- **Nunca** `git push origin main` ni `develop` directo.
- Cada PR: descripción, captura/video, checklist, issue vinculada y **1 aprobación de otro integrante**.
- Revisar el PR de otro **antes** de pedir revisión del propio.
- Resolver conversaciones y hacer squash merge (o merge commit, pero consistente).
- Al menos **2 commits por integrante por semana** y participación en 2+ áreas.

### 6.4 Reparto sugerido (los 3 deben tener aportes en varias áreas)

| Integrante | Rol principal | Áreas donde también debe commitear |
|-----------|----------------|-----------------------------------|
| A | Backend, Firestore, Swagger, deploy, colas | Tests de API, docs, revisión de PRs de Android |
| B | Android: arquitectura, auth, UI, Room/offline | Traducciones, tests, revisión de PRs de web |
| C | Web, CI/CD, traducciones, QA | Consumo de API en Android, docs, revisión de PRs de backend |

> La rúbrica pide "aportes comprobables de los 3 integrantes". No basta con que cada uno tenga una rama: deben aparecer como **autores de commits** y como **autores/revisores de PRs** en GitHub.

### 6.5 Protección de ramas

En GitHub → Settings → Rules/Branches:
- Require a pull request before merging (1 approval).
- Require status checks: `android-ci`, `backend-ci`, `web-ci`.
- Require conversation resolution.
- Dismiss stale approvals.
- Block force pushes y deletions.

> Si el repo es privado y la cuenta gratuita no permite reglas, hagan el repo **público** (proyecto escolar) o usen GitHub Education; documenten la configuración con captura.

---

## 7. Cronograma (12 días hábiles, ~3 semanas)

| Día | Fase | Entregable verificable |
|-----|------|------------------------|
| 1 | 0 | Repo ordenado, `main`/`develop`, protección, README, backlog |
| 2–3 | 1 | Backend desplegado + `/docs` + auth Google |
| 4–5 | 2 | CRUD minutas/clientes/usuarios, fotos, reglas Firestore, Swagger completo |
| 6–8 | 3 | App refactorizada por features, ViewModels, repos, navegación por rol |
| 9–10 | 4 | Room + WorkManager + offline + foto persistida |
| 11 | 5 | Google Sign-In, Gemini, RabbitMQ productor/consumidor |
| 12 | 6 | Web contra API + 3 workflows verdes + traducciones |
| 13 | 7 | Docs, tests, datos de demo, ensayo y video de respaldo |
| 14 | — | Ensayo final + diapositivas + vestimenta |

**Versión comprimida (7 días):** backend + Swagger (2), refactor Android mínimo + Retrofit/ViewModels (2), Room + foto + Google Sign-In (1), CI/CD + traducciones (1), docs/demo (1). Las colas y Gemini se pueden dejar para el final si el tiempo aprieta (son extra).

> Regla de oro: **primero los 100 puntos, después los 15 extra**. No empezar por colas o IA si la API/Swagger no está lista.

---

## 8. Guion de exposición y demo

### 8.1 Diapositivas (máx. 5 min · 8–10 slides)

1. **Problema:** visitas de llantas sin evidencia, reportes en papel/WhatsApp, gerente sin visibilidad.
2. **Usuarios:** operador de campo y gerente.
3. **Solución:** app móvil + API + panel web.
4. **Arquitectura:** diagrama Android (Screaming) + backend + Firestore + Storage + cola.
5. **Demo:** qué se verá (3 bullets).
6. **API & Swagger:** captura y URL.
7. **BD & 3rd party:** colecciones, Firestore, Google Sign-In, Gemini.
8. **Extras:** Room/offline, RabbitMQ, CI/CD, traducciones, IA.
9. **Git:** network graph y PRs de los 3.
10. **Cierre:** impacto y aprendizajes.

### 8.2 Demo en vivo (máx. 15 min)

| Tiempo | Acción |
|--------|--------|
| 0:00–1:00 | Contexto del problema y roles |
| 1:00–2:30 | Login con Google (operador) |
| 2:30–5:00 | Crear minuta **en modo avión** con foto |
| 5:00–6:30 | Reactivar red → sincronización automática (Room + WorkManager) |
| 6:30–8:00 | Ver minuta con resumen de Gemini |
| 8:00–10:00 | Panel web: filtros, detalle, autorizar |
| 10:00–12:00 | Swagger: probar endpoints en vivo |
| 12:00–13:00 | Cola: evento publicado/consumido + notificación |
| 13:00–14:00 | CI/CD verde + cambio de idioma |
| 14:00–15:00 | Cierre y preguntas |

### 8.3 Plan de respaldo (no negociable)

- Video pregrabado de 5 min con el flujo completo.
- Backend "calentado" 10 min antes (Render free duerme) o plan de pago temporal.
- APK instalada en un segundo dispositivo.
- Datos sembrados y capturas de Firestore/Swagger por si falla el internet.
- Diapositivas en PDF y USB.
- Los 3 con ropa formal, llegando 15 min antes.

---

## 9. Checklist final de verificación

### Obligatorios
- [ ] 100% Kotlin + Jetpack Compose.
- [ ] Paquetes por feature (`auth`, `minutas`, `clientes`, `perfil`) con `data/domain/ui`.
- [ ] `ViewModel` + `Repository` + `UseCase` + `Entities` + `Services`; la UI no toca Firebase/Retrofit.
- [ ] API REST propia desplegada con URL pública.
- [ ] `/docs` Swagger UI funcional y `/openapi.json` válido.
- [ ] Firestore en la nube con reglas cerradas, índices y modelo documentado (no SQLite).
- [ ] Google Sign-In funcionando y token verificado por el backend.
- [ ] 3 integrantes con commits, ramas `feature/*` y PRs aprobados; `main` sin pushes directos.
- [ ] Diapositivas ≤ 5 min y demo ≤ 15 min ensayadas.
- [ ] Vestimenta formal confirmada.

### Extra
- [ ] Firestore NoSQL documentado (+3).
- [ ] RabbitMQ con evento real productor → consumidor (+3).
- [ ] `docs/AI_USAGE.md` con prompts y Gemini en producción (+3).
- [ ] Room + WorkManager + demo offline (+3).
- [ ] 3 workflows de GitHub Actions verdes **y** app en español/inglés con selector (+3).

### Calidad
- [ ] `README.md` con diagramas y pasos de ejecución.
- [ ] `docs/EVIDENCIAS.md` con capturas de cada criterio.
- [ ] Tests: unitarios + integración API + 1 UI.
- [ ] `.env.example` en backend y web; ningún secreto en el repo.
- [ ] Sin contraseñas en texto plano ni reglas de Firestore abiertas.
- [ ] `local.properties`, `node_modules`, `build/`, `.env` fuera de Git.

---

## 10. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Render free duerme y la demo falla | Alto | Ping/cron 10 min antes + video de respaldo |
| Refactor Android se come el tiempo | Alto | Congelar features 2 días antes; priorizar API + capas mínimas |
| Firestore con datos viejos inconsistentes | Medio | Script de migración y backup exportado |
| Un integrante concentra los commits | Alto (15 pts) | Reparto de la tabla 6.4 y revisión cruzada obligatoria |
| Traducciones a última hora | Medio | Extraer strings desde la Fase 3, no al final |
| Cola mal configurada el día de la demo | Bajo | Consumidor en el mismo proceso + logs visibles + `/eventos` |
| Fuga de credenciales | Alto | Service account solo en Render; rotar API key web; `.env` ignorado |

---

## 11. Primeros 5 comandos para arrancar hoy

```bash
# 1. Ver el estado actual
git status && git log --oneline --all

# 2. Ordenar ramas y crear develop
git branch -m master main
git checkout -b develop
git push -u origin main develop

# 3. Crear la estructura del backend
mkdir backend && cd backend && npm init -y
npm i express cors helmet morgan zod firebase-admin swagger-jsdoc swagger-ui-express
npm i -D typescript tsx vitest supertest @types/express @types/node

# 4. Primer feature branch
git checkout -b feature/backend-api
```

---

*Documento generado como plan de trabajo. La estimación de puntos es orientativa y debe validarse con el profesor antes de la entrega.*
