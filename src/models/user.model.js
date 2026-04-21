const db = require('../config/db');

const User = {
  async findByEmail(email) {
    const { rows } = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await db.query(
      'SELECT id, email, is_premium FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async create(email, hashedPassword) {
    const { rows } = await db.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, is_premium',
      [email, hashedPassword]
    );
    return rows[0];
  },

  // NEW: upgrade user to premium after successful payment
  async setPremium(id) {
    const { rows } = await db.query(
      'UPDATE users SET is_premium = TRUE WHERE id = $1 RETURNING id, email, is_premium',
      [id]
    );
    return rows[0];
  },
};

module.exports = User;