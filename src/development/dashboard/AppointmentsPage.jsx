import React, { useState, useContext, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
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
  CheckCircle,
  CheckCircle2,
  Clock,
  User,
  Users,
  Sparkles,
  Receipt,
  CreditCard,
  XCircle,
  Filter,
  Check,
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

/* ==========================================================================
   SCISSORS LOADER COMPONENT (MATCHING STAFFS PAGE)
   ========================================================================== */
const ScissorsLoader = ({ text = "Loading appointments..." }) => {
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

/* ==========================================================================
   SERVICE BADGE COLOR CODING (MATCHING CLIENTS & STAFFS PAGES)
   ========================================================================== */
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

/* ==========================================================================
   STATUS CONFIGURATION & PILL (MATCHING STAFFS PAGE PATTERN)
   ========================================================================== */
const normalizeStatus = (raw) => {
  if (!raw) return "scheduled";
  const s = String(raw).toLowerCase().trim().replace(/[-\s]/g, "_");
  if (s.includes("progress") || s.includes("service") || s.includes("chair")) return "in_progress";
  if (s.includes("confirm")) return "scheduled";
  if (s.includes("complete") || s.includes("done")) return "completed";
  if (s.includes("cancel")) return "cancelled";
  if (s.includes("sched") || s.includes("pend")) return "scheduled";
  return s;
};

const getStatusConfig = (status) => {
  const safeStatus = normalizeStatus(status);
  const configs = {
    scheduled: {
      label: "Scheduled",
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200/90",
      dotClass: "bg-amber-500",
      ping: false,
      borderLeft: "border-l-amber-500",
      avatarRing: "ring-amber-300/40",
      kpiBorder: "border-amber-200 bg-amber-50/50 text-amber-800",
      icon: Clock,
    },
    confirmed: {
      label: "Confirmed",
      badgeClass: "bg-teal-50 text-teal-700 border-teal-200/90",
      dotClass: "bg-teal-500",
      ping: false,
      borderLeft: "border-l-teal-500",
      avatarRing: "ring-teal-300/40",
      kpiBorder: "border-teal-200 bg-teal-50/50 text-teal-700",
      icon: CheckCircle2,
    },
    in_progress: {
      label: "In Service",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200/90",
      dotClass: "bg-blue-500",
      ping: true,
      borderLeft: "border-l-blue-500",
      avatarRing: "ring-blue-400/40",
      kpiBorder: "border-blue-200 bg-blue-50/50 text-blue-700",
      icon: Scissors,
    },
    completed: {
      label: "Completed",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/90",
      dotClass: "bg-emerald-500",
      ping: false,
      borderLeft: "border-l-emerald-500",
      avatarRing: "ring-emerald-300/40",
      kpiBorder: "border-emerald-200 bg-emerald-50/50 text-emerald-700",
      icon: CheckCircle,
    },
    cancelled: {
      label: "Cancelled",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200/90",
      dotClass: "bg-rose-500",
      ping: false,
      borderLeft: "border-l-rose-400",
      avatarRing: "ring-rose-300/40",
      kpiBorder: "border-rose-200 bg-rose-50/50 text-rose-700",
      icon: XCircle,
    },
  };
  return configs[safeStatus] || configs.scheduled;
};

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

/* ==========================================================================
   DATE & TIME PARSING HELPERS
   ========================================================================== */
const parseAppointmentDateTime = (dateTimeVal, dateVal, timeVal) => {
  if (dateTimeVal) {
    if (typeof dateTimeVal === "number") {
      const ms = dateTimeVal < 10000000000 ? dateTimeVal * 1000 : dateTimeVal;
      const d = new Date(ms);
      if (!isNaN(d.getTime())) return d;
    } else if (typeof dateTimeVal === "string") {
      const num = Number(dateTimeVal);
      if (!isNaN(num) && num > 0) {
        const ms = num < 10000000000 ? num * 1000 : num;
        const d = new Date(ms);
        if (!isNaN(d.getTime())) return d;
      }
      const d = new Date(dateTimeVal);
      if (!isNaN(d.getTime())) return d;
    }
  }

  if (dateVal) {
    const combined = timeVal ? `${dateVal}T${timeVal}` : dateVal;
    const d = new Date(combined);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
};

const formatDateLabel = (dateObj) => {
  if (!dateObj || isNaN(dateObj.getTime())) return "Scheduled";
  const now = new Date();
  const isToday =
    dateObj.getDate() === now.getDate() &&
    dateObj.getMonth() === now.getMonth() &&
    dateObj.getFullYear() === now.getFullYear();

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    dateObj.getDate() === tomorrow.getDate() &&
    dateObj.getMonth() === tomorrow.getMonth() &&
    dateObj.getFullYear() === tomorrow.getFullYear();

  if (isToday) return "Today";
  if (isTomorrow) return "Tomorrow";

  return dateObj.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
};

const formatTimeLabel = (dateObj, fallbackTime = "") => {
  if (dateObj && !isNaN(dateObj.getTime())) {
    return dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return fallbackTime || "Time unset";
};

const formatCurrency = (amount) => {
  const numeric = Number(amount) || 0;
  return `₹${numeric.toLocaleString("en-IN")}`;
};

/* ==========================================================================
   BOOK & EDIT APPOINTMENT MODAL (COMPACT, MATCHING STAFFS PAGE PATTERN)
   ========================================================================== */
const AppointmentModal = ({
  isOpen,
  onClose,
  onSubmit,
  title = "Book Appointment",
  appointmentData = null,
  initialDate = null,
  initialStaffId = null,
  barbers = [],
  services = [],
  clients = [],
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    clientName: "",
    phoneNumber: "",
    dateTime: "",
    staffId: "",
    services: [],
    status: "scheduled",
    notes: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredClients, setFilteredClients] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (appointmentData) {
      let dateTimeString = "";
      const parsedDate = parseAppointmentDateTime(
        appointmentData.dateTime,
        appointmentData.date || appointmentData.appointment_date,
        appointmentData.time || appointmentData.appointment_time
      );

      if (parsedDate && !isNaN(parsedDate.getTime())) {
        const year = parsedDate.getFullYear();
        const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
        const day = String(parsedDate.getDate()).padStart(2, "0");
        const hours = String(parsedDate.getHours()).padStart(2, "0");
        const minutes = String(parsedDate.getMinutes()).padStart(2, "0");
        dateTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
      } else {
        const now = new Date();
        dateTimeString = now.toISOString().slice(0, 16);
      }

      let serviceList = [];
      if (Array.isArray(appointmentData.service)) {
        serviceList = appointmentData.service.map((s) =>
          typeof s === "object" ? s.serviceName || s.name : s
        );
      } else if (typeof appointmentData.service === "string" && appointmentData.service) {
        serviceList = appointmentData.service.split(",").map((s) => s.trim());
      }

      setFormData({
        clientName:
          appointmentData.client?.clientName || appointmentData.clientName || "",
        phoneNumber:
          appointmentData.client?.phoneNumber ||
          appointmentData.clientPhone ||
          appointmentData.phoneNumber ||
          "",
        dateTime: dateTimeString,
        staffId: appointmentData.staffId || appointmentData.barberId || "",
        services: serviceList,
        status: normalizeStatus(appointmentData.status),
        notes: appointmentData.notes || appointmentData.Notes || "",
      });
    } else {
      const baseDate = initialDate ? new Date(initialDate) : new Date();
      if (!initialDate) {
        baseDate.setMinutes(Math.ceil(baseDate.getMinutes() / 15) * 15);
      }
      baseDate.setSeconds(0);
      const year = baseDate.getFullYear();
      const month = String(baseDate.getMonth() + 1).padStart(2, "0");
      const day = String(baseDate.getDate()).padStart(2, "0");
      const hours = String(baseDate.getHours()).padStart(2, "0");
      const minutes = String(baseDate.getMinutes()).padStart(2, "0");

      setFormData({
        clientName: "",
        phoneNumber: "",
        dateTime: `${year}-${month}-${day}T${hours}:${minutes}`,
        staffId: initialStaffId || "",
        services: [],
        status: "scheduled",
        notes: "",
      });
    }

    setSearchTerm("");
    setFilteredClients([]);
    setErrors({});
  }, [appointmentData, isOpen, initialDate, initialStaffId]);

  // Client quick search
  useEffect(() => {
    if (searchTerm.trim().length > 1) {
      const q = searchTerm.toLowerCase();
      const matches = clients.filter((c) => {
        const name = (
          c.clientName ||
          c.userName ||
          c.name ||
          ""
        ).toLowerCase();
        const phone = (c.phoneNumber || c.phone || "").toLowerCase();
        return name.includes(q) || phone.includes(q);
      });
      setFilteredClients(matches.slice(0, 4));
    } else {
      setFilteredClients([]);
    }
  }, [searchTerm, clients]);

  const handleSelectClient = (c) => {
    const name = c.clientName || c.userName || c.name || "";
    const phone = c.phoneNumber || c.phone || "";
    const preferred = c.preferredServices || [];
    setFormData((prev) => ({
      ...prev,
      clientName: name,
      phoneNumber: phone,
      staffId: c.preferredStaffId || prev.staffId,
      services: preferred.length > 0 ? preferred : prev.services,
    }));
    setSearchTerm("");
    setFilteredClients([]);
  };

  const handleToggleService = (serviceName) => {
    setFormData((prev) => {
      const exists = prev.services.includes(serviceName);
      return {
        ...prev,
        services: exists
          ? prev.services.filter((s) => s !== serviceName)
          : [...prev.services, serviceName],
      };
    });
  };

  const validate = () => {
    const errs = {};
    if (!formData.clientName.trim()) errs.clientName = "Client name is required";
    if (!formData.phoneNumber.trim()) errs.phoneNumber = "Phone number is required";
    if (formData.services.length === 0) errs.services = "Select at least 1 service";
    if (!formData.dateTime) errs.dateTime = "Date & time is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || isLoading) return;

    try {
      const dateTimeEpoch = Math.floor(new Date(formData.dateTime).getTime() / 1000);
      const duration = formData.services.length * 30;
      const selectedStaff = barbers.find(
        (b) => (b.staffId || b.id) === formData.staffId
      );

      let total = 0;
      formData.services.forEach((sName) => {
        const match = services.find((s) => (s.serviceName || s.name) === sName);
        if (match && match.amount) total += Number(match.amount) || 0;
      });

      const payload = {
        clientName: formData.clientName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        dateTime: dateTimeEpoch,
        service: formData.services.join(", "),
        duration,
        total,
        totalAmount: total,
        staffId: formData.staffId || "",
        staff: selectedStaff?.name || selectedStaff?.fullName || "",
        barberName: selectedStaff?.name || selectedStaff?.fullName || "",
        status: formData.status,
        notes: formData.notes.trim(),
      };

      await onSubmit(payload);
    } catch (err) {
      console.error("Appointment submit error:", err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[94vw] sm:w-[500px] p-0 rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Compact Header matching StaffsPage */}
        <DialogHeader className="shrink-0 px-4 py-3 border-b border-slate-100 bg-slate-50/80 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-slate-900 leading-tight">
                {title}
              </DialogTitle>
              <DialogDescription className="text-[11px] text-slate-500">
                Salon queue and stylist scheduling
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Form Body */}
        <form
          id="compact-appointment-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 space-y-3"
        >
          {/* Client Auto-Search (If Booking New) */}
          {!appointmentData && (
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-slate-700">
                Quick Client Lookup (Optional)
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search existing client by name or phone..."
                  className="pl-8 text-xs h-8 rounded-lg border-slate-200"
                  disabled={isLoading}
                />
              </div>

              {filteredClients.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100 shadow-sm mt-1 overflow-hidden">
                  {filteredClients.map((c) => (
                    <div
                      key={c.clientId || c.id}
                      onClick={() => handleSelectClient(c)}
                      className="p-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          {c.clientName || c.userName || c.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {c.phoneNumber || c.phone}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                        Select
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Client Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-slate-700">
                Client Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={formData.clientName}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, clientName: e.target.value }))
                }
                placeholder="Full name"
                className={clsx(
                  "rounded-lg text-xs h-8 border-slate-200",
                  errors.clientName && "border-rose-400 bg-rose-50/30"
                )}
                disabled={isLoading}
              />
              {errors.clientName && (
                <p className="text-[10px] text-rose-500 font-medium">
                  {errors.clientName}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-slate-700">
                Phone Number <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, phoneNumber: e.target.value }))
                }
                placeholder="+91 Mobile number"
                className={clsx(
                  "rounded-lg text-xs h-8 border-slate-200",
                  errors.phoneNumber && "border-rose-400 bg-rose-50/30"
                )}
                disabled={isLoading}
              />
              {errors.phoneNumber && (
                <p className="text-[10px] text-rose-500 font-medium">
                  {errors.phoneNumber}
                </p>
              )}
            </div>
          </div>

          {/* Date & Time and Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-slate-700">
                Date & Time <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="datetime-local"
                value={formData.dateTime}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, dateTime: e.target.value }))
                }
                className={clsx(
                  "rounded-lg text-xs h-8 border-slate-200",
                  errors.dateTime && "border-rose-400 bg-rose-50/30"
                )}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-slate-700">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(val) =>
                  setFormData((p) => ({ ...p, status: val }))
                }
                disabled={isLoading}
              >
                <SelectTrigger className="rounded-lg text-xs h-8 border-slate-200">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200">
                  <SelectItem value="scheduled">Scheduled (Pending)</SelectItem>
                  <SelectItem value="in_progress">In Service (In Chair)</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stylist Selection */}
          <div className="space-y-1">
            <Label className="text-[11px] font-bold text-slate-700">
              Stylist / Barber
            </Label>
            <Select
              value={formData.staffId || "unassigned"}
              onValueChange={(val) =>
                setFormData((p) => ({
                  ...p,
                  staffId: val === "unassigned" ? "" : val,
                }))
              }
              disabled={isLoading}
            >
              <SelectTrigger className="rounded-lg text-xs h-8 border-slate-200">
                <SelectValue placeholder="Select stylist..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200">
                <SelectItem value="unassigned">Any Available Stylist</SelectItem>
                {barbers.map((b) => (
                  <SelectItem key={b.staffId || b.id} value={b.staffId || b.id}>
                    {b.name || b.fullName} {b.role ? `(${b.role})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Services Selection (Chips) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-bold text-slate-700">
                Services <span className="text-rose-500">*</span>
              </Label>
              <span className="text-[10px] font-semibold text-slate-400">
                {formData.services.length} selected
              </span>
            </div>

            <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto p-1.5 rounded-lg border border-slate-200 bg-slate-50/50">
              {services.map((s) => {
                const sName = s.serviceName || s.name;
                const isSelected = formData.services.includes(sName);
                return (
                  <button
                    key={s.serviceId || s.id || sName}
                    type="button"
                    onClick={() => handleToggleService(sName)}
                    className={clsx(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-all cursor-pointer flex items-center gap-1",
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                        : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                    )}
                  >
                    <span>{sName}</span>
                    {s.amount && (
                      <span className={isSelected ? "opacity-90" : "text-slate-400"}>
                        (₹{s.amount})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {errors.services && (
              <p className="text-[10px] text-rose-500 font-medium">
                {errors.services}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label className="text-[11px] font-bold text-slate-700">
              Notes (Optional)
            </Label>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData((p) => ({ ...p, notes: e.target.value }))
              }
              rows={2}
              placeholder="Special instructions or preferences..."
              className="resize-none rounded-lg text-xs border-slate-200 py-1.5 h-12"
              disabled={isLoading}
            />
          </div>
        </form>

        {/* Compact Sticky Footer matching StaffsPage */}
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
            form="compact-appointment-form"
            className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold h-8 px-4 cursor-pointer"
            disabled={isLoading}
          >
            {isLoading
              ? "Saving..."
              : appointmentData
              ? "Update Appointment"
              : "Book Appointment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ==========================================================================
   INTERACTIVE CALENDAR VIEW (DAY / WEEK / MONTH & WHO IS BUSY TIMELINE)
   ========================================================================== */
const CalendarView = ({
  appointments = [],
  barbers = [],
  services = [],
  onBookSlot,
  onEdit,
  onDelete,
  onStatusUpdate,
  navigate,
  formatCurrency,
}) => {
  const [scope, setScope] = useState("day"); // "day" | "week" | "month"
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedMonthDay, setSelectedMonthDay] = useState(null);

  // Quick navigation
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (scope === "day") next.setDate(next.getDate() - 1);
      else if (scope === "week") next.setDate(next.getDate() - 7);
      else if (scope === "month") next.setMonth(next.getMonth() - 1);
      return next;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (scope === "day") next.setDate(next.getDate() + 1);
      else if (scope === "week") next.setDate(next.getDate() + 7);
      else if (scope === "month") next.setMonth(next.getMonth() + 1);
      return next;
    });
  };

  const handleToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setCurrentDate(d);
    setSelectedMonthDay(d);
  };

  // Helper date matching
  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  // Parsed appointment items with Date object
  const appointmentsWithDates = useMemo(() => {
    return appointments.map((appt) => {
      const dateObj = parseAppointmentDateTime(
        appt.dateTime,
        appt.date || appt.appointment_date,
        appt.time || appt.appointment_time
      );
      const staffName =
        appt.staff ||
        appt.barberName ||
        appt.barber?.name ||
        appt.staff_name ||
        "";
      const staffId =
        appt.staffId ||
        appt.barberId ||
        appt.barber?.staffId ||
        appt.barber?.id ||
        "";
      const clientName =
        appt.client?.clientName ||
        appt.clientName ||
        appt.client_name ||
        appt.userName ||
        appt.name ||
        appt.customerName ||
        "Client";
      const phone =
        appt.client?.phoneNumber ||
        appt.clientPhone ||
        appt.phoneNumber ||
        "";
      const serviceName = Array.isArray(appt.service)
        ? appt.service.join(", ")
        : appt.service || "Service";

      return {
        ...appt,
        parsedDate: dateObj,
        clientName,
        phone,
        staffName,
        staffId,
        serviceName,
        normStatus: normalizeStatus(appt.status),
      };
    });
  }, [appointments]);

  // Appointments for the active day (in Day view or selected day in Month view)
  const activeDayAppointments = useMemo(() => {
    const target = scope === "month" && selectedMonthDay ? selectedMonthDay : currentDate;
    return appointmentsWithDates.filter(
      (a) => a.parsedDate && isSameDay(a.parsedDate, target)
    );
  }, [appointmentsWithDates, currentDate, selectedMonthDay, scope]);

  // Week days calculation (Monday to Sunday)
  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  // Month days calculation
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];
    const startDayIndex = firstDay.getDay();
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push({ date: new Date(year, month, d), isCurrentMonth: true });
    }

    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  }, [currentDate]);

  // Timeline hours for Day view: 9 AM to 9 PM
  const timeSlots = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

  // Active Stylists list for Day View columns
  const displayStylists = useMemo(() => {
    if (barbers && barbers.length > 0) return barbers;
    return [{ staffId: "general", name: "General Queue", role: "All Stylists" }];
  }, [barbers]);

  // Check busy status for a stylist at a particular hour on currentDate
  const getStylistApptAtHour = (stylist, hour) => {
    const sId = String(stylist.staffId || stylist.id || "");
    const sName = (stylist.name || stylist.fullName || "").toLowerCase();

    return activeDayAppointments.find((a) => {
      if (!a.parsedDate) return false;
      const apptHour = a.parsedDate.getHours();
      const matchHour = apptHour === hour;
      if (!matchHour) return false;

      if (!sId || sId === "general") return true;
      const aStaffId = String(a.staffId || "");
      const aStaffName = String(a.staffName || "").toLowerCase();
      return aStaffId === sId || (sName && aStaffName.includes(sName));
    });
  };

  // Header Title
  const headerDateTitle = useMemo(() => {
    if (scope === "day") {
      return currentDate.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    if (scope === "week") {
      const start = weekDays[0];
      const end = weekDays[6];
      return `${start.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
    }
    return currentDate.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  }, [scope, currentDate, weekDays]);

  // Date formatted for date picker input (YYYY-MM-DD)
  const inputDateValue = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, "0");
    const d = String(currentDate.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [currentDate]);

  // Upcoming appointments (Next 7 days)
  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return appointmentsWithDates
      .filter((a) => a.parsedDate && a.parsedDate >= now && a.normStatus !== "completed" && a.normStatus !== "cancelled")
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime())
      .slice(0, 6);
  }, [appointmentsWithDates]);

  return (
    <div className="space-y-3 font-sans">
      {/* Calendar Navigation & Scope Controls */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Previous, Today, Next + Date Picker */}
        <div className="flex items-center gap-1.5 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              className="h-8 w-8 p-0 rounded-lg border-slate-200 hover:bg-slate-50 cursor-pointer"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="h-8 px-2.5 rounded-lg border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              className="h-8 w-8 p-0 rounded-lg border-slate-200 hover:bg-slate-50 cursor-pointer"
              title="Next"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </Button>
          </div>

          {/* Jump to Any Date Input */}
          <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200/80">
            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <input
              type="date"
              value={inputDateValue}
              onChange={(e) => {
                if (e.target.value) {
                  const [y, m, d] = e.target.value.split("-").map(Number);
                  const newD = new Date(y, m - 1, d);
                  newD.setHours(0, 0, 0, 0);
                  setCurrentDate(newD);
                  setSelectedMonthDay(newD);
                }
              }}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              title="Jump to any date"
            />
          </div>
        </div>

        {/* Center: Formatted Date Title */}
        <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight text-center">
          {headerDateTitle}
        </h2>

        {/* Right: Day / Week / Month Scope Switcher + Book Button */}
        <div className="flex items-center gap-1.5 w-full md:w-auto justify-end">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {["day", "week", "month"].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setScope(mode)}
                className={clsx(
                  "px-2.5 py-1 text-xs font-bold rounded-md capitalize transition-all cursor-pointer",
                  scope === mode
                    ? "bg-white text-blue-600 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            onClick={() => onBookSlot(currentDate)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs h-8 px-2.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Book</span>
          </Button>
        </div>
      </div>

      {/* 1. DAY VIEW: Stylist Columns & Hourly Timeline */}
      {scope === "day" && (
        <div className="space-y-3">
          {/* Stylist Roster & Busy Status Summary */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Stylist Availability & Queue Today</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                {activeDayAppointments.length} bookings scheduled
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {displayStylists.map((st) => {
                const sId = String(st.staffId || st.id || "");
                const sName = (st.name || st.fullName || "").toLowerCase();
                const stylAppts = activeDayAppointments.filter((a) => {
                  if (!sId || sId === "general") return true;
                  return (
                    String(a.staffId || "") === sId ||
                    String(a.staffName || "").toLowerCase().includes(sName)
                  );
                });
                const isCurrentlyServing = stylAppts.some((a) => a.normStatus === "in_progress");

                return (
                  <div
                    key={sId || st.name}
                    className={clsx(
                      "p-2 rounded-xl border transition-all flex items-center gap-2",
                      isCurrentlyServing
                        ? "bg-blue-50/70 border-blue-200"
                        : stylAppts.length > 0
                        ? "bg-slate-50 border-slate-200"
                        : "bg-emerald-50/40 border-emerald-100"
                    )}
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {st.name ? st.name.charAt(0).toUpperCase() : "S"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {st.name || "Stylist"}
                      </div>
                      <div className="text-[10px] font-semibold truncate flex items-center gap-1">
                        {isCurrentlyServing ? (
                          <span className="text-blue-600 flex items-center gap-1 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            In Service
                          </span>
                        ) : stylAppts.length > 0 ? (
                          <span className="text-slate-600">
                            {stylAppts.length} {stylAppts.length === 1 ? "booking" : "bookings"}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium">Free Today</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hourly Timeline Matrix */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    <th className="py-2.5 px-3 text-left text-xs font-bold text-slate-600 w-24 shrink-0 border-r border-slate-200">
                      Time Slot
                    </th>
                    {displayStylists.map((st) => (
                      <th
                        key={st.staffId || st.id || st.name}
                        className="py-2.5 px-3 text-left text-xs font-bold text-slate-800 border-r border-slate-200 last:border-r-0 min-w-[200px]"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{st.name || "General"}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {timeSlots.map((hour) => {
                    const formattedHour = `${hour % 12 === 0 ? 12 : hour % 12}:00 ${hour < 12 ? "AM" : "PM"}`;

                    return (
                      <tr key={hour} className="hover:bg-slate-50/40 transition-colors">
                        {/* Time Column */}
                        <td className="py-3 px-3 text-[11px] font-bold text-slate-500 bg-slate-50/50 border-r border-slate-200 align-top">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{formattedHour}</span>
                          </div>
                        </td>

                        {/* Columns for each stylist */}
                        {displayStylists.map((st) => {
                          const appt = getStylistApptAtHour(st, hour);
                          const sId = st.staffId || st.id || "";

                          return (
                            <td
                              key={sId || st.name}
                              className="p-1.5 border-r border-slate-200 last:border-r-0 align-top"
                            >
                              {appt ? (
                                <div
                                  className={clsx(
                                    "p-2 rounded-lg border text-xs shadow-2xs flex flex-col justify-between transition-all",
                                    appt.normStatus === "in_progress"
                                      ? "bg-blue-50 border-blue-200/90 border-l-[3.5px] border-l-blue-600"
                                      : appt.normStatus === "completed"
                                      ? "bg-emerald-50/80 border-emerald-200 border-l-[3.5px] border-l-emerald-600"
                                      : "bg-white border-slate-200 border-l-[3.5px] border-l-indigo-600"
                                  )}
                                >
                                  <div className="flex items-start justify-between gap-1 mb-1">
                                    <div className="font-bold text-slate-900 truncate">
                                      {appt.clientName}
                                    </div>
                                    <StatusPill status={appt.status} compact />
                                  </div>

                                  <div className="text-[11px] text-slate-600 truncate mb-1">
                                    ✂️ {appt.serviceName}
                                  </div>

                                  {appt.phone && (
                                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1.5">
                                      <Phone className="w-2.5 h-2.5" />
                                      <span>{appt.phone}</span>
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                                    <span className="text-[10px] font-extrabold text-slate-700">
                                      {formatCurrency(appt.amount || appt.total)}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      {appt.normStatus !== "completed" && (
                                        <button
                                          type="button"
                                          onClick={() => onStatusUpdate(appt.appointmentId || appt.id, "completed")}
                                          className="p-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors"
                                          title="Mark Completed"
                                        >
                                          <Check className="w-2.5 h-2.5" />
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => onEdit(appt)}
                                        className="p-1 rounded hover:bg-blue-100 text-slate-500 hover:text-blue-700 transition-colors"
                                        title="Edit"
                                      >
                                        <Edit className="w-2.5 h-2.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => onDelete(appt)}
                                        className="p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const slotDate = new Date(currentDate);
                                    slotDate.setHours(hour, 0, 0, 0);
                                    onBookSlot(slotDate, sId !== "general" ? sId : "");
                                  }}
                                  className="w-full h-16 rounded-lg border border-dashed border-slate-200/70 hover:border-blue-400 hover:bg-blue-50/40 flex items-center justify-center text-[10px] font-semibold text-slate-400 hover:text-blue-600 transition-all cursor-pointer group"
                                >
                                  <span className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                                    <Plus className="w-3 h-3" />
                                    <span>Book Slot</span>
                                  </span>
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. WEEK VIEW: 7 Day Columns */}
      {scope === "week" && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {weekDays.map((d) => {
            const isTodayDate = isSameDay(d, new Date());
            const dayAppts = appointmentsWithDates.filter((a) => a.parsedDate && isSameDay(a.parsedDate, d));
            const dayName = d.toLocaleDateString("en-IN", { weekday: "short" });
            const dayNum = d.getDate();
            const monthName = d.toLocaleDateString("en-IN", { month: "short" });

            return (
              <div
                key={d.toISOString()}
                className={clsx(
                  "bg-white rounded-xl border p-2 flex flex-col shadow-2xs min-h-[300px]",
                  isTodayDate ? "border-blue-400 ring-1 ring-blue-200" : "border-slate-200/90"
                )}
              >
                {/* Column Day Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 leading-none">
                      {dayName}
                    </div>
                    <div className="text-sm font-extrabold text-slate-900 leading-none mt-0.5">
                      {dayNum} {monthName}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600">
                      {dayAppts.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => onBookSlot(d)}
                      className="p-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer"
                      title={`Book appointment on ${dayName}`}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Day Appointments List */}
                <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[480px]">
                  {dayAppts.length === 0 ? (
                    <div className="h-28 flex flex-col items-center justify-center text-[10px] text-slate-400 border border-dashed border-slate-100 rounded-lg">
                      <span>No Bookings</span>
                    </div>
                  ) : (
                    dayAppts.map((appt) => (
                      <div
                        key={appt.appointmentId || appt.id}
                        className={clsx(
                          "p-2 rounded-lg border text-xs shadow-2xs space-y-1",
                          appt.normStatus === "in_progress"
                            ? "bg-blue-50/80 border-blue-200 border-l-[3.5px] border-l-blue-600"
                            : appt.normStatus === "completed"
                            ? "bg-emerald-50/70 border-emerald-200 border-l-[3.5px] border-l-emerald-600"
                            : "bg-white border-slate-200 border-l-[3.5px] border-l-indigo-600"
                        )}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold text-slate-800">
                            {formatTimeLabel(appt.parsedDate, appt.time)}
                          </span>
                          <StatusPill status={appt.status} compact />
                        </div>
                        <div className="font-bold text-slate-900 truncate">
                          {appt.clientName}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          ✂️ {appt.serviceName}
                        </div>
                        {appt.staffName && (
                          <div className="text-[9px] font-semibold text-indigo-700 bg-indigo-50/70 px-1.5 py-0.2 rounded w-fit truncate">
                            👤 {appt.staffName}
                          </div>
                        )}
                        <div className="flex items-center justify-end gap-1 pt-1 border-t border-slate-100">
                          {appt.normStatus !== "completed" && (
                            <button
                              type="button"
                              onClick={() => onStatusUpdate(appt.appointmentId || appt.id, "completed")}
                              className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              title="Finish"
                            >
                              <Check className="w-2.5 h-2.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onEdit(appt)}
                            className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="w-2.5 h-2.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(appt)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. MONTH VIEW: Calendar Matrix */}
      {scope === "month" && (
        <div className="space-y-3">
          <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 mb-2 pb-1 border-b border-slate-100">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Matrix of days */}
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map(({ date, isCurrentMonth }) => {
                const isTodayDate = isSameDay(date, new Date());
                const isSelected = selectedMonthDay ? isSameDay(date, selectedMonthDay) : isSameDay(date, currentDate);
                const dayAppts = appointmentsWithDates.filter((a) => a.parsedDate && isSameDay(a.parsedDate, date));

                return (
                  <div
                    key={date.toISOString()}
                    onClick={() => setSelectedMonthDay(date)}
                    className={clsx(
                      "min-h-[72px] sm:min-h-[85px] p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between",
                      !isCurrentMonth && "opacity-40 bg-slate-50 border-slate-100",
                      isCurrentMonth && (isSelected ? "bg-blue-50/70 border-blue-400 ring-1 ring-blue-300 shadow-2xs" : "bg-white border-slate-200/80 hover:border-slate-300"),
                      isTodayDate && !isSelected && "border-blue-400 bg-blue-50/20"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={clsx(
                          "text-xs font-extrabold w-5 h-5 flex items-center justify-center rounded-full",
                          isTodayDate ? "bg-blue-600 text-white" : "text-slate-800"
                        )}
                      >
                        {date.getDate()}
                      </span>
                      {dayAppts.length > 0 && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700">
                          {dayAppts.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-0.5 mt-1 overflow-hidden">
                      {dayAppts.slice(0, 2).map((a) => (
                        <div
                          key={a.appointmentId || a.id}
                          className="text-[9px] truncate px-1 py-0.2 rounded bg-slate-100 text-slate-700 font-semibold"
                        >
                          {a.clientName}
                        </div>
                      ))}
                      {dayAppts.length > 2 && (
                        <span className="text-[9px] text-blue-600 font-bold block">
                          +{dayAppts.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Detail Panel */}
          {selectedMonthDay && (
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Schedule for {selectedMonthDay.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                  </h3>
                  <span className="text-xs font-semibold text-slate-500">
                    ({activeDayAppointments.length} bookings)
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={() => onBookSlot(selectedMonthDay)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs h-7.5 px-3"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Book for this day
                </Button>
              </div>

              {activeDayAppointments.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  No appointments booked on this date. Click "+ Book for this day" to schedule.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {activeDayAppointments.map((appt) => (
                    <div
                      key={appt.appointmentId || appt.id}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-bold text-slate-900">{appt.clientName}</span>
                          <StatusPill status={appt.status} compact />
                        </div>
                        <div className="text-[11px] text-slate-600 truncate">✂️ {appt.serviceName}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          ⏰ {formatTimeLabel(appt.parsedDate, appt.time)} • 👤 {appt.staffName || "Unassigned"}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-200/60">
                        <span className="text-xs font-black text-slate-800">
                          {formatCurrency(appt.amount || appt.total)}
                        </span>
                        <div className="flex items-center gap-1">
                          {appt.normStatus !== "completed" && (
                            <button
                              type="button"
                              onClick={() => onStatusUpdate(appt.appointmentId || appt.id, "completed")}
                              className="p-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              title="Finish"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onEdit(appt)}
                            className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(appt)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Upcoming Appointments Preview Bar */}
      {upcomingAppointments.length > 0 && (
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Upcoming Appointments (Next 7 Days)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">
              {upcomingAppointments.length} upcoming
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {upcomingAppointments.map((appt) => (
              <div
                key={appt.appointmentId || appt.id}
                className="p-2 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-white hover:shadow-2xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-blue-700 mb-0.5">
                    <span>{appt.parsedDate ? appt.parsedDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Upcoming"}</span>
                    <span>{formatTimeLabel(appt.parsedDate, appt.time)}</span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 truncate">{appt.clientName}</div>
                  <div className="text-[10px] text-slate-500 truncate">{appt.serviceName}</div>
                </div>
                <div className="text-[9px] text-indigo-700 font-semibold mt-1 truncate">
                  👤 {appt.staffName || "Stylist"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ==========================================================================
   MAIN APPOINTMENTS PAGE COMPONENT
   ========================================================================== */
export default function AppointmentsPage() {
  const {
    appointments = [],
    fetchAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    barbers = [],
    services = [],
    clients = [],
    loader,
  } = useContext(Context);

  const navigate = useNavigate();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all_active"); // "all_active", "all", "today", "scheduled", "confirmed", "in_progress", "completed", "cancelled"
  const [viewMode, setViewMode] = useState("auto"); // 'auto' | 'table' | 'grid'
  const [activeMainTab, setActiveMainTab] = useState("list"); // 'list' | 'calendar'

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingInitialDate, setBookingInitialDate] = useState(null);
  const [bookingInitialStaffId, setBookingInitialStaffId] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    if (fetchAppointments) {
      fetchAppointments();
    }
  }, []);

  const handleDeleteAppointment = async () => {
    if (!appointmentToDelete) return;
    const targetId =
      appointmentToDelete.appointmentId ||
      appointmentToDelete.id ||
      appointmentToDelete.Id;
    try {
      if (deleteAppointment) {
        await deleteAppointment(targetId);
      }
      setShowDeleteConfirm(false);
      setAppointmentToDelete(null);
      if (fetchAppointments) await fetchAppointments();
    } catch (err) {
      console.error("Delete appointment error:", err);
    }
  };

  const handleOpenBookingSlot = (dateObj, staffId = "") => {
    setBookingInitialDate(dateObj);
    setBookingInitialStaffId(staffId);
    setShowBookingModal(true);
  };

  // Quick Status Transition
  const handleStatusUpdate = async (appointmentId, newStatus) => {
    if (actionLoadingId) return;
    try {
      setActionLoadingId(appointmentId);
      await updateAppointment(appointmentId, { status: newStatus });
      toast({
        variant: "default",
        title: "Status Updated",
        description: `Marked as ${newStatus.replace("_", " ")}.`,
      });
      if (fetchAppointments) await fetchAppointments();
    } catch (err) {
      console.error("Status update error:", err);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update appointment status.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Create Appointment
  const handleCreateAppointment = async (payload) => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      await createAppointment(payload);
      if (fetchAppointments) await fetchAppointments();
      toast({
        variant: "default",
        title: "Success",
        description: "Appointment booked successfully.",
      });
      setShowBookingModal(false);
    } catch (err) {
      console.error("Create appointment error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Appointment
  const handleUpdateAppointment = async (payload) => {
    if (isSubmitting || !editingAppointment) return;
    try {
      setIsSubmitting(true);
      const targetId =
        editingAppointment.appointmentId ||
        editingAppointment.id ||
        editingAppointment.Id;
      await updateAppointment(targetId, payload);
      if (fetchAppointments) await fetchAppointments();
      toast({
        variant: "default",
        title: "Updated",
        description: "Appointment details updated successfully.",
      });
      setShowEditModal(false);
      setEditingAppointment(null);
    } catch (err) {
      console.error("Update appointment error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Derived Counts & Filtered Appointments
  const { filteredAppointments, counts } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let todayCount = 0;
    let scheduledCount = 0;
    let confirmedCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;

    appointments.forEach((appt) => {
      const norm = normalizeStatus(appt.status);
      const dateObj = parseAppointmentDateTime(
        appt.dateTime,
        appt.date || appt.appointment_date,
        appt.time || appt.appointment_time
      );

      if (dateObj) {
        const d = new Date(dateObj);
        d.setHours(0, 0, 0, 0);
        if (d.getTime() === today.getTime()) {
          todayCount++;
        }
      }

      if (norm === "scheduled") scheduledCount++;
      else if (norm === "confirmed") confirmedCount++;
      else if (norm === "in_progress") inProgressCount++;
      else if (norm === "completed") completedCount++;
      else if (norm === "cancelled") cancelledCount++;
    });

    const q = searchTerm.toLowerCase().trim();

    const filtered = appointments.filter((appt) => {
      const norm = normalizeStatus(appt.status);

      // Status filter
      if (statusFilter === "all_active") {
        if (norm === "completed" || norm === "cancelled") return false;
      } else if (statusFilter === "today") {
        const dateObj = parseAppointmentDateTime(
          appt.dateTime,
          appt.date || appt.appointment_date,
          appt.time || appt.appointment_time
        );
        if (!dateObj) return false;
        const d = new Date(dateObj);
        d.setHours(0, 0, 0, 0);
        if (d.getTime() !== today.getTime()) return false;
      } else if (statusFilter !== "all" && norm !== statusFilter) {
        return false;
      }

      // Search term
      if (q) {
        const clientName = (
          appt.client?.clientName ||
          appt.clientName ||
          appt.client_name ||
          appt.userName ||
          appt.name ||
          ""
        ).toLowerCase();
        const phone = (
          appt.client?.phoneNumber ||
          appt.clientPhone ||
          appt.phoneNumber ||
          ""
        ).toLowerCase();
        const staff = (
          appt.staff ||
          appt.barberName ||
          appt.barber?.name ||
          ""
        ).toLowerCase();
        const service = String(
          Array.isArray(appt.service)
            ? appt.service.join(" ")
            : appt.service || ""
        ).toLowerCase();

        if (
          !clientName.includes(q) &&
          !phone.includes(q) &&
          !staff.includes(q) &&
          !service.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });

    // Chronological order: In Progress first, then by date
    filtered.sort((a, b) => {
      const aNorm = normalizeStatus(a.status);
      const bNorm = normalizeStatus(b.status);
      if (aNorm === "in_progress" && bNorm !== "in_progress") return -1;
      if (bNorm === "in_progress" && aNorm !== "in_progress") return 1;

      const dateA = parseAppointmentDateTime(
        a.dateTime,
        a.date || a.appointment_date,
        a.time || a.appointment_time
      );
      const dateB = parseAppointmentDateTime(
        b.dateTime,
        b.date || b.appointment_date,
        b.time || b.appointment_time
      );

      if (dateA && dateB) return dateA.getTime() - dateB.getTime();
      return 0;
    });

    return {
      filteredAppointments: filtered,
      counts: {
        total: appointments.length,
        today: todayCount,
        active: scheduledCount + confirmedCount + inProgressCount,
        scheduled: scheduledCount,
        confirmed: confirmedCount,
        inProgress: inProgressCount,
        completed: completedCount,
        cancelled: cancelledCount,
      },
    };
  }, [appointments, statusFilter, searchTerm]);

  return (
    <div className="p-3 sm:p-4 lg:p-5 space-y-3 font-sans bg-[#f8fafc] min-h-full text-slate-800">
      {/* 1. Compact Header Bar (Identical to StaffsPage) */}
      <div className="bg-white px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
            Appointments & Queue
          </h1>
          <span className="text-[11px] font-semibold text-slate-400 hidden md:inline">
            ({appointments.length} rostered • {counts.today} today • {counts.inProgress} in service)
          </span>
        </div>

        {/* Action Buttons & View Mode Tabs */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveMainTab("list")}
              className={clsx(
                "px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer",
                activeMainTab === "list"
                  ? "bg-white text-blue-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Queue & List</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMainTab("calendar")}
              className={clsx(
                "px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer",
                activeMainTab === "calendar"
                  ? "bg-white text-blue-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
          </div>

          <Button
            size="sm"
            onClick={() => {
              setBookingInitialDate(null);
              setBookingInitialStaffId(null);
              setShowBookingModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs text-xs h-8 px-3 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Book Appointment</span>
          </Button>
        </div>
      </div>

      {activeMainTab === "calendar" ? (
        <CalendarView
          appointments={appointments}
          barbers={barbers}
          services={services}
          onBookSlot={handleOpenBookingSlot}
          onEdit={(appt) => {
            setEditingAppointment(appt);
            setShowEditModal(true);
          }}
          onDelete={(appt) => {
            setAppointmentToDelete(appt);
            setShowDeleteConfirm(true);
          }}
          onStatusUpdate={handleStatusUpdate}
          navigate={navigate}
          formatCurrency={formatCurrency}
        />
      ) : (
        <>
          {/* 2. Color-Coded Mini KPI Cards: Symmetrical 4-Card Strip (Identical to StaffsPage) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* KPI 1: Active Queue */}
        <div
          onClick={() => setStatusFilter("all_active")}
          className={clsx(
            "bg-white rounded-xl p-2.5 border shadow-2xs flex items-center gap-2.5 cursor-pointer transition-all",
            statusFilter === "all_active"
              ? "border-indigo-400 ring-1 ring-indigo-200"
              : "border-slate-200/90 hover:border-slate-300"
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0 border border-indigo-100">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-base font-extrabold text-slate-900 leading-none">
              {counts.active}
            </div>
            <div className="text-[10px] font-semibold text-slate-500 mt-0.5 truncate flex items-center gap-1">
              <span>Active Queue</span>
              <span className="text-[9px] text-slate-400">({counts.total} tot)</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Today's Schedule */}
        <div
          onClick={() => setStatusFilter("today")}
          className={clsx(
            "bg-white rounded-xl p-2.5 border shadow-2xs flex items-center gap-2.5 cursor-pointer transition-all",
            statusFilter === "today"
              ? "border-teal-400 ring-1 ring-teal-200"
              : "border-teal-200 shadow-2xs"
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold shrink-0 border border-teal-200">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-base font-extrabold text-teal-700 leading-none">
              {counts.today}
            </div>
            <div className="text-[10px] font-semibold text-teal-600 mt-0.5 truncate">
              Today's Schedule
            </div>
          </div>
        </div>

        {/* KPI 3: In Service Live */}
        <div
          onClick={() => setStatusFilter("in_progress")}
          className={clsx(
            "bg-white rounded-xl p-2.5 border shadow-2xs flex items-center gap-2.5 cursor-pointer transition-all",
            statusFilter === "in_progress"
              ? "border-blue-400 ring-1 ring-blue-200"
              : "border-blue-200 shadow-2xs"
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 border border-blue-200">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
            </span>
          </div>
          <div className="min-w-0">
            <div className="text-base font-extrabold text-blue-700 leading-none">
              {counts.inProgress}
            </div>
            <div className="text-[10px] font-semibold text-blue-600 mt-0.5 truncate">
              In Service Now
            </div>
          </div>
        </div>

        {/* KPI 4: Pending / Scheduled */}
        <div
          onClick={() => setStatusFilter("scheduled")}
          className={clsx(
            "bg-white rounded-xl p-2.5 border shadow-2xs flex items-center gap-2.5 cursor-pointer transition-all",
            statusFilter === "scheduled"
              ? "border-amber-400 ring-1 ring-amber-200"
              : "border-amber-200 shadow-2xs"
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0 border border-amber-200">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-base font-extrabold text-amber-800 leading-none">
              {counts.scheduled}
            </div>
            <div className="text-[10px] font-semibold text-amber-700 mt-0.5 truncate">
              Scheduled
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search Bar, Filter Chips & View Switcher Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
            <Input
              placeholder="Search client, mobile, stylist, or service..."
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

          {/* View Mode Toggle: Auto / Grid / Table (Identical to StaffsPage) */}
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

        {/* Filter Chips (Horizontal Scrolling on Small Screens) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {[
            { id: "all_active", label: "Active Queue", count: counts.active },
            { id: "today", label: "Today", count: counts.today },
            { id: "scheduled", label: "Scheduled", count: counts.scheduled },
            { id: "in_progress", label: "In Service", count: counts.inProgress },
            { id: "completed", label: "Completed", count: counts.completed },
            { id: "all", label: "All Bookings", count: counts.total },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={clsx(
                "text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1",
                statusFilter === tab.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80"
              )}
            >
              <span>{tab.label}</span>
              <span
                className={clsx(
                  "text-[9px] px-1 rounded-md font-bold",
                  statusFilter === tab.id
                    ? "bg-blue-700 text-white"
                    : "bg-slate-100 text-slate-500"
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Appointments Content (Desktop Table / Mobile Cards) */}
      {loader && appointments.length === 0 ? (
        <ScissorsLoader text="Loading appointments..." />
      ) : appointments.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center my-2 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2.5 border border-blue-100">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            No appointments scheduled yet
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xs mx-auto">
            Book appointments to organize stylist chairs and client schedules.
          </p>
          <Button
            onClick={() => setShowBookingModal(true)}
            className="mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs h-8 px-3.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Book First Appointment</span>
          </Button>
        </div>
      ) : filteredAppointments.length === 0 ? (
        /* Search/Filter Not Found */
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 text-center my-2 shadow-2xs">
          <Search className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
          <h3 className="text-xs font-bold text-slate-800">
            No appointments found matching your filters
          </h3>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all_active");
            }}
            className="mt-2 text-[11px] rounded-lg border-slate-200 h-7 px-2.5 cursor-pointer"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW: Clean, color-coded rows with status left border */}
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
                          Client Info
                        </TableHead>
                        <TableHead className="text-slate-600 font-bold text-[11px] uppercase tracking-wider py-2.5 px-3">
                          Date & Time
                        </TableHead>
                        <TableHead className="text-slate-600 font-bold text-[11px] uppercase tracking-wider py-2.5 px-3">
                          Service Treatments
                        </TableHead>
                        <TableHead className="text-slate-600 font-bold text-[11px] uppercase tracking-wider py-2.5 px-3">
                          Stylist
                        </TableHead>
                        <TableHead className="text-slate-600 font-bold text-[11px] uppercase tracking-wider py-2.5 px-3">
                          Duration & Total
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
                      {filteredAppointments.map((appt) => {
                        const apptId =
                          appt.appointmentId || appt.id || appt.Id;
                        const normStatus = normalizeStatus(appt.status);
                        const statusConfig = getStatusConfig(normStatus);

                        const clientName =
                          appt.client?.clientName ||
                          appt.clientName ||
                          appt.client_name ||
                          appt.userName ||
                          appt.name ||
                          "Walk-in Client";

                        const clientPhone =
                          appt.client?.phoneNumber ||
                          appt.clientPhone ||
                          appt.phoneNumber ||
                          "";

                        const staffName =
                          appt.staff ||
                          appt.barberName ||
                          appt.barber?.name ||
                          appt.staff_name ||
                          "Unassigned";

                        const serviceList = Array.isArray(appt.service)
                          ? appt.service.map((s) =>
                              typeof s === "object" ? s.serviceName || s.name : s
                            )
                          : typeof appt.service === "string" && appt.service
                          ? appt.service.split(",").map((s) => s.trim())
                          : [];

                        const duration =
                          appt.duration || appt.duration_minutes || 30;
                        const totalAmount =
                          appt.total || appt.totalAmount || 0;

                        const dateObj = parseAppointmentDateTime(
                          appt.dateTime,
                          appt.date || appt.appointment_date,
                          appt.time || appt.appointment_time
                        );

                        return (
                          <TableRow
                            key={apptId}
                            className="hover:bg-slate-50/80 border-b border-slate-100 transition-colors"
                          >
                            {/* Member Avatar & Client Details with status border-l-4 */}
                            <TableCell
                              className={clsx(
                                "py-2.5 px-3 border-l-[4px] relative",
                                statusConfig.borderLeft
                              )}
                            >
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={clsx(
                                    "h-8 w-8 rounded-full text-white font-bold text-[11px] flex items-center justify-center shrink-0 ring-2 bg-gradient-to-tr from-blue-600 to-indigo-600",
                                    statusConfig.avatarRing
                                  )}
                                >
                                  {clientName.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-xs text-slate-900 truncate">
                                    {clientName}
                                  </div>
                                  {clientPhone && (
                                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                      <Phone className="h-2.5 w-2.5 text-slate-400" />
                                      <span>{clientPhone}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>

                            {/* Date & Time */}
                            <TableCell className="py-2.5 px-3">
                              <div className="text-xs font-bold text-slate-900">
                                {formatDateLabel(dateObj)}
                              </div>
                              <div className="text-[10px] text-slate-500 font-medium">
                                {formatTimeLabel(dateObj, appt.time)}
                              </div>
                            </TableCell>

                            {/* Services with getServiceBadgeStyle chips */}
                            <TableCell className="py-2.5 px-3">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {serviceList.length > 0 ? (
                                  serviceList.map((svc, sIdx) => (
                                    <span
                                      key={sIdx}
                                      className={clsx(
                                        "text-[10px] font-bold py-0.5 px-1.5 rounded border",
                                        getServiceBadgeStyle(svc)
                                      )}
                                    >
                                      {svc}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-slate-400">
                                    General Service
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            {/* Stylist Member */}
                            <TableCell className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                                <User className="h-3 w-3 text-slate-400" />
                                <span>{staffName}</span>
                              </div>
                            </TableCell>

                            {/* Duration & Amount */}
                            <TableCell className="py-2.5 px-3">
                              <div className="font-black text-xs text-slate-900">
                                {formatCurrency(totalAmount)}
                              </div>
                              <div className="text-[10px] text-slate-500 font-medium">
                                {duration} mins
                              </div>
                            </TableCell>

                            {/* Status Pill */}
                            <TableCell className="py-2.5 px-3">
                              <StatusPill status={normStatus} />
                            </TableCell>

                            {/* Action Buttons */}
                            <TableCell className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {normStatus !== "completed" && normStatus !== "cancelled" && (
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      navigate("/dashboard/billing", {
                                        state: { selectedAppointment: appt },
                                      })
                                    }
                                    className="h-7 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold cursor-pointer shadow-2xs flex items-center gap-1"
                                    title="Load appointment into POS Billing"
                                  >
                                    <CreditCard className="w-3 h-3" />
                                    <span>Load to Bill</span>
                                  </Button>
                                )}

                                {normStatus === "completed" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate("/dashboard/order-history")}
                                    className="h-7 px-2 rounded-lg border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold cursor-pointer"
                                    title="View settled invoice in Order History"
                                  >
                                    Invoice
                                  </Button>
                                )}

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                                  onClick={() => {
                                    setEditingAppointment(appt);
                                    setShowEditModal(true);
                                  }}
                                  title="Edit appointment"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                  onClick={() => {
                                    setAppointmentToDelete(appt);
                                    setShowDeleteConfirm(true);
                                  }}
                                  title="Delete appointment"
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

          {/* MOBILE & TABLET CARD VIEW (Matching StaffsPage exactly) */}
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
              {filteredAppointments.map((appt) => {
                const apptId =
                  appt.appointmentId || appt.id || appt.Id;
                const normStatus = normalizeStatus(appt.status);
                const statusConfig = getStatusConfig(normStatus);

                const clientName =
                  appt.client?.clientName ||
                  appt.clientName ||
                  appt.client_name ||
                  appt.userName ||
                  appt.name ||
                  "Walk-in Client";

                const clientPhone =
                  appt.client?.phoneNumber ||
                  appt.clientPhone ||
                  appt.phoneNumber ||
                  "";

                const staffName =
                  appt.staff ||
                  appt.barberName ||
                  appt.barber?.name ||
                  appt.staff_name ||
                  "Unassigned";

                const serviceList = Array.isArray(appt.service)
                  ? appt.service.map((s) =>
                      typeof s === "object" ? s.serviceName || s.name : s
                    )
                  : typeof appt.service === "string" && appt.service
                  ? appt.service.split(",").map((s) => s.trim())
                  : [];

                const duration =
                  appt.duration || appt.duration_minutes || 30;
                const totalAmount =
                  appt.total || appt.totalAmount || 0;

                const dateObj = parseAppointmentDateTime(
                  appt.dateTime,
                  appt.date || appt.appointment_date,
                  appt.time || appt.appointment_time
                );

                return (
                  <div
                    key={apptId}
                    className={clsx(
                      "bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all overflow-hidden p-2.5 sm:p-3 flex flex-col gap-2 border-l-4",
                      statusConfig.borderLeft
                    )}
                  >
                    {/* Top Row: Avatar + Name + Status Pill */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={clsx(
                            "h-8 w-8 rounded-full text-white font-bold text-[11px] flex items-center justify-center shrink-0 ring-2 bg-gradient-to-tr from-blue-600 to-indigo-600",
                            statusConfig.avatarRing
                          )}
                        >
                          {clientName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-slate-900 truncate">
                            {clientName}
                          </h4>
                          {clientPhone ? (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                              <Phone className="h-2.5 w-2.5 text-slate-400" />
                              <span>{clientPhone}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              No phone
                            </span>
                          )}
                        </div>
                      </div>

                      <StatusPill status={normStatus} compact />
                    </div>

                    {/* Middle Details Strip */}
                    <div className="bg-slate-50/80 rounded-lg p-2 space-y-1.5 border border-slate-100 text-xs">
                      {/* Date & Time */}
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1 text-slate-700 font-semibold">
                          <Calendar className="w-3 h-3 text-blue-500" />
                          <span>{formatDateLabel(dateObj)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-800 font-bold">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>{formatTimeLabel(dateObj, appt.time)}</span>
                        </div>
                      </div>

                      {/* Services Chips */}
                      <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-200/60">
                        {serviceList.length > 0 ? (
                          serviceList.map((svc, sIdx) => (
                            <span
                              key={sIdx}
                              className={clsx(
                                "text-[10px] font-bold py-0.5 px-1.5 rounded border",
                                getServiceBadgeStyle(svc)
                              )}
                            >
                              {svc}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            General Service
                          </span>
                        )}
                      </div>

                      {/* Stylist & Total Amount */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                        <div className="flex items-center gap-1">
                          <User className="w-2.5 h-2.5 text-slate-400" />
                          <span>
                            Stylist: <strong className="text-slate-700 font-semibold">{staffName}</strong>
                          </span>
                        </div>
                        <span className="font-extrabold text-xs text-slate-900">
                          {formatCurrency(totalAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 gap-1.5">
                      <div className="flex items-center gap-1">
                        {normStatus !== "completed" && normStatus !== "cancelled" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              navigate("/dashboard/billing", {
                                state: { selectedAppointment: appt },
                              })
                            }
                            className="h-7 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold cursor-pointer shadow-2xs flex items-center gap-1"
                            title="Load appointment into POS Billing"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Load to Bill</span>
                          </Button>
                        )}
                        {normStatus === "completed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate("/dashboard/order-history")}
                            className="h-7 px-2 rounded-lg border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold cursor-pointer"
                            title="View settled invoice in Order History"
                          >
                            Invoice
                          </Button>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingAppointment(appt);
                            setShowEditModal(true);
                          }}
                          className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                          title="Edit appointment"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setAppointmentToDelete(appt);
                            setShowDeleteConfirm(true);
                          }}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Delete appointment"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  )}

      {/* Delete Confirmation Modal */}
      <Dialog
        open={showDeleteConfirm}
        onOpenChange={(open) => {
          if (!open) {
            setShowDeleteConfirm(false);
            setAppointmentToDelete(null);
          }
        }}
      >
        <DialogContent className="w-[90vw] sm:w-[420px] p-5 rounded-2xl border border-slate-200">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Delete Appointment
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to permanently delete this appointment?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {appointmentToDelete && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 my-2 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Client:</span>
                <span className="font-bold text-slate-900">
                  {appointmentToDelete.client?.clientName || appointmentToDelete.clientName || "Client"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-medium text-slate-700 truncate max-w-[200px]">
                  {Array.isArray(appointmentToDelete.service) ? appointmentToDelete.service.join(", ") : appointmentToDelete.service || "General"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Stylist:</span>
                <span className="font-medium text-slate-700">
                  {appointmentToDelete.staff || appointmentToDelete.barberName || "Not assigned"}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowDeleteConfirm(false);
                setAppointmentToDelete(null);
              }}
              className="rounded-lg text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleDeleteAppointment}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
            >
              Delete Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Modal: Add */}
      <AppointmentModal
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false);
          setBookingInitialDate(null);
          setBookingInitialStaffId(null);
        }}
        onSubmit={handleCreateAppointment}
        title="Book New Appointment"
        initialDate={bookingInitialDate}
        initialStaffId={bookingInitialStaffId}
        barbers={barbers}
        services={services}
        clients={clients}
        isLoading={isSubmitting}
      />

      {/* Appointment Modal: Edit */}
      <AppointmentModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingAppointment(null);
        }}
        onSubmit={handleUpdateAppointment}
        title="Edit Appointment"
        appointmentData={editingAppointment}
        barbers={barbers}
        services={services}
        clients={clients}
        isLoading={isSubmitting}
      />
    </div>
  );
}
