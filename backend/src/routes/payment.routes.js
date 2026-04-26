const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { createOrder, verifyPayment } = require('../controllers/payment.controller');

// Both routes require a logged-in user
router.use(authenticate);

router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);

module.exports = router;