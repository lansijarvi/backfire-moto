import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { useCart } from '../context/CartContext';

export default function CartDrawer() {
  const { items, removeItem, updateQuantity, totalCount, totalPrice, isOpen, setIsOpen } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  async function handleCheckout() {
    setCheckingOut(true);
    setError('');
    try {
      const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
      const result = await createCheckoutSession({
        items: items.map((i) => ({ productId: i.productId, size: i.size, quantity: i.quantity })),
        basePath: import.meta.env.BASE_URL,
      });
      window.location.href = result.data.url;
    } catch (err) {
      setError(err.message || 'Checkout failed. Try again.');
      setCheckingOut(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Close cart"
        onClick={() => setIsOpen(false)}
        className="absolute inset-0 bg-black/70"
      />
      <div className="relative w-full max-w-sm bg-surface border-l border-neutral-800 h-full flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <h2 className="text-white font-semibold">Your Cart</h2>
          <button onClick={() => setIsOpen(false)} className="text-neutral-400 hover:text-white text-xl leading-none">
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {items.length === 0 ? (
            <p className="text-neutral-500 text-sm">Your cart is empty.</p>
          ) : (
            items.map((item) => (
              <div key={`${item.productId}-${item.size}`} className="flex gap-3">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt="" className="w-16 h-16 object-cover rounded border border-neutral-800" />
                )}
                <div className="flex-1 text-sm">
                  <p className="text-white">{item.name}</p>
                  {item.size && <p className="text-neutral-500">Size: {item.size}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                      className="w-6 h-6 border border-neutral-700 rounded text-neutral-400 hover:text-white"
                    >
                      −
                    </button>
                    <span className="text-neutral-300">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                      className="w-6 h-6 border border-neutral-700 rounded text-neutral-400 hover:text-white"
                    >
                      +
                    </button>
                    <span className="ml-auto text-accent">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId, item.size)}
                    className="text-xs text-neutral-600 hover:text-red-400 mt-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-neutral-800 flex flex-col gap-3">
            <div className="flex items-center justify-between text-white">
              <span>Subtotal ({totalCount} item{totalCount === 1 ? '' : 's'})</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <p className="text-xs text-neutral-500">Shipping or event pickup selected at checkout.</p>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              onClick={handleCheckout}
              disabled={checkingOut}
              className="bg-accent text-white font-semibold px-5 py-3 rounded text-sm uppercase tracking-wide hover:brightness-110 disabled:opacity-60 transition"
            >
              {checkingOut ? 'Redirecting…' : 'Checkout'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
