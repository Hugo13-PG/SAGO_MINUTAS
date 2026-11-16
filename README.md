# SAGO Minutas

Aplicación Android (Kotlin + Jetpack Compose) para que operadores de una empresa de llantas registren
**minutas de visitas a clientes**, más un panel web (React + Vite) para que el gerente las valide.

## El problema

Las visitas de servicio (talachear, semaforear, recolección de desecho y de renovado) se reportan por
WhatsApp o en papel. No hay evidencia fotográfica, trazabilidad ni una forma rápida de autorizar los
reportes. SAGO centraliza el registro en campo, la evidencia y la validación gerencial.

## Stack

| Componente | Tecnología |
|------------|------------|
| App móvil | Kotlin 2.2.10, Jetpack Compose (BOM 2026.02.01), Navigation Compose |
| App: datos | Firebase Firestore (actual), Firebase Auth (previsto) |
| Panel web | React 19, Vite 8, Firebase JS SDK |
| Build Android | Gradle 9.3.1, AGP 9.1.1, `minSdk 24`, `targetSdk 36` |
| Backend / API | **Pendiente (Fase 1):** Node.js + Express + Swagger |

## Estado actual (Fase 0)

- La app móvil funciona como MVP: login contra Firestore, formulario de minuta y captura de foto.
- El panel web lista, filtra y autoriza minutas.
- **Todavía no existe API REST ni Swagger**: la app y el panel escriben directo a Firestore.
- La foto se captura pero no se sube ni se guarda; el login compara contraseñas en texto plano.
- La arquitectura es monolítica (sin ViewModel/Repository). El plan de corrección está en
  [`docs/PLAN_CUMPLIMIENTO_RUBRICA.md`](docs/PLAN_CUMPLIMIENTO_RUBRICA.md).

> La Fase 0 no agrega funcionalidad: ordena el repositorio, el trabajo en equipo y las reglas de Git.

## Estructura

```text
.
├── app/                         # Módulo Android
│   ├── src/main/java/com/example/sgominutas/
│   │   ├── MainActivity.kt
│   │   ├── ui/theme/
│   │   └── uisago/screens/      # login + formulario de minuta
│   └── web/                     # Panel React (NO es módulo Gradle)
├── docs/                        # Plan, backlog y evidencias
├── gradle/libs.versions.toml
└── AGENTS.md                    # Guía para sesiones de OpenCode
```

## Requisitos

- Android Studio con SDK 36 instalado.
- JDK 17 o superior (Android Studio incluye uno en `jbr`).
- Node.js 20 o superior (solo para el panel web).

## Ejecutar la app Android

`java` no está en el `PATH` de Windows. Usa el JBR de Android Studio (ajusta la ruta si tu instalación
está en otra ubicación):

```powershell
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat assembleDebug
```

También puedes abrir la raíz del proyecto en Android Studio, sincronizar Gradle y ejecutar en un
emulador o dispositivo. El APK queda en `app/build/outputs/apk/debug/app-debug.apk`.

## Ejecutar el panel web

```powershell
cd app\web
npm install
npm run dev
```

`app/web` es un proyecto Vite independiente: no se agrega a `settings.gradle.kts`.

## Verificación antes de un PR

```powershell
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat testDebugUnitTest
.\gradlew.bat lintDebug

cd app\web
npm run lint
npm run build
```

## Seguridad

- `app/google-services.json` se versiona porque es configuración pública del cliente Firebase.
- **Nunca** subas service accounts, `.env` ni keystores. El `.gitignore` ya los excluye.
- Las contraseñas en texto plano y las reglas abiertas de Firestore son deuda técnica conocida:
  se eliminan en las fases 1–2.

## Equipo

- [@bryan171005](https://github.com/bryan171005)
- [@Hugo13-PG](https://github.com/Hugo13-PG)

## Documentación

- [`docs/FASE_0_PLAN.md`](docs/FASE_0_PLAN.md) — plan de trabajo de la fase actual.
- [`docs/FASE_1_PLAN.md`](docs/FASE_1_PLAN.md) — API, autenticación y Swagger.
- [`docs/PLAN_CUMPLIMIENTO_RUBRICA.md`](docs/PLAN_CUMPLIMIENTO_RUBRICA.md) — ruta a los 115 puntos.
- [`AGENTS.md`](AGENTS.md) — comandos y trampas del repositorio.
