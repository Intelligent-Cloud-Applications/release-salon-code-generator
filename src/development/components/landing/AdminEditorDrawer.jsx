import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Save, 
  SquareCheck, 
  Loader2, 
  Camera, 
  Sparkles, 
  Layout, 
  Scissors, 
  Image as ImageIcon, 
  Star, 
  HelpCircle, 
  PhoneCall, 
  ChevronRight,
  Minimize2,
  Maximize2
} from 'lucide-react';

const TABS = [
  { id: 'hero', label: 'Hero', icon: Layout },
  { id: 'services', label: 'Services', icon: Scissors },
  { id: 'gallery', label: 'Gallery', icon: ImageIcon },
  { id: 'testimonials', label: 'Reviews', icon: Star },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
  { id: 'contact', label: 'Contact & Footer', icon: PhoneCall },
];

const AdminEditorDrawer = ({
  isOpen,
  onClose,
  data,
  onChangeField,
  onRequestImageUpload,
  onSave,
  isSaving,
  onCancel,
}) => {
  const [activeTab, setActiveTab] = useState('hero');
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isOpen) return null;

  const hero = data?.hero || {};
  const services = data?.services || {};
  const gallery = data?.gallery || {};
  const testimonials = data?.testimonials || {};
  const faq = data?.faq || {};
  const contact = data?.contact || {};
  const footer = data?.footer || {};

  return (
    <div
      className={`fixed z-50 transition-all duration-300 font-sans ${
        isMinimized
          ? 'bottom-6 right-6 w-72'
          : 'top-0 right-0 h-full w-full sm:w-[480px] lg:w-[520px]'
      }`}
    >
      <div className="h-full bg-[#FAF6F0] text-[#191514] border-l border-[#4B080C]/20 shadow-2xl flex flex-col">
        
        {/* HEADER BAR */}
        <div className="px-5 py-4 bg-[#4A121B] text-[#F6EFE5] flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#D4A574] text-[#191514] flex items-center justify-center font-bold text-xs">
              <Sparkles size={14} />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-white tracking-wide">
                Live Website Customizer
              </h3>
              <p className="text-[10px] text-[#D4A574] tracking-wider uppercase">
                Edits Sync to DynamoDB & S3
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 text-stone-300 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
              title={isMinimized ? 'Expand Editor' : 'Minimize Editor'}
            >
              {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-300 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Panel"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MINIMIZED VIEW CONTENT */}
        {isMinimized ? (
          <div className="p-3 bg-[#FAF6F0] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#4A121B]">Panel Minimized</span>
            <button
              onClick={() => setIsMinimized(false)}
              className="text-xs text-[#4A121B] font-bold underline cursor-pointer"
            >
              Open Controls
            </button>
          </div>
        ) : (
          <>
            {/* TABS SELECTOR */}
            <div className="flex border-b border-[#4B080C]/15 bg-[#EFE6D5]/60 overflow-x-auto scrollbar-none px-2 pt-2">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                      isActive
                        ? 'border-[#4A121B] text-[#4A121B] bg-[#FAF6F0] rounded-t-lg font-bold'
                        : 'border-transparent text-stone-600 hover:text-[#4A121B]'
                    }`}
                  >
                    <Icon size={13} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENTS (SCROLLABLE BODY) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
              
              {/* ───────────────── 1. HERO TAB ───────────────── */}
              {activeTab === 'hero' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-[#4A121B] mb-1">
                      Hero Script Accent
                    </label>
                    <input
                      type="text"
                      value={hero.scriptLabel || ''}
                      onChange={(e) => onChangeField('hero.scriptLabel', e.target.value)}
                      className="w-full p-2 bg-white border border-[#4B080C]/20 rounded-lg text-xs"
                      placeholder="e.g. Beauty. Confidence. You."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#4A121B] mb-1">
                        Title Line 1
                      </label>
                      <input
                        type="text"
                        value={hero.titleLines?.[0] || 'TEKKZY'}
                        onChange={(e) =>
                          onChangeField('hero.titleLines', [
                            e.target.value,
                            hero.titleLines?.[1] || 'SALON.',
                          ])
                        }
                        className="w-full p-2 bg-white border border-[#4B080C]/20 rounded-lg text-xs font-serif font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#4A121B] mb-1">
                        Title Line 2
                      </label>
                      <input
                        type="text"
                        value={hero.titleLines?.[1] || 'SALON.'}
                        onChange={(e) =>
                          onChangeField('hero.titleLines', [
                            hero.titleLines?.[0] || 'TEKKZY',
                            e.target.value,
                          ])
                        }
                        className="w-full p-2 bg-white border border-[#4B080C]/20 rounded-lg text-xs font-serif font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#4A121B] mb-1">
                      Hero Description
                    </label>
                    <textarea
                      rows={3}
                      value={hero.description || ''}
                      onChange={(e) => onChangeField('hero.description', e.target.value)}
                      className="w-full p-2 bg-white border border-[#4B080C]/20 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#4A121B] mb-1">
                      Button Label
                    </label>
                    <input
                      type="text"
                      value={hero.primaryAction?.label || 'BOOK APPOINTMENT'}
                      onChange={(e) => onChangeField('hero.primaryAction.label', e.target.value)}
                      className="w-full p-2 bg-white border border-[#4B080C]/20 rounded-lg text-xs"
                    />
                  </div>

                  {/* IMAGES */}
                  <div className="pt-2 border-t border-[#4B080C]/15 space-y-3">
                    <h4 className="font-bold text-[#4A121B] uppercase tracking-wider text-[11px]">
                      Hero Media (Stored in S3)
                    </h4>
                    
                    {/* Model Image */}
                    <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-[#4B080C]/15">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={hero.modelImage || '/assets/model.png'}
                          alt="Model Preview"
                          className="w-10 h-10 object-contain rounded bg-stone-100 border"
                        />
                        <div className="truncate">
                          <p className="font-semibold text-xs text-[#4A121B]">Model Portrait</p>
                          <p className="text-[10px] text-stone-500 truncate max-w-[170px]">
                            {hero.modelImage || './assets/model.png'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          onRequestImageUpload({
                            title: 'Upload Model Portrait to S3',
                            folderName: 'hero',
                            onComplete: (url) => onChangeField('hero.modelImage', url),
                          })
                        }
                        className="px-2.5 py-1.5 bg-[#4A121B] hover:bg-[#611B26] text-white text-[11px] font-semibold rounded flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Camera size={12} />
                        <span>Change</span>
                      </button>
                    </div>

                    {/* Stroke Image */}
                    <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-[#4B080C]/15">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={hero.strokeImage || '/assets/burgundy_dress_stroke.png'}
                          alt="Stroke Preview"
                          className="w-10 h-10 object-contain rounded bg-stone-100 border"
                        />
                        <div className="truncate">
                          <p className="font-semibold text-xs text-[#4A121B]">Background Stroke</p>
                          <p className="text-[10px] text-stone-500 truncate max-w-[170px]">
                            {hero.strokeImage || './assets/burgundy_dress_stroke.png'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          onRequestImageUpload({
                            title: 'Upload Paint Stroke to S3',
                            folderName: 'hero-strokes',
                            onComplete: (url) => onChangeField('hero.strokeImage', url),
                          })
                        }
                        className="px-2.5 py-1.5 bg-[#4A121B] hover:bg-[#611B26] text-white text-[11px] font-semibold rounded flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Camera size={12} />
                        <span>Change</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ───────────────── 2. SERVICES TAB ───────────────── */}
              {activeTab === 'services' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-[#4A121B] mb-1">
                      Section Title
                    </label>
                    <input
                      type="text"
                      value={services.sectionTitle || 'OUR LUXURY SERVICES'}
                      onChange={(e) => onChangeField('services.sectionTitle', e.target.value)}
                      className="w-full p-2 bg-white border border-[#4B080C]/20 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#4A121B] mb-1">
                      Script Accent
                    </label>
                    <input
                      type="text"
                      value={services.scriptLabel || 'Bespoke Offerings'}
                      onChange={(e) => onChangeField('services.scriptLabel', e.target.value)}
                      className="w-full p-2 bg-white border border-[#4B080C]/20 rounded-lg text-xs"
                    />
                  </div>

                  <div className="pt-2 border-t border-[#4B080C]/15 space-y-3">
                    <h4 className="font-bold text-[#4A121B] uppercase tracking-wider text-[11px]">
                      Service Offerings
                    </h4>

                    {(services.items || []).map((srv, idx) => (
                      <div
                        key={srv.id || idx}
                        className="p-3 bg-white rounded-xl border border-[#4B080C]/15 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#4A121B] text-xs">
                            Ritual #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              onRequestImageUpload({
                                title: `Upload Image for ${srv.title}`,
                                folderName: 'services',
                                onComplete: (url) => {
                                  const updated = [...(services.items || [])];
                                  updated[idx] = { ...updated[idx], image: url };
                                  onChangeField('services.items', updated);
                                },
                              })
                            }
                            className="text-[11px] text-[#4A121B] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            <Camera size={12} />
                            <span>Change Image (S3)</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={srv.title || ''}
                            onChange={(e) => {
                              const updated = [...(services.items || [])];
                              updated[idx] = { ...updated[idx], title: e.target.value };
                              onChangeField('services.items', updated);
                            }}
                            placeholder="Title"
                            className="p-1.5 bg-stone-50 border rounded text-xs"
                          />
                          <input
                            type="text"
                            value={srv.price || ''}
                            onChange={(e) => {
                              const updated = [...(services.items || [])];
                              updated[idx] = { ...updated[idx], price: e.target.value };
                              onChangeField('services.items', updated);
                            }}
                            placeholder="Price (e.g. $280+)"
                            className="p-1.5 bg-stone-50 border rounded text-xs"
                          />
                        </div>

                        <textarea
                          rows={2}
                          value={srv.description || ''}
                          onChange={(e) => {
                            const updated = [...(services.items || [])];
                            updated[idx] = { ...updated[idx], description: e.target.value };
                            onChangeField('services.items', updated);
                          }}
                          placeholder="Description"
                          className="w-full p-1.5 bg-stone-50 border rounded text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ───────────────── 3. GALLERY TAB ───────────────── */}
              {activeTab === 'gallery' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-[#4A121B] mb-1">
                      Gallery Section Title
                    </label>
                    <input
                      type="text"
                      value={gallery.sectionTitle || 'OUR GALLERY'}
                      onChange={(e) => onChangeField('gallery.sectionTitle', e.target.value)}
                      className="w-full p-2 bg-white border border-[#4B080C]/20 rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-[#4A121B] uppercase tracking-wider text-[11px]">
                      Portfolio Items
                    </h4>

                    {(gallery.items || []).map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="p-3 bg-white rounded-xl border border-[#4B080C]/15 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={item.image || '/assets/gallery_indian_hair.png'}
                            alt={item.title}
                            className="w-12 h-12 object-cover rounded bg-stone-100 border shrink-0"
                          />
                          <div className="min-w-0">
                            <input
                              type="text"
                              value={item.title || ''}
                              onChange={(e) => {
                                const updated = [...(gallery.items || [])];
                                updated[idx] = { ...updated[idx], title: e.target.value };
                                onChangeField('gallery.items', updated);
                              }}
                              className="font-semibold text-xs text-[#4A121B] bg-transparent border-b border-stone-200 w-full mb-1"
                            />
                            <input
                              type="text"
                              value={item.category || ''}
                              onChange={(e) => {
                                const updated = [...(gallery.items || [])];
                                updated[idx] = { ...updated[idx], category: e.target.value };
                                onChangeField('gallery.items', updated);
                              }}
                              className="text-[10px] text-stone-500 uppercase font-mono bg-transparent w-full"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            onRequestImageUpload({
                              title: `Upload Photo for ${item.title}`,
                              folderName: 'gallery',
                              onComplete: (url) => {
                                const updated = [...(gallery.items || [])];
                                updated[idx] = { ...updated[idx], image: url };
                                onChangeField('gallery.items', updated);
                              },
                            })
                          }
                          className="px-2 py-1.5 bg-[#4A121B] text-white rounded text-[11px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <Camera size={11} />
                          <span>S3 Image</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ───────────────── 4. TESTIMONIALS TAB ───────────────── */}
              {activeTab === 'testimonials' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-[#4A121B] mb-1">
                      Section Title
                    </label>
                    <input
                      type="text"
                      value={testimonials.sectionTitle || 'WHAT OUR CLIENTS SAY'}
                      onChange={(e) => onChangeField('testimonials.sectionTitle', e.target.value)}
                      className="w-full p-2 bg-white border border-[#4B080C]/20 rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-3">
                    {(testimonials.items || []).map((t, idx) => (
                      <div
                        key={t.id || idx}
                        className="p-3 bg-white rounded-xl border border-[#4B080C]/15 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={t.name || ''}
                            onChange={(e) => {
                              const updated = [...(testimonials.items || [])];
                              updated[idx] = { ...updated[idx], name: e.target.value };
                              onChangeField('testimonials.items', updated);
                            }}
                            className="font-bold text-xs text-[#4A121B] bg-transparent border-b border-stone-200"
                            placeholder="Client Name"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              onRequestImageUpload({
                                title: `Upload Client Photo for ${t.name}`,
                                folderName: 'testimonials',
                                onComplete: (url) => {
                                  const updated = [...(testimonials.items || [])];
                                  updated[idx] = { ...updated[idx], image: url };
                                  onChangeField('testimonials.items', updated);
                                },
                              })
                            }
                            className="text-[11px] text-[#4A121B] font-semibold flex items-center gap-1 cursor-pointer hover:underline"
                          >
                            <Camera size={11} />
                            <span>Photo (S3)</span>
                          </button>
                        </div>

                        <textarea
                          rows={2}
                          value={t.quote || ''}
                          onChange={(e) => {
                            const updated = [...(testimonials.items || [])];
                            updated[idx] = { ...updated[idx], quote: e.target.value };
                            onChangeField('testimonials.items', updated);
                          }}
                          className="w-full p-1.5 bg-stone-50 border rounded text-xs italic"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ───────────────── 5. FAQ TAB ───────────────── */}
              {activeTab === 'faq' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-[#4A121B] mb-1">
                      FAQ Section Title
                    </label>
                    <input
                      type="text"
                      value={faq.sectionTitle || 'FREQUENTLY ASKED QUESTIONS'}
                      onChange={(e) => onChangeField('faq.sectionTitle', e.target.value)}
                      className="w-full p-2 bg-white border border-[#4B080C]/20 rounded-lg text-xs"
                    />
                  </div>

                  {/* FAQ Photo */}
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-[#4B080C]/15">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={faq.image || '/assets/faq_hair_wash.png'}
                        alt="FAQ Feature"
                        className="w-10 h-10 object-cover rounded border"
                      />
                      <div className="truncate">
                        <p className="font-semibold text-xs text-[#4A121B]">Feature Photo</p>
                        <p className="text-[10px] text-stone-500 truncate max-w-[170px]">
                          {faq.image || './assets/faq_hair_wash.png'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onRequestImageUpload({
                          title: 'Upload FAQ Feature Photo to S3',
                          folderName: 'faq',
                          onComplete: (url) => onChangeField('faq.image', url),
                        })
                      }
                      className="px-2.5 py-1.5 bg-[#4A121B] text-white text-[11px] font-semibold rounded flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Camera size={12} />
                      <span>Change</span>
                    </button>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <h4 className="font-bold text-[#4A121B] uppercase tracking-wider text-[11px]">
                      Questions & Answers
                    </h4>
                    {(faq.items || []).map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white rounded-xl border border-[#4B080C]/15 space-y-1.5"
                      >
                        <input
                          type="text"
                          value={item.question || ''}
                          onChange={(e) => {
                            const updated = [...(faq.items || [])];
                            updated[idx] = { ...updated[idx], question: e.target.value };
                            onChangeField('faq.items', updated);
                          }}
                          placeholder="Question"
                          className="w-full font-bold text-xs text-[#4A121B] bg-stone-50 p-1.5 border rounded"
                        />
                        <textarea
                          rows={2}
                          value={item.answer || ''}
                          onChange={(e) => {
                            const updated = [...(faq.items || [])];
                            updated[idx] = { ...updated[idx], answer: e.target.value };
                            onChangeField('faq.items', updated);
                          }}
                          placeholder="Answer"
                          className="w-full text-xs text-stone-700 bg-stone-50 p-1.5 border rounded"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ───────────────── 6. CONTACT & FOOTER TAB ───────────────── */}
              {activeTab === 'contact' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-[#4A121B] mb-1">
                      Salon Address
                    </label>
                    <input
                      type="text"
                      value={contact.info?.address || ''}
                      onChange={(e) => onChangeField('contact.info.address', e.target.value)}
                      className="w-full p-2 bg-white border border-[#4B080C]/20 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#4A121B] mb-1">
                      Primary Phone
                    </label>
                    <input
                      type="text"
                      value={contact.info?.phones?.[0] || ''}
                      onChange={(e) =>
                        onChangeField('contact.info.phones', [
                          e.target.value,
                          contact.info?.phones?.[1] || '',
                        ])
                      }
                      className="w-full p-2 bg-white border border-[#4B080C]/20 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#4A121B] mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={contact.info?.email || ''}
                      onChange={(e) => onChangeField('contact.info.email', e.target.value)}
                      className="w-full p-2 bg-white border border-[#4B080C]/20 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#4A121B] mb-1">
                      Footer Logo Brand Text
                    </label>
                    <input
                      type="text"
                      value={footer.logoText || 'Tekkzy Salon'}
                      onChange={(e) => onChangeField('footer.logoText', e.target.value)}
                      className="w-full p-2 bg-white border border-[#4B080C]/20 rounded-lg text-xs font-serif font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#4A121B] mb-1">
                      Copyright Notice
                    </label>
                    <input
                      type="text"
                      value={footer.copyright || ''}
                      onChange={(e) => onChangeField('footer.copyright', e.target.value)}
                      className="w-full p-2 bg-white border border-[#4B080C]/20 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}

            </div>

            {/* FOOTER ACTIONS */}
            <div className="p-4 bg-white border-t border-[#4B080C]/15 flex items-center justify-between gap-3 shadow-lg">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                Discard
              </button>

              <button
                type="button"
                onClick={onSave}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-lg bg-[#4A121B] hover:bg-[#611B26] text-[#F6EFE5] border border-[#D4A574]/60 text-xs font-bold tracking-wider uppercase shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={15} className="animate-spin text-[#D4A574]" />
                    <span>Saving to DynamoDB...</span>
                  </>
                ) : (
                  <>
                    <SquareCheck size={16} className="text-[#D4A574]" />
                    <span>Submit & Save to Database</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminEditorDrawer;
