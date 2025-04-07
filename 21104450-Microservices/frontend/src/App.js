// src/App.js
import React, { useEffect, useState } from "react";
import { ApolloProvider, useQuery, useSubscription } from "@apollo/client";
import client from "./ApolloClient"; // Apollo Client
import { gql } from "graphql-tag";
import './App.css'; // Add this line to import the CSS

// GraphQL Query to fetch all posts
const GET_POSTS = gql`
  query GetPosts {
    posts {
      id
      title
      content
      userId
    }
  }
`;

// GraphQL Subscription for real-time post updates
const POST_ADDED = gql`
  subscription PostAdded {
    postAdded {
      id
      title
      content
      userId
    }
  }
`;

const App = () => {
  const [posts, setPosts] = useState([]);

  // Query to fetch posts
  const { data: queryData, loading: queryLoading } = useQuery(GET_POSTS);

  // Subscription to listen for new posts
  const { data: subscriptionData } = useSubscription(POST_ADDED);

  // Update the state with the initial posts from the query
  useEffect(() => {
    if (queryData) {
      setPosts(queryData.posts);
    }
  }, [queryData]);

  // Add new post from subscription data to the state
  useEffect(() => {
    if (subscriptionData) {
      setPosts((prevPosts) => [subscriptionData.postAdded, ...prevPosts]);
    }
  }, [subscriptionData]);

  if (queryLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      <h1>Posts</h1>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Content</th>
            <th>User ID</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id}>
              <td>{post.title}</td>
              <td>{post.content}</td>
              <td>{post.userId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Root = () => (
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>
);

export default Root;
