import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase';

export default function OrdersList() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    return onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  return (
    <div className="max-w-2xl">
      <h3 className="text-white font-semibold mb-3">Orders ({orders.length})</h3>
      <div className="flex flex-col gap-3">
        {orders.map((order) => (
          <div key={order.id} className="border border-neutral-800 rounded p-4 text-sm">
            <div className="flex items-center justify-between text-white">
              <span>{order.email || 'No email'}</span>
              <span className="text-accent">${(order.amountTotal / 100).toFixed(2)}</span>
            </div>
            {order.shippingAddress && (
              <p className="text-neutral-500 mt-1">
                {order.shippingName && `${order.shippingName} — `}
                {[
                  order.shippingAddress.line1,
                  order.shippingAddress.line2,
                  order.shippingAddress.city,
                  order.shippingAddress.state,
                  order.shippingAddress.postal_code,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            )}
            <ul className="mt-2 text-neutral-400 list-disc list-inside">
              {order.items?.map((item, i) => (
                <li key={i}>
                  {item.quantity}× {item.description} — ${(item.amountTotal / 100).toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {orders.length === 0 && <p className="text-sm text-neutral-500">No orders yet.</p>}
      </div>
    </div>
  );
}
