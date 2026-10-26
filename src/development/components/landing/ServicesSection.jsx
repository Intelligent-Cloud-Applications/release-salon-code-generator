import React, { useEffect, useRef } from 'react';
import { ArrowRight, Camera } from 'lucide-react';
import { gsap, prefersReducedMotion, SCRUB } from '../lib/gsapSetup';
import { useSiteData } from '../context/SiteContext';

const CARD_CLIP_RIGHT = 'polygon(0 8.5%, 100% 0, 100% 91.5%, 0 100%)';
const CARD_CLIP_LEFT = 'polygon(0 0, 100% 8.5%, 100% 100%, 0 91.5%)';

const FALLBACK_SERVICES = [
  {
    number: '01',
    title: 'Architectural Cut & Balayage Melt',
    description:
      'Bespoke hand-painted balayage with golden honey tones and smooth, voluminous couture waves tailored to your unique beauty signature.',
    image: '/assets/service_hair_care.png',
  },
  {
    number: '02',
    title: '24K Gold Glow Radiance Facial',
    description:
      'Deep cellular hydration and nano-peptide collagen restoration therapy designed to illuminate dewy, camera-ready glass skin.',
    image: '/assets/service_skin_care.png',
  },
  {
    number: '03',
    title: 'Royal Kundan & Bridal Artistry',
    description:
      'High-definition velvet bridal finish with custom contoured eyes, shimmering Kundan embellishments, and rich crimson lipstick.',
    image: '/assets/service_makeup.png',
  },
  {
    number: '04',
    title: '24K Gold Leaf Minimalist Manicure',
    description:
      'Precision manicure on nude blush base accented with hand-placed 24k gold leaf foil and organic oil cuticle nourishment.',
    image: '/assets/service_nail_bar.png',
  },
];

const BotanicalLeaf = ({ className, style, color = '#63202B' }) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 120 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M60 155 C60 130, 55 100, 60 70 C65 40, 58 20, 60 5" stroke={color} strokeWidth="1.2" fill="none" />
    <path d="M60 120 C40 115, 20 105, 15 85 C12 70, 25 60, 40 65 C50 68, 58 85, 60 100" stroke={color} strokeWidth="0.8" fill={color} fillOpacity="0.10" />
    <path d="M58 90 C38 82, 22 65, 25 45 C27 30, 40 28, 48 38 C54 45, 57 65, 58 80" stroke={color} strokeWidth="0.8" fill={color} fillOpacity="0.08" />
    <path d="M59 60 C45 50, 35 35, 40 20 C43 12, 52 12, 55 22 C57 30, 58 45, 59 55" stroke={color} strokeWidth="0.8" fill={color} fillOpacity="0.06" />
    <path d="M60 110 C78 108, 95 95, 100 78 C103 65, 90 56, 78 62 C70 66, 63 82, 60 98" stroke={color} strokeWidth="0.8" fill={color} fillOpacity="0.10" />
    <path d="M61 80 C76 72, 90 58, 88 40 C87 28, 75 25, 68 35 C63 42, 62 60, 61 72" stroke={color} strokeWidth="0.8" fill={color} fillOpacity="0.08" />
    <path d="M60 50 C72 42, 82 28, 78 15 C76 8, 67 8, 64 18 C62 25, 60 38, 60 46" stroke={color} strokeWidth="0.8" fill={color} fillOpacity="0.06" />
    <path d="M60 120 C48 110, 30 95, 20 82" stroke={color} strokeWidth="0.4" fill="none" opacity="0.5" />
    <path d="M60 110 C72 100, 88 88, 95 78" stroke={color} strokeWidth="0.4" fill="none" opacity="0.5" />
    <path d="M58 90 C46 78, 32 60, 28 45" stroke={color} strokeWidth="0.4" fill="none" opacity="0.5" />
    <path d="M61 80 C70 70, 82 55, 85 40" stroke={color} strokeWidth="0.4" fill="none" opacity="0.5" />
  </svg>
);

const resolveImg = (src) => {
  if (!src) return '/assets/service_hair_care.png';
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) return src;
  if (src.startsWith('./')) return src.replace('./', '/');
  if (!src.startsWith('/')) return `/${src}`;
  return src;
};

const ServicesSection = ({
  isEdit = false,
  isPreviewMode = false,
  onUpdateField,
  onRequestImageUpload,
}) => {
  const root = useRef(null);
  const siteData = useSiteData();

  const theme = siteData?.theme || {};
  const primaryColor = theme.primary || '#4A121B';
  const goldColor = theme.gold || '#D4A574';
  const accentColor = theme.accent || primaryColor;

  const servicesData = siteData?.services || {};
  const scriptText = servicesData.scriptLabel || 'Bespoke Offerings';
  const sectionTitle = servicesData.sectionTitle || 'OUR LUXURY SERVICES';
  const sectionDesc =
    servicesData.sectionDescription ||
    'Explore our curated rituals engineered for radiant transformation, organic scalp nourishment, and couture aesthetic mastery.';

  const serviceItems =
    servicesData.items?.length > 0
      ? servicesData.items.map((item, idx) => ({
          number: item.number || `0${idx + 1}`,
          title: item.title,
          description: item.description,
          image: resolveImg(item.image),
          rawItem: item,
        }))
      : FALLBACK_SERVICES;

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.from(['.svc-script', '.svc-title', '.svc-tag', '.svc-cta'], {
        opacity: 0,
        y: 40,
        duration: 0.9,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: root.current, start: 'top 75%', once: true },
      });

      gsap.from('.svc-underline', {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 0.9,
        delay: 0.35,
        ease: 'power2.out',
        scrollTrigger: { trigger: root.current, start: 'top 75%', once: true },
      });

      gsap.from('.svc-card', {
        opacity: 0,
        y: 70,
        duration: 0.85,
        stagger: 0.14,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.svc-grid', start: 'top 85%', once: true },
      });

      gsap.matchMedia().add('(min-width: 768px)', () => {
        gsap.set('.svc-num', { willChange: 'transform', force3D: true });
        gsap.to('.svc-num', {
          yPercent: -22,
          ease: 'none',
          scrollTrigger: {
            trigger: '.svc-grid',
            start: 'top bottom',
            end: 'bottom top',
            scrub: SCRUB,
          },
        });
      });

      gsap.to('.services-botanical', {
        rotation: 5,
        transformOrigin: '50% 92%',
        duration: 3.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        scrollTrigger: {
          trigger: root.current,
          start: 'top bottom',
          end: 'bottom top',
          toggleActions: 'play pause resume pause',
        },
      });
    }, root);

    return () => ctx.revert();
  }, []);

  const handleUpdateCard = (idx, field, val) => {
    const list = [...(servicesData.items || FALLBACK_SERVICES)];
    if (!list[idx]) {
      list[idx] = { ...FALLBACK_SERVICES[idx] };
    }
    list[idx] = { ...list[idx], [field]: val };
    onUpdateField?.('services.items', list);
  };

  const showEditControls = isEdit && !isPreviewMode;

  return (
    <section
      ref={root}
      id="services"
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: '#F4EDE3' }}
    >
      <div className="relative max-w-[1440px] mx-auto px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-12 sm:py-16 md:py-24">
        <div className="flex flex-col lg:flex-row gap-12 sm:gap-14 lg:gap-12 xl:gap-16 items-start">
          
          {/* LEFT COLUMN: Header & Botanical illustration */}
          <div className="relative w-full lg:w-[30%] xl:w-[28%] lg:min-w-[220px] lg:max-w-[340px] min-w-0 flex flex-col justify-between shrink-0 lg:pr-2">
            <div>
              {showEditControls ? (
                <input
                  type="text"
                  value={scriptText}
                  onChange={(e) => onUpdateField?.('services.scriptLabel', e.target.value)}
                  className="svc-script text-xl sm:text-3xl md:text-4xl leading-tight tracking-wide mb-1 bg-white/70 border-b-2 px-1 py-0.5 rounded focus:outline-none w-full"
                  style={{
                    fontFamily: "'Alex Brush', 'Great Vibes', cursive",
                    color: accentColor,
                    borderColor: accentColor,
                  }}
                  placeholder="Script label"
                />
              ) : (
                <p
                  className="svc-script text-xl sm:text-3xl md:text-4xl leading-tight tracking-wide select-none mb-1"
                  style={{
                    fontFamily: "'Alex Brush', 'Great Vibes', cursive",
                    color: accentColor,
                  }}
                >
                  {scriptText}
                </p>
              )}

              {showEditControls ? (
                <input
                  type="text"
                  value={sectionTitle}
                  onChange={(e) => onUpdateField?.('services.sectionTitle', e.target.value)}
                  className="svc-title uppercase bg-white/70 border-b-2 px-1 py-0.5 rounded focus:outline-none w-full my-1"
                  style={{
                    fontFamily: "'Playfair Display', Didot, serif",
                    fontWeight: 700,
                    fontSize: 'clamp(1.8rem, 2.8vw, 3.2rem)',
                    lineHeight: 1.08,
                    letterSpacing: '0.02em',
                    color: primaryColor,
                    borderColor: primaryColor,
                  }}
                  placeholder="Section Title"
                />
              ) : (
                <h2
                  className="svc-title uppercase select-none"
                  style={{
                    fontFamily: "'Playfair Display', Didot, serif",
                    fontWeight: 700,
                    fontSize: 'clamp(2.1rem, 3.2vw, 3.6rem)',
                    lineHeight: 1.08,
                    letterSpacing: '0.02em',
                    maxWidth: '14ch',
                    color: primaryColor,
                  }}
                >
                  {sectionTitle}
                </h2>
              )}

              {/* Hand-drawn underline SVG */}
              <svg
                className="svc-underline mt-2 w-[160px] sm:w-[220px] h-auto"
                viewBox="0 0 220 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M2 11 C 40 4.5, 110 2.5, 216 6.5 C 217 7, 216.5 7.8, 215 7.9 C 120 5.8, 45 8.5, 3 12.4 C 1.5 12.5, 1 11.4, 2 11 Z"
                  fill={accentColor}
                />
              </svg>

              {showEditControls ? (
                <textarea
                  value={sectionDesc}
                  onChange={(e) => onUpdateField?.('services.sectionDescription', e.target.value)}
                  rows={3}
                  className="svc-tag mt-4 sm:mt-6 text-[#4E443F] text-xs sm:text-sm leading-relaxed bg-white/70 border border-[#4E443F]/30 rounded p-2 focus:outline-none w-full"
                  placeholder="Section description..."
                />
              ) : (
                <p
                  className="svc-tag mt-4 sm:mt-6 text-[#4E443F] text-sm sm:text-base leading-relaxed max-w-[280px]"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400 }}
                >
                  {sectionDesc}
                </p>
              )}

              <div className="relative mt-4 min-h-[140px] sm:min-h-[180px] hidden sm:block">
                <BotanicalLeaf
                  className="services-botanical absolute left-[30%] sm:left-[40%] top-0 w-[100px] sm:w-[130px]"
                  style={{ opacity: 0.55 }}
                />
              </div>
            </div>

            <div className="mt-6 sm:mt-8 lg:mt-8">
              <a
                href="#services"
                className="svc-cta group inline-flex items-center gap-3 text-[#2B2422] text-xs sm:text-sm font-semibold tracking-[0.18em] uppercase hover:text-[#4A121B] transition-colors duration-300"
              >
                <span className="border-b border-[#2B2422]/40 pb-1 group-hover:border-[#4A121B] transition-colors">
                  EXPLORE ALL SERVICES
                </span>
                <ArrowRight size={16} className="transform group-hover:translate-x-1.5 transition-transform duration-300" />
              </a>
            </div>
          </div>

          {/* RIGHT COLUMN: 4 EXACT TILTING POLYGON CARDS */}
          <div className="w-full lg:flex-1 min-w-0 mt-2 lg:mt-0">
            <div className="svc-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-6 sm:gap-x-7 md:gap-x-8 gap-y-12 sm:gap-y-14">
              {serviceItems.map((service, index) => (
                <div
                  key={service.number || index}
                  className="svc-card flex flex-col items-center max-w-[300px] sm:max-w-none mx-auto w-full min-w-0 px-1 relative"
                >
                  {/* Giant Italic Number */}
                  <span
                    className="svc-num select-none text-center"
                    style={{
                      fontFamily: "'Playfair Display', Didot, serif",
                      fontSize: 'clamp(2.2rem, 3.5vw, 3.8rem)',
                      fontWeight: 400,
                      lineHeight: 1,
                      fontStyle: 'italic',
                      color: goldColor,
                      marginBottom: '14px',
                    }}
                  >
                    {service.number}
                  </span>

                  {/* Polygon-clipped image card */}
                  <div
                    className="relative w-full group cursor-pointer"
                    style={{
                      filter: 'drop-shadow(0 14px 22px rgba(0,0,0,0.16))',
                      transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.03)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = '';
                    }}
                  >
                    <div
                      className="w-full overflow-hidden relative"
                      style={{
                        clipPath: index % 2 === 0 ? CARD_CLIP_RIGHT : CARD_CLIP_LEFT,
                        aspectRatio: '3/4.4',
                      }}
                    >
                      <img
                        src={service.image}
                        alt={service.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div
                        className="absolute inset-0 z-10 pointer-events-none"
                        style={{
                          background: 'linear-gradient(to top, rgba(0,0,0,0.15) 0%, transparent 40%)',
                        }}
                      />
                    </div>

                    {/* S3 Image Replacement Button in Edit Mode */}
                    {showEditControls && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestImageUpload?.({
                            title: `Change Photo for Service #${service.number}`,
                            folderName: 'services',
                            onComplete: (url) => handleUpdateCard(index, 'image', url),
                          });
                        }}
                        className="absolute inset-0 m-auto z-30 w-fit h-fit px-3 py-1.5 rounded-full bg-[#4A121B]/95 hover:bg-[#611B26] text-[#F6EFE5] text-[11px] font-semibold border border-[#D4A574] shadow-xl flex items-center gap-1.5 backdrop-blur-sm cursor-pointer transition-transform hover:scale-105 active:scale-95"
                        title="Upload new image to S3"
                      >
                        <Camera size={13} className="text-[#D4A574]" />
                        <span>Change Photo</span>
                      </button>
                    )}
                  </div>

                  {/* Service Title */}
                  {showEditControls ? (
                    <input
                      type="text"
                      value={service.title}
                      onChange={(e) => handleUpdateCard(index, 'title', e.target.value)}
                      className="mt-4 text-center text-[#2B2422] uppercase font-bold tracking-[0.12em] px-1 bg-white/70 border-b border-[#2B2422]/30 focus:outline-none w-full text-xs"
                    />
                  ) : (
                    <h3
                      className="mt-5 text-center text-[#2B2422] uppercase font-bold tracking-[0.12em] px-1"
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: 'clamp(0.72rem, 1vw, 0.85rem)',
                        letterSpacing: '0.12em',
                        lineHeight: 1.35,
                      }}
                    >
                      {service.title}
                    </h3>
                  )}

                  {/* Service Description */}
                  {showEditControls ? (
                    <textarea
                      value={service.description}
                      onChange={(e) => handleUpdateCard(index, 'description', e.target.value)}
                      rows={3}
                      className="mt-2 text-center text-[#6B5E56] text-[11px] leading-relaxed px-1 bg-white/70 border border-[#6B5E56]/20 rounded p-1 w-full focus:outline-none"
                    />
                  ) : (
                    <p
                      className="mt-2 text-center text-[#6B5E56] leading-relaxed px-2 max-w-[240px]"
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: 400,
                        fontSize: 'clamp(0.72rem, 0.95vw, 0.82rem)',
                      }}
                    >
                      {service.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
