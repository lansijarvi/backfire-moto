import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export default function DonateDisplay() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const url = `${window.location.origin}${import.meta.env.BASE_URL}donate`;
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 560,
        margin: 1,
        color: { dark: '#0a0a0a', light: '#ffffff' },
      });
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 py-16 px-4 bg-bg">
      <h1 className="font-heading text-5xl text-white text-center">Scan to Donate</h1>
      <canvas ref={canvasRef} className="rounded-2xl border border-neutral-800" />
      <p className="text-neutral-400 text-lg">Backfire Moto — thanks for the support</p>
    </div>
  );
}
