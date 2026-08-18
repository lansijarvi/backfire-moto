import { useState } from 'react';
import { MAILCHIMP_ACTION, MAILCHIMP_HONEYPOT_NAME } from '../mailchimpConfig';

export default function NewsletterSignup() {
  const [status, setStatus] = useState('idle'); // idle | submitting | done

  function handleSubmit() {
    setStatus('submitting');
  }

  function handleIframeLoad() {
    if (status === 'submitting') setStatus('done');
  }

  if (status === 'done') {
    return <p className="text-accent font-medium">You're on the list — check your inbox to confirm.</p>;
  }

  return (
    <>
      <form
        action={MAILCHIMP_ACTION}
        method="post"
        target="mc-hidden-iframe"
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm gap-2"
      >
        <input
          type="email"
          name="EMAIL"
          required
          placeholder="your@email.com"
          className="flex-1 min-w-0 bg-surface border border-neutral-700 rounded px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-accent"
        />
        <div aria-hidden="true" className="absolute -left-[5000px]">
          <input type="text" name={MAILCHIMP_HONEYPOT_NAME} tabIndex="-1" defaultValue="" />
        </div>
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="shrink-0 bg-accent text-white font-semibold px-5 py-3 rounded text-sm uppercase tracking-wide hover:brightness-110 disabled:opacity-60 transition"
        >
          {status === 'submitting' ? '...' : 'Sign Up'}
        </button>
      </form>
      <iframe
        name="mc-hidden-iframe"
        title="mailchimp"
        className="hidden"
        onLoad={handleIframeLoad}
      />
    </>
  );
}
