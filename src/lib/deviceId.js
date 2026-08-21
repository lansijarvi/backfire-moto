// Stable per-browser anonymous ID for reactions — no login, no Firebase Auth,
// just a random ID stashed in localStorage so we can show "you already reacted"
// and let someone change their pick without creating duplicates.
const KEY = 'backfire_device_id';

export function getDeviceId() {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
