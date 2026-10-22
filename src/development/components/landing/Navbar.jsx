import React, { useState, useEffect, useRef, useContext } from 'react';
import { X, Menu, Camera, Type, Image as ImageIcon, Lock, LogOut } from 'lucide-react';
import { signOut } from 'aws-amplify/auth';
import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/gsapSetup';
import { useSiteData } from '../context/SiteContext';
import Context from '../../Context/Context';

const Navbar = ({
  isEdit = false,
  isPreviewMode = false,
  onUpdateField,
  onRequestImageUpload,
}) => {
  const siteData = useSiteData();
  const { isAuth, userData } = useContext(Context);
  const [activeTab, setActiveTab] = useState('HOME');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef(null);

  const theme = siteData?.theme || {};
  const primaryColor = theme.primary || '#4A121B';
  const goldColor = theme.gold || '#D4A574';
  const canvasBg = theme.bg || '#F4EDE3';

  const logoText = siteData?.navigation?.logo?.text || siteData?.site?.name || 'Tekkzy Salon';
  const logoImage = siteData?.navigation?.logo?.image || siteData?.site?.logoImage || '';

  const navItems = (siteData?.navigation?.links || [
    { id: 'nav-home', label: 'HOME', url: '#home' },
    { id: 'nav-services', label: 'SERVICES', url: '#services' },
    { id: 'nav-gallery', label: 'GALLERY', url: '#gallery' },
    { id: 'nav-testimonials', label: 'REVIEWS', url: '#testimonials' },
    { id: 'nav-faq', label: 'FAQ', url: '#faq' },
    { id: 'nav-contact', label: 'CONTACT', url: '#contact' },
  ]).filter((item) => item.label?.toUpperCase() !== 'ABOUT');

  // Auth Status & Admin Access
  const isLoggedIn = Boolean(
    isAuth ||
    userData?.id ||
    userData?.email ||
    userData?.userType ||
    localStorage.getItem('token') ||
    localStorage.getItem('adminDevBypass')
  );

  const isAdmin = Boolean(
    userData?.userType?.toLowerCase() === 'admin' ||
    userData?.role?.toLowerCase() === 'admin' ||
    localStorage.getItem('adminDevBypass') ||
    localStorage.getItem('userType')?.toLowerCase() === 'admin'
  );

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error('Sign out error', e);
    } finally {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('adminDevBypass');
        localStorage.removeItem('userType');
        sessionStorage.clear();
      } catch (err) {}
      window.location.replace('/login');
    }
  };

  const showEditControls = isEdit && !isPreviewMode;

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  /* Hide navbar when scrolling down, reveal when scrolling up.
     Disabled while the mobile drawer is open. */
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const header = headerRef.current;
    if (!header) return;

    if (mobileMenuOpen) {
      gsap.set(header, { yPercent: 0 });
      return;
    }

    const showAnim = gsap
      .from(header, { yPercent: -120, paused: true, duration: 0.35, ease: 'power2.out' })
      .progress(1);

    const st = ScrollTrigger.create({
      start: 'top top',
      end: 'max',
      onUpdate: (self) => {
        if (self.direction === -1 || self.scroll() < 90) {
          showAnim.play();
        } else {
          showAnim.reverse();
        }
      },
    });

    return () => {
      st.kill();
      showAnim.kill();
      gsap.set(header, { yPercent: 0 });
    };
  }, [mobileMenuOpen]);

  return (
    <header
      ref={headerRef}
      className="w-full pt-3 sm:pt-4 pb-3 sm:pb-4 px-4 sm:px-8 md:px-12 lg:px-14 flex items-center justify-between z-50 fixed top-0 left-0 right-0 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.06)] transition-all duration-300"
      style={{
        backgroundColor: `${canvasBg}E6`,
        willChange: 'transform',
      }}
    >
      {/* Brand Logo (Supports Image & Text) */}
      <div className="flex items-center gap-3 shrink-0">
        <a href="/" className="flex items-center gap-2">
          {logoImage ? (
            <img
              src={logoImage}
              alt={logoText}
              className="h-8 xs:h-10 sm:h-12 w-auto max-w-[180px] sm:max-w-[220px] object-contain hover:opacity-90 transition-opacity"
            />
          ) : showEditControls ? (
            <input
              type="text"
              value={logoText}
              onChange={(e) => onUpdateField?.('navigation.logo.text', e.target.value)}
              className="font-script text-xl xs:text-2xl sm:text-3xl tracking-wide bg-white/70 border-b-2 px-1 focus:outline-none rounded"
              style={{
                fontFamily: "'Alex Brush', 'Great Vibes', cursive",
                color: primaryColor,
                borderColor: primaryColor,
              }}
            />
          ) : (
            <span
              className="font-script text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-[42px] tracking-wide hover:opacity-90 transition-opacity select-none"
              style={{
                fontFamily: "'Alex Brush', 'Great Vibes', cursive",
                color: primaryColor,
              }}
            >
              {logoText}
            </span>
          )}
        </a>

        {/* Logo controls in Edit Mode */}
        {showEditControls && (
          <div className="flex items-center gap-1.5 ml-1">
            <button
              type="button"
              onClick={() =>
                onRequestImageUpload?.({
                  title: 'Upload Brand Logo Image',
                  folderName: 'logo',
                  onComplete: (url) => onUpdateField?.('navigation.logo.image', url),
                })
              }
              className="p-1.5 rounded-full bg-white/80 hover:bg-white text-xs font-semibold shadow border border-[#D4A574] text-[#191514] flex items-center gap-1 cursor-pointer transition-transform hover:scale-105"
              title="Upload Image Logo to S3"
            >
              <Camera size={13} className="text-[#D4A574]" />
              <span className="text-[10px] hidden md:inline">
                {logoImage ? 'Change Image' : 'Upload Image'}
              </span>
            </button>

            {logoImage && (
              <button
                type="button"
                onClick={() => onUpdateField?.('navigation.logo.image', '')}
                className="p-1.5 rounded-full bg-white/80 hover:bg-white text-xs font-semibold shadow border border-[#D4A574] text-[#191514] flex items-center gap-1 cursor-pointer transition-transform hover:scale-105"
                title="Switch back to Text Logo"
              >
                <Type size={13} className="text-[#D4A574]" />
                <span className="text-[10px] hidden md:inline">Use Text</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Desktop Navigation links — visible only on lg+ */}
      <nav className="hidden lg:flex items-center gap-6 xl:gap-10">
        {navItems.map((item) => {
          const isActive = activeTab === item.label;
          return (
            <a
              key={item.id || item.label}
              href={item.url}
              onClick={(e) => {
                if (item.url.startsWith('#')) {
                  if (window.location.pathname !== '/') {
                    window.location.href = '/' + item.url;
                    return;
                  }
                  e.preventDefault();
                  setActiveTab(item.label);
                  const el = document.querySelector(item.url);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              style={{
                color: isActive ? primaryColor : '#2C2523',
              }}
              className="text-xs font-semibold tracking-[0.2em] transition-all duration-300 relative py-1 hover:opacity-80"
            >
              {item.label}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 w-full h-[1.5px] rounded-full transition-all duration-300"
                  style={{ backgroundColor: primaryColor }}
                />
              )}
            </a>
          );
        })}
      </nav>

      {/* Right Header Controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Login / Dashboard Button: only admin accesses dashboard directly, non-admin gets lock symbol */}
        {!isLoggedIn ? (
          <button
            onClick={() => { window.location.href = '/login'; }}
            style={{ backgroundColor: primaryColor }}
            className="text-[#F6EFE5] text-[10px] sm:text-xs md:text-[13px] font-semibold tracking-[0.14em] sm:tracking-[0.2em] px-4 sm:px-7 py-2 sm:py-2.5 uppercase rounded-md transition-all duration-300 hover:opacity-90 hover:shadow-lg active:scale-95 cursor-pointer whitespace-nowrap shadow-sm"
          >
            LOGIN
          </button>
        ) : isAdmin ? (
          <button
            onClick={() => { window.location.href = '/dashboard'; }}
            style={{ backgroundColor: primaryColor }}
            className="text-[#F6EFE5] text-[10px] sm:text-xs md:text-[13px] font-semibold tracking-[0.14em] sm:tracking-[0.2em] px-4 sm:px-7 py-2 sm:py-2.5 uppercase rounded-md transition-all duration-300 hover:opacity-90 hover:shadow-lg active:scale-95 cursor-pointer whitespace-nowrap shadow-sm"
          >
            DASHBOARD
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { window.location.href = '/dashboard'; }}
              style={{ backgroundColor: `${primaryColor}D9` }}
              className="text-[#F6EFE5] text-[10px] sm:text-xs md:text-[13px] font-semibold tracking-[0.14em] sm:tracking-[0.2em] px-3 sm:px-4 py-2 sm:py-2.5 uppercase rounded-md transition-all duration-300 hover:opacity-90 hover:shadow-lg active:scale-95 cursor-pointer whitespace-nowrap shadow-sm flex items-center gap-1.5 border border-[#D4A574]/40"
              title="Dashboard is restricted to Admin userType only"
            >
              <Lock size={13} className="text-[#D4A574]" />
              <span>DASHBOARD</span>
            </button>
            <button
              onClick={handleLogout}
              className="text-[#191514] hover:text-rose-700 text-[10px] sm:text-xs md:text-[13px] font-semibold tracking-[0.14em] sm:tracking-[0.2em] px-2.5 sm:px-3 py-2 sm:py-2.5 uppercase rounded-md transition-all duration-300 border border-[#191514]/20 hover:border-rose-400 cursor-pointer whitespace-nowrap flex items-center gap-1 bg-white/60 backdrop-blur-sm"
              title="Logout and return to Login"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">LOGOUT</span>
            </button>
          </div>
        )}

        {/* Hamburger Icon — only visible below lg */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-1.5 focus:outline-none hover:opacity-75 transition-opacity cursor-pointer flex items-center justify-center min-w-[40px] min-h-[40px]"
          style={{ color: primaryColor }}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? (
            <X size={26} strokeWidth={1.5} />
          ) : (
            <div className="flex flex-col gap-1.5 w-6 items-end">
              <span className="w-6 h-[2px] transition-all" style={{ backgroundColor: primaryColor }}></span>
              <span className="w-5 h-[2px] transition-all" style={{ backgroundColor: primaryColor }}></span>
              <span className="w-6 h-[2px] transition-all" style={{ backgroundColor: primaryColor }}></span>
            </div>
          )}
        </button>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-x-0 top-full bottom-0 h-[calc(100dvh-100%)] z-50 flex flex-col px-6 sm:px-8 py-6 sm:py-8 lg:hidden border-t shadow-2xl animate-fadeIn overflow-y-auto"
          style={{
            backgroundColor: canvasBg,
            borderColor: `${primaryColor}20`,
          }}
        >
          <nav className="flex flex-col gap-4 sm:gap-6">
            {navItems.map((item) => (
              <a
                key={item.id || item.label}
                href={item.url}
                onClick={(e) => {
                  if (item.url.startsWith('#')) {
                    if (window.location.pathname !== '/') {
                      setMobileMenuOpen(false);
                      window.location.href = '/' + item.url;
                      return;
                    }
                    e.preventDefault();
                    setActiveTab(item.label);
                    setMobileMenuOpen(false);
                    const el = document.querySelector(item.url);
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    setMobileMenuOpen(false);
                  }
                }}
                style={{
                  color: activeTab === item.label ? primaryColor : '#191514',
                  borderColor: `${primaryColor}1A`,
                }}
                className={`text-lg sm:text-xl font-serif tracking-[0.15em] border-b pb-3 ${
                  activeTab === item.label ? 'font-bold' : ''
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Mobile Login / Dashboard CTA */}
          <div className="mt-6 sm:mt-8">
            {!isLoggedIn ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.location.href = '/login';
                }}
                style={{ backgroundColor: primaryColor }}
                className="w-full text-[#F6EFE5] text-xs font-semibold tracking-[0.2em] px-6 py-3.5 uppercase rounded-md transition-all duration-300 hover:opacity-90 cursor-pointer shadow-md"
              >
                LOGIN
              </button>
            ) : isAdmin ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.location.href = '/dashboard';
                }}
                style={{ backgroundColor: primaryColor }}
                className="w-full text-[#F6EFE5] text-xs font-semibold tracking-[0.2em] px-6 py-3.5 uppercase rounded-md transition-all duration-300 hover:opacity-90 cursor-pointer shadow-md"
              >
                DASHBOARD
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    window.location.href = '/dashboard';
                  }}
                  style={{ backgroundColor: `${primaryColor}D9` }}
                  className="w-full text-[#F6EFE5] text-xs font-semibold tracking-[0.2em] px-6 py-3.5 uppercase rounded-md transition-all duration-300 hover:opacity-90 cursor-pointer shadow-md flex items-center justify-center gap-2 border border-[#D4A574]/40"
                  title="Dashboard is restricted to Admin userType only"
                >
                  <Lock size={14} className="text-[#D4A574]" />
                  <span>DASHBOARD (LOCKED)</span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-rose-700 bg-rose-50 border border-rose-200 text-xs font-semibold tracking-[0.2em] px-6 py-3 uppercase rounded-md transition-all duration-300 hover:bg-rose-100 cursor-pointer shadow-sm flex items-center justify-center gap-2"
                >
                  <LogOut size={14} />
                  <span>LOGOUT</span>
                </button>
              </div>
            )}
          </div>

          <div
            className="mt-auto pt-6 border-t flex flex-col gap-2"
            style={{ borderColor: `${primaryColor}1A` }}
          >
            <p
              className="font-script text-2xl sm:text-4xl"
              style={{ color: primaryColor }}
            >
              Beauty. Confidence. You.
            </p>
            <p className="text-[10px] sm:text-xs text-[#5C524E] tracking-wider uppercase">
              HAIR • SKIN • MAKEUP • NAILS
            </p>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
