import { InjectRedis } from '@nestjs-modules/ioredis';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Redis } from 'ioredis';
import { User, UserRole } from 'src/entities/user.entity';
import { CreateUserInput } from 'src/user/user.input';
import { UserService } from 'src/user/user.service';
import { ChangePasswordParams } from './auth.input';

@Injectable()
export class AuthService {

    private readonly JWT_SECRET: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        private readonly userService: UserService,
        @InjectRedis() private readonly authRedis: Redis
    ) {
        this.JWT_SECRET = this.configService.get<string>('JWT_SECRET');
    }

    /**
     * 注册一个新的用户。
     *
     * @param {CreateUserInput} data - 包含新用户信息的对象。这个对象应该包含一个用户名，一个密码和一个确认密码。
     * @returns {Promise<{ token: string }>} 返回一个包含新生成的JWT令牌的对象。
     * @throws {BadRequestException} 如果用户名已存在，或者密码和确认密码不一致，则抛出一个BadRequestException。
     */
    async register(data: CreateUserInput): Promise<{ token: string; }> {
        // 通过用户名查找用户，检查用户名是否已存在
        const exist = await this.userService.findOneByUsername(data.username);
        if (exist) throw new BadRequestException("用户名已存在");

        // 检查密码和确认密码是否一致
        if (data.password !== data.confirmPassword) throw new BadRequestException("密码不一致");

        // 创建一个新的用户
        const user = await this.userService.create(data);

        // 为新用户生成一个JWT令牌
        const token = await this.generateToken(user.id, user.role);

        // 返回包含新生成的JWT令牌的对象
        return { token };
    }

    /**
     * 验证用户的用户名和密码，如果验证成功，则生成一个新的JWT令牌。
     *
     * @param {string} username - 用户的用户名。
     * @param {string} password - 用户的密码。
     * @returns {Promise<{ token: string }>} 如果验证成功，则返回一个包含新的JWT令牌的对象。
     * @throws {BadRequestException} 如果用户名不存在，或者密码不正确，则抛出一个BadRequestException。
     */
    async login(username: string, password: string): Promise<{ token: string; }> {
        // 通过用户名查找用户
        const user = await this.userService.findOneByUsername(username);

        // 如果用户不存在，或者密码不正确，抛出一个BadRequestException
        if (!user || !user.validatePassword(password)) throw new BadRequestException("无效的用户名或密码");

        // 生成一个新的JWT令牌
        const token = await this.generateToken(user.id, user.role);

        // 返回包含新的JWT令牌的对象
        return { token };
    }




    /**
     * 验证给定的JWT令牌是否有效。
     *
     * @param {string} token - 要验证的JWT令牌。
     * @returns {Promise<{ sub: string, role: UserRole } | undefined>} 如果令牌有效，则返回令牌的负载；否则，返回undefined。
     */
    async validateToken(token: string): Promise<{ sub: string; role: UserRole; } | undefined> {
        try {
            // 使用jwtService验证令牌，如果令牌无效或过期，这将抛出一个错误
            const payload = this.jwtService.verify<{ sub: string, role: UserRole }>(token, { secret: this.JWT_SECRET });

            // 从Redis中获取与令牌关联的用户ID
            const _token = await this.authRedis.get(payload.sub);

            // 如果Redis中没有用户ID，或者用户ID与令牌负载中的sub字段不匹配，那么令牌无效
            if (!_token || _token !== token) {
                throw new Error('Invalid token')
            } else {
                // 如果令牌有效，返回令牌的负载
                return payload;
            }
        } catch (error) {
            // 如果在验证过程中出现任何错误，返回undefined
            return undefined;
        }
    }

    /**
     * 查找给定用户ID的用户。
     *
     * @param {string} userId - 要查找的用户ID。
     * @returns {Promise<User>} 返回找到的用户。
     */
    async me(userId: string): Promise<User> {
        return await this.userService.findOneById(userId)
    }


    /**
     * 注销用户，使得给定的JWT令牌无效。
     *
     * @param {string} userId - 要注销的用户ID。
     * @returns {Promise<void>} 这个函数没有返回值。
     */
    async logout(userId: string): Promise<void> {
        // 从Redis中删除与用户ID关联的JWT令牌
        await this.authRedis.del(userId);
    }

    /**
     * 更新用户的密码。
     *
     * @param {string} id - 要更新密码的用户的ID。
     * @param {ChangePasswordParams} data - 包含旧密码，新密码和确认新密码的对象。
     * @returns {Promise<boolean>} 如果密码更新成功，则返回true。
     * @throws {BadRequestException} 如果用户不存在，或者旧密码不正确，或者新密码和确认新密码不一致，则抛出一个BadRequestException。
     */
    async updatePassword(id: string, data: ChangePasswordParams): Promise<boolean> {
        // 通过ID查找用户
        const user = await this.userService.findOneById(id);

        // 如果用户不存在，抛出一个BadRequestException
        if (!user) throw new BadRequestException("用户不存在");

        // 如果旧密码不正确，抛出一个BadRequestException
        if (!user.validatePassword(data.oldPassword)) throw new BadRequestException("旧密码不正确");

        // 如果新密码和确认新密码不一致，抛出一个BadRequestException
        if (data.newPassword !== data.confirmPassword) throw new BadRequestException("新密码不一致");

        // 将用户的密码设置为新密码
        user.password = data.newPassword;

        // 调用userService的changePassword方法更新用户的密码
        await this.userService.changePassword(user.id, data.newPassword);

        // 如果密码更新成功，返回true
        return true;
    }


    /**
     * 生成一个新的JWT令牌，并将其存储在Redis中。
     *
     * @param {string} userId - 用户的唯一标识符。
     * @param {UserRole} role - 用户的角色。
     * @returns {Promise<string>} 返回生成的JWT令牌。
     */
    private async generateToken(userId: string, role: UserRole): Promise<string> {
        // 使用jwtService签名一个新的JWT令牌，其中包含用户ID和角色信息
        const token = this.jwtService.sign({ sub: userId, role }, { secret: this.JWT_SECRET });

        // 将新的JWT令牌存储在Redis中，设置其过期时间为24小时
        await this.authRedis.setex(userId, 60 * 60 * 24, token)

        // 返回生成的JWT令牌
        return token;
    }
}
