import React from 'react';
import { Edit3, SquareCheck, X, Loader2, Sparkles, Eye, SlidersHorizontal, Palette } from 'lucide-react';

const AdminLiveEditorBar = ({
  isEdit,
  setIsEdit,
  onSave,
  onCancel,
  isSaving,
  hasChanges = false,
  isPreviewMode = false,
  onTogglePreview,
  onOpenThemeModal,
}) => {
  return (
    <>
      {/* 1. INACTIVE STATE: Elegant Floating Pill (NOT BLACK) */}
      {!isEdit && (
        <aside
          aria-label="Admin website editor toolbar"
          className="fixed z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 font-sans pointer-events-auto"
          style={{
            maxWidth: 'calc(100vw - 2rem)',
            right: 'max(1rem, env(safe-area-inset-right, 1rem))',
            bottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))',
          }}
        >
          <button
            type="button"
            onClick={() => setIsEdit(true)}
            className="group flex items-center gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-full bg-[#FAF6F0]/95 hover:bg-[#4A121B] text-[#4A121B] hover:text-[#F6EFE5] font-semibold text-xs sm:text-sm tracking-wider uppercase shadow-xl hover:shadow-2xl border-2 border-[#D4A574] backdrop-blur-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            title="Open Live Website Editor"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4A574] group-hover:bg-[#F6EFE5] animate-pulse shrink-0" />
            <Edit3 className="w-4 h-4 text-[#D4A574] group-hover:rotate-12 transition-transform shrink-0" />
            <span className="font-bold tracking-wider sm:tracking-widest">Edit Website</span>
          </button>
        </aside>
      )}

      {/* 2. ACTIVE STATE: Luxury Burgundy & Gold Floating Dock */}
      {isEdit && (
        <aside
          aria-label="Active live website editor controls"
          className="fixed left-2 right-2 sm:left-auto sm:right-6 md:right-8 z-50 max-w-[calc(100vw-1rem)] sm:max-w-xl bg-[#3A0A10]/95 backdrop-blur-xl text-[#F6EFE5] rounded-full px-3 sm:px-6 py-2 sm:py-2.5 shadow-2xl border-2 border-[#D4A574] animate-in fade-in slide-in-from-bottom-6 duration-300 font-sans"
          style={{
            bottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))',
            right: 'max(0.5rem, env(safe-area-inset-right, 0.5rem))',
          }}
        >
          <div className="flex items-center justify-between gap-1.5 sm:gap-4 w-full">
            
            {/* Status indicator */}
            <div className="flex items-center gap-1.5 shrink-0 pl-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4A574] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#D4A574]" />
              </span>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#D4A574] hidden xs:inline">
                Editing
              </span>
            </div>

            {/* Action buttons — perfectly symmetric on mobile */}
            <div className="flex items-center justify-end gap-1.5 sm:gap-2 flex-1">
              {/* Theme Colors Modal Trigger */}
              {onOpenThemeModal && (
                <button
                  type="button"
                  onClick={onOpenThemeModal}
                  className="px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 bg-[#D4A574]/15 hover:bg-[#D4A574]/30 text-[#D4A574] border border-[#D4A574]/50 shadow-sm active:scale-95 shrink-0"
                  title="Customize Color Theme & Palette"
                >
                  <Palette size={12} className="text-[#D4A574]" />
                  <span>Theme</span>
                </button>
              )}

              {/* Preview Toggle */}
              {onTogglePreview && (
                <button
                  type="button"
                  onClick={onTogglePreview}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 border active:scale-95 shrink-0 ${
                    isPreviewMode
                      ? 'bg-[#D4A574]/20 border-[#D4A574] text-[#D4A574]'
                      : 'bg-white/10 hover:bg-white/20 border-white/20 text-[#EFE6D5]'
                  }`}
                  title={isPreviewMode ? 'Return to editing' : 'Preview clean layout'}
                >
                  <Eye size={12} />
                  <span>{isPreviewMode ? 'Edit' : 'Preview'}</span>
                </button>
              )}

              {/* Cancel Button */}
              <button
                type="button"
                onClick={onCancel}
                disabled={isSaving}
                className="px-2 sm:px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#EFE6D5] text-[11px] sm:text-xs font-semibold tracking-wider uppercase border border-white/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1 shrink-0"
                title="Discard all changes"
              >
                <X size={12} />
                <span className="hidden xs:inline">Cancel</span>
              </button>

              {/* Submit Button (Persists to DynamoDB) */}
              <button
                type="button"
                onClick={onSave}
                disabled={isSaving}
                className="px-3 sm:px-4 py-1.5 rounded-full bg-[#D4A574] hover:bg-[#c49666] text-[#191514] text-[11px] sm:text-xs font-bold tracking-wider uppercase shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1 sm:gap-1.5 shrink-0"
                title="Save changes to DynamoDB"
              >
                {isSaving ? (
                  <Loader2 size={13} className="animate-spin text-[#191514]" />
                ) : (
                  <SquareCheck size={13} className="text-[#191514]" />
                )}
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </div>
        </aside>
      )}
    </>
  );
};

export default AdminLiveEditorBar;
