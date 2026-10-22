import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import Context from '../../Context/Context';
import { SiteProvider, deepMerge } from '../context/SiteContext';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import ServicesSection from './ServicesSection';
import GallerySection from './GallerySection';
import TestimonialsSection from './TestimonialsSection';
import FaqSection from './FaqSection';
import ContactSection from './ContactSection';
import Footer from './Footer';
import AppointmentModal from './AppointmentModal';
import AdminLiveEditorBar from './AdminLiveEditorBar';
import AdminEditorDrawer from './AdminEditorDrawer';
import ThemeColorModal from './ThemeColorModal';
import ImageUploadModal from '../ui/ImageUploadModal';
import defaultLandingData from '../../../operation/landingData.json';

const setNestedValue = (obj, path, value) => {
  const parts = path.split('.');
  const newObj = JSON.parse(JSON.stringify(obj));
  let curr = newObj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!curr[p]) curr[p] = {};
    curr = curr[p];
  }
  curr[parts[parts.length - 1]] = value;
  return newObj;
};

const LandingHome = () => {
  const {
    landingPageData,
    updateLandingPageData,
    institutionData,
    userData,
  } = useContext(Context);

  const activeSourceData = useMemo(() => {
    return deepMerge(
      defaultLandingData,
      landingPageData || institutionData?.landingPageData || {}
    );
  }, [landingPageData, institutionData?.landingPageData]);

  const [draftData, setDraftData] = useState(() => activeSourceData);
  const [isEdit, setIsEdit] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modals
  const [bookingOpen, setBookingOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [uploadModal, setUploadModal] = useState({
    isOpen: false,
    title: 'Upload Image to S3',
    folderName: 'salon-assets',
    onComplete: null,
  });

  const currentTheme = (isEdit ? draftData : activeSourceData)?.theme || {};
  const canvasBg = currentTheme.bg || '#F4EDE3';

  useEffect(() => {
    const root = document.documentElement;
    if (currentTheme.primary) root.style.setProperty('--color-primary', currentTheme.primary);
    if (currentTheme.gold) root.style.setProperty('--color-gold', currentTheme.gold);
    if (currentTheme.bg) root.style.setProperty('--color-bg', currentTheme.bg);
    if (currentTheme.darkBg) root.style.setProperty('--color-dark-bg', currentTheme.darkBg);
    if (currentTheme.accent) root.style.setProperty('--color-accent', currentTheme.accent);
  }, [
    currentTheme.primary,
    currentTheme.gold,
    currentTheme.bg,
    currentTheme.darkBg,
    currentTheme.accent,
  ]);

  const activeJson = useMemo(() => JSON.stringify(activeSourceData), [activeSourceData]);
  useEffect(() => {
    if (!isEdit) {
      setDraftData(activeSourceData);
    }
  }, [activeJson, isEdit]);

  const handleUpdateField = (path, value) => {
    setDraftData((prev) => setNestedValue(prev, path, value));
  };

  const handleRequestImageUpload = ({ title, folderName, onComplete }) => {
    setUploadModal({
      isOpen: true,
      title: title || 'Upload Image to S3',
      folderName: folderName || 'salon-assets',
      onComplete: (url) => {
        if (onComplete) onComplete(url);
        setUploadModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateLandingPageData(draftData);
      setIsEdit(false);
      setIsPreviewMode(false);
      setDrawerOpen(false);
    } catch (err) {
      console.error('Failed to save website changes to DynamoDB:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDraftData(activeSourceData);
    setIsEdit(false);
    setIsPreviewMode(false);
    setDrawerOpen(false);
  };

  // Admin visibility check:
  // Shows edit button when userType is 'admin', role is 'admin', or explicitly enabled in dev/localStorage
  const isAdmin = Boolean(
    userData?.userType?.toLowerCase() === 'admin' ||
    userData?.role?.toLowerCase() === 'admin' ||
    localStorage.getItem('adminDevBypass') ||
    localStorage.getItem('userType')?.toLowerCase() === 'admin'
  );

  return (
    <SiteProvider customData={isEdit ? draftData : activeSourceData}>
      <div
        className="min-h-screen text-[#191514] flex flex-col justify-between selection:bg-[#4A121B] selection:text-[#F6EFE5] transition-colors duration-500 overflow-x-hidden w-full max-w-[100vw]"
        style={{ backgroundColor: canvasBg }}
      >
        
        {/* Brand Header & Navbar */}
        <Navbar
          isEdit={isEdit}
          isPreviewMode={isPreviewMode}
          onUpdateField={handleUpdateField}
          onRequestImageUpload={handleRequestImageUpload}
        />
        <div className="h-[60px] sm:h-[72px]" />

        {/* 100% EXACT ORIGINAL SECTIONS FROM Templates_Landing_Sites (WITH INLINE EDITABILITY IN EDIT MODE) */}
        <main className="flex-grow flex flex-col">
          <HeroSection
            onOpenBooking={() => setBookingOpen(true)}
            isEdit={isEdit}
            isPreviewMode={isPreviewMode}
            onUpdateField={handleUpdateField}
            onRequestImageUpload={handleRequestImageUpload}
          />
          <ServicesSection
            isEdit={isEdit}
            isPreviewMode={isPreviewMode}
            onUpdateField={handleUpdateField}
            onRequestImageUpload={handleRequestImageUpload}
          />
          <GallerySection
            isEdit={isEdit}
            isPreviewMode={isPreviewMode}
            onUpdateField={handleUpdateField}
            onRequestImageUpload={handleRequestImageUpload}
          />
          <TestimonialsSection
            isEdit={isEdit}
            isPreviewMode={isPreviewMode}
            onUpdateField={handleUpdateField}
            onRequestImageUpload={handleRequestImageUpload}
          />
          <FaqSection
            isEdit={isEdit}
            isPreviewMode={isPreviewMode}
            onUpdateField={handleUpdateField}
            onRequestImageUpload={handleRequestImageUpload}
          />
          <ContactSection
            isEdit={isEdit}
            isPreviewMode={isPreviewMode}
            onUpdateField={handleUpdateField}
          />
        </main>

        {/* 100% EXACT ORIGINAL FOOTER FROM Templates_Landing_Sites (WITH INLINE EDITABILITY IN EDIT MODE) */}
        <Footer
          isEdit={isEdit}
          isPreviewMode={isPreviewMode}
          onUpdateField={handleUpdateField}
        />

        {/* APPOINTMENT BOOKING MODAL */}
        <AppointmentModal
          isOpen={bookingOpen}
          onClose={() => setBookingOpen(false)}
        />

        {/* COLOR THEME CUSTOMIZER MODAL */}
        <ThemeColorModal
          isOpen={themeModalOpen}
          onClose={() => setThemeModalOpen(false)}
          currentTheme={draftData?.theme || activeSourceData?.theme}
          onUpdateTheme={(newTheme) => {
            handleUpdateField('theme', newTheme);
          }}
        />

        {/* S3 IMAGE UPLOAD MODAL */}
        {uploadModal.isOpen && (
          <ImageUploadModal
            onClose={() => setUploadModal((prev) => ({ ...prev, isOpen: false }))}
            onUploadComplete={uploadModal.onComplete}
            folderName={uploadModal.folderName}
            title={uploadModal.title}
          />
        )}

        {/* LUXURY EDIT FLOATING BAR (BOTTOM POSITION, ELEGANT SALON PALETTE, NOT BLACK) */}
        {isAdmin && (
          <AdminLiveEditorBar
            isEdit={isEdit}
            setIsEdit={setIsEdit}
            onSave={handleSave}
            onCancel={handleCancel}
            isSaving={isSaving}
            isPreviewMode={isPreviewMode}
            onTogglePreview={() => setIsPreviewMode(!isPreviewMode)}
            onOpenThemeModal={() => setThemeModalOpen(true)}
          />
        )}

        {/* SLIDE-OVER DRAWER (CAN BE TOGGLED IF ADVANCED CUSTOMIZATION DESIRED) */}
        {isEdit && drawerOpen && (
          <AdminEditorDrawer
            isOpen={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            data={draftData}
            onChangeField={handleUpdateField}
            onRequestImageUpload={handleRequestImageUpload}
            onSave={handleSave}
            isSaving={isSaving}
            onCancel={handleCancel}
          />
        )}
      </div>
    </SiteProvider>
  );
};

export default LandingHome;
