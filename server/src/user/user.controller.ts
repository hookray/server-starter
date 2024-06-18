import { Controller, Delete, Get, Param, Put, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from 'src/entities/user.entity';
import { QueryUserInput, UpdateUserInput } from './user.input';

@Controller('user')
export class UserController {
    constructor(
        private readonly userService: UserService
    ) { }

    @Delete(":id")
    @Roles(UserRole.ADMIN)
    async delete(@Param("id") id: string) {
        return await this.userService.delete(id)
    }

    @Get("username/:username")
    @Roles(UserRole.ADMIN)
    async findOneByUsername(@Param("username") username: string) {
        return await this.userService.findOneByUsername(username)
    }

    @Get(":id")
    @Roles(UserRole.ADMIN)
    async findOneById(@Param("id") id: string) {
        return await this.userService.findOneById(id)
    }

    @Get()
    @Roles(UserRole.ADMIN)
    async list(@Query() query: QueryUserInput) {
        return await this.userService.list(query)
    }

    @Put(":id")
    @Roles(UserRole.ADMIN)
    async update(@Param("id") id: string, @Query() data: UpdateUserInput) {
        return await this.userService.update(id, data)
    }
}
