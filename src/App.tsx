import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Search, 
  Radio, 
  Heart, 
  Share2, 
  Info,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  Monitor
} from 'lucide-react';
import { RADIO_STATIONS } from './constants';
import { RadioStation } from './types';

export default function App() {
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Todas');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('radio-favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [recentIds, setRecentIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('radio-recents');
    return saved ? JSON.parse(saved) : [];
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    localStorage.setItem('radio-favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('radio-recents', JSON.stringify(recentIds));
  }, [recentIds]);

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const addToRecents = (id: string) => {
    setRecentIds(prev => {
      const filtered = prev.filter(p => p !== id);
      return [id, ...filtered].slice(0, 10);
    });
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const categories = ['Todas', 'Favoritos', 'Recientes', ...Array.from(new Set(RADIO_STATIONS.map(s => s.category)))];

  const filteredStations = useMemo(() => {
    let list = RADIO_STATIONS;
    
    if (activeCategory === 'Favoritos') {
      list = RADIO_STATIONS.filter(s => favorites.includes(s.id));
    } else if (activeCategory === 'Recientes') {
      list = recentIds.map(id => RADIO_STATIONS.find(s => s.id === id)).filter(Boolean) as RadioStation[];
    } else if (activeCategory !== 'Todas') {
      list = RADIO_STATIONS.filter(s => s.category === activeCategory);
    }

    if (searchQuery) {
      list = list.filter(station => station.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    return list;
  }, [searchQuery, activeCategory, favorites, recentIds]);

  const handlePlayStation = (station: RadioStation) => {
    if (currentStation?.id === station.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStation(station);
      setIsPlaying(true);
      addToRecents(station.id);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const handleError = (e: any) => {
      console.error("Audio error", e);
      // More specific error logging
      const error = audioRef.current?.error;
      let message = "Error desconocido";
      if (error) {
        switch (error.code) {
          case 1: message = "Abortado por el usuario"; break;
          case 2: message = "Error de red"; break;
          case 3: message = "Error de decodificación"; break;
          case 4: message = "Fuente no soportada"; break;
        }
      }
      console.error(`Playback failed: ${message}`, error);
      setIsPlaying(false);
    };

    if (audioRef.current) {
      audioRef.current.addEventListener('error', handleError);
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('error', handleError);
      }
    };
  }, [currentStation]);

  useEffect(() => {
    if (isPlaying) {
      const playPromise = audioRef.current?.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          // AbortError happens when play() is interrupted by pause() or a source change.
          // This is normal and should not force isPlaying to false.
          if (e.name === 'AbortError') {
            return;
          }
          console.error("Play operation failed", e);
          setIsPlaying(false);
        });
      }
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying, currentStation]);

  const toggleMute = () => setIsMuted(!isMuted);

  return (
    <div className="flex h-screen bg-[#050508] text-[#f8fafc] font-sans overflow-hidden">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-900/10 blur-[120px] rounded-full" />
      </div>

      <audio 
        ref={audioRef} 
        src={currentStation?.streamUrl} 
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 256 : 80 }}
        className="relative z-10 flex flex-col border-r border-white/5 bg-[#0a0a0f] transition-all"
      >
        <div className="p-8 flex items-center justify-between">
          {isSidebarOpen && (
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xl font-bold tracking-tight flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                <Radio size={18} className="text-white" />
              </div>
              ON-AIR<span className="text-red-500">.</span>ES
            </motion.h1>
          )}
          {!isSidebarOpen && (
            <div className="w-full flex justify-center">
              <Radio className="text-white" size={24} />
            </div>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white/5 rounded-full transition-colors hidden md:block"
          >
            {isSidebarOpen ? <Menu size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-6 overflow-y-auto">
          <div className="space-y-2">
            {isSidebarOpen && <p className="px-4 text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold mb-4">Explorar</p>}
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all group ${
                  activeCategory === cat ? 'bg-white/5 text-white font-medium' : 'text-white/60 hover:text-white'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${
                  activeCategory === cat ? 'bg-red-500' : 
                  (cat === 'Favoritos' ? 'bg-pink-500/20' : (cat === 'Recientes' ? 'bg-blue-500/20' : 'bg-transparent'))
                }`} />
                {isSidebarOpen && <span className="text-sm">{cat}</span>}
              </button>
            ))}
          </div>
        </nav>

        <div className="p-4 mt-auto border-t border-white/5 space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Reloj Local</span>
            <span className="text-[10px] font-mono text-white/60">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          {isSidebarOpen ? (
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <p className="text-xs text-white/40 mb-1">Escuchando ahora</p>
              <p className="text-sm font-medium truncate">{currentStation?.name || 'Ninguna seleccionada'}</p>
            </div>
          ) : (
            <div className="flex justify-center">
              <Info size={18} className="text-white/40" />
            </div>
          )}
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 relative z-10 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input 
              type="text" 
              placeholder="Busca emisoras, géneros o ciudades..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:border-red-500/50 transition-colors text-sm"
            />
          </div>

          <div className="flex items-center gap-4 text-white/60 text-xs font-medium uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>{RADIO_STATIONS.length} Emisoras Online</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 pb-32">
          {/* Featured Section */}
          {!searchQuery && activeCategory === 'Todas' && (
            <div className="mb-12 text-[#f8fafc]">
              <div className="flex items-end justify-between mb-8">
                <h2 className="text-3xl font-bold tracking-tight">Destacados</h2>
                <span className="text-red-500 text-sm font-medium cursor-pointer">Ver todo</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {RADIO_STATIONS.slice(0, 3).map((station) => (
                  <motion.div
                    key={`featured-${station.id}`}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePlayStation(station)}
                    className={`relative h-44 rounded-3xl overflow-hidden cursor-pointer group glass ${currentStation?.id === station.id ? 'glow-active' : ''}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent z-10" />
                    
                    <div className="absolute inset-0 p-6 flex flex-col justify-between z-20">
                      <div className="flex justify-between items-start">
                        <div className="bg-red-600/20 text-red-500 border border-red-500/30 px-3 py-1 rounded-full text-[9px] uppercase tracking-[0.2em] font-bold">
                          TOP 40 ESPAÑA
                        </div>
                        <div className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg shadow-red-600/20">
                          {currentStation?.id === station.id && isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" className="ml-0.5" />}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/[0.05] rounded-2xl p-2 flex-shrink-0 border border-white/5 flex items-center justify-center font-black text-xs">
                          <img 
                            src={station.logoUrl} 
                            alt={station.name} 
                            className="w-full h-full object-contain filter drop-shadow-md"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(station.name)}&background=random&color=fff`;
                            }}
                          />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold uppercase tracking-tight group-hover:text-red-400 transition-colors">{station.name}</h3>
                          <p className="text-white/40 text-xs line-clamp-1 italic">"{station.description}"</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
              <span className="w-6 h-px bg-white/20"></span> Explorar Todas
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <AnimatePresence mode='popLayout'>
              {filteredStations.map((station, index) => (
                <motion.div
                  layout
                  key={station.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handlePlayStation(station)}
                  className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer glass hover:bg-white/10 transition-all hover:-translate-y-1 active:scale-95 ${currentStation?.id === station.id ? 'glow-active' : ''}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent z-10" />
                  
                  {/* Station Logo */}
                  <div className="absolute inset-0 flex items-center justify-center p-8 bg-gradient-to-br from-white/[0.05] to-transparent">
                    {station.logoUrl ? (
                      <img 
                        src={station.logoUrl} 
                        alt={station.name} 
                        className="w-full h-full object-contain filter drop-shadow-2xl transition-all duration-500 opacity-80 group-hover:opacity-100"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(station.name)}&background=random&color=fff&size=512`;
                        }}
                      />
                    ) : (
                      <Radio size={48} className="text-white/20" />
                    )}
                  </div>

                  {/* Play Overlay */}
                  <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px]">
                    <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center text-white transform scale-90 group-hover:scale-100 transition-transform shadow-xl">
                      {currentStation?.id === station.id && isPlaying ? <Pause fill="white" size={24} /> : <Play fill="white" size={24} className="ml-1" />}
                    </div>
                  </div>

                  {currentStation?.id === station.id && isPlaying && (
                    <div className="absolute top-3 left-3 z-30 bg-red-600 text-[9px] px-2 py-0.5 rounded font-bold tracking-wider flex items-center gap-1">
                      <span className="w-1 h-1 bg-white rounded-full animate-ping" />
                      DIRECTO
                    </div>
                  )}

                  {/* Heart Button Card */}
                  <button 
                    onClick={(e) => toggleFavorite(station.id, e)}
                    className={`absolute top-4 right-4 z-40 p-2 rounded-full backdrop-blur-md border border-white/10 transition-all hover:scale-110 active:scale-90 ${favorites.includes(station.id) ? 'bg-red-500 text-white border-red-400' : 'bg-black/20 text-white/40 hover:text-white'}`}
                  >
                    <Heart size={14} fill={favorites.includes(station.id) ? "currentColor" : "none"} />
                  </button>

                  <div className="absolute bottom-0 left-0 right-0 p-5 z-30">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">{station.category}</p>
                    <h3 className="font-bold text-sm leading-tight truncate group-hover:text-red-400 transition-colors uppercase">{station.name}</h3>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {filteredStations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 opacity-40">
              <Monitor size={64} strokeWidth={1} className="mb-4" />
              <p className="text-xl">No se encontraron emisoras</p>
              <button 
                onClick={() => {setSearchQuery(''); setActiveCategory('Todas');}}
                className="mt-4 text-white underline"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Persistent Player Bar */}
      <AnimatePresence>
        {currentStation && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
          >
            <div className="max-w-6xl mx-auto flex items-center gap-4 md:gap-8 bg-[#0a0a0f] border-t border-white/5 p-5 rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] border border-white/10">
              {/* Current Station Info */}
              <div className="flex items-center gap-4 w-1/4 min-w-[200px]">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/[0.03] overflow-hidden flex-shrink-0 border border-white/5 flex items-center justify-center font-black text-xs">
                  {currentStation.logoUrl ? (
                    <img 
                      src={currentStation.logoUrl} 
                      alt={currentStation.name} 
                      className="w-full h-full object-contain p-2" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentStation.name)}&background=random&color=fff`;
                      }}
                    />
                  ) : currentStation.name.substring(0, 3).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-bold truncate text-sm">{currentStation.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    {isPlaying && (
                      <div className="flex items-end gap-0.5 h-3 mb-0.5">
                        <div className="spectrum-bar" style={{ animationDelay: '0.1s' }} />
                        <div className="spectrum-bar" style={{ animationDelay: '0.3s' }} />
                        <div className="spectrum-bar" style={{ animationDelay: '0.2s' }} />
                      </div>
                    )}
                    <span className="text-[10px] text-red-500 font-bold uppercase tracking-tighter">DIRECTO</span>
                  </div>
                </div>
                <button 
                  onClick={(e) => toggleFavorite(currentStation.id, e)}
                  className={`hidden md:block ml-2 transition-colors ${favorites.includes(currentStation.id) ? 'text-red-500' : 'text-white/20 hover:text-red-500'}`}
                >
                  <Heart size={18} fill={favorites.includes(currentStation.id) ? "currentColor" : "none"} />
                </button>
              </div>

              {/* Controls */}
              <div className="flex-1 flex flex-col items-center gap-3">
                <div className="flex items-center gap-8">
                  <button className="text-white/20 hover:text-white transition-colors">
                    <ChevronRight size={20} className="rotate-180" />
                  </button>
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                  >
                    {isPlaying ? <Pause fill="black" size={24} /> : <Play fill="black" size={24} className="ml-1" />}
                  </button>
                  <button className="text-white/20 hover:text-white transition-colors">
                    <ChevronRight size={20} />
                  </button>
                </div>
                
                <div className="w-full max-w-sm flex items-center gap-3">
                  <span className="text-[10px] text-white/20 font-mono tracking-tighter">STEREO</span>
                  <div className="flex-1 h-1 bg-white/5 rounded-full relative overflow-hidden">
                    {isPlaying && (
                      <motion.div 
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 10, repeat: Infinity }}
                        className="absolute top-0 left-0 h-full bg-red-600 shadow-[0_0_8px_rgba(239,68,68,0.6)]" 
                      />
                    )}
                  </div>
                  <span className="text-[10px] text-white/20 font-mono tracking-tighter">HD AUDIO</span>
                </div>
              </div>

              {/* Volume & Settings */}
              <div className="flex items-center gap-4 w-1/4 justify-end">
                <div className="hidden md:flex items-center gap-3 w-24">
                  <button onClick={toggleMute} className="text-white/30 hover:text-white transition-colors">
                    {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  <div className="flex-1 h-1 bg-white/5 rounded-full relative group cursor-pointer">
                    <motion.div 
                      className="absolute inset-y-0 left-0 bg-white rounded-full"
                      style={{ width: `${volume * 100}%` }}
                    />
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.01" 
                      value={volume} 
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
                <button className="text-white/30 hover:text-white">
                  <ExternalLink size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
