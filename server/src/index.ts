import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { networkInterfaces } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupSocketHandlers } from './socket/handlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Get local IP address
function getLocalIP(): string {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      // Skip internal and non-IPv4 addresses
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const PORT = process.env.PORT || 3000;
const LOCAL_IP = getLocalIP();

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? false
      : ['http://localhost:5173', `http://${LOCAL_IP}:5173`],
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// API endpoint to get server info (for QR code generation)
app.get('/api/server-info', (req, res) => {
  const clientPort = process.env.NODE_ENV === 'production' ? PORT : 5173;
  res.json({
    ip: LOCAL_IP,
    port: clientPort,
    url: `http://${LOCAL_IP}:${clientPort}`
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// In production, serve static files
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));

  // Handle client-side routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  // In development, redirect to Vite dev server
  app.get('/', (req, res) => {
    res.redirect(`http://${LOCAL_IP}:5173`);
  });
  app.get('/join/:code?', (req, res) => {
    const code = req.params.code || '';
    res.redirect(`http://${LOCAL_IP}:5173/join/${code}`);
  });
}

// Setup socket handlers
setupSocketHandlers(io);

// Start server
httpServer.listen(PORT, () => {
  console.log('');
  console.log('='.repeat(50));
  console.log('  Sushi Go! Server Running');
  console.log('='.repeat(50));
  console.log('');
  console.log(`  Local:    http://localhost:${PORT}`);
  console.log(`  Network:  http://${LOCAL_IP}:${PORT}`);
  console.log('');
  console.log('  Open the Network URL on your tablet to host a game.');
  console.log('  Players can scan the QR code to join!');
  console.log('');
  console.log('='.repeat(50));
});
