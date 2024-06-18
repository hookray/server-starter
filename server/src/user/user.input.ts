import { Transform } from "class-transformer";
import { IsEnum, IsOptional, IsString, Length } from "class-validator";
import { BaseQueryInput } from "src/base/base.query.input";
import { UserRole } from "src/entities/user.entity";

export class CreateUserInput {

    @IsString({ message: "用户名必须是字符串" })
    @Length(4, 20, { message: "用户名长度必须在4到20个字符之间" })
    username: string;

    @IsString({ message: "密码必须是字符串" })
    @Length(6, 20, { message: "密码长度必须在6到20个字符之间" })
    password: string;

    @IsString({ message: "确认密码必须是字符串" })
    @Length(6, 20, { message: "确认密码长度必须在6到20个字符之间" })
    confirmPassword: string;

    @IsOptional()
    @Transform(({ value }) => value ? value : UserRole.USER)
    @IsEnum(UserRole, { message: "角色必须是有效的用户角色" })
    role?: UserRole;
}

export class QueryUserInput extends BaseQueryInput {
    @IsOptional()
    @IsString({ message: "用户名必须是字符串" })
    @Length(4, 20, { message: "用户名长度必须在4到20个字符之间" })
    username?: string;

    @IsOptional()
    @IsEnum(UserRole, { message: "角色必须是有效的用户角色" })
    role?: UserRole;
}

export class UpdateUserInput {
    @IsOptional()
    @IsString({ message: "用户名必须是字符串" })
    @Length(4, 20, { message: "用户名长度必须在4到20个字符之间" })
    username?: string;

    @IsOptional()
    @IsString({ message: "密码必须是字符串" })
    @Length(6, 20, { message: "密码长度必须在6到20个字符之间" })
    password?: string;

    @IsOptional()
    @IsString({ message: "确认密码必须是字符串" })
    @Length(6, 20, { message: "确认密码长度必须在6到20个字符之间" })
    confirmPassword?: string;

    @IsOptional()
    @IsEnum(UserRole, { message: "角色必须是有效的用户角色" })
    role?: UserRole;

}