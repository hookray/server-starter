import { SetMetadata } from "@nestjs/common";
import { UserRole } from "src/entities/user.entity";

export const RolesKey = "roles";

export const Roles = (...roles: UserRole[]) => SetMetadata(RolesKey, roles);