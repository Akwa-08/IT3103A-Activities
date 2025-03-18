const { ApolloServer, gql } = require("apollo-server");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const typeDefs = gql`
  type Post {
    id: ID!
    title: String!
    content: String!
    userId: Int!
  }

  type Query {
    posts: [Post]
    post(id: ID!): Post
  }

  type Mutation {
    createPost(title: String!, content: String!, userId: Int!): Post
    updatePost(id: ID!, title: String, content: String): Post
    deletePost(id: ID!): Post
  }
`;

const resolvers = {
  Query: {
    posts: async () => await prisma.post.findMany(),
    post: async (_, args) => await prisma.post.findUnique({ where: { id: Number(args.id) } }),
  },
  Mutation: {
    createPost: async (_, args) => await prisma.post.create({ data: args }),
    updatePost: async (_, args) =>
      await prisma.post.update({ where: { id: Number(args.id) }, data: { title: args.title, content: args.content } }),
    deletePost: async (_, args) => await prisma.post.delete({ where: { id: Number(args.id) } }),
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen(4002).then(({ url }) => {
  console.log(`Posts Service running at ${url}`);
});
