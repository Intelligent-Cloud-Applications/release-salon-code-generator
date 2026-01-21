import React, { useState, useEffect, useContext } from "react";
// --- Amplify v6 Imports ---
import { put, del } from "aws-amplify/api";
import { uploadData, remove } from "aws-amplify/storage";
import { Amplify } from "aws-amplify";
const getConfig = Amplify.getConfig;
// --------------------------
import { motion } from "framer-motion";
import Context from "../Context/Context";
import { useLocation } from "react-router-dom";
import {
  Scissors,
  Clock,
  Plus,
  Edit2,
  Trash2,
  X,
  ShoppingCart,
  CheckCircle,
  Star,
  Sparkles,
  Heart,
  Zap,
  Shield,
  Droplets,
  Palette,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { set } from "date-fns";

const ScissorsLoader = ({ text = "Loading..." }) => {
  return (
    <div className="flex h-80 flex-col items-center justify-center space-y-6">
      <div className="relative">
        <div className="animate-pulse">
          <Scissors className="h-24 w-24 animate-bounce text-stone-700" />
        </div>
        <div className="absolute -right-3 -top-3 h-6 w-6 animate-ping rounded-full bg-stone-400"></div>
        <div
          className="absolute -bottom-3 -left-3 h-5 w-5 animate-ping rounded-full bg-stone-500"
          style={{ animationDelay: "0.5s" }}
        ></div>
      </div>
      <div className="text-center">
        <p className="animate-pulse text-2xl font-semibold text-stone-800">
          {text}
        </p>
        <div className="mt-3 flex items-center justify-center space-x-2">
          <div
            className="h-3 w-3 animate-bounce rounded-full bg-stone-500"
            style={{ animationDelay: "0ms" }}
          ></div>
          <div
            className="h-3 w-3 animate-bounce rounded-full bg-stone-500"
            style={{ animationDelay: "150ms" }}
          ></div>
          <div
            className="h-3 w-3 animate-bounce rounded-full bg-stone-500"
            style={{ animationDelay: "300ms" }}
          ></div>
        </div>
      </div>
    </div>
  );
};

const Service = () => {
  const {
    institutionData,
    userData,
    createService,
    services,
    fetchServices,
    loader,
  } = useContext(Context);
  const primaryColor = institutionData?.PrimaryColor || "#6366f1";
  const institutionId = institutionData?.institutionid || "";
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [cart, setCart] = useState([]);
  const MAX_NAME_LENGTH = 30;
  const MAX_DESC_LENGTH = 150;
  const [loading, setLoading] = useState(false);

  // Form state for add/edit
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

  // For category filter selection (invoice page style)
  const serviceCategories = [...new Set(services.map((s) => s.category))]
    .map((catId) => ({
      id: catId,
      name: catId,
      icon: categoryIcons[catId] || Scissors,
    }))
    .sort((a, b) => {
      // Put "Best Seller" at the top
      if (a.name.toLowerCase() === "best seller") return -1;
      if (b.name.toLowerCase() === "best seller") return 1;
      return a.name.localeCompare(b.name);
    });

  const [categoryQuery, setCategoryQuery] = useState(formData.category || "");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filter categories based on query
  const filteredCategories = serviceCategories.filter((cat) =>
    cat?.name?.toLowerCase().includes(categoryQuery.toLowerCase()),
  );

  const handleCategorySelect = (selectedName) => {
    setCategoryQuery(selectedName);
    setFormData((prev) => ({ ...prev, category: selectedName }));
    setShowSuggestions(false);
  };

  const [selectedCategory, setSelectedCategory] = useState(
    serviceCategories.find((cat) => cat.id === "Best Seller")?.id ||
      serviceCategories[0]?.id ||
      null,
  );

  // Filtered services based on selected category, sorted by amount ascending
  const filteredServices = services
    .filter((s) => s.category === selectedCategory)
    .sort((a, b) => Number(a?.amount || 0) - Number(b?.amount || 0));

  const isAdmin = "admin"; // In your original code you set this string, ensure this logic matches your real auth

  // Set "Best Seller" as default category when services are loaded
  useEffect(() => {
    if (services.length > 0 && !selectedCategory) {
      const bestSellerCategory = serviceCategories.find(
        (cat) => cat.id === "Best Seller",
      );
      if (bestSellerCategory) {
        setSelectedCategory("Best Seller");
      } else if (serviceCategories.length > 0) {
        setSelectedCategory(serviceCategories[0].id);
      }
    }
  }, [services, serviceCategories]);

  // Currency formatter
  const formatCurrency = (amount, currency) => {
    const ccy = currency || institutionData?.currency || "INR";
    const locale = ccy === "INR" ? "en-IN" : "en-US";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: ccy,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Cart helpers
  const addToCart = (service) => {
    if (!cart.some((item) => item.serviceId === service.serviceId)) {
      setCart([...cart, service]);
    }
  };
  const getTotal = () =>
    cart.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

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
          accessLevel: "guest", // 'guest' corresponds to 'public' in v5
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
      !formData.category
    ) {
      toast.error("Service name, amount, duration, and category are required");
      return;
    }
    if (checkDuplicateName(formData.serviceName)) {
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
        currency: "INR",
      };

      // Note: Assuming createService wraps the API.post call from Context.
      // If it's a raw function, it should be updated in Context/Context.js as well.
      const response = await createService(serviceData);

      if (response.service) {
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

          try {
            await remove({
              key: oldImageKey,
              options: { accessLevel: "guest" },
            });
          } catch (err) {
            console.warn("Failed to remove old image", err);
          }
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
        options: {
          body: serviceData,
        },
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
          await remove({ key: imageKey, options: { accessLevel: "guest" } });
        } catch (err) {
          console.warn("Failed to remove image", err);
        }
      }

      await del({
        apiName: "main",
        path: `/admin/${institutionId}/services/${serviceId}`,
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
      category: service.category,
      serviceDescription: service.serviceDescription,
      imageUrl: service.imageUrl || "",
      imageFile: null,
      currency: service.currency || institutionData?.currency || "INR",
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
  };

  return (
    <div className="py-3">
      <ToastContainer position="top-right" autoClose={3000} />
      {loading ? (
        <div className="flex justify-center py-12">
          <ScissorsLoader text="Loading Services..." />
        </div>
      ) : (
        <div className="container mx-auto flex gap-6 px-4">
          {/* Category Sidebar */}

          <div className="w-64 rounded-lg bg-stone-50 px-4">
            <h3 className="mb-4 text-lg font-semibold text-stone-800">
              Service Categories
            </h3>
            <div className="space-y-2">
              {serviceCategories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${
                      selectedCategory === category.id
                        ? "bg-stone-600 text-white"
                        : "bg-white text-stone-700 hover:bg-stone-100"
                    }`}
                  >
                    <IconComponent className="h-5 w-5" />
                    <span className="text-sm font-medium">{category.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-stone-800">
                  {
                    serviceCategories.find((cat) => cat.id === selectedCategory)
                      ?.name
                  }{" "}
                  Services
                </h2>
                <p className="text-stone-600">
                  Select services to add to your invoice
                </p>
              </div>
              <div className="flex gap-4">
                {isAdmin && (
                  <button
                    className="mx-auto mt-4 flex items-center gap-2 rounded-md bg-stone-700 px-4 py-2 text-white hover:opacity-90"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <Plus size={16} /> Add Service
                  </button>
                )}
              </div>
            </div>

            {/* Services Grid */}

            {loader ? (
              <ScissorsLoader text="Loading Services..." />
            ) : (
              <div className="flex flex-wrap gap-4">
                {filteredServices.length > 0 ? (
                  filteredServices.map((service) => (
                    <Card
                      key={service.serviceId}
                      className="w-40 border-stone-200 transition-shadow hover:shadow-md"
                    >
                      <div className="relative">
                        {service.imageUrl ? (
                          <img
                            src={service.imageUrl}
                            alt={service.serviceName}
                            className="h-28 w-full rounded-t-lg object-cover transition-transform duration-300 hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-28 w-full items-center justify-center rounded-t-lg bg-stone-300">
                            {(() => {
                              const Icon =
                                categoryIcons[service.category] || Scissors;
                              return (
                                <Icon
                                  size={40}
                                  className="text-white opacity-70"
                                />
                              );
                            })()}
                          </div>
                        )}
                        <div className="absolute right-2 top-2">
                          <Badge className="bg-stone-600 px-1.5 py-0.5 text-[10px]">
                            {service.currency} {service.amount}
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-2">
                        <h3 className="mb-0.5 truncate text-xs font-semibold text-stone-800">
                          {service.serviceName}
                        </h3>
                        <p className="mb-1 line-clamp-2 text-[10px] text-stone-600">
                          {service.serviceDescription}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-medium text-stone-500">
                            ⏱ {service.duration}
                          </span>

                          {isAdmin && (
                            <div className="flex space-x-1">
                              <button
                                className="p-0.5 text-gray-500 hover:text-blue-600"
                                onClick={() => openEditModal(service)}
                                title="Edit Service"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                className="p-0.5 text-gray-500 hover:text-red-600"
                                onClick={() => handleDelete(service.serviceId)}
                                title="Delete Service"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p>No services found in this category.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-lg">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b bg-stone-600 p-4">
              <h2 className="text-lg font-semibold text-white">
                Add New Service
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 p-4">
              {/* Service Name & Price Row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    name="serviceName"
                    value={formData.serviceName}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2"
                    style={{ "--focus-ring": primaryColor }}
                    required
                    placeholder="e.g. Men's Haircut"
                    maxLength={MAX_NAME_LENGTH}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Price *
                  </label>
                  <input
                    type="text"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2"
                    style={{ "--focus-ring": primaryColor }}
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Category & Duration Row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="relative">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Category *
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={categoryQuery}
                    onChange={(e) => {
                      setCategoryQuery(e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }));
                      setShowSuggestions(true);
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
                          key={cat.id}
                          className="cursor-pointer px-3 py-2 hover:bg-gray-100"
                          onClick={() => handleCategorySelect(cat.name)}
                        >
                          {cat.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Duration *
                  </label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2"
                    style={{ "--focus-ring": primaryColor }}
                    required
                    placeholder="HH:MM (e.g., 00:30)"
                  />
                </div>
              </div>

              {/* Description */}
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

              {/* Image Upload */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Service Image (optional)
                </label>
                <input
                  type="file"
                  name="imageFile"
                  accept="image/*"
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-stone-600 px-4 py-2 text-white hover:opacity-90"
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Add Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {isEditModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-lg">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b bg-stone-600 p-4">
              <h2 className="text-lg font-semibold text-white">Edit Service</h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  resetForm();
                }}
                className="text-white hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdateSubmit} className="space-y-4 p-4">
              {/* Service Name + Price Row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Service Name
                  </label>
                  <input
                    type="text"
                    name="serviceName"
                    value={formData.serviceName}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2"
                    style={{ "--focus-ring": primaryColor }}
                    placeholder="e.g. Men's Haircut"
                    maxLength={MAX_NAME_LENGTH}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Price
                  </label>
                  <input
                    type="text"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2"
                    style={{ "--focus-ring": primaryColor }}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Category + Duration Row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                      setFormData((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }));
                      setShowSuggestions(true);
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
                          key={cat.id}
                          className="cursor-pointer px-3 py-2 hover:bg-gray-100"
                          onClick={() => {
                            handleCategorySelect(cat.name);
                          }}
                        >
                          {cat.name}
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
              </div>

              {/* Description */}
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

              {/* Image Upload */}
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

              {/* Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-stone-600 px-4 py-2 text-white hover:opacity-90"
                  disabled={isLoading}
                >
                  {isLoading ? "Updating..." : "Update Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Service;
