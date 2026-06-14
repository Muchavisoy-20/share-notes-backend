import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requirePermission } from './roles.middleware';
import * as ctrl from './roles.controller';

const router = Router();

// Todas las rutas requieren estar autenticado
router.use(authMiddleware);

// Cualquier usuario puede ver sus propios permisos
router.get('/my-permissions', ctrl.getMyPermissions);

// Solo moderador o superior puede ver la lista de usuarios con roles
router.get('/users', requirePermission('users:view_list'), ctrl.listUsersWithRoles);

// Solo admin puede cambiar roles
router.patch('/:id', requirePermission('users:assign_roles'), ctrl.assignRole);

export default router;
