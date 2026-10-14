import { Router } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/apiResponse';
import { authenticate } from '../middleware/auth';
import { requireTenant, TenantRequest } from '../middleware/tenantContext';

const router = Router();
const CHAPA_URL = 'https://api.chapa.co/v1';
const chapaKey = () => process.env.CHAPA_TEST_SECRET_KEY || '';
const publicAppUrl = () => process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '';

async function verifyAndApply(reference: string) {
  const payment = await prisma.payment.findUnique({ where: { merchantReference: reference }, include: { order: true } });
  if (!payment) throw AppError.notFound('Payment not found');
  if (payment.method !== 'CHAPA' || payment.status === 'PAID') return payment;
  if (!chapaKey()) throw AppError.badRequest('Online payment is not configured. Choose cash or ask the restaurant to configure Chapa test mode.');
  const result = await fetch(`${CHAPA_URL}/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${chapaKey()}` } });
  if (!result.ok) return payment;
  const body: any = await result.json(); const data = body.data;
  const paid = body.status === 'success' && data?.status === 'success' && data?.tx_ref === reference && Number(data?.amount) === payment.amount && data?.currency === payment.currency && data?.mode === 'test';
  if (!paid) return payment;
  return prisma.payment.update({ where: { id: payment.id }, data: { status: 'PAID', providerReference: data.reference ?? null, paidAt: new Date() } });
}

// Customer starts hosted checkout only for their own session's order.
router.post('/customer/orders/:orderId/payments/chapa', async (req, res, next) => { try {
  const token = req.cookies.sdm_session; if (!token) throw AppError.unauthorized('No active session');
  const order = await prisma.order.findFirst({ where: { id: req.params.orderId, customerSession: { sessionToken: token, expiresAt: { gt: new Date() } } }, include: { payments: true, restaurant: { select: { slug: true } } } });
  if (!order) throw AppError.notFound('Order not found');
  const payment = order.payments.find(p => p.method === 'CHAPA');
  if (!payment) throw AppError.badRequest('This order was placed for cash payment.');
  if (payment.status === 'PAID') return sendSuccess(res, { status: payment.status });
  if (!chapaKey() || !publicAppUrl()) throw AppError.badRequest('Chapa test mode is not configured for this restaurant.');
  if (payment.currency !== 'ETB') throw AppError.badRequest('Chapa checkout currently requires the restaurant currency to be ETB.');
  const callback = process.env.CHAPA_CALLBACK_URL || `${publicAppUrl().replace(/\/$/, '')}/api/backend/payments/chapa/callback`;
  const returnUrl = `${publicAppUrl().replace(/\/$/, '')}/m/${order.restaurant.slug}/order/${order.id}`;
  const response = await fetch(`${CHAPA_URL}/transaction/initialize`, { method: 'POST', headers: { Authorization: `Bearer ${chapaKey()}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: String(payment.amount), currency: payment.currency, tx_ref: payment.merchantReference, callback_url: callback, return_url: returnUrl, customization: { title: 'Smart Digital Menu order', description: `Order #${order.orderNumber}` } }) });
  const body: any = await response.json(); if (!response.ok || body.status !== 'success' || !body.data?.checkout_url) throw AppError.badRequest(body.message || 'Could not start Chapa checkout.');
  sendSuccess(res, { checkoutUrl: body.data.checkout_url, paymentReference: payment.merchantReference });
} catch (err) { next(err); } });

router.get('/payments/chapa/callback', async (req, res, next) => { try { const ref = String(req.query.trx_ref || ''); if (ref) await verifyAndApply(ref); sendSuccess(res, { received: true }); } catch (err) { next(err); } });

router.post('/payments/chapa/webhook', async (req, res, next) => { try {
  const secret = process.env.CHAPA_WEBHOOK_SECRET; if (!secret) throw AppError.unauthorized('Webhook is not configured');
  const payload = JSON.stringify(req.body); const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const signature = String(req.headers['x-chapa-signature'] || req.headers['chapa-signature'] || '');
  if (!signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw AppError.unauthorized('Invalid webhook signature');
  const ref = req.body?.tx_ref || req.body?.data?.tx_ref; if (ref) await verifyAndApply(String(ref));
  sendSuccess(res, { received: true });
} catch (err) { next(err); } });

router.post('/restaurants/:restaurantId/orders/:orderId/payments/cash-confirm', authenticate, requireTenant('OWNER','MANAGER','STAFF'), async (req,res,next)=>{try { const {restaurantId}=req as TenantRequest; const payment=await prisma.payment.findFirst({where:{orderId:req.params.orderId,order:{restaurantId},method:'CASH'}}); if(!payment)throw AppError.notFound('Cash payment not found'); if(payment.status==='PAID')return sendSuccess(res,payment); const updated=await prisma.payment.update({where:{id:payment.id},data:{status:'PAID',paidAt:new Date(),confirmedAt:new Date(),confirmedByUserId:(req as any).user.id}});sendSuccess(res,updated);}catch(err){next(err)}});
export default router;
