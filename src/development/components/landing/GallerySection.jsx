import React, { useState, useEffect, useRef } from 'react';
import { Maximize2, X, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { useSiteData } from '../context/SiteContext';

const resolveImg = (src, fallback) => {
  if (!src) return fallback;
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) return src;
  if (src.startsWith('./')) return src.replace('./', '/');
  if (!src.startsWith('/')) return `/${src}`;
  return src;
};

const FALLBACK_GALLERY = [
  {
    id: 1,
    category: 'HAIR CARE',
    title: 'Dimensional Balayage & Silk Waves',
    subtitle: 'Precision Hair Care',
    description:
      'Bespoke hand-painted balayage with rich warm tones and smooth, voluminous glossy waves.',
    image: '/assets/gallery_indian_hair.png',
  },
  {
    id: 2,
    category: 'SKIN RADIANCE',
    title: 'Gold Radiance Spa Facial',
    subtitle: 'Skin Radiance Therapy',
    description: 'Deep hydration and collagen restoration treatment for luminous, camera-ready skin.',
    image: '/assets/gallery_indian_facial.png',
  },
  {
    id: 3,
    category: 'BRIDAL & MAKEUP',
    title: 'Royal Kundan Bridal Makeup',
    subtitle: 'Editorial Makeup Studio',
    description:
      'HD velvet finish with shimmering gold eye makeup and rich crimson lips for unforgettable bride allure.',
    image: '/assets/gallery_indian_bridal.png',
  },
  {
    id: 4,
    category: 'NAIL ART',
    title: 'Bridal Gold Leaf Manicure',
    subtitle: 'Nail Architecture',
    description: 'Precision manicured blush base with hand-placed 24k gold leaf foil accents.',
    image: '/assets/gallery_indian_nails.png',
  },
  {
    id: 5,
    category: 'HAIR CARE',
    title: 'Traditional Floral Bridal Updo',
    subtitle: 'Haute Hair Styling',
    description:
      'Intricate swept-back traditional Indian updo styled with mogra flowers and gold jewelry.',
    image: '/assets/gallery_indian_updo.png',
  },
  {
    id: 6,
    category: 'SALON SANCTUARY',
    title: 'VIP Salon Therapy Suite',
    subtitle: 'Luxury Atmosphere',
    description: 'Immerse yourself in our serene, botanical-scented private beauty suites.',
    image: '/assets/faq_hair_wash.png',
  },
];

const GallerySection = ({
  isEdit = false,
  isPreviewMode = false,
  onUpdateField,
  onRequestImageUpload,
}) => {
  const siteData = useSiteData();
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  const theme = siteData?.theme || {};
  const primaryColor = theme.primary || '#4A121B';
  const goldColor = theme.gold || '#D4A574';
  const accentColor = theme.accent || primaryColor;

  const galleryData = siteData?.gallery || {};
  const scriptText = galleryData.scriptLabel || 'Curated Portfolio';
  const sectionTitle = galleryData.sectionTitle || 'OUR GALLERY';
  const sectionDesc =
    galleryData.sectionDescription ||
    'Immerse yourself in our portfolio of luxury hair transformations, glowing facial therapies, couture bridal looks, and bespoke nail artistry.';

  const sourceItems = galleryData.items?.length > 0 ? galleryData.items : FALLBACK_GALLERY;
  const galleryItems = sourceItems.map((item, idx) => ({
    id: item.id || idx + 1,
    category: item.category || 'PORTFOLIO',
    title: item.title,
    subtitle: item.subtitle || item.category,
    description: item.description,
    image: resolveImg(item.image, FALLBACK_GALLERY[idx]?.image || '/assets/gallery_indian_hair.png'),
  }));

  const showEditControls = isEdit && !isPreviewMode;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.05 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    const safetyTimer = setTimeout(() => {
      setIsVisible(true);
    }, 400);

    return () => {
      observer.disconnect();
      clearTimeout(safetyTimer);
    };
  }, []);

  const openLightbox = (index) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const nextLightbox = () => {
    setLightboxIndex((prev) => (prev + 1) % galleryItems.length);
  };

  const prevLightbox = () => {
    setLightboxIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
  };

  const handleUpdateItem = (idx, field, val) => {
    const list = [...(galleryData.items || FALLBACK_GALLERY)];
    if (!list[idx]) {
      list[idx] = { ...FALLBACK_GALLERY[idx] };
    }
    list[idx] = { ...list[idx], [field]: val };
    onUpdateField?.('gallery.items', list);
  };

  return (
    <section
      ref={sectionRef}
      id="gallery"
      className="relative w-full overflow-hidden py-14 sm:py-20 md:py-24"
      style={{ backgroundColor: '#FAF5EE' }}
    >
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#4A121B]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#C4A882]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 z-10">

        {/* HEADER */}
        <div
          className="flex flex-col items-center text-center max-w-2xl mx-auto mb-10 sm:mb-14 transition-all duration-700"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          }}
        >
          {showEditControls ? (
            <input
              type="text"
              value={scriptText}
              onChange={(e) => onUpdateField?.('gallery.scriptLabel', e.target.value)}
              className="text-2xl sm:text-3xl md:text-4xl leading-tight mb-2 bg-white/70 border-b px-1 focus:outline-none text-center"
              style={{
                fontFamily: "'Alex Brush', 'Great Vibes', cursive",
                color: accentColor,
                borderColor: accentColor,
              }}
            />
          ) : (
            <p
              className="text-2xl sm:text-3xl md:text-4xl leading-tight mb-2 select-none"
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
              onChange={(e) => onUpdateField?.('gallery.sectionTitle', e.target.value)}
              className="uppercase font-bold tracking-[0.08em] mb-4 bg-white/70 border-b px-1 focus:outline-none text-center w-full"
              style={{
                fontFamily: "'Playfair Display', Didot, serif",
                fontSize: 'clamp(2rem, 3.8vw, 3.8rem)',
                lineHeight: 1.1,
                color: primaryColor,
                borderColor: primaryColor,
              }}
            />
          ) : (
            <h2
              className="uppercase font-bold tracking-[0.08em] mb-4 select-none"
              style={{
                fontFamily: "'Playfair Display', Didot, serif",
                fontSize: 'clamp(2rem, 3.8vw, 3.8rem)',
                lineHeight: 1.1,
                color: primaryColor,
              }}
            >
              {sectionTitle}
            </h2>
          )}

          <div
            className="w-16 h-0.5 mb-5"
            style={{ backgroundColor: primaryColor }}
          />

          {showEditControls ? (
            <textarea
              value={sectionDesc}
              onChange={(e) => onUpdateField?.('gallery.sectionDescription', e.target.value)}
              rows={2}
              className="text-xs sm:text-sm text-[#4E443F] leading-relaxed bg-white/70 border border-[#4E443F]/30 rounded p-1.5 focus:outline-none w-full"
            />
          ) : (
            <p
              className="text-xs sm:text-sm text-[#4E443F] leading-relaxed max-w-lg"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {sectionDesc}
            </p>
          )}
        </div>

        {/* GALLERY GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-7">
          {galleryItems.map((item, index) => (
            <div
              key={item.id}
              onClick={() => !showEditControls && openLightbox(index)}
              className="group relative overflow-hidden rounded-sm shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer h-[300px] sm:h-[360px] md:h-[420px]"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s, box-shadow 0.4s ease`,
              }}
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                loading="lazy"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#191514]/90 via-[#191514]/30 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-300" />

              {/* S3 Image Change Button */}
              {showEditControls && (
                <div className="absolute inset-0 m-auto z-30 w-fit h-fit">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestImageUpload?.({
                        title: `Change Image for ${item.title}`,
                        folderName: 'gallery',
                        onComplete: (url) => handleUpdateItem(index, 'image', url),
                      });
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#4A121B]/95 hover:bg-[#611B26] text-[#F6EFE5] text-xs font-semibold uppercase tracking-wider border border-[#D4A574] shadow-2xl backdrop-blur-md cursor-pointer transition-transform hover:scale-105 active:scale-95"
                  >
                    <Camera size={13} className="text-[#D4A574]" />
                    <span>Change Photo</span>
                  </button>
                </div>
              )}

              {/* Card info */}
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 flex flex-col justify-end text-left z-20">
                <span className="text-[10px] font-bold tracking-[0.2em] text-[#D4A574] uppercase mb-1">
                  {item.category}
                </span>

                {showEditControls ? (
                  <input
                    type="text"
                    value={item.title}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleUpdateItem(index, 'title', e.target.value)}
                    className="font-serif text-lg text-[#F6EFE5] bg-black/40 border-b border-[#D4A574] px-1 focus:outline-none w-full mb-1"
                  />
                ) : (
                  <h3
                    className="font-serif text-lg sm:text-xl text-[#F6EFE5] leading-tight mb-2 transform translate-y-3 group-hover:translate-y-0 transition-transform duration-400 delay-75"
                    style={{ fontFamily: "'Playfair Display', Didot, serif" }}
                  >
                    {item.title}
                  </h3>
                )}

                {showEditControls ? (
                  <textarea
                    value={item.description}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                    rows={2}
                    className="text-[#EFE6D5] text-xs bg-black/40 border border-white/20 rounded p-1 w-full focus:outline-none"
                  />
                ) : (
                  <p
                    className="text-[#EFE6D5]/80 text-xs line-clamp-2 mb-3 transform translate-y-3 group-hover:translate-y-0 transition-transform duration-400 delay-100 hidden sm:block"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {item.description}
                  </p>
                )}

                {!showEditControls && (
                  <div className="flex items-center gap-2 text-[#D4A574] text-xs font-semibold tracking-wider uppercase transform translate-y-3 group-hover:translate-y-0 transition-transform duration-400 delay-150">
                    <span>VIEW DETAILS</span>
                    <Maximize2 size={14} />
                  </div>
                )}
              </div>

              {!showEditControls && (
                <div className="absolute top-3 right-3 bg-[#1A0A0E]/70 backdrop-blur-md px-2.5 py-1 rounded text-[9px] text-[#D4A574] font-semibold tracking-widest uppercase border border-[#D4A574]/30 group-hover:opacity-0 transition-opacity">
                  {item.category}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>

      {/* LIGHTBOX MODAL */}
      {lightboxIndex !== null && galleryItems[lightboxIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#191514]/90 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-4xl bg-[#F4EDE3] border border-[#4A121B]/20 rounded-md shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            <button
              onClick={closeLightbox}
              className="absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-[#1A0A0E]/80 text-[#F6EFE5] flex items-center justify-center hover:bg-[#4A121B] transition-colors cursor-pointer"
              aria-label="Close Lightbox"
            >
              <X size={20} />
            </button>

            <div className="relative w-full md:w-3/5 bg-black h-[280px] sm:h-[380px] md:h-auto overflow-hidden">
              <img
                src={galleryItems[lightboxIndex].image}
                alt={galleryItems[lightboxIndex].title}
                className="w-full h-full object-cover"
              />

              <button
                onClick={prevLightbox}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#1A0A0E]/60 text-white flex items-center justify-center hover:bg-[#4A121B] transition-colors cursor-pointer"
                aria-label="Previous image"
              >
                <ChevronLeft size={20} />
              </button>

              <button
                onClick={nextLightbox}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#1A0A0E]/60 text-white flex items-center justify-center hover:bg-[#4A121B] transition-colors cursor-pointer"
                aria-label="Next image"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="w-full md:w-2/5 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
              <div>
                <span className="text-[10px] font-bold tracking-[0.25em] text-[#7A2430] uppercase block mb-1">
                  {galleryItems[lightboxIndex].category}
                </span>

                <h3
                  className="text-2xl sm:text-3xl text-[#4A121B] font-serif leading-tight mb-2"
                  style={{ fontFamily: "'Playfair Display', Didot, serif" }}
                >
                  {galleryItems[lightboxIndex].title}
                </h3>

                <p
                  className="font-script text-xl text-[#7A2430] mb-4"
                  style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
                >
                  {galleryItems[lightboxIndex].subtitle}
                </p>

                <p
                  className="text-xs sm:text-sm text-[#4E443F] leading-relaxed"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {galleryItems[lightboxIndex].description}
                </p>
              </div>

              <div className="pt-6 border-t border-[#4A121B]/15 flex items-center justify-between text-xs text-[#7A2430] font-semibold">
                <span>Tekkzy Haute Gallery</span>
                <span>{lightboxIndex + 1} / {galleryItems.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default GallerySection;
