import { IsString, Length } from "class-validator";

export class LoginParams {
    @IsString({ message: "用户名必须是字符串" })
    @Length(4, 20, { message: "用户名长度必须在4到20个字符之间" })
    username: string;

    @IsString({ message: "密码必须是字符串" })
    @Length(6, 20, { message: "密码长度必须在6到20个字符之间" })
    password: string;
}

export class ChangePasswordParams {
    @IsString({ message: "新密码必须是字符串" })
    @Length(6, 20, { message: "新密码长度必须在6到20个字符之间" })
    newPassword: string;

    @IsString({ message: "确认密码必须是字符串" })
    @Length(6, 20, { message: "确认密码长度必须在6到20个字符之间" })
    confirmPassword: string;

    @IsString({ message: "旧密码必须是字符串" })
    @Length(6, 20, { message: "旧密码长度必须在6到20个字符之间" })
    oldPassword: string;
}