# Fase 0 — Preparar el repositorio y el trabajo en equipo

**Duración estimada:** 3.5 h · **Equipo:** Bryan (`@bryan171005`, dueño del repo) y Hugo
(`@Hugo13-PG`) · **Código de producto:** ninguno

El objetivo no es agregar funcionalidad, sino dejar `main`, `develop`, las reglas de Git, la
documentación base y el tablero listos para que las fases 1–7 se trabajen con PRs reales. La rúbrica
premia "aportes comprobables de los 3 integrantes, ramas y Pull Requests": esta fase es la que empieza
a generar esa evidencia.

> ⚠️ La rúbrica exige **3 integrantes**. Si el equipo real es de 2, el criterio de Git puede quedar en
> parcial (7.5/15). Conviene sumar a un tercero como colaborador/revisor antes de la Fase 1. Si el
> dueño del repo no es Bryan, ajusta los nombres: las tareas de administración las hace quien tenga
> rol **Admin** en GitHub.

---

## 1. Definition of Done de la fase

- [ ] `main` es la rama por defecto y está protegida.
- [ ] `develop` existe y está protegida.
- [ ] `master` y las ramas viejas (`Copia`, `CopiaHugo`, `Hugo`, `copia-main`) fueron eliminadas.
- [ ] `README.md`, `CONTRIBUTING.md`, plantillas de PR/issues y `.editorconfig` están en `develop`.
- [ ] Ambos integrantes pueden clonar, compilar la app y construir el panel web.
- [ ] El tablero tiene columnas, labels, milestones y el backlog de las fases 0–7.
- [ ] Cada integrante tiene **al menos 1 PR fusionado y 1 revisión aprobada**.
- [ ] `docs/EVIDENCIAS.md` tiene capturas de protección de ramas, PRs, tablero y network graph.
- [ ] Existe el tag `v0.1.0-fase0`.
- [ ] Nadie hizo push directo a `main` ni a `develop`.

---

## 2. Reparto del trabajo (2 personas)

| Tarea | Bryan (dueño / Admin) | Hugo (documentación y gestión) |
|-------|-----------------------|-------------------------------|
| Kickoff, backup y verificación de commits | Ejecuta | Verifica |
| Renombrar `master` → `main` y cambiar la rama por defecto | Ejecuta | — |
| Borrar `master` remoto y crear `develop` | Ejecuta | — |
| Agregar a Hugo como colaborador (Write) | Ejecuta | Acepta invitación |
| Configurar protección de `main` y `develop` | Ejecuta | Verifica con captura |
| Commit del scaffolding (`README`, `CONTRIBUTING`, plantillas, `.gitignore`, `.editorconfig`) | Revisor | Autor (los archivos ya están en su equipo) |
| Labels, milestones y tablero | — | Autor |
| `docs/BACKLOG.md` | Autor | Revisor |
| `docs/EVIDENCIAS.md` | Revisor | Autor |
| Limpieza de ramas locales viejas | — | Ejecuta |
| Compilar Android y web en su máquina | Verifica | Verifica |
| PR de release `develop` → `main` y tag | Autor | Revisor |

Regla de oro: **cada PR lo aprueba la otra persona**. Nadie aprueba su propio PR.

---

## 3. Cronograma de la sesión (3.5 h)

| Hora | Actividad | Responsable |
|------|-----------|-------------|
| 0:00–0:20 | Kickoff, backup, confirmar que todas las ramas apuntan al mismo commit | Ambos |
| 0:20–0:50 | Bryan: renombrar ramas, default `main`, `develop`, colaborador, protección. Hugo: preparar commit local | Bryan / Hugo |
| 0:50–1:10 | Hugo: push de `chore/fase-0-scaffolding` y PR a `develop`. Bryan: revisar | Hugo / Bryan |
| 1:10–1:40 | Bryan fusiona el PR de scaffolding. Hugo crea labels, milestones y tablero | Ambos |
| 1:40–2:20 | Bryan: `docs/BACKLOG.md` + issues. Hugo: `docs/EVIDENCIAS.md` | Paralelo |
| 2:20–2:50 | Revisión cruzada de los dos PRs y merge | Ambos |
| 2:50–3:10 | Release `develop` → `main`, tag y verificación final | Bryan |
| 3:10–3:30 | Evidencias, retro de 10 min y preparación de la Fase 1 | Ambos |

Si solo disponen de 2 h: hagan kickoff, ramas, protección, scaffolding y tablero; dejen `BACKLOG.md`
y `EVIDENCIAS.md` como primer trabajo de la siguiente sesión (siguen siendo Fase 0).

---

## 4. Paso a paso — Bryan (administración del repo)

### 4.1 Backup y diagnóstico (15 min)

```powershell
# Guardar una copia de toda la historia antes de tocar ramas
git bundle create "$env:TEMP\sago-backup.bundle" --all

git fetch --all --prune
git log --all --oneline --graph --decorate
git rev-list --count --all          # debe dar 1
git branch -a
```

Confirmen que `master`, `Copia`, `CopiaHugo`, `Hugo` y `origin/copia-main` apuntan al **mismo commit**
(`0a771`). Si alguna tuviera un commit único, **no la borren**: avisen y se integra primero.

### 4.2 Renombrar `master` → `main`

```powershell
git branch -m master main
git push -u origin main
```

Ahora, **en GitHub** (no hay `gh` instalado):

1. Settings → General → Default branch → cambiar a `main` → Update.
2. Verificar que `main` aparece como default en la página del repo.
3. **Solo entonces** borrar la rama remota vieja:

```powershell
git push origin --delete master
```

> Si GitHub no deja borrar `master`, es porque el default todavía no cambió. No fuerces nada.

### 4.3 Crear `develop`

```powershell
git checkout main
git pull origin main
git checkout -b develop
git push -u origin develop
```

### 4.4 Agregar a Hugo como colaborador

Settings → Collaborators → **Add people** → `Hugo13-PG` → rol **Write**. Hugo debe aceptar la
invitación antes de poder hacer push.

> Si el repo es público, Hugo puede clonarlo sin invitación, pero igual necesita Write para push.

### 4.5 Proteger `main` y `develop`

Settings → Branches (o Rulesets) → New rule:

- Branch name pattern: `main` (repetir para `develop`).
- ✅ Require a pull request before merging.
- ✅ Require approvals: **1**.
- ✅ Dismiss stale pull request approvals when new commits are pushed.
- ✅ Require conversation resolution before merging.
- ✅ Block force pushes.
- ✅ Restrict deletions.
- ❌ No permitir bypass (salvo administrador en una emergencia documentada).

Si el repo es privado y el plan gratuito no muestra estas opciones: hagan el repo **público**
(proyecto escolar), usen GitHub Education, o documenten la limitación con captura. Sin protección, la
evidencia de Git pierde fuerza.

### 4.6 Borrar las ramas remotas viejas

```powershell
git push origin --delete CopiaHugo copia-main
git remote set-head origin -a
```

`origin/master` ya se borró en 4.2. Las ramas `Copia` y `Hugo` solo existen en la máquina de Hugo; él
las limpia en 5.5.

### 4.7 Revisar el PR de scaffolding de Hugo

Cuando Hugo abra `chore/fase-0-scaffolding` → `develop`:

- Verifica que no incluya `.idea/misc.xml` ni secretos.
- Comprueba que los comandos del README funcionan.
- Aprueba y fusiona con **Squash and merge**.

### 4.8 Crear `docs/BACKLOG.md` y los issues

```powershell
git checkout develop
git pull origin develop
git checkout -b docs/fase-0-backlog
```

Crea `docs/BACKLOG.md` con:

| ID | Título | Fase | Área | Responsable | Estimación | Depende de | Criterio de aceptación |
|----|--------|------|------|-------------|------------|------------|------------------------|

Incluye el backlog de la sección 7. Luego:

```powershell
git add docs/BACKLOG.md
git commit -m "docs: agregar backlog priorizado por fases"
git push -u origin docs/fase-0-backlog
```

Abre el PR contra `develop` y pide revisión a Hugo. Además, crea los issues de la sección 7 en GitHub
(asígnalos al tablero y a un milestone).

### 4.9 Release de la fase

Al final, cuando los PRs de Hugo y tuyo estén en `develop`:

1. Abre el PR `develop` → `main` con título `release: fase 0`.
2. Hugo revisa y aprueba.
3. Merge con squash.
4. Crear el tag:

```powershell
git checkout main
git pull origin main
git tag -a v0.1.0-fase0 -m "Fase 0: repositorio y colaboracion listos"
git push origin v0.1.0-fase0
```

### 4.10 Verificar el build en tu máquina

```powershell
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat assembleDebug
.\gradlew.bat testDebugUnitTest
.\gradlew.bat lintDebug

cd app\web
npm install
npm run lint
npm run build
```

Guarda captura de `BUILD SUCCESSFUL` en `docs/evidencias/fase-0/`.

---

## 5. Paso a paso — Hugo (scaffolding, tablero y evidencias)

### 5.1 Aceptar la invitación y sincronizar (10 min)

Acepta la invitación de colaborador. Después:

```powershell
git fetch --all --prune

# Alinear el nombre de la rama local con el remoto
git branch -m master main 2>$null

git checkout -b chore/fase-0-scaffolding origin/develop
git status --short
```

Debes ver los archivos nuevos (`README.md`, `CONTRIBUTING.md`, `.github/`, etc.) y `.idea/misc.xml`
modificado. **No agregues `.idea/misc.xml`.**

### 5.2 Commit y PR del scaffolding

```powershell
git add README.md CONTRIBUTING.md .editorconfig .gitignore .github AGENTS.md docs
git status --short
# Verifica que .idea/misc.xml NO esté en la lista de archivos preparados

git commit -m "chore(repo): agregar documentacion base y plantillas de colaboracion"
git push -u origin chore/fase-0-scaffolding
```

En GitHub: **Pull requests → New pull request**, base `develop` ← compare
`chore/fase-0-scaffolding`. Título: `chore(repo): base documental y plantillas`. Asigna a Bryan como
reviewer. No fusiones hasta que él apruebe.

### 5.3 Labels

Issues → Labels → New label. Crear:

| Label | Color sugerido |
|-------|----------------|
| `area:android` | `#1D76DB` |
| `area:api` | `#0E8A16` |
| `area:web` | `#5319E7` |
| `area:db` | `#B60205` |
| `area:docs` | `#FBCA04` |
| `area:ci` | `#006B75` |
| `type:feature` | `#A2EEEF` |
| `type:bug` | `#D73A4A` |
| `type:task` | `#C5DEF5` |
| `priority:high` | `#B60205` |
| `priority:medium` | `#FBCA04` |
| `priority:low` | `#0E8A16` |

### 5.4 Milestones y tablero

Issues → Milestones: `Fase 0 — Repositorio`, `Fase 1 — API + Swagger`, `Fase 2 — API de negocio`,
`Fase 3 — Arquitectura Android`, `Fase 4 — Room/offline`, `Fase 5 — 3rd party + IA + colas`,
`Fase 6 — Web + CI/CD + i18n`, `Fase 7 — Documentación y demo`.

Projects → New project → **Board**. Estados: `Backlog`, `Ready`, `In progress`, `In review`, `Done`.

### 5.5 Limpiar ramas locales viejas

```powershell
git checkout develop
git pull origin develop

git branch -d Copia CopiaHugo Hugo
# Si alguna se resiste porque Git no la considera fusionada:
git branch -D Copia CopiaHugo Hugo
```

Al final, `git branch -a` debe mostrar `main`, `develop` y las ramas de trabajo nuevas.

### 5.6 Crear `docs/EVIDENCIAS.md`

```powershell
git checkout develop
git pull origin develop
git checkout -b docs/fase-0-evidencias
```

Contenido mínimo: una tabla por criterio de la rúbrica con
`Criterio | Peso | Evidencia | Enlace/captura | Estado`, y la carpeta `docs/evidencias/fase-0/`
(crea un `.gitkeep` para que se versione). Incluye:

- captura de la rama por defecto `main`;
- captura de las reglas de protección de `main` y `develop`;
- lista de PRs con los dos autores;
- network graph;
- tablero con labels/milestones;
- `BUILD SUCCESSFUL` de ambas máquinas.

```powershell
git add docs/EVIDENCIAS.md docs/evidencias
git commit -m "docs: agregar matriz de evidencias de la rubrica"
git push -u origin docs/fase-0-evidencias
```

PR contra `develop`, reviewer Bryan.

### 5.7 Verificar el build en tu máquina

```powershell
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat assembleDebug
.\gradlew.bat testDebugUnitTest
.\gradlew.bat lintDebug

cd app\web
npm install
npm run lint
npm run build
```

Si algo falla, el problema es de entorno, no de código: revisa SDK 36, `local.properties` y que
`JAVA_HOME` apunte al JBR. Reporta el error en el PR/issue; no lo arregles en silencio.

---

## 6. Rutina diaria a partir de ahora

```powershell
# 1. Actualizar develop
git checkout develop
git pull origin develop

# 2. Elegir un issue del tablero y moverlo a "In progress"
git checkout -b feature/api-health

# 3. Trabajar y verificar
.\gradlew.bat assembleDebug
.\gradlew.bat testDebugUnitTest

# 4. Commit y push
git add <archivos>
git commit -m "feat(api): agregar endpoint de salud"
git push -u origin feature/api-health

# 5. PR a develop, reviewer = compañero, esperar aprobación
# 6. Mover a "Done", borrar la rama
```

Reglas de convivencia:

- Un issue = una rama = un PR.
- PRs de menos de ~400 líneas; si es más grande, divídelo.
- Revisar el PR del compañero **el mismo día**.
- No mezclar refactors con features.
- Si un cambio toca Firestore, ramas o despliegue, lo hace una persona y la otra revisa en vivo.

---

## 7. Backlog inicial (para crear los issues)

**Fase 0**
- `F0-01` Renombrar `master` a `main` y crear `develop`
- `F0-02` Configurar protección de ramas
- `F0-03` README, CONTRIBUTING y plantillas
- `F0-04` `.gitignore` y `.editorconfig`
- `F0-05` Labels, milestones y tablero
- `F0-06` Backlog y matriz de evidencias
- `F0-07` Verificar build Android y web en ambas máquinas

**Fase 1 — API + Swagger**
- `F1-01` Esqueleto del backend (Express + TypeScript) y `/health`
- `F1-02` Firebase Admin con service account por variables de entorno
- `F1-03` Login con Google + middleware `verifyToken`
- `F1-04` Swagger UI y OpenAPI 3 en `/docs`
- `F1-05` Despliegue en Render/Railway y URL pública

**Fase 2 — API de negocio**
- `F2-01` CRUD de minutas con filtros y paginación
- `F2-02` Cambio de estatus con roles
- `F2-03` CRUD de clientes y usuarios
- `F2-04` Subida de foto a Firebase Storage
- `F2-05` Reglas de Firestore e índices
- `F2-06` Migración de datos y eliminación de contraseñas planas
- `F2-07` Swagger completo + colección Postman

**Fase 3 — Arquitectura Android**
- `F3-01` Dependencias Hilt, Retrofit, Room, DataStore, WorkManager
- `F3-02` Reorganizar paquetes por feature
- `F3-03` Auth: ViewModel + repositorio + sesión
- `F3-04` Minutas: DTOs, mappers, repositorio y ViewModels
- `F3-05` Navegación por roles
- `F3-06` Tema SAGO y extracción de strings
- `F3-07` Tests de ViewModel/UseCase

**Fase 4 — Room y offline**
- `F4-01` Entidades, DAO y base Room
- `F4-02` Cola de sincronización con WorkManager
- `F4-03` Foto persistida en Storage
- `F4-04` Demo en modo avión

**Fase 5 — 3rd party, IA y colas**
- `F5-01` Google Sign-In en Android
- `F5-02` Resumen con Gemini desde el backend
- `F5-03` Productor/consumidor RabbitMQ
- `F5-04` Endpoint `/eventos` y evidencia

**Fase 6 — Web, CI/CD e i18n**
- `F6-01` Panel web contra la API REST
- `F6-02` Workflow de Android
- `F6-03` Workflow del backend
- `F6-04` Workflow del panel web
- `F6-05` Traducciones es/en + selector

**Fase 7 — Cierre**
- `F7-01` README con diagramas
- `F7-02` `docs/AI_USAGE.md`
- `F7-03` `docs/EVIDENCIAS.md` completo
- `F7-04` Tests de integración y UI
- `F7-05` Datos de demo
- `F7-06` Ensayo, video de respaldo y diapositivas

---

## 8. Riesgos y decisiones

| Riesgo | Mitigación |
|--------|------------|
| Hugo no tiene permisos de admin | Las tareas de Settings las hace Bryan; el resto se reparte igual |
| El repo privado no permite protección de ramas | Hacerlo público, usar GitHub Education o documentar la limitación |
| `master` no se puede borrar | Cambiar primero la rama por defecto a `main` en GitHub |
| Una rama vieja tiene commits únicos | No borrarla; integrarla primero y documentar |
| El equipo real es de 2, pero la rúbrica pide 3 | Sumar al tercero como colaborador/revisor o asumir que Git queda en parcial (7.5/15) |
| Se rompe el build al tocar Gradle | La Fase 0 no cambia dependencias ni código de producto |

---

## 9. Qué NO se hace en esta fase

- No agregar API, Room, Hilt ni dependencias nuevas.
- No cambiar reglas de Firestore ni datos.
- No reescribir el commit inicial ni inventar historial.
- No hacer force push.
- No mergear nada sin revisión del compañero.

---

## 10. Primeros 30 minutos (resumen ejecutable)

1. **Bryan:** backup, `git branch -m master main`, `git push -u origin main`, cambiar default en
   GitHub, `git push origin --delete master`, crear y subir `develop`, invitar a Hugo, proteger ramas.
2. **Hugo:** aceptar invitación, `git fetch --prune`, crear
   `chore/fase-0-scaffolding` desde `origin/develop`, commitear solo los archivos de la fase, push y PR.
3. **Bryan:** revisar y fusionar el PR.
4. **Hugo:** labels, milestones, tablero y `docs/EVIDENCIAS.md`.
5. **Bryan:** `docs/BACKLOG.md`, issues y release `develop` → `main` + tag.
