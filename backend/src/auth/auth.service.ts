import { env } from "../config/env";
import { getAuth } from "../config/firebase";
import { HttpError } from "../middlewares/error";
import { crearUsuariosRepository } from "../usuarios/usuarios.repository";
import type { UsuariosRepository } from "../usuarios/usuarios.repository";
import type { UsuarioPerfil, UsuarioPerfilExistente } from "../usuarios/usuario.types";

/** Lo mínimo que necesitamos del token, ya verificado. */
export interface TokenVerificado {
  uid: string;
  email?: string;
  name?: string;
}

export interface DependenciasAuthService {
  verificarIdToken(idToken: string): Promise<TokenVerificado>;
  usuarios: UsuariosRepository;
  adminEmails: string[];
}

export interface AuthService {
  loginConGoogle(idToken: string): Promise<UsuarioPerfil>;
  obtenerMiPerfil(token: TokenVerificado): Promise<UsuarioPerfil>;
}

interface DatosPerfil {
  uid: string;
  email: string;
  nombreToken?: string;
  existente: UsuarioPerfilExistente | null;
  correosAdmin: Set<string>;
  ahora: string;
  ultimoAcceso?: string;
}

/**
 * Regla única de construccion del perfil (seccion 4.6 del plan).
 * Es pura: no toca Firestore y se puede testear sin dependencias.
 */
function calcularPerfil({
  uid,
  email,
  nombreToken,
  existente,
  correosAdmin,
  ahora,
  ultimoAcceso,
}: DatosPerfil): UsuarioPerfil {
  return {
    uid,
    nombre: existente?.nombre || nombreToken || email.split("@")[0],
    email,
    rol: existente?.rol ?? (correosAdmin.has(email.toLowerCase()) ? "gerente" : "operador"),
    activo: existente?.activo ?? true,
    proveedor: "google",
    fechaAlta: existente?.fechaAlta ?? ahora,
    ultimoAcceso: ultimoAcceso ?? existente?.ultimoAcceso ?? ahora,
  };
}

function dependenciasPorDefecto(): DependenciasAuthService {
  return {
    async verificarIdToken(idToken: string): Promise<TokenVerificado> {
      const decoded = await getAuth().verifyIdToken(idToken);
      return { uid: decoded.uid, email: decoded.email, name: decoded.name };
    },
    usuarios: crearUsuariosRepository(),
    adminEmails: env.ADMIN_EMAILS,
  };
}

export function crearAuthService(
  dependencias: DependenciasAuthService = dependenciasPorDefecto()
): AuthService {
  const { verificarIdToken, usuarios, adminEmails } = dependencias;
  const correosAdmin = new Set(adminEmails.map((correo) => correo.trim().toLowerCase()));

  return {
    async loginConGoogle(idToken: string): Promise<UsuarioPerfil> {
      let verificado: TokenVerificado;

      try {
        verificado = await verificarIdToken(idToken);
      } catch {
        throw new HttpError(401, "UNAUTHORIZED", "Token invalido o expirado");
      }

      const email = verificado.email?.trim();
      if (!email) {
        throw new HttpError(401, "UNAUTHORIZED", "Token sin email");
      }

      const existente = await usuarios.obtenerPorUid(verificado.uid);

      if (existente?.activo === false) {
        throw new HttpError(403, "FORBIDDEN", "Usuario inactivo");
      }

      const ahora = new Date().toISOString();

      const perfil = calcularPerfil({
        uid: verificado.uid,
        email,
        nombreToken: verificado.name?.trim(),
        existente,
        correosAdmin,
        ahora,
        ultimoAcceso: ahora,
      });

      await usuarios.guardar(verificado.uid, perfil);

      return perfil;
    },

    async obtenerMiPerfil(token: TokenVerificado): Promise<UsuarioPerfil> {
      const email = token.email?.trim();
      if (!email) {
        throw new HttpError(401, "UNAUTHORIZED", "Token sin email");
      }

      const existente = await usuarios.obtenerPorUid(token.uid);

      if (!existente) {
        throw new HttpError(404, "NOT_FOUND", "Usuario no registrado");
      }

      if (existente.activo === false) {
        throw new HttpError(403, "FORBIDDEN", "Usuario inactivo");
      }

      return calcularPerfil({
        uid: token.uid,
        email,
        nombreToken: token.name?.trim(),
        existente,
        correosAdmin,
        ahora: new Date().toISOString(),
      });
    },
  };
}

/** Instancia lista para usar desde el controlador (no inicializa Firebase al importar). */
export const authService: AuthService = crearAuthService();