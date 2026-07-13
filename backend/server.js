const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Nexus API is running!', status: 'success' });
});

app.get('/api', (req, res) => {
  res.json({ message: 'API root', endpoints: ['/api/auth', '/api/meetings', '/api/documents'] });
});

module.exports = app;

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}