import { EntityManager, FilterQuery } from '@mikro-orm/mongodb';
import { BadRequestException, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { User, UserRole } from 'src/entities/user.entity';
import { CreateUserInput, QueryUserInput, UpdateUserInput } from './user.input';
import { hashSync } from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService implements OnApplicationBootstrap {
    constructor(
        private readonly em: EntityManager,
        private readonly configService: ConfigService
    ) { }

    async onApplicationBootstrap() {
        const count = await this.em.count(User);
        if (!count) {
            const username = this.configService.get<string>("DEFAULT_ADMIN_USERNAME");
            const password = this.configService.get<string>("DEFAULT_ADMIN_PASSWORD");
            const defaultAdmin = this.em.create(User, { username, password: hashSync(password, 10), role: UserRole.ADMIN });
            await this.em.persistAndFlush(defaultAdmin);
        }
    }

    /**
     * 根据给定的ID查找一个用户。
     *
     * @param {string} id - 要查找的用户的ID。
     * @returns {Promise<User | undefined>} 如果找到了用户，则返回用户对象；否则，返回undefined。
     */
    async findOneById(id: string): Promise<User | undefined> {
        return await this.em.findOne(User, { id })
    }

    /**
     * 根据给定的用户名查找一个用户。
     *
     * @param {string} username - 要查找的用户的用户名。
     * @returns {Promise<User | undefined>} 如果找到了用户，则返回用户对象；否则，返回undefined。
     */
    async findOneByUsername(username: string): Promise<User | undefined> {
        return await this.em.findOne(User, { username })
    }

    /**
     * 创建一个新的用户。
     *
     * @param {CreateUserInput} data - 包含新用户信息的对象。这个对象应该包含一个用户名和一个密码。
     * @returns {Promise<User>} 返回新创建的用户对象。
     * @throws {Error} 如果在创建用户过程中出现错误，将抛出一个错误。
     */
    async create(data: CreateUserInput): Promise<User> {
        // 使用EntityManager的create方法创建一个新的用户实例。密码使用bcrypt进行哈希处理。
        const user = this.em.create(User, {
            ...data,
            password: hashSync(data.password, 10)
        })

        // 使用EntityManager的persistAndFlush方法保存新创建的用户实例到数据库，并立即执行数据库操作。
        await this.em.persistAndFlush(user)

        // 返回新创建的用户实例。
        return user
    }

    /**
     * 根据给定的查询参数列出用户。
     *
     * @param {QueryUserInput} query - 包含查询参数的对象。这个对象可以包含一个用户名，一个角色，一个当前页码和一个页面大小。
     * @returns {Promise<{ data: User[], total: number }>} 返回一个对象，该对象包含一个用户数组和总用户数。
     */
    async list(query: QueryUserInput): Promise<{ data: User[]; total: number; }> {
        // 从查询参数中获取当前页码和页面大小
        const { current, pageSize } = query;

        // 创建一个空的过滤查询对象
        const where: FilterQuery<User> = {}

        // 如果查询参数中包含用户名，将其添加到过滤查询对象中
        if (query.username) {
            where.username = new RegExp(query.username, "ig")
        }

        // 如果查询参数中包含角色，将其添加到过滤查询对象中
        if (query.role) {
            where.role = query.role
        }

        // 使用EntityManager的findAndCount方法查找和计数用户
        // 这个方法返回一个数组，第一个元素是用户数组，第二个元素是总用户数
        const [data, total] = await this.em.findAndCount(
            User,
            where,
            {
                // 限制返回的用户数为页面大小
                limit: pageSize,
                // 跳过的用户数为 (当前页码 - 1) * 页面大小
                offset: (current - 1) * pageSize
            }
        )

        // 返回一个包含用户数组和总用户数的对象
        return { data, total }
    }

    /**
     * 根据给定的ID删除一个用户。
     *
     * @param {string} id - 要删除的用户的ID。
     * @returns {Promise<boolean>} 如果成功删除用户，则返回true；否则，返回false。
     */
    async delete(id: string): Promise<boolean> {
        // 使用EntityManager的removeAndFlush方法删除用户
        // 这个方法返回一个布尔值，表示是否成功删除用户
        await this.em.removeAndFlush(await this.findOneById(id))
        return true
    }

    /**
     * 更新一个用户。
     *
     * @param {string} id - 要更新的用户的ID。
     * @param {UpdateUserInput} data - 包含要更新的用户信息的对象。
     * @returns {Promise<User>} 返回更新后的用户对象。
     * @throws {BadRequestException} 如果用户不存在，则抛出一个BadRequestException。
     */
    async update(id: string, data: UpdateUserInput): Promise<User> {
        // 通过ID查找用户
        const user = await this.findOneById(id)

        // 如果用户不存在，抛出一个BadRequestException
        if (!user) throw new BadRequestException("用户不存在")

        // 如果更新数据中包含用户名，将其设置为用户的新用户名
        if (data.username) {
            user.username = data.username
        }

        // 如果更新数据中包含密码，将其设置为用户的新密码
        if (data.password) {
            if (!data.confirmPassword) throw new BadRequestException("确认密码不能为空")
            if (data.password !== data.confirmPassword) throw new BadRequestException("密码不一致")
            user.password = hashSync(data.password, 10)
        }

        // 如果更新数据中包含角色，将其设置为用户的新角色
        if (data.role) {
            user.role = data.role
        }

        // 使用EntityManager的persistAndFlush方法保存更改后的用户实例到数据库，并立即执行数据库操作
        await this.em.persistAndFlush(user)

        // 返回更改后的用户实例
        return user
    }


    /**
     * 更改用户的密码。
     *
     * @param {string} id - 要更改密码的用户的ID。
     * @param {string} password - 新的密码。
     * @returns {Promise<User>} 返回更新后的用户对象。
     * @throws {BadRequestException} 如果用户不存在，则抛出一个BadRequestException。
     */
    async changePassword(id: string, password: string): Promise<User> {
        // 通过ID查找用户
        const user = await this.findOneById(id)

        // 如果用户不存在，抛出一个BadRequestException
        if (!user) throw new BadRequestException("用户不存在")

        // 使用bcrypt对新密码进行哈希处理，并将哈希后的密码设置为用户的新密码
        user.password = hashSync(password, 10)

        // 使用EntityManager的persistAndFlush方法保存更改后的用户实例到数据库，并立即执行数据库操作
        await this.em.persistAndFlush(user)

        // 返回更改后的用户实例
        return user
    }
}
