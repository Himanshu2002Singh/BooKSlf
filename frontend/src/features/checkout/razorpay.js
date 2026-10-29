// Frontend-only Razorpay Checkout for test mode. Without a server-created order
// there is no signature to verify, and Razorpay refunds order-less payments, so
// live keys are refused here until an order + verify backend exists.
const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

let checkoutScript = null;

export const razorpayKeyId = (import.meta.env.VITE_RAZORPAY_KEY_ID || '').trim();

export function razorpayConfigError(key = razorpayKeyId) {
  if (!key) return 'Razorpay is not configured. Add VITE_RAZORPAY_KEY_ID to frontend/.env and restart the dev server.';
  return '';
}

function loadCheckout() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  checkoutScript ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error('Razorpay Checkout did not load.')));
    script.onerror = () => {
      checkoutScript = null;
      script.remove();
      reject(new Error('Could not reach Razorpay. Check your connection and try again.'));
    };
    document.head.appendChild(script);
  });
  return checkoutScript;
}

export class PaymentError extends Error {
  constructor(message, reason) {
    super(message);
    this.reason = reason;
  }
}

// onOpen fires once Checkout is handed control; Razorpay reports a bad key with
// its own alert and no callback, so callers must not wait on the promise for UI state.
export async function payWithRazorpay({ orderId, keyId, amountPaise, description, prefill, notes, onOpen }) {
  const activeKey = keyId || razorpayKeyId;
  const configError = razorpayConfigError(activeKey);
  if (configError) throw new PaymentError(configError, 'config');
  const Razorpay = await loadCheckout().catch(error => { throw new PaymentError(error.message, 'network'); });

  return new Promise((resolve, reject) => {
    // Checkout stays open after a failed attempt so the buyer can retry; the
    // last failure is reported only if they close it without paying.
    let lastFailure = null;
    const checkout = new Razorpay({
      key: activeKey,
      amount: amountPaise,
      currency: 'INR',
      name: 'Bookfolio.live',
      description,
      ...(orderId ? { order_id: orderId } : {}),
      prefill,
      notes,
      theme: { color: '#e13a00' },
      handler: response => resolve({
        paymentId: response.razorpay_payment_id,
        orderId: response.razorpay_order_id || orderId,
        signature: response.razorpay_signature,
      }),
      modal: {
        ondismiss: () => reject(lastFailure || new PaymentError('Payment was cancelled. You have not been charged.', 'dismissed')),
      },
    });
    checkout.on('payment.failed', response => {
      lastFailure = new PaymentError(response?.error?.description || 'The payment failed. Try another test card or method.', 'failed');
    });
    checkout.open();
    onOpen?.();
  });
}
