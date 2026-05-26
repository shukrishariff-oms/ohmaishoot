import { useEffect, useState } from 'react';
import {
  Loader2, BarChart3, Eye, EyeOff, Calendar, MousePointerClick,
  Users, TrendingUp, Image as ImageIcon, MapPin, Sparkles,
} from 'lucide-react';
import { getStatsOverview, getStatsAlbums, getCoverUrl } from '../services/api';

function StatCard({ icon: Icon, label, value, sub, accent = 'black' }) {
  const accents = {
    black: 'bg-black text-white',
    emerald: 'bg-emerald-500 text-white',
    indigo: 'bg-indigo-500 text-white',
    amber: 'bg-amber-500 text-white',
    rose: 'bg-rose-500 text-white',
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

function Sparkline({ data, height = 56 }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(1, ...data.map((d) => d.clicks));
  const w = 100;
  const step = w / Math.max(1, data.length - 1);
  const path = data
    .map((d, i) => {
      const x = i * step;
      const y = height - (d.clicks / max) * (height - 4) - 2;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
  const area = `${path} L ${(data.length - 1) * step} ${height} L 0 ${height} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full h-14" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#000" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkFill)" />
      <path d={path} fill="none" stroke="#000" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
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

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [topAlbums, setTopAlbums] = useState([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [ov, top] = await Promise.all([
          getStatsOverview(),
          getStatsAlbums(days, 10),
        ]);
        if (mounted) {
          setOverview(ov);
          setTopAlbums(top);
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

  const { events, clicks, daily_clicks_30d, events_per_month } = overview;
  const latestDate = events.latest_event_date
    ? new Date(events.latest_event_date).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className="space-y-8">
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
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2.5 border border-white/15">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold tracking-widest uppercase">Live</span>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={ImageIcon}
          label="Total Event"
          value={events.total}
          sub={`${events.published} publish · ${events.hidden} hidden`}
          accent="black"
        />
        <StatCard
          icon={Calendar}
          label="Akan Datang"
          value={events.upcoming}
          sub="Event date >= hari ini"
          accent="indigo"
        />
        <StatCard
          icon={MousePointerClick}
          label="Klik Album"
          value={clicks.last_30d}
          sub={`30 hari · total ${clicks.total}`}
          accent="emerald"
        />
        <StatCard
          icon={Users}
          label="Pelawat Unik"
          value={clicks.unique_visitors_30d}
          sub="30 hari (IP unik, anon)"
          accent="amber"
        />
      </div>

      {/* Trend + month bars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Trend Klik</span>
              <h3 className="text-lg font-black text-gray-900">30 hari terakhir</h3>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-bold">
              <TrendingUp className="w-3 h-3" />
              {clicks.last_7d} (7d)
            </div>
          </div>
          <Sparkline data={daily_clicks_30d} />
          <div className="flex justify-between text-[10px] font-semibold text-gray-400 mt-1">
            <span>{daily_clicks_30d[0]?.date}</span>
            <span>{daily_clicks_30d[daily_clicks_30d.length - 1]?.date}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Event per Bulan</span>
          <h3 className="text-lg font-black text-gray-900 mb-4">Liputan</h3>
          <MonthBars data={events_per_month} />
        </div>
      </div>

      {/* Top albums by clicks */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Top Album</span>
            <h3 className="text-lg font-black text-gray-900">Klik tertinggi</h3>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  days === d ? 'bg-black text-white' : 'text-gray-600 hover:text-black'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
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
