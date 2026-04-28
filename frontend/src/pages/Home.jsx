import { useState, useEffect } from 'react';
import { getPublishedAlbums, getCoverUrl } from '../services/api';
import { Camera, MapPin, Calendar, ExternalLink, ArrowRight, Aperture, Search, Zap, Star, Smartphone, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    try {
      const data = await getPublishedAlbums();
      setAlbums(data);
    } catch (error) {
      console.error("Failed to load albums", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#fafafa] min-h-screen font-sans selection:bg-black selection:text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer text-white">
            <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center transform transition-transform group-hover:scale-105 group-hover:rotate-3 shadow-lg">
              <Aperture className="w-6 h-6" />
            </div>
            <span className="text-xl font-black tracking-tighter">OhMaiShoot.</span>
          </div>
          <Link to="/admin" className="text-sm font-semibold text-white/70 hover:text-white transition-colors">
            Admin Login
          </Link>
        </div>
      </nav>

      {/* 1. CINEMATIC HERO SECTION */}
      <header className="relative w-full h-screen min-h-[600px] flex flex-col items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1552674605-db6ffd4facb5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')` }}
        />
        {/* Dark Overlay 70% */}
        <div className="absolute inset-0 bg-black/70" />
        
        {/* Content */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 flex flex-col items-center text-center mt-10">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter mb-4 animate-fade-in-up">
            Relive Your Run.
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 font-medium mb-12 animate-fade-in-up delay-100">
            Find your moment. Own your finish line.
          </p>

          {/* Step Guide Text */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-lg font-bold text-white mb-10 animate-fade-in-up delay-200">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20 shadow-sm">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-black text-sm">1</span>
              <span>Find your event</span>
            </div>
            <ArrowRight className="w-5 h-5 text-white/50 hidden sm:block" />
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20 shadow-sm">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-black text-sm">2</span>
              <span>Explore your photos</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center animate-fade-in-up delay-300">
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-6">
              <a href="#events" className="flex items-center justify-center gap-2 bg-white text-black px-10 py-4 rounded-full font-bold hover:bg-gray-200 transition-transform hover:scale-105 shadow-xl">
                <Camera className="w-5 h-5" />
                Browse Events
              </a>
            </div>
            <p className="text-sm font-semibold text-white/60 tracking-wide mb-2">
              All photos are organized by event for easy browsing
            </p>
            <p className="text-sm font-medium text-white/80">
              📸 Photos from recent marathon events are now available
            </p>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 animate-bounce">
          <ArrowRight className="w-6 h-6 rotate-90" />
        </div>
      </header>

      {/* 2. SOCIAL PROOF STRIP */}
      <section className="bg-black py-8 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
          <div className="flex flex-col items-center pt-4 md:pt-0">
            <div className="text-3xl font-black text-white mb-1">10,000+</div>
            <div className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Photos Captured</div>
          </div>
          <div className="flex flex-col items-center pt-4 md:pt-0">
            <div className="text-3xl font-black text-white mb-1">50+</div>
            <div className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Events Covered</div>
          </div>
          <div className="flex flex-col items-center pt-4 md:pt-0">
            <div className="text-3xl font-black text-white mb-1">5,000+</div>
            <div className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Runners Photographed</div>
          </div>
        </div>
      </section>

      {/* 3. FEATURED EVENTS (MAIN SECTION) */}
      <main id="events" className="max-w-7xl mx-auto px-6 py-32 scroll-mt-20">
        <div className="flex items-end justify-between mb-16">
          <div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-gray-900 mb-2">
              Featured Events
            </h2>
            <p className="text-lg text-gray-500 font-medium">Browse our most recent marathon coverages.</p>
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {albums.map((album) => (
              <a 
                key={album.id} 
                href={album.album_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white rounded-3xl overflow-hidden flex flex-col border border-gray-200/60 shadow-sm hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-2 transition-all duration-500 cursor-pointer block"
              >
                <div className="relative aspect-video overflow-hidden bg-black">
                  <img 
                    src={getCoverUrl(album.cover_image)} 
                    alt={album.event_name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/0 opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Floating Date Badge */}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-black px-3 py-1.5 rounded-lg font-bold text-xs shadow-lg transform -translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    {album.event_date.split('-')[0]}
                  </div>
                  {/* Photos Available Badge */}
                  <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm pointer-events-none border border-white/10">
                    Photos Available
                  </div>

                  {/* Title overlay on image */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl md:text-2xl font-bold text-white leading-tight line-clamp-2 drop-shadow-md">
                      {album.event_name}
                    </h3>
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-grow bg-white">
                  <div className="space-y-3 mb-6 text-sm font-semibold text-gray-500">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{album.event_date}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{album.location}</span>
                    </div>
                  </div>
                  
                  <div className="mt-auto">
                    <div className="text-xs font-bold text-orange-600 mb-2 flex items-center gap-1">
                      🔥 Recently Uploaded
                    </div>
                    <div 
                      className="group/btn flex items-center justify-center gap-2 w-full bg-gray-50 text-black py-4 rounded-xl font-bold border border-gray-200 group-hover:bg-black group-hover:text-white group-hover:border-black group-hover:-translate-y-1 active:scale-[0.98] transition-all duration-300"
                    >
                      <span>Find My Race Photos</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>

      {/* 4. WHY OHMAISHOOT (TRUST SECTION) */}
      <section className="bg-white py-24 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-gray-900 mb-4">
              Why Runners Choose OhMaiShoot
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center group">
              <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:bg-black group-hover:text-white">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Fast Delivery</h3>
              <p className="text-gray-500 font-medium">Your photos, ready shortly after the race.</p>
            </div>
            
            <div className="flex flex-col items-center group">
              <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:bg-black group-hover:text-white">
                <ImageIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">High Quality</h3>
              <p className="text-gray-500 font-medium">Sharp, professional marathon photography.</p>
            </div>

            <div className="flex flex-col items-center group">
              <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:bg-black group-hover:text-white">
                <Smartphone className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Easy Access</h3>
              <p className="text-gray-500 font-medium">Find your photos instantly via PhotoHawk.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. EXPERIENCE SECTION (EMOTIONAL) */}
      <section className="bg-[#fafafa]">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="bg-black rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-2xl">
            {/* Left Image */}
            <div className="w-full md:w-1/2 relative min-h-[400px]">
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1530549387789-4c1017266635?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')` }}
              />
            </div>
            {/* Right Content */}
            <div className="w-full md:w-1/2 p-12 md:p-20 flex flex-col justify-center bg-black text-white">
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6 leading-tight">
                Every race tells a story. <br/>
                <span className="text-gray-400">We capture yours.</span>
              </h2>
              <p className="text-lg text-gray-400 mb-10 font-medium leading-relaxed">
                The sweat, the tears, the triumph at the finish line. We freeze those fleeting emotions into memories that last forever.
              </p>
              <div>
                <a href="#events" className="inline-flex items-center justify-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-gray-200 transition-transform hover:scale-105 shadow-xl">
                  Find My Race Photos
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CONVERSION TRAP SECTION */}
      <section className="bg-white py-24 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-6 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <Search className="w-6 h-6 text-gray-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-gray-900 mb-6">
            Tak jumpa gambar?
          </h2>
          <p className="text-xl text-gray-500 font-medium mb-10 leading-relaxed max-w-2xl">
            Cuba semak event lain juga. Mungkin kami tangkap anda di checkpoint berbeza.
          </p>
          <a href="#events" className="inline-flex items-center justify-center bg-black text-white px-10 py-4 rounded-full font-bold hover:bg-gray-800 transition-all hover:-translate-y-1 shadow-lg shadow-black/10">
            Browse All Events
          </a>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Aperture className="w-5 h-5 text-gray-400" />
            <span className="font-bold text-gray-900 tracking-tight">OhMaiShoot.</span>
          </div>
          <p className="text-gray-400 text-sm font-medium">
            © {new Date().getFullYear()} OhMaiShoot Photography. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="/admin" className="text-sm font-semibold text-gray-400 hover:text-black transition-colors">Admin Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
