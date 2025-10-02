import React, { useState, useContext, useRef } from "react";
import { X, Plus, Trash2, Edit } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Context from '../Context/Context';
import { useLocation, useNavigate } from 'react-router-dom';
import { API, Storage } from "aws-amplify";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Confirm from "./ui/Confirm";

const Gallery = () => {
  const { institutionData, userData, setLoader, setInstitutionData } = useContext(Context);
  const galleryData = institutionData?.gallery || {};
  const allImages = galleryData?.images || [];
  const location = useLocation();
  const navigate = useNavigate();
  const primaryColor = institutionData?.PrimaryColor || "#D4AF37";
  const institutionId = institutionData?.institutionid;
  const fileInputRef = useRef(null);

  const [showAll, setShowAll] = useState(location.state?.showAllImages || false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);
  const [isTitleDescModalOpen, setIsTitleDescModalOpen] = useState(false);
  const [galleryTitle, setGalleryTitle] = useState("");
  const [galleryDescription, setGalleryDescription] = useState("");

  const visibleImages = showAll ? allImages : allImages.slice(0, 6);
  const isAdmin = userData?.userType === 'admin';

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

  // Upload image to S3 (adapted from Services)
  const uploadImageToS3 = async (file) => {
    if (!file) return null;
    try {
      const fileName = `gallery/${Date.now()}-${file.name}`;
      const result = await Storage.put(fileName, file, {
        level: 'public',
        contentType: file.type,
      });
      return `https://${Storage._config.AWSS3.bucket}.s3.${Storage._config.AWSS3.region}.amazonaws.com/public/${result.key}`;
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

      const response = await API.patch('main', `/admin/${institutionId}/update-ui`, {
        body: {
          data: { gallery: { images: updatedImages } }
        }
      });

      if (response && response.item) {
        setInstitutionData(prevData => ({
          ...prevData,
          gallery: { images: updatedImages }
        }));
      }
      setIsAddModalOpen(false);
      setNewImageFile(null);
      toast.success("Image added successfully");
    } catch (error) {
      console.error("Error adding image:", error);
      toast.error(`Failed to add image: ${error.message || 'Unknown error'}`);
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

      // Delete from S3
      const imageKey = imageUrl.split('/').slice(-2).join('/');
      try {
        await Storage.remove(imageKey, { level: 'public' });
      } catch (error) {
        console.error("Error deleting image from S3:", error);
      }

      const response = await API.patch('main', `/admin/${institutionId}/update-ui`, {
        body: {
          data: { gallery: { images: updatedImages } }
        }
      });

      if (response && response.item) {
        setInstitutionData(prevData => ({
          ...prevData,
          gallery: { images: updatedImages }
        }));
      }
      setIsDeleteModalOpen(false);
      setImageToDelete(null);
      toast.success("Image deleted successfully");
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error(`Failed to delete image: ${error.message || 'Unknown error'}`);
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
      
      const response = await API.patch('main', `/admin/${institutionId}/update-ui`, {
        body: {
          data: {
            gallery: {
              ...institutionData?.gallery,
              title: galleryTitle,
              description: galleryDescription
            }
          }
        }
      });

      if (response && response.item) {
        setInstitutionData(prevData => ({
          ...prevData,
          gallery: {
            ...prevData.gallery,
            title: galleryTitle,
            description: galleryDescription
          }
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
    <div className="container mx-auto px-4 pt-24 py-20 sm:px-6 lg:px-14">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Modified heading section for center alignment */}
      <motion.div 
        className="flex flex-col items-center mb-8 relative group"
        initial={{ opacity: 0, y: -50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className={`text-3xl font-bold text-center text-gray-800 ${location.pathname === '/gallery' ? 'mt-4' : ''}`}>
          {institutionData?.gallery?.title || 'Our Gallery'}
        </h2>
        <p className="text-center text-gray-500 mt-2">
          {institutionData?.gallery?.description || 'A glimpse into our world'}
        </p>
        
        {isAdmin && (
          <>
            <button
              onClick={openTitleDescModal}
              className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-all duration-300 p-2 bg-white shadow-lg rounded-full hover:scale-110 mb-4"
              style={{ border: `2px solid ${primaryColor}` }}
            >
              <Edit size={16} style={{ color: primaryColor }} />
            </button>
            
            {/* Repositioned button for responsive layout */}
            <div className="w-full flex justify-center lg:justify-end">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-md shadow-md hover:opacity-90 transition-all"
                style={{ backgroundColor: primaryColor }}
              >
                <Plus size={20} /> Add Image
              </button>
            </div>
          </>
        )}
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {visibleImages.map((image, index) => (
          <div
            key={index}
            className="rounded-lg overflow-hidden transition-transform transform hover:scale-105 duration-300 shadow-lg relative"
          >
            <img
              src={image}
              alt=""
              className="w-full h-52 object-cover rounded-md cursor-pointer"
              onClick={() => setSelectedImage(image)}
            />
            {isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setImageToDelete(index);
                  setIsDeleteModalOpen(true);
                }}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                title="Delete Image"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        ))}
      </div>

      {allImages.length > 6 && !showAll && (
        <div className="text-center mt-6">
          <button
            onClick={() => {
              if (location.pathname === '/gallery') {
                setShowAll(true);
              } else {
                navigate('/gallery', { state: { showAllImages: true } });
              }
            }}
            className="text-white font-bold py-2 px-4 rounded-md shadow-md transition-all duration-300 transform hover:scale-110"
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsAddModalOpen(false)}
          >
            <motion.div 
              className="bg-white/95 backdrop-blur-md rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/20"
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
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
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      className="w-full"
                    >
                      <div className="mx-auto h-8 w-8 text-gray-400 mb-2">📁</div>
                      <p className="text-sm text-gray-600">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
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
                        className="mx-auto w-32 h-32 object-cover rounded-xl shadow-lg"
                      />
                      <p className="text-sm text-gray-600 mt-2 font-medium">{newImageFile.name}</p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
              
              <motion.div 
                className="flex justify-end space-x-4 mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <motion.button
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-6 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleAddImage}
                  className="px-6 py-3 text-white rounded-xl font-medium shadow-lg"
                  style={{ 
                    background: `linear-gradient(45deg, ${primaryColor}, ${primaryColor}dd)`,
                    boxShadow: `0 4px 20px ${primaryColor}40`
                  }}
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: `0 6px 25px ${primaryColor}50`
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeModal}
          >
            <motion.div 
              className="relative max-w-4xl w-full" 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <motion.button
                className="absolute -top-12 right-0 bg-white/90 backdrop-blur-sm text-gray-800 p-3 rounded-full shadow-lg hover:bg-white transition-colors"
                onClick={closeModal}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={24} />
              </motion.button>
              <motion.img
                src={selectedImage}
                alt="Expanded view"
                className="w-full h-auto rounded-2xl shadow-2xl"
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsTitleDescModalOpen(false)}
          >
            <motion.div 
              className="bg-white/95 backdrop-blur-md rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-white/20"
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
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
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={galleryTitle}
                    onChange={(e) => setGalleryTitle(e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors bg-white/80 backdrop-blur-sm"
                    placeholder="Enter gallery title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={galleryDescription}
                    onChange={(e) => setGalleryDescription(e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors bg-white/80 backdrop-blur-sm resize-none"
                    rows="4"
                    placeholder="Enter gallery description"
                  />
                </div>
              </motion.div>
              
              <motion.div 
                className="flex justify-end space-x-4 mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <motion.button
                  onClick={() => setIsTitleDescModalOpen(false)}
                  className="px-6 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleTitleDescSave}
                  className="px-6 py-3 text-white rounded-xl font-medium shadow-lg"
                  style={{ 
                    background: `linear-gradient(45deg, ${primaryColor}, ${primaryColor}dd)`,
                    boxShadow: `0 4px 20px ${primaryColor}40`
                  }}
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: `0 6px 25px ${primaryColor}50`
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