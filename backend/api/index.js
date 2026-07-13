const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Route files (CommonJS)
const authRoutes = require('../routes/authRoutes');
const meetingRoutes = require('../routes/meetingRoutes');
const documentRoutes = require('../routes/documentRoutes');
const userRoutes = require('../routes/userRoutes');

dotenv.config();

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// MongoDB Connection (with caching)
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

// Basic Routes
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

// Mount actual routes
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/users', userRoutes);

// For Vercel
module.exports = app;

// For local development (optional)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Local server running on port ${PORT}`);
  });
}
