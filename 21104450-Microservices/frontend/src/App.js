// src/App.js
import React, { useEffect, useState } from "react";
import { gql, useQuery, useMutation, useSubscription } from "@apollo/client";
import './App.css';

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

const POST_ADDED = gql`
  subscription {
    postAdded {
      id
      title
      content
      userId
    }
  }
`;

const DELETE_POST = gql`
  mutation deletePost($id: ID!) {
    deletePost(id: $id) {
      id
    }
  }
`;

const App = () => {
  const [posts, setPosts] = useState([]);
  const { data: initialData } = useQuery(GET_POSTS);
  const { data: subData } = useSubscription(POST_ADDED);
  const [deletePost] = useMutation(DELETE_POST);

  useEffect(() => {
    if (initialData) {
      setPosts(initialData.posts);
    }
  }, [initialData]);

  useEffect(() => {
    if (subData) {
      setPosts((prev) => [subData.postAdded, ...prev]);
    }
  }, [subData]);

  const handleDelete = async (id) => {
    try {
      await deletePost({ variables: { id } });
      setPosts((prev) => prev.filter(post => post.id !== id));
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  return (
    <div className="App">
      <h1>Greek Style Posts</h1>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Content</th>
            <th>User ID</th>
            <th>Action</th> {/* New column for delete button */}
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id}>
              <td>{post.title}</td>
              <td>{post.content}</td>
              <td>{post.userId}</td>
              <td>
                <button onClick={() => handleDelete(post.id)} className="delete-btn">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer>E Pasar Nako Sir pls</footer>
    </div>
  );
};

export default App;
