import express from "express";
import type { Express } from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { crearAuthController } from "../src/auth/auth.controller";
import { crearAuthService } from "../src/auth/auth.service";
import type { TokenVerificado } from "../src/auth/auth.service";
import { crearMiddlewareAuth, crearRequiereRol } from "../src/middlewares/auth";
import { errorHandler } from "../src/middlewares/error";
import type { UsuariosRepository } from "../src/usuarios/usuarios.repository";
import type { UsuarioPerfilExistente } from "../src/usuarios/usuario.types";

const TOKEN_VALIDO = "token-valido-de-prueba";
const BEARER = { Authorization: `Bearer ${TOKEN_VALIDO}` };

/** Repositorio en memoria con contador de escrituras y opcion de simular fallo. */
function crearRepoFalso(inicial: UsuarioPerfilExistente[] = []) {
  const docs = new Map(inicial.map((u) => [u.uid, { ...u }]));
  let escrituras = 0;
  let fallarLectura = false;

  const repo: UsuariosRepository = {
    async obtenerPorUid(uid) {
      if (fallarLectura) {
        throw new Error("firestore caido");
      }
      return docs.get(uid) ?? null;
    },
    async guardar(uid, perfil) {
      escrituras += 1;
      docs.set(uid, { ...perfil });
    },
  };

  return {
    repo,
    docs,
    escrituras: () => escrituras,
    fallarLectura: () => {
      fallarLectura = true;
    },
  };
}

function crearVerificador(token: TokenVerificado, fallar = false) {
  return async (recibido: string): Promise<TokenVerificado> => {
    if (fallar || recibido !== TOKEN_VALIDO) {
      throw new Error("auth/id-token-expired");
    }
    return token;
  };
}

interface OpcionesApp {
  token?: TokenVerificado;
  documentos?: UsuarioPerfilExistente[];
  adminEmails?: string[];
  fallarVerificacion?: boolean;
}

/** App de prueba: mismos middlewares y controladores, pero sin Firebase. */
function crearAppDePrueba(opciones: OpcionesApp = {}) {
  const {
    token = { uid: "u1", email: "user@test.com", name: "Usuario" },
    documentos = [],
    adminEmails = [],
    fallarVerificacion = false,
  } = opciones;

  const falso = crearRepoFalso(documentos);
  const verificar = crearVerificador(token, fallarVerificacion);

  const service = crearAuthService({
    verificarIdToken: verificar,
    usuarios: falso.repo,
    adminEmails,
  });
  const controller = crearAuthController({ service });
  const requiereAuth = crearMiddlewareAuth({ verificarIdToken: verificar });
  const requireRol = crearRequiereRol({ usuarios: falso.repo });

  const app: Express = express();
  app.use(express.json());

  app.post("/api/v1/auth/google", controller.loginConGoogle);
  app.get("/api/v1/auth/me", requiereAuth, controller.miPerfil);

  // Rutas temporales SOLO de test para verificar requireRole.
  app.get("/solo-gerente", requiereAuth, requireRol("gerente"), (req, res) => {
    res.json({ ok: true, rol: req.perfil?.rol });
  });
  app.get("/operador-o-gerente", requiereAuth, requireRol("operador", "gerente"), (req, res) => {
    res.json({ ok: true, rol: req.perfil?.rol });
  });
  app.get("/sin-auth", requireRol("gerente"), (_req, res) => {
    res.json({ ok: true });
  });

  app.use(errorHandler);
  return { app, ...falso };
}

describe("POST /api/v1/auth/google", () => {
  it("body sin idToken responde 400 VALIDATION_ERROR y no escribe", async () => {
    const { app, escrituras } = crearAppDePrueba();
    const res = await request(app).post("/api/v1/auth/google").send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(escrituras()).toBe(0);
  });

  it("token invalido responde 401 UNAUTHORIZED", async () => {
    const { app, escrituras } = crearAppDePrueba({ fallarVerificacion: true });
    const res = await request(app).post("/api/v1/auth/google").send({ idToken: "cualquiera" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
    expect(escrituras()).toBe(0);
  });

  it("token sin email responde 401", async () => {
    const { app } = crearAppDePrueba({ token: { uid: "u7" } });
    const res = await request(app).post("/api/v1/auth/google").send({ idToken: TOKEN_VALIDO });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Token sin email");
  });

  it("usuario nuevo entra como operador y se guarda con los 8 campos", async () => {
    const { app, docs, escrituras } = crearAppDePrueba({
      token: { uid: "u1", email: "nuevo@test.com", name: "Nuevo" },
    });
    const res = await request(app).post("/api/v1/auth/google").send({ idToken: TOKEN_VALIDO });

    expect(res.status).toBe(200);
    expect(res.body.usuario).toMatchObject({
      uid: "u1",
      nombre: "Nuevo",
      email: "nuevo@test.com",
      rol: "operador",
      activo: true,
      proveedor: "google",
    });
    expect(escrituras()).toBe(1);
    expect(Object.keys(docs.get("u1") ?? {})).toHaveLength(8);
  });

  it("email de ADMIN_EMAILS entra como gerente aunque venga en mayusculas", async () => {
    const { app } = crearAppDePrueba({
      token: { uid: "u2", email: "JEFE@Test.com" },
      adminEmails: ["  jefe@test.com "],
    });
    const res = await request(app).post("/api/v1/auth/google").send({ idToken: TOKEN_VALIDO });

    expect(res.status).toBe(200);
    expect(res.body.usuario.rol).toBe("gerente");
  });

  it("usuario existente conserva rol, nombre y fechaAlta, y renueva ultimoAcceso", async () => {
    const fechaAlta = "2025-01-01T00:00:00.000Z";
    const ultimoAcceso = "2025-06-01T00:00:00.000Z";
    const { app, docs } = crearAppDePrueba({
      token: { uid: "u3", email: "otro@test.com", name: "Del token" },
      documentos: [
        {
          uid: "u3",
          nombre: "Guardado",
          email: "viejo@test.com",
          rol: "gerente",
          activo: true,
          proveedor: "google",
          fechaAlta,
          ultimoAcceso,
        },
      ],
      adminEmails: [],
    });
    const res = await request(app).post("/api/v1/auth/google").send({ idToken: TOKEN_VALIDO });

    expect(res.status).toBe(200);
    expect(res.body.usuario).toMatchObject({
      nombre: "Guardado",
      email: "otro@test.com",
      rol: "gerente",
      fechaAlta,
    });
    expect(res.body.usuario.ultimoAcceso).not.toBe(ultimoAcceso);
    expect(docs.get("u3")?.ultimoAcceso).toBe(res.body.usuario.ultimoAcceso);
  });

  it("usuario inactivo responde 403 y no escribe", async () => {
    const { app, escrituras } = crearAppDePrueba({
      documentos: [{ uid: "u1", activo: false }],
    });
    const res = await request(app).post("/api/v1/auth/google").send({ idToken: TOKEN_VALIDO });

    expect(res.status).toBe(403);
    expect(res.body.error).toEqual({ code: "FORBIDDEN", message: "Usuario inactivo" });
    expect(escrituras()).toBe(0);
  });
});

describe("GET /api/v1/auth/me", () => {
  it("sin cabecera Authorization responde 401", async () => {
    const { app } = crearAppDePrueba();
    const res = await request(app).get("/api/v1/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Token de autorizacion ausente");
  });

  it("con esquema distinto de Bearer responde 401", async () => {
    const { app } = crearAppDePrueba();
    const res = await request(app).get("/api/v1/auth/me").set("Authorization", "Basic abc");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("con token invalido responde 401 (no 500)", async () => {
    const { app } = crearAppDePrueba({ fallarVerificacion: true });
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer token-malformed");

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Token invalido o expirado");
  });

  it("token valido sin documento responde 404", async () => {
    const { app } = crearAppDePrueba();
    const res = await request(app).get("/api/v1/auth/me").set(BEARER);

    expect(res.status).toBe(404);
    expect(res.body.error).toEqual({ code: "NOT_FOUND", message: "Usuario no registrado" });
  });

  it("usuario inactivo responde 403", async () => {
    const { app } = crearAppDePrueba({
      documentos: [{ uid: "u1", activo: false, rol: "operador" }],
    });
    const res = await request(app).get("/api/v1/auth/me").set(BEARER);

    expect(res.status).toBe(403);
    expect(res.body.error.message).toBe("Usuario inactivo");
  });

  it("usuario existente responde 200 { usuario } sin escribir en Firestore", async () => {
    const { app, escrituras } = crearAppDePrueba({
      documentos: [
        {
          uid: "u1",
          nombre: "Guardado",
          email: "viejo@test.com",
          rol: "gerente",
          activo: true,
          proveedor: "google",
          fechaAlta: "2025-01-01T00:00:00.000Z",
          ultimoAcceso: "2026-01-01T00:00:00.000Z",
        },
      ],
    });
    const res = await request(app).get("/api/v1/auth/me").set(BEARER);

    expect(res.status).toBe(200);
    expect(res.body.usuario).toMatchObject({
      uid: "u1",
      email: "user@test.com",
      nombre: "Guardado",
      rol: "gerente",
      ultimoAcceso: "2026-01-01T00:00:00.000Z",
    });
    expect(escrituras()).toBe(0);
  });
});

describe("requireRole", () => {
  it("operador no puede entrar a ruta de gerente (403 Rol insuficiente)", async () => {
    const { app } = crearAppDePrueba({
      documentos: [{ uid: "u1", rol: "operador", activo: true }],
    });
    const res = await request(app).get("/solo-gerente").set(BEARER);

    expect(res.status).toBe(403);
    expect(res.body.error.message).toBe("Rol insuficiente");
  });

  it("gerente entra a ruta de gerente (200) y req.perfil esta disponible", async () => {
    const { app } = crearAppDePrueba({
      documentos: [{ uid: "u1", rol: "gerente", activo: true }],
    });
    const res = await request(app).get("/solo-gerente").set(BEARER);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, rol: "gerente" });
  });

  it("usuario inactivo con rol gerente recibe 403 Usuario inactivo", async () => {
    const { app } = crearAppDePrueba({
      documentos: [{ uid: "u1", rol: "gerente", activo: false }],
    });
    const res = await request(app).get("/solo-gerente").set(BEARER);

    expect(res.status).toBe(403);
    expect(res.body.error.message).toBe("Usuario inactivo");
  });

  it("sin requiereAuth previo responde 401", async () => {
    const { app } = crearAppDePrueba({
      documentos: [{ uid: "u1", rol: "gerente", activo: true }],
    });
    const res = await request(app).get("/sin-auth").set(BEARER);

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Token de autorizacion ausente");
  });

  it("multi-rol permite a un operador en /operador-o-gerente", async () => {
    const { app } = crearAppDePrueba({
      documentos: [{ uid: "u1", rol: "operador", activo: true }],
    });
    const res = await request(app).get("/operador-o-gerente").set(BEARER);

    expect(res.status).toBe(200);
    expect(res.body.rol).toBe("operador");
  });

  it("requireRole() sin roles lanza error al construir el middleware", () => {
    const { repo } = crearRepoFalso();

    expect(() => crearRequiereRol({ usuarios: repo })()).toThrow(
      "requireRole necesita al menos un rol"
    );
  });

  it("fallo de Firestore responde 500 INTERNAL_ERROR, no 403", async () => {
    const { app, fallarLectura } = crearAppDePrueba({
      documentos: [{ uid: "u1", rol: "gerente", activo: true }],
    });
    fallarLectura();
    const res = await request(app).get("/solo-gerente").set(BEARER);

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
  });
});