import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Pub } from 'src/decorators/pub.decorator';
import { CreateUserInput } from 'src/user/user.input';
import { ChangePasswordParams, LoginParams } from './auth.input';
import { Cur } from 'src/decorators/cur.decorator';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService
    ) { }

    @Post('register')
    @Pub()
    async register(@Body() data: CreateUserInput) {
        return await this.authService.register(data);
    }

    @Post('login')
    @Pub()
    async login(@Body() data: LoginParams) {
        return await this.authService.login(data.username, data.password);
    }

    @Get("logout")
    async logout(@Cur("id") id: string) {
        await this.authService.logout(id);
        return true;
    }

    @Put("password")
    async updatePassword(@Cur("id") id: string, @Body() data: ChangePasswordParams) {
        return await this.authService.updatePassword(id, data);
    }

    @Get("me")
    async me(@Cur("id") id: string) {
        return await this.authService.me(id);
    }
}
