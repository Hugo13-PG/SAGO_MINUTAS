# Contrato de API — OpenAPI 3.0.3

Contrato de la **Fase 1**. Es la fuente de verdad de la API: define rutas, request, response y errores.
Todavía no hay código que lo implemente; cuando exista `backend/`, este bloque se copia tal cual a
`backend/openapi.yaml` y Swagger lo publica en `/docs`.

- **Cubre:** `GET /health`, `POST /api/v1/auth/google`, `GET /api/v1/auth/me`.
- **No cubre todavía:** minutas, clientes, usuarios, fotos (Fase 2).
- **Autenticación:** `Authorization: Bearer <Firebase ID token>` (no el token crudo de Google).

---

```yaml
openapi: 3.0.3
info:
  title: SAGO Minutas API
  version: 0.1.0
  description: |
    API REST de SAGO Minutas.

    **Fase 1** expone únicamente identidad: salud del servicio y autenticación
    con Google a través de Firebase Auth. El CRUD de minutas llega en la Fase 2.

    El header `Authorization` debe llevar un **Firebase ID token**
    (`user.getIdToken()`), no el token crudo de Google.
servers:
  - url: http://localhost:3000
    description: Desarrollo local
  - url: https://sago-api.onrender.com
    description: Producción (Render)
tags:
  - name: Health
    description: Estado del servicio
  - name: Auth
    description: Identidad y perfiles

paths:
  /health:
    get:
      tags: [Health]
      operationId: getHealth
      summary: Estado del servicio
      description: No toca Firebase. Responde 200 mientras el proceso esté vivo.
      security: []
      responses:
        "200":
          description: Servicio disponible
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Health"
              example:
                status: ok
                uptime: 123.45
                timestamp: "2026-11-13T18:00:00.000Z"

  /api/v1/auth/google:
    post:
      tags: [Auth]
      operationId: loginWithGoogle
      summary: Iniciar sesión con Google
      description: |
        Verifica un Firebase ID token, crea o actualiza `usuarios/{uid}` y
        devuelve el perfil con su rol (`operador` o `gerente`).
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [idToken]
              properties:
                idToken:
                  type: string
                  description: Firebase ID token obtenido en el cliente
                  example: eyJhbGciOiJSUzI1NiIsImtpZCI6...
      responses:
        "200":
          description: Perfil del usuario
          content:
            application/json:
              schema:
                type: object
                required: [usuario]
                properties:
                  usuario:
                    $ref: "#/components/schemas/Usuario"
        "400":
          $ref: "#/components/responses/ValidationError"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"
        "500":
          $ref: "#/components/responses/InternalError"

  /api/v1/auth/me:
    get:
      tags: [Auth]
      operationId: getMe
      summary: Perfil del usuario autenticado
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Perfil del usuario
          content:
            application/json:
              schema:
                type: object
                required: [usuario]
                properties:
                  usuario:
                    $ref: "#/components/schemas/Usuario"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"
        "500":
          $ref: "#/components/responses/InternalError"

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: Firebase ID token (`user.getIdToken()`)

  schemas:
    Health:
      type: object
      required: [status, uptime, timestamp]
      properties:
        status:
          type: string
          enum: [ok]
        uptime:
          type: number
          format: float
        timestamp:
          type: string
          format: date-time

    Usuario:
      type: object
      required: [uid, nombre, email, rol, activo, proveedor, fechaAlta, ultimoAcceso]
      properties:
        uid:
          type: string
          description: Coincide con el UID de Firebase Auth
        nombre:
          type: string
        email:
          type: string
          format: email
        rol:
          type: string
          enum: [operador, gerente]
        activo:
          type: boolean
        proveedor:
          type: string
          enum: [google]
        fechaAlta:
          type: string
          format: date-time
        ultimoAcceso:
          type: string
          format: date-time

    Error:
      type: object
      required: [error]
      properties:
        error:
          type: object
          required: [code, message]
          properties:
            code:
              type: string
              enum:
                - VALIDATION_ERROR
                - UNAUTHORIZED
                - FORBIDDEN
                - NOT_FOUND
                - NOT_IMPLEMENTED
                - INTERNAL_ERROR
            message:
              type: string

  responses:
    ValidationError:
      description: Datos de entrada inválidos
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
          example:
            error:
              code: VALIDATION_ERROR
              message: "idToken es obligatorio"
    Unauthorized:
      description: Token ausente, inválido o expirado
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
          example:
            error:
              code: UNAUTHORIZED
              message: "Token inválido o expirado"
    Forbidden:
      description: Usuario inactivo o sin el rol requerido
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
          example:
            error:
              code: FORBIDDEN
              message: "Usuario inactivo"
    InternalError:
      description: Error inesperado del servidor
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
          example:
            error:
              code: INTERNAL_ERROR
              message: "Error interno del servidor"
```

---

## Cómo usarlo

### Ahora (sin backend)

1. Copiar el bloque YAML a <https://editor.swagger.io>.
2. Debe renderizar tres endpoints: `GET /health`, `POST /api/v1/auth/google`, `GET /api/v1/auth/me`.
3. Si aparece un error, revisa la indentación: **2 espacios, nunca tabuladores**.

### Cuando exista `backend/`

1. Guardar el bloque como `backend/openapi.yaml` (raíz de `backend/`, no dentro de `src/`).
2. `swagger.ts` lo lee con `js-yaml` y lo publica en `GET /docs` y `GET /openapi.json`.
3. Los routers de Express deben devolver exactamente lo que este contrato promete.

### Validación por terminal

```powershell
npx --yes @redocly/cli@latest lint openapi.yaml
npx --yes @redocly/cli@latest preview-docs openapi.yaml
```

---

## Reglas del contrato

| Regla | Motivo |
|---|---|
| Las claves de código HTTP van entre comillas (`"200"`) | OpenAPI exige string; YAML interpretaría `200` como número |
| Rutas públicas llevan `security: []` | Si no, Swagger pide token en `/health` |
| `/auth/google` no usa Bearer | El login ocurre antes de tener token |
| Errores siempre con `{ error: { code, message } }` | Un solo formato para todos los clientes |
| `401` = no sé quién eres · `403` = sé quién eres, pero no puedes pasar | Evita ambigüedad en el cliente |
| No documentar endpoints que aún no existen | Swagger mostraría rutas que devuelven 404 |

---

## Códigos de error

| HTTP | `code` | Cuándo |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Falta `idToken`, body vacío o JSON mal formado |
| `401` | `UNAUTHORIZED` | Token ausente, inválido, expirado o sin email |
| `403` | `FORBIDDEN` | Usuario con `activo: false` o sin el rol requerido |
| `404` | `NOT_FOUND` | Ruta inexistente |
| `501` | `NOT_IMPLEMENTED` | Endpoint declarado pero aún sin implementar |
| `500` | `INTERNAL_ERROR` | Falla inesperada del servidor |

---

## Estado

- [x] Contrato escrito.
- [ ] Validado en Swagger Editor / Redocly.
- [ ] Copiado a `backend/openapi.yaml` cuando exista el backend.
- [ ] Implementado por los routers (`WP1` y `WP2`).
- [ ] Publicado en `/docs` de producción.
