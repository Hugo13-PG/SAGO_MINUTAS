import type { UsuarioPerfilExistente } from "../usuarios/usuario.types";

export interface UsuarioAutenticado {
  uid: string;
  email: string;
  nombre?: string;
}

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioAutenticado;
      perfil?: UsuarioPerfilExistente;
    }
  }
}