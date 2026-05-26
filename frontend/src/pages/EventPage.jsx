import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Camera, MapPin, Calendar, ArrowRight, ChevronLeft, Mail, Loader2,
  CheckCircle2, ExternalLink, Sparkles, ShieldCheck,
} from 'lucide-react';
import { getEventBySlug, getCoverUrl, trackAlbumClick, trackPageView, submitLead, trackBibSearch } from '../services/api';

function formatDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-MY', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch { return d; }
}

function setMeta(name, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    if (name.startsWith('og:') || name.startsWith('twitter:')) {
      el.setAttribute('property', name);
    } else {
      el.setAttribute('name', name);
    }
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function injectJsonLd(data) {
  let el = document.getElementById('event-jsonld');
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = 'event-jsonld';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export default function EventPage() {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Lead form
  const [form, setForm] = useState({ name: '', email: '', phone: '', bib: '', note: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  // Bib search
  const [bib, setBib] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setNotFound(false);
    trackPageView(`/e/${slug}`);
    (async () => {
      try {
        const data = await getEventBySlug(slug);
        if (!mounted) return;
        setEvent(data);

        // SEO meta + JSON-LD
        const title = `Cari Gambar ${data.event_name} | OhMaiShoot`;
        const desc = data.description
          || `Gambar rasmi ${data.event_name} di ${data.location} (${formatDate(data.event_date)}). Cari gambar larian anda dengan face-search.`;
        document.title = title;
        setMeta('description', desc);
        setMeta('og:title', title);
        setMeta('og:description', desc);
        setMeta('og:type', 'article');
        setMeta('og:url', `https://ohmaishoot.com/e/${data.slug}`);
        if (data.cover_image) setMeta('og:image', `https://ohmaishoot.com/api/covers/${data.cover_image}`);
        setMeta('twitter:card', 'summary_large_image');
        setMeta('twitter:title', title);
        setMeta('twitter:description', desc);
        setCanonical(`https://ohmaishoot.com/e/${data.slug}`);
        injectJsonLd({
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: data.event_name,
          startDate: data.event_date,
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          location: { '@type': 'Place', name: data.location },
          image: data.cover_image ? `https://ohmaishoot.com/api/covers/${data.cover_image}` : undefined,
          description: desc,
          organizer: { '@type': 'Organization', name: 'OhMaiShoot', url: 'https://ohmaishoot.com' },
        });
      } catch (e) {
        if (!mounted) return;
        if (e.response?.status === 404) setNotFound(true);
        else console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.email && !form.phone) {
      setFormError('Sila masukkan email atau no. telefon.');
      return;
    }
    setSubmitting(true);
    try {
      await submitLead({
        album_id: event?.id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        bib: form.bib,
        note: form.note,
        interest: 'face-search',
      });
      setSubmitted(true);
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Gagal hantar. Cuba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <Loader2 className="w-10 h-10 animate-spin text-black" />
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] px-6 text-center">
        <Camera className="w-12 h-12 text-gray-300 mb-4" />
        <h1 className="text-2xl font-black mb-2">Event tak dijumpai</h1>
        <p className="text-gray-500 mb-6">Album mungkin dah dipadam atau alamat salah.</p>
        <Link to="/" className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full font-bold">
          <ChevronLeft className="w-4 h-4" /> Balik ke Home
        </Link>
      </div>
    );
  }

  const cover = getCoverUrl(event.cover_image);

  return (
    <div className="bg-[#fafafa] min-h-screen font-sans">
      {/* Top nav (slim) */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-black">
            <ChevronLeft className="w-4 h-4" /> Semua Event
          </Link>
          <Link to="/" className="font-black tracking-tight">OHMA!SHOOT!</Link>
          <a href="mailto:ohmaishoot@gmail.com" className="text-sm font-bold text-gray-700 hover:text-black hidden sm:flex items-center gap-1.5">
            <Mail className="w-4 h-4" /> Contact
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-16 min-h-[78vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img src={cover} alt={event.event_name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
        </div>
        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-16 text-white">
          <span className="inline-block text-[10px] md:text-xs font-bold tracking-[0.4em] uppercase text-white/70 mb-4">
            Race Gallery · Marathon Photography
          </span>
          <h1 className="text-[clamp(2rem,6vw,4.5rem)] font-black tracking-[-0.03em] leading-[0.95] mb-5 max-w-4xl">
            {event.event_name}
          </h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-white/85 text-sm md:text-base font-medium mb-8">
            <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {formatDate(event.event_date)}</span>
            <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {event.location}</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={event.album_url}
              target="_blank" rel="noopener noreferrer"
              onClick={() => trackAlbumClick(event.id, 'event-page')}
              onAuxClick={(e) => { if (e.button === 1) trackAlbumClick(event.id, 'event-page'); }}
              className="group inline-flex items-center justify-center gap-2 bg-white text-black px-7 py-4 rounded-full font-bold hover:bg-gray-100 transition-all hover:-translate-y-0.5 shadow-2xl shadow-black/30"
            >
              Cari Gambar Saya (Face Search)
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href="#leadform"
              className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md text-white px-7 py-4 rounded-full font-bold border border-white/25 hover:bg-white/20 transition-all"
            >
              Beritahu Saya Bila Lebih Murah
              <Sparkles className="w-4 h-4" />
            </a>
          </div>

          {/* Bib search */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const trimmed = (bib || '').trim();
              if (!trimmed) return;
              trackBibSearch(slug, trimmed);
              trackAlbumClick(event.id, `bib-${trimmed}`);
              const u = new URL(event.album_url);
              // append bib as a query — most photo platforms accept ?q= or ?bib=
              u.searchParams.set('bib', trimmed);
              u.searchParams.set('q', trimmed);
              window.open(u.toString(), '_blank', 'noopener');
            }}
            className="mt-6 max-w-md flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full p-1.5 pl-5"
          >
            <input
              type="text"
              inputMode="numeric"
              placeholder="Atau cari ikut nombor bib..."
              value={bib}
              onChange={(e) => setBib(e.target.value.replace(/[^\w-]/g, '').slice(0, 16))}
              className="flex-1 bg-transparent text-white placeholder:text-white/50 font-semibold outline-none text-sm py-2"
              aria-label="Bib number"
            />
            <button
              type="submit"
              disabled={!bib.trim()}
              className="bg-white text-black font-bold text-sm px-4 py-2.5 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              Cari
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </section>

      {/* About + lead form */}
      <main className="max-w-6xl mx-auto px-6 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-5 gap-12">
        <div className="lg:col-span-3 space-y-10">
          <section>
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-gray-400 mb-2 block">Tentang Acara</span>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 mb-4">Highlights {event.event_name}</h2>
            <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
              <p>
                {event.description || `Kami di ${event.location} pada ${formatDate(event.event_date)} untuk menangkap momen larian peserta ${event.event_name}.
                Setiap pelari dan setiap finish line — semua diabadikan dengan kamera DSLR profesional, oleh photographer marathon Malaysia.`}
              </p>
              <p>
                Klik butang <strong>"Cari Gambar Saya"</strong> di atas — sistem face-search akan padankan muka anda dengan ribuan gambar event ni dalam beberapa saat.
              </p>
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <ShieldCheck className="w-5 h-5 text-emerald-500 mb-2" />
              <div className="font-bold text-sm mb-1">Watermark Preview</div>
              <p className="text-xs text-gray-500 leading-relaxed">Browse semua gambar percuma dengan preview berwatermark.</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <Camera className="w-5 h-5 text-indigo-500 mb-2" />
              <div className="font-bold text-sm mb-1">Resolusi Tinggi</div>
              <p className="text-xs text-gray-500 leading-relaxed">Print-ready DSLR. Sesuai untuk frame, social media, atau memori peribadi.</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <Sparkles className="w-5 h-5 text-amber-500 mb-2" />
              <div className="font-bold text-sm mb-1">Face Search</div>
              <p className="text-xs text-gray-500 leading-relaxed">Snap selfie — sistem cari gambar anda secara automatik dalam album penuh.</p>
            </div>
          </section>

          {event.related?.length > 0 && (
            <section>
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-gray-400 mb-2 block">Event Lain</span>
              <h3 className="text-xl font-black tracking-tight text-gray-900 mb-5">Mungkin Anda Cari</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {event.related.map((r) => (
                  <Link
                    key={r.id}
                    to={`/e/${r.slug}`}
                    className="group bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    <div className="aspect-[4/3] bg-zinc-900 overflow-hidden">
                      <img src={getCoverUrl(r.cover_image)} alt={r.event_name} loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <div className="p-3">
                      <div className="font-bold text-sm text-gray-900 truncate">{r.event_name}</div>
                      <div className="text-[11px] text-gray-500 mt-1">{formatDate(r.event_date)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Lead form sidebar */}
        <aside id="leadform" className="lg:col-span-2 lg:sticky lg:top-24 self-start">
          <div className="bg-gradient-to-br from-zinc-900 to-black text-white rounded-3xl p-7 shadow-xl">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-black mb-2">Terima kasih!</h3>
                <p className="text-white/70 text-sm leading-relaxed mb-5">
                  Kami akan e-mail anda dulu bila face-search kami live, dan share beberapa gambar preview free dari {event.event_name}.
                </p>
                <a
                  href={event.album_url} target="_blank" rel="noopener noreferrer"
                  onClick={() => trackAlbumClick(event.id, 'event-page-after-lead')}
                  className="inline-flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full font-bold text-sm"
                >
                  Sementara Tu, Cari di PhotoHawk <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <>
                <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/50">Lead Capture</span>
                <h3 className="text-2xl font-black mt-1 mb-2">Mahu Gambar Lebih Murah?</h3>
                <p className="text-white/70 text-sm mb-5 leading-relaxed">
                  Kami sedang siapkan kedai sendiri — tiada komisen 25% pelantar. Beritahu saya bila ready, dan saya kirim free preview untuk anda.
                </p>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="text" placeholder="Nama (optional)"
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-white/10 border border-white/15 rounded-lg px-4 py-3 text-sm placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                  />
                  <input
                    type="email" placeholder="Email"
                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-white/10 border border-white/15 rounded-lg px-4 py-3 text-sm placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                  />
                  <input
                    type="tel" placeholder="No. Telefon (atau email)"
                    value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-white/10 border border-white/15 rounded-lg px-4 py-3 text-sm placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                  />
                  <input
                    type="text" placeholder="No. Bib (jika ingat)"
                    value={form.bib} onChange={(e) => setForm({ ...form, bib: e.target.value })}
                    className="w-full bg-white/10 border border-white/15 rounded-lg px-4 py-3 text-sm placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                  />
                  {formError && <div className="text-rose-400 text-xs font-semibold">{formError}</div>}
                  <button
                    type="submit" disabled={submitting}
                    className="w-full bg-white text-black font-bold py-3.5 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Beritahu Saya'}
                    {!submitting && <ArrowRight className="w-4 h-4" />}
                  </button>
                  <p className="text-[10px] text-white/40 text-center leading-relaxed">
                    Kami takkan spam. Email/no. tel anda hanya untuk update event {event.event_name} dan launch kedai.
                  </p>
                </form>
              </>
            )}
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-10 text-center text-sm text-gray-500">
          © OhMaiShoot · Marathon Race Photography Malaysia ·
          <a href="mailto:ohmaishoot@gmail.com" className="text-black font-semibold hover:underline ml-1">ohmaishoot@gmail.com</a>
        </div>
      </footer>
    </div>
  );
}
