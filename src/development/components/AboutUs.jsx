import React, { useState, useRef, useContext, useEffect } from "react";
import { useInView, motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import Context from "../Context/Context";

// --- Amplify v6 Imports ---
import { patch } from "aws-amplify/api";
import { uploadData, getUrl } from "aws-amplify/storage";
import { Amplify } from "aws-amplify";
const getConfig = Amplify.getConfig;
// --------------------------

import { toast } from "react-toastify";
import { Plus, Edit, Trash2, X } from "lucide-react";
import Confirm from "./ui/Confirm";

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

  return videoId
    ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1`
    : null;
};

const AboutUs = () => {
  const { institutionData, userData, setLoader, setInstitutionData } =
    useContext(Context);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
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
  const [missionDescription, setMissionDescription] = useState(
    ourMission.description || "",
  );
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

  // --- Updated: Upload image to S3 (Amplify v6) ---
  const uploadImageToS3 = async (file) => {
    if (!file) return null;
    try {
      const fileName = `aboutus/${Date.now()}-${file.name}`;

      // 1. Upload Data
      const result = await uploadData({
        key: fileName,
        data: file,
        options: {
          accessLevel: "public",
          contentType: file.type,
        },
      }).result;

      // 2. Construct Public URL
      // We retrieve bucket/region from config to manually construct the public URL
      // matching the previous behavior.
      const config = getConfig();
      const bucket = config.Storage?.S3?.bucket;
      const region = config.Storage?.S3?.region;

      if (bucket && region) {
        return `https://${bucket}.s3.${region}.amazonaws.com/public/${result.key}`;
      } else {
        // Fallback: If config structure is different, use getUrl (might return signed URL)
        const urlOutput = await getUrl({
          key: result.key,
          options: { accessLevel: "public", validateObjectExistence: false },
        });
        return urlOutput.url.toString();
      }
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

  // --- Updated: Handle mission save (Amplify v6 API) ---
  const handleMissionSave = async () => {
    if (!missionDescription.trim()) {
      toast.error("Description is required");
      return;
    }

    try {
      setLoader(true);
      const updatedMission = { ...ourMission, description: missionDescription };

      await patch({
        apiName: "main",
        path: `/admin/${institutionId}/update-ui`,
        options: {
          body: { data: { ourMission: updatedMission } },
        },
      }).response;

      setInstitutionData((prev) => ({
        ...prev,
        ourMission: updatedMission,
      }));
      setIsMissionModalOpen(false);
      toast.success("Mission updated");
    } catch (error) {
      console.error("Error saving mission:", error);
      toast.error(
        `Failed to save mission: ${error.message || "Unknown error"}`,
      );
    } finally {
      setLoader(false);
    }
  };

  // --- Updated: Handle service save (Amplify v6 API) ---
  const handleServiceSave = async () => {
    if (!serviceTitle.trim() || !serviceDescription.trim()) {
      toast.error("Title and description are required");
      return;
    }

    try {
      setLoader(true);
      const imageUrl = serviceImage
        ? await uploadImageToS3(serviceImage)
        : selectedService?.image;
      const updatedService = {
        title: serviceTitle,
        description: serviceDescription,
        image: imageUrl || selectedService?.image,
      };
      let updatedWhyChooseUs;

      if (selectedService) {
        updatedWhyChooseUs = {
          ...whyChooseUs,
          services: whyChooseUs.services.map((s, i) =>
            i === whyChooseUs.services.indexOf(selectedService)
              ? updatedService
              : s,
          ),
        };
      } else {
        updatedWhyChooseUs = {
          ...whyChooseUs,
          services: [...(whyChooseUs.services || []), updatedService],
        };
      }

      await patch({
        apiName: "main",
        path: `/admin/${institutionId}/update-ui`,
        options: {
          body: { data: { whyChooseUs: updatedWhyChooseUs } },
        },
      }).response;

      setInstitutionData((prev) => ({
        ...prev,
        whyChooseUs: updatedWhyChooseUs,
      }));
      setIsServiceModalOpen(false);
      toast.success(selectedService ? "Service updated" : "Service added");
    } catch (error) {
      console.error("Error saving service:", error);
      toast.error(
        `Failed to save service: ${error.message || "Unknown error"}`,
      );
    } finally {
      setLoader(false);
    }
  };

  // --- Updated: Handle service delete (Amplify v6 API) ---
  const handleDelete = async () => {
    try {
      setLoader(true);
      const updatedWhyChooseUs = {
        ...whyChooseUs,
        services: whyChooseUs.services.filter((s) => s !== selectedService),
      };

      await patch({
        apiName: "main",
        path: `/admin/${institutionId}/update-ui`,
        options: {
          body: { data: { whyChooseUs: updatedWhyChooseUs } },
        },
      }).response;

      setInstitutionData((prev) => ({
        ...prev,
        whyChooseUs: updatedWhyChooseUs,
      }));
      setIsDeleteModalOpen(false);
      toast.success("Service deleted");
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error(
        `Failed to delete service: ${error.message || "Unknown error"}`,
      );
    } finally {
      setLoader(false);
    }
  };

  // Open Why Choose Us edit modal
  const openWhyChooseUsModal = () => {
    setWhyChooseUsTitle(whyChooseUs?.title || "Why Choose Us");
    setWhyChooseUsDescription(
      whyChooseUs?.description ||
        "Discover the reasons why our customers love us",
    );
    setIsWhyChooseUsModalOpen(true);
  };

  // --- Updated: Handle Why Choose Us save (Amplify v6 API) ---
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

      await patch({
        apiName: "main",
        path: `/admin/${institutionId}/update-ui`,
        options: {
          body: { data: { whyChooseUs: updatedWhyChooseUs } },
        },
      }).response;

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

  // --- Updated: Handle YouTube link save (Amplify v6 API) ---
  const handleYouTubeSave = async () => {
    try {
      setLoader(true);
      const updatedData = { ytLink: youTubeLink.trim() };

      await patch({
        apiName: "main",
        path: `/admin/${institutionId}/update-ui`,
        options: {
          body: { data: updatedData },
        },
      }).response;

      setInstitutionData((prev) => ({
        ...prev,
        ...updatedData,
      }));
      setIsYouTubeModalOpen(false);
      toast.success("YouTube link updated");
    } catch (error) {
      console.error("Error updating YouTube link:", error);
      toast.error(
        `Failed to update YouTube link: ${error.message || "Unknown error"}`,
      );
    } finally {
      setLoader(false);
    }
  };

  const hasValidTestimonials = whyChooseUs?.services?.length > 0;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
        {/* Why Choose Us Section */}
        <div
          className={`mb-20 ${location.pathname === "/aboutus" ? "mt-10" : ""}`}
        >
          <div className="group relative mx-auto mb-12 max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
              {whyChooseUs?.title || "Why Choose Us"}
            </h2>
            <p className="text-lg text-gray-600">
              {whyChooseUs?.description ||
                "Discover the reasons why our customers love us"}
            </p>
            {isAdmin && (
              <button
                onClick={openWhyChooseUsModal}
                className="absolute right-0 top-0 rounded-full bg-white p-2 opacity-0 shadow-lg transition-all duration-300 hover:scale-110 group-hover:opacity-100"
                style={{ border: `2px solid ${primaryColor}` }}
              >
                <Edit size={16} style={{ color: primaryColor }} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
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
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
          {/* Embedded YouTube Player */}
          <div className="group relative h-[400px] overflow-hidden rounded-lg">
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
              <div className="flex h-full flex-col items-center justify-center bg-gray-200 text-gray-600">
                <p className="text-center">No video available.</p>
                <p className="mt-2 text-center text-sm">
                  Please ensure a valid YouTube link is provided.
                </p>
              </div>
            )}
            {isAdmin && (
              <button
                onClick={openYouTubeModal}
                className="absolute right-4 top-4 rounded-full bg-white p-2 opacity-0 shadow-lg transition-all duration-300 hover:scale-110 group-hover:opacity-100"
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsWhyChooseUsModalOpen(false)}
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
                  Edit Why Choose Us
                </motion.h2>
                <motion.button
                  onClick={() => setIsWhyChooseUsModalOpen(false)}
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
                    value={whyChooseUsTitle}
                    onChange={(e) => setWhyChooseUsTitle(e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white/80 p-4 backdrop-blur-sm transition-colors focus:border-blue-500 focus:outline-none"
                    placeholder="Enter section title"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={whyChooseUsDescription}
                    onChange={(e) => setWhyChooseUsDescription(e.target.value)}
                    className="w-full resize-none rounded-xl border-2 border-gray-200 bg-white/80 p-4 backdrop-blur-sm transition-colors focus:border-blue-500 focus:outline-none"
                    rows="4"
                    placeholder="Enter section description"
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
                  onClick={() => setIsWhyChooseUsModalOpen(false)}
                  className="rounded-xl bg-gray-100 px-6 py-3 font-medium text-gray-600 transition-colors hover:bg-gray-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleWhyChooseUsSave}
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

      {/* Mission Edit Modal */}
      <AnimatePresence>
        {isMissionModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsMissionModalOpen(false)}
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
                  Edit Description
                </motion.h2>
                <motion.button
                  onClick={() => setIsMissionModalOpen(false)}
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
                    Description
                  </label>
                  <textarea
                    value={missionDescription}
                    onChange={(e) => setMissionDescription(e.target.value)}
                    className="w-full resize-none rounded-xl border-2 border-gray-200 bg-white/80 p-4 backdrop-blur-sm transition-colors focus:border-blue-500 focus:outline-none"
                    rows="6"
                    placeholder="Enter mission description"
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
                  onClick={() => setIsMissionModalOpen(false)}
                  className="rounded-xl bg-gray-100 px-6 py-3 font-medium text-gray-600 transition-colors hover:bg-gray-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleMissionSave}
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

      {/* Service Edit/Add Modal */}
      <AnimatePresence>
        {isServiceModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsServiceModalOpen(false)}
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
                  {selectedService ? "Edit Service" : "Add Service"}
                </motion.h2>
                <motion.button
                  onClick={() => setIsServiceModalOpen(false)}
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
                    value={serviceTitle}
                    onChange={(e) => setServiceTitle(e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white/80 p-4 backdrop-blur-sm transition-colors focus:border-blue-500 focus:outline-none"
                    placeholder="Enter service title"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    className="w-full resize-none rounded-xl border-2 border-gray-200 bg-white/80 p-4 backdrop-blur-sm transition-colors focus:border-blue-500 focus:outline-none"
                    rows="4"
                    placeholder="Enter service description"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Image (optional)
                  </label>
                  <div className="rounded-xl border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-gray-400">
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={(e) => setServiceImage(e.target.files[0])}
                      className="hidden"
                      id="service-image-upload"
                    />
                    <label
                      htmlFor="service-image-upload"
                      className="cursor-pointer"
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
                    </label>
                  </div>
                  {serviceImage && (
                    <motion.div
                      className="mt-4 text-center"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="mb-2 text-sm font-semibold text-gray-700">
                        Image Preview
                      </p>
                      <div className="flex justify-center">
                        <img
                          src={URL.createObjectURL(serviceImage)}
                          alt="Preview"
                          className="h-24 w-24 rounded-lg object-cover shadow-md"
                        />
                      </div>
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
                  onClick={() => setIsServiceModalOpen(false)}
                  className="rounded-xl bg-gray-100 px-6 py-3 font-medium text-gray-600 transition-colors hover:bg-gray-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleServiceSave}
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsYouTubeModalOpen(false)}
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
                  Edit YouTube Link
                </motion.h2>
                <motion.button
                  onClick={() => setIsYouTubeModalOpen(false)}
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
                    YouTube URL
                  </label>
                  <input
                    type="url"
                    value={youTubeLink}
                    onChange={(e) => setYouTubeLink(e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white/80 p-4 backdrop-blur-sm transition-colors focus:border-blue-500 focus:outline-none"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Supported formats: youtube.com/watch?v=..., youtu.be/..., or
                    youtube.com/embed/...
                  </p>
                </div>
                {youTubeLink && getYouTubeEmbedUrl(youTubeLink) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Preview
                    </label>
                    <div className="relative h-40 overflow-hidden rounded-xl shadow-lg">
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
                className="mt-8 flex justify-end space-x-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <motion.button
                  onClick={() => setIsYouTubeModalOpen(false)}
                  className="rounded-xl bg-gray-100 px-6 py-3 font-medium text-gray-600 transition-colors hover:bg-gray-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleYouTubeSave}
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

const WhyChooseUsCard = ({
  service,
  index,
  primaryColor,
  secondaryColor,
  isAdmin,
  openServiceModal,
  openDeleteModal,
}) => {
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
      <h3 className="mb-4 text-2xl font-bold text-gray-900">{service.title}</h3>
      <div className="relative h-64 sm:h-80">
        <img
          src={service.image}
          alt={service.title}
          className="h-full w-full rounded-lg object-cover"
        />
      </div>
      <p className="mt-4 text-gray-600">{service.description}</p>
      {isAdmin && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => openServiceModal(service)}
            className="rounded-full p-1 text-blue-500 hover:bg-blue-50"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => openDeleteModal(service)}
            className="rounded-full p-1 text-red-500 hover:bg-red-50"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </motion.div>
  );
};

const AboutUsText = ({
  ourMission,
  companyName,
  isAdmin,
  openMissionModal,
  primaryColor,
}) => {
  return (
    <motion.div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
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
          className="flex items-center gap-2 rounded-md px-4 py-2 text-white shadow-md hover:opacity-90"
          style={{ backgroundColor: primaryColor }}
        >
          <Edit size={20} /> Edit Description
        </button>
      )}
    </motion.div>
  );
};

export default AboutUs;
