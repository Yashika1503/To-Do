const Todo = require('../models/todo.model');
const redis = require('../config/redis');

const CACHE_TTL = 60; // seconds

function cacheKey(userId) {
  return `todos:${userId}`;
}

async function getTodos(req, res) {
  const userId = req.userId;
  const key = cacheKey(userId);

  try {
    // Try cache first
    if (redis) {
      const cached = await redis.get(key);
      if (cached) {
        return res.json({ todos: JSON.parse(cached), cached: true });
      }
    }

    const todos = await Todo.findAllByUser(userId);

    if (redis) {
      await redis.setEx(key, CACHE_TTL, JSON.stringify(todos));
    }

    res.json({ todos, cached: false });
  } catch (err) {
    console.error('getTodos error:', err);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
}

async function createTodo(req, res) {
  const { title } = req.body;
  const userId = req.userId;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    // Create todo in DB
    const todo = await Todo.create(userId, title.trim());

    // Invalidate cache ONLY if Redis is available
    if (redis && redis.isOpen) {
      try {
        await redis.del(cacheKey(userId));
      } catch (err) {
        console.log('Redis delete failed (ignored)');
      }
    }

    res.status(201).json({ todo });

  } catch (err) {
    console.error('createTodo error:', err);
    res.status(500).json({ error: 'Failed to create todo' });
  }
}

async function updateTodo(req, res) {
  const { id } = req.params;
  const userId = req.userId;
  const { title, completed } = req.body;

  if (title === undefined && completed === undefined) {
    return res.status(400).json({ error: 'Provide title or completed to update' });
  }

  try {
    const todo = await Todo.update(id, userId, { title, completed });

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    // Invalidate cache safely
    if (redis && redis.isOpen) {
      try {
        await redis.del(cacheKey(userId));
      } catch (err) {
        console.log('Redis delete failed (ignored)');
      }
    }

    res.json({ todo });

  } catch (err) {
    console.error('updateTodo error:', err);
    res.status(500).json({ error: 'Failed to update todo' });
  }
}

async function deleteTodo(req, res) {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const deleted = await Todo.delete(id, userId);

    if (!deleted) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    // Invalidate cache safely
    if (redis && redis.isOpen) {
      try {
        await redis.del(cacheKey(userId));
      } catch (err) {
        console.log('Redis delete failed (ignored)');
      }
    }

    res.json({ message: 'Todo deleted' });

  } catch (err) {
    console.error('deleteTodo error:', err);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
}

module.exports = { getTodos, createTodo, updateTodo, deleteTodo };
