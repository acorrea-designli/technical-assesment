import { SetMetadata } from '@nestjs/common'
import { Roles as RolesEnum } from '@commons/enums/roles.enum'

export const ROLES_KEY = 'roles'
export const useRoles = (...roles: RolesEnum[]) => SetMetadata(ROLES_KEY, roles)
