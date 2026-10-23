import React, { useState, useContext, useEffect, useMemo } from "react";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  X,
  Scissors,
  Grid3X3,
  List,
  AlertCircle,
  UserCheck,
  Sparkles,
  CheckCircle2,
  Clock,
  Coffee,
  PowerOff,
  UserMinus,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
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

// Scissors Loader Component
const ScissorsLoader = ({ text = "Loading staff..." }) => {
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

// Color coding for Specialization Badges
const getSpecializationBadgeStyle = (spec) => {
  const s = (spec || "").toLowerCase();
  if (s.includes("color") || s.includes("highlight")) {
    return "bg-purple-50 text-purple-700 border-purple-200/80";
  }
  if (s.includes("hair") || s.includes("keratin") || s.includes("cut")) {
    return "bg-sky-50 text-sky-700 border-sky-200/80";
  }
  if (s.includes("barber") || s.includes("beard") || s.includes("shave")) {
    return "bg-amber-50 text-amber-800 border-amber-200/80";
  }
  if (s.includes("skin") || s.includes("spa") || s.includes("facial")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
  }
  if (s.includes("nail") || s.includes("bridal") || s.includes("beautician")) {
    return "bg-pink-50 text-pink-700 border-pink-200/80";
  }
  return "bg-slate-100 text-slate-700 border-slate-200/80";
};

// Floor Status Badge & Border Helper
const getStatusConfig = (status) => {
  const safeStatus = (status || "available").toLowerCase();
  const configs = {
    available: {
      label: "Available",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/90",
      dotClass: "bg-emerald-500",
      ping: true,
      borderLeft: "border-l-emerald-500",
      avatarRing: "ring-emerald-400/40",
      kpiBorder: "border-emerald-200 bg-emerald-50/50 text-emerald-700",
    },
    occupied: {
      label: "In Service",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200/90",
      dotClass: "bg-blue-500",
      ping: true,
      borderLeft: "border-l-blue-500",
      avatarRing: "ring-blue-400/40",
      kpiBorder: "border-blue-200 bg-blue-50/50 text-blue-700",
    },
    on_break: {
      label: "On Break",
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200/90",
      dotClass: "bg-amber-500",
      ping: false,
      borderLeft: "border-l-amber-500",
      avatarRing: "ring-amber-400/40",
      kpiBorder: "border-amber-200 bg-amber-50/50 text-amber-800",
    },
    inactive: {
      label: "Off Duty",
      badgeClass: "bg-slate-100 text-slate-600 border-slate-200/90",
      dotClass: "bg-slate-400",
      ping: false,
      borderLeft: "border-l-slate-300",
      avatarRing: "ring-slate-300/40",
      kpiBorder: "border-slate-200 bg-slate-50/50 text-slate-600",
    },
  };
  return configs[safeStatus] || configs.available;
};

// Floor Status Pill component
const StatusPill = ({ status, compact = false }) => {
  const config = getStatusConfig(status);

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 font-bold rounded-full border shrink-0 transition-colors",
        compact ? "text-[10px] px-2 py-0.5" : "text-[11px] px-2.5 py-0.5",
        config.badgeClass
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {config.ping && (
          <span
            className={clsx(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              config.dotClass
            )}
          />
        )}
        <span
          className={clsx(
            "relative inline-flex rounded-full h-1.5 w-1.5",
            config.dotClass
          )}
        />
      </span>
      <span>{config.label}</span>
    </span>
  );
};

// Predefined specializations for quick-select
const PREDEFINED_SPECIALIZATIONS = [
  "Hair Stylist",
  "Color Specialist",
  "Master Barber",
  "Beautician",
  "Skin Specialist",
  "Nail Technician",
  "Hair Spa",
  "Beard Grooming",
];

// Add & Edit Staff Modal (Compact & Mobile-Optimized)
const StaffModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  staffData = null,
  isLoading = false,
}) => {
  const { toast } = useToast();

  // Canonical variable: userName
  const [formData, setFormData] = useState({
    userName: "",
    phoneNumber: "",
    emailId: "",
    gender: "Male",
    specialization: [],
    yearsOfExperience: "",
    bio: "",
    status: "available",
  });

  const [newSpecialization, setNewSpecialization] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (staffData) {
      setFormData({
        userName: staffData.userName || staffData.name || "",
        phoneNumber: staffData.phoneNumber || staffData.phone || "",
        emailId: staffData.emailId || staffData.email || "",
        gender: staffData.gender || "Male",
        specialization: Array.isArray(staffData.specialization)
          ? staffData.specialization
          : staffData.specialization
          ? [staffData.specialization]
          : [],
        yearsOfExperience:
          staffData.yearsOfExperience !== undefined &&
          staffData.yearsOfExperience !== null
            ? String(staffData.yearsOfExperience)
            : "",
        bio: staffData.bio || "",
        status: staffData.status || "available",
      });
    } else {
      setFormData({
        userName: "",
        phoneNumber: "",
        emailId: "",
        gender: "Male",
        specialization: [],
        yearsOfExperience: "",
        bio: "",
        status: "available",
      });
    }
    setErrors({});
    setNewSpecialization("");
  }, [staffData, isOpen]);

  const validateForm = () => {
    const errs = {};
    if (!formData.userName || formData.userName.trim().length < 2) {
      errs.userName = "Name is required (min 2 chars)";
    }
    const cleanPhone = formData.phoneNumber.replace(/[\s\-\(\)]/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      errs.phoneNumber = "Valid phone is required (min 10 digits)";
    }
    if (formData.emailId && formData.emailId.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.emailId.trim())) {
        errs.emailId = "Invalid email format";
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

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

  const handleAddSpecialization = (specToAdd) => {
    const target = (specToAdd || newSpecialization).trim();
    if (!target) return;
    if (!formData.specialization.includes(target)) {
      setFormData((prev) => ({
        ...prev,
        specialization: [...prev.specialization, target],
      }));
    }
    setNewSpecialization("");
  };

  const handleRemoveSpecialization = (spec) => {
    setFormData((prev) => ({
      ...prev,
      specialization: prev.specialization.filter((s) => s !== spec),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "Required Fields Missing",
        description: "Please check stylist name and phone number.",
      });
      return;
    }

    try {
      const rawPhone = formData.phoneNumber.replace(/[^0-9]/g, "");
      const cleanUserName = formData.userName.trim();
      const cleanEmail = formData.emailId.trim();

      const payload = {
        userName: cleanUserName,
        name: cleanUserName, // backward compatibility
        phoneNumber: rawPhone || formData.phoneNumber.trim(),
        phone: rawPhone || formData.phoneNumber.trim(),
        emailId: cleanEmail,
        email: cleanEmail,
        gender: formData.gender,
        status: formData.status,
        yearsOfExperience: Number(formData.yearsOfExperience) || 0,
        specialization: formData.specialization,
        bio: formData.bio.trim(),
      };

      if (staffData) {
        payload.staffId =
          staffData.staffId ||
          staffData.id ||
          `${cleanUserName.toLowerCase()}-${rawPhone}`;
      }

      await onSubmit(payload);
      onClose();
    } catch (err) {
      console.error("Staff modal submission error:", err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Sleek, compact modal that never overwhelms mobile screen */}
      <DialogContent className="w-[92vw] sm:w-[460px] max-h-[82vh] p-0 rounded-2xl overflow-hidden bg-white shadow-xl border border-slate-200 flex flex-col">
        {/* Compact Header */}
        <DialogHeader className="shrink-0 px-4 py-3 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2.5 pr-6">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 border border-blue-100">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <DialogTitle className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                {title}
              </DialogTitle>
              <DialogDescription className="text-[11px] text-slate-500 mt-0.5">
                Stylist credentials and salon floor status
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Compact Scrollable Body */}
        <form
          id="compact-staff-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 overscroll-contain text-xs"
        >
          {/* Row 1: Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <Label htmlFor="userName" className="text-[11px] font-bold text-slate-700">
                Staff Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="userName"
                name="userName"
                value={formData.userName}
                onChange={handleInputChange}
                placeholder="e.g. Rahul Sharma"
                disabled={isLoading}
                className={clsx(
                  "rounded-lg text-xs h-8.5 transition-all",
                  errors.userName
                    ? "border-rose-400 focus:ring-rose-100"
                    : "border-slate-200 focus:border-blue-500"
                )}
              />
              {errors.userName && (
                <p className="text-[10px] text-rose-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                  <span>{errors.userName}</span>
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="phoneNumber" className="text-[11px] font-bold text-slate-700">
                Phone Number <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="e.g. 9876543210"
                disabled={isLoading}
                className={clsx(
                  "rounded-lg text-xs h-8.5 transition-all",
                  errors.phoneNumber
                    ? "border-rose-400 focus:ring-rose-100"
                    : "border-slate-200 focus:border-blue-500"
                )}
              />
              {errors.phoneNumber && (
                <p className="text-[10px] text-rose-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                  <span>{errors.phoneNumber}</span>
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Email & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <Label htmlFor="emailId" className="text-[11px] font-bold text-slate-700">
                Email Address
              </Label>
              <Input
                id="emailId"
                name="emailId"
                type="email"
                value={formData.emailId}
                onChange={handleInputChange}
                placeholder="e.g. rahul@salon.com"
                disabled={isLoading}
                className={clsx(
                  "rounded-lg text-xs h-8.5 transition-all",
                  errors.emailId
                    ? "border-rose-400 focus:ring-rose-100"
                    : "border-slate-200 focus:border-blue-500"
                )}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="gender" className="text-[11px] font-bold text-slate-700">
                Gender
              </Label>
              <Select
                value={formData.gender}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, gender: val }))
                }
                disabled={isLoading}
              >
                <SelectTrigger className="rounded-lg text-xs h-8.5 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Experience & Floor Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <Label htmlFor="yearsOfExperience" className="text-[11px] font-bold text-slate-700">
                Experience (Years)
              </Label>
              <Input
                id="yearsOfExperience"
                name="yearsOfExperience"
                type="number"
                min="0"
                max="50"
                value={formData.yearsOfExperience}
                onChange={handleInputChange}
                placeholder="e.g. 5"
                disabled={isLoading}
                className="rounded-lg text-xs h-8.5 border-slate-200"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="status" className="text-[11px] font-bold text-slate-700">
                Floor Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, status: val }))
                }
                disabled={isLoading}
              >
                <SelectTrigger className="rounded-lg text-xs h-8.5 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="available">Available (Free chair)</SelectItem>
                  <SelectItem value="occupied">In Service (With client)</SelectItem>
                  <SelectItem value="on_break">On Break</SelectItem>
                  <SelectItem value="inactive">Off Duty / Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 4: Specializations */}
          <div className="space-y-1.5 pt-1">
            <Label className="text-[11px] font-bold text-slate-700">
              Specializations
            </Label>
            <div className="flex gap-1.5">
              <Input
                value={newSpecialization}
                onChange={(e) => setNewSpecialization(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSpecialization();
                  }
                }}
                placeholder="Add custom skill..."
                className="flex-1 rounded-lg text-xs h-8 border-slate-200"
                disabled={isLoading}
              />
              <Button
                type="button"
                onClick={() => handleAddSpecialization()}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold px-3 h-8 shrink-0 cursor-pointer"
                disabled={isLoading}
              >
                Add
              </Button>
            </div>

            {/* Selected Specializations */}
            {formData.specialization.length > 0 && (
              <div className="flex flex-wrap gap-1 p-1.5 rounded-lg bg-slate-50 border border-slate-200/80 max-h-16 overflow-y-auto">
                {formData.specialization.map((spec, index) => (
                  <span
                    key={index}
                    className={clsx(
                      "text-[10px] font-bold py-0.5 px-2 rounded-md flex items-center gap-1 border",
                      getSpecializationBadgeStyle(spec)
                    )}
                  >
                    <span>{spec}</span>
                    <X
                      className="h-2.5 w-2.5 cursor-pointer opacity-70 hover:opacity-100"
                      onClick={() => handleRemoveSpecialization(spec)}
                    />
                  </span>
                ))}
              </div>
            )}

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1 pt-0.5">
              {PREDEFINED_SPECIALIZATIONS.map((spec) => {
                const isSelected = formData.specialization.includes(spec);
                return (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => handleAddSpecialization(spec)}
                    disabled={isSelected || isLoading}
                    className={clsx(
                      "text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer font-medium",
                      isSelected
                        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-default opacity-50"
                        : "bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border-slate-200"
                    )}
                  >
                    + {spec}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 5: Bio */}
          <div className="space-y-1">
            <Label htmlFor="bio" className="text-[11px] font-bold text-slate-700">
              Stylist Bio (Optional)
            </Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={2}
              placeholder="Short bio or certifications..."
              className="resize-none rounded-lg text-xs border-slate-200 py-1.5 h-12"
              disabled={isLoading}
            />
          </div>
        </form>

        {/* Compact Sticky Footer */}
        <DialogFooter className="shrink-0 px-4 py-2.5 border-t border-slate-100 bg-slate-50 flex flex-row items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 sm:flex-initial rounded-lg border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold h-8 px-3 cursor-pointer"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="compact-staff-form"
            className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold h-8 px-4 cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : staffData ? "Update Stylist" : "Add Stylist"}
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
  staffName,
  isLoading = false,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] sm:w-[400px] p-4 rounded-2xl shadow-xl border border-slate-200">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
              <Trash2 className="h-4 w-4" />
            </div>
            <div className="text-left">
              <DialogTitle className="text-sm font-bold text-slate-900">
                Delete Staff Member
              </DialogTitle>
              <DialogDescription className="text-[11px] text-slate-500">
                Permanently remove from roster
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-2.5 text-xs text-slate-600">
          Delete <strong className="text-slate-900 font-bold">{staffName}</strong>? This action cannot be undone.
        </div>

        <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 sm:flex-initial rounded-lg border-slate-200 text-slate-600 text-xs font-semibold h-8 px-3 cursor-pointer"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="flex-1 sm:flex-initial bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold h-8 px-3 cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Delete All Staff Modal
const DeleteAllConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  count = 0,
  isLoading = false,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] sm:w-[400px] p-4 rounded-2xl shadow-xl border border-rose-200">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-300">
              <Trash2 className="h-4 w-4" />
            </div>
            <div className="text-left">
              <DialogTitle className="text-sm font-bold text-slate-900">
                Delete All Staff
              </DialogTitle>
              <DialogDescription className="text-[11px] text-rose-600 font-medium">
                Reset roster ({count} members)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-2.5 text-xs text-slate-600 space-y-1.5">
          <p>
            Permanently delete all <strong className="text-slate-900 font-bold">{count} staff members</strong>?
          </p>
          <p className="text-slate-500 text-[10px] bg-slate-50 p-2 rounded-lg border border-slate-200">
            This wipes the directory so you can start testing completely fresh.
          </p>
        </div>

        <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 sm:flex-initial rounded-lg border-slate-200 text-slate-600 text-xs font-semibold h-8 px-3 cursor-pointer"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="flex-1 sm:flex-initial bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold h-8 px-3 cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? "Deleting All..." : `Yes, Delete All`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function StaffsPage() {
  const {
    barbers = [],
    fetchBarbers,
    createStaff,
    updateStaff,
    deleteStaff,
    loader,
  } = useContext(Context);

  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffToDelete, setStaffToDelete] = useState(null);

  // Manual view toggle: 'auto' | 'table' | 'grid'
  const [viewMode, setViewMode] = useState("auto");

  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Initial load
  useEffect(() => {
    if (fetchBarbers) {
      fetchBarbers();
    }
  }, []);

  // Filtered staff list by userName, phone, email, or skill
  const filteredStaffs = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return barbers;

    return barbers.filter((staff) => {
      const staffName = (staff.userName || staff.name || "").toLowerCase();
      const staffPhone = (staff.phoneNumber || staff.phone || "").toLowerCase();
      const staffEmail = (staff.emailId || staff.email || "").toLowerCase();
      const specializations = Array.isArray(staff.specialization)
        ? staff.specialization.join(" ").toLowerCase()
        : (staff.specialization || "").toLowerCase();

      return (
        staffName.includes(q) ||
        staffPhone.includes(q) ||
        staffEmail.includes(q) ||
        specializations.includes(q)
      );
    });
  }, [barbers, searchTerm]);

  // Handlers
  const handleCreateStaff = async (staffPayload) => {
    if (isCreating) return;
    try {
      setIsCreating(true);
      await createStaff(staffPayload);
      setShowAddModal(false);
    } catch (err) {
      console.error("Create staff error:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateStaff = async (staffPayload) => {
    if (isUpdating) return;
    try {
      setIsUpdating(true);
      await updateStaff(staffPayload);
      setShowEditModal(false);
      setEditingStaff(null);
    } catch (err) {
      console.error("Update staff error:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!staffToDelete || isDeleting) return;
    try {
      setIsDeleting(true);
      const targetId =
        staffToDelete.staffId || staffToDelete.id || staffToDelete._id;
      await deleteStaff(targetId);
      setShowDeleteConfirm(false);
      setStaffToDelete(null);
    } catch (err) {
      console.error("Delete staff error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAllStaff = async () => {
    if (isDeletingAll || barbers.length === 0) return;
    try {
      setIsDeletingAll(true);
      toast({
        title: "Deleting all staff members...",
        description: `Processing ${barbers.length} staff deletions.`,
      });

      for (const b of barbers) {
        const targetId = b.staffId || b.id || b._id;
        if (targetId) {
          try {
            await deleteStaff(targetId);
          } catch (e) {
            console.error("Failed to delete staff:", targetId, e);
          }
        }
      }

      await fetchBarbers();
      setShowDeleteAllConfirm(false);
      toast({
        variant: "success",
        title: "All Staff Deleted",
        description: "Staff directory has been reset. You can now add new staff.",
      });
    } catch (err) {
      console.error("Delete all error:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete all staff members.",
      });
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Floor stats
  const availableCount = barbers.filter((s) => s.status === "available").length;
  const inServiceCount = barbers.filter((s) => s.status === "occupied").length;
  const onBreakCount = barbers.filter((s) => s.status === "on_break").length;
  const offDutyCount = barbers.filter((s) => s.status === "inactive").length;

  return (
    <div className="p-3 sm:p-4 lg:p-5 space-y-3 font-sans bg-[#f8fafc] min-h-full text-slate-800">
      {/* 1. Compact Header Bar: Title + Actions */}
      <div className="bg-white px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
            Staff & Stylists
          </h1>
          <span className="text-[11px] font-semibold text-slate-400 hidden md:inline">
            ({barbers.length} stylists)
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {barbers.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteAllConfirm(true)}
              className="border-rose-200 text-rose-700 hover:bg-rose-50 font-bold rounded-lg text-xs h-8 px-2.5 cursor-pointer transition-colors shadow-2xs"
              title="Delete all staff to test from scratch"
            >
              <Trash2 className="w-3.5 h-3.5 sm:mr-1 text-rose-500" />
              <span className="hidden sm:inline">Delete All</span>
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs text-xs h-8 px-3 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Add Stylist</span>
          </Button>
        </div>
      </div>

      {/* 2. Color-Coded Mini KPI Cards: Symmetrical 4-Card Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* KPI 1: Total */}
        <div className="bg-white rounded-xl p-2.5 border border-slate-200/90 shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0 border border-indigo-100">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-base font-extrabold text-slate-900 leading-none">
              {barbers.length}
            </div>
            <div className="text-[10px] font-semibold text-slate-500 mt-0.5 truncate">
              Total Roster
            </div>
          </div>
        </div>

        {/* KPI 2: Available */}
        <div className="bg-white rounded-xl p-2.5 border border-emerald-200 shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0 border border-emerald-200">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>
          <div className="min-w-0">
            <div className="text-base font-extrabold text-emerald-700 leading-none">
              {availableCount}
            </div>
            <div className="text-[10px] font-semibold text-emerald-600 mt-0.5 truncate">
              Available Now
            </div>
          </div>
        </div>

        {/* KPI 3: In Service */}
        <div className="bg-white rounded-xl p-2.5 border border-blue-200 shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 border border-blue-200">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-base font-extrabold text-blue-700 leading-none">
              {inServiceCount}
            </div>
            <div className="text-[10px] font-semibold text-blue-600 mt-0.5 truncate">
              In Service
            </div>
          </div>
        </div>

        {/* KPI 4: Break / Off */}
        <div className="bg-white rounded-xl p-2.5 border border-amber-200 shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0 border border-amber-200">
            <Coffee className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-base font-extrabold text-amber-800 leading-none">
              {onBreakCount + offDutyCount}
            </div>
            <div className="text-[10px] font-semibold text-amber-700 mt-0.5 truncate">
              Break / Off
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & View Switcher Bar */}
      <div className="flex items-center justify-between gap-2">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
          <Input
            placeholder="Search name, phone, or skill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-7 bg-white border-slate-200/90 rounded-xl text-xs h-8.5 shadow-2xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* View Mode Toggle: Auto / Grid / Table */}
        <div className="flex items-center bg-white border border-slate-200/90 rounded-xl p-0.5 shadow-2xs shrink-0">
          <button
            onClick={() => setViewMode("table")}
            className={clsx(
              "p-1 rounded-lg text-xs font-semibold flex items-center transition-all cursor-pointer",
              viewMode === "table"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            )}
            title="Table View (Desktop)"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={clsx(
              "p-1 rounded-lg text-xs font-semibold flex items-center transition-all cursor-pointer",
              viewMode === "grid"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            )}
            title="Card View (Mobile/Tablet)"
          >
            <Grid3X3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode("auto")}
            className={clsx(
              "px-1.5 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
              viewMode === "auto"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            )}
            title="Auto: Table on desktop, Cards on mobile"
          >
            Auto
          </button>
        </div>
      </div>

      {/* 4. Staff Content (Desktop Table / Mobile Cards) */}
      {loader && barbers.length === 0 ? (
        <ScissorsLoader text="Loading stylists..." />
      ) : barbers.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center my-2 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2.5 border border-blue-100">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            No staff members added yet
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xs mx-auto">
            Add your salon stylists, barbers, or beauticians to begin.
          </p>
          <Button
            onClick={() => setShowAddModal(true)}
            className="mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs h-8 px-3.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Add First Stylist</span>
          </Button>
        </div>
      ) : filteredStaffs.length === 0 ? (
        /* Search Not Found State */
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 text-center my-2 shadow-2xs">
          <Search className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
          <h3 className="text-xs font-bold text-slate-800">
            No stylists matching "{searchTerm}"
          </h3>
          <Button
            variant="outline"
            onClick={() => setSearchTerm("")}
            className="mt-2 text-[11px] rounded-lg border-slate-200 h-7 px-2.5 cursor-pointer"
          >
            Clear Search
          </Button>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW: Compact, color-coded rows with status left border */}
          <div
            className={clsx(
              viewMode === "table"
                ? "block"
                : viewMode === "grid"
                ? "hidden"
                : "hidden lg:block"
            )}
          >
            <Card className="border-slate-200/90 rounded-xl bg-white shadow-2xs overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto w-full">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/90 border-b border-slate-200/80">
                        <TableHead className="text-slate-600 font-bold text-[11px] uppercase tracking-wider py-2.5 px-3">
                          Stylist Member
                        </TableHead>
                        <TableHead className="text-slate-600 font-bold text-[11px] uppercase tracking-wider py-2.5 px-3">
                          Contact Info
                        </TableHead>
                        <TableHead className="text-slate-600 font-bold text-[11px] uppercase tracking-wider py-2.5 px-3">
                          Specializations
                        </TableHead>
                        <TableHead className="text-slate-600 font-bold text-[11px] uppercase tracking-wider py-2.5 px-3">
                          Experience
                        </TableHead>
                        <TableHead className="text-slate-600 font-bold text-[11px] uppercase tracking-wider py-2.5 px-3">
                          Status
                        </TableHead>
                        <TableHead className="text-slate-600 font-bold text-[11px] uppercase tracking-wider py-2.5 px-3 text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStaffs.map((staff, idx) => {
                        const displayName =
                          staff.userName || staff.name || "Stylist";
                        const displayPhone = staff.phoneNumber || staff.phone || "";
                        const displayEmail = staff.emailId || staff.email || "";
                        const exp = staff.yearsOfExperience;
                        const statusConfig = getStatusConfig(staff.status);

                        return (
                          <TableRow
                            key={staff.staffId || staff.id || idx}
                            className={clsx(
                              "hover:bg-slate-50/80 border-b border-slate-100 transition-colors border-l-[3px]",
                              statusConfig.borderLeft
                            )}
                          >
                            {/* Member Avatar & Name */}
                            <TableCell className="py-2.5 px-3">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={clsx(
                                    "h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 ring-2",
                                    statusConfig.avatarRing
                                  )}
                                >
                                  {displayName.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-xs text-slate-900 truncate">
                                    {displayName}
                                  </div>
                                  <div className="text-[10px] text-slate-400 leading-tight">
                                    {staff.gender || "Stylist"}
                                  </div>
                                </div>
                              </div>
                            </TableCell>

                            {/* Contact Info */}
                            <TableCell className="py-2.5 px-3">
                              <div className="space-y-0.5">
                                {displayPhone && (
                                  <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                                    <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                                    <span>{displayPhone}</span>
                                  </div>
                                )}
                                {displayEmail && (
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                    <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                                    <span className="truncate max-w-[160px]">
                                      {displayEmail}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </TableCell>

                            {/* Color-Coded Specialization Badges */}
                            <TableCell className="py-2.5 px-3">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {(staff.specialization || []).length > 0 ? (
                                  staff.specialization.map((spec, sIdx) => (
                                    <span
                                      key={sIdx}
                                      className={clsx(
                                        "text-[10px] font-bold py-0.5 px-1.5 rounded border",
                                        getSpecializationBadgeStyle(spec)
                                      )}
                                    >
                                      {spec}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-slate-400">
                                    General Stylist
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            {/* Experience */}
                            <TableCell className="py-2.5 px-3">
                              <span className="text-xs font-semibold text-slate-700">
                                {exp ? `${exp} yrs` : "—"}
                              </span>
                            </TableCell>

                            {/* Floor Status */}
                            <TableCell className="py-2.5 px-3">
                              <StatusPill status={staff.status} />
                            </TableCell>

                            {/* Actions */}
                            <TableCell className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                                  onClick={() => {
                                    setEditingStaff(staff);
                                    setShowEditModal(true);
                                  }}
                                  title="Edit stylist"
                                  disabled={isCreating || isUpdating || isDeleting}
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                  onClick={() => {
                                    setStaffToDelete(staff);
                                    setShowDeleteConfirm(true);
                                  }}
                                  title="Delete stylist"
                                  disabled={isCreating || isUpdating || isDeleting}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* MOBILE & TABLET CARD VIEW: Compact horizontal cards (~85px-95px high, no screen hogging!) */}
          <div
            className={clsx(
              viewMode === "grid"
                ? "block"
                : viewMode === "table"
                ? "hidden"
                : "block lg:hidden"
            )}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredStaffs.map((staff, idx) => {
                const displayName =
                  staff.userName || staff.name || "Stylist";
                const displayPhone = staff.phoneNumber || staff.phone || "";
                const displayEmail = staff.emailId || staff.email || "";
                const exp = staff.yearsOfExperience;
                const statusConfig = getStatusConfig(staff.status);

                return (
                  <div
                    key={staff.staffId || staff.id || idx}
                    className={clsx(
                      "bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all overflow-hidden p-2.5 sm:p-3 flex flex-col gap-2 border-l-4",
                      statusConfig.borderLeft
                    )}
                  >
                    {/* Top Row: Avatar + Name + Subtitle + Status Pill + Direct Icon Buttons */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={clsx(
                            "h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 ring-2",
                            statusConfig.avatarRing
                          )}
                        >
                          {displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-slate-900 truncate">
                            {displayName}
                          </h4>
                          <span className="text-[10px] text-slate-400 block leading-tight truncate">
                            {staff.gender || "Stylist"}
                            {exp ? ` • ${exp}y exp` : ""}
                          </span>
                        </div>
                      </div>

                      {/* Right: Status Pill & Icon Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <StatusPill status={staff.status} compact />
                        <div className="flex items-center ml-0.5">
                          <button
                            onClick={() => {
                              setEditingStaff(staff);
                              setShowEditModal(true);
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors"
                            title="Edit"
                            disabled={isCreating || isUpdating || isDeleting}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setStaffToDelete(staff);
                              setShowDeleteConfirm(true);
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                            title="Delete"
                            disabled={isCreating || isUpdating || isDeleting}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Middle Row: Phone & Email in single compact row */}
                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-600 pt-1.5 border-t border-slate-100">
                      {displayPhone && (
                        <div className="flex items-center gap-1 font-medium">
                          <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{displayPhone}</span>
                        </div>
                      )}
                      {displayEmail && (
                        <div className="flex items-center gap-1 text-slate-500 text-[10px] truncate max-w-[150px]">
                          <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate">{displayEmail}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Color-coded skill badges */}
                    {(staff.specialization || []).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {staff.specialization.map((spec, sIdx) => (
                          <span
                            key={sIdx}
                            className={clsx(
                              "text-[9px] font-bold px-1.5 py-0.5 rounded border",
                              getSpecializationBadgeStyle(spec)
                            )}
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Add Staff Modal */}
      <StaffModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreateStaff}
        title="Add New Stylist"
        isLoading={isCreating}
      />

      {/* Edit Staff Modal */}
      <StaffModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingStaff(null);
        }}
        onSubmit={handleUpdateStaff}
        title="Edit Stylist Profile"
        staffData={editingStaff}
        isLoading={isUpdating}
      />

      {/* Delete Single Staff Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setStaffToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        staffName={staffToDelete?.userName || staffToDelete?.name}
        isLoading={isDeleting}
      />

      {/* Delete All Staff Confirmation Modal */}
      <DeleteAllConfirmModal
        isOpen={showDeleteAllConfirm}
        onClose={() => setShowDeleteAllConfirm(false)}
        onConfirm={handleDeleteAllStaff}
        count={barbers.length}
        isLoading={isDeletingAll}
      />
    </div>
  );
}
