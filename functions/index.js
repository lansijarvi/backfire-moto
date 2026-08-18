const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();

const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');

// Site currently lives at /backfire-moto/ (GitHub Pages project path) and will move to
// / once backfiremoto.com DNS is cut over — see vite.config.js. Only allow these two so
// a caller can't smuggle an arbitrary redirect URL into the Checkout Session.
const ALLOWED_BASE_PATHS = ['/', '/backfire-moto/'];

exports.createCheckoutSession = onCall({ secrets: [STRIPE_SECRET_KEY] }, async (request) => {
  const stripe = require('stripe')(STRIPE_SECRET_KEY.value());

  const items = request.data?.items;
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpsError('invalid-argument', 'Cart is empty.');
  }

  const basePath = ALLOWED_BASE_PATHS.includes(request.data?.basePath)
    ? request.data.basePath
    : '/backfire-moto/';
  const origin = request.rawRequest.headers.origin || 'https://backfiremoto.com';

  const lineItems = [];
  for (const item of items) {
    const quantity = Math.min(Math.max(parseInt(item.quantity, 10) || 1, 1), 20);
    const snap = await db.collection('products').doc(String(item.productId)).get();
    if (!snap.exists || snap.data().active !== true) continue;

    const product = snap.data();
    const unitAmount = Math.round(Number(product.price) * 100);
    if (!Number.isFinite(unitAmount) || unitAmount <= 0) continue;

    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.size ? `${product.name} (Size: ${item.size})` : product.name,
          images: product.imageUrl ? [product.imageUrl] : undefined,
        },
        unit_amount: unitAmount,
      },
      quantity,
    });
  }

  if (lineItems.length === 0) {
    throw new HttpsError('invalid-argument', 'No valid items in cart.');
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    shipping_address_collection: { allowed_countries: ['US'] },
    shipping_options: [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: 500, currency: 'usd' },
          display_name: 'Standard Shipping',
          delivery_estimate: {
            minimum: { unit: 'business_day', value: 5 },
            maximum: { unit: 'business_day', value: 10 },
          },
        },
      },
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: 0, currency: 'usd' },
          display_name: 'Pick up at next Backfire Moto event',
        },
      },
    ],
    success_url: `${origin}${basePath}checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}${basePath}checkout/cancel`,
    metadata: { type: 'shop' },
  });

  return { url: session.url };
});

exports.createDonationCheckoutSession = onCall({ secrets: [STRIPE_SECRET_KEY] }, async (request) => {
  const stripe = require('stripe')(STRIPE_SECRET_KEY.value());

  const amount = Number(request.data?.amount);
  if (!Number.isFinite(amount) || amount < 1 || amount > 5000) {
    throw new HttpsError('invalid-argument', 'Enter an amount between $1 and $5000.');
  }

  const basePath = ALLOWED_BASE_PATHS.includes(request.data?.basePath)
    ? request.data.basePath
    : '/backfire-moto/';
  const origin = request.rawRequest.headers.origin || 'https://backfiremoto.com';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: 'Donation to Backfire Moto' },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}${basePath}donate/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}${basePath}donate`,
    metadata: { type: 'donation' },
  });

  return { url: session.url };
});

exports.stripeWebhook = onRequest(
  { secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET] },
  async (req, res) => {
    const stripe = require('stripe')(STRIPE_SECRET_KEY.value());

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        req.headers['stripe-signature'],
        STRIPE_WEBHOOK_SECRET.value()
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });

      await db
        .collection('orders')
        .doc(session.id)
        .set({
          type: session.metadata?.type || 'shop',
          email: session.customer_details?.email || null,
          amountTotal: session.amount_total,
          currency: session.currency,
          shippingAddress: session.shipping_details?.address || null,
          shippingName: session.shipping_details?.name || null,
          items: lineItems.data.map((li) => ({
            description: li.description,
            quantity: li.quantity,
            amountTotal: li.amount_total,
          })),
          status: 'paid',
          createdAt: FieldValue.serverTimestamp(),
        });
    }

    res.json({ received: true });
  }
);
