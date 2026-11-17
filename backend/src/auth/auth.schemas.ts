import { z } from "zod";
import { HttpError } from "../middlewares/error";

export const esquemaLoginGoogle = z.object({
  idToken: z
    .string({ error: "idToken debe ser un texto" })
    .trim()
    .min(1, "idToken es obligatorio"),
});

export type LoginGoogleBody = z.infer<typeof esquemaLoginGoogle>;

export function validarLoginGoogle(body: unknown): LoginGoogleBody {
  const resultado = esquemaLoginGoogle.safeParse(body ?? {});

  if (!resultado.success) {
    const mensaje = resultado.error.issues[0]?.message ?? "Datos de entrada invalidos";
    throw new HttpError(400, "VALIDATION_ERROR", mensaje);
  }

  return resultado.data;
}