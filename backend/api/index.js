import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// MongoDB Connection (with caching for serverless)
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI)
      .then(mongoose => mongoose);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Nexus API is running!', status: 'success' });
});

app.get('/api', (req, res) => {
  res.json({ message: 'API root', endpoints: ['/api/auth', '/api/meetings', '/api/documents'] });
});

app.get('/api/test', async (req, res) => {
  await dbConnect();
  res.json({ message: 'Test route working!', db: 'connected' });
});

export default app;