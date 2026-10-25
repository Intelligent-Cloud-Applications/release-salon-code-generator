import React, { useState, useEffect, useContext, useMemo } from "react";
// --- Amplify Storage v6 ---
import { uploadData, remove } from "aws-amplify/storage";
import { Amplify } from "aws-amplify";
// --------------------------
import {
  Scissors,
  Clock,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Grid3X3,
  List,
  Star,
  Sparkles,
  Heart,
  Zap,
  Shield,
  Droplets,
  Palette,
  AlertCircle,
  Image as ImageIcon,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { useToast } from "../hooks/use-toast";
import Context from "../Context/Context";
import clsx from "clsx";

// Scissors Loader Component matching Clients & Staffs pages
const ScissorsLoader = ({ text = "Loading services..." }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-3">
      <div className="relative">
        <Scissors className="h-9 w-9 text-blue-600 animate-bounce" />
        <div className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-blue-400 rounded-full animate-ping" />
      </div>
      <p className="text-xs font-semibold text-slate-600 animate-pulse">{text}</p>
    </div>
  );
};

// Rich, color-coded themes & icons for each category (guaranteed crash-proof)
const getCategoryConfig = (category) => {
  const cat = String(category || "").toLowerCase().trim();

  if (cat.includes("best") || cat.includes("popular") || cat.includes("feature")) {
    return {
      borderAccent: "border-l-amber-500",
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200/90",
      activePill: "bg-amber-600 text-white shadow-xs shadow-amber-200",
      pillHover: "hover:bg-amber-50 hover:text-amber-800",
      accentText: "text-amber-600",
      icon: Star,
      accentBg: "bg-white text-amber-600 border border-amber-200/80 shadow-2xs",
    };
  }
  if (cat.includes("ancient") || cat.includes("martial") || cat.includes("therapy") || cat.includes("ayurved")) {
    return {
      borderAccent: "border-l-indigo-500",
      badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-300 font-semibold",
      activePill: "bg-indigo-600 text-white shadow-xs shadow-indigo-200",
      pillHover: "hover:bg-indigo-50 hover:text-indigo-700",
      accentText: "text-indigo-600",
      icon: Shield,
      accentBg: "bg-indigo-100/90 text-indigo-700 border border-indigo-200 shadow-2xs",
    };
  }
  if (cat.includes("treatment") || cat.includes("spa") || cat.includes("keratin") || cat.includes("botox")) {
    return {
      borderAccent: "border-l-purple-500",
      badgeClass: "bg-purple-100 text-purple-800 border-purple-300 font-semibold",
      activePill: "bg-purple-600 text-white shadow-xs shadow-purple-200",
      pillHover: "hover:bg-purple-50 hover:text-purple-700",
      accentText: "text-purple-600",
      icon: Sparkles,
      accentBg: "bg-purple-100/90 text-purple-700 border border-purple-200 shadow-2xs",
    };
  }
  if (cat.includes("facial") || cat.includes("skin") || cat.includes("clean") || cat.includes("glow")) {
    return {
      borderAccent: "border-l-emerald-500",
      badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold",
      activePill: "bg-emerald-600 text-white shadow-xs shadow-emerald-200",
      pillHover: "hover:bg-emerald-50 hover:text-emerald-700",
      accentText: "text-emerald-600",
      icon: Droplets,
      accentBg: "bg-emerald-100/90 text-emerald-700 border border-emerald-200 shadow-2xs",
    };
  }
  if (cat.includes("nail") || cat.includes("pedicure") || cat.includes("manicure")) {
    return {
      borderAccent: "border-l-pink-500",
      badgeClass: "bg-pink-100 text-pink-800 border-pink-300 font-semibold",
      activePill: "bg-pink-600 text-white shadow-xs shadow-pink-200",
      pillHover: "hover:bg-pink-50 hover:text-pink-700",
      accentText: "text-pink-600",
      icon: Palette,
      accentBg: "bg-pink-100/90 text-pink-700 border border-pink-200 shadow-2xs",
    };
  }
  if (cat.includes("beard") || cat.includes("shave") || cat.includes("groom")) {
    return {
      borderAccent: "border-l-amber-500",
      badgeClass: "bg-amber-100 text-amber-900 border-amber-300 font-semibold",
      activePill: "bg-amber-600 text-white shadow-xs shadow-amber-200",
      pillHover: "hover:bg-amber-50 hover:text-amber-800",
      accentText: "text-amber-700",
      icon: Scissors,
      accentBg: "bg-amber-100/90 text-amber-800 border border-amber-200 shadow-2xs",
    };
  }
  if (cat.includes("wax") || cat.includes("thread")) {
    return {
      borderAccent: "border-l-rose-500",
      badgeClass: "bg-rose-100 text-rose-800 border-rose-300 font-semibold",
      activePill: "bg-rose-600 text-white shadow-xs shadow-rose-200",
      pillHover: "hover:bg-rose-50 hover:text-rose-700",
      accentText: "text-rose-600",
      icon: Heart,
      accentBg: "bg-rose-100/90 text-rose-700 border border-rose-200 shadow-2xs",
    };
  }
  if (cat.includes("bleach") || cat.includes("detan")) {
    return {
      borderAccent: "border-l-cyan-500",
      badgeClass: "bg-cyan-100 text-cyan-900 border-cyan-300 font-semibold",
      activePill: "bg-cyan-600 text-white shadow-xs shadow-cyan-200",
      pillHover: "hover:bg-cyan-50 hover:text-cyan-800",
      accentText: "text-cyan-700",
      icon: Droplets,
      accentBg: "bg-cyan-100/90 text-cyan-800 border border-cyan-200 shadow-2xs",
    };
  }
  if (cat.includes("tattoo") || cat.includes("pierc")) {
    return {
      borderAccent: "border-l-indigo-500",
      badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-300 font-semibold",
      activePill: "bg-indigo-600 text-white shadow-xs shadow-indigo-200",
      pillHover: "hover:bg-indigo-50 hover:text-indigo-700",
      accentText: "text-indigo-600",
      icon: Zap,
      accentBg: "bg-indigo-100/90 text-indigo-700 border border-indigo-200 shadow-2xs",
    };
  }
  if (cat.includes("hair") || cat.includes("style") || cat.includes("cut") || cat.includes("color")) {
    return {
      borderAccent: "border-l-sky-500",
      badgeClass: "bg-sky-100 text-sky-800 border-sky-300 font-semibold",
      activePill: "bg-sky-600 text-white shadow-xs shadow-sky-200",
      pillHover: "hover:bg-sky-50 hover:text-sky-700",
      accentText: "text-sky-600",
      icon: Scissors,
      accentBg: "bg-sky-100/90 text-sky-700 border border-sky-200 shadow-2xs",
    };
  }

  // Default fallback
  return {
    borderAccent: "border-l-blue-500",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-300 font-semibold",
    activePill: "bg-blue-600 text-white shadow-xs shadow-blue-200",
    pillHover: "hover:bg-blue-50 hover:text-blue-700",
    accentText: "text-blue-600",
    icon: Shield,
    accentBg: "bg-blue-100/90 text-blue-700 border border-blue-200 shadow-2xs",
  };
};

// Safe duration formatter
const formatDuration = (dur) => {
  if (dur === null || dur === undefined || dur === "") return "N/A";
  if (typeof dur === "number") {
    if (dur < 600) {
      const h = Math.floor(dur / 60);
      const m = dur % 60;
      if (h > 0 && m > 0) return `${h}h ${m}m`;
      if (h > 0) return `${h} hr${h > 1 ? "s" : ""}`;
      return `${m} mins`;
    }
    const d = new Date(dur * 1000);
    const hrs = d.getHours();
    const mins = d.getMinutes();
    if (!isNaN(hrs) && !isNaN(mins)) {
      if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
      if (hrs > 0) return `${hrs} hr${hrs > 1 ? "s" : ""}`;
      return `${mins} mins`;
    }
    return `${dur}s`;
  }
  const str = String(dur).trim();
  if (str.includes(":")) {
    const parts = str.split(":").map(Number);
    const hrs = parts[0] || 0;
    const mins = parts[1] || 0;
    if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs} hr${hrs > 1 ? "s" : ""}`;
    return `${mins} mins`;
  }
  return str || "N/A";
};

// Safe duration normalization for saving ("30" -> "00:30")
const normalizeDurationForSave = (str) => {
  if (!str) return "00:30";
  const strVal = String(str).trim();
  if (strVal.includes(":")) {
    const [h, m] = strVal.split(":");
    const safeH = String(parseInt(h, 10) || 0).padStart(2, "0");
    const safeM = String(parseInt(m, 10) || 0).padStart(2, "0");
    return `${safeH}:${safeM}`;
  }
  const numeric = parseInt(strVal, 10);
  if (!isNaN(numeric)) {
    if (numeric >= 60) {
      const h = Math.floor(numeric / 60);
      const m = numeric % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
    return `00:${String(numeric).padStart(2, "0")}`;
  }
  return "00:30";
};

// Popular category quick-picks
const PRESET_CATEGORIES = [
  "Hair Styling",
  "Hair Treatment",
  "Facial & Spa",
  "Nail Services",
  "Beard & Shave",
  "Waxing & Bleach",
  "Best Seller",
];

// Quick duration chips
const DURATION_PRESETS = [
  { label: "15m", value: "00:15" },
  { label: "30m", value: "00:30" },
  { label: "45m", value: "00:45" },
  { label: "1h", value: "01:00" },
  { label: "1.5h", value: "01:30" },
  { label: "2h", value: "02:00" },
];

// Add & Edit Service Modal Component
const ServiceModal = ({
  isOpen,
  onClose,
  onSubmit,
  service = null,
  currency = "INR",
  allServices = [],
  isLoading = false,
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    serviceName: "",
    amount: "",
    duration: "00:30",
    category: "",
    serviceDescription: "",
    imageUrl: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (service) {
      setFormData({
        serviceName: service.serviceName || "",
        amount: service.amount !== undefined ? String(service.amount) : "",
        duration: service.duration ? normalizeDurationForSave(service.duration) : "00:30",
        category: service.category || "",
        serviceDescription: service.serviceDescription || "",
        imageUrl: service.imageUrl || "",
      });
      setImagePreview(service.imageUrl || null);
    } else {
      setFormData({
        serviceName: "",
        amount: "",
        duration: "00:30",
        category: "Hair Styling",
        serviceDescription: "",
        imageUrl: "",
      });
      setImagePreview(null);
    }
    setImageFile(null);
    setRemoveExistingImage(false);
    setErrors({});
  }, [service, isOpen]);

  const existingCategories = useMemo(() => {
    const safeAll = Array.isArray(allServices) ? allServices : [];
    const fromExisting = safeAll.map((s) => s?.category).filter(Boolean);
    return Array.from(new Set([...PRESET_CATEGORIES, ...fromExisting]));
  }, [allServices]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          variant: "destructive",
          title: "Invalid file",
          description: "Please choose an image file (PNG, JPG, WEBP).",
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Image size must be less than 5MB.",
        });
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setRemoveExistingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveExistingImage(true);
  };

  const validate = () => {
    const errs = {};
    const safeName = String(formData.serviceName || "").trim();
    if (!safeName || safeName.length < 2) {
      errs.serviceName = "Service name must be at least 2 characters.";
    } else {
      const safeAll = Array.isArray(allServices) ? allServices : [];
      const isDuplicate = safeAll.some(
        (s) =>
          String(s?.serviceName || "").toLowerCase() === safeName.toLowerCase() &&
          (!service || s?.serviceId !== service?.serviceId)
      );
      if (isDuplicate) {
        errs.serviceName = "A service with this name already exists.";
      }
    }

    const parsedAmount = parseFloat(formData.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      errs.amount = "Please enter a valid price greater than 0.";
    }

    if (!String(formData.category || "").trim()) {
      errs.category = "Please select or enter a category.";
    }

    if (!String(formData.duration || "").trim()) {
      errs.duration = "Please enter a duration.";
    }

    if (formData.serviceDescription && formData.serviceDescription.length > 200) {
      errs.serviceDescription = "Description cannot exceed 200 characters.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    if (!validate()) return;

    await onSubmit({
      ...formData,
      amount: parseFloat(formData.amount),
      duration: normalizeDurationForSave(formData.duration),
      imageFile,
      removeExistingImage,
      serviceId: service?.serviceId,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100%-2rem)] sm:w-[520px] max-h-[85vh] p-0 rounded-2xl overflow-hidden bg-white shadow-2xl border border-slate-200 flex flex-col">
        {/* Modal Header */}
        <DialogHeader className="shrink-0 px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2.5 pr-6">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 border border-blue-100">
              <Scissors className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <DialogTitle className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                {service ? "Edit Service Details" : "Add New Salon Service"}
              </DialogTitle>
              <DialogDescription className="text-[11px] text-slate-500 mt-0.5">
                {service
                  ? "Update service price, duration, category or imagery."
                  : "Create a new offering for your salon catalog."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Form Body */}
        <form
          id="service-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-4 py-3.5 sm:px-5 space-y-3.5 overscroll-contain text-xs"
        >
          {/* Row 1: Service Name & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="serviceName" className="text-[11px] font-bold text-slate-700">
                Service Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="serviceName"
                name="serviceName"
                value={formData.serviceName}
                onChange={handleInputChange}
                placeholder="e.g. Classic Hair Cut"
                disabled={isLoading}
                maxLength={45}
                className={clsx(
                  "rounded-lg text-xs h-9 transition-all",
                  errors.serviceName
                    ? "border-rose-400 focus:ring-rose-100"
                    : "border-slate-200 focus:border-blue-500"
                )}
              />
              {errors.serviceName && (
                <p className="text-[10px] text-rose-500 font-medium">{errors.serviceName}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="amount" className="text-[11px] font-bold text-slate-700">
                Price ({currency}) <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="e.g. 450"
                  disabled={isLoading}
                  className={clsx(
                    "rounded-lg text-xs h-9 pl-7 transition-all",
                    errors.amount
                      ? "border-rose-400 focus:ring-rose-100"
                      : "border-slate-200 focus:border-blue-500"
                  )}
                />
                <span className="absolute left-2.5 top-2.5 text-xs text-slate-400 font-bold select-none">
                  {currency === "INR" ? "₹" : "$"}
                </span>
              </div>
              {errors.amount && (
                <p className="text-[10px] text-rose-500 font-medium">{errors.amount}</p>
              )}
            </div>
          </div>

          {/* Row 2: Category Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-bold text-slate-700">
                Category <span className="text-rose-500">*</span>
              </Label>
              <span className="text-[10px] text-slate-400">Click preset or type custom</span>
            </div>
            {/* Quick preset chips */}
            <div className="flex flex-wrap gap-1.5">
              {existingCategories.slice(0, 7).map((cat) => {
                const isSelected = String(formData.category || "").toLowerCase() === String(cat || "").toLowerCase();
                const config = getCategoryConfig(cat);
                const IconComponent = config.icon;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setFormData((p) => ({ ...p, category: cat }));
                      if (errors.category) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.category;
                          return next;
                        });
                      }
                    }}
                    className={clsx(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer",
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    <IconComponent className="w-3 h-3" />
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
            <Input
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              placeholder="Or type a custom category..."
              disabled={isLoading}
              className={clsx(
                "rounded-lg text-xs h-8.5 mt-1 transition-all",
                errors.category
                  ? "border-rose-400 focus:ring-rose-100"
                  : "border-slate-200 focus:border-blue-500"
              )}
            />
            {errors.category && (
              <p className="text-[10px] text-rose-500 font-medium">{errors.category}</p>
            )}
          </div>

          {/* Row 3: Duration Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="duration" className="text-[11px] font-bold text-slate-700">
                Duration (HH:MM) <span className="text-rose-500">*</span>
              </Label>
              <span className="text-[10px] text-slate-400">
                Selected: {formatDuration(formData.duration)}
              </span>
            </div>
            {/* Fast preset duration chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {DURATION_PRESETS.map((dp) => (
                <button
                  key={dp.value}
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, duration: dp.value }))}
                  className={clsx(
                    "px-2.5 py-1 rounded-md text-[11px] font-semibold border shrink-0 transition-all cursor-pointer",
                    formData.duration === dp.value
                      ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  {dp.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <Input
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="00:30 (HH:MM)"
                disabled={isLoading}
                className={clsx(
                  "rounded-lg text-xs h-8.5 pl-8 transition-all",
                  errors.duration
                    ? "border-rose-400 focus:ring-rose-100"
                    : "border-slate-200 focus:border-blue-500"
                )}
              />
              <Clock className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            </div>
            {errors.duration && (
              <p className="text-[10px] text-rose-500 font-medium">{errors.duration}</p>
            )}
          </div>

          {/* Row 4: Service Description */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="serviceDescription" className="text-[11px] font-bold text-slate-700">
                Description (Optional)
              </Label>
              <span className="text-[10px] text-slate-400">
                {String(formData.serviceDescription || "").length}/200
              </span>
            </div>
            <Textarea
              id="serviceDescription"
              name="serviceDescription"
              value={formData.serviceDescription}
              onChange={handleInputChange}
              rows={2}
              maxLength={200}
              placeholder="Brief description of the service experience..."
              disabled={isLoading}
              className={clsx(
                "rounded-lg text-xs resize-none transition-all",
                errors.serviceDescription
                  ? "border-rose-400 focus:ring-rose-100"
                  : "border-slate-200 focus:border-blue-500"
              )}
            />
          </div>

          {/* Row 5: Service Image Picker & Preview */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-700">Service Image</Label>
            {imagePreview ? (
              <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-2 flex items-center gap-3">
                <img
                  src={imagePreview}
                  alt="Service preview"
                  className="w-16 h-16 rounded-lg object-cover border border-slate-200"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-slate-700 truncate">
                    {imageFile ? imageFile.name : "Current image attached"}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {imageFile
                      ? `${(imageFile.size / 1024).toFixed(1)} KB`
                      : "Stored securely in cloud storage"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveImage}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/20 rounded-xl p-3.5 transition-all cursor-pointer">
                <ImageIcon className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-[11px] font-semibold text-slate-700">
                  Click to upload service photo
                </span>
                <span className="text-[10px] text-slate-400">PNG, JPG, WEBP up to 5MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                  disabled={isLoading}
                />
              </label>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <DialogFooter className="shrink-0 px-4 py-3 sm:px-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-600 hover:bg-slate-200/60 text-xs h-8.5 rounded-lg px-3.5"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="service-form"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8.5 rounded-lg px-4 shadow-xs"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
              </span>
            ) : service ? (
              "Save Changes"
            ) : (
              "Create Service"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Delete Confirmation Modal
const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  service = null,
  currency = "INR",
  isLoading = false,
}) => {
  if (!service) return null;
  const config = getCategoryConfig(service?.category);
  const IconComponent = config.icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100%-2rem)] sm:w-[420px] max-h-[85vh] p-0 rounded-2xl overflow-hidden bg-white shadow-2xl border border-slate-200 flex flex-col">
        <div className="p-5 text-center space-y-3.5">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-100 shadow-2xs">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <DialogTitle className="text-base font-bold text-slate-900">
              Delete Service?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Are you sure you want to remove this service from your active catalog? This action
              cannot be undone.
            </DialogDescription>
          </div>

          {/* Service Preview Card */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-center gap-3 text-left">
            {service.imageUrl ? (
              <img
                src={service.imageUrl}
                alt={service.serviceName || "Service"}
                className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div
                className={clsx(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
                  config.accentBg
                )}
              >
                <IconComponent className={clsx("w-6 h-6", config.accentText)} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-slate-900 text-xs truncate leading-tight">
                {service.serviceName || "Service"}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className={clsx("text-[10px] font-semibold px-2 py-0.5 rounded-full border", config.badgeClass)}>
                  {service.category || "General"}
                </span>
                <span className="text-[11px] font-bold text-slate-700">
                  {currency === "INR" ? `₹${service.amount || 0}` : `$${service.amount || 0}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-600 hover:bg-slate-200/60 text-xs h-8.5 rounded-lg px-3.5"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-8.5 rounded-lg px-4 shadow-xs"
          >
            {isLoading ? "Deleting..." : "Delete Service"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main Services Component
const Service = () => {
  const {
    institutionData,
    services = [],
    createService,
    updateService,
    deleteService,
    fetchServices,
    loader,
  } = useContext(Context);

  const { toast } = useToast();
  const currency = institutionData?.currency || "INR";

  // Safeguard services array to never crash
  const safeServices = useMemo(() => (Array.isArray(services) ? services : []), [services]);

  // Filter, sort & view states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [viewMode, setViewMode] = useState("auto"); // "auto", "grid", "table"

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Fetch services on mount if not loaded
  useEffect(() => {
    if (fetchServices) {
      fetchServices();
    }
  }, []);

  // Upload image to Amplify Storage
  const uploadImageToS3 = async (file) => {
    if (!file) return null;
    try {
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const key = `services/${Date.now()}-${cleanFileName}`;
      const result = await uploadData({
        key,
        data: file,
        options: {
          accessLevel: "guest",
          contentType: file.type,
        },
      }).result;

      const config = Amplify.getConfig();
      const bucket = config?.Storage?.S3?.bucket;
      const region = config?.Storage?.S3?.region;

      if (bucket && region) {
        return `https://${bucket}.s3.${region}.amazonaws.com/public/${result.key}`;
      }
      return "";
    } catch (err) {
      console.error("Error uploading image to S3:", err);
      toast({
        variant: "destructive",
        title: "Image upload failed",
        description: "Could not upload image. Saving service without image.",
      });
      return "";
    }
  };

  // Safely delete image from Amplify Storage
  const removeImageFromS3 = async (imageUrl) => {
    if (!imageUrl || typeof imageUrl !== "string") return;
    try {
      const imageKey = imageUrl.split("/").slice(-2).join("/");
      await remove({ key: imageKey, options: { accessLevel: "guest" } });
    } catch (err) {
      console.warn("Failed to remove old image from S3:", err);
    }
  };

  // Unique categories list with counts
  const categoryStats = useMemo(() => {
    const counts = {};
    safeServices.forEach((s) => {
      if (!s) return;
      const cat = String(s.category || "General").trim();
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const list = Object.keys(counts)
      .map((cat) => ({
        name: cat,
        count: counts[cat],
        config: getCategoryConfig(cat),
      }))
      .sort((a, b) => {
        const aName = String(a.name || "").toLowerCase();
        const bName = String(b.name || "").toLowerCase();
        if (aName.includes("best")) return -1;
        if (bName.includes("best")) return 1;
        return aName.localeCompare(bName);
      });

    return list;
  }, [safeServices]);

  // Filter & Sort Services
  const filteredServices = useMemo(() => {
    let list = [...safeServices];

    // Category filter
    if (selectedCategory !== "all") {
      const targetCat = String(selectedCategory).toLowerCase();
      list = list.filter((s) => String(s?.category || "General").toLowerCase() === targetCat);
    }

    // Search query
    if (String(searchTerm || "").trim()) {
      const q = String(searchTerm).toLowerCase().trim();
      list = list.filter((s) => {
        if (!s) return false;
        const name = String(s.serviceName || "").toLowerCase();
        const cat = String(s.category || "").toLowerCase();
        const desc = String(s.serviceDescription || "").toLowerCase();
        const price = String(s.amount || "");
        return name.includes(q) || cat.includes(q) || desc.includes(q) || price.includes(q);
      });
    }

    // Sorting
    list.sort((a, b) => {
      if (!a || !b) return 0;
      if (sortBy === "price-asc") {
        return (parseFloat(a.amount) || 0) - (parseFloat(b.amount) || 0);
      }
      if (sortBy === "price-desc") {
        return (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0);
      }
      if (sortBy === "name-asc") {
        return String(a.serviceName || "").localeCompare(String(b.serviceName || ""));
      }
      if (sortBy === "duration-asc") {
        return String(a.duration || "").localeCompare(String(b.duration || ""));
      }
      // Default: Best Sellers first, then ascending price
      const aIsBest = String(a.category || "").toLowerCase().includes("best");
      const bIsBest = String(b.category || "").toLowerCase().includes("best");
      if (aIsBest && !bIsBest) return -1;
      if (!aIsBest && bIsBest) return 1;
      return (parseFloat(a.amount) || 0) - (parseFloat(b.amount) || 0);
    });

    return list;
  }, [safeServices, selectedCategory, searchTerm, sortBy]);

  // Currency Formatter
  const formatPrice = (amount) => {
    const num = parseFloat(amount) || 0;
    if (currency === "INR") {
      return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency || "USD",
      }).format(num);
    } catch (e) {
      return `$${num.toFixed(2)}`;
    }
  };

  // Handlers
  const handleCreateService = async (payload) => {
    try {
      setIsActionLoading(true);
      let finalImageUrl = "";
      if (payload.imageFile) {
        finalImageUrl = await uploadImageToS3(payload.imageFile);
      }

      const serviceData = {
        serviceName: String(payload.serviceName || "").trim(),
        amount: parseFloat(payload.amount),
        duration: payload.duration,
        serviceDescription: String(payload.serviceDescription || "").trim(),
        category: String(payload.category || "").trim(),
        imageUrl: finalImageUrl || "",
        currency,
      };

      await createService(serviceData);
      setIsAddModalOpen(false);
      if (fetchServices) await fetchServices();
    } catch (err) {
      console.error("Error creating service:", err);
      toast({
        variant: "destructive",
        title: "Creation failed",
        description: err.message || "Failed to add service",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdateService = async (payload) => {
    try {
      setIsActionLoading(true);
      let finalImageUrl = payload.imageUrl;

      if (payload.imageFile) {
        if (selectedService?.imageUrl) {
          await removeImageFromS3(selectedService.imageUrl);
        }
        finalImageUrl = await uploadImageToS3(payload.imageFile);
      } else if (payload.removeExistingImage) {
        if (selectedService?.imageUrl) {
          await removeImageFromS3(selectedService.imageUrl);
        }
        finalImageUrl = "";
      }

      const serviceData = {
        serviceName: String(payload.serviceName || "").trim(),
        amount: parseFloat(payload.amount),
        duration: payload.duration,
        serviceDescription: String(payload.serviceDescription || "").trim(),
        category: String(payload.category || "").trim(),
        imageUrl: finalImageUrl || "",
        currency,
      };

      await updateService(payload.serviceId, serviceData);
      setIsEditModalOpen(false);
      setSelectedService(null);
      if (fetchServices) await fetchServices();
    } catch (err) {
      console.error("Error updating service:", err);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: err.message || "Failed to update service",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteService = async () => {
    if (!selectedService) return;
    try {
      setIsActionLoading(true);
      if (selectedService.imageUrl) {
        await removeImageFromS3(selectedService.imageUrl);
      }
      await deleteService(selectedService.serviceId);
      setIsDeleteModalOpen(false);
      setSelectedService(null);
      if (fetchServices) await fetchServices();
    } catch (err) {
      console.error("Error deleting service:", err);
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: err.message || "Failed to delete service",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="p-3 sm:p-4 lg:p-5 space-y-3.5 font-sans bg-[#f8fafc] min-h-full text-slate-800">
      {/* 1. Header Bar: Title + Add Service */}
      <div className="flex items-center justify-between gap-3 px-0.5">
        <div className="flex items-center gap-2">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Services
          </h1>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
            {safeServices.length}
          </span>
        </div>

        <Button
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs text-xs h-9 px-3.5 cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          <span>Add Service</span>
        </Button>
      </div>

      {/* 2. Symmetrical Search, Filter & Categories Controls */}
      <div className="space-y-2">
        {/* MOBILE CONTROLS (sm:hidden): Perfectly symmetrical 2-row layout with category dropdown */}
        <div className="sm:hidden space-y-2">
          {/* Mobile Row 1: Search Input (flex-1) + View Toggle (shrink-0) */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-xs pl-9 pr-8 h-9 rounded-xl bg-white border-slate-200 shadow-2xs focus:border-blue-500 w-full"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Toggle */}
            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs shrink-0 h-9 items-center">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={clsx(
                  "p-1.5 rounded-lg transition-all cursor-pointer h-7.5 w-7.5 flex items-center justify-center",
                  viewMode === "table"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-400 hover:text-slate-700"
                )}
                title="Table View (Desktop)"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={clsx(
                  "p-1.5 rounded-lg transition-all cursor-pointer h-7.5 w-7.5 flex items-center justify-center",
                  viewMode === "grid"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-400 hover:text-slate-700"
                )}
                title="Card View (Tablet & Mobile)"
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("auto")}
                className={clsx(
                  "px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer h-7.5 flex items-center justify-center",
                  viewMode === "auto"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                )}
                title="Auto: Table on Big Screen, Cards on Tablet & Mobile"
              >
                Auto
              </button>
            </div>
          </div>

          {/* Mobile Row 2: Category Dropdown (50%) + Sort Dropdown (50%) */}
          <div className="grid grid-cols-2 gap-2">
            {/* Category Dropdown (Replaces slider on small screens) */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-slate-700 focus:border-blue-500 font-medium cursor-pointer shadow-2xs w-full truncate"
            >
              <option value="all">All Categories ({safeServices.length})</option>
              {categoryStats.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.name} ({cat.count})
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-slate-700 focus:border-blue-500 font-medium cursor-pointer shadow-2xs w-full truncate"
            >
              <option value="default">Default Sort</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="duration-asc">Duration: Shortest</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* DESKTOP & TABLET CONTROLS (hidden sm:block): Symmetrical bar + chips */}
        <div className="hidden sm:block space-y-2.5">
          <div className="flex items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-xs pl-9 pr-8 h-9 rounded-xl bg-white border-slate-200 shadow-2xs focus:border-blue-500 w-full"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Selector & View Toggle */}
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs h-9 rounded-xl border border-slate-200 bg-white px-3 text-slate-700 focus:border-blue-500 font-medium cursor-pointer shadow-2xs"
              >
                <option value="default">Default Sort</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="duration-asc">Duration: Shortest</option>
                <option value="name-asc">Name: A to Z</option>
              </select>

              <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs h-9 items-center">
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={clsx(
                    "p-1.5 rounded-lg transition-all cursor-pointer h-7.5 w-7.5 flex items-center justify-center",
                    viewMode === "table"
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "text-slate-400 hover:text-slate-700"
                  )}
                  title="Table View (Desktop)"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={clsx(
                    "p-1.5 rounded-lg transition-all cursor-pointer h-7.5 w-7.5 flex items-center justify-center",
                    viewMode === "grid"
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "text-slate-400 hover:text-slate-700"
                  )}
                  title="Card View (Tablet & Mobile)"
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("auto")}
                  className={clsx(
                    "px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer h-7.5 flex items-center justify-center",
                    viewMode === "auto"
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  )}
                  title="Auto: Table on Big Screen, Cards on Tablet & Mobile"
                >
                  Auto
                </button>
              </div>
            </div>
          </div>

          {/* Category Horizontal Filter Pills on Desktop */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={clsx(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 border transition-all cursor-pointer shadow-2xs",
                selectedCategory === "all"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              <span>All</span>
              <span
                className={clsx(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                  selectedCategory === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                )}
              >
                {safeServices.length}
              </span>
            </button>

            {categoryStats.map((cat) => {
              const isSelected = selectedCategory.toLowerCase() === String(cat.name || "").toLowerCase();
              const IconComp = cat.config.icon;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setSelectedCategory(isSelected ? "all" : cat.name)}
                  className={clsx(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 border transition-all cursor-pointer shadow-2xs",
                    isSelected
                      ? cat.config.activePill
                      : `bg-white text-slate-700 border-slate-200 ${cat.config.pillHover}`
                  )}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{cat.name}</span>
                  <span
                    className={clsx(
                      "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                      isSelected ? "bg-black/20 text-white" : "bg-slate-100 text-slate-500"
                    )}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Main Service Content Display */}
      {loader ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <ScissorsLoader text="Loading salon services..." />
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Scissors className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              {safeServices.length === 0 ? "No Services in Catalog" : "No Matching Services Found"}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {safeServices.length === 0
                ? "Get started by adding your first haircut, facial, treatment or grooming service."
                : "Try adjusting your search keyword or selected category filter."}
            </p>
          </div>
          {safeServices.length === 0 ? (
            <Button
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs h-8 px-4 mt-2"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Service
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
              className="text-xs h-8 rounded-lg cursor-pointer"
            >
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* 1. TABLE STRUCTURE: Full Desktop Table + Native Mobile Table List */}
          <div
            className={clsx(
              viewMode === "table"
                ? "block"
                : viewMode === "grid"
                ? "hidden"
                : "hidden lg:block"
            )}
          >
            {/* DESKTOP TABLE (hidden sm:block): Full 5-Column Table */}
            <div className="hidden sm:block bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto w-full">
                <Table>
                  <TableHeader className="bg-slate-50/80">
                    <TableRow className="border-b border-slate-200/80">
                      <TableHead className="text-xs font-bold text-slate-700 py-3 px-4">
                        Service
                      </TableHead>
                      <TableHead className="text-xs font-bold text-slate-700 py-3 px-3">
                        Category
                      </TableHead>
                      <TableHead className="text-xs font-bold text-slate-700 py-3 px-3">
                        Duration
                      </TableHead>
                      <TableHead className="text-xs font-bold text-slate-700 py-3 px-3">
                        Price
                      </TableHead>
                      <TableHead className="text-xs font-bold text-slate-700 py-3 px-4 text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServices.map((service) => {
                      const config = getCategoryConfig(service?.category);
                      const IconComponent = config.icon;

                      return (
                        <TableRow
                          key={service.serviceId}
                          onClick={() => {
                            setSelectedService(service);
                            setIsEditModalOpen(true);
                          }}
                          className={clsx(
                            "border-b border-slate-100 hover:bg-slate-50/80 transition-colors cursor-pointer border-l-4",
                            config.borderAccent
                          )}
                        >
                          {/* Name & Photo */}
                          <TableCell className={clsx("py-2.5 px-4 border-l-4", config.borderAccent)}>
                            <div className="flex items-center gap-3">
                              {service.imageUrl ? (
                                <img
                                  src={service.imageUrl}
                                  alt={service.serviceName || "Service"}
                                  className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
                                />
                              ) : (
                                <div
                                  className={clsx(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs",
                                    config.accentBg
                                  )}
                                >
                                  <IconComponent className={clsx("w-5 h-5", config.accentText)} />
                                </div>
                              )}
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate capitalize">
                                  {service.serviceName || "Service"}
                                </h4>
                                {service.serviceDescription && (
                                  <p className="text-[11px] text-slate-500 truncate max-w-xs">
                                    {service.serviceDescription}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Category */}
                          <TableCell className="py-2.5 px-3">
                            <span
                              className={clsx(
                                "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs",
                                config.badgeClass
                              )}
                            >
                              <IconComponent className="w-2.5 h-2.5" />
                              <span>{service.category || "General"}</span>
                            </span>
                          </TableCell>

                          {/* Duration */}
                          <TableCell className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 font-semibold bg-slate-100/80 px-2 py-0.5 rounded-md">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{formatDuration(service.duration)}</span>
                            </span>
                          </TableCell>

                          {/* Price */}
                          <TableCell className="py-2.5 px-3">
                            <span className="font-extrabold text-blue-700 text-xs sm:text-sm bg-blue-50/90 border border-blue-200/90 px-2 py-0.5 rounded-lg shadow-2xs">
                              {formatPrice(service.amount)}
                            </span>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="py-2.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedService(service);
                                  setIsEditModalOpen(true);
                                }}
                                className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                                title="Edit Service"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedService(service);
                                  setIsDeleteModalOpen(true);
                                }}
                                className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                title="Delete Service"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* MOBILE TABLE VIEW (sm:hidden): Native Compact Row List (Zero Horizontal Scroll!) */}
            <div className="sm:hidden bg-white rounded-2xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
              {filteredServices.map((service) => {
                const config = getCategoryConfig(service?.category);
                const IconComponent = config.icon;

                return (
                  <div
                    key={service.serviceId}
                    onClick={() => {
                      setSelectedService(service);
                      setIsEditModalOpen(true);
                    }}
                    className={clsx(
                      "p-3 flex items-center justify-between gap-2.5 hover:bg-slate-50/80 transition-colors cursor-pointer border-l-4",
                      config.borderAccent
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {service.imageUrl ? (
                        <img
                          src={service.imageUrl}
                          alt={service.serviceName || "Service"}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
                        />
                      ) : (
                        <div
                          className={clsx(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs",
                            config.accentBg
                          )}
                        >
                          <IconComponent className={clsx("w-5 h-5", config.accentText)} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm capitalize truncate max-w-[130px]">
                            {service.serviceName || "Service"}
                          </h4>
                          <span
                            className={clsx(
                              "inline-flex items-center text-[9px] font-bold px-1.5 py-0.2 rounded-md border shrink-0",
                              config.badgeClass
                            )}
                          >
                            {service.category || "General"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700">{formatDuration(service.duration)}</span>
                          <span>•</span>
                          <span className="font-black text-blue-700 bg-blue-50/90 border border-blue-200/90 px-1.5 py-0.2 rounded text-[10px]">
                            {formatPrice(service.amount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedService(service);
                          setIsEditModalOpen(true);
                        }}
                        className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedService(service);
                          setIsDeleteModalOpen(true);
                        }}
                        className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. RESPONSIVE CARD DESIGN (Tablets, Mobile & Desktop Grid) */}
          <div
            className={clsx(
              viewMode === "grid"
                ? "block"
                : viewMode === "table"
                ? "hidden"
                : "block lg:hidden"
            )}
          >
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {filteredServices.map((service) => {
                const config = getCategoryConfig(service?.category);
                const IconComponent = config.icon;

                return (
                  <div
                    key={service.serviceId}
                    onClick={() => {
                      setSelectedService(service);
                      setIsEditModalOpen(true);
                    }}
                    className={clsx(
                      "group bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 hover:shadow-xs transition-all duration-200 p-2 sm:p-2.5 flex flex-col justify-between relative cursor-pointer border-l-4",
                      config.borderAccent
                    )}
                  >
                    <div>
                      {/* Top Header: Category Badge on left, Duration on right */}
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={clsx(
                            "inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full border truncate max-w-[65%] shadow-2xs",
                            config.badgeClass
                          )}
                        >
                          <span className="truncate">{service.category || "General"}</span>
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-slate-600 bg-slate-100/90 px-1.5 py-0.2 rounded-md shrink-0">
                          <Clock className="w-2.5 h-2.5 text-slate-400" />
                          <span>{formatDuration(service.duration)}</span>
                        </span>
                      </div>

                      {/* Middle Body: Thumbnail alongside Title and Description */}
                      <div className="flex items-start gap-2 my-1">
                        {service.imageUrl ? (
                          <img
                            src={service.imageUrl}
                            alt={service.serviceName || "Service"}
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-cover border border-slate-200/80 shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className={clsx(
                              "w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 border shadow-2xs group-hover:scale-105 transition-transform",
                              config.accentBg
                            )}
                          >
                            <IconComponent className={clsx("w-4 h-4", config.accentText)} />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3
                            className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1 leading-tight group-hover:text-blue-600 transition-colors capitalize"
                            title={service.serviceName}
                          >
                            {service.serviceName || "Service"}
                          </h3>
                          <p className="text-[10px] text-slate-400 line-clamp-1 leading-snug mt-0.5">
                            {service.serviceDescription || "No description"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Footer: Price Badge on left, Quick Actions on right */}
                    <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-slate-100 gap-1">
                      <span className="text-xs sm:text-sm font-black text-blue-700 tracking-tight bg-blue-50/90 border border-blue-200/90 px-1.5 py-0.2 rounded-lg shadow-2xs">
                        {formatPrice(service.amount)}
                      </span>

                      <div className="flex items-center gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedService(service);
                            setIsEditModalOpen(true);
                          }}
                          className="h-6 w-6 rounded-lg p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                          title="Edit Service"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedService(service);
                            setIsDeleteModalOpen(true);
                          }}
                          className="h-6 w-6 rounded-lg p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Delete Service"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>                );
              })}
            </div>
          </div>
        </>
      )}

      {/* 4. Add Service Modal */}
      <ServiceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateService}
        currency={currency}
        allServices={safeServices}
        isLoading={isActionLoading}
      />

      {/* 5. Edit Service Modal */}
      <ServiceModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedService(null);
        }}
        onSubmit={handleUpdateService}
        service={selectedService}
        currency={currency}
        allServices={safeServices}
        isLoading={isActionLoading}
      />

      {/* 6. Delete Service Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedService(null);
        }}
        onConfirm={handleDeleteService}
        service={selectedService}
        currency={currency}
        isLoading={isActionLoading}
      />
    </div>
  );
};

export default Service;
