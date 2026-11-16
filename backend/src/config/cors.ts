import type { CorsOptions } from "cors";
import { env } from "./env";

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (env.CORS_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }

    // Origen no permitido: se responde sin cabeceras CORS y el navegador
    // bloquea la lectura. Lanzar un error solo ensuciaria los logs con un 500.
    callback(null, false);
  },
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
  maxAge: 86400,
};