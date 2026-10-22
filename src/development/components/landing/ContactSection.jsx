import React, { useEffect, useRef } from 'react';
import { MapPin, Phone, Mail, Clock, Sparkle, ShieldCheck, Car, Wine, Calendar } from 'lucide-react';
import { gsap, prefersReducedMotion } from '../lib/gsapSetup';
import { useSiteData } from '../context/SiteContext';

const ContactSection = ({
  isEdit = false,
  isPreviewMode = false,
  onUpdateField,
}) => {
  const siteData = useSiteData();
  const sectionRef = useRef(null);

  const theme = siteData?.theme || {};
  const primaryColor = theme.primary || '#4A121B';
  const goldColor = theme.gold || '#D4A574';
  const darkBg = theme.darkBg || '#1A0A0E';
  const canvasBg = theme.bg || '#F4EDE3';
  const accentColor = theme.accent || primaryColor;

  const contactData = siteData?.contact || {};
  const scriptLabel = contactData.scriptLabel || 'Get In Touch';
  const sectionTitle = contactData.sectionTitle || 'CONTACT TEKKZY';
  const sectionDesc =
    contactData.sectionDescription ||
    'Whether reserving a private session, inquiring about bridal packages, or consulting with our master stylists, our concierge team is at your service.';

  const info = contactData.info || {};
  const address = info.address || siteData?.site?.contact?.address || '428 Luxury Lane, Couture Avenue, Suite 100, New York, NY 10021';
  const phone1 = info.phones?.[0] || siteData?.site?.contact?.phone || '+1 (555) 019-2834';
  const phone2 = info.phones?.[1] || siteData?.site?.contact?.secondaryPhone || '+1 (555) 987-6543';
  const email = info.email || siteData?.site?.contact?.email || 'concierge@tekkzy-salon.com';

  const showEditControls = isEdit && !isPreviewMode;

  // GSAP entrance animations
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.from(['.cnt-script', '.cnt-title', '.cnt-desc'], {
        opacity: 0,
        y: 30,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 78%',
          once: true,
        },
      });

      gsap.from('.cnt-card', {
        opacity: 0,
        y: 40,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.cnt-grid',
          start: 'top 82%',
          once: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="relative w-full overflow-hidden py-16 sm:py-20 md:py-24"
      style={{ backgroundColor: canvasBg }}
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div
          className="absolute top-1/4 left-10 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: `${primaryColor}26` }}
        />
        <div
          className="absolute bottom-10 right-10 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: `${goldColor}33` }}
        />
      </div>

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 z-10">

        {/* ════════ HEADER SECTION ════════ */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          {showEditControls ? (
            <input
              type="text"
              value={scriptLabel}
              onChange={(e) => onUpdateField?.('contact.scriptLabel', e.target.value)}
              className="cnt-script text-2xl sm:text-3xl md:text-4xl leading-tight mb-1 bg-white/70 border-b px-1 focus:outline-none text-center"
              style={{
                fontFamily: "'Alex Brush', 'Great Vibes', cursive",
                color: accentColor,
                borderColor: accentColor,
              }}
            />
          ) : (
            <p
              className="cnt-script text-2xl sm:text-3xl md:text-4xl leading-tight select-none mb-1"
              style={{
                fontFamily: "'Alex Brush', 'Great Vibes', cursive",
                color: accentColor,
              }}
            >
              {scriptLabel}
            </p>
          )}

          {showEditControls ? (
            <input
              type="text"
              value={sectionTitle}
              onChange={(e) => onUpdateField?.('contact.sectionTitle', e.target.value)}
              className="cnt-title uppercase font-bold tracking-wide text-center w-full bg-white/70 border-b px-1 focus:outline-none"
              style={{
                fontFamily: "'Playfair Display', Didot, serif",
                fontSize: 'clamp(2.2rem, 4.5vw, 4.2rem)',
                lineHeight: 1.05,
                color: primaryColor,
                borderColor: primaryColor,
              }}
            />
          ) : (
            <h2
              className="cnt-title uppercase font-bold tracking-wide select-none"
              style={{
                fontFamily: "'Playfair Display', Didot, serif",
                fontSize: 'clamp(2.2rem, 4.5vw, 4.2rem)',
                lineHeight: 1.05,
                color: primaryColor,
              }}
            >
              {sectionTitle}
            </h2>
          )}

          <div
            className="w-24 sm:w-32 h-[2px] my-4"
            style={{
              background: `linear-gradient(90deg, transparent, ${goldColor}, transparent)`,
            }}
          />

          {showEditControls ? (
            <textarea
              value={sectionDesc}
              onChange={(e) => onUpdateField?.('contact.sectionDescription', e.target.value)}
              rows={2}
              className="cnt-desc text-xs sm:text-sm leading-relaxed px-2 bg-white/70 border border-black/10 rounded p-1.5 focus:outline-none w-full"
            />
          ) : (
            <p
              className="cnt-desc text-[#5C524E] text-xs sm:text-sm md:text-base leading-relaxed px-2"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {sectionDesc}
            </p>
          )}
        </div>

        {/* ════════ MAIN 3-CARD LUXURY SHOWCASE (NO FORM) ════════ */}
        <div className="cnt-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">

          {/* CARD 1: SALON LOCATION & CONCIERGE */}
          <div className="cnt-card bg-white/85 backdrop-blur-md border border-black/5 p-6 sm:p-8 rounded-2xl shadow-lg flex flex-col justify-between hover:shadow-xl transition-shadow">
            <div>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-6 shadow-sm"
                style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
              >
                <MapPin size={22} />
              </div>

              <span
                className="text-[10px] font-bold uppercase tracking-[0.2em] block mb-2"
                style={{ color: goldColor }}
              >
                VISIT THE SANCTUARY
              </span>

              <h3
                className="text-xl sm:text-2xl font-bold uppercase mb-4"
                style={{ fontFamily: "'Playfair Display', Didot, serif", color: primaryColor }}
              >
                Couture Avenue
              </h3>

              <p className="text-xs sm:text-sm text-[#5C524E] leading-relaxed mb-6">
                {address}
              </p>
            </div>

            <div className="pt-4 border-t border-black/5 flex flex-col gap-2.5">
              <div className="flex items-center gap-3 text-xs sm:text-sm text-[#2C2523]">
                <Phone size={15} style={{ color: goldColor }} className="shrink-0" />
                <span className="font-semibold">{phone1}</span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-[#2C2523]">
                <Mail size={15} style={{ color: goldColor }} className="shrink-0" />
                <span className="truncate">{email}</span>
              </div>
            </div>
          </div>

          {/* CARD 2: OPERATING HOURS & RESERVATIONS */}
          <div className="cnt-card bg-white/85 backdrop-blur-md border border-black/5 p-6 sm:p-8 rounded-2xl shadow-lg flex flex-col justify-between hover:shadow-xl transition-shadow">
            <div>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-6 shadow-sm"
                style={{ backgroundColor: `${goldColor}20`, color: goldColor }}
              >
                <Clock size={22} />
              </div>

              <span
                className="text-[10px] font-bold uppercase tracking-[0.2em] block mb-2"
                style={{ color: goldColor }}
              >
                HOURS OF BEAUTY
              </span>

              <h3
                className="text-xl sm:text-2xl font-bold uppercase mb-4"
                style={{ fontFamily: "'Playfair Display', Didot, serif", color: primaryColor }}
              >
                Operating Hours
              </h3>

              <ul className="text-xs sm:text-sm text-[#5C524E] space-y-3 mb-6">
                <li className="flex justify-between items-center pb-2 border-b border-black/5">
                  <span className="font-medium">Monday – Friday</span>
                  <span className="font-semibold text-[#1A1210]">9:00 AM – 8:00 PM</span>
                </li>
                <li className="flex justify-between items-center pb-2 border-b border-black/5">
                  <span className="font-medium">Saturday</span>
                  <span className="font-semibold text-[#1A1210]">9:00 AM – 7:00 PM</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="font-medium">Sunday</span>
                  <span className="font-semibold text-[#1A1210]">10:00 AM – 5:00 PM</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-black/5 flex items-center gap-2 text-xs font-semibold" style={{ color: primaryColor }}>
              <Calendar size={14} style={{ color: goldColor }} />
              <span>Prior appointment recommended for master stylists</span>
            </div>
          </div>

          {/* CARD 3: VIP SANCTUARY AMENITIES */}
          <div
            className="cnt-card relative overflow-hidden p-6 sm:p-8 rounded-2xl shadow-xl text-[#F6EFE5] flex flex-col justify-between"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${darkBg} 100%)`,
              border: `1px solid ${goldColor}40`,
            }}
          >
            <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none">
              <Sparkle size={180} />
            </div>

            <div>
              <span
                className="text-[10px] font-bold tracking-[0.25em] uppercase block mb-2"
                style={{ color: goldColor }}
              >
                BESPOKE EXCELLENCE
              </span>

              <h3
                className="text-xl sm:text-2xl font-serif text-[#F6EFE5] leading-snug mb-4"
                style={{ fontFamily: "'Playfair Display', Didot, serif" }}
              >
                VIP Private Appointments
              </h3>

              <p className="text-xs sm:text-sm text-[#EFE6D5]/80 leading-relaxed mb-6">
                Step into our completely secluded hydrotherapy suites tailored exclusively for you. Soundproof ambient lighting, private consultation, and personalized sensory care.
              </p>
            </div>

            <div
              className="pt-4 border-t flex flex-col gap-2.5 text-xs font-semibold"
              style={{ borderColor: `${goldColor}30`, color: goldColor }}
            >
              <div className="flex items-center gap-2">
                <Car size={14} />
                <span>COMPLIMENTARY VALET PARKING</span>
              </div>
              <div className="flex items-center gap-2">
                <Wine size={14} />
                <span>CHAMPAGNE & CAVIAR INFUSION WELCOME</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default ContactSection;
