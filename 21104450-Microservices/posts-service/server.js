// posts-service/server.js

const express = require("express");
const http = require("http");
const cors = require("cors");
const { expressMiddleware } = require("@apollo/server/express4");
const { ApolloServer } = require("@apollo/server");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { WebSocketServer } = require("ws");
const { useServer } = require("graphql-ws/lib/use/ws");
const bodyParser = require("body-parser");
const { PrismaClient } = require("@prisma/client");
const pubsub = require("./pubsub");

const prisma = new PrismaClient();
const PORT = 4002;

const typeDefs = `
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
    deletePost(id: ID!): Post
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
      const { request, gql } = await import("graphql-request");
      
      const USER_SERVICE_URL = "http://localhost:4001"; // users-service URL
      const query = gql`
        query GetUser($id: ID!) {
          user(id: $id) {
            id
          }
        }
      `;
  
      try {
        const result = await request(USER_SERVICE_URL, query, { id: String(args.userId) });
  
        if (!result.user) {
          throw new Error("User not found");
        }
  
        const newPost = await prisma.post.create({ data: args });
        pubsub.publish("POST_ADDED", { postAdded: newPost });
        return newPost;
      } catch (error) {
        console.error("User validation failed:", error.message);
        throw new Error("Cannot create post: User does not exist.");
      }
    },

    deletePost: async (_, { id }) => {
      const deletedPost = await prisma.post.delete({
        where: { id: parseInt(id) }, // Ensure the id is parsed as an integer
      });
      return deletedPost;
    },
  },
  Subscription: {
    postAdded: {
      subscribe: () => pubsub.asyncIterableIterator("POST_ADDED"),
    },
  },
};

async function startApolloServer() {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());

  const httpServer = http.createServer(app);
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });

  const serverCleanup = useServer({ schema }, wsServer);

  const apolloServer = new ApolloServer({
    schema,
    plugins: [{
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          }
        };
      }
    }]
  });

  await apolloServer.start();
  app.use("/graphql", expressMiddleware(apolloServer));

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    console.log(`📡 Subscriptions ready at ws://localhost:${PORT}/graphql`);
  });
}

startApolloServer();
