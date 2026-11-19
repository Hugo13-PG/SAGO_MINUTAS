import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";

const app = createApp();

describe("GET /health", () => {
  it("responde 200 con el contrato esperado", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body).toEqual({
      status: "ok",
      uptime: expect.any(Number),
      timestamp: expect.any(String),
    });
    expect(new Date(res.body.timestamp).toString()).not.toBe("Invalid Date");
  });
});

describe("Rutas no encontradas (404)", () => {
  it("GET a una ruta inexistente responde 404 NOT_FOUND", async () => {
    const res = await request(app).get("/no-existe");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Ruta no encontrada: GET /no-existe",
      },
    });
  });

  it("POST /health responde 404 NOT_FOUND (metodo no soportado en esa ruta)", async () => {
    const res = await request(app).post("/health").send({});

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(res.body.error.message).toContain("POST /health");
  });
});

describe("Errores de body", () => {
  it("JSON mal formado responde 400 VALIDATION_ERROR", async () => {
    const res = await request(app)
      .post("/api/v1/auth/google")
      .set("Content-Type", "application/json")
      .send("{ no es json");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "El cuerpo de la peticion no es JSON valido",
      },
    });
  });

  it("body mayor a 1 MB responde 413 PAYLOAD_TOO_LARGE", async () => {
    const res = await request(app)
      .post("/api/v1/auth/google")
      .send({ idToken: "x".repeat(1200 * 1024) });

    expect(res.status).toBe(413);
    expect(res.body).toEqual({
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "El cuerpo de la peticion excede el tamano permitido",
      },
    });
  });

  it("body bajo el limite llega al router (401 por token invalido, no 500)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/google")
      .send({ idToken: "token-falso" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });
});

describe("GET /api/v1/auth/me", () => {
  it("sin cabecera Authorization responde 401 UNAUTHORIZED", async () => {
    const res = await request(app).get("/api/v1/auth/me");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: {
        code: "UNAUTHORIZED",
        message: "Token de autorizacion ausente",
      },
    });
  });

  it("con un esquema distinto de Bearer responde 401 sin tocar Firebase", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Basic abc123");

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Token de autorizacion ausente");
  });

  it("con Bearer y token invalido responde 401 (no 500)", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer token-falso");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
    expect(res.body.error.message).toBe("Token invalido o expirado");
  });
});

describe("CORS", () => {
  it("permite un origen de la lista blanca", async () => {
    const res = await request(app)
      .get("/health")
      .set("Origin", "http://localhost:5173");

    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
  });

  it("no incluye Access-Control-Allow-Origin para un origen no permitido", async () => {
    const res = await request(app)
      .get("/health")
      .set("Origin", "https://evil.example");

    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("preflight (OPTIONS) de origen permitido responde 204 con cabeceras CORS", async () => {
    const res = await request(app)
      .options("/api/v1/auth/google")
      .set("Origin", "http://localhost:5173")
      .set("Access-Control-Request-Method", "POST");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
  });
});