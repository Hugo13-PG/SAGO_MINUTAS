# AGENTS.md — SAGO Minutas

Android app (Kotlin + Jetpack Compose) for field "minutas" (tire-service visit reports), plus a
standalone React/Vite admin dashboard in `app/web`. **No backend/API exists yet**: both clients talk
directly to Firebase Firestore. `docs/PLAN_CUMPLIMIENTO_RUBRICA.md` describes the target architecture
and task plan — it is the roadmap, not current code.

## Build & run (Windows / PowerShell)

`java` is not on PATH. The Gradle wrapper needs the Android Studio JBR:

```powershell
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat assembleDebug
```

- Toolchain: Gradle 9.3.1, AGP 9.1.1, Kotlin 2.2.10, compileSdk 36.1, minSdk 24, Java 11 bytecode.
- `local.properties` (`sdk.dir`) is machine-specific and gitignored.
- APK: `app/build/outputs/apk/debug/app-debug.apk`.
- Verified on 2026-11-13: `assembleDebug`, `testDebugUnitTest`, `lintDebug`, and the web
  `npm run lint` / `npm run build` all succeed. Android build only warns about deprecated `Divider` and
  `Modifier.menuAnchor()`.

## Tests, lint

```powershell
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat testDebugUnitTest
.\gradlew.bat testDebugUnitTest --tests "com.example.sgominutas.ExampleUnitTest"   # single test
.\gradlew.bat connectedDebugAndroidTest   # requires emulator/device
.\gradlew.bat lintDebug
```

Only the auto-generated `ExampleUnitTest` / `ExampleInstrumentedTest` exist (they assert `2 + 2 == 4`).
There is no CI: `.github/` does not exist.

## Web dashboard (`app/web`)

Standalone Vite app — **not** a Gradle module despite living under `app/`. Do not add it to
`settings.gradle.kts`.

```powershell
cd app\web
npm install        # node_modules is gitignored and not committed
npm run dev
npm run lint       # oxlint
npm run build
```

## Current architecture — do not mistake it for the target

- Namespace/applicationId: `com.example.sgominutas`. Source lives in `MainActivity.kt`, `ui/theme/`
  and `uisago/screens/`. There are no ViewModels, repositories, entities, DI or services yet.
- `uisago/screens/loginscreen.kt` declares `package com.example.sgominutas` even though its path is
  `.../uisago/screens/`. It compiles from the declaration; don't copy this pattern.
- All state, validation and Firestore calls sit inside composables (`loginscreen.kt`,
  `minutascreen.kt`). New logic should go behind a ViewModel/repository as described in the plan.
- Auth is inconsistent: `loginscreen.kt` compares plaintext passwords from Firestore
  (`usuarios.contrasena`) and saves the user name in SharedPreferences `SAGO_PREFS`/`usuario_activo`,
  while `MainActivity` picks the start destination from `FirebaseAuth.currentUser`. The custom login
  never signs in to Firebase Auth (the dependency is unused).
- The camera bitmap in `minutascreen.kt` stays in memory and is never uploaded or persisted.
- Photo capture uses `ActivityResultContracts.TakePicturePreview()`; no `CAMERA` permission is declared
  because it delegates to the system camera app. Switching to CameraX requires adding it.
- Composable strings are hardcoded except `app_name` in `res/values/strings.xml`.
  `SGOMINUTASTheme` exists but is not applied in `MainActivity`; SAGO colors are hardcoded per screen.
- Firestore collections currently used: `usuarios`, `minutas`. There is no `firestore.rules`.
- `app/google-services.json` is committed; the web Firebase config is hardcoded in
  `app/web/src/firebase.js`. Never add service-account keys or other secrets.

## Git reality

- Remote: `https://github.com/bryan171005/SAGO_MINUTAS.git`. Default branch is **`master`**, not `main`.
- The repo has **one commit total**; every branch (`master`, `Hugo`, `Copia`, `CopiaHugo`,
  `origin/copia-main`) points at it. The working tree is often on `CopiaHugo`.
- `.idea/` is tracked, so `git status` is usually dirty (e.g. `M .idea/misc.xml`). Don't include
  unrelated IDE churn in commits.
- No branch protection, PRs or CI. The plan proposes Git Flow (`main`/`develop`/`feature/*`); until it
  exists, don't push, rewrite history or create release branches without the user's confirmation.

## Before finishing a change

1. Android: `.\gradlew.bat assembleDebug` → `testDebugUnitTest` → `lintDebug`.
2. Web: `npm run lint` → `npm run build` inside `app/web`.
3. New backend/web dependencies: update `.gitignore` (root lacks `node_modules` and `.env`; the web
   folder has its own `.gitignore`).
