import * as PaymentService from '../services/payment.service.js';

// POST /api/payments/order
export async function createOrder(request, response) {
  const result = await PaymentService.createOrder({
    userId: request.user.id,
    themeId: request.body?.themeId,
  });
  response.json(result);
}

// POST /api/payments/verify
export async function verifyPayment(request, response) {
  const result = await PaymentService.verifyPayment({
    userId: request.user.id,
    orderId: request.body?.orderId,
    paymentId: request.body?.paymentId,
    signature: request.body?.signature,
    themeId: request.body?.themeId,
  });
  response.json(result);
}
