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
  Calendar,
  Star,
  Lock,
  Crown,
  Sparkles,
  Award,
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
const ScissorsLoader = ({ text = "Loading clients..." }) => {
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

// Color coding for Service Badges
const getServiceBadgeStyle = (service) => {
  const s = String(service || "").toLowerCase();
  if (s.includes("hair") || s.includes("cut") || s.includes("style")) {
    return "bg-sky-50 text-sky-700 border-sky-200/80";
  }
  if (s.includes("color") || s.includes("highlight")) {
    return "bg-purple-50 text-purple-700 border-purple-200/80";
  }
  if (s.includes("facial") || s.includes("skin") || s.includes("spa")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
  }
  if (s.includes("nail") || s.includes("pedicure") || s.includes("manicure")) {
    return "bg-pink-50 text-pink-700 border-pink-200/80";
  }
  if (s.includes("beard") || s.includes("shave")) {
    return "bg-amber-50 text-amber-800 border-amber-200/80";
  }
  return "bg-slate-100 text-slate-700 border-slate-200/80";
};

// Client Status Configuration & Color Coding Helper
const getStatusConfig = (status) => {
  const s = String(status || "active").toLowerCase();
  const configs = {
    vip: {
      label: "VIP",
      badgeClass: "bg-purple-50 text-purple-700 border-purple-200/90",
      dotClass: "bg-purple-500",
      ping: true,
      borderLeft: "border-l-purple-500",
      avatarRing: "ring-purple-400/40",
      avatarGradient: "bg-gradient-to-tr from-purple-600 to-indigo-600",
      kpiBorder: "border-purple-200 bg-purple-50/50 text-purple-700",
      icon: Crown,
    },
    active: {
      label: "Active",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/90",
      dotClass: "bg-emerald-500",
      ping: true,
      borderLeft: "border-l-emerald-500",
      avatarRing: "ring-emerald-400/40",
      avatarGradient: "bg-gradient-to-tr from-emerald-600 to-teal-600",
      kpiBorder: "border-emerald-200 bg-emerald-50/50 text-emerald-700",
      icon: UserCheck,
    },
    inactive: {
      label: "Inactive",
      badgeClass: "bg-slate-100 text-slate-600 border-slate-200/90",
      dotClass: "bg-slate-400",
      ping: false,
      borderLeft: "border-l-slate-300",
      avatarRing: "ring-slate-300/40",
      avatarGradient: "bg-gradient-to-tr from-slate-500 to-slate-700",
      kpiBorder: "border-slate-200 bg-slate-50/50 text-slate-600",
      icon: Users,
    },
  };
  return configs[s] || configs.active;
};

// Status Pill Component
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

// Date Formatter Helper
const formatLastVisitDate = (dateVal) => {
  if (!dateVal) return "Never";
  try {
    if (typeof dateVal === "string" && dateVal.includes("T")) {
      return new Date(dateVal).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
    if (typeof dateVal === "number") {
      return new Date(dateVal * 1000).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  } catch (e) {
    console.warn("Date formatting error:", e);
  }
  return "Never";
};

// Epoch to input date string (YYYY-MM-DD)
const toInputDateString = (val) => {
  if (!val) return "";
  try {
    if (typeof val === "string" && val.includes("T")) {
      return val.split("T")[0];
    }
    if (typeof val === "number") {
      return new Date(val * 1000).toISOString().split("T")[0];
    }
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split("T")[0];
    }
  } catch (e) {
    console.warn("Date parse error:", e);
  }
  return "";
};

// Add & Edit Client Modal (Compact, Mobile-Optimized with locked email on edit)
const ClientModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  clientData = null,
  availableServices = [],
  isLoading = false,
}) => {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    userName: "",
    phoneNumber: "",
    emailId: "",
    gender: "Female",
    status: "active",
    totalVisits: 0,
    loyaltyPoints: 0,
    lastVisit: "",
    preferredServices: [],
    notes: "",
  });

  const [newService, setNewService] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (clientData) {
      setFormData({
        userName: clientData.userName || clientData.clientName || clientData.name || "",
        phoneNumber: clientData.phoneNumber || clientData.phone || "",
        emailId: clientData.emailId || clientData.email || "",
        gender: clientData.gender || "Female",
        status: String(clientData.status || "active").toLowerCase(),
        totalVisits: Number(clientData.totalVisits) || 0,
        loyaltyPoints: Number(clientData.loyaltyPoints) || 0,
        lastVisit: toInputDateString(clientData.lastVisit),
        preferredServices: Array.isArray(clientData.preferredServices)
          ? clientData.preferredServices
          : clientData.preferredServices
          ? [clientData.preferredServices]
          : [],
        notes: clientData.notes || "",
      });
    } else {
      setFormData({
        userName: "",
        phoneNumber: "",
        emailId: "",
        gender: "Female",
        status: "active",
        totalVisits: 0,
        loyaltyPoints: 0,
        lastVisit: new Date().toISOString().split("T")[0],
        preferredServices: [],
        notes: "",
      });
    }
    setErrors({});
    setNewService("");
  }, [clientData, isOpen]);

  const validateForm = () => {
    const errs = {};
    if (!formData.userName || formData.userName.trim().length < 2) {
      errs.userName = "Client name is required (min 2 chars)";
    }
    if (formData.phoneNumber && formData.phoneNumber.trim().length > 0) {
      const cleanPhone = formData.phoneNumber.replace(/[\s\-\(\)]/g, "");
      if (cleanPhone.length < 10) {
        errs.phoneNumber = "Phone number should be at least 10 digits";
      }
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
    let finalValue = value;
    if (name === "totalVisits" || name === "loyaltyPoints") {
      finalValue = Math.max(0, parseInt(value, 10) || 0);
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleAddService = (srv) => {
    const target = (srv || newService).trim();
    if (!target) return;
    if (!formData.preferredServices.includes(target)) {
      setFormData((prev) => ({
        ...prev,
        preferredServices: [...prev.preferredServices, target],
      }));
    }
    setNewService("");
  };

  const handleRemoveService = (srv) => {
    setFormData((prev) => ({
      ...prev,
      preferredServices: prev.preferredServices.filter((s) => s !== srv),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "Required Field Missing",
        description: "Please check client name.",
      });
      return;
    }

    try {
      const cleanPhone = formData.phoneNumber
        ? String(formData.phoneNumber).replace(/[^0-9+]/g, "").trim()
        : "";
      const cleanName = String(formData.userName || "").trim();
      const cleanEmail = String(formData.emailId || "").trim().toLowerCase();

      const payload = {
        userName: cleanName,
        phoneNumber: cleanPhone || null,
        emailId: cleanEmail || null,
        gender: formData.gender,
        status: formData.status,
        totalVisits: Number(formData.totalVisits) || 0,
        loyaltyPoints: Number(formData.loyaltyPoints) || 0,
        lastVisit: formData.lastVisit
          ? Math.floor(new Date(formData.lastVisit).getTime() / 1000)
          : null,
        preferredServices: formData.preferredServices,
        notes: formData.notes.trim(),
      };

      if (clientData) {
        payload.cognitoId =
          clientData.cognitoId || clientData.clientId || clientData.id;
      }

      await onSubmit(payload);
      onClose();
    } catch (err) {
      console.error("Client modal submission error:", err);
    }
  };

  // Predefined service options
  const serviceOptions = useMemo(() => {
    const defaultList = [
      "Hair Cut",
      "Hair Color",
      "Beard Styling",
      "Facial Glow",
      "Hair Spa",
      "Keratin Treatment",
      "Manicure",
      "Pedicure",
    ];
    const fromApi = (availableServices || [])
      .map((s) => s.serviceName || s.name || s.ServiceName || s.Name)
      .filter(Boolean);

    return Array.from(new Set([...fromApi, ...defaultList]));
  }, [availableServices]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Sleek, compact modal that never overwhelms mobile screen */}
      <DialogContent className="w-[92vw] sm:w-[480px] max-h-[84vh] p-0 rounded-2xl overflow-hidden bg-white shadow-xl border border-slate-200 flex flex-col">
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
                Manage client profile, contact details, loyalty & visit history
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Compact Scrollable Body */}
        <form
          id="compact-client-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 overscroll-contain text-xs"
        >
          {/* Row 1: Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <Label htmlFor="userName" className="text-[11px] font-bold text-slate-700">
                Client Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="userName"
                name="userName"
                value={formData.userName}
                onChange={handleInputChange}
                placeholder="e.g. Priya Sharma"
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
                Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
              </Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="e.g. 9876543210 (Optional)"
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

          {/* Row 2: Email & Gender (Email is permanently locked on edit) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <Label htmlFor="emailId" className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                <span>Email Address</span>
                {clientData && (
                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Locked</span>
                  </span>
                )}
              </Label>
              <Input
                id="emailId"
                name="emailId"
                type="email"
                value={formData.emailId}
                onChange={handleInputChange}
                placeholder="e.g. priya@example.com"
                disabled={isLoading || Boolean(clientData)}
                readOnly={Boolean(clientData)}
                className={clsx(
                  "rounded-lg text-xs h-8.5 transition-all",
                  clientData
                    ? "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200 select-none"
                    : errors.emailId
                    ? "border-rose-400 focus:ring-rose-100"
                    : "border-slate-200 focus:border-blue-500"
                )}
              />
              {errors.emailId && !clientData && (
                <p className="text-[10px] text-rose-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                  <span>{errors.emailId}</span>
                </p>
              )}
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
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Status & Last Visit Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <Label htmlFor="status" className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                <span>Client Status</span>
                {formData.status === "vip" && (
                  <span className="text-[9px] font-extrabold text-purple-700 bg-purple-50 px-1 py-0.2 rounded border border-purple-200">
                    VIP Member
                  </span>
                )}
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
                  <SelectItem value="active">Active (Regular)</SelectItem>
                  <SelectItem value="vip">VIP (High-Value)</SelectItem>
                  <SelectItem value="inactive">Inactive / Lapsed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="lastVisit" className="text-[11px] font-bold text-slate-700">
                Last Visit Date
              </Label>
              <Input
                id="lastVisit"
                name="lastVisit"
                type="date"
                value={formData.lastVisit}
                onChange={handleInputChange}
                disabled={isLoading}
                className="rounded-lg text-xs h-8.5 border-slate-200"
              />
            </div>
          </div>

          {/* Row 4: Total Visits & Loyalty Points */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <Label htmlFor="totalVisits" className="text-[11px] font-bold text-slate-700">
                Total Visits
              </Label>
              <Input
                id="totalVisits"
                name="totalVisits"
                type="number"
                min="0"
                max="10000"
                value={formData.totalVisits}
                onChange={handleInputChange}
                placeholder="0"
                disabled={isLoading}
                className="rounded-lg text-xs h-8.5 border-slate-200"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="loyaltyPoints" className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                <span>Loyalty Points</span>
                <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  Rewards
                </span>
              </Label>
              <Input
                id="loyaltyPoints"
                name="loyaltyPoints"
                type="number"
                min="0"
                max="100000"
                value={formData.loyaltyPoints}
                onChange={handleInputChange}
                placeholder="0"
                disabled={isLoading}
                className="rounded-lg text-xs h-8.5 border-slate-200"
              />
            </div>
          </div>

          {/* Row 5: Preferred Services */}
          <div className="space-y-1.5 pt-1">
            <Label className="text-[11px] font-bold text-slate-700">
              Preferred Services
            </Label>
            <div className="flex gap-1.5">
              <Input
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddService();
                  }
                }}
                placeholder="Add custom service preference..."
                className="flex-1 rounded-lg text-xs h-8 border-slate-200"
                disabled={isLoading}
              />
              <Button
                type="button"
                onClick={() => handleAddService()}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold px-3 h-8 shrink-0 cursor-pointer"
                disabled={isLoading}
              >
                Add
              </Button>
            </div>

            {/* Selected Preferred Services */}
            {formData.preferredServices.length > 0 && (
              <div className="flex flex-wrap gap-1 p-1.5 rounded-lg bg-slate-50 border border-slate-200/80 max-h-16 overflow-y-auto">
                {formData.preferredServices.map((srv, index) => (
                  <span
                    key={index}
                    className={clsx(
                      "text-[10px] font-bold py-0.5 px-2 rounded-md flex items-center gap-1 border",
                      getServiceBadgeStyle(srv)
                    )}
                  >
                    <span>{srv}</span>
                    <X
                      className="h-2.5 w-2.5 cursor-pointer opacity-70 hover:opacity-100"
                      onClick={() => handleRemoveService(srv)}
                    />
                  </span>
                ))}
              </div>
            )}

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1 pt-0.5">
              {serviceOptions.slice(0, 8).map((srv) => {
                const isSelected = formData.preferredServices.includes(srv);
                return (
                  <button
                    key={srv}
                    type="button"
                    onClick={() => handleAddService(srv)}
                    disabled={isSelected || isLoading}
                    className={clsx(
                      "text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer font-medium",
                      isSelected
                        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-default opacity-50"
                        : "bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border-slate-200"
                    )}
                  >
                    + {srv}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 6: Notes */}
          <div className="space-y-1">
            <Label htmlFor="notes" className="text-[11px] font-bold text-slate-700">
              Client Notes & Preferences (Optional)
            </Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={2}
              placeholder="e.g. Prefers organic products, sensitive scalp..."
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
            form="compact-client-form"
            className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold h-8 px-4 cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : clientData ? "Update Client" : "Add Client"}
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
  clientName,
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
                Delete Client
              </DialogTitle>
              <DialogDescription className="text-[11px] text-slate-500">
                Permanently remove from directory
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-2.5 text-xs text-slate-600">
          Delete <strong className="text-slate-900 font-bold">{clientName}</strong>? This action cannot be undone.
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

// Delete All Clients Modal
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
                Delete All Clients
              </DialogTitle>
              <DialogDescription className="text-[11px] text-rose-600 font-medium">
                Reset directory ({count} clients)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-2.5 text-xs text-slate-600 space-y-1.5">
          <p>
            Permanently delete all <strong className="text-slate-900 font-bold">{count} clients</strong>?
          </p>
          <p className="text-slate-500 text-[10px] bg-slate-50 p-2 rounded-lg border border-slate-200">
            This wipes all client records so you can test adding fresh clients.
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
            {isLoading ? "Deleting All..." : "Yes, Delete All"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function ClientsPage() {
  const {
    clients = [],
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
    services = [],
    loader,
  } = useContext(Context);

  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);

  // Manual view toggle: 'auto' | 'table' | 'grid'
  const [viewMode, setViewMode] = useState("auto");

  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Initial load
  useEffect(() => {
    if (fetchClients) {
      fetchClients();
    }
  }, []);

  const safeClients = Array.isArray(clients) ? clients : [];

  // Filtered client list by clientName, phone, email, status, or preferred services
  const filteredClients = useMemo(() => {
    const q = String(searchTerm || "").toLowerCase().trim();
    if (!q) return safeClients;

    return safeClients.filter((c) => {
      if (!c) return false;
      const name = String(c.userName || c.clientName || c.name || "").toLowerCase();
      const phone = String(c.phoneNumber || c.phone || "").toLowerCase();
      const email = String(c.emailId || c.email || "").toLowerCase();
      const status = String(c.status || "active").toLowerCase();
      const srvList = Array.isArray(c.preferredServices)
        ? c.preferredServices.join(" ").toLowerCase()
        : String(c.preferredServices || "").toLowerCase();

      return (
        name.includes(q) ||
        phone.includes(q) ||
        email.includes(q) ||
        status.includes(q) ||
        srvList.includes(q)
      );
    });
  }, [safeClients, searchTerm]);

  // Handlers
  const handleCreateClient = async (payload) => {
    if (isCreating) return;
    try {
      setIsCreating(true);
      await createClient(payload);
      setShowAddModal(false);
    } catch (err) {
      console.error("Create client error:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateClient = async (payload) => {
    if (isUpdating) return;
    try {
      setIsUpdating(true);
      const targetId =
        payload.cognitoId ||
        payload.clientId ||
        editingClient?.cognitoId ||
        editingClient?.clientId ||
        editingClient?.id;
      await updateClient(targetId, payload);
      setShowEditModal(false);
      setEditingClient(null);
    } catch (err) {
      console.error("Update client error:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete || isDeleting) return;
    try {
      setIsDeleting(true);
      const targetId =
        clientToDelete.cognitoId ||
        clientToDelete.clientId ||
        clientToDelete.id;
      await deleteClient(targetId);
      setShowDeleteConfirm(false);
      setClientToDelete(null);
    } catch (err) {
      console.error("Delete client error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAllClients = async () => {
    if (isDeletingAll || clients.length === 0) return;
    try {
      setIsDeletingAll(true);
      toast({
        title: "Deleting all clients...",
        description: `Processing ${clients.length} client deletions.`,
      });

      for (const c of clients) {
        const targetId = c.cognitoId || c.clientId || c.id;
        if (targetId) {
          try {
            await deleteClient(targetId);
          } catch (e) {
            console.error("Failed to delete client:", targetId, e);
          }
        }
      }

      await fetchClients();
      setShowDeleteAllConfirm(false);
      toast({
        variant: "success",
        title: "All Clients Deleted",
        description: "Client directory has been reset. You can now add new clients.",
      });
    } catch (err) {
      console.error("Delete all clients error:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete all clients.",
      });
    } finally {
      setIsDeletingAll(false);
    }
  };

  // KPI Metrics
  const totalCount = safeClients.length;
  const vipCount = safeClients.filter(
    (c) => String(c?.status || "").toLowerCase() === "vip"
  ).length;
  const activeCount = safeClients.filter(
    (c) => String(c?.status || "active").toLowerCase() === "active"
  ).length;
  const inactiveCount = safeClients.filter(
    (c) => String(c?.status || "").toLowerCase() === "inactive"
  ).length;

  return (
    <div className="p-3 sm:p-4 lg:p-5 space-y-3 font-sans bg-[#f8fafc] min-h-full text-slate-800">
      {/* 1. Compact Header Bar: Title + Actions */}
      <div className="bg-white px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
            Clients & Members
          </h1>
          <span className="text-[11px] font-semibold text-slate-400 hidden md:inline">
            ({totalCount} registered • {vipCount} {vipCount === 1 ? "VIP" : "VIPs"})
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
         

          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs text-xs h-8 px-3 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Add Client</span>
          </Button>
        </div>
      </div>

      {/* 2. Color-Coded Mini KPI Cards: Symmetrical 4-Card Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* KPI 1: Total Clients */}
        <div className="bg-white rounded-xl p-2.5 border border-slate-200/90 shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0 border border-indigo-100">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-base font-extrabold text-slate-900 leading-none">
              {totalCount}
            </div>
            <div className="text-[10px] font-semibold text-slate-500 mt-0.5 truncate flex items-center gap-1">
              <span>Total Clients</span>
              {vipCount > 0 && (
                <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-1 rounded border border-purple-200">
                  {vipCount} VIP
                </span>
              )}
            </div>
          </div>
        </div>

        {/* KPI 2: Active Clients */}
        <div className="bg-white rounded-xl p-2.5 border border-emerald-200 shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0 border border-emerald-200">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>
          <div className="min-w-0">
            <div className="text-base font-extrabold text-emerald-700 leading-none">
              {activeCount}
            </div>
            <div className="text-[10px] font-semibold text-emerald-600 mt-0.5 truncate">
              Active Regulars
            </div>
          </div>
        </div>

        {/* KPI 3: VIP Clients */}
        <div className="bg-white rounded-xl p-2.5 border border-purple-200 shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0 border border-purple-200">
            <Crown className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-base font-extrabold text-purple-700 leading-none">
              {vipCount}
            </div>
            <div className="text-[10px] font-semibold text-purple-600 mt-0.5 truncate">
              VIP Members
            </div>
          </div>
        </div>

        {/* KPI 4: Inactive / Lapsed */}
        <div className="bg-white rounded-xl p-2.5 border border-slate-200/90 shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold shrink-0 border border-slate-200">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-base font-extrabold text-slate-700 leading-none">
              {inactiveCount}
            </div>
            <div className="text-[10px] font-semibold text-slate-500 mt-0.5 truncate">
              Inactive / Lapsed
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
            placeholder="Search name, phone, email, or service..."
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

      {/* 4. Clients Content (Desktop Table / Mobile Cards) */}
      {loader && clients.length === 0 ? (
        <ScissorsLoader text="Loading clients..." />
      ) : clients.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center my-2 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2.5 border border-blue-100">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            No clients registered yet
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xs mx-auto">
            Add your clients to track visits, contact info, and loyalty rewards.
          </p>
          <Button
            onClick={() => setShowAddModal(true)}
            className="mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs h-8 px-3.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Add First Client</span>
          </Button>
        </div>
      ) : filteredClients.length === 0 ? (
        /* Search Not Found State */
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 text-center my-2 shadow-2xs">
          <Search className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
          <h3 className="text-xs font-bold text-slate-800">
            No clients matching "{searchTerm}"
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
                          Client Member
                        </TableHead>
                        <TableHead className="text-slate-600 font-bold text-[11px] uppercase tracking-wider py-2.5 px-3">
                          Contact Info
                        </TableHead>
                        <TableHead className="text-slate-600 font-bold text-[11px] uppercase tracking-wider py-2.5 px-3">
                          Preferred Services
                        </TableHead>
                        <TableHead className="text-slate-600 font-bold text-[11px] uppercase tracking-wider py-2.5 px-3">
                          Last Visit
                        </TableHead>
                        <TableHead className="text-slate-600 font-bold text-[11px] uppercase tracking-wider py-2.5 px-3">
                          Visits & Rewards
                        </TableHead>
                        <TableHead className="text-slate-600 font-bold text-[11px] uppercase tracking-wider py-2.5 px-3">
                          Status
                        </TableHead>
                        <TableHead className="text-slate-600 font-bold text-[11px] uppercase tracking-wider py-2.5 px-3 text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="[&_tr:last-child]:border-b-0">
                      {filteredClients.map((client, idx) => {
                        const displayName =
                          client.clientName || client.name || "Client";
                        const displayPhone =
                          client.phoneNumber || client.phone || "";
                        const displayEmail =
                          client.emailId || client.email || "";
                        const clientId =
                          client.clientId || client.ClientId || client.id || idx;
                        const statusConfig = getStatusConfig(client.status);
                        const visits = Number(client.totalVisits) || 0;
                        const points = Number(client.loyaltyPoints) || 0;
                        const servicesList = Array.isArray(
                          client.preferredServices
                        )
                          ? client.preferredServices
                          : [];

                        return (
                          <TableRow
                            key={clientId}
                            className="hover:bg-slate-50/80 border-b border-slate-100 transition-colors"
                          >
                            {/* Member Avatar, Name & ID with status left border */}
                            <TableCell
                              className={clsx(
                                "py-2.5 px-3 border-l-[4px] relative",
                                statusConfig.borderLeft
                              )}
                            >
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={clsx(
                                    "h-8 w-8 rounded-full text-white font-bold text-[11px] flex items-center justify-center shrink-0 ring-2",
                                    statusConfig.avatarGradient,
                                    statusConfig.avatarRing
                                  )}
                                >
                                  {displayName.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs text-slate-900 truncate">
                                      {displayName}
                                    </span>
                                    {client.status === "vip" && (
                                      <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                                        <Crown className="w-2.5 h-2.5 text-purple-600" />
                                        VIP
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono leading-tight">
                                    #{clientId}
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
                                {displayEmail ? (
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                    <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                                    <span className="truncate max-w-[160px]">
                                      {displayEmail}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-400">
                                    No email
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            {/* Preferred Services */}
                            <TableCell className="py-2.5 px-3">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {servicesList.length > 0 ? (
                                  servicesList.slice(0, 2).map((srv, sIdx) => (
                                    <span
                                      key={sIdx}
                                      className={clsx(
                                        "text-[10px] font-bold py-0.5 px-1.5 rounded border",
                                        getServiceBadgeStyle(srv)
                                      )}
                                    >
                                      {srv}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-slate-400">
                                    General
                                  </span>
                                )}
                                {servicesList.length > 2 && (
                                  <span className="text-[9px] font-bold py-0.5 px-1 rounded bg-slate-100 text-slate-500 border border-slate-200">
                                    +{servicesList.length - 2}
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            {/* Last Visit Date */}
                            <TableCell className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5 text-xs text-slate-700">
                                <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                                <span>{formatLastVisitDate(client.lastVisit)}</span>
                              </div>
                            </TableCell>

                            {/* Visits & Rewards */}
                            <TableCell className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                  {visits} {visits === 1 ? "visit" : "visits"}
                                </span>
                                <div className="flex items-center gap-1 font-bold text-amber-600 text-xs">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                                  <span>{points} pts</span>
                                </div>
                              </div>
                            </TableCell>

                            {/* Status */}
                            <TableCell className="py-2.5 px-3">
                              <StatusPill status={client.status} />
                            </TableCell>

                            {/* Actions */}
                            <TableCell className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                                  onClick={() => {
                                    setEditingClient(client);
                                    setShowEditModal(true);
                                  }}
                                  title="Edit client"
                                  disabled={isCreating || isUpdating || isDeleting}
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                  onClick={() => {
                                    setClientToDelete(client);
                                    setShowDeleteConfirm(true);
                                  }}
                                  title="Delete client"
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

          {/* MOBILE & TABLET CARD VIEW: Compact horizontal cards with status border */}
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
              {filteredClients.map((client, idx) => {
                const displayName =
                  client.clientName || client.name || "Client";
                const displayPhone =
                  client.phoneNumber || client.phone || "";
                const displayEmail =
                  client.emailId || client.email || "";
                const clientId =
                  client.clientId || client.ClientId || client.id || idx;
                const statusConfig = getStatusConfig(client.status);
                const visits = Number(client.totalVisits) || 0;
                const points = Number(client.loyaltyPoints) || 0;
                const servicesList = Array.isArray(client.preferredServices)
                  ? client.preferredServices
                  : [];

                return (
                  <div
                    key={clientId}
                    className={clsx(
                      "bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all overflow-hidden p-2.5 sm:p-3 flex flex-col gap-2 border-l-4",
                      statusConfig.borderLeft
                    )}
                  >
                    {/* Top Row: Avatar + Name + VIP Badge + Status Pill + Direct Icon Buttons */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={clsx(
                            "h-8 w-8 rounded-full text-white font-bold text-[11px] flex items-center justify-center shrink-0 ring-2",
                            statusConfig.avatarGradient,
                            statusConfig.avatarRing
                          )}
                        >
                          {displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-xs text-slate-900 truncate">
                              {displayName}
                            </h4>
                            {client.status === "vip" && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                                <Crown className="w-2.5 h-2.5 text-purple-600" />
                                VIP
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block leading-tight truncate">
                            #{clientId}
                          </span>
                        </div>
                      </div>

                      {/* Right top: Status Pill + Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <StatusPill status={client.status} compact={true} />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                          onClick={() => {
                            setEditingClient(client);
                            setShowEditModal(true);
                          }}
                          disabled={isCreating || isUpdating || isDeleting}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          onClick={() => {
                            setClientToDelete(client);
                            setShowDeleteConfirm(true);
                          }}
                          disabled={isCreating || isUpdating || isDeleting}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Middle Info Row: Phone + Email in a single compact line */}
                    <div className="flex items-center justify-between text-[11px] text-slate-600 gap-2 border-t border-slate-100/80 pt-1.5">
                      <div className="flex items-center gap-1.5 min-w-0 truncate">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="font-medium truncate">{displayPhone || "No Phone"}</span>
                      </div>
                      {displayEmail && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate max-w-[130px]">
                          <Mail className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{displayEmail}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Visits count, Loyalty points & Last visit */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100/80 gap-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Last: {formatLastVisitDate(client.lastVisit)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
                          {visits} {visits === 1 ? "visit" : "visits"}
                        </span>
                        <span className="font-bold text-amber-600 flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          {points} pts
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Add & Edit Client Modal */}
      <ClientModal
        isOpen={showAddModal || showEditModal}
        onClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          setEditingClient(null);
        }}
        onSubmit={editingClient ? handleUpdateClient : handleCreateClient}
        title={editingClient ? "Edit Client Profile" : "Add New Client"}
        clientData={editingClient}
        availableServices={services}
        isLoading={isCreating || isUpdating}
      />

      {/* Delete Single Client Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setClientToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        clientName={
          clientToDelete
            ? clientToDelete.clientName || clientToDelete.name || "this client"
            : ""
        }
        isLoading={isDeleting}
      />

      {/* Delete All Clients Confirmation Modal */}
      <DeleteAllConfirmModal
        isOpen={showDeleteAllConfirm}
        onClose={() => setShowDeleteAllConfirm(false)}
        onConfirm={handleDeleteAllClients}
        count={clients.length}
        isLoading={isDeletingAll}
      />
    </div>
  );
}
