const { ApolloServer, gql } = require("apollo-server");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
  }

  type Query {
    users: [User]
    user(id: ID!): User
  }

  type Mutation {
    createUser(name: String!, email: String!): User
    updateUser(id: ID!, name: String, email: String): User
    deleteUser(id: ID!): User
  }
`;

const resolvers = {
  Query: {
    users: async () => await prisma.user.findMany(),
    user: async (_, args) => await prisma.user.findUnique({ where: { id: Number(args.id) } }),
  },
  Mutation: {
    createUser: async (_, args) => await prisma.user.create({ data: args }),
    updateUser: async (_, args) => 
      await prisma.user.update({ where: { id: Number(args.id) }, data: { name: args.name, email: args.email } }),
    deleteUser: async (_, args) => await prisma.user.delete({ where: { id: Number(args.id) } }),
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen(4001).then(({ url }) => {
  console.log(`Users Service running at ${url}`);
});
