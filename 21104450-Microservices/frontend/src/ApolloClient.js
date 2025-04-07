import { ApolloClient, InMemoryCache, split, HttpLink } from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { getMainDefinition } from "@apollo/client/utilities";

// HTTP Link for Queries & Mutations
const httpLink = new HttpLink({
  uri: "http://localhost:4002/graphql", // Ensure this matches your backend
});

// WebSocket Link for Subscriptions
const wsLink = new GraphQLWsLink(
  createClient({
    url: "ws://localhost:4002/graphql",
  })
);

// Use split to route subscriptions via WebSocket, everything else via HTTP
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  httpLink
);

// Apollo Client
const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

export default client;
