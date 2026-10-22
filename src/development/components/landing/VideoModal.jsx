import React from 'react';
import { X, Play } from 'lucide-react';

const VideoModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-10 bg-[#191514]/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#4B080C] border border-[#F4EDE3]/20 w-full max-w-4xl p-3 sm:p-4 md:p-6 relative shadow-2xl rounded-sm overflow-hidden text-[#F4EDE3] max-h-[90vh] overflow-y-auto">
        
        {/* Header bar */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#F4EDE3]/10">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <span className="font-script text-lg sm:text-2xl text-[#F4EDE3] shrink-0">Tekkzy Salon</span>
            <span className="text-[9px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase text-[#F4EDE3]/60 truncate hidden xs:inline">• Brand Documentary</span>
          </div>
          <button 
            onClick={onClose}
            className="text-[#F4EDE3] hover:text-white p-1 transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X size={22} />
          </button>
        </div>

        {/* Video Player Container */}
        <div className="relative aspect-video w-full mt-3 sm:mt-4 bg-[#191514] flex items-center justify-center overflow-hidden border border-[#F4EDE3]/10">
          <img
            src="./assets/hero_ref.jpg"
            alt="Tekkzy Salon Fashion Campaign Preview"
            className="absolute inset-0 w-full h-full object-cover opacity-40 filter contrast-125"
          />
          
          <div className="relative z-10 flex flex-col items-center space-y-2 sm:space-y-4 text-center p-4 sm:p-6 bg-[#4B080C]/80 backdrop-blur-sm border border-[#F4EDE3]/20 max-w-[90%] sm:max-w-md">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-[#F4EDE3] flex items-center justify-center bg-[#75171D] shadow-lg animate-pulse">
              <Play size={20} className="text-[#F4EDE3] ml-0.5 fill-current sm:w-6 sm:h-6" />
            </div>
            <h3 className="font-serif text-lg sm:text-2xl tracking-wide uppercase text-[#F4EDE3]">THE TEKKZY HERITAGE</h3>
            <p className="font-script text-base sm:text-xl text-[#F4EDE3]/90">Beauty. Confidence. You.</p>
            <p className="text-[10px] sm:text-xs text-[#F4EDE3]/80 leading-relaxed">
              Crafting haute couture beauty experiences in Paris, Milan, and New York. Discover the artistry behind our signature transformations.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row justify-between items-center gap-1 text-[9px] sm:text-[11px] tracking-widest text-[#F4EDE3]/60 uppercase">
          <span>TEKKZY SALON EDITORIAL FILMS</span>
          <span>DURATION 02:45</span>
        </div>

      </div>
    </div>
  );
};

export default VideoModal;
