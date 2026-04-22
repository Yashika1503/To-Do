require('dotenv').config();
require('./config/db');
const cors = require('cors');
const express = require('express');
const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/auth', require('./routes/auth.routes'));
app.use('/todos', require('./routes/todo.routes'));
app.use('/payment', require('./routes/payment.routes')); // NEW

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));