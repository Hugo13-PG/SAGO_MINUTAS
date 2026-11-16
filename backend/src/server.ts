import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`SAGO API escuchando en el puerto ${env.PORT} (${env.NODE_ENV})`);
  console.log(`Documentacion: http://localhost:${env.PORT}/docs`);
  console.log(`Contrato:      http://localhost:${env.PORT}/openapi.json`);
});

function apagar(senal: string): void {
  console.log(`${senal} recibida, cerrando servidor...`);
  server.close(() => {
    console.log("Servidor cerrado");
    process.exit(0);
  });
}

process.on("SIGTERM", () => apagar("SIGTERM"));
process.on("SIGINT", () => apagar("SIGINT"));