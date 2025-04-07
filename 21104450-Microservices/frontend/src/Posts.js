import React, { useState, useEffect } from 'react';
import { useQuery, useSubscription } from '@apollo/client';
import { gql } from 'graphql-tag';

// Define the GraphQL query to fetch posts
const GET_POSTS = gql`
  query {
    posts {
      id
      title
      content
      userId
    }
  }
`;

// Define the GraphQL subscription to listen for new posts
const POST_ADDED_SUBSCRIPTION = gql`
  subscription {
    postAdded {
      id
      title
      content
      userId
    }
  }
`;

const Posts = () => {
  const { loading, error, data } = useQuery(GET_POSTS);
  const { data: newPostData } = useSubscription(POST_ADDED_SUBSCRIPTION);
  const [posts, setPosts] = useState([]);

  // Update the posts when new data is received from the subscription
  useEffect(() => {
    if (newPostData) {
      setPosts((prevPosts) => [...prevPosts, newPostData.postAdded]);
    }
  }, [newPostData]);

  // Display loading or error message
  if (loading) return <p>Loading posts...</p>;
  if (error) return <p>Error fetching posts: {error.message}</p>;

  return (
    <div>
      <h1>Posts</h1>
      <ul>
        {data.posts.map((post) => (
          <li key={post.id}>
            <h3>{post.title}</h3>
            <p>{post.content}</p>
            <small>Written by User ID: {post.userId}</small>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Posts;
