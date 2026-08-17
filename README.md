# Backfire Moto

Site for backfiremoto.com — event flyer landing page, t-shirt shop, photo/video gallery,
newsletter signup, and an admin panel for editing everything. Built with React + Vite,
Firebase (Auth/Firestore/Storage) for the backend, hosted free on GitHub Pages.
Newsletter signups go straight to Mailchimp.

## Local development

```
npm install
npm run dev
```

## How content editing works

Everything on the site (event flyer, shop products, gallery, social links) is stored in
Firestore and editable from `/admin` — no code changes needed for day-to-day updates.
Sign in at `/login` with the admin account already set up in the Firebase console.

## One-time Firebase setup

In the [Firebase console](https://console.firebase.google.com/project/studio-7719974604-964a7):

1. **Firestore Database** — create it if not already (production mode is fine).
2. **Storage** — enable it if not already, for flyer/product/gallery images.
3. **Firestore rules** — paste the contents of [`firestore.rules`](firestore.rules) into
   Firestore → Rules and publish.
4. **Storage rules** — paste the contents of [`storage.rules`](storage.rules) into
   Storage → Rules and publish.
5. **Authentication → Sign-in method** — make sure Google is enabled.
6. **Authentication → Settings → Authorized domains** — add your GitHub Pages domain
   (`<username>.github.io`) and `backfiremoto.com` once DNS is pointed there, or admin
   login will fail from the live site.

Admin access is restricted to one Google account by UID, checked both in the app
(`src/adminConfig.js`) and in the security rules — so even though Google Sign-In is open
to any Google account, only that UID can read/write admin data. To change who the admin
is, update `ADMIN_UID` in `src/adminConfig.js` and the matching UID in `firestore.rules`
and `storage.rules`.

## Shop: adding a t-shirt (Stripe Payment Links, no backend needed)

1. In your Stripe dashboard, create a **Payment Link** for each shirt/size.
2. In `/admin` → Shop, add the product with its price, image, and the Payment Link URL.

## Newsletter (Mailchimp, no backend needed)

The signup form on the homepage posts directly to a Mailchimp audience via a hidden
iframe — no API keys in the app, no Cloud Functions. Subscribers land straight in
Mailchimp; manage the list, campaigns, and double opt-in emails from there.

To point it at a different Mailchimp audience or account, grab a fresh embedded-form
snippet from Mailchimp (Audience → Signup forms → Embedded forms, or search "signup form"
in Mailchimp if it's moved) and update `MAILCHIMP_ACTION` and `HONEYPOT_NAME` in
`src/components/NewsletterSignup.jsx`.

## Deploying to GitHub Pages

A GitHub Actions workflow (`.github/workflows/deploy.yml`) builds and deploys automatically
on every push to `main`.

1. Create a new repo on GitHub (public).
2. Push this project to it:
   ```
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/<username>/<repo>.git
   git push -u origin main
   ```
3. In the repo's **Settings → Pages**, set Source to **GitHub Actions**.
4. The site will be live at `https://<username>.github.io/<repo>/` after the first run.

## Pointing backfiremoto.com at GitHub Pages

A `CNAME` file (containing `backfiremoto.com`) is already in `public/`, so it ships with
every build. When you're ready to cut over from Weebly:

1. In GitHub repo → **Settings → Pages**, add `backfiremoto.com` as the custom domain.
2. In GoDaddy DNS for backfiremoto.com, add:
   - Four **A** records for `@` pointing to:
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - A **CNAME** record for `www` pointing to `<username>.github.io`
3. Wait for DNS to propagate, then enable **Enforce HTTPS** in the Pages settings.
4. Remove/disable the Weebly site once the new one is confirmed live.

You can test the GitHub Pages version at its `.github.io` URL before touching DNS, so
the current Weebly site keeps working until you're ready to switch.
