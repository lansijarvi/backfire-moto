const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

initializeApp();
const db = getFirestore();

const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');
const RESEND_API_KEY = defineSecret('RESEND_API_KEY');

const ADMIN_UID = 'eKhkvvFajRX6XfOP3baFBh5n5V33';
const GA4_PROPERTY_ID = '551126191';

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

exports.notifyCommunityPhotoSubmission = onDocumentCreated(
  { document: 'communityPhotos/{docId}', secrets: [RESEND_API_KEY] },
  async (event) => {
    const data = event.data.data();
    const media = data.media || (data.url ? [{ url: data.url, type: data.type }] : []);

    const bodyLines = [
      `Name: ${data.name || '(not given)'}`,
      `Email: ${data.email || '(not given)'}`,
      `Newsletter opt-in: ${data.newsletterOptIn ? 'yes' : 'no'}`,
      data.usageConsent ? 'Usage consent: granted' : 'Usage consent: NOT granted',
      '',
      data.story ? `Story:\n${data.story}` : '(no story provided)',
      '',
      `${media.length} file${media.length === 1 ? '' : 's'}:`,
      ...media.map((m) => m.url),
      '',
      'Review and approve at https://backfiremoto.com/admin',
    ];

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY.value()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Backfire Moto <notifications@backfiremoto.com>',
        to: ['backfiremoto@gmail.com'],
        reply_to: data.email ? [data.email] : undefined,
        subject: `New community photo submission${data.name ? ` from ${data.name}` : ''}`,
        text: bodyLines.join('\n'),
      }),
    });

    if (!res.ok) {
      console.error('Resend send failed:', res.status, await res.text());
    }
  }
);

exports.getAnalyticsSummary = onCall(async (request) => {
  if (request.auth?.uid !== ADMIN_UID) {
    throw new HttpsError('permission-denied', 'Admin only.');
  }

  const client = new BetaAnalyticsDataClient();
  const property = `properties/${GA4_PROPERTY_ID}`;

  const [totals, byDay, topPages, sources] = await Promise.all([
    client.runReport({
      property,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }],
    }),
    client.runReport({
      property,
      dateRanges: [{ startDate: '13daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    }),
    client.runReport({
      property,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    }),
    client.runReport({
      property,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 8,
    }),
  ]);

  const totalsRow = totals[0].rows?.[0];

  return {
    last7Days: {
      activeUsers: Number(totalsRow?.metricValues?.[0]?.value || 0),
      sessions: Number(totalsRow?.metricValues?.[1]?.value || 0),
      pageViews: Number(totalsRow?.metricValues?.[2]?.value || 0),
    },
    byDay: (byDay[0].rows || []).map((r) => ({
      date: r.dimensionValues[0].value,
      activeUsers: Number(r.metricValues[0].value),
      pageViews: Number(r.metricValues[1].value),
    })),
    topPages: (topPages[0].rows || []).map((r) => ({
      path: r.dimensionValues[0].value,
      pageViews: Number(r.metricValues[0].value),
    })),
    sources: (sources[0].rows || []).map((r) => ({
      channel: r.dimensionValues[0].value,
      sessions: Number(r.metricValues[0].value),
    })),
  };
});

exports.notifyContactMessage = onDocumentCreated(
  { document: 'contactMessages/{docId}', secrets: [RESEND_API_KEY] },
  async (event) => {
    const data = event.data.data();

    const bodyLines = [
      `From: ${data.name || '(not given)'} <${data.email || 'no email'}>`,
      '',
      data.message || '(no message)',
      '',
      'Reply directly to this email to respond, or manage it at https://backfiremoto.com/admin',
    ];

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY.value()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Backfire Moto <notifications@backfiremoto.com>',
        to: ['backfiremoto@gmail.com'],
        reply_to: data.email ? [data.email] : undefined,
        subject: `Contact form: ${data.subject || '(no subject)'}`,
        text: bodyLines.join('\n'),
      }),
    });

    if (!res.ok) {
      console.error('Resend send failed:', res.status, await res.text());
    }
  }
);
