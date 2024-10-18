import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  name?: string; // Optional field

  @Field({ nullable: true })
  email?: string; // Optional field
}
