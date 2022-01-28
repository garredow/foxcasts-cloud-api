import { IResolvers } from 'mercurius';

export const resolvers: IResolvers = {
  Query: {
    podcast(root, { podexId }, ctx, info) {
      // root ~ {}
      // name ~ string
      // ctx.authorization ~ string | undefined
      // info ~ GraphQLResolveInfo
      return { title: `test ${ctx.userId}`, podexId };
    },
  },
};
