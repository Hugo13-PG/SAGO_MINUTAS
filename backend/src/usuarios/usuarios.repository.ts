import type { DocumentData } from "firebase-admin/firestore";
import { getDb } from "../config/firebase";
import type { UsuarioPerfil, UsuarioPerfilExistente } from "./usuario.types";

export const COLECCION_USUARIOS = "usuarios";

export interface UsuariosRepository {
  obtenerPorUid(uid: string): Promise<UsuarioPerfilExistente | null>;
  guardar(uid: string, perfil: UsuarioPerfil): Promise<void>;
}

function normalizarPerfil(uid: string, datos: DocumentData): UsuarioPerfilExistente {
  return {
    uid,
    nombre: typeof datos.nombre === "string" ? datos.nombre : undefined,
    email: typeof datos.email === "string" ? datos.email : undefined,
    rol: datos.rol === "operador" || datos.rol === "gerente" ? datos.rol : undefined,
    activo: typeof datos.activo === "boolean" ? datos.activo : undefined,
    proveedor: datos.proveedor === "google" ? "google" : undefined,
    fechaAlta: typeof datos.fechaAlta === "string" ? datos.fechaAlta : undefined,
    ultimoAcceso: typeof datos.ultimoAcceso === "string" ? datos.ultimoAcceso : undefined,
  };
}

export function crearUsuariosRepository(): UsuariosRepository {
  return {
    async obtenerPorUid(uid: string): Promise<UsuarioPerfilExistente | null> {
      const snapshot = await getDb().collection(COLECCION_USUARIOS).doc(uid).get();

      if (!snapshot.exists) {
        return null;
      }

      return normalizarPerfil(uid, snapshot.data() ?? {});
    },

    async guardar(uid: string, perfil: UsuarioPerfil): Promise<void> {
      await getDb()
        .collection(COLECCION_USUARIOS)
        .doc(uid)
        .set(perfil, { merge: true });
    },
  };
}