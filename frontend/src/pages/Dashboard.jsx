import { useEffect, useState } from 'react';
import {
  Loader2, Eye, EyeOff, Calendar, MousePointerClick,
  Users, TrendingUp, Image as ImageIcon, MapPin, Sparkles,
  Smartphone, Monitor, Tablet, Globe, ArrowRight,
} from 'lucide-react';
import {
  getStatsOverview, getStatsAlbums, getStatsSources,
  getStatsDevices, getStatsHourly, getCoverUrl,
} from '../services/api';

// lucide-react v1.11 doesn't export Instagram — inline SVG fallback.
const Instagram = ({ className = '', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={className} {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

function StatCard({ icon: Icon, label, value, sub, accent = 'black' }) {
  const accents = {
    black: 'bg-black text-white',
    emerald: 'bg-emerald-500 text-white',
    indigo: 'bg-indigo-500 text-white',
    amber: 'bg-amber-500 text-white',
    rose: 'bg-rose-500 text-white',
    violet: 'bg-violet-500 text-white',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accents[accent]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-3xl font-black text-gray-900 leading-none">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-2 font-medium">{sub}</div>}
    </div>
  );
}

function DualSparkline({ data, height = 60 }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(1, ...data.map((d) => Math.max(d.clicks || 0, d.views || 0)));
  const w = 100;
  const step = w / Math.max(1, data.length - 1);
  const buildPath = (key) =>
    data
      .map((d, i) => {
        const x = i * step;
        const y = height - ((d[key] || 0) / max) * (height - 4) - 2;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  const clicksPath = buildPath('clicks');
  const viewsPath = buildPath('views');
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="vfill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${viewsPath} L ${(data.length - 1) * step} ${height} L 0 ${height} Z`} fill="url(#vfill)" />
      <path d={viewsPath} fill="none" stroke="#6366f1" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="3 2" />
      <path d={clicksPath} fill="none" stroke="#000" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function MonthBars({ data }) {
  if (!data || data.length === 0) {
    return <div className="text-xs text-gray-400">Belum ada event direkod.</div>;
  }
  const max = Math.max(1, ...data.map((d) => d.events));
  return (
    <div className="flex items-end gap-2 h-28">
      {data.map((m) => (
        <div key={m.month} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <div
            className="w-full bg-gradient-to-t from-black to-gray-700 rounded-t-md"
            style={{ height: `${(m.events / max) * 100}%`, minHeight: '4px' }}
            title={`${m.month}: ${m.events} event`}
          />
          <span className="text-[10px] font-semibold text-gray-500 truncate w-full text-center">
            {m.month?.slice(5)}
          </span>
        </div>
      ))}
    </div>
  );
}

const SOURCE_META = {
  instagram: { label: 'Instagram', icon: Instagram, color: 'bg-pink-500' },
  facebook: { label: 'Facebook', icon: Globe, color: 'bg-blue-600' },
  google: { label: 'Google', icon: Globe, color: 'bg-amber-500' },
  whatsapp: { label: 'WhatsApp', icon: Globe, color: 'bg-emerald-500' },
  tiktok: { label: 'TikTok', icon: Globe, color: 'bg-black' },
  twitter: { label: 'X / Twitter', icon: Globe, color: 'bg-zinc-700' },
  youtube: { label: 'YouTube', icon: Globe, color: 'bg-red-600' },
  bing: { label: 'Bing', icon: Globe, color: 'bg-cyan-600' },
  direct: { label: 'Direct / URL', icon: ArrowRight, color: 'bg-gray-500' },
  other: { label: 'Lain-lain', icon: Globe, color: 'bg-gray-400' },
};

function SourceRow({ row, max }) {
  const meta = SOURCE_META[row.source] || { label: row.source || '—', icon: Globe, color: 'bg-zinc-500' };
  const Icon = meta.icon;
  const pct = max ? ((row.views || row.clicks) / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0 ${meta.color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="font-bold text-gray-800 text-sm truncate">{meta.label}</span>
          <span className="text-xs font-semibold text-gray-500 flex-shrink-0">
            {row.views} views · {row.clicks} klik
            {row.views > 0 && <span className="ml-1 text-emerald-600">· {row.conversion_pct}%</span>}
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full ${meta.color}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

const DEVICE_META = {
  mobile: { label: 'Mobile', icon: Smartphone, color: 'bg-emerald-500' },
  desktop: { label: 'Desktop', icon: Monitor, color: 'bg-indigo-500' },
  tablet: { label: 'Tablet', icon: Tablet, color: 'bg-amber-500' },
  unknown: { label: 'Tak Dikenali', icon: Globe, color: 'bg-gray-400' },
};

function DeviceDonut({ data }) {
  const total = data.reduce((s, d) => s + (d.views || 0), 0);
  if (!total) return <div className="text-xs text-gray-400 py-6 text-center">Belum ada data device.</div>;

  let acc = 0;
  const r = 38;
  const c = 2 * Math.PI * r;
  const segs = data.map((d) => {
    const meta = DEVICE_META[d.device] || DEVICE_META.unknown;
    const len = ((d.views || 0) / total) * c;
    const seg = { meta, dasharray: `${len} ${c - len}`, dashoffset: -acc, value: d.views, pct: ((d.views || 0) / total) * 100 };
    acc += len;
    return seg;
  });

  const colorMap = {
    'bg-emerald-500': '#10b981',
    'bg-indigo-500': '#6366f1',
    'bg-amber-500': '#f59e0b',
    'bg-gray-400': '#9ca3af',
  };

  return (
    <div className="flex items-center gap-5">
      <div className="relative w-28 h-28 flex-shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#f3f4f6" strokeWidth="14" />
          {segs.map((s, i) => (
            <circle
              key={i}
              cx="50" cy="50" r={r}
              fill="none"
              stroke={colorMap[s.meta.color] || '#9ca3af'}
              strokeWidth="14"
              strokeDasharray={s.dasharray}
              strokeDashoffset={s.dashoffset}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-xl font-black">{total}</div>
          <div className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Views</div>
        </div>
      </div>
      <div className="flex-1 space-y-2 min-w-0">
        {segs.map((s, i) => {
          const Icon = s.meta.icon;
          return (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-md flex items-center justify-center text-white ${s.meta.color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 text-sm">
                <span className="font-bold">{s.meta.label}</span>
                <span className="text-gray-500 ml-2">{s.value} ({s.pct.toFixed(0)}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HeatMap({ matrix, labels }) {
  if (!matrix || matrix.length === 0) return null;
  const flat = matrix.flat();
  const max = Math.max(1, ...flat);
  const cell = (v) => {
    if (!v) return 'bg-gray-50';
    const ratio = v / max;
    if (ratio < 0.15) return 'bg-emerald-100';
    if (ratio < 0.35) return 'bg-emerald-200';
    if (ratio < 0.6) return 'bg-emerald-400';
    if (ratio < 0.85) return 'bg-emerald-500';
    return 'bg-emerald-600';
  };
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="flex gap-1 ml-12 mb-1">
          {Array.from({ length: 24 }).map((_, h) => (
            <div key={h} className="flex-1 text-[9px] text-gray-400 font-semibold text-center">
              {h % 3 === 0 ? `${h}` : ''}
            </div>
          ))}
        </div>
        {matrix.map((row, di) => (
          <div key={di} className="flex items-center gap-1 mb-1">
            <div className="w-11 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{labels[di]}</div>
            {row.map((v, hi) => (
              <div
                key={hi}
                className={`flex-1 aspect-square rounded ${cell(v)} hover:ring-2 hover:ring-black transition-all`}
                title={`${labels[di]} ${hi}:00 — ${v} klik`}
              />
            ))}
          </div>
        ))}
        <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-400 font-semibold">
          <span>Sedikit</span>
          <div className="flex gap-0.5">
            {['bg-gray-50', 'bg-emerald-100', 'bg-emerald-200', 'bg-emerald-400', 'bg-emerald-500', 'bg-emerald-600'].map((c) => (
              <div key={c} className={`w-3 h-3 rounded-sm ${c}`} />
            ))}
          </div>
          <span>Banyak</span>
          <span className="ml-auto">Waktu Malaysia (UTC+8)</span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [topAlbums, setTopAlbums] = useState([]);
  const [sources, setSources] = useState([]);
  const [devices, setDevices] = useState([]);
  const [hourly, setHourly] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [ov, top, src, dev, hr] = await Promise.all([
          getStatsOverview(),
          getStatsAlbums(days, 10),
          getStatsSources(days),
          getStatsDevices(days),
          getStatsHourly(days),
        ]);
        if (mounted) {
          setOverview(ov);
          setTopAlbums(top);
          setSources(src);
          setDevices(dev);
          setHourly(hr);
        }
      } catch (e) {
        if (mounted) setError('Gagal muat statistik. Cuba refresh.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [days]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-black" />
      </div>
    );
  }

  if (error || !overview) {
    return <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4">{error || 'Tiada data.'}</div>;
  }

  const { events, clicks, views, daily_clicks_30d, events_per_month } = overview;
  const latestDate = events.latest_event_date
    ? new Date(events.latest_event_date).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  const sourceMax = Math.max(1, ...sources.map((s) => Math.max(s.views, s.clicks)));

  return (
    <div className="space-y-6">
      {/* Hero status banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-black via-zinc-900 to-zinc-800 p-7 text-white shadow-xl">
        <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/50">Pantau Website</span>
            <h2 className="text-2xl md:text-3xl font-black mt-2">
              {clicks.last_7d > 0
                ? `${clicks.last_7d} klik dalam 7 hari lepas`
                : 'Belum ada klik 7 hari ni'}
            </h2>
            <p className="text-white/70 text-sm mt-2 max-w-lg">
              {events.published} album hidup · Latest event: <span className="text-white font-semibold">{latestDate}</span>
              {views?.conversion_30d_pct > 0 && (
                <> · Conversion 30d: <span className="text-emerald-400 font-bold">{views.conversion_30d_pct}%</span></>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2.5 border border-white/15">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold tracking-widest uppercase">Live</span>
          </div>
        </div>
      </div>

      {/* Window selector */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Tempoh</span>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                days === d ? 'bg-black text-white' : 'text-gray-600 hover:text-black'
              }`}
            >
              {d} hari
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={ImageIcon} label="Total Event" value={events.total} sub={`${events.published} publish · ${events.hidden} hidden`} accent="black" />
        <StatCard icon={Calendar} label="Akan Datang" value={events.upcoming} sub="Event masa hadapan" accent="indigo" />
        <StatCard icon={Eye} label="Page Views" value={views?.last_30d ?? 0} sub={`${views?.last_7d ?? 0} (7d)`} accent="violet" />
        <StatCard icon={MousePointerClick} label="Klik Album" value={clicks.last_30d} sub={`${clicks.last_7d} (7d)`} accent="emerald" />
        <StatCard icon={Users} label="Pelawat Unik" value={views?.unique_30d ?? clicks.unique_visitors_30d} sub="30 hari (anon)" accent="amber" />
        <StatCard icon={TrendingUp} label="Conversion" value={`${views?.conversion_30d_pct ?? 0}%`} sub="Klik / Views" accent="rose" />
      </div>

      {/* Trend (clicks vs views) + month bars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Trend</span>
              <h3 className="text-lg font-black text-gray-900">Klik vs Page Views (30 hari)</h3>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-black" /> Klik</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-indigo-500 border-dashed" style={{borderTop:'1px dashed #6366f1', background:'transparent'}} /> Views</span>
            </div>
          </div>
          <DualSparkline data={daily_clicks_30d} />
          <div className="flex justify-between text-[10px] font-semibold text-gray-400 mt-1">
            <span>{daily_clicks_30d[0]?.date}</span>
            <span>{daily_clicks_30d[daily_clicks_30d.length - 1]?.date}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Liputan</span>
          <h3 className="text-lg font-black text-gray-900 mb-4">Event per Bulan</h3>
          <MonthBars data={events_per_month} />
        </div>
      </div>

      {/* Sources + Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Trafik</span>
          <h3 className="text-lg font-black text-gray-900 mb-4">Sumber Pelawat</h3>
          {sources.length === 0 ? (
            <div className="text-xs text-gray-400 py-6 text-center">Belum ada data sumber direkod.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {sources.slice(0, 8).map((s) => (
                <SourceRow key={s.source} row={s} max={sourceMax} />
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Peranti</span>
          <h3 className="text-lg font-black text-gray-900 mb-4">Mobile vs Desktop</h3>
          <DeviceDonut data={devices} />
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Aktiviti</span>
            <h3 className="text-lg font-black text-gray-900">Heatmap Klik (Hari × Jam)</h3>
          </div>
        </div>
        {hourly?.matrix ? (
          <HeatMap matrix={hourly.matrix} labels={hourly.labels} />
        ) : (
          <div className="text-xs text-gray-400 py-6 text-center">Belum ada data klik.</div>
        )}
      </div>

      {/* Top albums */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Top Album</span>
          <h3 className="text-lg font-black text-gray-900">Klik tertinggi · {days} hari</h3>
        </div>
        {topAlbums.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            Belum ada klik direkod dalam tempoh ni.
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {topAlbums.map((a, idx) => {
              const max = Math.max(1, ...topAlbums.map((x) => x.clicks));
              const pct = (a.clicks / max) * 100;
              return (
                <li key={a.id} className="p-4 flex items-center gap-4 hover:bg-gray-50/60 transition-colors">
                  <div className="w-7 text-center text-sm font-black text-gray-400">{idx + 1}</div>
                  <img
                    src={getCoverUrl(a.cover_image)}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900 truncate">{a.event_name}</span>
                      {a.is_published ? (
                        <Eye className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <EyeOff className="w-3 h-3 text-gray-300 flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500 flex items-center gap-3 mb-2">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {a.event_date}</span>
                      <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3" /> {a.location}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-black to-zinc-600" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xl font-black text-gray-900">{a.clicks}</div>
                    <div className="text-[10px] text-gray-400 font-semibold">
                      {a.unique_visitors} unik
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
