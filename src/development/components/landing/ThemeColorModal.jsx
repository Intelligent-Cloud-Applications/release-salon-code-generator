import React from 'react';
import { X, Check, Sparkles, RefreshCw } from 'lucide-react';

const PRESETS = [
  {
    name: 'Royal Burgundy & Gold',
    icon: '🍷',
    theme: {
      primary: '#4A121B',
      gold: '#D4A574',
      bg: '#F4EDE3',
      darkBg: '#1A0A0E',
      accent: '#63202B',
    },
  },
  {
    name: 'Emerald Sanctuary & Champagne',
    icon: '🌿',
    theme: {
      primary: '#0E3B2E',
      gold: '#D8B480',
      bg: '#F5F3EC',
      darkBg: '#071B14',
      accent: '#184E3F',
    },
  },
  {
    name: 'Velvet Plum & Rose Gold',
    icon: '🍇',
    theme: {
      primary: '#3D1331',
      gold: '#D9A4A1',
      bg: '#F9F3F6',
      darkBg: '#1C0816',
      accent: '#561B46',
    },
  },
  {
    name: 'Noir Haute Couture & Pearl',
    icon: '🖤',
    theme: {
      primary: '#1C1C1C',
      gold: '#C5A059',
      bg: '#FAF9F5',
      darkBg: '#0A0A0A',
      accent: '#333333',
    },
  },
  {
    name: 'Espresso Velvet & Amber',
    icon: '☕',
    theme: {
      primary: '#38231B',
      gold: '#D69F3D',
      bg: '#F7F2EC',
      darkBg: '#1B0F0B',
      accent: '#4D3126',
    },
  },
];

const ThemeColorModal = ({
  isOpen,
  onClose,
  currentTheme = {},
  onUpdateTheme,
}) => {
  if (!isOpen) return null;

  const activeTheme = {
    primary: currentTheme?.primary || '#4A121B',
    gold: currentTheme?.gold || '#D4A574',
    bg: currentTheme?.bg || '#F4EDE3',
    darkBg: currentTheme?.darkBg || '#1A0A0E',
    accent: currentTheme?.accent || '#63202B',
  };

  const handleColorChange = (key, value) => {
    onUpdateTheme({
      ...activeTheme,
      [key]: value,
    });
  };

  const handleApplyPreset = (presetTheme) => {
    onUpdateTheme(presetTheme);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#2B0A0E] text-[#F6EFE5] border-2 border-[#D4A574] rounded-3xl p-6 sm:p-7 shadow-2xl font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#D4A574]/30">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-full bg-[#D4A574]/20 text-[#D4A574]">
              <Sparkles size={18} />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-bold uppercase tracking-wider text-[#F6EFE5]">
                Customize Color Theme
              </h3>
              <p className="text-[11px] text-[#C9B8A8]/70">
                Tailor the luxury palette across all landing page sections
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 1-Click Curated Presets */}
        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[#D4A574] mb-2.5">
            1-Click Luxury Palettes
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRESETS.map((preset) => {
              const isSelected =
                activeTheme.primary.toLowerCase() === preset.theme.primary.toLowerCase() &&
                activeTheme.gold.toLowerCase() === preset.theme.gold.toLowerCase();
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleApplyPreset(preset.theme)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#D4A574]/20 border-[#D4A574] shadow-md'
                      : 'bg-white/5 hover:bg-white/10 border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{preset.icon}</span>
                    <span className="text-xs font-semibold">{preset.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: preset.theme.primary }}
                    />
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: preset.theme.gold }}
                    />
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: preset.theme.bg }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Color Pickers */}
        <div className="mt-6 pt-5 border-t border-[#D4A574]/20">
          <p className="text-xs font-bold uppercase tracking-wider text-[#D4A574] mb-3">
            Custom Hex Color Tuning
          </p>
          <div className="grid grid-cols-2 gap-3.5">
            {/* Primary Accent */}
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/10">
              <input
                type="color"
                value={activeTheme.primary}
                onChange={(e) => handleColorChange('primary', e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <div className="flex-1">
                <span className="text-[10px] uppercase font-bold text-[#C9B8A8] block">Primary Brand</span>
                <span className="text-xs font-mono font-semibold">{activeTheme.primary}</span>
              </div>
            </div>

            {/* Gold Highlight */}
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/10">
              <input
                type="color"
                value={activeTheme.gold}
                onChange={(e) => handleColorChange('gold', e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <div className="flex-1">
                <span className="text-[10px] uppercase font-bold text-[#C9B8A8] block">Gold Accent</span>
                <span className="text-xs font-mono font-semibold">{activeTheme.gold}</span>
              </div>
            </div>

            {/* Canvas BG */}
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/10">
              <input
                type="color"
                value={activeTheme.bg}
                onChange={(e) => handleColorChange('bg', e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <div className="flex-1">
                <span className="text-[10px] uppercase font-bold text-[#C9B8A8] block">Canvas BG</span>
                <span className="text-xs font-mono font-semibold">{activeTheme.bg}</span>
              </div>
            </div>

            {/* Dark Atmosphere */}
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/10">
              <input
                type="color"
                value={activeTheme.darkBg}
                onChange={(e) => handleColorChange('darkBg', e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <div className="flex-1">
                <span className="text-[10px] uppercase font-bold text-[#C9B8A8] block">Dark Footer</span>
                <span className="text-xs font-mono font-semibold">{activeTheme.darkBg}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#D4A574] hover:bg-[#c49666] text-[#191514] font-bold text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

export default ThemeColorModal;
