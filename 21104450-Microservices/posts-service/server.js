const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const { PrismaClient } = require("@prisma/client");
const { PubSub } = require("graphql-subscriptions");
const http = require("http");
const { SubscriptionServer } = require("subscriptions-transport-ws");  // Correct import for WebSocket server
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { execute, subscribe } = require("graphql");  // Import execute and subscribe from graphql package

const prisma = new PrismaClient();
const pubsub = new PubSub();
const app = express();

// Define GraphQL Schema
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
  }

  type Subscription {
    postAdded: Post
  }
`;

// Resolvers
const resolvers = {
  Query: {
    posts: async () => await prisma.post.findMany(),
  },
  Mutation: {
    createPost: async (_, args) => {
      const newPost = await prisma.post.create({ data: args });
      pubsub.publish("POST_ADDED", { postAdded: newPost });
      return newPost;
    },
  },
  Subscription: {
    postAdded: {
      subscribe: () => pubsub.asyncIterator("POST_ADDED"),
    },
  },
};

// Create GraphQL Schema
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Create HTTP Server
const httpServer = http.createServer(app);

// WebSocket Server for Subscriptions (using subscriptions-transport-ws)
const subscriptionServer = SubscriptionServer.create(
  {
    schema,
    execute,
    subscribe,
  },
  {
    server: httpServer,
    path: "/graphql",  // WebSocket path for subscriptions
  }
);

// Create Apollo Server (Express-based)
const server = new ApolloServer({
  schema,
  plugins: [
    {
      async serverWillStart() {
        return {
          async drainServer() {
            subscriptionServer.close();  // Gracefully close WebSocket server when Apollo server shuts down
          },
        };
      },
    },
  ],
});

// Start the Apollo Server
async function startServer() {
  // Start Apollo Server
  await server.start();
  server.applyMiddleware({ app });  // Apply middleware for Express
  
  // Start the HTTP Server
  httpServer.listen(4002, () => {
    console.log("✅ Post service running at http://localhost:4002/graphql");
    console.log("✅ WebSockets ready at ws://localhost:4002/graphql");
  });
}

// Start the service
startServer();
