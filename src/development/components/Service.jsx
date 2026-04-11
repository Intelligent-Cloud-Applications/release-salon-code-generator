import React, { useState, useContext } from "react";
// --- Amplify v6 Imports ---
import { post, put, del, patch } from 'aws-amplify/api';
import { uploadData, remove } from 'aws-amplify/storage';
import { Amplify } from "aws-amplify";
const getConfig = Amplify.getConfig;
// --------------------------
import { motion, AnimatePresence } from "framer-motion";
import Context from "../Context/Context";
import { useLocation } from "react-router-dom";
import {
  Scissors,
  Clock,
  Plus,
  Edit2,
  Trash2,
  X,
  Star,
  Sparkles,
  Heart,
  Zap,
  Shield,
  Droplets,
  Palette,
  Edit,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Service = () => {
  const { institutionData, services, userData, fetchServices, setLoader, setInstitutionData } = useContext(Context);
  const primaryColor = institutionData?.PrimaryColor || "#6366f1";
  const institutionId = institutionData?.institutionid || "";
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [isTitleDescModalOpen, setIsTitleDescModalOpen] = useState(false);
  const [serviceTitle, setServiceTitle] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");

  const MAX_NAME_LENGTH = 30;
  const MAX_DESC_LENGTH = 150;

  const [formData, setFormData] = useState({
    serviceName: "",
    amount: "",
    duration: "00:00",
    serviceDescription: "",
    imageUrl: "",
    imageFile: null,
    category: "",
    currency: institutionData?.currency || "INR",
  });

  const isAdmin = userData.userType === "admin";
  const categoryIcons = {
    "Best Seller": Star,
    Facial: Sparkles,
    "Hair Styling": Scissors,
    "Hair Treatment": Heart,
    "Tattoo & Piercing": Zap,
    "Basic Service": Shield,
    "Beard & Shave Service": Scissors,
    Bleach: Droplets,
    "Nail Services": Palette,
    Pedicure: Heart,
    "Waxing Services": Sparkles,
  };

  const categories = [
    ...new Set(services.map((service) => service.category).filter(Boolean)),
  ];

  const [categoryQuery, setCategoryQuery] = useState(formData?.category ?? "");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(categoryQuery.toLowerCase()),
  );

  const handleCategorySelect = (selectedName) => {
    setCategoryQuery(selectedName);
    handleInputChange({ target: { name: "category", value: selectedName } });
    setShowSuggestions(false);
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || institutionData?.currency || "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // const formatDuration = (epoch) => { ... } // (Unused in visible code, kept if needed)

  const containsHTML = (text) => {
    const htmlTagRegex = /<[a-zA-Z][^>]*>/;
    return htmlTagRegex.test(text);
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "amount") {
      const amountRegex = /^\d*\.?\d{0,2}$/;
      if (value === "" || amountRegex.test(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
      return;
    }
    if (name === "imageFile") {
      const file = files[0];
      if (file) {
        setFormData((prev) => ({ ...prev, imageFile: file }));
      }
      return;
    }
    if (name === "serviceName" && value.length > MAX_NAME_LENGTH) {
      toast.error(`Service name cannot exceed ${MAX_NAME_LENGTH} characters`);
      return;
    }
    if (name === "serviceDescription" && value.length > MAX_DESC_LENGTH) {
      toast.error(`Description cannot exceed ${MAX_DESC_LENGTH} characters`);
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- Updated: Upload image to S3 (Amplify v6) ---
  const uploadImageToS3 = async (file) => {
    if (!file) return null;
    try {
      const fileName = `services/${Date.now()}-${file.name}`;

      const result = await uploadData({
        key: fileName,
        data: file,
        options: {
          accessLevel: "guest", // 'guest' replaces 'public'
          contentType: file.type,
        },
      }).result;

      // Construct Public URL
      const config = getConfig();
      const bucket = config.Storage?.S3?.bucket;
      const region = config.Storage?.S3?.region;

      if (bucket && region) {
        return `https://${bucket}.s3.${region}.amazonaws.com/public/${result.key}`;
      }
      throw new Error("S3 Configuration missing");
    } catch (error) {
      console.error("Error uploading image to S3:", error);
      toast.error("Failed to upload image");
      throw error;
    }
  };

  const checkDuplicateName = (name, excludeServiceId = null) => {
    return services.some(
      (service) =>
        service.serviceName.toLowerCase() === name.toLowerCase() &&
        (!excludeServiceId || service.serviceId !== excludeServiceId),
    );
  };

  // --- Updated: Create Service (Amplify v6 API) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error("You must be an admin to add services.");
      return;
    }

    if (
      !formData.serviceName ||
      !formData.amount ||
      !formData.duration ||
      !formData.serviceDescription
    ) {
      toast.error("All fields except image are required");
      return;
    }
    if (checkDuplicateName(formData.serviceName)) {
      toast.error("A service with this name already exists");
      return;
    }
    if (containsHTML(formData.serviceDescription)) {
      toast.error("HTML tags are not allowed in the description");
      return;
    }

    try {
      setIsLoading(true);
      let imageUrl = formData.imageUrl;
      if (formData.imageFile) {
        imageUrl = await uploadImageToS3(formData.imageFile);
      }

      const serviceData = {
        serviceName: formData.serviceName,
        amount: parseFloat(formData.amount),
        duration: formData.duration,
        serviceDescription: formData.serviceDescription,
        category: formData.category,
        imageUrl: imageUrl || "",
        currency: formData.currency,
      };

      const response = await post({
        apiName: "main",
        path: `/admin/${institutionId}/create-services`,
        options: { body: serviceData },
      }).response;

      const responseData = await response.body.json();

      if (responseData.service) {
        toast.success("Service added successfully");
        resetForm();
        setIsModalOpen(false);
        fetchServices();
      }
    } catch (error) {
      console.error("Error creating service:", error);
      toast.error(error.message || "Failed to add service");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Updated: Update Service (Amplify v6 API) ---
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error("You must be an admin to update services.");
      return;
    }

    if (
      !formData.serviceName &&
      !formData.amount &&
      !formData.duration &&
      !formData.serviceDescription &&
      !formData.imageFile
    ) {
      toast.error("At least one field is required to update");
      return;
    }
    if (
      formData.serviceName &&
      checkDuplicateName(formData.serviceName, selectedService.serviceId)
    ) {
      toast.error("A service with this name already exists");
      return;
    }
    if (
      formData.serviceDescription &&
      containsHTML(formData.serviceDescription)
    ) {
      toast.error("HTML tags are not allowed in the description");
      return;
    }

    try {
      setIsLoading(true);
      let imageUrl = selectedService.imageUrl;
      if (formData.imageFile) {
        if (selectedService.imageUrl) {
          const oldImageKey = selectedService.imageUrl
            .split("/")
            .slice(-2)
            .join("/");

          // Delete old image
          try {
            await remove({ key: oldImageKey, options: { accessLevel: 'guest' } });
          } catch (err) { console.warn("Old image delete failed", err) }
        }
        imageUrl = await uploadImageToS3(formData.imageFile);
      }

      const serviceData = {};
      if (formData.serviceName) serviceData.serviceName = formData.serviceName;
      if (formData.amount) serviceData.amount = parseFloat(formData.amount);
      if (formData.duration) serviceData.duration = formData.duration;
      if (formData.serviceDescription)
        serviceData.serviceDescription = formData.serviceDescription;
      if (imageUrl !== selectedService.imageUrl)
        serviceData.imageUrl = imageUrl || "";
      if (formData.currency) serviceData.currency = formData.currency;
      if (formData.category) serviceData.category = formData.category;

      const response = await put({
        apiName: "main",
        path: `/admin/${institutionId}/services/${selectedService.serviceId}`,
        options: { body: serviceData },
      }).response;

      const responseData = await response.body.json();

      if (responseData.service) {
        toast.success("Service updated successfully");
        resetForm();
        setIsEditModalOpen(false);
        fetchServices();
      }
    } catch (error) {
      console.error("Error updating service:", error);
      toast.error(error.message || "Failed to update service");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Updated: Delete Service (Amplify v6 API) ---
  const handleDelete = async (serviceId) => {
    if (!isAdmin) {
      toast.error("You must be an admin to delete services.");
      return;
    }

    try {
      setIsLoading(true);
      const service = services.find((s) => s.serviceId === serviceId);
      if (service.imageUrl) {
        const imageKey = service.imageUrl.split("/").slice(-2).join("/");
        try {
          await remove({ key: imageKey, options: { accessLevel: 'guest' } });
        } catch (err) { console.warn("Image delete failed", err) }
      }

      await del({
        apiName: "main",
        path: `/admin/${institutionId}/services/${serviceId}`
      }).response;

      toast.success("Service deleted successfully");
      fetchServices();
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error(error.message || "Failed to delete service");
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (service) => {
    if (!isAdmin) {
      toast.error("You must be an admin to edit services.");
      return;
    }
    setSelectedService(service);
    setFormData({
      serviceName: service.serviceName,
      amount: service.amount.toString(),
      duration: service.duration,
      serviceDescription: service.serviceDescription,
      imageUrl: service.imageUrl || "",
      imageFile: null,
      category: service.category || "",
      currency: service.currency || institutionData?.currency || "USD",
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      serviceName: "",
      amount: "",
      duration: "00:00",
      serviceDescription: "",
      imageUrl: "",
      imageFile: null,
      category: "",
      currency: institutionData?.currency || "USD",
    });
    setCategoryQuery("");
    setShowSuggestions(false);
    setSelectedService(null);
  };

  // Open title/description edit modal
  const openTitleDescModal = () => {
    setServiceTitle(institutionData?.serviceData?.title || "Our Services");
    setServiceDescription(institutionData?.serviceData?.description || "Elevate your style with our expertly crafted services. From precision cuts to transformative treatments, we're committed to bringing out your best look.");
    setIsTitleDescModalOpen(true);
  };

  // --- Updated: Handle title/description save (Amplify v6 API) ---
  const handleTitleDescSave = async () => {
    if (!serviceTitle.trim() || !serviceDescription.trim()) {
      toast.error("Title and description are required");
      return;
    }

    try {
      setLoader(true);
      const updatedServiceData = {
        title: serviceTitle.trim(),
        description: serviceDescription.trim(),
      };

      await patch({
        apiName: "main",
        path: `/admin/${institutionId}/update-ui`,
        options: {
          body: { data: { serviceData: updatedServiceData } },
        },
      }).response;

      setInstitutionData((prev) => ({
        ...prev,
        serviceData: updatedServiceData,
      }));
      setIsTitleDescModalOpen(false);
      toast.success("Service section updated successfully");
    } catch (error) {
      console.error("Error updating service section:", error);
      toast.error(`Failed to update: ${error.message || "Unknown error"}`);
    } finally {
      setLoader(false);
    }
  };

  return (
    <div className="bg-gray-200 py-16">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center relative group"
        >
          <h2
            className={`mb-4 text-3xl font-bold text-gray-900 sm:text-4xl ${
              location.pathname === "/services" ? "mt-20" : ""
            }`}
          >
            {institutionData?.serviceData?.title || "Our Services"}
          </h2>
          <p className="mx-auto max-w-3xl text-xl text-gray-600 mb-6">
            {institutionData?.serviceData?.description || "Elevate your style with our expertly crafted services. From precision cuts to transformative treatments, we're committed to bringing out your best look."}
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

              <button
                className="mx-auto mt-4 flex items-center bg-stone-400 gap-2 rounded-md px-4 py-2 text-white hover:opacity-90"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus size={16} /> Add Service
              </button>
            </>
          )}
        </motion.div>
        {categories.map((category) => {
          const filteredServices = services
            .filter((service) => service.category === category)
            .sort(
              (a, b) => Number(a?.amount || 0) - Number(b?.amount || 0),
            );

          return (
            <div key={category} className="mb-8 px-10">
              <h3 className="mb-4 text-2xl font-bold">{category}</h3>
              <div className="grid gap-6 md:grid-cols-3">
                {filteredServices.length > 0 ? (
                  filteredServices.map((service, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      transition={{
                        duration: 0.4,
                        type: "spring",
                        stiffness: 300,
                      }}
                      className="group"
                    >
                      <div className="transform overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300 hover:shadow-lg">
                        <div className="relative h-48 overflow-hidden">
                          {service.imageUrl ? (
                            <img
                              src={service.imageUrl}
                              alt={service.serviceName}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                          ) : (
                            <div
                              className="flex h-48 w-full items-center justify-center rounded-t-lg bg-stone-300"
                              // style={{ backgroundColor: primaryColor }}
                            >
                              {(() => {
                                const Icon =
                                  categoryIcons[service.category] || Scissors; // fallback to Scissors if no match
                                return (
                                  <Icon
                                    size={60}
                                    className="text-white opacity-70"
                                  />
                                );
                              })()}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-20 transition-opacity duration-300 group-hover:opacity-0"></div>
                        </div>
                        <div className="p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900">
                              {service.serviceName}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span
                                className="rounded-full bg-stone-400 px-2 py-1 text-base font-semibold text-white"
                                // style={{ backgroundColor: primaryColor }}
                              >
                                {formatCurrency(
                                  service.amount,
                                  service.currency,
                                )}
                              </span>
                              {isAdmin && (
                                <>
                                  <button
                                    className="p-1 text-gray-500 hover:text-blue-600"
                                    onClick={() => openEditModal(service)}
                                    title="Edit Service"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    className="p-1 text-gray-500 hover:text-red-600"
                                    onClick={() =>
                                      handleDelete(service.serviceId)
                                    }
                                    title="Delete Service"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          <p className="mb-3 line-clamp-2 text-sm text-gray-600">
                            {service.serviceDescription}
                          </p>
                          <div className="flex items-center text-gray-700">
                            <Clock size={16} className="mr-2" />
                            <span className="text-sm font-medium">
                              {service.duration}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center">
                    <Scissors
                      size={64}
                      className="mx-auto mb-4 text-gray-400"
                    />
                    <h3 className="mb-2 text-2xl font-semibold text-gray-900">
                      No Services Available
                    </h3>
                    <p className="text-gray-600">
                      We're currently updating our service offerings. Check back
                      soon!
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Add Service Modal */}
        <AnimatePresence>
          {isModalOpen && isAdmin && (
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsModalOpen(false)}
            >
              <motion.div
                className="bg-white/95 backdrop-blur-md rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-white/20 max-h-[80vh] overflow-y-auto"
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
                    Add New Service
                  </motion.h2>
                  <motion.button
                    onClick={() => setIsModalOpen(false)}
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

                <motion.form
                  onSubmit={handleSubmit}
                  className="space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Service Name *
                    </label>
                    <input
                      type="text"
                      name="serviceName"
                      value={formData.serviceName}
                      onChange={handleInputChange}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors bg-white/80 backdrop-blur-sm"
                      required
                      placeholder="e.g. Men's Haircut"
                      maxLength={MAX_NAME_LENGTH}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Price *
                    </label>
                    <input
                      type="text"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors bg-white/80 backdrop-blur-sm"
                      required
                      placeholder="0.00"
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category *
                    </label>
                    <input
                      type="text"
                      name="category"
                      value={categoryQuery}
                      onChange={(e) => {
                        setCategoryQuery(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors bg-white/80 backdrop-blur-sm"
                      placeholder="Start typing to search category..."
                      required
                    />

                    {/* Suggestions dropdown */}
                    {showSuggestions && filteredCategories.length > 0 && (
                      <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-md">
                        {filteredCategories.map((cat) => (
                          <li
                            key={cat}
                            className="cursor-pointer px-3 py-2 hover:bg-gray-100"
                            onClick={() => {
                              handleCategorySelect(cat);
                              setCategoryQuery(cat);
                              setShowSuggestions(false);
                            }}
                          >
                            {cat}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Duration *
                    </label>
                    <input
                      type="text"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors bg-white/80 backdrop-blur-sm"
                      required
                      placeholder="HH:MM (e.g., 00:30)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      name="serviceDescription"
                      value={formData.serviceDescription}
                      onChange={handleInputChange}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors bg-white/80 backdrop-blur-sm resize-none"
                      rows="4"
                      required
                      placeholder="Describe the service..."
                      maxLength={MAX_DESC_LENGTH}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Service Image (optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
                      <input
                        type="file"
                        name="imageFile"
                        accept="image/*"
                        onChange={handleInputChange}
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
                  </div>

                  <motion.div
                    className="flex justify-end space-x-4 mt-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <motion.button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-6 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="submit"
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
                      disabled={isLoading}
                    >
                      {isLoading ? "Saving..." : "Add Service"}
                    </motion.button>
                  </motion.div>
                </motion.form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Service Modal */}
        <AnimatePresence>
          {isEditModalOpen && isAdmin && (
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsEditModalOpen(false)}
            >
              <motion.div
                className="bg-white/95 backdrop-blur-md rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-white/20 max-h-[80vh] overflow-y-auto"
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
                    Edit Service
                  </motion.h2>
                  <motion.button
                    onClick={() => setIsEditModalOpen(false)}
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

                <motion.form
                  onSubmit={handleUpdateSubmit}
                  className="space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Service Name
                    </label>
                    <input
                      type="text"
                      name="serviceName"
                      value={formData.serviceName}
                      onChange={handleInputChange}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors bg-white/80 backdrop-blur-sm"
                      placeholder="e.g. Men's Haircut"
                      maxLength={MAX_NAME_LENGTH}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Price
                    </label>
                    <input
                      type="text"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors bg-white/80 backdrop-blur-sm"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="relative">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Category *
                    </label>
                    <input
                      type="text"
                      name="category"
                      value={
                        categoryQuery !== ""
                          ? categoryQuery
                          : formData.category || ""
                      }
                      onChange={(e) => {
                        setCategoryQuery(e.target.value);
                        setShowSuggestions(true);
                        handleInputChange({
                          target: { name: "category", value: e.target.value },
                        });
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2"
                      style={{ "--focus-ring": primaryColor }}
                      placeholder="Start typing to search category..."
                      required
                    />

                    {/* Suggestions dropdown */}
                    {showSuggestions && filteredCategories.length > 0 && (
                      <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-md">
                        {filteredCategories.map((cat) => (
                          <li
                            key={cat}
                            className="cursor-pointer px-3 py-2 hover:bg-gray-100"
                            onClick={() => {
                              handleCategorySelect(cat);
                              setCategoryQuery(cat);
                              handleInputChange({
                                target: { name: "category", value: cat },
                              });
                              setShowSuggestions(false);
                            }}
                          >
                            {cat}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Duration
                    </label>
                    <input
                      type="text"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2"
                      style={{ "--focus-ring": primaryColor }}
                      placeholder="HH:MM (e.g., 00:30)"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      name="serviceDescription"
                      value={formData.serviceDescription}
                      onChange={handleInputChange}
                      className="h-24 w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2"
                      style={{ "--focus-ring": primaryColor }}
                      placeholder="Describe the service..."
                      maxLength={MAX_DESC_LENGTH}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Service Image
                    </label>
                    <input
                      type="file"
                      name="imageFile"
                      accept="image/*"
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 p-2"
                    />
                    {formData.imageUrl && (
                      <img
                        src={formData.imageUrl}
                        alt="Service Preview"
                        className="mt-2 h-32 w-32 rounded-md object-cover"
                      />
                    )}
                  </div>
                  <motion.div
                    className="flex justify-end space-x-4 mt-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <motion.button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="px-6 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="submit"
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
                      disabled={isLoading}
                    >
                      {isLoading ? "Updating..." : "Update Service"}
                    </motion.button>
                  </motion.div>
                </motion.form>
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
                    Edit Service Section
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
                      value={serviceTitle}
                      onChange={(e) => setServiceTitle(e.target.value)}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors bg-white/80 backdrop-blur-sm"
                      placeholder="Enter section title"
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
    </div>
  );
};

export default Service;