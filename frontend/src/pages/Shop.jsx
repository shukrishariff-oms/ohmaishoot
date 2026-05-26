import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Camera, Upload, Loader2, CheckCircle2, X, ArrowRight, Tag, Lock, Sparkles } from 'lucide-react';
import { getPublishedAlbums } from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const STEPS = ['pilih-event', 'upload-selfie', 'pilih-gambar', 'maklumat', 'bayar'];

// Auto-pick best tier based on photo count
const autoTier = (n) => (n <= 1 ? 'single' : n <= 5 ? 'pack5' : 'all');

export default function Shop() {
  const [params] = useSearchParams();
  const initialEvent = params.get('event') || '';
  const initialPhotosStr = params.get('photos') || '';
  const initialPhotoGuids = initialPhotosStr ? initialPhotosStr.split(',').map(s => s.trim()).filter(Boolean) : [];
  const isDeepLink = !!initialEvent && initialPhotoGuids.length > 0;

  const [step, setStep] = useState(
    isDeepLink ? 'maklumat' : (initialEvent ? 'upload-selfie' : 'pilih-event')
  );
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);

  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');

  const [pricing, setPricing] = useState({});
  const [pkg, setPkg] = useState(isDeepLink ? autoTier(initialPhotoGuids.length) : 'pack5');
  const [picked, setPicked] = useState(new Set(isDeepLink ? initialPhotoGuids : []));

  const [buyer, setBuyer] = useState({ name: '', email: '', phone: '', bib: '' });
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');

  // Load albums + pricing
  useEffect(() => {
    getPublishedAlbums().then(setAlbums).catch(() => setAlbums([]));
    fetch(`${API_URL}/shop/pricing`).then(r => r.json()).then(setPricing).catch(() => {});
  }, []);

  // Pre-select album from URL param — match by slug OR face_slug (deep-link from face.*)
  useEffect(() => {
    if (initialEvent && albums.length) {
      const a = albums.find(x => x.slug === initialEvent || x.face_slug === initialEvent);
      if (a) {
        setSelectedAlbum(a);
      } else if (isDeepLink) {
        // Album not found for deep-link → fallback to landing
        setStep('pilih-event');
      }
    }
  }, [initialEvent, albums, isDeepLink]);

  const handleSelfieChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setSelfieFile(f);
    setSelfiePreview(URL.createObjectURL(f));
  };

  const runSearch = async () => {
    if (!selfieFile || !selectedAlbum) return;
    setSearching(true);
    setSearchError('');
    try {
      const fd = new FormData();
      fd.append('selfie', selfieFile);
      fd.append('album_id', selectedAlbum.id);
      fd.append('threshold', '0.7');
      const r = await fetch(`${API_URL}/shop/search`, { method: 'POST', body: fd });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.detail || 'Cari muka gagal');
      }
      const data = await r.json();
      setSearchResult(data);
      const totalMatches = (data.groups || []).reduce((s, g) => s + (g.matches?.length || 0), 0);
      if (totalMatches === 0) {
        setSearchError('Maaf, tiada gambar yang padan dengan muka anda dijumpai. Cuba selfie yang lebih jelas.');
      } else {
        setStep('pilih-gambar');
      }
    } catch (e) {
      setSearchError(e.message);
    } finally {
      setSearching(false);
    }
  };

  const allMatches = (searchResult?.groups || []).flatMap(g => g.matches || []);
  const pkgConfig = pricing[pkg] || { label: '', amount: 0, max_photos: 0 };

  const togglePick = (guid) => {
    const next = new Set(picked);
    if (next.has(guid)) {
      next.delete(guid);
    } else {
      if (pkg === 'all') {
        // 'all' selects everything
        allMatches.forEach(m => next.add(m.guid));
      } else if (next.size >= pkgConfig.max_photos) {
        return;
      } else {
        next.add(guid);
      }
    }
    setPicked(next);
  };

  // Auto-pick all if 'all' package
  useEffect(() => {
    if (pkg === 'all' && allMatches.length) {
      setPicked(new Set(allMatches.map(m => m.guid)));
    } else if (pkg !== 'all') {
      // trim if package downgraded
      const trimmed = Array.from(picked).slice(0, pkgConfig.max_photos);
      setPicked(new Set(trimmed));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pkg, searchResult]);

  const submitOrder = async () => {
    setSubmitting(true);
    setOrderError('');
    try {
      const body = {
        album_id: selectedAlbum.id,
        package: pkg,
        photo_guids: Array.from(picked),
        name: buyer.name.trim(),
        email: buyer.email.trim(),
        phone: buyer.phone.trim(),
        bib: buyer.bib.trim(),
        selfie_sha: searchResult?._selfie_sha,
      };
      const r = await fetch(`${API_URL}/shop/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.detail || 'Gagal cipta order');
      }
      const data = await r.json();
      window.location.href = data.payment_url;
    } catch (e) {
      setOrderError(e.message);
      setSubmitting(false);
    }
  };

  const stepIdx = STEPS.indexOf(step);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-black text-xl">📸 OhMaiShoot</Link>
          <div className="text-sm text-gray-500">Cari Gambar Anda</div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-10 text-xs sm:text-sm">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
                i < stepIdx ? 'bg-green-500 text-white' :
                i === stepIdx ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'
              }`}>{i < stepIdx ? '✓' : i + 1}</div>
              {i < STEPS.length - 1 && <div className={`w-6 sm:w-12 h-0.5 ${i < stepIdx ? 'bg-green-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {step === 'pilih-event' && (
          <div>
            <h1 className="text-3xl font-black mb-2">Pilih Event</h1>
            <p className="text-gray-500 mb-8">Pilih event marathon yang anda sertai.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {albums.map(a => (
                <button
                  key={a.id}
                  onClick={() => { setSelectedAlbum(a); setStep('upload-selfie'); }}
                  className="bg-white rounded-2xl border-2 border-gray-200 hover:border-black transition-all p-0 overflow-hidden text-left"
                >
                  <img src={`${API_URL}/covers/${a.cover_image}`} alt={a.event_name} className="w-full h-40 object-cover" />
                  <div className="p-4">
                    <div className="font-bold text-gray-900">{a.event_name}</div>
                    <div className="text-xs text-gray-500 mt-1">{a.location} · {a.event_date}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'upload-selfie' && selectedAlbum && (
          <div className="max-w-xl mx-auto">
            <button onClick={() => setStep('pilih-event')} className="text-sm text-gray-500 hover:text-black mb-4">← Tukar event</button>
            <h1 className="text-3xl font-black mb-2">Upload Selfie</h1>
            <p className="text-gray-500 mb-2">Event: <strong>{selectedAlbum.event_name}</strong></p>
            <p className="text-gray-500 mb-8 text-sm">Selfie anda dihapus selepas pencarian. Tak disimpan dalam server kami.</p>

            <label className="block w-full aspect-square max-w-sm mx-auto bg-white border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-black transition-colors overflow-hidden relative">
              {selfiePreview ? (
                <img src={selfiePreview} alt="selfie" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                  <Camera className="w-16 h-16 mb-4" />
                  <div className="font-semibold">Klik untuk upload selfie</div>
                  <div className="text-xs mt-1">JPG, PNG, atau WEBP</div>
                </div>
              )}
              <input type="file" accept="image/*" capture="user" onChange={handleSelfieChange} className="hidden" />
            </label>

            {searchError && <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl text-sm">{searchError}</div>}

            <button
              onClick={runSearch}
              disabled={!selfieFile || searching}
              className="mt-6 w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {searching ? <><Loader2 className="w-5 h-5 animate-spin" /> Mencari muka anda...</> : <>Cari Gambar Saya <ArrowRight className="w-5 h-5" /></>}
            </button>
          </div>
        )}

        {step === 'pilih-gambar' && (
          <div>
            <button onClick={() => setStep('upload-selfie')} className="text-sm text-gray-500 hover:text-black mb-4">← Cuba selfie lain</button>
            <h1 className="text-3xl font-black mb-2">Jumpa {allMatches.length} Gambar</h1>
            <p className="text-gray-500 mb-6">Pilih pakej, kemudian pilih gambar yang anda nak beli.</p>

            {/* Pricing tiers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              {Object.entries(pricing).map(([key, p]) => (
                <button
                  key={key}
                  onClick={() => setPkg(key)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${
                    pkg === key ? 'border-black bg-black text-white' : 'border-gray-200 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs uppercase tracking-wider opacity-75">{p.label}</div>
                      <div className="text-3xl font-black mt-1">RM{p.amount}</div>
                    </div>
                    <Tag className="w-5 h-5 opacity-50" />
                  </div>
                  <div className="text-xs mt-2 opacity-75">
                    {key === 'all' ? `Semua ${allMatches.length} gambar` : `Sehingga ${p.max_photos} gambar`}
                  </div>
                </button>
              ))}
            </div>

            <div className="text-sm text-gray-500 mb-4">
              Dipilih: <strong className="text-black">{picked.size}</strong> / {pkg === 'all' ? allMatches.length : pkgConfig.max_photos}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {allMatches.map(m => (
                <button
                  key={m.guid}
                  onClick={() => togglePick(m.guid)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-4 transition-all ${
                    picked.has(m.guid) ? 'border-black' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img src={m.preview_url || m.thumbnail_url} alt="" className="w-full h-full object-cover" loading="lazy" draggable={false} />
                  {picked.has(m.guid) && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <CheckCircle2 className="w-12 h-12 text-white" />
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                    {Math.round((m.similarity || 0) * 100)}%
                  </div>
                </button>
              ))}
            </div>

            <div className="sticky bottom-4 mt-8">
              <button
                onClick={() => setStep('maklumat')}
                disabled={picked.size === 0}
                className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg shadow-2xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Teruskan ke Pembayaran (RM{pkgConfig.amount}) <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 'maklumat' && (
          <div className="max-w-md mx-auto">
            {!isDeepLink && (
              <button onClick={() => setStep('pilih-gambar')} className="text-sm text-gray-500 hover:text-black mb-4">← Pilih gambar</button>
            )}
            {isDeepLink && (
              <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <div className="font-bold text-gray-900">{picked.size} gambar dipilih dari face search</div>
                  <div className="text-gray-600 mt-0.5">{selectedAlbum?.event_name || 'Event'}</div>
                </div>
              </div>
            )}
            <h1 className="text-3xl font-black mb-2">Maklumat Anda</h1>
            <p className="text-gray-500 mb-6">Untuk hantar gambar selepas pembayaran.</p>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">Nama Penuh</label>
                <input
                  type="text"
                  value={buyer.name}
                  onChange={e => setBuyer({...buyer, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Email</label>
                <input
                  type="email"
                  value={buyer.email}
                  onChange={e => setBuyer({...buyer, email: e.target.value})}
                  placeholder="anda@email.com"
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:border-black"
                />
                <p className="text-xs text-gray-400 mt-1">Link download akan dihantar ke sini.</p>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">No. Telefon</label>
                <input
                  type="tel"
                  value={buyer.phone}
                  onChange={e => setBuyer({...buyer, phone: e.target.value})}
                  placeholder="01x-xxxxxxx"
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">No. Bib (optional)</label>
                <input
                  type="text"
                  value={buyer.bib}
                  onChange={e => setBuyer({...buyer, bib: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:border-black"
                />
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Pakej</span>
                  <span className="font-bold">{pkgConfig.label}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Bilangan gambar</span>
                  <span className="font-bold">{picked.size}</span>
                </div>
                <div className="flex justify-between text-lg pt-2 border-t border-gray-200 mt-2">
                  <span className="font-bold">Jumlah</span>
                  <span className="font-black">RM{pkgConfig.amount}</span>
                </div>
              </div>

              {orderError && <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm">{orderError}</div>}

              <button
                onClick={submitOrder}
                disabled={!buyer.name || !buyer.email || submitting}
                className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : <><Lock className="w-4 h-4" /> Bayar RM{pkgConfig.amount} via Toyyibpay</>}
              </button>
              <p className="text-xs text-gray-400 text-center">Pembayaran selamat melalui FPX / kad kredit. Powered by Toyyibpay.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
