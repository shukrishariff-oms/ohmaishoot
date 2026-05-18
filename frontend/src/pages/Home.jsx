import { useState, useEffect } from 'react';
import { getPublishedAlbums, getCoverUrl } from '../services/api';
import { Camera, MapPin, Calendar, ArrowRight, Aperture, Mail, ExternalLink } from 'lucide-react';
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
const MARATHONHUB_URL = 'https://marathonhub.ohmaishoot.com';

export default function Home() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getPublishedAlbums();
        if (mounted) setAlbums(data || []);
      } catch (e) {
        console.error('Failed to load albums', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Use cover of latest album as hero background (fallback to gradient if none)
  const heroAlbum = albums[0];
  const heroBg = heroAlbum?.cover_image
    ? getCoverUrl(heroAlbum.cover_image)
    : null;

  return (
    <div className="bg-[#fafafa] min-h-screen font-sans selection:bg-black selection:text-white overflow-x-hidden">
      {/* ─── NAV ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-black">
            <div className="w-9 h-9 bg-black text-white rounded-lg flex items-center justify-center shadow-sm">
              <Aperture className="w-5 h-5" />
            </div>
            <span className="text-lg font-black tracking-tighter">OhMaiShoot.</span>
          </div>
          <div className="flex items-center gap-5">
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

      {/* ─── BRAND STRIP (compact replacement for hero) ─── */}
      <section className="pt-24 pb-10 md:pt-28 md:pb-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <span className="inline-block text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase text-gray-400 mb-3">
            Marathon Photography Malaysia
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-gray-900 leading-none mb-2">
            Relive Your Run.
          </h1>
          <p className="text-sm md:text-base text-gray-500 font-medium">
            Find your moment. Own your finish line.
          </p>
        </div>
      </section>

      {/* ─── FEATURED EVENTS ─── */}
      <main id="events" className="max-w-7xl mx-auto px-6 py-24 md:py-32 scroll-mt-20">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 md:mb-16 gap-4">
          <div>
            <span className="text-xs font-bold tracking-[0.3em] uppercase text-gray-400 mb-3 block">
              Race Galleries
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-gray-900">
              Featured Events
            </h2>
            <p className="text-base md:text-lg text-gray-500 font-medium mt-2">
              Browse the most recent marathon coverages.
            </p>
          </div>
          {!loading && albums.length > 0 && (
            <span className="text-sm font-semibold text-gray-400">
              {albums.length} {albums.length === 1 ? 'event' : 'events'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-black" />
          </div>
        ) : albums.length === 0 ? (
          <div className="text-center bg-white border border-gray-200 rounded-3xl py-32 flex flex-col items-center shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Camera className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No albums yet</h3>
            <p className="text-gray-500">Check back later for new marathon photos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {albums.map((album) => (
              <a
                key={album.id}
                href={album.album_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white rounded-2xl overflow-hidden flex flex-col border border-gray-200/60 shadow-sm hover:shadow-2xl hover:shadow-black/10 hover:-translate-y-1.5 transition-all duration-500"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900">
                  <img
                    src={getCoverUrl(album.cover_image)}
                    alt={album.event_name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-black px-3 py-1 rounded-md font-bold text-xs shadow-sm">
                    {album.event_date?.split('-')[0] || ''}
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-xl md:text-2xl font-bold text-white leading-tight line-clamp-2 drop-shadow-lg mb-2">
                      {album.event_name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-white/80 font-semibold">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {album.event_date}
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
                    <span className="text-sm font-bold text-black">
                      View Photos
                    </span>
                    <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>

      {/* ─── EXPERIENCE / EMOTIONAL ─── */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="bg-black rounded-[2rem] overflow-hidden flex flex-col md:flex-row shadow-2xl">
            <div className="w-full md:w-1/2 relative min-h-[300px] md:min-h-[420px]">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: heroBg
                    ? `url('${heroBg}')`
                    : `url('https://images.unsplash.com/photo-1530549387789-4c1017266635?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/0 to-black/40" />
            </div>
            <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center bg-black text-white">
              <span className="text-xs font-bold tracking-[0.3em] uppercase text-white/50 mb-4">
                The Story
              </span>
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-5 leading-tight">
                Every race tells a story.<br />
                <span className="text-gray-400">We capture yours.</span>
              </h2>
              <p className="text-base md:text-lg text-gray-400 mb-8 font-medium leading-relaxed">
                The sweat, the tears, the triumph at the finish line. We freeze fleeting emotions into memories that last forever.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="#events"
                  className="inline-flex items-center justify-center gap-2 bg-white text-black px-7 py-3.5 rounded-full font-bold hover:bg-gray-200 transition-transform hover:scale-105"
                >
                  Find My Race Photos
                </a>
                <a
                  href={IG_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur text-white px-7 py-3.5 rounded-full font-bold border border-white/20 hover:bg-white/20 transition-all"
                >
                  <Instagram className="w-4 h-4" />
                  Follow on Instagram
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── DIRECTORY CROSS-LINK ─── */}
      <section className="bg-[#fafafa] py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="text-xs font-bold tracking-[0.3em] uppercase text-gray-400 mb-3 block">
            Looking for other photographers?
          </span>
          <h2 className="text-2xl md:text-4xl font-black tracking-tighter text-gray-900 mb-5">
            Browse the full Malaysian race photography directory.
          </h2>
          <p className="text-base md:text-lg text-gray-500 font-medium mb-8 max-w-2xl mx-auto">
            MarathonHub lists every race photographer covering events across Malaysia.
          </p>
          <a
            href={MARATHONHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-black text-white px-8 py-4 rounded-full font-bold hover:bg-gray-800 transition-all hover:-translate-y-0.5 shadow-lg"
          >
            Visit MarathonHub
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Aperture className="w-5 h-5 text-black" />
                <span className="font-black text-gray-900 tracking-tight">OhMaiShoot.</span>
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
    </div>
  );
}
