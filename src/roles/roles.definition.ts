export type Role = 'student' | 'teacher' | 'moderator' | 'admin';

export type Permission =
  // Auth
  | 'auth:register'
  | 'auth:login'
  | 'auth:view_own_profile'
  | 'auth:edit_own_profile'

  // Apuntes
  | 'notes:upload'
  | 'notes:upload_unrestricted'   // sin validación de tamaño extra (docente)
  | 'notes:download'
  | 'notes:search'
  | 'notes:delete_own'
  | 'notes:delete_any'
  | 'notes:edit_own'

  // Materias / carreras
  | 'subjects:view'
  | 'subjects:create'
  | 'careers:create'

  // Foro
  | 'forum:create_thread'
  | 'forum:reply'
  | 'forum:pin_thread'            // fijar hilo (docente+)
  | 'forum:delete_own'
  | 'forum:delete_any'

  // Reportes
  | 'reports:create'
  | 'reports:view_all'
  | 'reports:resolve'

  // Usuarios
  | 'users:view_list'
  | 'users:toggle_status'
  | 'users:assign_roles'

  // Sanciones
  | 'sanctions:apply_warning'
  | 'sanctions:apply_temp_ban'
  | 'sanctions:apply_perm_ban'
  | 'sanctions:view_history'

  // QR
  | 'qr:generate';

// ── Permisos por rol (acumulativos) ──────────────────────────────────────────

const STUDENT_PERMISSIONS: Permission[] = [
  'auth:register',
  'auth:login',
  'auth:view_own_profile',
  'auth:edit_own_profile',
  'notes:upload',
  'notes:download',
  'notes:search',
  'notes:delete_own',
  'subjects:view',
  'forum:create_thread',
  'forum:reply',
  'forum:delete_own',
  'reports:create',
];

const TEACHER_PERMISSIONS: Permission[] = [
  ...STUDENT_PERMISSIONS,
  'notes:upload_unrestricted',
  'notes:edit_own',
  'subjects:create',
  'forum:pin_thread',
  'users:view_list',
];

const MODERATOR_PERMISSIONS: Permission[] = [
  ...TEACHER_PERMISSIONS,
  'notes:delete_any',
  'forum:delete_any',
  'reports:view_all',
  'reports:resolve',
  'sanctions:apply_warning',
  'sanctions:apply_temp_ban',
  'sanctions:view_history',
];

const ADMIN_PERMISSIONS: Permission[] = [
  ...MODERATOR_PERMISSIONS,
  'users:toggle_status',
  'users:assign_roles',
  'sanctions:apply_perm_ban',
  'careers:create',
  'qr:generate',
];

// Mapa de roles → permisos 

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  student:   STUDENT_PERMISSIONS,
  teacher:   TEACHER_PERMISSIONS,
  moderator: MODERATOR_PERMISSIONS,
  admin:     ADMIN_PERMISSIONS,
};

export const ROLE_HIERARCHY: Record<Role, number> = {
  student:   1,
  teacher:   2,
  moderator: 3,
  admin:     4,
};
