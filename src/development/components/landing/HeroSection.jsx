import React, { useEffect, useRef } from 'react';
import { ArrowRight, Camera } from 'lucide-react';
import { gsap, prefersReducedMotion, SCRUB } from '../lib/gsapSetup';
import { useSiteData } from '../context/SiteContext';

const resolveImg = (src, fallback) => {
  if (!src) return fallback;
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) return src;
  if (src.startsWith('./')) return src.replace('./', '/');
  if (!src.startsWith('/')) return `/${src}`;
  return src;
};

const HeroSection = ({
  onOpenBooking,
  isEdit = false,
  isPreviewMode = false,
  onUpdateField,
  onRequestImageUpload,
}) => {
  const siteData = useSiteData();
  const root = useRef(null);

  const theme = siteData?.theme || {};
  const primaryColor = theme.primary || '#4A121B';
  const goldColor = theme.gold || '#D4A574';
  const accentColor = theme.accent || primaryColor;

  const heroData = siteData?.hero || {};
  const modelImgSrc = resolveImg(heroData.modelImage, '/assets/model.png');
  const strokeImgSrc = resolveImg(heroData.strokeImage, '/assets/burgundy_dress_stroke.png');
  const scriptText = heroData.scriptLabel || 'Beauty. Confidence. You.';
  const titleLine1 = heroData.titleLines?.[0] || 'TEKKZY';
  const titleLine2 = heroData.titleLines?.[1] || 'SALON.';
  const descriptionText =
    heroData.description ||
    'Enhancing your natural beauty with expert care and organic alchemy. Experience the pinnacle of luxury, confidence, and bespoke personal transformation.';
  const ctaLabel = heroData.primaryAction?.label || 'BOOK APPOINTMENT';

  const showEditControls = isEdit && !isPreviewMode;

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.hero-title-line', { yPercent: 112, duration: 1, stagger: 0.16 })
        .from('.hero-script', { opacity: 0, x: -34, duration: 0.7 }, '-=0.55')
        .from('.hero-desc', { opacity: 0, y: 22, duration: 0.6 }, '-=0.42')
        .from('.hero-cta', { opacity: 0, y: 20, scale: 0.94, duration: 0.5 }, '-=0.35')
        .from('.hero-rail', { scaleY: 0, transformOrigin: 'top center', duration: 0.9 }, '-=0.65')
        .from('.hero-bottom', { opacity: 0, y: 16, duration: 0.6 }, '-=0.45')
        .from('.hero-stroke', { opacity: 0, x: 90, duration: 1.1, ease: 'power2.out' }, 0.25)
        .from('.hero-model', { opacity: 0, x: 130, duration: 1.2, ease: 'power2.out' }, 0.4);

      gsap.matchMedia().add('(min-width: 768px)', () => {
        gsap.set(['.hero-model', '.hero-stroke', '.hero-content'], {
          willChange: 'transform',
          force3D: true,
        });

        gsap
          .timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              trigger: root.current,
              start: 'top top',
              end: 'bottom top',
              scrub: SCRUB,
            },
          })
          .to('.hero-model', { yPercent: 9 }, 0)
          .to('.hero-stroke', { yPercent: -7 }, 0)
          .to('.hero-content', { yPercent: 15, opacity: 0.3 }, 0);
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      id="home"
      className="relative w-full min-h-[calc(100dvh-60px)] sm:min-h-[calc(100vh-80px)] flex flex-col justify-between overflow-hidden px-4 sm:px-8 md:px-12 lg:px-14 pt-3 sm:pt-6 pb-6 sm:pb-10"
    >
      {/* Background Model and Stroke Artwork — VISIBLE ON BOTH MOBILE AND DESKTOP */}
      <div className="absolute inset-y-0 right-0 pointer-events-none select-none z-0 w-[90%] sm:w-[70%] md:w-[48%] lg:w-[58%] xl:w-[62%]">
        <img
          src={strokeImgSrc}
          alt=""
          className="hero-stroke absolute -right-[4%] top-[2%] h-full w-auto max-w-none object-contain opacity-70 md:opacity-95"
        />
        <img
          src={modelImgSrc}
          alt="Tekkzy Salon model portrait"
          className="hero-model absolute bottom-0 right-0 h-[72%] sm:h-[85%] md:h-full w-auto max-w-none object-contain object-right-bottom drop-shadow-sm opacity-90 md:opacity-100"
        />

        {/* Change Model Photo button in Edit Mode */}
        {showEditControls && (
          <div className="pointer-events-auto absolute bottom-4 sm:bottom-10 right-4 sm:right-10 z-30">
            <button
              type="button"
              onClick={() =>
                onRequestImageUpload?.({
                  title: 'Change Hero Model Image',
                  folderName: 'hero',
                  onComplete: (url) => onUpdateField?.('hero.modelImage', url),
                })
              }
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[#F6EFE5] text-[11px] sm:text-xs font-semibold tracking-wider uppercase border border-[#D4A574] shadow-xl backdrop-blur-md cursor-pointer transition-transform hover:scale-105"
              style={{ backgroundColor: primaryColor }}
            >
              <Camera size={14} className="text-[#D4A574]" />
              <span className="hidden xs:inline">Change Model Image</span>
            </button>
          </div>
        )}
      </div>

      <div className={`hero-content relative z-10 flex flex-col flex-1 ${showEditControls ? 'w-full max-w-full sm:max-w-[70%]' : 'max-w-[85%] xs:max-w-[78%] sm:max-w-[70%]'} md:max-w-[55%] lg:max-w-[58%] xl:max-w-[65%] 2xl:max-w-[900px] pt-1 sm:pt-4 lg:pt-6`}>
        
        {/* Main Title */}
        <h1
          className="uppercase select-none"
          style={{
            fontFamily: "'Playfair Display', Didot, serif",
            fontWeight: 500,
            fontSize: 'clamp(2.6rem, 11.5vw, 12.5rem)',
            lineHeight: 0.96,
            letterSpacing: '0.005em',
            color: primaryColor,
          }}
        >
          <span className="block overflow-hidden">
            {showEditControls ? (
              <input
                type="text"
                value={titleLine1}
                onChange={(e) => {
                  const lines = [e.target.value, titleLine2];
                  onUpdateField?.('hero.titleLines', lines);
                }}
                className="hero-title-line block bg-white/70 border-b focus:outline-none w-full px-1"
                style={{ color: primaryColor, borderColor: primaryColor }}
              />
            ) : (
              <span className="hero-title-line block">{titleLine1}</span>
            )}
          </span>
          <span className="block overflow-hidden">
            {showEditControls ? (
              <input
                type="text"
                value={titleLine2}
                onChange={(e) => {
                  const lines = [titleLine1, e.target.value];
                  onUpdateField?.('hero.titleLines', lines);
                }}
                className="hero-title-line block bg-white/70 border-b focus:outline-none w-full px-1"
                style={{ color: primaryColor, borderColor: primaryColor }}
              />
            ) : (
              <span className="hero-title-line block">{titleLine2}</span>
            )}
          </span>
        </h1>

        <div className="mt-4 sm:mt-7 flex flex-1 gap-3 sm:gap-9">
          <div className="hidden sm:flex flex-col items-center w-8 pt-2 shrink-0">
            <span
              className="text-base sm:text-lg font-semibold tracking-wide"
              style={{ color: primaryColor }}
            >
              01
            </span>
            <span
              className="hero-rail mt-3 flex-1 w-px"
              style={{ backgroundColor: `${primaryColor}66` }}
            />
          </div>

          <div className="flex flex-col items-start w-full">
            {showEditControls ? (
              <input
                type="text"
                value={scriptText}
                onChange={(e) => onUpdateField?.('hero.scriptLabel', e.target.value)}
                className="hero-script font-script text-2xl xs:text-3xl sm:text-4xl md:text-4xl lg:text-[52px] leading-tight tracking-wide bg-white/70 border-b px-1 focus:outline-none w-full mb-1"
                style={{
                  fontFamily: "'Alex Brush', 'Great Vibes', cursive",
                  color: accentColor,
                  borderColor: accentColor,
                }}
              />
            ) : (
              <p
                className="hero-script font-script text-2xl xs:text-3xl sm:text-4xl md:text-4xl lg:text-[52px] leading-tight tracking-wide select-none"
                style={{
                  fontFamily: "'Alex Brush', 'Great Vibes', cursive",
                  color: accentColor,
                }}
              >
                {scriptText}
              </p>
            )}

            {showEditControls ? (
              <textarea
                value={descriptionText}
                onChange={(e) => onUpdateField?.('hero.description', e.target.value)}
                rows={3}
                className="hero-desc mt-3 sm:mt-6 text-[#2B2422] text-xs xs:text-sm sm:text-base leading-relaxed bg-white/70 border border-[#2B2422]/30 rounded p-2 focus:outline-none w-full max-w-lg"
              />
            ) : (
              <p className="hero-desc mt-3 sm:mt-6 text-[#2B2422] text-xs xs:text-sm sm:text-base md:text-lg font-medium leading-relaxed max-w-sm sm:max-w-md md:max-w-none">
                {descriptionText}
              </p>
            )}

            <button
              onClick={onOpenBooking}
              style={{ backgroundColor: primaryColor }}
              className="hero-cta group mt-5 sm:mt-8 inline-flex items-center gap-2.5 sm:gap-4 text-[#F6EFE5] text-[11px] sm:text-sm md:text-[15px] font-semibold tracking-[0.12em] sm:tracking-[0.18em] uppercase px-5 sm:px-8 py-3 sm:py-4 rounded-md shadow-md hover:opacity-90 hover:shadow-xl transition-all duration-300 active:scale-95 cursor-pointer"
            >
              <span>{ctaLabel}</span>
              <ArrowRight size={16} className="transform group-hover:translate-x-1.5 transition-transform duration-300 sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        </div>

        <div className="hero-bottom mt-6 sm:mt-9 flex items-center gap-3 sm:gap-9">
          <span
            className="hidden sm:block w-8 text-center text-base sm:text-lg font-semibold tracking-wide shrink-0"
            style={{ color: primaryColor }}
          >
            04
          </span>
          <div className="flex items-center gap-2 sm:gap-6 text-[10px] xs:text-xs sm:text-sm md:text-[15px] font-semibold tracking-[0.12em] sm:tracking-[0.22em] text-[#2B2422] uppercase flex-wrap">
            <a href="#services" className="hover:opacity-75 transition-opacity cursor-pointer">HAIR</a>
            <span>•</span>
            <a href="#services" className="hover:opacity-75 transition-opacity cursor-pointer">SKIN</a>
            <span>•</span>
            <a href="#services" className="hover:opacity-75 transition-opacity cursor-pointer">MAKEUP</a>
            <span>•</span>
            <a href="#services" className="hover:opacity-75 transition-opacity cursor-pointer">NAILS</a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
