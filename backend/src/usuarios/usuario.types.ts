export type RolUsuario = "operador" | "gerente";
export type ProveedorUsuario = "google";

/**
 * Perfil completo tal como lo escribe la API en usuarios/{uid}.
 */
export interface UsuarioPerfil {
  uid: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  proveedor: ProveedorUsuario;
  fechaAlta: string;
  ultimoAcceso: string;
}

/**
 * Lo que puede haber guardado en Firestore: campos opcionales y, en
 * documentos antiguos, valores ausentes o de otro tipo (incluida contrasena).
 * El repositorio lo normaliza antes de devolverlo.
 */
export interface UsuarioPerfilExistente {
  uid: string;
  nombre?: string;
  email?: string;
  rol?: RolUsuario;
  activo?: boolean;
  proveedor?: ProveedorUsuario;
  fechaAlta?: string;
  ultimoAcceso?: string;
}