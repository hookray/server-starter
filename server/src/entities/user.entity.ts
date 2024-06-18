import { Entity, Property } from "@mikro-orm/core";
import { compareSync } from "bcrypt";
import { BaseEntity } from "src/base/base.entity";

export enum UserRole {
    ADMIN,
    USER,
}

@Entity()
export class User extends BaseEntity {
    @Property({ unique: true })
    username: string;

    @Property({ hidden: true })
    password: string;

    @Property({ default: UserRole.USER })
    role: UserRole = UserRole.USER;

    validatePassword(password: string) {
        return compareSync(password, this.password);
    }
}