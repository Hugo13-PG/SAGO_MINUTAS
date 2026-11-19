import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { TokenVerificado } from "../auth/auth.service";
import { getAuth } from "../config/firebase";
import { HttpError } from "./error";
import type { UsuarioPerfilExistente } from "../usuarios/usuario.types";
import type { RolUsuario } from "../usuarios/usuario.types";
import { crearUsuariosRepository } from "../usuarios/usuarios.repository";
import type { UsuariosRepository } from "../usuarios/usuarios.repository";

export interface DependenciasMiddlewareAuth {
  verificarIdToken(idToken: string): Promise<TokenVerificado>;
}

/** Extrae el token de "Authorization: Bearer <token>". Devuelve null si no cumple. */
export function extraerBearer(req: Request): string | null {
  const cabecera = req.headers.authorization;
  if (!cabecera) {
    return null;
  }

  const [esquema, ...resto] = cabecera.trim().split(/\s+/);
  if (!esquema || esquema.toLowerCase() !== "bearer") {
    return null;
  }

  const token = resto.join(" ").trim();
  return token.length > 0 ? token : null;
}

export function crearMiddlewareAuth({
  verificarIdToken,
}: DependenciasMiddlewareAuth): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const token = extraerBearer(req);

    if (!token) {
      next(new HttpError(401, "UNAUTHORIZED", "Token de autorizacion ausente"));
      return;
    }

    let verificado: TokenVerificado;

    try {
      verificado = await verificarIdToken(token);
    } catch {
      next(new HttpError(401, "UNAUTHORIZED", "Token invalido o expirado"));
      return;
    }

    const email = verificado.email?.trim();
    if (!email) {
      next(new HttpError(401, "UNAUTHORIZED", "Token sin email"));
      return;
    }

    req.usuario = { uid: verificado.uid, email, nombre: verificado.name?.trim() };
    next();
  };
}

/** Instancia con Firebase real. No inicializa nada al importar (getAuth va dentro). */
export const requiereAuth: RequestHandler = crearMiddlewareAuth({
  async verificarIdToken(idToken: string): Promise<TokenVerificado> {
    const decoded = await getAuth().verifyIdToken(idToken);
    return { uid: decoded.uid, email: decoded.email, name: decoded.name };
  },
});

export interface DependenciasRequiereRol {
  usuarios: UsuariosRepository;
}

/** Devuelve un middleware que solo deja pasar a los roles indicados. */
export function crearRequiereRol({ usuarios }: DependenciasRequiereRol) {
  return (...roles: RolUsuario[]): RequestHandler => {
    if (roles.length === 0) {
      throw new Error("requireRole necesita al menos un rol");
    }

    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
      const autenticado = req.usuario;

      if (!autenticado) {
        // Protección contra montar requireRole sin requiereAuth.
        next(new HttpError(401, "UNAUTHORIZED", "Token de autorizacion ausente"));
        return;
      }

      let perfil: UsuarioPerfilExistente | null;

      try {
        perfil = await usuarios.obtenerPorUid(autenticado.uid);
      } catch (error) {
        // Fallo de infraestructura: NO es un problema de permisos.
        next(error);
        return;
      }

      if (!perfil) {
        next(new HttpError(404, "NOT_FOUND", "Usuario no registrado"));
        return;
      }

      if (perfil.activo === false) {
        next(new HttpError(403, "FORBIDDEN", "Usuario inactivo"));
        return;
      }

      if (!perfil.rol || !roles.includes(perfil.rol)) {
        next(new HttpError(403, "FORBIDDEN", "Rol insuficiente"));
        return;
      }

      req.perfil = perfil;
      next();
    };
  };
}

/** Instancia con el repositorio real (getDb se llama dentro de los métodos). */
export const requireRole = crearRequiereRol({ usuarios: crearUsuariosRepository() });