import React, { useRef, useState } from "react";
import { X, Upload, CheckCircle2, Loader2, Image as ImageIcon } from "lucide-react";
import { uploadFileToS3 } from "../../lib/uploadFileToS3";

const ImageUploadModal = ({
  onClose,
  onUploadComplete,
  folderName = "salon-assets",
  title = "Upload Image to S3",
  acceptedTypes = ["image/jpeg", "image/png", "image/gif", "image/svg+xml", "image/webp"],
}) => {
  const fileRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrorMessage("");
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setErrorMessage("Please select an image file to upload.");
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage("");
      const result = await uploadFileToS3(selectedFile, folderName);
      if (result && result.url) {
        onUploadComplete(result.url);
        onClose();
      } else {
        throw new Error("Did not receive a valid image URL.");
      }
    } catch (error) {
      console.error("Image upload error:", error);
      setErrorMessage(error.message || "Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  React.useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] px-4 font-sans">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={!isUploading ? onClose : undefined}
      />
      <div className="bg-[#FAF6F0] text-[#191514] border border-[#4B080C]/20 p-6 rounded-2xl shadow-2xl w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#4B080C]/10">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#63202B]" />
            <h2 className="text-lg font-serif font-semibold text-[#4A121B]">{title}</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="text-[#5C524E] hover:text-[#191514] p-1.5 rounded-full hover:bg-[#4B080C]/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="border-2 border-dashed border-[#4B080C]/30 hover:border-[#4B080C]/60 rounded-xl p-6 mb-4 text-center bg-white/60 transition-colors">
          <input
            type="file"
            accept={acceptedTypes.join(",")}
            className="hidden"
            ref={fileRef}
            id="image-upload-input"
            onChange={handleFileChange}
          />
          <label
            htmlFor="image-upload-input"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            {selectedFile && previewUrl ? (
              <div className="flex flex-col items-center">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full max-h-52 object-contain rounded-lg mb-2 shadow-sm border border-stone-200"
                />
                <p className="text-xs font-semibold text-[#4A121B] truncate max-w-xs">{selectedFile.name}</p>
                <span className="text-[11px] text-stone-500 mt-0.5">Click to choose a different image</span>
              </div>
            ) : (
              <div className="flex flex-col items-center py-4">
                <div className="w-12 h-12 rounded-full bg-[#4A121B]/10 flex items-center justify-center text-[#63202B] mb-2">
                  <Upload size={22} />
                </div>
                <span className="text-sm font-semibold text-[#2B2422]">Click to browse image</span>
                <span className="text-xs text-stone-500 mt-1">
                  Supports JPG, PNG, WEBP, SVG
                </span>
                <span className="text-[10px] text-stone-400 mt-1">Image will be securely uploaded to S3</span>
              </div>
            )}
          </label>
        </div>

        {errorMessage && (
          <p className="text-xs text-red-600 mb-3 bg-red-50 p-2 rounded border border-red-200">
            {errorMessage}
          </p>
        )}

        <div className="flex justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleFileUpload}
            disabled={!selectedFile || isUploading}
            className="px-5 py-2 rounded-lg bg-[#4A121B] hover:bg-[#611B26] text-[#F6EFE5] text-xs font-semibold shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Uploading to S3...</span>
              </>
            ) : (
              <>
                <Upload size={14} />
                <span>Upload to S3</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadModal;
