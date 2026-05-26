import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Loader2, Download, AlertCircle, Mail } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function ShopReturn() {
  const [params] = useSearchParams();
  const ref = params.get('ref') || '';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloads, setDownloads] = useState(null);
  const [polling, setPolling] = useState(false);

  // Initial load + poll if pending (Toyyibpay callback might be async)
  useEffect(() => {
    if (!ref) {
      setError('Order reference tidak dijumpai');
      setLoading(false);
      return;
    }
    let cancelled = false;
    let pollCount = 0;

    const fetchOrder = async () => {
      try {
        const r = await fetch(`${API_URL}/shop/orders/${ref}`);
        if (!r.ok) throw new Error('Order tidak dijumpai');
        const data = await r.json();
        if (cancelled) return;
        setOrder(data);
        setLoading(false);

        if (data.status === 'pending' && pollCount < 10) {
          setPolling(true);
          pollCount++;
          setTimeout(fetchOrder, 3000);
        } else {
          setPolling(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      }
    };
    fetchOrder();
    return () => { cancelled = true; };
  }, [ref]);

  const fetchDownloads = async () => {
    try {
      const r = await fetch(`${API_URL}/shop/orders/${ref}/download`);
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.detail || 'Download belum tersedia');
      }
      setDownloads(await r.json());
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-black" />
          <p className="text-gray-500">Memuatkan order...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-black mb-2">Ada masalah</h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link to="/shop" className="inline-block bg-black text-white px-6 py-3 rounded-lg font-bold">Cuba lagi</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-black text-xl">📸 OhMaiShoot</Link>
          <div className="text-xs text-gray-400 font-mono">{ref}</div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        {order.status === 'paid' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-black mb-2">Pembayaran Berjaya!</h1>
            <p className="text-gray-500 mb-6">
              Terima kasih sokong OhMaiShoot 🙏 Link download dah dihantar ke <strong>{order.email}</strong>.
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left text-sm space-y-2">
              <div className="flex justify-between"><span className="text-gray-600">Pakej</span><span className="font-bold">{order.package_label}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Bilangan gambar</span><span className="font-bold">{order.photo_count}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Jumlah</span><span className="font-bold">RM{order.amount_rm}</span></div>
            </div>

            {!downloads && (
              <button
                onClick={fetchDownloads}
                className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-gray-800"
              >
                <Download className="w-5 h-5" /> Dapatkan Link Download
              </button>
            )}

            {downloads && (
              <div className="space-y-2 text-left">
                <p className="text-sm text-gray-500 mb-3">Klik setiap gambar untuk download:</p>
                {downloads.photos.map((p, i) => (
                  <a
                    key={p.guid}
                    href={`${API_URL}${p.download_url}`}
                    download
                    className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 rounded-lg p-3 transition-colors"
                  >
                    <Download className="w-4 h-4 text-gray-500" />
                    <span className="font-mono text-sm flex-1">Gambar {i + 1}</span>
                    <span className="text-xs text-gray-400">{p.guid.slice(0, 8)}...</span>
                  </a>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-400 mt-6">
              Ada masalah? WhatsApp Syuk: <a href="https://wa.me/60133157062" className="text-black font-bold">60133157062</a>
            </p>
          </div>
        )}

        {order.status === 'pending' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <Loader2 className="w-16 h-16 animate-spin text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-black mb-2">Mengesahkan Pembayaran...</h1>
            <p className="text-gray-500 mb-4">
              Pembayaran anda sedang diproses. Halaman ini akan auto-refresh.
            </p>
            {polling && <p className="text-xs text-gray-400">Cuba semak semula setiap 3 saat...</p>}
          </div>
        )}

        {order.status === 'failed' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-black mb-2">Pembayaran Gagal</h1>
            <p className="text-gray-500 mb-6">Pembayaran anda tidak berjaya. Sila cuba lagi.</p>
            <Link to="/shop" className="inline-block bg-black text-white px-6 py-3 rounded-lg font-bold">Cuba Lagi</Link>
          </div>
        )}

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-gray-500 hover:text-black">← Kembali ke laman utama</Link>
        </div>
      </main>
    </div>
  );
}
