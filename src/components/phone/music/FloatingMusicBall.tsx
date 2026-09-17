import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music2, Play, Pause, SkipForward, X } from 'lucide-react';
import { useMusic } from '../../../contexts/MusicContext';

export const FloatingMusicBall: React.FC = () => {
  const { currentSong, isPlaying, resumeSong, pauseSong, nextSong, setIsFloating } = useMusic();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!currentSong) return null;

  // Use fixed Rococo Rose color
  const musicColor = '#e89aab';

  return (
    <motion.div 
      drag="y"
      dragConstraints={{ top: -550, bottom: 0 }}
      dragElastic={0.1}
      dragMomentum={false}
      className="absolute bottom-24 right-4 z-[9999] flex flex-col items-end gap-2 touch-none select-none cursor-grab active:cursor-grabbing"
    >
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.8 }}
            className="bg-white/90 backdrop-blur-md border border-stone-200 rounded-2xl p-3 shadow-xl flex items-center gap-3 min-w-[200px]"
          >
            <div className="relative group">
              <img 
                src={currentSong.picUrl || 'https://p3.music.126.net/6y-UleORITEDbvrOLV0Q8A==/5639395138885805.jpg'} 
                alt="cover" 
                className={`w-10 h-10 rounded-full shadow-md object-cover ${isPlaying ? 'animate-spin-slow' : ''}`}
              />
              <div className="absolute inset-0 bg-black/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Music2 className="w-4 h-4 text-white" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold text-stone-800 truncate">{currentSong.name}</div>
              <div className="text-[9px] text-stone-500 truncate">{currentSong.artists.map(a => a.name).join(' / ')}</div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  isPlaying ? pauseSong() : resumeSong();
                }}
                className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"
              >
                {isPlaying ? <Pause className="w-3 h-3 text-stone-700" /> : <Play className="w-3 h-3 text-stone-700 translate-x-0.5" />}
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  nextSong();
                }}
                className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"
              >
                <SkipForward className="w-3 h-3 text-stone-700" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFloating(false);
                }}
                className="w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center hover:bg-red-100 group transition-colors"
              >
                <X className="w-2.5 h-2.5 text-stone-400 group-hover:text-red-500" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-12 h-12 rounded-full shadow-lg border-2 overflow-hidden relative group transition-colors duration-300 ${isPlaying ? 'ring-2 ring-offset-2' : ''}`}
        style={{ 
          borderColor: musicColor,
          boxShadow: `0 4px 12px ${musicColor}40`,
          // @ts-ignore
          '--tw-ring-color': musicColor
        } as React.CSSProperties}
      >
        <img 
          src={currentSong.picUrl || 'https://p3.music.126.net/6y-UleORITEDbvrOLV0Q8A==/5639395138885805.jpg'} 
          alt="music" 
          className={`w-full h-full object-cover ${isPlaying ? 'animate-spin-slow' : ''}`}
        />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Music2 className="w-5 h-5 text-white" />
        </div>
      </motion.button>
    </motion.div>
  );
};
