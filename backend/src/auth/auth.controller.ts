import type { Request, Response } from "express";
import { HttpError } from "../middlewares/error";
import { validarLoginGoogle } from "./auth.schemas";
import { authService } from "./auth.service";
import type { AuthService } from "./auth.service";

export interface DependenciasAuthController {
  service: AuthService;
}

export function crearAuthController({ service }: DependenciasAuthController) {
  return {
    async loginConGoogle(req: Request, res: Response): Promise<void> {
      const { idToken } = validarLoginGoogle(req.body);
      const usuario = await service.loginConGoogle(idToken);
      res.status(200).json({ usuario });
    },

    async miPerfil(req: Request, res: Response): Promise<void> {
      const autenticado = req.usuario;

      if (!autenticado) {
        // Defensa: esta ruta siempre pasa por requiereAuth.
        throw new HttpError(401, "UNAUTHORIZED", "Token de autorizacion ausente");
      }

      const usuario = await service.obtenerMiPerfil({
        uid: autenticado.uid,
        email: autenticado.email,
        name: autenticado.nombre,
      });

      res.status(200).json({ usuario });
    },
  };
}

/** Instancia cableada con el servicio real (no inicializa Firebase al importar). */
export const authController = crearAuthController({ service: authService });