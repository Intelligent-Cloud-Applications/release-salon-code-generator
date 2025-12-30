import React, { useState, useContext, useRef } from "react";
import { X, Plus, Trash2, Edit } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Context from "../Context/Context";
import { useLocation, useNavigate } from "react-router-dom";

// --- Amplify v6 Imports ---
import { patch } from "aws-amplify/api";
import { uploadData, remove } from "aws-amplify/storage";
import { Amplify } from "aws-amplify";
const getConfig = Amplify.getConfig;
// --------------------------

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Confirm from "./ui/Confirm";

const Gallery = () => {
  const { institutionData, userData, setLoader, setInstitutionData } =
    useContext(Context);
  const galleryData = institutionData?.gallery || {};
  const allImages = galleryData?.images || [];
  const location = useLocation();
  const navigate = useNavigate();
  const primaryColor = institutionData?.PrimaryColor || "#D4AF37";
  const institutionId = institutionData?.institutionid;
  const fileInputRef = useRef(null);

  const [showAll, setShowAll] = useState(
    location.state?.showAllImages || false,
  );
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);
  const [isTitleDescModalOpen, setIsTitleDescModalOpen] = useState(false);
  const [galleryTitle, setGalleryTitle] = useState("");
  const [galleryDescription, setGalleryDescription] = useState("");

  const visibleImages = showAll ? allImages : allImages.slice(0, 6);
  const isAdmin = userData?.userType === "admin";

  const closeModal = () => setSelectedImage(null);

  // Handle file selection
  const handleFileSelection = (e) => {
    if (e.target.files && e.target.files[0]) {
      setNewImageFile(e.target.files[0]);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // --- Updated: Upload image to S3 (Amplify v6) ---
  const uploadImageToS3 = async (file) => {
    if (!file) return null;
    try {
      const fileName = `gallery/${Date.now()}-${file.name}`;

      // 1. Upload the data
      // Note: 'public' level in v5 maps to 'guest' accessLevel in v6
      const result = await uploadData({
        key: fileName,
        data: file,
        options: {
          accessLevel: "guest",
          contentType: file.type,
        },
      }).result;

      // 2. Construct the Public URL manually
      // We need to fetch the config to get the bucket and region
      const config = getConfig();
      const bucket = config.Storage?.S3?.bucket;
      const region = config.Storage?.S3?.region;

      if (!bucket || !region) {
        throw new Error("S3 Configuration missing");
      }

      // 'guest' accessLevel uploads to the 'public/' prefix folder in S3
      return `https://${bucket}.s3.${region}.amazonaws.com/public/${result.key}`;
    } catch (error) {
      console.error("Error uploading image to S3:", error);
      toast.error("Failed to upload image");
      throw error;
    }
  };

  // Handle adding a new image
  const handleAddImage = async () => {
    if (!newImageFile) {
      toast.error("Please select an image to upload");
      return;
    }

    try {
      setLoader(true);
      const imageUrl = await uploadImageToS3(newImageFile);
      const updatedImages = [...allImages, imageUrl];

      // --- Updated: API Patch Request (Amplify v6) ---
      const response = await patch({
        apiName: "main",
        path: `/admin/${institutionId}/update-ui`,
        options: {
          body: {
            data: { gallery: { images: updatedImages } },
          },
        },
      }).response;

      const responseData = await response.body.json();

      if (responseData && responseData.item) {
        setInstitutionData((prevData) => ({
          ...prevData,
          gallery: { images: updatedImages },
        }));
      }
      setIsAddModalOpen(false);
      setNewImageFile(null);
      toast.success("Image added successfully");
    } catch (error) {
      console.error("Error adding image:", error);
      toast.error(`Failed to add image: ${error.message || "Unknown error"}`);
    } finally {
      setLoader(false);
    }
  };

  // Handle deleting an image
  const handleDeleteImage = async () => {
    if (!imageToDelete && imageToDelete !== 0) return;

    try {
      setLoader(true);
      const imageUrl = allImages[imageToDelete];
      const updatedImages = allImages.filter((_, i) => i !== imageToDelete);

      // --- Updated: Delete from S3 (Amplify v6) ---
      // Extract the key relative to the public folder
      const imageKey = imageUrl.split("/").slice(-2).join("/");

      try {
        await remove({
          key: imageKey,
          options: { accessLevel: "guest" },
        });
      } catch (error) {
        console.error("Error deleting image from S3:", error);
      }

      // --- Updated: API Patch Request (Amplify v6) ---
      const response = await patch({
        apiName: "main",
        path: `/admin/${institutionId}/update-ui`,
        options: {
          body: {
            data: { gallery: { images: updatedImages } },
          },
        },
      }).response;

      const responseData = await response.body.json();

      if (responseData && responseData.item) {
        setInstitutionData((prevData) => ({
          ...prevData,
          gallery: { images: updatedImages },
        }));
      }
      setIsDeleteModalOpen(false);
      setImageToDelete(null);
      toast.success("Image deleted successfully");
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error(
        `Failed to delete image: ${error.message || "Unknown error"}`,
      );
    } finally {
      setLoader(false);
    }
  };

  // Open title/description edit modal
  const openTitleDescModal = () => {
    setGalleryTitle(institutionData?.gallery?.title || "");
    setGalleryDescription(institutionData?.gallery?.description || "");
    setIsTitleDescModalOpen(true);
  };

  // Handle title/description save
  const handleTitleDescSave = async () => {
    try {
      setLoader(true);

      // --- Updated: API Patch Request (Amplify v6) ---
      const response = await patch({
        apiName: "main",
        path: `/admin/${institutionId}/update-ui`,
        options: {
          body: {
            data: {
              gallery: {
                ...institutionData?.gallery,
                title: galleryTitle,
                description: galleryDescription,
              },
            },
          },
        },
      }).response;

      const responseData = await response.body.json();

      if (responseData && responseData.item) {
        setInstitutionData((prevData) => ({
          ...prevData,
          gallery: {
            ...prevData.gallery,
            title: galleryTitle,
            description: galleryDescription,
          },
        }));
        toast.success("Gallery section updated successfully");
      }
      setIsTitleDescModalOpen(false);
    } catch (error) {
      console.error("Error updating gallery section:", error);
      toast.error("Failed to update gallery section");
    } finally {
      setLoader(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-20 pt-24 sm:px-6 lg:px-14">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Modified heading section for center alignment */}
      <motion.div
        className="group relative mb-8 flex flex-col items-center"
        initial={{ opacity: 0, y: -50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2
          className={`text-center text-3xl font-bold text-gray-800 ${location.pathname === "/gallery" ? "mt-4" : ""}`}
        >
          {institutionData?.gallery?.title || "Our Gallery"}
        </h2>
        <p className="mt-2 text-center text-gray-500">
          {institutionData?.gallery?.description || "A glimpse into our world"}
        </p>

        {isAdmin && (
          <>
            <button
              onClick={openTitleDescModal}
              className="absolute right-0 top-0 mb-4 rounded-full bg-white p-2 opacity-0 shadow-lg transition-all duration-300 hover:scale-110 group-hover:opacity-100"
              style={{ border: `2px solid ${primaryColor}` }}
            >
              <Edit size={16} style={{ color: primaryColor }} />
            </button>

            {/* Repositioned button for responsive layout */}
            <div className="flex w-full justify-center lg:justify-end">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 rounded-md px-4 py-2 text-white shadow-md transition-all hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                <Plus size={20} /> Add Image
              </button>
            </div>
          </>
        )}
      </motion.div>

      <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
        {visibleImages.map((image, index) => (
          <div
            key={index}
            className="relative transform overflow-hidden rounded-lg shadow-lg transition-transform duration-300 hover:scale-105"
          >
            <img
              src={image}
              alt=""
              className="h-52 w-full cursor-pointer rounded-md object-cover"
              onClick={() => setSelectedImage(image)}
            />
            {isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setImageToDelete(index);
                  setIsDeleteModalOpen(true);
                }}
                className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white transition-colors hover:bg-red-600"
                title="Delete Image"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        ))}
      </div>

      {allImages.length > 6 && !showAll && (
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              if (location.pathname === "/gallery") {
                setShowAll(true);
              } else {
                navigate("/gallery", { state: { showAllImages: true } });
              }
            }}
            className="transform rounded-md px-4 py-2 font-bold text-white shadow-md transition-all duration-300 hover:scale-110"
            style={{ backgroundColor: primaryColor }}
          >
            View More
          </button>
        </div>
      )}

      {/* Add Image Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsAddModalOpen(false)}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-md"
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <motion.h2
                  className="text-2xl font-bold text-gray-800"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  Add Gallery Image
                </motion.h2>
                <motion.button
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-full p-2 transition-colors hover:bg-gray-100"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={20} className="text-gray-500" />
                </motion.button>
              </div>

              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Gallery Image
                  </label>

                  {/* Hidden file input */}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileSelection}
                    className="hidden"
                  />

                  {/* Modern file input */}
                  <div className="rounded-xl border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-gray-400">
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      className="w-full"
                    >
                      <div className="mx-auto mb-2 h-8 w-8 text-gray-400">
                        📁
                      </div>
                      <p className="text-sm text-gray-600">
                        Click to upload or drag and drop
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        PNG, JPG, JPEG up to 5MB
                      </p>
                    </button>
                  </div>

                  {newImageFile && (
                    <motion.div
                      className="mt-4 text-center"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <img
                        src={URL.createObjectURL(newImageFile)}
                        alt="Preview"
                        className="mx-auto h-32 w-32 rounded-xl object-cover shadow-lg"
                      />
                      <p className="mt-2 text-sm font-medium text-gray-600">
                        {newImageFile.name}
                      </p>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              <motion.div
                className="mt-8 flex justify-end space-x-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <motion.button
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl bg-gray-100 px-6 py-3 font-medium text-gray-600 transition-colors hover:bg-gray-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleAddImage}
                  className="rounded-xl px-6 py-3 font-medium text-white shadow-lg"
                  style={{
                    background: `linear-gradient(45deg, ${primaryColor}, ${primaryColor}dd)`,
                    boxShadow: `0 4px 20px ${primaryColor}40`,
                  }}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: `0 6px 25px ${primaryColor}50`,
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  Upload Image
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <Confirm
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteImage}
        title="Delete Image"
        message="Are you sure you want to delete this image? This action cannot be undone."
        primaryColor={primaryColor}
      />

      {/* Image Preview Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeModal}
          >
            <motion.div
              className="relative w-full max-w-4xl"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <motion.button
                className="absolute -top-12 right-0 rounded-full bg-white/90 p-3 text-gray-800 shadow-lg backdrop-blur-sm transition-colors hover:bg-white"
                onClick={closeModal}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={24} />
              </motion.button>
              <motion.img
                src={selectedImage}
                alt="Expanded view"
                className="h-auto w-full rounded-2xl shadow-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title/Description Edit Modal */}
      <AnimatePresence>
        {isTitleDescModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsTitleDescModalOpen(false)}
          >
            <motion.div
              className="w-full max-w-lg rounded-2xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-md"
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <motion.h2
                  className="text-2xl font-bold text-gray-800"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  Edit Gallery Section
                </motion.h2>
                <motion.button
                  onClick={() => setIsTitleDescModalOpen(false)}
                  className="rounded-full p-2 transition-colors hover:bg-gray-100"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={20} className="text-gray-500" />
                </motion.button>
              </div>

              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    value={galleryTitle}
                    onChange={(e) => setGalleryTitle(e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white/80 p-4 backdrop-blur-sm transition-colors focus:border-blue-500 focus:outline-none"
                    placeholder="Enter gallery title"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={galleryDescription}
                    onChange={(e) => setGalleryDescription(e.target.value)}
                    className="w-full resize-none rounded-xl border-2 border-gray-200 bg-white/80 p-4 backdrop-blur-sm transition-colors focus:border-blue-500 focus:outline-none"
                    rows="4"
                    placeholder="Enter gallery description"
                  />
                </div>
              </motion.div>

              <motion.div
                className="mt-8 flex justify-end space-x-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <motion.button
                  onClick={() => setIsTitleDescModalOpen(false)}
                  className="rounded-xl bg-gray-100 px-6 py-3 font-medium text-gray-600 transition-colors hover:bg-gray-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleTitleDescSave}
                  className="rounded-xl px-6 py-3 font-medium text-white shadow-lg"
                  style={{
                    background: `linear-gradient(45deg, ${primaryColor}, ${primaryColor}dd)`,
                    boxShadow: `0 4px 20px ${primaryColor}40`,
                  }}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: `0 6px 25px ${primaryColor}50`,
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  Save Changes
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
