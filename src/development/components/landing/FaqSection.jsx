import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus, ArrowRight, HelpCircle, Camera } from 'lucide-react';
import { gsap, prefersReducedMotion, SCRUB } from '../lib/gsapSetup';
import { useSiteData } from '../context/SiteContext';

const ORIGINAL_FAQS = [
  {
    number: '01',
    question: 'How do I book an appointment?',
    answer:
      'You can book an appointment through our website by clicking the "Book Now" button, calling us directly, or visiting our salon. We also accept bookings via WhatsApp and Instagram DMs.',
  },
  {
    number: '02',
    question: 'What services do you offer?',
    answer:
      "We offer a wide range of services including hair care, skin care, makeup, nail art, and more. You can explore all our services in the 'Services' section.",
  },
  {
    number: '03',
    question: 'What are your operating hours?',
    answer:
      'We are open Monday through Friday from 9:00 AM to 8:00 PM, Saturday from 9:00 AM to 7:00 PM, and Sunday from 10:00 AM to 5:00 PM (by appointment only).',
  },
  {
    number: '04',
    question: 'Do you use premium products?',
    answer:
      'Yes! We exclusively use high-end, organic, and cruelty-free products from globally renowned brands to ensure the best results and care for your hair and skin.',
  },
  {
    number: '05',
    question: 'What is your cancellation policy?',
    answer:
      'We kindly request at least 24 hours notice for cancellations. Late cancellations or no-shows may incur a fee of up to 50% of the service cost.',
  },
  {
    number: '06',
    question: 'Do you offer any packages or memberships?',
    answer:
      'Absolutely! We offer curated monthly and annual membership plans with exclusive discounts, priority booking, and complimentary add-on services. Ask our concierge for details.',
  },
];

const resolveImg = (src, fallback) => {
  if (!src) return fallback;
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) return src;
  if (src.startsWith('./')) return src.replace('./', '/');
  if (!src.startsWith('/')) return `/${src}`;
  return src;
};

// Reusable thin line-art branch used for the bottom-left cluster
const LeafBranch = ({ width = 100, height = 140, opacity = 0.5, style = {}, className = '', color = '#6E2430' }) => (
  <svg
    className={className}
    width={width}
    height={height}
    viewBox="0 0 100 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ opacity, ...style }}
  >
    <path d="M50 138 C50 108,47 76,50 48 C53 22,49 10,50 1" stroke={color} strokeWidth="1" fill="none" />
    <path d="M50 112 C34 106,16 92,12 74 C9 59,21 50,34 56 C43 60,49 78,50 96" stroke={color} strokeWidth="0.8" fill="none" />
    <path d="M50 90 C36 81,23 64,27 47 C29 34,40 32,47 42 C51 48,51 68,50 82" stroke={color} strokeWidth="0.8" fill="none" />
    <path d="M50 122 C65 117,80 104,84 86 C86 73,75 65,65 71 C58 75,51 91,50 106" stroke={color} strokeWidth="0.8" fill="none" />
    <path d="M50 68 C63 60,76 45,73 28 C71 17,60 14,53 24 C49 30,49 50,50 62" stroke={color} strokeWidth="0.8" fill="none" />
    <path d="M50 44 C40 37,30 25,33 13 C35 5,44 4,48 12 C50 17,50 30,50 40" stroke={color} strokeWidth="0.7" fill="none" />
  </svg>
);

const FaqSection = ({
  isEdit = false,
  isPreviewMode = false,
  onUpdateField,
  onRequestImageUpload,
}) => {
  const [openIndex, setOpenIndex] = useState(1); // FAQ #02 open by default like original
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const siteData = useSiteData();

  const theme = siteData?.theme || {};
  const primaryColor = theme.primary || '#4A121B';
  const goldColor = theme.gold || '#D4A574';
  const accentColor = theme.accent || primaryColor;

  const faqSectionData = siteData?.faq || {};
  const scriptText = faqSectionData.scriptLabel || 'Have Questions?';
  const sectionTitle = faqSectionData.sectionTitle || "FAQ'S";
  const sectionDesc =
    faqSectionData.sectionDescription ||
    'Everything you need to know about our services, bookings and more.';
  const blobQuote = faqSectionData.blobQuote || 'Your comfort\nis our priority.';
  const photoSrc = resolveImg(faqSectionData.image, '/assets/faq_hair_wash.png');

  // Use dynamic items if customized, else use 100% exact original 6 items
  const rawItems = faqSectionData.items?.length > 0 ? faqSectionData.items : ORIGINAL_FAQS;
  const faqList = rawItems.map((item, idx) => ({
    number: item.number || `0${idx + 1}`,
    question: item.question,
    answer: item.answer,
  }));

  const showEditControls = isEdit && !isPreviewMode;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);

    // Guaranteed visibility timer so content never stays stuck at opacity: 0
    const timer = setTimeout(() => setIsVisible(true), 350);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  /* ── GSAP: image reveal, parallax + ambient motion ── */
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      /* petal photo scales into place */
      gsap.from('.faq-photo', {
        opacity: 0,
        scale: 0.88,
        transformOrigin: 'center center',
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.faq-photo', start: 'top 88%', once: true },
      });

      /* burgundy blob pops in with a bounce */
      gsap.from('.faq-blob', {
        opacity: 0,
        scale: 0.5,
        rotation: -14,
        transformOrigin: 'center center',
        duration: 0.75,
        delay: 0.25,
        ease: 'back.out(1.7)',
        scrollTrigger: { trigger: '.faq-photo', start: 'top 88%', once: true },
      });

      /* echo outline ring fades in slightly later */
      gsap.from('.faq-ring', {
        opacity: 0,
        scale: 0.92,
        transformOrigin: 'center center',
        duration: 0.9,
        delay: 0.4,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.faq-photo', start: 'top 88%', once: true },
      });

      /* Q&A watermark drifts on scroll */
      gsap.set('.faq-qa', { willChange: 'transform', force3D: true });
      gsap.to('.faq-qa', {
        y: -42,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: SCRUB,
        },
      });

      /* leaf branches sway gently */
      gsap.utils.toArray('.faq-leaf').forEach((el, i) => {
        gsap.to(el, {
          rotation: '+=5',
          transformOrigin: '50% 100%',
          duration: 3 + i * 0.6,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            toggleActions: 'play pause resume pause',
          },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const toggle = (idx) => setOpenIndex(openIndex === idx ? -1 : idx);

  const handleUpdateItem = (idx, field, val) => {
    const list = [...(faqSectionData.items || ORIGINAL_FAQS)];
    if (!list[idx]) {
      list[idx] = { ...ORIGINAL_FAQS[idx] };
    }
    list[idx] = { ...list[idx], [field]: val };
    onUpdateField?.('faq.items', list);
  };

  return (
    <section
      ref={sectionRef}
      id="faq"
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: '#F4EDE3' }}
    >
      <div className="relative max-w-[1320px] mx-auto px-4 sm:px-8 md:px-12 lg:px-14 py-12 sm:py-16 md:py-20">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-8">

          {/* ════════ LEFT COLUMN ════════ */}
          <div
            className="lg:w-[38%] xl:w-[36%] relative flex flex-col shrink-0 pl-0 lg:pl-8"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'opacity 0.8s ease, transform 0.8s ease',
            }}
          >
            {/* Vertical side text + sparkle */}
            <div
              className="absolute left-0 top-[52%] -translate-y-1/2 hidden lg:flex flex-col items-center gap-2"
              style={{ left: '-4px' }}
            >
              <svg width="9" height="9" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 0L8.2 5.1L13.3 4.2L9.1 7L13.3 9.8L8.2 8.9L7 14L5.8 8.9L0.7 9.8L4.9 7L0.7 4.2L5.8 5.1L7 0Z"
                  fill="#6E2430"
                  fillOpacity="0.6"
                />
              </svg>
              <span
                className="text-[#4A3B33]/45 text-[10px] tracking-[0.3em] uppercase font-semibold select-none"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                BEAUTY. CARE. YOU.
              </span>
            </div>

            {/* Script label + line + sparkle */}
            <div className="flex items-center gap-3">
              {showEditControls ? (
                <input
                  type="text"
                  value={scriptText}
                  onChange={(e) => onUpdateField?.('faq.scriptLabel', e.target.value)}
                  className="text-2xl sm:text-[1.7rem] leading-tight bg-white/70 border-b px-1 focus:outline-none"
                  style={{
                    fontFamily: "'Alex Brush', 'Great Vibes', cursive",
                    color: accentColor,
                    borderColor: accentColor,
                  }}
                />
              ) : (
                <p
                  className="text-2xl sm:text-[1.7rem] leading-tight select-none whitespace-nowrap"
                  style={{
                    fontFamily: "'Alex Brush', 'Great Vibes', cursive",
                    color: accentColor,
                  }}
                >
                  {scriptText}
                </p>
              )}
              <div
                className="hidden sm:block shrink-0"
                style={{ width: '64px', height: '1px', backgroundColor: accentColor, opacity: 0.55 }}
              />
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="shrink-0">
                <path
                  d="M7 0L8.2 5.1L13.3 4.2L9.1 7L13.3 9.8L8.2 8.9L7 14L5.8 8.9L0.7 9.8L4.9 7L0.7 4.2L5.8 5.1L7 0Z"
                  fill={accentColor}
                  fillOpacity="0.85"
                />
              </svg>
            </div>

            {/* Big serif title */}
            <div className="mt-1">
              {showEditControls ? (
                <input
                  type="text"
                  value={sectionTitle}
                  onChange={(e) => onUpdateField?.('faq.sectionTitle', e.target.value)}
                  className="uppercase bg-white/70 border-b px-1 focus:outline-none w-full"
                  style={{
                    fontFamily: "'Playfair Display', Didot, serif",
                    fontWeight: 800,
                    fontSize: 'clamp(2.4rem, 5.2vw, 4.6rem)',
                    lineHeight: 1.0,
                    letterSpacing: '0.01em',
                    color: primaryColor,
                    borderColor: primaryColor,
                  }}
                />
              ) : (
                <h2
                  className="uppercase select-none"
                  style={{
                    fontFamily: "'Playfair Display', Didot, serif",
                    fontWeight: 800,
                    fontSize: 'clamp(2.4rem, 5.2vw, 4.6rem)',
                    lineHeight: 1.0,
                    letterSpacing: '0.01em',
                    color: primaryColor,
                  }}
                >
                  {sectionTitle}
                </h2>
              )}

              {/* Curved brush-stroke underline */}
              <svg width="132" height="20" viewBox="0 0 132 20" fill="none" className="-mt-1">
                <path
                  d="M2 13 C 26 20, 62 20, 92 10 C 104 6, 114 3, 129 7"
                  stroke={primaryColor}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </div>

            {/* Description with left border */}
            <div className="mt-4 sm:mt-5 flex gap-3 max-w-[280px]">
              <div
                className="shrink-0"
                style={{ width: '2px', background: accentColor, opacity: 0.5, borderRadius: '2px' }}
              />
              {showEditControls ? (
                <textarea
                  value={sectionDesc}
                  onChange={(e) => onUpdateField?.('faq.sectionDescription', e.target.value)}
                  rows={2}
                  className="text-[#5C524E] text-[13px] sm:text-sm font-medium leading-relaxed bg-white/70 border border-[#7A2430]/30 rounded p-1 w-full focus:outline-none"
                />
              ) : (
                <p
                  className="text-[#5C524E] text-[13px] sm:text-sm font-medium leading-relaxed"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {sectionDesc}
                </p>
              )}
            </div>

            {/* ── Image composition ── */}
            <div className="relative mt-6 sm:mt-10 ml-4 sm:ml-10">
              {/* Q&A watermark */}
              <span
                className="faq-qa absolute select-none pointer-events-none"
                style={{
                  left: '-20px',
                  top: '38%',
                  transform: 'translateY(-50%)',
                  fontFamily: "'Playfair Display', Didot, serif",
                  fontStyle: 'italic',
                  fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                  fontWeight: 600,
                  color: 'rgba(201,178,150,0.5)',
                  lineHeight: 1,
                  zIndex: 1,
                }}
              >
                Q&amp;A
              </span>

              {/* Offset echo outline ring */}
              <div
                className="faq-ring absolute pointer-events-none"
                style={{
                  width: '286px',
                  maxWidth: '86%',
                  aspectRatio: '270/310',
                  top: '-22px',
                  left: '18px',
                  borderRadius: '26px 170px 150px 170px',
                  border: `1px solid ${primaryColor}80`,
                  zIndex: 1,
                }}
              />

              {/* Leaf/petal-shaped image frame */}
              <div
                className="faq-photo relative overflow-hidden"
                style={{
                  width: '240px',
                  maxWidth: '85%',
                  aspectRatio: '270/300',
                  borderRadius: '24px 165px 145px 165px',
                  border: `1.5px solid ${primaryColor}`,
                  boxShadow: '0 18px 40px rgba(50,20,15,0.15)',
                  zIndex: 2,
                }}
              >
                <img
                  src={photoSrc}
                  alt="Salon hair washing service"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {/* S3 Image Replacement Button */}
                {showEditControls && (
                  <div className="absolute inset-0 m-auto z-30 w-fit h-fit">
                    <button
                      type="button"
                      onClick={() =>
                        onRequestImageUpload?.({
                          title: 'Change FAQ Illustration',
                          folderName: 'faq',
                          onComplete: (url) => onUpdateField?.('faq.image', url),
                        })
                      }
                      style={{ backgroundColor: primaryColor }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[#F6EFE5] text-xs font-semibold uppercase tracking-wider border border-[#D4A574] shadow-2xl backdrop-blur-md cursor-pointer transition-transform hover:scale-105"
                    >
                      <Camera size={13} className="text-[#D4A574]" />
                      <span>Change Photo</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Brush-stroke accent with quote */}
              <div
                className="faq-blob absolute flex items-center justify-center text-center -bottom-3 sm:-bottom-5 left-1 sm:-left-5"
                style={{
                  width: '190px',
                  height: '95px',
                  background: primaryColor,
                  borderRadius: '58% 42% 46% 54% / 60% 55% 45% 40%',
                  transform: 'rotate(-3deg)',
                  boxShadow: '0 10px 26px rgba(0,0,0,0.25)',
                  zIndex: 3,
                  padding: '0 14px',
                }}
              >
                {showEditControls ? (
                  <textarea
                    value={blobQuote}
                    onChange={(e) => onUpdateField?.('faq.blobQuote', e.target.value)}
                    rows={2}
                    className="bg-transparent text-[#F6EFE5] text-xs text-center border-b border-[#D4A574] focus:outline-none w-full"
                    style={{
                      fontFamily: "'Alex Brush', 'Great Vibes', cursive",
                    }}
                  />
                ) : (
                  <p
                    className="select-none whitespace-nowrap"
                    style={{
                      fontFamily: "'Alex Brush', 'Great Vibes', cursive",
                      fontSize: 'clamp(0.95rem, 1.6vw, 1.3rem)',
                      color: '#F6EFE5',
                      lineHeight: 1.3,
                      transform: 'rotate(3deg)',
                    }}
                  >
                    {blobQuote.includes('\n')
                      ? blobQuote.split('\n').map((l, i) => (
                          <React.Fragment key={i}>
                            {l}
                            {i === 0 && <br />}
                          </React.Fragment>
                        ))
                      : blobQuote}
                  </p>
                )}
              </div>
            </div>

            {/* Botanical leaf cluster, bottom-left */}
            <LeafBranch
              className="faq-leaf hidden sm:block"
              width={150}
              height={190}
              opacity={0.55}
              style={{ position: 'absolute', left: '-10px', bottom: '-38px', transform: 'rotate(-6deg)', zIndex: 0 }}
            />
            <LeafBranch
              className="faq-leaf hidden sm:block"
              width={100}
              height={130}
              opacity={0.4}
              style={{ position: 'absolute', left: '18px', bottom: '18px', transform: 'rotate(10deg)', zIndex: 0 }}
            />
          </div>

          {/* ════════ RIGHT COLUMN: FAQ Accordion ════════ */}
          <div className="lg:w-[62%] xl:w-[64%] flex flex-col mt-4 lg:mt-0">
            {/* Accordion items */}
            <div
              className="flex flex-col mt-2"
              style={{ borderTop: '1px solid rgba(201,184,168,0.45)' }}
            >
              {faqList.map((faq, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <div
                    key={faq.number || idx}
                    className="faq-item"
                    style={{
                      borderBottom: '1px solid rgba(201,184,168,0.45)',
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                      transition: `opacity 0.6s ease ${0.1 + idx * 0.08}s, transform 0.6s ease ${0.1 + idx * 0.08}s`,
                    }}
                  >
                    <div
                      className="relative"
                      style={{
                        background: isOpen ? '#EDE2D0' : 'transparent',
                        borderRadius: isOpen ? '3px' : '0px',
                        margin: isOpen ? '6px 0' : '0',
                        padding: isOpen ? '2px 14px 6px' : '0',
                        transition: 'background 0.35s ease, padding 0.35s ease',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Question row */}
                      <button
                        type="button"
                        onClick={() => toggle(idx)}
                        className="w-full flex items-center gap-3 sm:gap-5 py-4 sm:py-[18px] text-left cursor-pointer group"
                        aria-expanded={isOpen}
                      >
                        {/* Number */}
                        <span
                          className="shrink-0 select-none"
                          style={{
                            fontFamily: "'Playfair Display', Didot, serif",
                            fontSize: 'clamp(1.2rem, 2vw, 1.8rem)',
                            fontWeight: 600,
                            fontStyle: 'italic',
                            color: isOpen ? primaryColor : `${primaryColor}CC`,
                            transition: 'color 0.3s ease',
                            minWidth: '32px',
                          }}
                        >
                          {faq.number}
                        </span>

                        {/* Thin vertical divider */}
                        <div
                          className="shrink-0 hidden sm:block"
                          style={{
                            width: '1.5px',
                            height: '22px',
                            background: isOpen ? primaryColor : 'rgba(201,184,168,0.45)',
                            transition: 'background 0.3s ease',
                          }}
                        />

                        {/* Question text */}
                        {showEditControls ? (
                          <input
                            type="text"
                            value={faq.question}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleUpdateItem(idx, 'question', e.target.value)}
                            className="flex-1 bg-white/70 border-b px-1 focus:outline-none text-xs sm:text-sm font-medium"
                            style={{
                              fontFamily: "'Playfair Display', Didot, serif",
                              color: primaryColor,
                              borderColor: `${primaryColor}66`,
                            }}
                          />
                        ) : (
                          <span
                            className="flex-1 transition-colors duration-300 pr-2"
                            style={{
                              fontFamily: "'Playfair Display', Didot, serif",
                              fontWeight: 500,
                              fontSize: 'clamp(0.9rem, 1.3vw, 1.1rem)',
                              color: isOpen ? primaryColor : '#2B2422',
                            }}
                          >
                            {faq.question}
                          </span>
                        )}

                        {/* Toggle icon */}
                        <span
                          className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300"
                          style={{
                            border: isOpen ? `1.5px solid ${primaryColor}` : `1.5px solid ${primaryColor}80`,
                            color: primaryColor,
                            background: 'transparent',
                          }}
                        >
                          {isOpen ? <Minus size={14} strokeWidth={2.2} /> : <Plus size={14} strokeWidth={2.2} />}
                        </span>
                      </button>

                      {/* Answer (animated) */}
                      <div
                        className="overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        style={{
                          maxHeight: isOpen ? '240px' : '0px',
                          opacity: isOpen ? 1 : 0,
                        }}
                      >
                        <div className="relative pb-4 sm:pb-5 pl-2 sm:pl-[52px] pr-4 sm:pr-12">
                          {showEditControls ? (
                            <textarea
                              value={faq.answer}
                              onChange={(e) => handleUpdateItem(idx, 'answer', e.target.value)}
                              rows={3}
                              className="w-full text-[#5C524E] leading-relaxed text-xs sm:text-sm bg-white/80 border border-[#7A2430]/30 rounded p-1.5 focus:outline-none"
                            />
                          ) : (
                            <p
                              className="text-[#5C524E] leading-relaxed text-xs sm:text-sm"
                              style={{
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                fontWeight: 400,
                              }}
                            >
                              {faq.answer}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Bottom bar: Still have questions? ── */}
            <div
              className="mt-6 sm:mt-7 flex flex-wrap items-center gap-3 sm:gap-4"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(15px)',
                transition: 'opacity 0.7s ease 0.8s, transform 0.7s ease 0.8s',
              }}
            >
              {/* Question mark circle */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ border: '1.5px solid rgba(122,36,48,0.5)', color: '#7A2430' }}
              >
                <HelpCircle size={14} strokeWidth={2} />
              </div>

              {/* "Still have questions?" script */}
              <p
                className="text-[#7A2430] text-lg sm:text-xl select-none"
                style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
              >
                Still have questions?
              </p>

              {/* Vertical divider */}
              <div
                className="hidden sm:block"
                style={{ width: '1px', height: '20px', background: 'rgba(201,184,168,0.5)' }}
              />

              {/* Helper text */}
              <span
                className="text-[#2B2422] text-xs sm:text-sm font-medium"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                We're here to help!
              </span>

              {/* Contact Us link */}
              <a
                href="#contact"
                className="group inline-flex items-center gap-2 text-[#1A1210] text-xs sm:text-sm font-semibold tracking-wide underline underline-offset-4 decoration-[#1A1210]/40 hover:decoration-[#4A121B] hover:text-[#4A121B] transition-all duration-300"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Contact Us
                <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform duration-300" />
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default FaqSection;
