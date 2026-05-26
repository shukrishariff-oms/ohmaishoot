import { useEffect, useState } from 'react';
import {
  Loader2, Mail, Phone, Calendar, Hash, MessageSquare,
  Check, X, Trash2, Search, Download, AlertCircle,
} from 'lucide-react';
import {
  getAdminLeads, toggleLeadContacted, deleteLead, backfillSlugs,
} from '../services/api';

function fmtDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-MY', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function leadsToCSV(rows) {
  const header = ['id', 'created_at', 'event_name', 'name', 'email', 'phone', 'bib', 'note', 'interest', 'contacted'];
  const escape = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push(header.map((h) => escape(r[h])).join(','));
  }
  return lines.join('\n');
}

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all | new | contacted
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = filter === 'new' ? { contacted: false }
        : filter === 'contacted' ? { contacted: true }
        : {};
      const data = await getAdminLeads(params);
      setLeads(data);
    } catch (e) {
      setError('Gagal muat leads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const handleToggle = async (id) => {
    setBusyId(id);
    try {
      await toggleLeadContacted(id);
      load();
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Padam lead ni?')) return;
    setBusyId(id);
    try {
      await deleteLead(id);
      load();
    } finally {
      setBusyId(null);
    }
  };

  const exportCSV = () => {
    const blob = new Blob([leadsToCSV(filtered)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ohmaishoot-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBackfill = async () => {
    try {
      const r = await backfillSlugs();
      alert(`${r.updated} album diberi slug baru. Sekarang setiap event ada landing page sendiri.`);
    } catch (e) {
      alert('Gagal jalankan backfill slugs.');
    }
  };

  const q = search.trim().toLowerCase();
  const filtered = q
    ? leads.filter((l) =>
        (l.name || '').toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q) ||
        (l.phone || '').toLowerCase().includes(q) ||
        (l.bib || '').toLowerCase().includes(q) ||
        (l.event_name || '').toLowerCase().includes(q)
      )
    : leads;

  const stats = {
    total: leads.length,
    new: leads.filter((l) => !l.contacted).length,
    contacted: leads.filter((l) => l.contacted).length,
  };

  if (loading && leads.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header banner */}
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-5 border border-emerald-200/60">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-emerald-700/60">Lead Capture</span>
            <h2 className="text-xl font-black text-emerald-900 mt-1">{stats.new} lead belum di-follow up</h2>
            <p className="text-sm text-emerald-800/70 mt-1">
              Total {stats.total} · {stats.contacted} dah contacted · Export ke CSV untuk batch email
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              disabled={filtered.length === 0}
              className="flex items-center gap-2 bg-white text-emerald-800 border border-emerald-300 px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-50 disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button
              onClick={handleBackfill}
              className="text-xs text-emerald-700 hover:underline"
              title="Backfill slugs untuk album lama"
            >
              Backfill slugs
            </button>
          </div>
        </div>
      </div>

      {/* Filter + search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
          {[
            { k: 'all', label: `Semua (${stats.total})` },
            { k: 'new', label: `Baru (${stats.new})` },
            { k: 'contacted', label: `Done (${stats.contacted})` },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setFilter(t.k)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                filter === t.k ? 'bg-black text-white' : 'text-gray-600 hover:text-black'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" placeholder="Cari nama / email / bib / event..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-black focus:ring-1 focus:ring-black outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Lead list */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl py-16 text-center">
          <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-700 mb-1">Belum ada lead</h3>
          <p className="text-sm text-gray-400">
            Lead akan masuk bila pelawat isi form "Beritahu Saya" dekat halaman event.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-50">
            {filtered.map((l) => (
              <li key={l.id} className={`p-4 flex items-start gap-4 transition-colors ${l.contacted ? 'opacity-60' : 'hover:bg-gray-50/60'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                  l.contacted ? 'bg-gray-100 text-gray-400' : 'bg-black text-white'
                }`}>
                  {(l.name || l.email || l.phone || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <span className="font-bold text-gray-900">{l.name || '(no name)'}</span>
                    {l.event_name && (
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                        {l.event_name}
                      </span>
                    )}
                    {l.contacted && (
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                        Done
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                    {l.email && <a href={`mailto:${l.email}`} className="flex items-center gap-1 hover:text-black"><Mail className="w-3 h-3" />{l.email}</a>}
                    {l.phone && <a href={`https://wa.me/${l.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-black"><Phone className="w-3 h-3" />{l.phone}</a>}
                    {l.bib && <span className="flex items-center gap-1"><Hash className="w-3 h-3" />Bib {l.bib}</span>}
                    <span className="flex items-center gap-1 text-gray-400"><Calendar className="w-3 h-3" />{fmtDate(l.created_at)}</span>
                  </div>
                  {l.note && (
                    <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-md px-3 py-2 flex gap-2">
                      <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{l.note}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(l.id)} disabled={busyId === l.id}
                    className={`p-2 rounded-lg transition-colors ${
                      l.contacted ? 'text-gray-400 hover:bg-gray-100' : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                    title={l.contacted ? 'Tandakan baru' : 'Tandakan dah contact'}
                  >
                    {l.contacted ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(l.id)} disabled={busyId === l.id}
                    className="p-2 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                    title="Padam"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
