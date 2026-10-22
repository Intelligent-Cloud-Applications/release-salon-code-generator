import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Phone, Mail, ArrowRight, Plus, Trash2, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { gsap, prefersReducedMotion } from '../lib/gsapSetup';
import { useSiteData } from '../context/SiteContext';

/* ── tiny SVG icons ── */
const InstagramIcon = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const FacebookIcon = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const PinterestIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
  </svg>
);

const YoutubeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const TwitterIcon = ({ size = 15, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedinIcon = ({ size = 15, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

const renderSocialIcon = (platform, size = 15) => {
  const p = (platform || '').toLowerCase();
  if (p.includes('insta')) return <InstagramIcon size={size} />;
  if (p.includes('face')) return <FacebookIcon size={size} />;
  if (p.includes('pin')) return <PinterestIcon />;
  if (p.includes('you') || p.includes('yt')) return <YoutubeIcon />;
  if (p.includes('twit') || p.includes('x')) return <TwitterIcon size={size} />;
  if (p.includes('link')) return <LinkedinIcon size={size} />;
  return <ExternalLink size={size} />;
};

const LeafIcon = ({ color = '#C9A96E' }) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 44 C24 36, 22 28, 24 20 C26 12, 24 6, 24 2" stroke={color} strokeWidth="1" fill="none" />
    <path d="M24 34 C18 32, 12 28, 10 22 C9 17, 14 14, 18 17 C21 19, 23 26, 24 32" stroke={color} strokeWidth="0.7" fill={color} fillOpacity="0.15" />
    <path d="M24 24 C19 21, 14 16, 15 10 C15.5 6, 20 6, 22 10 C23 13, 24 19, 24 23" stroke={color} strokeWidth="0.7" fill={color} fillOpacity="0.12" />
    <path d="M24 30 C30 28, 36 24, 38 18 C39 14, 34 11, 30 14 C27 16, 25 24, 24 28" stroke={color} strokeWidth="0.7" fill={color} fillOpacity="0.15" />
    <path d="M24 20 C28 17, 34 12, 33 7 C32.5 4, 28 4, 26 7 C25 10, 24 16, 24 19" stroke={color} strokeWidth="0.7" fill={color} fillOpacity="0.12" />
  </svg>
);

const SparkleIcon = ({ className = '', size = 16, color = '#C9A96E' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M8 0L9.2 5.8L15 4.5L10.5 8L15 11.5L9.2 10.2L8 16L6.8 10.2L1 11.5L5.5 8L1 4.5L6.8 5.8L8 0Z" fill={color} fillOpacity="0.5" />
  </svg>
);

/* ── Editable Link Column Subcomponent ── */
const EditableLinkColumn = ({
  title,
  onTitleChange,
  links,
  onLinksChange,
  defaultNewHref = '#',
  showEditControls,
  goldColor = '#D4A574',
}) => {
  return (
    <div>
      {showEditControls ? (
        <div className="mb-3">
          <label
            className="text-[10px] tracking-wider uppercase block mb-0.5 font-medium"
            style={{ color: `${goldColor}CC` }}
          >
            Column Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full tracking-[0.18em] uppercase bg-white/10 hover:bg-white/15 focus:bg-white/20 border-b-2 px-1.5 py-1 text-xs font-bold text-[#F6EFE5] focus:outline-none transition-colors rounded-t"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              borderColor: goldColor,
            }}
          />
        </div>
      ) : (
        <h4
          className="mb-5 tracking-[0.18em] uppercase select-none"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700,
            fontSize: '0.72rem',
            color: goldColor,
          }}
        >
          {title}
        </h4>
      )}

      {showEditControls ? (
        <div className="flex flex-col gap-2">
          {links.map((link, idx) => (
            <div
              key={idx}
              className="group/link relative flex flex-col gap-1 p-2 rounded-lg bg-black/40 border transition-all shadow-sm"
              style={{ borderColor: `${goldColor}40` }}
            >
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={link.label || ''}
                  onChange={(e) => {
                    const updated = [...links];
                    updated[idx] = { ...updated[idx], label: e.target.value };
                    onLinksChange(updated);
                  }}
                  placeholder="Link Title (e.g. Services)"
                  className="flex-1 bg-white/10 hover:bg-white/15 focus:bg-white/20 border-b border-white/20 px-1.5 py-0.5 text-xs text-[#F6EFE5] font-medium focus:outline-none rounded-t"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    borderColor: `${goldColor}60`,
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const updated = links.filter((_, i) => i !== idx);
                    onLinksChange(updated);
                  }}
                  className="p-1 rounded text-red-400/60 hover:text-red-400 hover:bg-red-500/15 transition cursor-pointer"
                  title="Remove this link"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <div className="flex items-center gap-1.5 mt-0.5">
                <LinkIcon size={11} className="shrink-0 ml-1" style={{ color: goldColor }} />
                <input
                  type="text"
                  value={link.href || ''}
                  onChange={(e) => {
                    const updated = [...links];
                    updated[idx] = { ...updated[idx], href: e.target.value };
                    onLinksChange(updated);
                  }}
                  placeholder="Path URL (e.g. #services, /page)"
                  className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/15 border-b px-1 py-0.5 text-[11px] font-mono focus:outline-none rounded-t"
                  style={{
                    color: goldColor,
                    borderColor: `${goldColor}40`,
                  }}
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => {
              onLinksChange([...links, { label: 'New Link', href: defaultNewHref }]);
            }}
            className="mt-1 py-1.5 px-3 border border-dashed rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-98"
            style={{
              borderColor: `${goldColor}80`,
              color: goldColor,
              backgroundColor: `${goldColor}15`,
            }}
          >
            <Plus size={13} />
            <span>Add Link</span>
          </button>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {links.map((link, idx) => (
            <li key={link.label ? `${link.label}-${idx}` : idx}>
              <a
                href={link.href || '#'}
                target={link.href?.startsWith('http') ? '_blank' : '_self'}
                rel={link.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="footer-link inline-block transition-transform hover:translate-x-1"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '0.82rem',
                  fontWeight: 400,
                  color: 'rgba(201,184,168,0.65)',
                }}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const Footer = ({
  isEdit = false,
  isPreviewMode = false,
  onUpdateField,
}) => {
  const siteData = useSiteData();
  const [email, setEmail] = useState('');
  const rootRef = useRef(null);

  const theme = siteData?.theme || {};
  const primaryColor = theme.primary || '#4A121B';
  const goldColor = theme.gold || '#C9A96E';
  const darkBg = theme.darkBg || '#1A0A0E';

  const footerData = siteData?.footer || {};
  const footerColumns = footerData.columns || {};

  const logoTitle = footerData.logoTitle || 'TEKKZY';
  const logoSubtitle = footerData.logoSubtitle || 'Salon';
  const description =
    footerData.description ||
    'Where beauty meets expertise. We bring out the best in you with care, passion and perfection.';

  // Column 2: Explore
  const exploreTitle = footerColumns.explore?.title || 'Explore';
  const exploreLinks = footerColumns.explore?.links || [
    { label: 'Home', href: '#' },
    { label: 'About Us', href: '#about' },
    { label: 'Services', href: '#services' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'Our Experts', href: '#experts' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'Blog', href: '#blog' },
    { label: 'Contact Us', href: '#contact' },
  ];

  // Column 3: Our Services
  const servicesTitle = footerColumns.services?.title || 'Our Services';
  const servicesLinks = footerColumns.services?.links || [
    { label: 'Hair Care', href: '#services' },
    { label: 'Skin Care', href: '#services' },
    { label: 'Makeup Studio', href: '#services' },
    { label: 'Nail Bar', href: '#services' },
    { label: 'Bridal Services', href: '#services' },
    { label: 'Spa & Relaxation', href: '#services' },
    { label: 'Packages & Offers', href: '#services' },
  ];

  // Column 4: Quick Links
  const quickLinksTitle = footerColumns.quickLinks?.title || 'Quick Links';
  const quickLinks = footerColumns.quickLinks?.links || [
    { label: 'Book Appointment', href: '#home' },
    { label: 'Gift Cards', href: '#contact' },
    { label: 'Membership', href: '#services' },
    { label: 'FAQs', href: '#faq' },
    { label: 'Cancellation Policy', href: '#faq' },
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms & Conditions', href: '#' },
  ];

  // Column 5: Get In Touch & Follow Us
  const contactTitle = footerColumns.contact?.title || 'Get In Touch';
  const socialTitle = footerColumns.social?.title || 'Follow Us';
  const socialLinks = footerColumns.social?.links || [
    { platform: 'facebook', label: 'Facebook', url: 'https://facebook.com' },
    { platform: 'instagram', label: 'Instagram', url: 'https://instagram.com' },
    { platform: 'pinterest', label: 'Pinterest', url: 'https://pinterest.com' },
    { platform: 'youtube', label: 'YouTube', url: 'https://youtube.com' },
  ];

  const footerAddress =
    footerData.contact?.address ||
    siteData?.site?.contact?.address ||
    '428 Luxury Lane, Couture Avenue, Suite 100, New York, NY 10021';
  const footerPhone =
    footerData.contact?.phone ||
    siteData?.site?.contact?.phone ||
    '+1 (555) 019-2834';
  const footerEmail =
    footerData.contact?.email ||
    siteData?.site?.contact?.email ||
    siteData?.site?.contactMail ||
    'concierge@tekkzy-salon.com';
  const instagramHandle = footerData.contact?.instagram || '@tekkzy.salon';

  const newsletterTitle = footerData.newsletterTitle || 'STAY BEAUTIFUL, STAY UPDATED.';
  const newsletterDesc =
    footerData.newsletterDescription ||
    'Subscribe to our newsletter and get exclusive offers & beauty tips.';
  const copyright = footerData.copyright || '© 2024 Tekkzy Salon. All Rights Reserved.';
  const bottomTagline =
    footerData.bottomTagline ||
    'Expert care. Premium products. Your satisfaction.';

  const showEditControls = isEdit && !isPreviewMode;

  /* ── GSAP: columns rise in as the footer scrolls into view ── */
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.from('.ft-grid > *', {
        opacity: 0,
        y: 40,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: rootRef.current, start: 'top 88%', once: true },
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer
      ref={rootRef}
      id="footer"
      className="relative w-full transition-colors duration-500"
      style={{
        background: `radial-gradient(ellipse at 50% 0%, ${primaryColor}40 0%, ${darkBg} 55%, #050505 100%)`,
        backgroundColor: darkBg,
      }}
    >
      {/* ── Top gold line ── */}
      <div
        style={{
          width: '100%',
          height: '1px',
          background: `linear-gradient(90deg, transparent 5%, ${goldColor}4D 25%, ${goldColor}80 50%, ${goldColor}4D 75%, transparent 95%)`,
        }}
      />

      {/* ══════ MAIN FOOTER CONTENT ══════ */}
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 md:px-14 lg:px-20 pt-12 sm:pt-14 md:pt-16 pb-8">

        {/* Inline Footer Theme & Palette Tuning Bar (in Edit Mode) */}
        {showEditControls && (
          <div
            className="mb-8 p-3.5 sm:p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 border shadow-xl backdrop-blur-md"
            style={{
              backgroundColor: `${darkBg}F2`,
              borderColor: `${goldColor}55`,
            }}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="w-3 h-3 rounded-full animate-pulse"
                style={{ backgroundColor: goldColor }}
              />
              <span className="text-xs font-bold uppercase tracking-wider text-[#F6EFE5]">
                Footer Color Customizer
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <label className="flex items-center gap-2 text-xs text-[#EFE6D5] font-semibold cursor-pointer">
                <span>Footer Background:</span>
                <input
                  type="color"
                  value={darkBg}
                  onChange={(e) => onUpdateField?.('theme.darkBg', e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <span className="font-mono text-[11px]" style={{ color: goldColor }}>
                  {darkBg}
                </span>
              </label>

              <label className="flex items-center gap-2 text-xs text-[#EFE6D5] font-semibold cursor-pointer">
                <span>Gold Accent:</span>
                <input
                  type="color"
                  value={goldColor}
                  onChange={(e) => onUpdateField?.('theme.gold', e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <span className="font-mono text-[11px]" style={{ color: goldColor }}>
                  {goldColor}
                </span>
              </label>
            </div>
          </div>
        )}

        {/* ── 5-column grid ── */}
        <div className="ft-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-6">

          {/* ──── Column 1: Logo & tagline ──── */}
          <div className="col-span-2 sm:col-span-1 lg:col-span-1">
            <div className="relative inline-block">
              <SparkleIcon className="absolute -top-2 -right-1" size={10} color={goldColor} />
              <LeafIcon color={goldColor} />
            </div>

            {/* Logo Title */}
            {showEditControls ? (
              <div className="mt-2">
                <label
                  className="text-[10px] tracking-wider uppercase block mb-0.5 font-medium"
                  style={{ color: `${goldColor}CC` }}
                >
                  Brand Title
                </label>
                <input
                  type="text"
                  value={logoTitle}
                  onChange={(e) => onUpdateField?.('footer.logoTitle', e.target.value)}
                  className="bg-white/10 hover:bg-white/15 focus:bg-white/20 border-b-2 px-1 text-xl font-bold uppercase tracking-widest text-[#F6EFE5] focus:outline-none w-full rounded-t"
                  style={{
                    fontFamily: "'Playfair Display', Didot, serif",
                    borderColor: goldColor,
                  }}
                />
              </div>
            ) : (
              <h3
                className="mt-2 select-none"
                style={{
                  fontFamily: "'Playfair Display', Didot, serif",
                  fontWeight: 700,
                  fontSize: '1.6rem',
                  lineHeight: 1.1,
                  color: '#F6EFE5',
                  letterSpacing: '0.08em',
                }}
              >
                {logoTitle}
              </h3>
            )}

            {/* Logo Subtitle */}
            {showEditControls ? (
              <div className="mt-2">
                <label
                  className="text-[10px] tracking-wider uppercase block mb-0.5 font-medium"
                  style={{ color: `${goldColor}CC` }}
                >
                  Script Subtitle
                </label>
                <input
                  type="text"
                  value={logoSubtitle}
                  onChange={(e) => onUpdateField?.('footer.logoSubtitle', e.target.value)}
                  className="bg-white/10 hover:bg-white/15 focus:bg-white/20 border-b-2 px-1 text-2xl focus:outline-none w-full rounded-t"
                  style={{
                    fontFamily: "'Alex Brush', 'Great Vibes', cursive",
                    borderColor: goldColor,
                    color: goldColor,
                  }}
                />
              </div>
            ) : (
              <p
                className="select-none"
                style={{
                  fontFamily: "'Alex Brush', 'Great Vibes', cursive",
                  fontSize: '1.8rem',
                  color: goldColor,
                  lineHeight: 1,
                  marginTop: '-2px',
                }}
              >
                {logoSubtitle}
              </p>
            )}

            {/* Tagline / Description */}
            {showEditControls ? (
              <div className="mt-3">
                <label
                  className="text-[10px] tracking-wider uppercase block mb-0.5 font-medium"
                  style={{ color: `${goldColor}CC` }}
                >
                  Brand Story
                </label>
                <textarea
                  value={description}
                  onChange={(e) => onUpdateField?.('footer.description', e.target.value)}
                  rows={3}
                  className="leading-relaxed text-xs text-[#EFE6D5] bg-white/10 hover:bg-white/15 focus:bg-white/20 border rounded p-2 focus:outline-none w-full"
                  style={{ borderColor: `${goldColor}40` }}
                />
              </div>
            ) : (
              <p
                className="mt-4 leading-relaxed"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '0.78rem',
                  color: 'rgba(201,184,168,0.6)',
                  maxWidth: '200px',
                }}
              >
                {description}
              </p>
            )}
          </div>

          {/* ──── Column 2: Explore (Editable links & path) ──── */}
          <EditableLinkColumn
            title={exploreTitle}
            onTitleChange={(val) => onUpdateField?.('footer.columns.explore.title', val)}
            links={exploreLinks}
            onLinksChange={(links) => onUpdateField?.('footer.columns.explore.links', links)}
            defaultNewHref="#"
            showEditControls={showEditControls}
            goldColor={goldColor}
          />

          {/* ──── Column 3: Our Services (Editable links & path) ──── */}
          <EditableLinkColumn
            title={servicesTitle}
            onTitleChange={(val) => onUpdateField?.('footer.columns.services.title', val)}
            links={servicesLinks}
            onLinksChange={(links) => onUpdateField?.('footer.columns.services.links', links)}
            defaultNewHref="#services"
            showEditControls={showEditControls}
            goldColor={goldColor}
          />

          {/* ──── Column 4: Quick Links (Editable links & path) ──── */}
          <EditableLinkColumn
            title={quickLinksTitle}
            onTitleChange={(val) => onUpdateField?.('footer.columns.quickLinks.title', val)}
            links={quickLinks}
            onLinksChange={(links) => onUpdateField?.('footer.columns.quickLinks.links', links)}
            defaultNewHref="#"
            showEditControls={showEditControls}
            goldColor={goldColor}
          />

          {/* ──── Column 5: Get in Touch + Follow Us ──── */}
          <div>
            {/* Get In Touch Header */}
            {showEditControls ? (
              <div className="mb-3">
                <label
                  className="text-[10px] tracking-wider uppercase block mb-0.5 font-medium"
                  style={{ color: `${goldColor}CC` }}
                >
                  Column Title
                </label>
                <input
                  type="text"
                  value={contactTitle}
                  onChange={(e) => onUpdateField?.('footer.columns.contact.title', e.target.value)}
                  className="w-full tracking-[0.18em] uppercase bg-white/10 hover:bg-white/15 focus:bg-white/20 border-b-2 px-1.5 py-1 text-xs font-bold text-[#F6EFE5] focus:outline-none transition-colors rounded-t"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    borderColor: goldColor,
                  }}
                />
              </div>
            ) : (
              <h4
                className="mb-5 tracking-[0.18em] uppercase select-none"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  color: goldColor,
                }}
              >
                {contactTitle}
              </h4>
            )}

            <ul className="flex flex-col gap-3.5">
              {/* Address */}
              <li className="flex items-start gap-2.5">
                <MapPin size={14} className="shrink-0 mt-0.5" style={{ color: goldColor }} />
                {showEditControls ? (
                  <input
                    type="text"
                    value={footerAddress}
                    onChange={(e) => onUpdateField?.('footer.contact.address', e.target.value)}
                    placeholder="Address"
                    className="bg-white/10 hover:bg-white/15 focus:bg-white/20 border-b text-xs text-[#EFE6D5] px-1.5 py-0.5 focus:outline-none w-full rounded-t"
                    style={{ borderColor: `${goldColor}50` }}
                  />
                ) : (
                  <span
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '0.82rem',
                      color: 'rgba(201,184,168,0.65)',
                      lineHeight: 1.5,
                    }}
                  >
                    {footerAddress}
                  </span>
                )}
              </li>

              {/* Phone */}
              <li className="flex items-center gap-2.5">
                <Phone size={14} className="shrink-0" style={{ color: goldColor }} />
                {showEditControls ? (
                  <input
                    type="text"
                    value={footerPhone}
                    onChange={(e) => onUpdateField?.('footer.contact.phone', e.target.value)}
                    placeholder="Phone"
                    className="bg-white/10 hover:bg-white/15 focus:bg-white/20 border-b text-xs text-[#EFE6D5] px-1.5 py-0.5 focus:outline-none w-full rounded-t"
                    style={{ borderColor: `${goldColor}50` }}
                  />
                ) : (
                  <span
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '0.82rem',
                      color: 'rgba(201,184,168,0.65)',
                    }}
                  >
                    {footerPhone}
                  </span>
                )}
              </li>

              {/* Email */}
              <li className="flex items-center gap-2.5">
                <Mail size={14} className="shrink-0" style={{ color: goldColor }} />
                {showEditControls ? (
                  <input
                    type="text"
                    value={footerEmail}
                    onChange={(e) => onUpdateField?.('footer.contact.email', e.target.value)}
                    placeholder="Email"
                    className="bg-white/10 hover:bg-white/15 focus:bg-white/20 border-b text-xs text-[#EFE6D5] px-1.5 py-0.5 focus:outline-none w-full rounded-t"
                    style={{ borderColor: `${goldColor}50` }}
                  />
                ) : (
                  <span
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '0.82rem',
                      color: 'rgba(201,184,168,0.65)',
                    }}
                  >
                    {footerEmail}
                  </span>
                )}
              </li>

              {/* Instagram handle */}
              <li className="flex items-center gap-2.5">
                <InstagramIcon size={14} className="shrink-0" style={{ color: goldColor }} />
                {showEditControls ? (
                  <input
                    type="text"
                    value={instagramHandle}
                    onChange={(e) => onUpdateField?.('footer.contact.instagram', e.target.value)}
                    placeholder="Instagram handle"
                    className="bg-white/10 hover:bg-white/15 focus:bg-white/20 border-b text-xs text-[#EFE6D5] px-1.5 py-0.5 focus:outline-none w-full rounded-t"
                    style={{ borderColor: `${goldColor}50` }}
                  />
                ) : (
                  <span
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '0.82rem',
                      color: 'rgba(201,184,168,0.65)',
                    }}
                  >
                    {instagramHandle}
                  </span>
                )}
              </li>
            </ul>

            {/* Follow Us Header */}
            {showEditControls ? (
              <div className="mt-6 mb-3">
                <label
                  className="text-[10px] tracking-wider uppercase block mb-0.5 font-medium"
                  style={{ color: `${goldColor}CC` }}
                >
                  Social Column Title
                </label>
                <input
                  type="text"
                  value={socialTitle}
                  onChange={(e) => onUpdateField?.('footer.columns.social.title', e.target.value)}
                  className="w-full tracking-[0.18em] uppercase bg-white/10 hover:bg-white/15 focus:bg-white/20 border-b-2 px-1.5 py-1 text-xs font-bold text-[#F6EFE5] focus:outline-none transition-colors rounded-t"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    borderColor: goldColor,
                  }}
                />
              </div>
            ) : (
              <h4
                className="mt-6 mb-3 tracking-[0.18em] uppercase select-none"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  color: goldColor,
                }}
              >
                {socialTitle}
              </h4>
            )}

            {/* Follow Us Social Links */}
            {showEditControls ? (
              <div className="flex flex-col gap-2 mt-2">
                {socialLinks.map((social, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-1.5 p-2 rounded-lg bg-black/40 border transition-all shadow-sm"
                    style={{ borderColor: `${goldColor}40` }}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 flex items-center justify-center shrink-0" style={{ color: goldColor }}>
                        {renderSocialIcon(social.platform || social.label, 13)}
                      </div>
                      <select
                        value={social.platform || 'instagram'}
                        onChange={(e) => {
                          const updated = [...socialLinks];
                          updated[idx] = {
                            ...updated[idx],
                            platform: e.target.value,
                            label: e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1),
                          };
                          onUpdateField?.('footer.columns.social.links', updated);
                        }}
                        className="border text-xs text-[#F6EFE5] px-1.5 py-0.5 rounded focus:outline-none flex-1"
                        style={{
                          backgroundColor: `${darkBg}`,
                          borderColor: `${goldColor}40`,
                        }}
                      >
                        <option value="instagram">Instagram</option>
                        <option value="facebook">Facebook</option>
                        <option value="pinterest">Pinterest</option>
                        <option value="youtube">YouTube</option>
                        <option value="twitter">Twitter / X</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="website">Custom Link</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = socialLinks.filter((_, i) => i !== idx);
                          onUpdateField?.('footer.columns.social.links', updated);
                        }}
                        className="p-1 rounded text-red-400/60 hover:text-red-400 hover:bg-red-500/15 transition cursor-pointer"
                        title="Remove social link"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <LinkIcon size={11} className="shrink-0 ml-1" style={{ color: goldColor }} />
                      <input
                        type="text"
                        value={social.url || ''}
                        onChange={(e) => {
                          const updated = [...socialLinks];
                          updated[idx] = { ...updated[idx], url: e.target.value };
                          onUpdateField?.('footer.columns.social.links', updated);
                        }}
                        placeholder="Profile URL (e.g. https://...)"
                        className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/15 border-b px-1 py-0.5 text-[11px] font-mono focus:outline-none rounded-t"
                        style={{
                          color: goldColor,
                          borderColor: `${goldColor}40`,
                        }}
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    onUpdateField?.('footer.columns.social.links', [
                      ...socialLinks,
                      { platform: 'instagram', label: 'Instagram', url: 'https://instagram.com' },
                    ]);
                  }}
                  className="mt-1 py-1.5 px-3 border border-dashed rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-98"
                  style={{
                    borderColor: `${goldColor}80`,
                    color: goldColor,
                    backgroundColor: `${goldColor}15`,
                  }}
                >
                  <Plus size={13} />
                  <span>Add Social Link</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {socialLinks.map((social, idx) => (
                  <a
                    key={idx}
                    href={social.url || '#'}
                    target={social.url?.startsWith('http') ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    aria-label={social.label || social.platform}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer"
                    style={{
                      border: `1px solid ${goldColor}4D`,
                      color: 'rgba(201,184,168,0.6)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = goldColor;
                      e.currentTarget.style.color = goldColor;
                      e.currentTarget.style.backgroundColor = `${goldColor}14`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = `${goldColor}4D`;
                      e.currentTarget.style.color = 'rgba(201,184,168,0.6)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {renderSocialIcon(social.platform || social.label, 15)}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ══════ BOTTOM COPYRIGHT BAR ══════ */}
        <div
          className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{
            borderTop: `1px solid ${goldColor}1A`,
          }}
        >
          {showEditControls ? (
            <input
              type="text"
              value={copyright}
              onChange={(e) => onUpdateField?.('footer.copyright', e.target.value)}
              className="text-xs text-[#EFE6D5] bg-white/10 hover:bg-white/15 focus:bg-white/20 border-b border-white/20 px-1 py-0.5 focus:outline-none rounded-t"
            />
          ) : (
            <p
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '0.72rem',
                color: 'rgba(201,184,168,0.4)',
              }}
            >
              {copyright}
            </p>
          )}

          <SparkleIcon size={14} className="hidden sm:block" color={goldColor} />

          <div className="flex items-center gap-2">
            {showEditControls ? (
              <input
                type="text"
                value={bottomTagline}
                onChange={(e) => onUpdateField?.('footer.bottomTagline', e.target.value)}
                className="text-xs text-[#EFE6D5] bg-white/10 hover:bg-white/15 focus:bg-white/20 border-b border-white/20 px-1 py-0.5 focus:outline-none rounded-t"
              />
            ) : (
              <p
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '0.72rem',
                  color: 'rgba(201,184,168,0.4)',
                }}
              >
                {bottomTagline}
              </p>
            )}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={goldColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
