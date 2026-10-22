import React, { createContext, useContext, useMemo } from 'react';
import Context from '../../Context/Context';
import fallbackData from '../../../operation/landingData.json';

export const deepMerge = (target, source) => {
  if (!source || typeof source !== 'object') return target;
  if (!target || typeof target !== 'object') return source;
  const output = Array.isArray(target) ? [...target] : { ...target };

  Object.keys(source).forEach((key) => {
    const sVal = source[key];
    const tVal = target[key];
    if (sVal === undefined) return;

    if (Array.isArray(sVal)) {
      output[key] = sVal;
    } else if (
      typeof sVal === 'object' &&
      sVal !== null &&
      typeof tVal === 'object' &&
      tVal !== null &&
      !Array.isArray(tVal)
    ) {
      output[key] = deepMerge(tVal, sVal);
    } else {
      output[key] = sVal;
    }
  });

  return output;
};

const isDummyAddress = (a) => !a || a.includes('428 Luxury Lane') || a.includes('New York, NY 10021');
const isDummyPhone = (p) => !p || p.includes('555') || p.includes('+1 (555)');
const isDummyEmail = (e) => !e || e.includes('concierge@tekkzy-salon.com');

/**
 * Merges landing page defaults with existing top-level DynamoDB attributes (outside companyInfo),
 * and layers saved landingPageData customizations on top.
 */
export const mergeWithInstitutionData = (baseDefaults, instData = {}, customLandingData = {}) => {
  const merged = deepMerge(baseDefaults || {}, customLandingData || {});

  // Layer top-level database attributes (strictly OUTSIDE companyInfo map)
  if (instData && typeof instData === 'object') {
    // 1. Company Name (outside companyInfo)
    const dbCompanyName = instData.companyName;
    if (dbCompanyName && typeof dbCompanyName === 'string' && dbCompanyName.trim()) {
      const trimmedName = dbCompanyName.trim();
      if (!merged.site?.name || merged.site.name === 'Tekkzy Salon' || merged.site.name === 'Our Salon') {
        if (!merged.site) merged.site = {};
        merged.site.name = trimmedName;
      }
      if (!merged.navigation?.logo?.text || merged.navigation.logo.text === 'Tekkzy Salon') {
        if (!merged.navigation) merged.navigation = {};
        if (!merged.navigation.logo) merged.navigation.logo = {};
        merged.navigation.logo.text = trimmedName;
      }
      if (!merged.footer?.logoTitle || merged.footer.logoTitle === 'TEKKZY') {
        if (!merged.footer) merged.footer = {};
        merged.footer.logoTitle = trimmedName;
      }
    }

    // 2. Logo Image (outside companyInfo)
    const dbLogo = instData.logoUrl;
    if (dbLogo && typeof dbLogo === 'string' && dbLogo.trim()) {
      const trimmedLogo = dbLogo.trim();
      if (!merged.site?.logoImage) {
        if (!merged.site) merged.site = {};
        merged.site.logoImage = trimmedLogo;
      }
      if (!merged.navigation?.logo?.image) {
        if (!merged.navigation) merged.navigation = {};
        if (!merged.navigation.logo) merged.navigation.logo = {};
        merged.navigation.logo.image = trimmedLogo;
      }
      if (!merged.footer?.logoImage) {
        if (!merged.footer) merged.footer = {};
        merged.footer.logoImage = trimmedLogo;
      }
    }

    // 3. Query Phone Number (outside companyInfo)
    const dbPhone = instData.Query_PhoneNumber || instData.ownerInformation?.phoneNumber;
    if (dbPhone && typeof dbPhone === 'string' && dbPhone.trim()) {
      const trimmedPhone = dbPhone.trim();
      if (isDummyPhone(merged.contact?.info?.phones?.[0])) {
        if (!merged.contact) merged.contact = {};
        if (!merged.contact.info) merged.contact.info = {};
        merged.contact.info.phones = [trimmedPhone];
      }
      if (isDummyPhone(merged.contact?.locationCard?.phone)) {
        if (!merged.contact) merged.contact = {};
        if (!merged.contact.locationCard) merged.contact.locationCard = {};
        merged.contact.locationCard.phone = trimmedPhone;
      }
      if (isDummyPhone(merged.footer?.contact?.phone)) {
        if (!merged.footer) merged.footer = {};
        if (!merged.footer.contact) merged.footer.contact = {};
        merged.footer.contact.phone = trimmedPhone;
      }
    }

    // 4. Query Address (outside companyInfo)
    const dbAddress = instData.Query_Address || instData.ownerInformation?.address;
    if (dbAddress && typeof dbAddress === 'string' && dbAddress.trim()) {
      const trimmedAddress = dbAddress.trim();
      if (isDummyAddress(merged.contact?.info?.address)) {
        if (!merged.contact) merged.contact = {};
        if (!merged.contact.info) merged.contact.info = {};
        merged.contact.info.address = trimmedAddress;
      }
      if (isDummyAddress(merged.contact?.locationCard?.address)) {
        if (!merged.contact) merged.contact = {};
        if (!merged.contact.locationCard) merged.contact.locationCard = {};
        merged.contact.locationCard.address = trimmedAddress;
      }
      if (isDummyAddress(merged.footer?.contact?.address)) {
        if (!merged.footer) merged.footer = {};
        if (!merged.footer.contact) merged.footer.contact = {};
        merged.footer.contact.address = trimmedAddress;
      }
    }

    // 5. Email (outside companyInfo)
    const dbEmail = instData.ownerInformation?.email || instData.email;
    if (dbEmail && typeof dbEmail === 'string' && dbEmail.trim()) {
      const trimmedEmail = dbEmail.trim();
      if (isDummyEmail(merged.contact?.info?.email)) {
        if (!merged.contact) merged.contact = {};
        if (!merged.contact.info) merged.contact.info = {};
        merged.contact.info.email = trimmedEmail;
      }
      if (isDummyEmail(merged.contact?.locationCard?.email)) {
        if (!merged.contact) merged.contact = {};
        if (!merged.contact.locationCard) merged.contact.locationCard = {};
        merged.contact.locationCard.email = trimmedEmail;
      }
      if (isDummyEmail(merged.footer?.contact?.email)) {
        if (!merged.footer) merged.footer = {};
        if (!merged.footer.contact) merged.footer.contact = {};
        merged.footer.contact.email = trimmedEmail;
      }
    }

    // 6. Social Media Links (outside companyInfo)
    if (Array.isArray(instData.socialMediaLinks) && instData.socialMediaLinks.length > 0) {
      const dbLinks = instData.socialMediaLinks
        .filter((s) => s && (s.url || s.link))
        .map((s) => {
          const platform = (s.platform || 'facebook').toLowerCase();
          const label = platform.charAt(0).toUpperCase() + platform.slice(1);
          return { platform, label, url: s.url || s.link };
        });
      const currentLinks = merged.footer?.columns?.social?.links;
      const isDefaultSocial =
        !Array.isArray(currentLinks) ||
        currentLinks.length === 0 ||
        (currentLinks.length === 4 &&
          currentLinks.every((l) =>
            l.url?.includes('facebook.com') ||
            l.url?.includes('instagram.com') ||
            l.url?.includes('pinterest.com') ||
            l.url?.includes('youtube.com')
          ));
      if (isDefaultSocial && dbLinks.length > 0) {
        if (!merged.footer) merged.footer = {};
        if (!merged.footer.columns) merged.footer.columns = {};
        if (!merged.footer.columns.social) merged.footer.columns.social = {};
        merged.footer.columns.social.links = dbLinks;
      }
    }
  }

  return merged;
};

const SiteContext = createContext(null);

export const SiteProvider = ({ children, customData }) => {
  const parentContext = useContext(Context);

  const siteData = useMemo(() => {
    const inst = parentContext?.institutionData || {};
    const remote = customData || parentContext?.landingPageData || inst.landingPageData;
    return mergeWithInstitutionData(fallbackData, inst, remote);
  }, [
    customData,
    parentContext?.landingPageData,
    parentContext?.institutionData,
  ]);

  return (
    <SiteContext.Provider value={{ siteData }}>
      {children}
    </SiteContext.Provider>
  );
};

export const useSiteData = () => {
  const context = useContext(SiteContext);
  return context?.siteData || fallbackData;
};

export default SiteContext;
