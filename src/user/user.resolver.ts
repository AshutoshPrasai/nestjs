import { Args, Info, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PrismaSelect } from '@paljs/plugins';
import { GraphQLResolveInfo } from 'graphql';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserInput, User } from './user.model';

@Resolver(() => User)
export class UserResolver {
  constructor(private prisma: PrismaService) {}

  @Query(() => [User])
  async users(
    @Info() info: GraphQLResolveInfo,
    @Args('page', { type: () => Int, nullable: true }) page = 1,
    @Args('limit', { type: () => Int, nullable: true }) limit = 10,
  ): Promise<User[]> {
    const select = new PrismaSelect(info).value;
    const skip = (page - 1) * limit;

    return this.prisma.user.findMany({
      ...select,
      skip,
      take: limit,
      where: { deleted: false }, // Exclude soft-deleted users
    });
  }

  @Mutation(() => User)
  async createUser(
    @Args('name') name: string,
    @Args('email') email: string,
  ): Promise<User> {
    return this.prisma.user.create({
      data: {
        name,
        email,
      },
    });
  }

  @Mutation(() => User, { nullable: true })
  async deleteUser(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { deleted: true },
    });

    if (!user) throw new Error(`User with ID ${id} not found`);
    if (user.deleted) throw new Error(`User with ID ${id} is already deleted`);

    return this.prisma.user.update({
      where: { id },
      data: { deleted: true },
    });
  }

  @Mutation(() => User, { nullable: true })
  async restoreUser(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { deleted: true },
    });

    if (!user) throw new Error(`User with ID ${id} not found`);
    if (!user.deleted) throw new Error(`User with ID ${id} is not soft-deleted`);

    return this.prisma.user.update({
      where: { id },
      data: { deleted: false },
    });
  }

  @Mutation(() => User)
  async updateUser(
    @Args('id', { type: () => Int }) id: number,
    @Args('data') updateUserInput: UpdateUserInput,
    @Info() info: GraphQLResolveInfo,
  ): Promise<User> {
    const { name, email } = updateUserInput;
    const select = new PrismaSelect(info).value;

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
      },
      ...select,
    });
  }


  @Mutation(() => Boolean)
  async deleteUsers(
    @Args('ids', { type: () => [Int] }) ids: number[],
  ): Promise<boolean> {
    const deleteResult = await this.prisma.user.updateMany({
      where: { id: { in: ids }, deleted: false },
      data: { deleted: true },
    });

    return deleteResult.count > 0;
  }
}
