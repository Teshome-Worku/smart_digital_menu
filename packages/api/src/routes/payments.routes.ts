import { Router } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/apiResponse';
import { authenticate } from '../middleware/auth';
import { requireTenant, TenantRequest } from '../middleware/tenantContext';

const router = Router();
// const CHAPA_URL = 'https://api.chapa.co/v1';
const CHAPA_URL = 'https://api.chapa.global/v2';// The Chapa API URL latest version as of 2024-06-10. The previous URL (api.chapa.co) is deprecated and may not work in the future. Use this new URL for all Chapa API requests.
const chapaKey = () => process.env.CHAPA_TEST_SECRET_KEY || '';
const publicAppUrl = () => (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '').trim();
const toChapaCents = (amount: number) => Math.round(amount * 100);

export async function verifyAndApply(reference: string) {
  let payment = await prisma.payment.findFirst({
    where: {
      OR: [
        { merchantReference: reference },
        { providerReference: reference }
      ]
    },
    include: { order: true }
  });

  // If not found directly, it might be a Chapa transaction reference (e.g. HCipiaIYSreT).
  // Query Chapa verify endpoint to resolve the merchant_reference.
  if (!payment && chapaKey()) {
    try {
      const directVerify = await fetch(`${CHAPA_URL}/payments/${encodeURIComponent(reference)}/verify`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${chapaKey()}`
        }
      });
      if (directVerify.ok) {
        const directBody: any = await directVerify.json();
        const resolvedRef = directBody?.data?.merchant_reference || directBody?.data?.tx_ref;
        if (resolvedRef) {
          payment = await prisma.payment.findFirst({
            where: { merchantReference: resolvedRef },
            include: { order: true }
          });
        }
      }
    } catch {
      // Non-blocking fallback
    }
  }

  if (!payment) return null;
  if (payment.method !== 'CHAPA' || payment.status === 'PAID') return payment;
  if (!chapaKey()) throw AppError.badRequest('Online payment is not configured. Choose cash or ask the restaurant to configure Chapa test mode.');

  const verifyToken = payment.providerReference || reference;

  const result = await fetch(`${CHAPA_URL}/payments/${encodeURIComponent(verifyToken)}/verify`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${chapaKey()}`
    }
  });
  if (!result.ok) return payment;

  const body: any = await result.json();
  const data = body.data;
  const expectedAmountInCents = toChapaCents(payment.amount);
  const providerAmount = Number(data?.amount);
  const statusUpper = String(data?.status || '').toUpperCase();

  const isSuccess = (body.status === 'success' || body.status === 'SUCCESS') &&
    (statusUpper === 'SUCCESS' || statusUpper === 'PAID');

  const matchesReference = !data?.merchant_reference ||
    data?.merchant_reference === payment.merchantReference ||
    data?.tx_ref === payment.merchantReference;

  const matchesAmount = providerAmount === expectedAmountInCents || providerAmount === payment.amount;
  const matchesCurrency = !data?.currency || data?.currency === payment.currency;

  if (isSuccess && matchesReference && matchesAmount && matchesCurrency) {
    return prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        paidAt: new Date()
      }
    });
  }
  return payment;
}

// Customer starts hosted checkout only for their own session's order.
router.post('/customer/orders/:orderId/payments/chapa', async (req, res, next) => {
  let createdOrderId: string | null = null;
  try {
    const token = req.cookies.sdm_session; if (!token) throw AppError.unauthorized('No active session');
    const orderId = req.params.orderId;
    if (typeof orderId !== 'string') throw AppError.badRequest('Invalid order ID');
    const order = await prisma.order.findFirst({ where: { id: orderId, customerSession: { sessionToken: token, expiresAt: { gt: new Date() } } }, include: { payments: true, restaurant: { select: { slug: true } } } });
    if (!order) throw AppError.notFound('Order not found');
    createdOrderId = order.id;

    const payment = order.payments.find(p => p.method === 'CHAPA');
    if (!payment) throw AppError.badRequest('This order was placed for cash payment.');
    if (payment.status === 'PAID') return sendSuccess(res, { status: payment.status });
    if (!chapaKey()) throw AppError.badRequest('Chapa test mode is not configured for this restaurant.');
    if (payment.currency !== 'ETB') throw AppError.badRequest('Chapa checkout currently requires the restaurant currency to be ETB.');

    const callback = (process.env.CHAPA_CALLBACK_URL || '').trim();
    let parsedCallback: URL;
    try {
      parsedCallback = new URL(callback);
    } catch {
      throw AppError.badRequest('Chapa callback URL is invalid. Configure a public HTTPS callback URL.');
    }
    if (parsedCallback.protocol !== 'https:' || parsedCallback.pathname !== '/api/v1/payments/chapa/callback') {
      throw AppError.badRequest('Chapa callback URL must be a public HTTPS URL ending in /api/v1/payments/chapa/callback.');
    }
    const appUrl = publicAppUrl();
    let parsedAppUrl: URL;
    try {
      parsedAppUrl = new URL(appUrl);
    } catch {
      throw AppError.badRequest('Chapa return URL is invalid. Configure NEXT_PUBLIC_APP_URL as a public HTTPS frontend URL.');
    }
    if (parsedAppUrl.protocol !== 'https:') {
      throw AppError.badRequest('Chapa return URL must be a public HTTPS frontend URL. Deploy the frontend and set NEXT_PUBLIC_APP_URL before using online payment.');
    }
    const returnUrl = `${appUrl.replace(/\/$/, '')}/m/${order.restaurant.slug}/order/${order.id}`;//the return URL is where the user will be redirected after completing the payment on Chapa's site

    // Start hosted checkout with Chapa API
    const response = await fetch(`${CHAPA_URL}/payments/hosted`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${chapaKey()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: toChapaCents(payment.amount),
          currency: payment.currency,
          merchant_reference: payment.merchantReference,
          tx_ref: payment.merchantReference,
          callback_url: callback,
          return_url: returnUrl,
          meta: {
            hide_receipt: true,
            order_id: order.id,
            order_number: String(order.orderNumber)
          },
          customization: {
            title: 'Smart Digital Menu order',
            description: `Order #${order.orderNumber}`
          }
        })
      });

    const body: any = await response.json();
    if (!response.ok || body.status !== 'success' || !body.data?.checkout_url) throw AppError.badRequest(body.message || 'Could not start Chapa checkout.');

    const checkoutUrl: string = body.data.checkout_url;
    const checkoutToken = checkoutUrl.split('/').pop() || null;

    if (checkoutToken) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { providerReference: checkoutToken }
      });
    }

    sendSuccess(res, {
      checkoutUrl,
      paymentReference: payment.merchantReference
    });
  }
  catch (err) {
    if (createdOrderId) {
      await prisma.order.deleteMany({
        where: {
          id: createdOrderId,
          status: 'PENDING',
          payments: { some: { method: 'CHAPA', status: 'PENDING' } },
        },
      });
    }
    next(err);
  }
});

router.get('/payments/chapa/callback', async (req, res, next) => {
  try {
    const ref = String(req.query.trx_ref || '');
    if (ref) await verifyAndApply(ref);
    sendSuccess(res, { received: true });
  }
  catch (err) {
    next(err);
  }
}
);

router.post('/payments/chapa/webhook', async (req, res, next) => {
  try {
    const secret = process.env.CHAPA_WEBHOOK_SECRET;
    if (!secret) throw AppError.unauthorized('Webhook is not configured');
    const payload = JSON.stringify(req.body);
    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const signature = String(
      req.headers['x-chapa-signature'] ||
      req.headers['chapa-signature'] || '');
    if (
      !signature ||
      signature.length !== expected.length ||
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expected)
      )
    ) throw AppError.unauthorized('Invalid webhook signature');

    const ref = req.body?.tx_ref || req.body?.data?.tx_ref;
    if (ref)
      await verifyAndApply(String(ref));
    sendSuccess(res, { received: true });
  } catch (err) { next(err); }
});

// Admin confirms cash payment for an order. Only OWNER, MANAGER, or STAFF can confirm cash payments.
router.post('/restaurants/:restaurantId/orders/:orderId/payments/cash-confirm', authenticate, requireTenant('OWNER', 'MANAGER', 'STAFF'), async (req, res, next) => {
  try {
    const { restaurantId } = req as TenantRequest;
    const orderId = req.params.orderId;
    if (typeof orderId !== 'string') throw AppError.badRequest('Invalid order ID');
    const payment = await prisma.payment.findFirst({
      where:
      {
        orderId,
        order: { restaurantId },
        method: 'CASH'
      }
    });
    if (!payment) throw AppError.notFound('Cash payment not found');
    if (payment.status === 'PAID') return sendSuccess(res, payment);

    const updated = await prisma.payment.update(
      {
        where:
          { id: payment.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          confirmedAt: new Date(),
          confirmedByUserId: (req as any).user.id
        }
      });
    sendSuccess(res, updated);
  }
  catch (err) {
    next(err)
  }
});
export default router;
