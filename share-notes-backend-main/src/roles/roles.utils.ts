import { Role, Permission, ROLE_PERMISSIONS, ROLE_HIERARCHY } from './roles.definition';

 //Verifica si un rol tiene un permiso específico
 
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}


//Verifica si un rol tiene TODOS los permisos de la lista

export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p));
}


//Verifica si un rol tiene AL MENOS UNO de los permisos

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}


//Verifica si un rol es igual o superior al rol mínimo requerido

export function isRoleAtLeast(role: Role, minimumRole: Role): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minimumRole];
}


 // Devuelve todos los permisos de un rol

export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
