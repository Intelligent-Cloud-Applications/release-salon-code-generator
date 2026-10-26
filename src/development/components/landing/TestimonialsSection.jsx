import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star, Camera } from 'lucide-react';
import { gsap, ScrollTrigger, prefersReducedMotion, SCRUB } from '../lib/gsapSetup';
import { useSiteData } from '../context/SiteContext';

/* ─────────────────────── DATA ─────────────────────── */
const FALLBACK_TESTIMONIALS = [
  {
    id: 1,
    name: 'Ananya Verma',
    service: 'SKIN & HAIR TREATMENT',
    quote:
      "The best salon experience I've ever had! The team truly understands what your hair & skin needs.",
    image: '/assets/testimonial_ananya.png',
  },
  {
    id: 2,
    name: 'Ritika Sharma',
    service: 'MAKEUP STUDIO',
    quote:
      'From the moment I walked in, I felt so comfortable. Amazing makeup and such a warm, professional team!',
    image: '/assets/testimonial_ritika.png',
  },
  {
    id: 3,
    name: 'Megha Iyer',
    service: 'NAIL BAR',
    quote:
      'My nails have never looked this elegant! So much attention to detail and great service.',
    image: '/assets/testimonial_megha.png',
  },
];

/* ─────────────────────── SCOPED CSS ─────────────────────── */
const STYLES = `
  /* ── Testimonials scoped styles ── */
  .ts-root {
    --gold: #D4A574;
    --text: #EFE6D5;
    --muted: #C9B8A8;
    --card-bg: #2E080D;
    --card-border: rgba(94, 18, 30, 0.65);
    --border-light: rgba(212, 165, 116, 0.35);
  }

  .ts-serif  { font-family: 'Playfair Display', 'Bodoni Moda', Didot, serif; }
  .ts-script { font-family: 'Alex Brush', 'Great Vibes', cursive; }
  .ts-sans   { font-family: 'Plus Jakarta Sans', sans-serif; }

  /* fade-in animation */
  .ts-fade {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity 0.75s ease, transform 0.75s ease;
  }
  .ts-fade.is-in {
    opacity: 1;
    transform: translateY(0);
  }

  /* torn paper deckle edge on card 3 bottom */
  .ts-torn-bottom {
    clip-path: polygon(
      0 0, 100% 0,
      100% calc(100% - 14px),
      97% calc(100% - 6px), 94% calc(100% - 14px),
      91% calc(100% - 4px), 88% calc(100% - 12px),
      85% calc(100% - 3px), 82% calc(100% - 13px),
      79% calc(100% - 5px), 76% calc(100% - 14px),
      73% calc(100% - 4px), 70% calc(100% - 11px),
      67% calc(100% - 2px), 64% calc(100% - 13px),
      61% calc(100% - 5px), 58% calc(100% - 14px),
      55% calc(100% - 3px), 52% calc(100% - 12px),
      49% calc(100% - 6px), 46% calc(100% - 14px),
      43% calc(100% - 4px), 40% calc(100% - 11px),
      37% calc(100% - 2px), 34% calc(100% - 13px),
      31% calc(100% - 5px), 28% calc(100% - 14px),
      25% calc(100% - 3px), 22% calc(100% - 12px),
      19% calc(100% - 6px), 16% calc(100% - 14px),
      13% calc(100% - 4px), 10% calc(100% - 11px),
      7% calc(100% - 2px), 4% calc(100% - 13px),
      0 calc(100% - 5px)
    );
  }

  /* jagged brush/torn edge overlay on the LEFT of card 1 photo */
  .ts-torn-left {
    clip-path: polygon(
      0 0, 100% 0,
      calc(100% - 15px) 3%, calc(100% - 3px) 6%, calc(100% - 14px) 9%,
      calc(100% - 2px) 12%, calc(100% - 13px) 15%, calc(100% - 6px) 18%,
      calc(100% - 15px) 21%, calc(100% - 4px) 24%, calc(100% - 12px) 27%,
      calc(100% - 2px) 30%, calc(100% - 14px) 33%, calc(100% - 5px) 36%,
      calc(100% - 15px) 39%, calc(100% - 3px) 42%, calc(100% - 13px) 45%,
      calc(100% - 6px) 48%, calc(100% - 15px) 51%, calc(100% - 4px) 54%,
      calc(100% - 12px) 57%, calc(100% - 2px) 60%, calc(100% - 14px) 63%,
      calc(100% - 5px) 66%, calc(100% - 15px) 69%, calc(100% - 3px) 72%,
      calc(100% - 13px) 75%, calc(100% - 6px) 78%, calc(100% - 15px) 81%,
      calc(100% - 4px) 84%, calc(100% - 12px) 87%, calc(100% - 2px) 90%,
      calc(100% - 14px) 93%, calc(100% - 5px) 96%, calc(100% - 15px) 99%,
      100% 100%, 0 100%
    );
  }

  /* star-ribbon notch */
  .ts-ribbon-notch {
    clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 84%, 0 100%);
  }

  .ts-card-frame {
    border: 1px solid var(--card-border);
    box-shadow: inset 0 0 0 3px rgba(94,18,30,0.3), 0 12px 36px rgba(0,0,0,0.4);
  }

  .ts-lift {
    transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), filter 0.35s ease;
  }
  .ts-lift:hover {
    transform: translateY(-4px);
    filter: drop-shadow(0 18px 30px rgba(0,0,0,0.45));
  }

  @keyframes ts-swap-fade {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ts-swap {
    animation: ts-swap-fade 0.45s ease both;
  }
`;

const resolveImg = (src, fallback) => {
  if (!src) return fallback;
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) return src;
  if (src.startsWith('./')) return src.replace('./', '/');
  if (!src.startsWith('/')) return `/${src}`;
  return src;
};

/* ─────────────────── ICON COMPONENTS ─────────────────── */
const Sparkle = ({ className = '', size = 14, color = '#D4A574', style = {} }) => (
  <svg className={className} style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" fill={color} />
  </svg>
);

const QuoteMark = ({ size = 32, color = '#D4A574', opacity = 0.85, className = '' }) => (
  <svg className={className} width={size} height={size * 0.75} viewBox="0 0 40 30" fill="none" style={{ opacity }}>
    <path d="M12 26C9.2 26 7 25 5.2 23C3.4 21 2.5 18.5 2.5 15.5C2.5 12 3.6 9 5.8 6.5C8 4 11 2.3 14.8 1.5L15.6 4.2C12.8 4.8 10.7 6 9.2 7.8C7.7 9.6 7 11.5 7 13.6C7 14.5 7.2 15.2 7.6 15.7C7.8 16 8.2 16.1 8.6 16.1C9.4 15.2 10.6 14.7 12 14.7C13.4 14.7 14.5 15.2 15.4 16.1C16.3 17 16.7 18.2 16.7 19.6C16.7 21 16.2 22.2 15.2 23.2C14.2 24.2 13 26 12 26ZM32 26C29.2 26 27 25 25.2 23C23.4 21 22.5 18.5 22.5 15.5C22.5 12 23.6 9 25.8 6.5C28 4 31 2.3 34.8 1.5L35.6 4.2C32.8 4.8 30.7 6 29.2 7.8C27.7 9.6 27 11.5 27 13.6C27 14.5 27.2 15.2 27.6 15.7C27.8 16 28.2 16.1 28.6 16.1C29.4 15.2 30.6 14.7 32 14.7C33.4 14.7 34.5 15.2 35.4 16.1C36.3 17 36.7 18.2 36.7 19.6C36.7 21 36.2 22.2 35.2 23.2C34.2 24.2 33 26 32 26Z" fill={color} />
  </svg>
);

const HappyClientsBadge = ({ isVisible, className = '' }) => (
  <div
    className={`ts-fade ${isVisible ? 'is-in' : ''} ${className}`}
    style={{ transitionDelay: '250ms' }}
  >
    <div
      className="ts-badge-float relative flex h-[130px] w-[130px] sm:h-[150px] sm:w-[150px] md:h-[160px] md:w-[160px] flex-col items-center justify-center rounded-full text-center"
      style={{ border: '1px solid rgba(212,165,116,0.32)', background: 'rgba(30,4,8,0.3)' }}
    >
      <Sparkle size={16} />
      <span className="ts-sans mt-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.22em] text-[#EFE6D5]">
        HAPPY CLIENTS
      </span>
      <span className="ts-sans mt-1 sm:mt-1.5 text-[11px] sm:text-[12px] leading-tight text-[#C9B8A8]/65">
        Our biggest<br />achievement
      </span>
    </div>
  </div>
);

const RatingArch = () => (
  <div className="relative w-[190px] sm:w-[220px]">
    <div
      className="relative flex flex-col items-center rounded-t-[100px] sm:rounded-t-[110px] rounded-b-none px-4 sm:px-5 pb-6 sm:pb-7 pt-8 sm:pt-10"
      style={{ border: '1px solid rgba(212,165,116,0.32)', background: 'rgba(30,4,8,0.25)' }}
    >
      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2" style={{ background: '#2E0A0C', padding: '0 4px' }}>
        <Sparkle size={13} />
      </div>

      <div className="flex items-baseline gap-1">
        <span className="ts-serif text-[2.8rem] sm:text-[3.6rem] font-normal leading-none text-[#EFE6D5]">
          4.9
        </span>
        <span className="ts-sans text-xs sm:text-sm text-[#C9B8A8]/55 font-medium">/ 5</span>
      </div>

      <div className="mt-2.5 sm:mt-3 flex gap-[3px]">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} fill="#D4A574" stroke="#D4A574" strokeWidth={0} />
        ))}
      </div>

      <p className="ts-sans mt-3 sm:mt-4 text-center text-[7.5px] sm:text-[8px] font-semibold uppercase tracking-[0.22em] text-[#C9B8A8]/50">
        Based on 1,200+ Reviews
      </p>
    </div>
  </div>
);

/* ─────────────── CARD 1: ANANYA (Torn-edge, slight tilt) ─────────────── */
const Card1Ananya = ({ t, isVisible, showEditControls, onUpdate, onRequestImageUpload, cardIndex = 0 }) => (
  <figure
    className={`ts-fade ${isVisible ? 'is-in' : ''} flex flex-col h-full`}
    style={{ transitionDelay: '280ms' }}
  >
   <div className="ts-lift flex flex-1 flex-col">
    <div className="ts-card-frame relative overflow-hidden bg-[#33080E]">
      <div
        className="ts-torn-left pointer-events-none absolute inset-y-0 left-0 z-20 w-5 sm:w-7"
        style={{ background: '#5E121E' }}
      />
      <div
        className="ts-torn-left pointer-events-none absolute inset-y-0 left-0 z-20 w-4 sm:w-6"
        style={{ background: '#2E080D' }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 h-5"
        style={{
          background: 'linear-gradient(to top, rgba(46,10,12,1) 0%, rgba(46,10,12,0.6) 50%, transparent 100%)',
        }}
      />
      <img
        src={t.image}
        alt={t.name}
        loading="lazy"
        className="h-[150px] w-full object-cover object-[42%_18%] sm:h-[170px] xl:h-[200px]"
      />
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{ background: 'linear-gradient(to top, rgba(46,10,12,0.6) 0%, transparent 45%)' }}
      />

      {showEditControls && (
        <button
          type="button"
          onClick={() =>
            onRequestImageUpload?.({
              title: `Change Photo for ${t.name}`,
              folderName: 'testimonials',
              onComplete: (url) => onUpdate?.(cardIndex, 'image', url),
            })
          }
          className="absolute inset-0 m-auto z-30 w-fit h-fit px-3 py-1.5 rounded-full bg-[#4A121B]/95 hover:bg-[#611B26] text-[#F6EFE5] text-[11px] font-semibold border border-[#D4A574] shadow-xl flex items-center gap-1.5 backdrop-blur-sm cursor-pointer"
        >
          <Camera size={13} className="text-[#D4A574]" />
          <span>Change Photo</span>
        </button>
      )}
    </div>

    {/* text panel */}
    <div
      className="flex flex-1 flex-col px-4 pb-5 pt-4 sm:px-6 sm:pb-7 sm:pt-5 xl:px-7 xl:pb-8 xl:pt-6"
      style={{ background: '#2A080B', borderLeft: '1px solid rgba(94,18,30,0.65)', borderRight: '1px solid rgba(94,18,30,0.65)', borderBottom: '1px solid rgba(94,18,30,0.65)' }}
    >
      <QuoteMark size={26} color="#D4A574" opacity={0.8} className="mb-2" />
      {showEditControls ? (
        <textarea
          value={t.quote}
          onChange={(e) => onUpdate?.(cardIndex, 'quote', e.target.value)}
          rows={3}
          className="ts-serif flex-1 text-[12px] sm:text-[13px] italic leading-[1.65] text-[#EFE6D5] bg-white/10 border border-[#D4A574]/30 rounded p-1 w-full focus:outline-none"
        />
      ) : (
        <blockquote className="ts-serif flex-1 text-[12px] sm:text-[13px] italic leading-[1.65] text-[#EFE6D5]/90">
          {t.quote}
        </blockquote>
      )}

      <div className="mt-3 sm:mt-4 mb-2.5 sm:mb-3 h-px w-10 bg-[#D4A574]/30" />
      
      {showEditControls ? (
        <input
          type="text"
          value={t.name}
          onChange={(e) => onUpdate?.(cardIndex, 'name', e.target.value)}
          className="ts-script text-[18px] sm:text-[20px] text-[#D4A574] bg-white/10 border-b border-[#D4A574] px-1 focus:outline-none w-full"
        />
      ) : (
        <p className="ts-script text-[20px] sm:text-[22px] leading-none text-[#D4A574]">{t.name}</p>
      )}

      {showEditControls ? (
        <input
          type="text"
          value={t.service}
          onChange={(e) => onUpdate?.(cardIndex, 'service', e.target.value)}
          className="ts-sans mt-1 text-[8px] sm:text-[8.5px] font-semibold uppercase tracking-[0.2em] text-[#C9B8A8] bg-white/10 border-b border-[#C9B8A8]/40 px-1 focus:outline-none w-full"
        />
      ) : (
        <p className="ts-sans mt-1 text-[8px] sm:text-[8.5px] font-semibold uppercase tracking-[0.2em] text-[#C9B8A8]/50">{t.service}</p>
      )}
    </div>
   </div>
  </figure>
);

/* ─────────────── CARD 2: RITIKA (Arch-top dome, taller) ─────────────── */
const Card2Ritika = ({ t, isVisible, showEditControls, onUpdate, onRequestImageUpload, cardIndex = 1 }) => (
  <figure
    className={`ts-fade ${isVisible ? 'is-in' : ''} relative flex flex-col h-full`}
    style={{ transitionDelay: '400ms' }}
  >
   <div className="ts-lift relative flex flex-1 flex-col">
    {/* Circular quote badge floating above the arch */}
    <div
      className="absolute -top-4 sm:-top-5 left-1/2 z-30 flex h-10 w-10 sm:h-[52px] sm:w-[52px] -translate-x-1/2 items-center justify-center rounded-full shadow-lg"
      style={{ background: 'linear-gradient(135deg, #6B1A28 0%, #4A0F18 100%)', border: '2px solid rgba(140,32,48,0.6)' }}
    >
      <QuoteMark size={18} color="#EFE6D5" opacity={0.9} />
    </div>

    {/* Arch-top photo container */}
    <div
      className="ts-card-frame relative overflow-hidden bg-[#33080E]"
      style={{ borderRadius: '120px 120px 0 0' }}
    >
      <img
        src={t.image}
        alt={t.name}
        loading="lazy"
        className="h-[180px] w-full object-cover object-[50%_15%] sm:h-[220px] lg:h-[240px] xl:h-[270px]"
        style={{ borderRadius: '120px 120px 0 0' }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          borderRadius: '120px 120px 0 0',
          background: 'linear-gradient(to top, rgba(42,8,11,0.75) 0%, rgba(42,8,11,0.15) 40%, transparent 65%)',
        }}
      />

      {showEditControls && (
        <button
          type="button"
          onClick={() =>
            onRequestImageUpload?.({
              title: `Change Photo for ${t.name}`,
              folderName: 'testimonials',
              onComplete: (url) => onUpdate?.(cardIndex, 'image', url),
            })
          }
          className="absolute inset-0 m-auto z-30 w-fit h-fit px-3 py-1.5 rounded-full bg-[#4A121B]/95 hover:bg-[#611B26] text-[#F6EFE5] text-[11px] font-semibold border border-[#D4A574] shadow-xl flex items-center gap-1.5 backdrop-blur-sm cursor-pointer"
        >
          <Camera size={13} className="text-[#D4A574]" />
          <span>Change Photo</span>
        </button>
      )}
    </div>

    {/* text panel */}
    <div
      className="relative flex flex-1 flex-col overflow-hidden px-4 pb-5 pt-4 sm:px-6 sm:pb-7 sm:pt-6 xl:px-7 xl:pb-8 xl:pt-7"
      style={{ background: '#2A080B', borderLeft: '1px solid rgba(94,18,30,0.65)', borderRight: '1px solid rgba(94,18,30,0.65)', borderBottom: '1px solid rgba(94,18,30,0.65)' }}
    >
      <div className="pointer-events-none absolute bottom-2 right-2 opacity-[0.06]">
        <QuoteMark size={80} color="#D4A574" opacity={1} />
      </div>

      <QuoteMark size={26} color="#D4A574" opacity={0.8} className="mb-2" />
      {showEditControls ? (
        <textarea
          value={t.quote}
          onChange={(e) => onUpdate?.(cardIndex, 'quote', e.target.value)}
          rows={3}
          className="ts-serif relative z-10 flex-1 text-[12px] sm:text-[13px] italic leading-[1.65] text-[#EFE6D5] bg-white/10 border border-[#D4A574]/30 rounded p-1 w-full focus:outline-none"
        />
      ) : (
        <blockquote className="ts-serif relative z-10 flex-1 text-[12px] sm:text-[13px] italic leading-[1.65] text-[#EFE6D5]/90">
          {t.quote}
        </blockquote>
      )}

      <div className="mt-3 sm:mt-4 mb-2.5 sm:mb-3 h-px w-10 bg-[#D4A574]/30" />
      
      {showEditControls ? (
        <input
          type="text"
          value={t.name}
          onChange={(e) => onUpdate?.(cardIndex, 'name', e.target.value)}
          className="ts-script text-[18px] sm:text-[20px] text-[#D4A574] bg-white/10 border-b border-[#D4A574] px-1 focus:outline-none w-full"
        />
      ) : (
        <p className="ts-script text-[20px] sm:text-[22px] leading-none text-[#D4A574]">{t.name}</p>
      )}

      {showEditControls ? (
        <input
          type="text"
          value={t.service}
          onChange={(e) => onUpdate?.(cardIndex, 'service', e.target.value)}
          className="ts-sans mt-1 text-[8px] sm:text-[8.5px] font-semibold uppercase tracking-[0.2em] text-[#C9B8A8] bg-white/10 border-b border-[#C9B8A8]/40 px-1 focus:outline-none w-full"
        />
      ) : (
        <p className="ts-sans mt-1 text-[8px] sm:text-[8.5px] font-semibold uppercase tracking-[0.2em] text-[#C9B8A8]/50">{t.service}</p>
      )}
    </div>
   </div>
  </figure>
);

/* ─────────────── CARD 3: MEGHA (Star-ribbon, torn bottom) ─────────────── */
const Card3Megha = ({ t, isVisible, showEditControls, onUpdate, onRequestImageUpload, cardIndex = 2 }) => (
  <figure
    className={`ts-fade ${isVisible ? 'is-in' : ''} flex flex-col h-full`}
    style={{ transitionDelay: '520ms' }}
  >
   <div className="ts-lift flex flex-1 flex-col">
    <div className="ts-card-frame relative overflow-visible bg-[#33080E]">
      <div
        className="ts-ribbon-notch absolute right-3 top-0 z-30 flex w-[22px] sm:w-[26px] flex-col items-center gap-[3px] py-2 pb-3.5 sm:py-2.5 sm:pb-4 shadow-md"
        style={{ background: 'linear-gradient(180deg, #6B1A28 0%, #4A0F18 100%)' }}
      >
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={8} fill="#D4A574" stroke="none" />
        ))}
      </div>

      <div className="overflow-hidden">
        <img
          src={t.image}
          alt={t.name}
          loading="lazy"
          className="h-[150px] w-full object-cover object-[55%_20%] sm:h-[170px] xl:h-[200px]"
        />
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{ background: 'linear-gradient(to top, rgba(46,10,12,0.6) 0%, transparent 45%)' }}
      />

      {showEditControls && (
        <button
          type="button"
          onClick={() =>
            onRequestImageUpload?.({
              title: `Change Photo for ${t.name}`,
              folderName: 'testimonials',
              onComplete: (url) => onUpdate?.(cardIndex, 'image', url),
            })
          }
          className="absolute inset-0 m-auto z-30 w-fit h-fit px-3 py-1.5 rounded-full bg-[#4A121B]/95 hover:bg-[#611B26] text-[#F6EFE5] text-[11px] font-semibold border border-[#D4A574] shadow-xl flex items-center gap-1.5 backdrop-blur-sm cursor-pointer"
        >
          <Camera size={13} className="text-[#D4A574]" />
          <span>Change Photo</span>
        </button>
      )}
    </div>

    {/* text panel with torn paper bottom */}
    <div
      className="ts-torn-bottom flex flex-1 flex-col px-4 pb-7 pt-4 sm:px-6 sm:pb-9 sm:pt-5 xl:px-7 xl:pb-10 xl:pt-6"
      style={{ background: '#2A080B', borderLeft: '1px solid rgba(94,18,30,0.65)', borderRight: '1px solid rgba(94,18,30,0.65)' }}
    >
      <QuoteMark size={26} color="#D4A574" opacity={0.8} className="mb-2" />
      {showEditControls ? (
        <textarea
          value={t.quote}
          onChange={(e) => onUpdate?.(cardIndex, 'quote', e.target.value)}
          rows={3}
          className="ts-serif flex-1 text-[12px] sm:text-[13px] italic leading-[1.65] text-[#EFE6D5] bg-white/10 border border-[#D4A574]/30 rounded p-1 w-full focus:outline-none"
        />
      ) : (
        <blockquote className="ts-serif flex-1 text-[12px] sm:text-[13px] italic leading-[1.65] text-[#EFE6D5]/90">
          {t.quote}
        </blockquote>
      )}

      <div className="mt-3 sm:mt-4 mb-2.5 sm:mb-3 h-px w-10 bg-[#D4A574]/30" />
      
      {showEditControls ? (
        <input
          type="text"
          value={t.name}
          onChange={(e) => onUpdate?.(cardIndex, 'name', e.target.value)}
          className="ts-script text-[18px] sm:text-[20px] text-[#D4A574] bg-white/10 border-b border-[#D4A574] px-1 focus:outline-none w-full"
        />
      ) : (
        <p className="ts-script text-[20px] sm:text-[22px] leading-none text-[#D4A574]">{t.name}</p>
      )}

      {showEditControls ? (
        <input
          type="text"
          value={t.service}
          onChange={(e) => onUpdate?.(cardIndex, 'service', e.target.value)}
          className="ts-sans mt-1 text-[8px] sm:text-[8.5px] font-semibold uppercase tracking-[0.2em] text-[#C9B8A8] bg-white/10 border-b border-[#C9B8A8]/40 px-1 focus:outline-none w-full"
        />
      ) : (
        <p className="ts-sans mt-1 text-[8px] sm:text-[8.5px] font-semibold uppercase tracking-[0.2em] text-[#C9B8A8]/50">{t.service}</p>
      )}
    </div>
   </div>
  </figure>
);

/* ══════════════════════ MAIN SECTION ══════════════════════ */
const TestimonialsSection = ({
  isEdit = false,
  isPreviewMode = false,
  onUpdateField,
  onRequestImageUpload,
}) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  const siteData = useSiteData();

  const testimonialsData = siteData?.testimonials || {};
  const theme = siteData?.theme || {};
  const primaryColor = theme.primary || '#4A121B';
  const goldColor = theme.gold || '#D4A574';
  const darkBg = theme.darkBg || '#1A0A0E';
  const rawItems = testimonialsData.items?.length > 0 ? testimonialsData.items : FALLBACK_TESTIMONIALS;

  const testimonials = rawItems.map((item, idx) => ({
    id: item.id || idx + 1,
    name: item.name || FALLBACK_TESTIMONIALS[idx]?.name || 'Valued Guest',
    service: item.service || item.role || FALLBACK_TESTIMONIALS[idx]?.service || 'BEAUTY RITUAL',
    quote: item.quote || FALLBACK_TESTIMONIALS[idx]?.quote || 'An extraordinary sanctuary of beauty and bespoke luxury.',
    image: resolveImg(item.image, FALLBACK_TESTIMONIALS[idx]?.image || '/assets/testimonial_ananya.png'),
  }));

  const scriptLabel = testimonialsData.scriptLabel || 'Client love';
  const sectionTitle = testimonialsData.sectionTitle || 'Testimonials';
  const subtitle = testimonialsData.subtitle || 'Real stories. Real confidence.';
  const sectionDesc = testimonialsData.sectionDescription || "We don't just talk beauty, our clients feel it.";

  const showEditControls = isEdit && !isPreviewMode;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setIsVisible(true),
      { threshold: 0.06 }
    );
    observer.observe(el);

    const safetyTimer = setTimeout(() => setIsVisible(true), 1200);

    return () => {
      observer.disconnect();
      clearTimeout(safetyTimer);
    };
  }, []);

  /* ── GSAP: scroll parallax + ambient motion ── */
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.set('.ts-love', {
        willChange: 'transform',
        force3D: true,
      });
      gsap
        .timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: SCRUB,
          },
        })
        .to('.ts-love', { yPercent: -35 }, 0);

      const ambient = gsap.timeline({ paused: true });
      gsap.utils.toArray('.ts-deco').forEach((el, i) => {
        ambient.to(
          el,
          {
            opacity: 0.1,
            scale: 0.55,
            transformOrigin: 'center center',
            duration: 1.4 + i * 0.3,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          },
          i * 0.25
        );
      });
      ambient.to(
        '.ts-badge-float',
        { y: -10, duration: 2.6, repeat: -1, yoyo: true, ease: 'sine.inOut' },
        0
      );

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => (self.isActive ? ambient.play() : ambient.pause()),
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const goNext = () => setActiveSlide((p) => (p + 1) % testimonials.length);
  const goPrev = () => setActiveSlide((p) => (p - 1 + testimonials.length) % testimonials.length);

  const rotated = testimonials.map(
    (_, i) => testimonials[(i + activeSlide) % testimonials.length]
  );

  const handleUpdateCard = (idx, field, val) => {
    const list = [...(testimonialsData.items || FALLBACK_TESTIMONIALS)];
    if (!list[idx]) {
      list[idx] = { ...FALLBACK_TESTIMONIALS[idx] };
    }
    list[idx] = { ...list[idx], [field]: val };
    onUpdateField?.('testimonials.items', list);
  };

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className="ts-root relative w-full overflow-hidden pt-12 sm:pt-16 md:pt-20 pb-12 sm:pb-16 md:pb-20"
      style={{
        background: `radial-gradient(circle at 20% 20%, ${primaryColor} 0%, ${darkBg} 55%, #050505 100%)`,
      }}
    >
      <style>{STYLES}</style>

      {/* ── grain texture ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* ── soft vignette ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 25% 45%, rgba(80,18,28,0.28) 0%, transparent 70%), radial-gradient(ellipse 55% 45% at 78% 55%, rgba(60,12,22,0.2) 0%, transparent 65%)',
        }}
      />

      {/* ── sparkles ── */}
      <Sparkle className="ts-deco absolute left-[4%] top-[7%] opacity-40" size={12} />
      <Sparkle className="ts-deco absolute left-[22%] top-[14%] opacity-25" size={9} />
      <Sparkle className="ts-deco absolute right-[18%] top-[5%] opacity-50" size={14} />
      <Sparkle className="ts-deco absolute bottom-[22%] left-[10%] opacity-30" size={10} />
      <Sparkle className="ts-deco absolute bottom-[18%] right-[6%] opacity-35" size={12} />

      {/* ── "love" script watermark ── */}
      <p
        className="ts-love ts-script pointer-events-none absolute bottom-[6%] z-0 select-none text-[#8C2030]"
        style={{
          fontSize: 'clamp(4.5rem, 12vw, 13rem)',
          opacity: 0.18,
          left: '52%',
          transform: 'translateX(-40%)',
          whiteSpace: 'nowrap',
          lineHeight: 0.85,
        }}
      >
        love
      </p>

      {/* ══════════ CONTENT WRAPPER ══════════ */}
      <div className="relative z-10 mx-auto max-w-[1760px] px-4 sm:px-8 md:px-10 lg:px-14 xl:px-20">

        {/* ──── TOP ROW: Title left + Happy Clients badge right ──── */}
        <div className="flex flex-wrap items-end justify-between gap-6 pb-8 md:pb-12">
          {/* Left header */}
          <div className={`ts-fade ${isVisible ? 'is-in' : ''} max-w-md`}>
            <div className="flex items-center gap-2.5">
              {showEditControls ? (
                <input
                  type="text"
                  value={scriptLabel}
                  onChange={(e) => onUpdateField?.('testimonials.scriptLabel', e.target.value)}
                  className="ts-script text-[24px] sm:text-[30px] text-[#D4A574] bg-white/10 border-b border-[#D4A574] px-1 focus:outline-none"
                />
              ) : (
                <span className="ts-script text-[24px] sm:text-[30px] text-[#D4A574]">{scriptLabel}</span>
              )}
              <div className="h-px w-10 sm:w-14 bg-[#D4A574]/30" />
              <Sparkle size={12} />
            </div>

            {showEditControls ? (
              <input
                type="text"
                value={sectionTitle}
                onChange={(e) => onUpdateField?.('testimonials.sectionTitle', e.target.value)}
                className="ts-serif mt-2 sm:mt-3 uppercase text-[#EFE6D5] bg-white/10 border-b border-[#EFE6D5] px-1 focus:outline-none w-full"
                style={{ fontWeight: 400, fontSize: 'clamp(2rem, 4.5vw, 4rem)', lineHeight: 0.95, letterSpacing: '0.02em' }}
              />
            ) : (
              <h2
                className="ts-serif mt-2 sm:mt-3 uppercase text-[#EFE6D5]"
                style={{ fontWeight: 400, fontSize: 'clamp(2.4rem, 5.5vw, 5.5rem)', lineHeight: 0.95, letterSpacing: '0.02em' }}
              >
                {sectionTitle}
              </h2>
            )}

            {showEditControls ? (
              <input
                type="text"
                value={subtitle}
                onChange={(e) => onUpdateField?.('testimonials.subtitle', e.target.value)}
                className="ts-script mt-2 sm:mt-4 text-[20px] sm:text-[26px] lg:text-[28px] text-[#D4A574] bg-white/10 border-b border-[#D4A574]/40 px-1 focus:outline-none w-full"
              />
            ) : (
              <p className="ts-script mt-2 sm:mt-4 text-[20px] sm:text-[26px] lg:text-[28px] text-[#D4A574]">
                {subtitle}
              </p>
            )}

            {showEditControls ? (
              <textarea
                value={sectionDesc}
                onChange={(e) => onUpdateField?.('testimonials.sectionDescription', e.target.value)}
                rows={2}
                className="ts-sans mt-3 sm:mt-5 max-w-[280px] text-[12px] sm:text-[13px] leading-relaxed text-[#C9B8A8] bg-white/10 border border-[#C9B8A8]/30 rounded p-1 w-full focus:outline-none"
              />
            ) : (
              <p className="ts-sans mt-3 sm:mt-5 max-w-[280px] text-[12px] sm:text-[13px] leading-relaxed text-[#C9B8A8]/70">
                {sectionDesc}
              </p>
            )}
          </div>

          {/* Happy Clients circular badge */}
          <HappyClientsBadge isVisible={isVisible} className="hidden sm:flex" />
        </div>

        {/* ──── MAIN ROW: Rating+Nav (left) + 3 Cards (right) ──── */}
        <div className="hidden lg:grid lg:grid-cols-[240px_1fr] lg:gap-x-8 xl:grid-cols-[280px_1fr] xl:gap-x-12 items-stretch">
          
          {/* Left column: Rating Arch + Nav buttons */}
          <div className={`ts-fade ${isVisible ? 'is-in' : ''} flex flex-col justify-between`} style={{ transitionDelay: '180ms' }}>
            <RatingArch />
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={goPrev}
                aria-label="Previous testimonial"
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#D4A574] transition-colors hover:bg-[rgba(212,165,116,0.1)] cursor-pointer active:scale-90"
                style={{ border: '1px solid rgba(212,165,116,0.35)' }}
              >
                <ChevronLeft size={18} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Next testimonial"
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#D4A574] transition-colors hover:bg-[rgba(212,165,116,0.1)] cursor-pointer active:scale-90"
                style={{ border: '1px solid rgba(212,165,116,0.35)' }}
              >
                <ChevronRight size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Right: 3 Testimonial Cards */}
          <div key={activeSlide} className="ts-swap grid grid-cols-3 items-stretch gap-4 lg:gap-6 xl:gap-8">
            <Card1Ananya
              t={rotated[0]}
              isVisible={isVisible}
              showEditControls={showEditControls}
              onUpdate={handleUpdateCard}
              onRequestImageUpload={onRequestImageUpload}
              cardIndex={(0 + activeSlide) % testimonials.length}
            />
            <Card2Ritika
              t={rotated[1]}
              isVisible={isVisible}
              showEditControls={showEditControls}
              onUpdate={handleUpdateCard}
              onRequestImageUpload={onRequestImageUpload}
              cardIndex={(1 + activeSlide) % testimonials.length}
            />
            <Card3Megha
              t={rotated[2]}
              isVisible={isVisible}
              showEditControls={showEditControls}
              onUpdate={handleUpdateCard}
              onRequestImageUpload={onRequestImageUpload}
              cardIndex={(2 + activeSlide) % testimonials.length}
            />
          </div>
        </div>

        {/* Mobile & Tablet Slider Layout */}
        <div className="lg:hidden">
          <div className={`ts-fade ${isVisible ? 'is-in' : ''} flex flex-col sm:flex-row items-center justify-between gap-6 mb-8`} style={{ transitionDelay: '160ms' }}>
            <RatingArch />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={goPrev}
                aria-label="Previous"
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#D4A574] active:scale-95 cursor-pointer"
                style={{ border: '1px solid rgba(212,165,116,0.35)' }}
              >
                <ChevronLeft size={18} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Next"
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#D4A574] active:scale-95 cursor-pointer"
                style={{ border: '1px solid rgba(212,165,116,0.35)' }}
              >
                <ChevronRight size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>
          
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            >
              {testimonials.map((t, i) => (
                <div key={t.id || i} className="w-full shrink-0 px-2 max-w-[340px] sm:max-w-md mx-auto">
                  {i === 0 && (
                    <Card1Ananya
                      t={t}
                      isVisible={isVisible}
                      showEditControls={showEditControls}
                      onUpdate={handleUpdateCard}
                      onRequestImageUpload={onRequestImageUpload}
                      cardIndex={0}
                    />
                  )}
                  {i === 1 && (
                    <Card2Ritika
                      t={t}
                      isVisible={isVisible}
                      showEditControls={showEditControls}
                      onUpdate={handleUpdateCard}
                      onRequestImageUpload={onRequestImageUpload}
                      cardIndex={1}
                    />
                  )}
                  {i === 2 && (
                    <Card3Megha
                      t={t}
                      isVisible={isVisible}
                      showEditControls={showEditControls}
                      onUpdate={handleUpdateCard}
                      onRequestImageUpload={onRequestImageUpload}
                      cardIndex={2}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-center gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveSlide(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all cursor-pointer ${i === activeSlide ? 'w-6 bg-[#D4A574]' : 'w-2 bg-[#D4A574]/30'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ──── Bottom tagline ──── */}
        <div className="relative mt-10 sm:mt-14">
          <div className="flex items-center">
            <div className="h-px flex-1 bg-[rgba(212,165,116,0.15)]" />
            <Sparkle size={10} className="mx-3 shrink-0 opacity-50" />
            <div className="h-px w-[38%] bg-[rgba(212,165,116,0.15)]" />
          </div>
          <p className="ts-sans mt-3 text-right text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.28em] text-[#C9B8A8]/45">
            Thousands of smiles. Countless stories.
          </p>
        </div>

      </div>
    </section>
  );
};

export default TestimonialsSection;
