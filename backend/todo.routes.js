const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { getTodos, createTodo, updateTodo, deleteTodo } = require('../controllers/todo.controller');

// All todo routes require authentication
router.use(authenticate);

router.get('/', getTodos);
router.post('/', createTodo);
router.patch('/:id', updateTodo);
router.delete('/:id', deleteTodo);

module.exports = router;
