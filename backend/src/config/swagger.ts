import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { Router } from "express";
import type { Request, RequestHandler, Response } from "express";
import { load as loadYaml } from "js-yaml";
import swaggerUi from "swagger-ui-express";

const RUTA_OPENAPI = path.resolve(__dirname, "..", "..", "openapi.yaml");

function cargarOpenapi(): Record<string, unknown> {
  if (!existsSync(RUTA_OPENAPI)) {
    throw new Error(`No se encontro openapi.yaml en ${RUTA_OPENAPI}`);
  }

  const texto = readFileSync(RUTA_OPENAPI, "utf8");

  let doc: unknown;
  try {
    doc = loadYaml(texto);
  } catch (error) {
    throw new Error(
      `openapi.yaml invalido en ${RUTA_OPENAPI}: ${(error as Error).message}`
    );
  }

  if (typeof doc !== "object" || doc === null || !("openapi" in doc)) {
    throw new Error(`openapi.yaml no contiene el campo "openapi" (${RUTA_OPENAPI})`);
  }

  return doc as Record<string, unknown>;
}

export const openapiDocument = cargarOpenapi();

export const docsRouter: Router = Router();

docsRouter.use(
  "/",
  swaggerUi.serve,
  swaggerUi.setup(openapiDocument, {
    customSiteTitle: "SAGO API",
    swaggerOptions: { persistAuthorization: true },
  })
);

export const openapiJson: RequestHandler = (_req: Request, res: Response) => {
  res.status(200).json(openapiDocument);
};