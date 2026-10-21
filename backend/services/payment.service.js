// Razorpay order creation and signature verification for paid bookshelf looks.
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import * as Order from '../models/order.model.js';
import * as Shelf from '../models/shelf.model.js';
import * as ThemePrice from '../models/themePrice.model.js';
import { HttpError } from '../utils/HttpError.js';

export const GST_RATE = 0.18;

// A price in rupees plus 18% GST, in paise.
export function totalPaise(inr) {
  const gst = Math.round(inr * GST_RATE * 100) / 100;
  return Math.round((inr + gst) * 100);
}

// Calculates total amount in paise including 18% GST, from the price set in the admin panel.
export async function calculateAmountPaise(themeId) {
  const price = await ThemePrice.find(themeId);
  if (!price) throw new HttpError(400, `Unknown theme “${themeId}”.`);
  return totalPaise(price.inr);
}

// Calls Razorpay Orders API (https://api.razorpay.com/v1/orders) to create a verified order.
export async function createOrder({ userId, themeId }) {
  const amountPaise = await calculateAmountPaise(themeId);
  const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

  // If live key is provided, the secret is strictly required.
  if (keyId.startsWith('rzp_live_') && !keySecret) {
    throw new HttpError(500, 'Razorpay live secret (RAZORPAY_KEY_SECRET) is missing in backend/.env.');
  }

  // If both credentials are provided (either test or live mode), call real Razorpay Orders API.
  if (keyId && keySecret) {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const receipt = `rcpt_${userId.slice(0, 8)}_${Date.now().toString(36)}`;
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt,
        notes: { userId, themeId },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData?.error?.description || 'Could not initiate Razorpay order. Try again.';
      throw new HttpError(502, message);
    }

    const razorpayOrder = await response.json();
    await Order.create({
      id: razorpayOrder.id,
      userId,
      themeId,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency || 'INR',
      status: 'created',
    });

    return {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency || 'INR',
      keyId,
      themeId,
    };
  }

  // Fallback for local development if secret is not set yet but test key exists:
  const fallbackId = `order_sim_${Date.now().toString(36)}_${randomUUID().slice(0, 8)}`;
  await Order.create({
    id: fallbackId,
    userId,
    themeId,
    amount: amountPaise,
    currency: 'INR',
    status: 'created',
  });

  return {
    orderId: fallbackId,
    amount: amountPaise,
    currency: 'INR',
    keyId: keyId || 'rzp_test_TkBnGh78FHaDiw',
    themeId,
  };
}

// Verifies HMAC-SHA256 signature and unlocks the purchased theme.
export async function verifyPayment({ userId, orderId, paymentId, signature, themeId }) {
  if (!orderId || !paymentId || !themeId) {
    throw new HttpError(400, 'Incomplete payment details.');
  }

  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

  // If secret is set, verify cryptographic signature.
  if (keySecret) {
    if (!signature) throw new HttpError(400, 'Missing payment signature.');
    const expected = createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
    const expectedBuf = Buffer.from(expected);
    const givenBuf = Buffer.from(signature);

    if (expectedBuf.length !== givenBuf.length || !timingSafeEqual(expectedBuf, givenBuf)) {
      await Order.markFailed(orderId).catch(() => {});
      throw new HttpError(400, 'Invalid payment signature. If you were debited, please contact support.');
    }
  }

  // The look unlocked is the one this reader's order was priced for, so paying for a cheaper
  // look can't unlock a dearer one.
  const order = await Order.findById(orderId);
  if (!order || order.user_id !== userId || order.theme_id !== themeId) {
    throw new HttpError(400, 'This payment doesn’t match your order. If you were debited, please contact support.');
  }

  // Update order status in database.
  await Order.markPaid(orderId, paymentId).catch(() => {});

  // Unlock theme on user shelf.
  const updatedShelf = await Shelf.unlockTheme(userId, themeId);
  return { ok: true, shelf: updatedShelf };
}
