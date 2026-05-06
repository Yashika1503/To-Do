const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/user.model');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,  // consistent name
});

const PREMIUM_AMOUNT = 19900; // ₹199

async function createOrder(req, res) {
  try {
    const order = await razorpay.orders.create({
      amount: PREMIUM_AMOUNT,
      currency: 'INR',
      receipt: `receipt_user_${req.userId}_${Date.now()}`,
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('createOrder error:', err);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
}

async function verifyPayment(req, res) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment verification fields' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)  // consistent name
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: 'Invalid payment signature' });
  }

  try {
    await User.setPremium(req.userId);
    res.json({ success: true, message: 'Payment verified. You are now premium!' });
  } catch (err) {
    console.error('verifyPayment error:', err);
    res.status(500).json({ error: 'Payment verified but failed to upgrade account' });
  }
}

module.exports = { createOrder, verifyPayment };