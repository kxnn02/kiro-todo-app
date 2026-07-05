const express = require('express');
const cors = require('cors');
const { getDb, closeDb } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server after DB is ready
async function start() {
  await getDb();

  // Routes
  app.use('/api/categories', require('./routes/categories'));
  app.use('/api/tags', require('./routes/tags'));
  app.use('/api/tasks', require('./routes/tasks'));
  app.use('/api/subtasks', require('./routes/subtasks'));

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  });

  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    closeDb();
    server.close(() => process.exit(0));
  });

  process.on('SIGTERM', () => {
    closeDb();
    server.close(() => process.exit(0));
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app;
