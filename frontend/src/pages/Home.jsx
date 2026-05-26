import { useState, useEffect } from 'react';
import { getPublishedAlbums, getCoverUrl, trackAlbumClick, trackPageView, getPublicStats } from '../services/api';
import { Camera, MapPin, Calendar, ArrowRight, Aperture, Mail, ExternalLink, ChevronDown, MessageCircle, Award, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

// Inline Instagram SVG (lucide-react v1.11.0 doesn't export Instagram)
const Instagram = ({ className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const IG_HANDLE = 'ohmaishoot';
const IG_URL = `https://instagram.com/${IG_HANDLE}`;
const EMAIL = 'ohmaishoot@gmail.com';
const WHATSAPP_NUMBER = '60133157062';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hai Syuk, saya nak tanya pasal gambar marathon...')}`;
const MARATHONHUB_URL = 'https://marathonhub.ohmaishoot.com';

function formatDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-MY', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return d;
  }
}

export default function Home() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pubStats, setPubStats] = useState(null);

  useEffect(() => {
    let mounted = true;
    trackPageView('/');
    (async () => {
      try {
        const [data, stats] = await Promise.all([
          getPublishedAlbums(),
          getPublicStats().catch(() => null),
        ]);
        if (mounted) {
          setAlbums(data || []);
          setPubStats(stats);
        }
      } catch (e) {
        console.error('Failed to load albums', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const heroAlbum = albums[0];
  const heroBg = heroAlbum?.cover_image ? getCoverUrl(heroAlbum.cover_image) : null;

  return (
    <div className="bg-[#fafafa] min-h-screen font-sans selection:bg-black selection:text-white overflow-x-hidden">
      {/* ─── NAV ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-black">
            <img
              src="/logo.png"
              alt="OhMaiShoot"
              className="h-14 w-auto"
              draggable="false"
            />
          </div>
          <div className="flex items-center gap-5">
            <a
              href="#events"
              className="text-sm font-semibold text-gray-600 hover:text-black transition-colors hidden md:inline"
            >
              Race Galleries
            </a>
            <a
              href={IG_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-gray-600 hover:text-black transition-colors flex items-center gap-1.5"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
              <span className="hidden sm:inline">@{IG_HANDLE}</span>
            </a>
            <a
              href={`mailto:${EMAIL}`}
              className="text-sm font-semibold text-gray-600 hover:text-black transition-colors flex items-center gap-1.5"
              aria-label="Contact"
            >
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Contact</span>
            </a>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative min-h-[88vh] md:min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background image (latest album cover) */}
        <div className="absolute inset-0 bg-zinc-900">
          {heroBg && (
            <img
              src={heroBg}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover scale-105 animate-[heroZoom_18s_ease-out_forwards]"
            />
          )}
          {/* Layered gradients for legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/85" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
        </div>

        {/* Subtle film-grain overlay */}
        <div
          className="absolute inset-0 opacity-[0.06] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
          <span className="inline-block text-[10px] md:text-xs font-bold tracking-[0.4em] uppercase text-white/60 mb-5">
            Marathon Race Photography · Malaysia
          </span>
          <h1 className="text-[clamp(2.5rem,8vw,5.5rem)] font-black tracking-[-0.04em] text-white leading-[0.95] mb-6">
            Relive Your Run.
            <br />
            <span className="text-white/50">Own The Finish.</span>
          </h1>
          <p className="text-base md:text-xl text-white/75 font-medium max-w-xl mx-auto mb-10 leading-relaxed">
            Cari gambar larian anda dari setiap acara marathon &amp; running event yang kami liputi di seluruh Malaysia.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {heroAlbum ? (
              heroAlbum.face_slug ? (
                <Link
                  to={`/shop?event=${heroAlbum.slug}`}
                  onClick={() => trackAlbumClick(heroAlbum.id, 'hero')}
                  className="group inline-flex items-center justify-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition-all hover:-translate-y-0.5 shadow-2xl shadow-black/30"
                >
                  <span>Cari Gambar {heroAlbum.event_name?.split(' ').slice(0, 3).join(' ')}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ) : (
                <a
                  href={heroAlbum.album_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackAlbumClick(heroAlbum.id, 'hero')}
                  onAuxClick={(e) => { if (e.button === 1) trackAlbumClick(heroAlbum.id, 'hero'); }}
                  className="group inline-flex items-center justify-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition-all hover:-translate-y-0.5 shadow-2xl shadow-black/30"
                >
                  <span>Cari Gambar {heroAlbum.event_name?.split(' ').slice(0, 3).join(' ')}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
              )
            ) : (
              <a
                href="#events"
                className="inline-flex items-center justify-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition-all hover:-translate-y-0.5 shadow-2xl shadow-black/30"
              >
                Cari Gambar Saya
                <ArrowRight className="w-4 h-4" />
              </a>
            )}
            <a
              href="#events"
              className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-full font-bold border border-white/25 hover:bg-white/20 transition-all"
            >
              Lihat Semua Event
              <ChevronDown className="w-4 h-4" />
            </a>
          </div>

          {/* Latest race ticker pill */}
          {heroAlbum && (
            <div className="mt-12 inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-5 py-2.5 text-white">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-xs font-bold tracking-widest uppercase text-white/70">Latest</span>
              <span className="text-sm font-bold truncate max-w-[60vw] md:max-w-md">{heroAlbum.event_name}</span>
              <span className="text-xs text-white/60 hidden sm:inline">· {formatDate(heroAlbum.event_date)}</span>
            </div>
          )}

          {/* Trust counters */}
          {pubStats && (
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
              {[
                { v: `${pubStats.events}+`, l: 'Events Liput', i: Calendar },
                { v: pubStats.photos > 1000 ? `${(pubStats.photos / 1000).toFixed(0)}K+` : `${pubStats.photos}+`, l: 'Gambar', i: ImageIcon },
                { v: `${pubStats.locations}+`, l: 'Lokasi', i: MapPin },
                { v: `${pubStats.years}+`, l: 'Tahun', i: Award },
              ].map((s, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-md border border-white/15 rounded-xl px-4 py-3 text-white">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <s.i className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-2xl md:text-3xl font-black tracking-tight">{s.v}</span>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/60">{s.l}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scroll cue */}
        <a
          href="#events"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 hover:text-white transition-colors animate-bounce"
          aria-label="Scroll to galleries"
        >
          <ChevronDown className="w-6 h-6" />
        </a>
      </section>

      {/* ─── FEATURED EVENTS ─── */}
      <main id="events" className="max-w-7xl mx-auto px-6 py-20 md:py-28 scroll-mt-20">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 md:mb-14 gap-3">
          <div>
            <span className="text-xs font-bold tracking-[0.3em] uppercase text-gray-400 mb-2 block">
              Race Galleries
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-[-0.03em] text-gray-900">
              Featured Events
            </h2>
          </div>
          {!loading && albums.length > 0 && (
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-gray-400">
              <span className="w-8 h-px bg-gray-300" />
              {albums.length} {albums.length === 1 ? 'event' : 'events'}
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-200/60 shadow-sm">
                <div className="aspect-[4/3] bg-gray-100 animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-100 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : albums.length === 0 ? (
          <div className="text-center bg-white border border-gray-200 rounded-3xl py-32 flex flex-col items-center shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Camera className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Belum ada album</h3>
            <p className="text-gray-500">Sila datang lagi nanti untuk gambar marathon terbaru.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {albums.map((album, idx) => {
              const useShop = !!album.face_slug;
              const cardClass = "group bg-white rounded-2xl overflow-hidden flex flex-col border border-gray-200/60 shadow-sm hover:shadow-2xl hover:shadow-black/15 hover:-translate-y-1.5 transition-all duration-500";
              const inner = (
                <>
                <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900">
                  <img
                    src={getCoverUrl(album.cover_image)}
                    alt={album.event_name}
                    loading={idx < 3 ? 'eager' : 'lazy'}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  {/* Year tag */}
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-black px-2.5 py-1 rounded-md font-black text-[11px] tracking-wider shadow-sm">
                    {album.event_date?.split('-')[0] || ''}
                  </div>

                  {/* New badge for latest album */}
                  {idx === 0 && (
                    <div className="absolute top-4 right-4 bg-emerald-500 text-white px-2.5 py-1 rounded-md font-black text-[10px] tracking-widest uppercase shadow-lg">
                      Latest
                    </div>
                  )}

                  {/* Face-search badge */}
                  {useShop && (
                    <div className="absolute top-4 right-4 mt-7 bg-blue-500 text-white px-2.5 py-1 rounded-md font-black text-[10px] tracking-widest uppercase shadow-lg flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Face Search
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-xl md:text-2xl font-bold text-white leading-tight line-clamp-2 drop-shadow-lg mb-2">
                      {album.event_name}
                    </h3>
                    <div className="flex items-center gap-3 text-[11px] text-white/85 font-semibold">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(album.event_date)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 flex flex-col bg-white">
                  <div className="flex items-center gap-2 text-sm text-gray-500 font-semibold mb-4 min-h-[1.25rem]">
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{album.location || '—'}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-4 border-t border-gray-100">
                    <span className="text-sm font-bold text-black">{useShop ? 'Cari Muka Saya' : 'View Photos'}</span>
                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                      <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
                </>
              );
              return useShop ? (
                <Link
                  key={album.id}
                  to={`/shop?event=${album.slug}`}
                  onClick={() => trackAlbumClick(album.id, 'list')}
                  className={cardClass}
                >
                  {inner}
                </Link>
              ) : (
                <a
                  key={album.id}
                  href={album.album_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackAlbumClick(album.id, 'list')}
                  onAuxClick={(e) => { if (e.button === 1) trackAlbumClick(album.id, 'list'); }}
                  className={cardClass}
                >
                  {inner}
                </a>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── ABOUT OHMAISHOOT (SEO/GEO entity content) ─── */}
      <section
        aria-labelledby="about-heading"
        className="bg-white border-y border-gray-100"
      >
        <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
          <span className="text-xs font-bold tracking-[0.3em] uppercase text-gray-400 mb-3 block">
            About OhMaiShoot
          </span>
          <h2
            id="about-heading"
            className="text-3xl md:text-5xl font-black tracking-[-0.03em] text-gray-900 mb-6"
          >
            Official marathon &amp; running event photographer in Malaysia.
          </h2>
          <div className="space-y-5 text-base md:text-lg text-gray-700 font-medium leading-relaxed">
            <p>
              <strong>OhMaiShoot</strong> shoots official race photos at marathons,
              fun runs, half marathons, ultra trails, and triathlons across Malaysia.
              We deliver every event as a <strong>face-search gallery</strong> so you
              can find your finish-line moment in seconds — upload a selfie, see your
              photos, download in high resolution. No bib? No problem.
            </p>
            <p>
              We&apos;ve covered races in Kuala Lumpur, Putrajaya, Selangor, Penang,
              Kedah, Johor, Melaka, and beyond — from the Putrajaya Lake Half Marathon
              to the Melaka World Heritage Half Marathon, Larian Sawah Padi Sekinchan,
              and the International Positive Energy Half Marathon. Every photo is sold
              direct by OhMaiShoot, so runners pay the photographer&apos;s price — no
              middleman commission.
            </p>
            <p>
              OhMaiShoot also operates{' '}
              <a
                href="https://marathonhub.ohmaishoot.com/"
                className="font-bold text-black underline decoration-emerald-500 decoration-2 underline-offset-4 hover:decoration-4 transition-all"
              >
                MarathonHub
              </a>{' '}
              — Malaysia&apos;s public directory of marathon, running, and cycling
              event photographers. If we didn&apos;t shoot your race, you&apos;ll
              probably find your photographer there.
            </p>
          </div>
        </div>
      </section>

      {/* ─── FAQ (visible + JSON-LD for Google rich results & AI search) ─── */}
      <section
        aria-labelledby="faq-heading"
        className="bg-[#fafafa] border-b border-gray-100"
      >
        <div className="max-w-3xl mx-auto px-6 py-16 md:py-20">
          <span className="text-xs font-bold tracking-[0.3em] uppercase text-gray-400 mb-3 block">
            Frequently asked
          </span>
          <h2
            id="faq-heading"
            className="text-2xl md:text-4xl font-black tracking-[-0.03em] text-gray-900 mb-10"
          >
            Common questions about OhMaiShoot.
          </h2>
          <dl className="space-y-3">
            {[
              {
                q: 'How do I find my marathon photos with OhMaiShoot?',
                a: 'Open the event from the Race Galleries section above and click through to the gallery. Upload a selfie for face-search, or search by bib number — your photos appear in seconds. Browsing and previews are free.',
              },
              {
                q: 'How much does an OhMaiShoot race photo cost?',
                a: 'High-resolution downloads start from RM10 per photo, with package pricing for multiple photos. Final pricing is set per event and shown inside each gallery. OhMaiShoot sells direct, so there\u2019s no third-party commission.',
              },
              {
                q: 'Which marathons and running events do you cover in Malaysia?',
                a: 'We cover marathons, fun runs, half marathons, ultra trails, triathlons, and corporate runs across Kuala Lumpur, Putrajaya, Selangor, Penang, Kedah, Johor, Melaka and beyond. Our recent events list is on this page under Featured Events.',
              },
              {
                q: 'Can you shoot my running event?',
                a: 'Yes. Email ohmaishoot@gmail.com with your event date, location, and expected number of runners. We provide official race photography with same-day or next-day face-search gallery delivery.',
              },
              {
                q: 'What is MarathonHub and how is it related to OhMaiShoot?',
                a: 'MarathonHub (marathonhub.ohmaishoot.com) is a public directory of marathon, running, and cycling event photographers in Malaysia, operated by OhMaiShoot. If we didn\u2019t cover your race, MarathonHub helps you find the photographer who did.',
              },
            ].map((item, i) => (
              <details
                key={i}
                className="group bg-white border border-gray-200 rounded-2xl px-5 py-4 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <dt className="font-bold text-gray-900 text-base md:text-lg pr-4">
                    {item.q}
                  </dt>
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <dd className="mt-3 text-gray-600 font-medium leading-relaxed">
                  {item.a}
                </dd>
              </details>
            ))}
          </dl>

          {/* JSON-LD FAQPage — Google rich results + AI search engines */}
          <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: [
                  {
                    '@type': 'Question',
                    name: 'How do I find my marathon photos with OhMaiShoot?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Open the event from Race Galleries on ohmaishoot.com, click into the gallery, then upload a selfie for face-search or search by bib number. Browsing and previews are free.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'How much does an OhMaiShoot race photo cost?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'High-resolution downloads start from RM10 per photo, with package pricing for multiple photos. OhMaiShoot sells direct, no third-party commission.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Which marathons and running events do you cover in Malaysia?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Marathons, fun runs, half marathons, ultra trails, triathlons, and corporate runs across Kuala Lumpur, Putrajaya, Selangor, Penang, Kedah, Johor, and Melaka.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Can you shoot my running event?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Yes. Email ohmaishoot@gmail.com with event date, location, and runner count. We provide official race photography with same-day or next-day face-search gallery delivery.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'What is MarathonHub and how is it related to OhMaiShoot?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'MarathonHub (marathonhub.ohmaishoot.com) is a public directory of marathon, running, and cycling event photographers in Malaysia, operated by OhMaiShoot.',
                    },
                  },
                ],
              }),
            }}
          />
        </div>
      </section>

      {/* ─── PHOTOGRAPHER PROFILE ─── */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-24 grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-700 shadow-2xl">
              {/* Mascot / portrait placeholder — fallback to logo if no portrait yet */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center">
                  <span className="text-7xl">📸</span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent">
                <div className="flex items-center gap-2 text-white/80 text-xs font-bold uppercase tracking-widest mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Available Untuk Booking
                </div>
                <div className="text-white font-black text-xl">Syuk · OhMaiShoot</div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-3 order-1 lg:order-2">
            <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-emerald-600 mb-3 block">
              Meet The Shooter
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-[-0.03em] text-gray-900 mb-5 leading-tight">
              Solo photographer.<br />
              <span className="text-gray-400">Setiap muka penting.</span>
            </h2>
            <p className="text-gray-600 leading-relaxed text-base md:text-lg mb-6">
              Saya tangkap setiap pelari — bukan model je. Bib 1 sampai bib akhir, depan barisan sampai walker terakhir. Sebab tu setiap album OhMaiShoot lengkap, bukan curated highlights.
            </p>
            <div className="grid grid-cols-3 gap-3 mb-7">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                <div className="text-emerald-700 font-black text-xl">DSLR</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/70 mt-0.5">Full-frame</div>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-center">
                <div className="text-indigo-700 font-black text-xl">24h</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-700/70 mt-0.5">Delivery</div>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                <div className="text-amber-700 font-black text-xl">100%</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-amber-700/70 mt-0.5">Coverage</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={WHATSAPP_URL}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-full font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp Booking
              </a>
              <a
                href={`mailto:${EMAIL}?subject=Booking%20OhMaiShoot`}
                className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 px-6 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Email Saya
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STICKY WHATSAPP FAB ─── */}
      <a
        href={WHATSAPP_URL}
        target="_blank" rel="noopener noreferrer"
        aria-label="WhatsApp booking"
        className="fixed bottom-5 right-5 z-40 group flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-2xl shadow-emerald-500/40 transition-all hover:-translate-y-0.5 pl-4 pr-5 py-3"
      >
        <span className="relative flex">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
          <MessageCircle className="relative w-5 h-5" />
        </span>
        <span className="font-bold text-sm hidden sm:inline">Chat WhatsApp</span>
      </a>

      {/* ─── DIRECTORY CROSS-LINK ─── */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-16 md:py-20">
          <div className="bg-gradient-to-br from-black via-zinc-900 to-black rounded-3xl p-10 md:p-14 text-center text-white relative overflow-hidden">
            {/* Decorative ring */}
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

            <span className="relative inline-block text-[10px] md:text-xs font-bold tracking-[0.4em] uppercase text-white/50 mb-3">
              Bukan event yang OhMaiShoot liput?
            </span>
            <h2 className="relative text-2xl md:text-4xl font-black tracking-[-0.03em] mb-4 leading-tight">
              Cari di seluruh direktori jurugambar Malaysia.
            </h2>
            <p className="relative text-sm md:text-base text-white/65 font-medium mb-8 max-w-xl mx-auto leading-relaxed">
              MarathonHub senaraikan setiap jurugambar yang meliputi event larian di Malaysia. Selfie, dapat semua gambar.
            </p>
            <a
              href={MARATHONHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="relative inline-flex items-center justify-center gap-2 bg-white text-black px-7 py-3.5 rounded-full font-bold hover:bg-gray-100 transition-all hover:-translate-y-0.5 shadow-xl"
            >
              Visit MarathonHub
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <div>
              <div className="mb-3">
                <img
                  src="/logo.png"
                  alt="OhMaiShoot"
                  className="h-20 w-auto"
                  draggable="false"
                />
              </div>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                Marathon and running event photography across Malaysia.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400 mb-3">
                Connect
              </h4>
              <ul className="space-y-2 text-sm font-semibold">
                <li>
                  <a
                    href={IG_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
                  >
                    <Instagram className="w-4 h-4" />
                    @{IG_HANDLE}
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${EMAIL}`}
                    className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    {EMAIL}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400 mb-3">
                More
              </h4>
              <ul className="space-y-2 text-sm font-semibold">
                <li>
                  <a href="#events" className="text-gray-600 hover:text-black transition-colors">
                    Race Galleries
                  </a>
                </li>
                <li>
                  <a
                    href={MARATHONHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-black transition-colors"
                  >
                    MarathonHub Directory
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-gray-400 text-xs font-medium">
              © {new Date().getFullYear()} OhMaiShoot Photography. All rights reserved.
            </p>
            <Link
              to="/admin"
              className="text-xs font-semibold text-gray-300 hover:text-gray-500 transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </footer>

      {/* Hero zoom keyframe */}
      <style>{`
        @keyframes heroZoom {
          from { transform: scale(1.12); }
          to { transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
}
