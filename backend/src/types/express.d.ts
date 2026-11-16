export interface UsuarioAutenticado {
  uid: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioAutenticado;
    }
  }
}