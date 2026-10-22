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
    if (sVal === undefined || sVal === null) return;

    if (Array.isArray(sVal)) {
      output[key] = sVal.length > 0 ? sVal : tVal;
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

const SiteContext = createContext(null);

export const SiteProvider = ({ children, customData }) => {
  const parentContext = useContext(Context);

  const siteData = useMemo(() => {
    if (customData) return deepMerge(fallbackData, customData);
    const remote = parentContext?.landingPageData || parentContext?.institutionData?.landingPageData;
    if (remote) return deepMerge(fallbackData, remote);
    return fallbackData;
  }, [
    customData,
    parentContext?.landingPageData,
    parentContext?.institutionData?.landingPageData,
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
