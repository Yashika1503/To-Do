const db = require('../config/db');

const Todo = {
  async findAllByUser(userId) {
    const { rows } = await db.query(
      'SELECT * FROM todos WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  },

  async findById(id, userId) {
    const { rows } = await db.query(
      'SELECT * FROM todos WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return rows[0] || null;
  },

  async create(userId, title) {
    const { rows } = await db.query(
      'INSERT INTO todos (user_id, title) VALUES ($1, $2) RETURNING *',
      [userId, title]
    );
    return rows[0];
  },

  async update(id, userId, fields) {
    // Build dynamic SET clause from provided fields
    const allowed = ['title', 'completed'];
    const updates = [];
    const values = [];
    let idx = 1;

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = $${idx++}`);
        values.push(fields[key]);
      }
    }

    if (updates.length === 0) return null;

    values.push(id, userId);
    const { rows } = await db.query(
      `UPDATE todos SET ${updates.join(', ')} WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`,
      values
    );
    return rows[0] || null;
  },

  async delete(id, userId) {
    const { rowCount } = await db.query(
      'DELETE FROM todos WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return rowCount > 0;
  },
};

module.exports = Todo;