import { io } from 'socket.io-client';

const GATEWAY_URL = "http://localhost:5000";

// Export a single, stable connection instance across the client app
export const socket = io(GATEWAY_URL, {
  autoConnect: true,
  reconnectionAttempts: 5
});