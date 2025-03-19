const { ApolloServer, gql, PubSub } = require("apollo-server");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const pubsub = new PubSub();
const POST_ADDED = "POST_ADDED";

const typeDefs = gql`
  type Post {
    id: ID!
    title: String!
    content: String!
    userId: Int!
  }

  type Query {
    posts: [Post]
  }

  type Mutation {
    createPost(title: String!, content: String!, userId: Int!): Post
  }

  type Subscription {
    postAdded: Post
  }
`;

const resolvers = {
  Query: {
    posts: async () => await prisma.post.findMany(),
  },
  Mutation: {
    createPost: async (_, args) => {
      const newPost = await prisma.post.create({ data: args });
      pubsub.publish(POST_ADDED, { postAdded: newPost });
      return newPost;
    },
  },
  Subscription: {
    postAdded: {
      subscribe: () => pubsub.asyncIterator([POST_ADDED]),
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen(4002).then(({ url }) => {
  console.log(`Posts Service running at ${url}`);
});
