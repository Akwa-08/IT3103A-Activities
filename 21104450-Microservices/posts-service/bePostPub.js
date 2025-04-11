const amqp = require('amqplib');
const { faker } = require('@faker-js/faker'); // Updated import

const RABBITMQ_URL = 'amqp://localhost';  // RabbitMQ URL
const EXCHANGE_NAME = 'post_exchange';
const QUEUE_NAME = 'post_queue';

// Dynamically import graphql-request
const fetchUserIds = async () => {
  const { request, gql } = await import('graphql-request');
  const GET_USERS = gql`
    query {
      users {
        id
      }
    }
  `;
  
  try {
    const response = await request("http://localhost:4001/graphql", GET_USERS);  // Assuming user service is running on port 4001
    return response.users.map(user => user.id);  // Extract user IDs
  } catch (error) {
    console.error("Error fetching user IDs:", error);
    return [];
  }
};

// Function to generate synthetic post data
const generatePostData = (userIds) => {
  const randomUserId = userIds[Math.floor(Math.random() * userIds.length)]; // Randomly select a userId from the fetched list
  return {
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraph(),
    userId: parseInt(randomUserId, 10),
  };
};

// Function to connect to RabbitMQ and publish the message
const publishPost = async () => {
  try {
    const userIds = await fetchUserIds();  // Fetch the list of user IDs from the user service

    if (userIds.length === 0) {
      console.log("No users found, stopping post generation.");
      return;
    }

    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    // Update to make the exchange durable to match existing configuration
    await channel.assertExchange(EXCHANGE_NAME, 'fanout', { durable: true });
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    // Bind queue to exchange
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, "");

    // Publish a synthetic post every 1 second
    setInterval(async () => {
      const postData = generatePostData(userIds); // Generate post data with random userId from fetched list
      const message = JSON.stringify(postData);
      channel.publish(EXCHANGE_NAME, '', Buffer.from(message));
      console.log('Published:', postData);
    }, 1000);

  } catch (error) {
    console.error('Error in publishing post:', error);
  }
};

publishPost();
