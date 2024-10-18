import { Args, Info, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PrismaSelect } from '@paljs/plugins';
import { GraphQLResolveInfo } from 'graphql';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserInput, User } from './user.model';

@Resolver(() => User)
export class UserResolver {
  constructor(private prisma: PrismaService) {}

  @Query(() => [User])
  async users(@Info() info: GraphQLResolveInfo): Promise<User[]> {
    // Use PrismaSelect from @paljs/plugins to select fields dynamically
    const select = new PrismaSelect(info).value;

    return this.prisma.user.findMany({
      ...select, // Pass the select object from PrismaSelect to findMany
    });
  }

  @Query(() => User, { nullable: true })
  async user(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
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

  @Mutation(() => User)
  async updateUser(
    @Args('id', { type: () => Int }) id: number,
    @Args('data') updateUserInput: UpdateUserInput,
    @Info() info: GraphQLResolveInfo,
  ): Promise<User> {
    const { name, email } = updateUserInput;

    // PrismaSelect to fetch only the requested fields in the response
    const select = new PrismaSelect(info).value;

    // Prisma update query to update only provided fields
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }), // Conditionally include the `name` if provided
        ...(email && { email }), // Conditionally include the `email` if provided
      },
      ...select, // Pass the select object from PrismaSelect to get only requested fields
    });
  }
}
