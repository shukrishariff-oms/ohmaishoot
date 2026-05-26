import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, Save, Tag, Eye, EyeOff } from 'lucide-react';
import { getAdminPricing, updatePricing } from '../services/api';

export default function AdminPricing() {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState({});
  const [savedKey, setSavedKey] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAdminPricing();
      setTiers(data);
      const init = {};
      data.forEach(t => {
        init[t.key] = {
          label: t.label,
          amount: t.amount,
          max_photos: t.max_photos === null ? '' : t.max_photos,
          active: t.active,
        };
      });
      setDrafts(init);
    } finally {
      setLoading(false);
    }
  };

  const save = async (key) => {
    setSaving(s => ({ ...s, [key]: true }));
    try {
      const d = drafts[key];
      const fields = {
        label: d.label,
        amount: parseInt(d.amount, 10),
        max_photos: d.max_photos === '' || d.max_photos === null ? 0 : parseInt(d.max_photos, 10),
        active: d.active,
      };
      await updatePricing(key, fields);
      setSavedKey(key);
      setTimeout(() => setSavedKey(''), 2000);
      await load();
    } catch (err) {
      alert('Gagal simpan: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(s => ({ ...s, [key]: false }));
    }
  };

  const update = (key, field, value) => {
    setDrafts(d => ({ ...d, [key]: { ...d[key], [field]: value } }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-gray-900 mb-1">Harga Pakej</h2>
        <p className="text-gray-500">Tukar harga atau label pakej. Live terus, tak perlu redeploy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map(t => {
          const d = drafts[t.key] || {};
          const dirty = d.label !== t.label || parseInt(d.amount, 10) !== t.amount ||
                        (d.max_photos === '' ? null : parseInt(d.max_photos, 10)) !== t.max_photos ||
                        d.active !== t.active;
          return (
            <div key={t.key} className={`bg-white border rounded-2xl p-5 ${d.active ? 'border-gray-200' : 'border-gray-200 opacity-60'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-gray-400" />
                  <span className="font-mono text-xs text-gray-400">{t.key}</span>
                </div>
                <button
                  onClick={() => update(t.key, 'active', !d.active)}
                  className="text-gray-400 hover:text-black"
                  title={d.active ? 'Aktif (klik untuk hide)' : 'Tersembunyi (klik untuk aktifkan)'}
                >
                  {d.active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>

              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Label</label>
              <input
                type="text"
                value={d.label || ''}
                onChange={e => update(t.key, 'label', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:border-black focus:ring-0"
              />

              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Harga (RM)</label>
              <div className="relative mb-3">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">RM</span>
                <input
                  type="number"
                  min="1"
                  value={d.amount || ''}
                  onChange={e => update(t.key, 'amount', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-lg font-bold focus:border-black focus:ring-0"
                />
              </div>

              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Max Gambar</label>
              <input
                type="number"
                min="0"
                placeholder="0 = unlimited"
                value={d.max_photos === null ? '' : d.max_photos}
                onChange={e => update(t.key, 'max_photos', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-1 focus:border-black focus:ring-0"
              />
              <p className="text-xs text-gray-400 mb-4">
                Kosongkan / 0 untuk unlimited
              </p>

              <button
                onClick={() => save(t.key)}
                disabled={saving[t.key] || !dirty}
                className="w-full bg-black text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
              >
                {saving[t.key] ? <Loader2 className="w-4 h-4 animate-spin" />
                  : savedKey === t.key ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                  : <Save className="w-4 h-4" />}
                {savedKey === t.key ? 'Tersimpan' : 'Simpan'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
        <strong className="font-bold">⚠️ Note:</strong> Order yang dah dibuat sebelum ni guna harga lama
        — perubahan ni apply untuk order baru je.
      </div>
    </div>
  );
}
