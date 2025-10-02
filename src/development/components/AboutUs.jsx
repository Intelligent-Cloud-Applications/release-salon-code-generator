import React, { useState, useRef, useContext, useEffect } from "react";
import { useInView, motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import Context from "../Context/Context";
import { API, Storage } from "aws-amplify";
import { toast } from "react-toastify";
import { Plus, Edit, Trash2, X } from "lucide-react";
import Confirm from "./ui/Confirm"; // Assuming you have this component
// Utility function to convert YouTube URL to embed format
const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;

  let videoId = "";
  if (url.includes("youtu.be")) {
    videoId = url.split("/").pop().split("?")[0];
  } else if (url.includes("youtube.com/watch?v=")) {
    videoId = url.split("v=")[1]?.split("&")[0];
  } else if (url.includes("youtube.com/embed/")) {
    return url; // Already in embed format
  }

  return videoId ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1` : null;
};

const AboutUs = () => {
  const { institutionData, userData, setLoader, setInstitutionData } = useContext(Context);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false); // Track play state
  const modalRef = useRef(null);
  const whyChooseUs = institutionData?.whyChooseUs || {};
  const ourMission = institutionData?.ourMission || {};
  const primaryColor = institutionData?.PrimaryColor || "#D4AF37";
  const secondaryColor = institutionData?.SecondaryColor || "#F5F5F5";
  const youtubeLink = getYouTubeEmbedUrl(institutionData?.ytLink);
  const institutionId = institutionData?.institutionid;
  const location = useLocation();

  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isWhyChooseUsModalOpen, setIsWhyChooseUsModalOpen] = useState(false);
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [missionDescription, setMissionDescription] = useState(ourMission.description || "");
  const [serviceTitle, setServiceTitle] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [serviceImage, setServiceImage] = useState(null);
  const [whyChooseUsTitle, setWhyChooseUsTitle] = useState("");
  const [whyChooseUsDescription, setWhyChooseUsDescription] = useState("");
  const [youTubeLink, setYouTubeLink] = useState("");
  const fileInputRef = useRef(null);

  const isAdmin = userData?.userType === "admin";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsVideoPlaying(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        setIsVideoPlaying(false);
      }
    };

    if (isVideoPlaying) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isVideoPlaying]);

  if (!institutionData?.ourMission) return <p>Loading...</p>;

  // Upload image to S3
  const uploadImageToS3 = async (file) => {
    if (!file) return null;
    try {
      const fileName = `aboutus/${Date.now()}-${file.name}`;
      const result = await Storage.put(fileName, file, {
        level: "public",
        contentType: file.type,
      });
      return `https://${Storage._config.AWSS3.bucket}.s3.${Storage._config.AWSS3.region}.amazonaws.com/public/${result.key}`;
    } catch (error) {
      console.error("Error uploading image to S3:", error);
      throw error;
    }
  };

  // Open mission edit modal
  const openMissionModal = () => {
    setMissionDescription(ourMission.description || "");
    setIsMissionModalOpen(true);
  };

  // Open service edit modal
  const openServiceModal = (service = null) => {
    setSelectedService(service);
    setServiceTitle(service?.title || "");
    setServiceDescription(service?.description || "");
    setServiceImage(null);
    setIsServiceModalOpen(true);
  };

  // Open delete modal for service
  const openDeleteModal = (service) => {
    setSelectedService(service);
    setIsDeleteModalOpen(true);
  };

  // Handle mission save
  const handleMissionSave = async () => {
    if (!missionDescription.trim()) {
      toast.error("Description is required");
      return;
    }

    try {
      setLoader(true);
      const updatedMission = { ...ourMission, description: missionDescription };
      const response = await API.patch("main", `/admin/${institutionId}/update-ui`, {
        body: { data: { ourMission: updatedMission } },
      });

      setInstitutionData((prev) => ({
        ...prev,
        ourMission: updatedMission,
      }));
      setIsMissionModalOpen(false);
      toast.success("Mission updated");
    } catch (error) {
      console.error("Error saving mission:", error);
      toast.error(`Failed to save mission: ${error.message || "Unknown error"}`);
    } finally {
      setLoader(false);
    }
  };

  // Handle service save (create/update)
  const handleServiceSave = async () => {
    if (!serviceTitle.trim() || !serviceDescription.trim()) {
      toast.error("Title and description are required");
      return;
    }

    try {
      setLoader(true);
      const imageUrl = serviceImage ? await uploadImageToS3(serviceImage) : selectedService?.image;
      const updatedService = { title: serviceTitle, description: serviceDescription, image: imageUrl || selectedService?.image };
      let updatedWhyChooseUs;

      if (selectedService) {
        updatedWhyChooseUs = {
          ...whyChooseUs,
          services: whyChooseUs.services.map((s, i) =>
            i === whyChooseUs.services.indexOf(selectedService) ? updatedService : s
          ),
        };
      } else {
        updatedWhyChooseUs = {
          ...whyChooseUs,
          services: [...(whyChooseUs.services || []), updatedService],
        };
      }

      const response = await API.patch("main", `/admin/${institutionId}/update-ui`, {
        body: { data: { whyChooseUs: updatedWhyChooseUs } },
      });

      setInstitutionData((prev) => ({
        ...prev,
        whyChooseUs: updatedWhyChooseUs,
      }));
      setIsServiceModalOpen(false);
      toast.success(selectedService ? "Service updated" : "Service added");
    } catch (error) {
      console.error("Error saving service:", error);
      toast.error(`Failed to save service: ${error.message || "Unknown error"}`);
    } finally {
      setLoader(false);
    }
  };

  // Handle service delete
  const handleDelete = async () => {
    try {
      setLoader(true);
      const updatedWhyChooseUs = {
        ...whyChooseUs,
        services: whyChooseUs.services.filter((s) => s !== selectedService),
      };

      const response = await API.patch("main", `/admin/${institutionId}/update-ui`, {
        body: { data: { whyChooseUs: updatedWhyChooseUs } },
      });

      setInstitutionData((prev) => ({
        ...prev,
        whyChooseUs: updatedWhyChooseUs,
      }));
      setIsDeleteModalOpen(false);
      toast.success("Service deleted");
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error(`Failed to delete service: ${error.message || "Unknown error"}`);
    } finally {
      setLoader(false);
    }
  };

  // Open Why Choose Us edit modal
  const openWhyChooseUsModal = () => {
    setWhyChooseUsTitle(whyChooseUs?.title || "Why Choose Us");
    setWhyChooseUsDescription(whyChooseUs?.description || "Discover the reasons why our customers love us");
    setIsWhyChooseUsModalOpen(true);
  };

  // Handle Why Choose Us save
  const handleWhyChooseUsSave = async () => {
    if (!whyChooseUsTitle.trim() || !whyChooseUsDescription.trim()) {
      toast.error("Title and description are required");
      return;
    }

    try {
      setLoader(true);
      const updatedWhyChooseUs = {
        ...whyChooseUs,
        title: whyChooseUsTitle.trim(),
        description: whyChooseUsDescription.trim(),
      };

      await API.patch("main", `/admin/${institutionId}/update-ui`, {
        body: { data: { whyChooseUs: updatedWhyChooseUs } },
      });

      setInstitutionData((prev) => ({
        ...prev,
        whyChooseUs: updatedWhyChooseUs,
      }));
      setIsWhyChooseUsModalOpen(false);
      toast.success("Why Choose Us section updated");
    } catch (error) {
      console.error("Error updating Why Choose Us:", error);
      toast.error(`Failed to update: ${error.message || "Unknown error"}`);
    } finally {
      setLoader(false);
    }
  };

  // Open YouTube link edit modal
  const openYouTubeModal = () => {
    setYouTubeLink(institutionData?.ytLink || "");
    setIsYouTubeModalOpen(true);
  };

  // Handle YouTube link save
  const handleYouTubeSave = async () => {
    try {
      setLoader(true);
      const updatedData = { ytLink: youTubeLink.trim() };

      await API.patch("main", `/admin/${institutionId}/update-ui`, {
        body: { data: updatedData },
      });

      setInstitutionData((prev) => ({
        ...prev,
        ...updatedData,
      }));
      setIsYouTubeModalOpen(false);
      toast.success("YouTube link updated");
    } catch (error) {
      console.error("Error updating YouTube link:", error);
      toast.error(`Failed to update YouTube link: ${error.message || "Unknown error"}`);
    } finally {
      setLoader(false);
    }
  };

  const hasValidTestimonials = whyChooseUs?.services?.length > 0;

  return (
    <div className="bg-white">
      <div className="max-w-[1440px] mx-auto py-16 px-4 sm:px-6 lg:px-8">
        {/* Why Choose Us Section */}
        <div className={`mb-20 ${location.pathname === "/aboutus" ? "mt-10" : ""}`}>
          <div className="text-center max-w-3xl mx-auto mb-12 relative group">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{whyChooseUs?.title || "Why Choose Us"}</h2>
            <p className="text-lg text-gray-600">
              {whyChooseUs?.description || "Discover the reasons why our customers love us"}
            </p>
            {isAdmin && (
              <button
                onClick={openWhyChooseUsModal}
                className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-all duration-300 p-2 bg-white shadow-lg rounded-full hover:scale-110"
                style={{ border: `2px solid ${primaryColor}` }}
              >
                <Edit size={16} style={{ color: primaryColor }} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {hasValidTestimonials &&
              whyChooseUs.services.map((service, index) => (
                <WhyChooseUsCard
                  key={index}
                  service={service}
                  index={index}
                  primaryColor={primaryColor}
                  secondaryColor={secondaryColor}
                  isAdmin={isAdmin}
                  openServiceModal={openServiceModal}
                  openDeleteModal={openDeleteModal}
                />
              ))}
          </div>
        </div>

        {/* About Us Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Embedded YouTube Player */}
          <div className="relative h-[400px] rounded-lg overflow-hidden group">
            {youtubeLink ? (
              <iframe
                width="100%"
                height="100%"
                src={youtubeLink}
                title="About Us Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-lg"
                ref={modalRef}
              ></iframe>
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-gray-200 text-gray-600">
                <p className="text-center">No video available.</p>
                <p className="text-sm text-center mt-2">Please ensure a valid YouTube link is provided.</p>
              </div>
            )}
            {isAdmin && (
              <button
                onClick={openYouTubeModal}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 p-2 bg-white shadow-lg rounded-full hover:scale-110"
                style={{ border: `2px solid ${primaryColor}` }}
              >
                <Edit size={16} style={{ color: primaryColor }} />
              </button>
            )}
          </div>

          {/* About Us Text */}
          <AboutUsText
            ourMission={ourMission}
            companyName={institutionData?.companyName}
            isAdmin={isAdmin}
            openMissionModal={openMissionModal}
            primaryColor={primaryColor}
          />
        </div>
      </div>

      {/* Why Choose Us Edit Modal */}
      <AnimatePresence>
        {isWhyChooseUsModalOpen && (
        <motion.div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => setIsWhyChooseUsModalOpen(false)}
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
                Edit Why Choose Us
              </motion.h2>
              <motion.button
                onClick={() => setIsWhyChooseUsModalOpen(false)}
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
                  value={whyChooseUsTitle}
                  onChange={(e) => setWhyChooseUsTitle(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors bg-white/80 backdrop-blur-sm"
                  placeholder="Enter section title"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={whyChooseUsDescription}
                  onChange={(e) => setWhyChooseUsDescription(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors bg-white/80 backdrop-blur-sm resize-none"
                  rows="4"
                  placeholder="Enter section description"
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
                onClick={() => setIsWhyChooseUsModalOpen(false)}
                className="px-6 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={handleWhyChooseUsSave}
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

      {/* Mission Edit Modal */}
      <AnimatePresence>
      {isMissionModalOpen && (
        <motion.div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => setIsMissionModalOpen(false)}
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
                Edit Description
              </motion.h2>
              <motion.button
                onClick={() => setIsMissionModalOpen(false)}
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
                  Description
                </label>
                <textarea
                  value={missionDescription}
                  onChange={(e) => setMissionDescription(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors bg-white/80 backdrop-blur-sm resize-none"
                  rows="6"
                  placeholder="Enter mission description"
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
                onClick={() => setIsMissionModalOpen(false)}
                className="px-6 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={handleMissionSave}
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

      {/* Service Edit/Add Modal */}
      <AnimatePresence>
        {isServiceModalOpen && (
        <motion.div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => setIsServiceModalOpen(false)}
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
                {selectedService ? "Edit Service" : "Add Service"}
              </motion.h2>
              <motion.button
                onClick={() => setIsServiceModalOpen(false)}
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
                  value={serviceTitle}
                  onChange={(e) => setServiceTitle(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors bg-white/80 backdrop-blur-sm"
                  placeholder="Enter service title"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors bg-white/80 backdrop-blur-sm resize-none"
                  rows="4"
                  placeholder="Enter service description"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Image (optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={(e) => setServiceImage(e.target.files[0])}
                    className="hidden"
                    id="service-image-upload"
                  />
                  <label htmlFor="service-image-upload" className="cursor-pointer">
                    <div className="mx-auto h-8 w-8 text-gray-400 mb-2">📁</div>
                    <p className="text-sm text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PNG, JPG, JPEG up to 5MB
                    </p>
                  </label>
                </div>
                {serviceImage && (
                  <motion.div 
                    className="mt-4 text-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-sm font-semibold text-gray-700 mb-2">Image Preview</p>
                    <div className="flex justify-center">
                      <img
                        src={URL.createObjectURL(serviceImage)}
                        alt="Preview"
                        className="w-24 h-24 object-cover rounded-lg shadow-md"
                      />
                    </div>
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
                onClick={() => setIsServiceModalOpen(false)}
                className="px-6 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={handleServiceSave}
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
                {selectedService ? "Update Service" : "Add Service"}
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
        onConfirm={handleDelete}
        title="Delete Service"
        message="Are you sure you want to delete this service? This action cannot be undone."
        primaryColor={primaryColor}
      />

      {/* YouTube Link Edit Modal */}
      <AnimatePresence>
        {isYouTubeModalOpen && (
        <motion.div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => setIsYouTubeModalOpen(false)}
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
                Edit YouTube Link
              </motion.h2>
              <motion.button
                onClick={() => setIsYouTubeModalOpen(false)}
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
                  YouTube URL
                </label>
                <input
                  type="url"
                  value={youTubeLink}
                  onChange={(e) => setYouTubeLink(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors bg-white/80 backdrop-blur-sm"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  Supported formats: youtube.com/watch?v=..., youtu.be/..., or youtube.com/embed/...
                </p>
              </div>
              {youTubeLink && getYouTubeEmbedUrl(youTubeLink) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Preview</label>
                  <div className="relative h-40 rounded-xl overflow-hidden shadow-lg">
                    <iframe
                      width="100%"
                      height="100%"
                      src={getYouTubeEmbedUrl(youTubeLink)}
                      title="Video Preview"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="rounded-xl"
                    ></iframe>
                  </div>
                </motion.div>
              )}
            </motion.div>
            
            <motion.div 
              className="flex justify-end space-x-4 mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.button
                onClick={() => setIsYouTubeModalOpen(false)}
                className="px-6 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={handleYouTubeSave}
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

const WhyChooseUsCard = ({ service, index, primaryColor, secondaryColor, isAdmin, openServiceModal, openDeleteModal }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const animationVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      key={index}
      className="group relative"
      ref={ref}
      variants={animationVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-2xl font-bold text-gray-900 mb-4">{service.title}</h3>
      <div className="relative h-64 sm:h-80">
        <img src={service.image} alt={service.title} className="w-full h-full object-cover rounded-lg" />
      </div>
      <p className="mt-4 text-gray-600">{service.description}</p>
      {isAdmin && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => openServiceModal(service)}
            className="text-blue-500 hover:bg-blue-50 p-1 rounded-full"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => openDeleteModal(service)}
            className="text-red-500 hover:bg-red-50 p-1 rounded-full"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </motion.div>
  );
};

const AboutUsText = ({ ourMission, companyName, isAdmin, openMissionModal, primaryColor }) => {
  return (
    <motion.div className="space-y-6">
      <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
        About {companyName || "Our Company"}
      </h2>
      <div className="space-y-4">
        <p className="text-lg text-gray-600">{ourMission.description}</p>
        <ul className="list-disc pl-5 text-lg text-gray-600">
          {ourMission.points?.map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
      </div>
      {isAdmin && (
        <button
          onClick={openMissionModal}
          className="flex items-center gap-2 px-4 py-2 text-white rounded-md shadow-md hover:opacity-90"
          style={{ backgroundColor: primaryColor }}
        >
          <Edit size={20} /> Edit Description
        </button>
      )}
    </motion.div>
  );
};

export default AboutUs;