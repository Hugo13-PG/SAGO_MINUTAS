# Contribuir a SAGO Minutas

## Modelo de ramas

```text
main      ← solo releases (PR desde develop, aprobado por el otro integrante)
develop   ← integración (PR desde feature/*, aprobado por el otro integrante)
feature/* ← una tarea o issue
fix/*     ← correcciones
docs/*    ← documentación
chore/*   ← configuración, dependencias, CI
```

Reglas:

- **Nunca** hagas push directo a `main` ni a `develop`.
- Una rama por issue. Ramas cortas: máximo 3 días.
- Sincroniza antes de empezar: `git checkout develop && git pull origin develop`.
- Borra la rama después de fusionar el PR.

## Commits (Conventional Commits)

```text
feat(android): agregar pantalla de historial
fix(api): validar rol en cambio de estatus
refactor(android): mover Firestore al repositorio
test(api): cubrir creación de minutas
docs(readme): documentar variables de entorno
ci(actions): agregar pipeline de Android
chore(deps): actualizar Compose BOM
```

Formato: `tipo(área): descripción en imperativo, minúsculas`.

Áreas: `android`, `api`, `web`, `db`, `ci`, `docs`, `repo`.

## Pull Requests

1. Abre el PR contra `develop` (nunca contra `main`, salvo el release de fase).
2. Usa la plantilla y vincula el issue (`Closes #12`).
3. El otro integrante debe revisar y aprobar. **Nadie aprueba su propio PR.**
4. Todos los checks deben estar en verde (cuando exista CI).
5. Squash merge y borra la rama.

Con dos personas, el revisor siempre es el compañero. Si el PR es del dueño del repo, el compañero
igual debe aprobarlo.

## Definition of Done

Un cambio está terminado cuando:

- [ ] Compila: `.\gradlew.bat assembleDebug` (o `npm run build` en web).
- [ ] Pasan los tests y el lint aplicables.
- [ ] Tiene al menos un test nuevo si agrega lógica.
- [ ] No incluye secretos ni archivos generados (`build/`, `node_modules/`, `.env`).
- [ ] Actualiza la documentación si cambia comandos, endpoints o variables.
- [ ] El PR fue revisado y aprobado por el otro integrante.
- [ ] La evidencia quedó registrada en `docs/EVIDENCIAS.md` si aplica a la rúbrica.

## Estilo de código

- Kotlin: estilo oficial, 4 espacios, sin imports comodín nuevos.
- Compose: un composable por pantalla + componentes reutilizables en `components/`.
- Textos visibles en `res/values/strings.xml`; no hardcodear en composables.
- JavaScript/React: 2 espacios, componentes funcionales, `npm run lint` limpio.
- No mezcles refactors grandes con features en el mismo PR.

## Issues y tablero

- Todo trabajo nace de un issue con label de área (`area:android`, `area:api`, `area:web`, `area:docs`)
  y tipo (`type:feature`, `type:bug`, `type:task`).
- Estados del tablero: **Backlog → Ready → In progress → In review → Done**.
- Un issue = una rama = un PR.
