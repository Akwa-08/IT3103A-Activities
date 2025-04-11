const amqp = require('amqplib');

(async () => {
  const { request, gql } = await import('graphql-request');

  const RABBITMQ_URL = 'amqp://localhost'; // RabbitMQ URL
  const QUEUE_NAME = 'post_queue'; // Queue where messages will be published
  const USER_SERVICE_URL = 'http://localhost:4001'; // URL for user service (replace with actual endpoint)

  const GRAPHQL_SERVER_URL = 'http://localhost:4002/graphql'; // URL for posts service GraphQL endpoint

  const listenForPosts = async () => {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    // Ensure the queue exists with the same durable setting as before
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    console.log(`[*] Waiting for messages in ${QUEUE_NAME}. To exit press CTRL+C`);

    channel.consume(QUEUE_NAME, async (msg) => {
      if (msg !== null) {
        const post = JSON.parse(msg.content.toString());
        console.log(`[*] Received message: ${JSON.stringify(post)}`);

        try {
          // First, validate the user ID exists by querying the user service
          const query = gql`
            query GetUser($id: ID!) {
              user(id: $id) {
                id
              }
            }
          `;

          const result = await request(USER_SERVICE_URL, query, { id: String(post.userId) });

          if (!result.user) {
            throw new Error('User not found, cannot persist post.');
          }

          // Create the post in the database using the GraphQL mutation
          const createPostMutation = gql`
            mutation CreatePost($title: String!, $content: String!, $userId: Int!) {
              createPost(title: $title, content: $content, userId: $userId) {
                id
                title
                content
              }
            }
          `;

          const createdPost = await request(GRAPHQL_SERVER_URL, createPostMutation, post);
          console.log('Post created successfully:', createdPost);

          // Acknowledge the message after processing it
          channel.ack(msg);
        } catch (error) {
          console.error('Error processing message:', error.message);
        }
      }
    });
  };

  listenForPosts().catch(console.error);
})();
