import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, Save, Lock } from 'lucide-react';
import { getAdminSettings, updateSetting } from '../services/api';

export default function AdminSettings() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState({});
  const [savedKey, setSavedKey] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAdminSettings();
      setRows(data);
      const init = {};
      data.forEach(r => { init[r.key] = r.value || ''; });
      setDrafts(init);
    } finally {
      setLoading(false);
    }
  };

  const save = async (key) => {
    setSaving(s => ({ ...s, [key]: true }));
    try {
      await updateSetting(key, drafts[key] || '');
      setSavedKey(key);
      setTimeout(() => setSavedKey(''), 2000);
      await load();
    } catch (err) {
      alert('Gagal simpan: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(s => ({ ...s, [key]: false }));
    }
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
        <h2 className="text-3xl font-black text-gray-900 mb-1">Tetapan Site</h2>
        <p className="text-gray-500">Tukar info brand, kontak, dan default site tanpa redeploy.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl divide-y">
        {rows.map(r => (
          <div key={r.key} className="p-5 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="sm:w-64 flex-shrink-0">
              <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                {r.label || r.key}
                {!r.is_public && <Lock className="w-3 h-3 text-gray-400" title="Private (admin only)" />}
              </div>
              <div className="text-xs text-gray-400 font-mono">{r.key}</div>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={drafts[r.key] || ''}
                onChange={e => setDrafts(d => ({ ...d, [r.key]: e.target.value }))}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-black focus:ring-0"
              />
              <button
                onClick={() => save(r.key)}
                disabled={saving[r.key] || drafts[r.key] === r.value}
                className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
              >
                {saving[r.key] ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : savedKey === r.key ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {savedKey === r.key ? 'Tersimpan' : 'Simpan'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-400">
        🔒 = private (admin je nampak). Yang lain akan exposed via /api/settings/public untuk frontend.
      </div>
    </div>
  );
}
