import React, { useState, useEffect, useContext, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  Plus,
  Minus,
  Search,
  Calendar,
  Trash2,
  CheckCircle,
  X,
  ShoppingCart,
  Scissors,
  Check,
  Phone,
  Layers,
  ArrowRight,
  User,
  Clock,
  Printer,
  Pencil,
  Lock,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { cn } from "../lib/utils";
import Context from "../Context/Context";
import ScissorsLoader from "../components/Loader";
import { useToast } from "../hooks/use-toast";
import { BillPrintModal, formatCurrency, parseAppointmentDate } from "./BillPrintModal";
import { getStoredGstSettings, getStoredPrinterSettings } from "./SettingsPage";
import { directPrintBill } from "../lib/printerService";
import { FaMoneyBillWave, FaCreditCard, FaQrcode } from "react-icons/fa";
import { format } from "date-fns";

/* ----------------------------------------------------------------------------
 * Safety helpers
 * A single invalid date passed to date-fns `format` throws a RangeError and
 * unmounts the whole React tree = the white page you saw after settling.
 * Every date in this file now goes through these helpers.
 * -------------------------------------------------------------------------- */

const isValidDate = (d) => d instanceof Date && !isNaN(d.getTime());

const safeFormat = (d, fmt, fallback = "—") => {
  try {
    return isValidDate(d) ? format(d, fmt) : fallback;
  } catch {
    return fallback;
  }
};

const tryParseDate = (val) => {
  if (val === null || val === undefined || val === "") return null;
  try {
    if (val instanceof Date) return isValidDate(val) ? val : null;
    if (typeof val === "number") {
      const d = new Date(val < 10000000000 ? val * 1000 : val);
      return isValidDate(d) ? d : null;
    }
    if (typeof val === "string") {
      const num = Number(val);
      if (!isNaN(num) && num > 0) {
        const d = new Date(num < 10000000000 ? num * 1000 : num);
        if (isValidDate(d)) return d;
      }
      const d = new Date(val);
      if (isValidDate(d)) return d;
      const d2 = parseAppointmentDate(val);
      return isValidDate(d2) ? d2 : null;
    }
  } catch {
    return null;
  }
  return null;
};

const parseAppointmentDateTime = (dateTimeVal, dateVal, timeVal, createdAt) => {
  const a = tryParseDate(dateTimeVal);
  if (a) return a;
  if (dateVal) {
    const b = tryParseDate(timeVal ? `${dateVal}T${timeVal}` : dateVal);
    if (b) return b;
  }
  return tryParseDate(createdAt) || new Date();
};

const formatDateLabel = (dateObj) => {
  if (!isValidDate(dateObj)) return "Scheduled";
  const now = new Date();
  const same = (a, b) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (same(dateObj, now)) return "Today";
  if (same(dateObj, tomorrow)) return "Tomorrow";
  return safeFormat(dateObj, "dd MMM");
};

/* ----------------------------------------------------------------------------
 * Error boundary — if anything throws, show a message instead of a white page
 * -------------------------------------------------------------------------- */

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("Billing page crashed:", error, info);
  }
  render() {
    if (this.state.error) {
      if (this.props.inline) return null;
      return (
        <div className="h-full flex items-center justify-center p-6">
          <div className="max-w-sm w-full bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <X className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Something went wrong</h2>
            <p className="text-sm text-slate-500 mt-1">
              Your bill was saved if it was settled. Reload the billing screen to continue.
            </p>
            <Button
              onClick={() => this.setState({ error: null })}
              className="mt-4 w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
            >
              Reload billing
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ----------------------------------------------------------------------------
 * Overlay — plain layer (NOT a Radix Dialog), so nothing is ever stacked
 * modal-inside-modal. Only one overlay is open at a time (see openPicker etc).
 *   variant="sheet": bottom sheet on phones (hidden from md up)
 *   variant="modal": full screen on phones, centered card on tablet/desktop
 * -------------------------------------------------------------------------- */

const Overlay = ({ open, onClose, variant = "modal", children }) => {
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") {
        const tag = document.activeElement?.tagName?.toLowerCase();
        // If an input, textarea, or select is active, dismissing the mobile keyboard fires Escape on Android.
        // In that case, simply blur the input rather than closing the entire modal!
        if (tag === "input" || tag === "select" || tag === "textarea") {
          document.activeElement.blur();
          return;
        }
        onCloseRef.current?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open) return null;

  const handleBackdropClick = (e) => {
    e.stopPropagation();
    const tag = document.activeElement?.tagName?.toLowerCase();
    // If an input, textarea, or select is active, dismissing or interacting with the mobile keyboard fires a synthetic click.
    // In that case, simply blur the input rather than closing the entire checkout modal!
    if (tag === "input" || tag === "select" || tag === "textarea") {
      document.activeElement?.blur();
      return;
    }
    onCloseRef.current?.();
  };

  return (
    <div className={cn("fixed inset-0 z-40", variant === "sheet" && "md:hidden")}>
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px] transition-opacity duration-150"
        onClick={handleBackdropClick}
      />
      {variant === "sheet" ? (
        <div
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          className="absolute inset-x-0 bottom-0 h-[92dvh] max-h-[96dvh] bg-white rounded-t-2xl shadow-2xl flex flex-col overflow-hidden z-10 transition-transform duration-200 ease-out"
        >
          {children}
        </div>
      ) : (
        <div
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          className={cn(
            "absolute inset-0 bg-white flex flex-col overflow-hidden z-10 transition-all duration-150",
            "md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2",
            "md:w-[42rem] md:max-w-[95vw] md:max-h-[88vh] md:rounded-2xl md:shadow-2xl md:border md:border-slate-200"
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
};

/* ----------------------------------------------------------------------------
 * Styling helpers
 * -------------------------------------------------------------------------- */

const getCategoryColor = (cat = "") => {
  const c = cat.toLowerCase();
  if (c.includes("hair")) return "bg-sky-50 text-sky-700 border-sky-200";
  if (c.includes("facial") || c.includes("skin")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (c.includes("beard") || c.includes("shave")) return "bg-amber-50 text-amber-800 border-amber-200";
  if (c.includes("color") || c.includes("dye")) return "bg-purple-50 text-purple-700 border-purple-200";
  if (c.includes("nail") || c.includes("pedi")) return "bg-pink-50 text-pink-700 border-pink-200";
  if (c.includes("massage") || c.includes("spa")) return "bg-teal-50 text-teal-700 border-teal-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
};

const formatDuration = (dur) => {
  if (!dur) return "";
  const s = String(dur).trim();
  if (s.includes(":")) {
    const parts = s.split(":");
    const hours = parseInt(parts[0], 10) || 0;
    const mins = parseInt(parts[1], 10) || 0;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours} hr`;
    return `${mins} min`;
  }
  return `${s} min`;
};

const getServiceBadgeStyle = (service) => {
  const s = String(service || "").toLowerCase();
  if (s.includes("hair") || s.includes("cut") || s.includes("style")) return "bg-sky-50 text-sky-700 border-sky-200/80";
  if (s.includes("color") || s.includes("highlight")) return "bg-purple-50 text-purple-700 border-purple-200/80";
  if (s.includes("facial") || s.includes("skin") || s.includes("spa")) return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
  if (s.includes("nail") || s.includes("pedicure") || s.includes("manicure")) return "bg-pink-50 text-pink-700 border-pink-200/80";
  if (s.includes("beard") || s.includes("shave")) return "bg-amber-50 text-amber-800 border-amber-200/80";
  return "bg-slate-100 text-slate-700 border-slate-200/80";
};

const normalizeStatus = (raw) => {
  if (!raw) return "scheduled";
  const s = String(raw).toLowerCase().trim().replace(/[-\s]/g, "_");
  if (s.includes("progress") || s.includes("service") || s.includes("chair")) return "in_progress";
  if (s.includes("confirm")) return "scheduled";
  if (s.includes("complete") || s.includes("done") || s.includes("settled") || s.includes("paid")) return "completed";
  if (s.includes("cancel")) return "cancelled";
  if (s.includes("sched") || s.includes("pend")) return "scheduled";
  return s;
};

const STATUS_CONFIG = {
  scheduled: {
    label: "Scheduled",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200/90",
    dotClass: "bg-amber-500",
    ping: false,
    borderLeft: "border-l-amber-500",
    avatarRing: "ring-amber-300/40",
  },
  in_progress: {
    label: "In Service",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200/90",
    dotClass: "bg-blue-500",
    ping: true,
    borderLeft: "border-l-blue-500",
    avatarRing: "ring-blue-400/40",
  },
  completed: {
    label: "Completed",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/90",
    dotClass: "bg-emerald-500",
    ping: false,
    borderLeft: "border-l-emerald-500",
    avatarRing: "ring-emerald-300/40",
  },
  cancelled: {
    label: "Cancelled",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200/90",
    dotClass: "bg-rose-500",
    ping: false,
    borderLeft: "border-l-rose-400",
    avatarRing: "ring-rose-300/40",
  },
};

const getStatusConfig = (status = "") =>
  STATUS_CONFIG[normalizeStatus(status)] || STATUS_CONFIG.scheduled;

const StatusPill = ({ status }) => {
  const config = getStatusConfig(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-bold rounded-full border shrink-0 text-[10px] px-2 py-0.5",
        config.badgeClass
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {config.ping && (
          <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", config.dotClass)} />
        )}
        <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", config.dotClass)} />
      </span>
      <span>{config.label}</span>
    </span>
  );
};

const PAYMENT_MODES = [
  { id: "cash", label: "Cash", icon: FaMoneyBillWave, activeCls: "bg-emerald-600 text-white border-emerald-600" },
  { id: "upi", label: "UPI", icon: FaQrcode, activeCls: "bg-blue-600 text-white border-blue-600" },
  { id: "card", label: "Card", icon: FaCreditCard, activeCls: "bg-indigo-600 text-white border-indigo-600" },
];

/* ----------------------------------------------------------------------------
 * Page
 * -------------------------------------------------------------------------- */

const BillingPage = () => {
  const {
    appointments,
    clients,
    services,
    products,
    barbers,
    institutionData,
    fetchInstitutionData,
    createClient,
    createAppointment,
    updateAppointmentBilling,
    updateAppointment,
    fetchAppointments,
    fetchClients,
    updateProduct,
    fetchProducts,
    institutionId,
  } = useContext(Context);

  const { toast } = useToast();
  const location = useLocation();

  // Overlays (only ONE is ever open at a time)
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showAppointmentPicker, setShowAppointmentPicker] = useState(false);
  const [showBillPrint, setShowBillPrint] = useState(false);

  // Catalogue
  const [showProducts, setShowProducts] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [catalogSearch, setCatalogSearch] = useState("");

  // Cart + client
  const [cart, setCart] = useState([]);
  const [client, setClient] = useState({ clientName: "", phoneNumber: "" });
  const [selectedExistingClient, setSelectedExistingClient] = useState(null);
  const [clientSuggestions, setClientSuggestions] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState("");

  // Ensure fresh clients list
  useEffect(() => {
    if (fetchClients && (!clients || clients.length === 0)) {
      fetchClients();
    }
  }, [fetchClients, clients]);

  // Combined client directory (registered clients + clients from appointments)
  const allKnownClients = useMemo(() => {
    const map = new Map();

    (clients || []).forEach((c) => {
      const name = (c.userName || c.clientName || c.name || "").trim();
      const phone = (c.phoneNumber || c.phone || c.PhoneNumber || "").trim();
      const id = c.clientId || c.cognitoId || c.id || name;
      if (name) {
        const key = phone ? `${name.toLowerCase()}___${phone}` : name.toLowerCase();
        map.set(key, {
          id,
          clientName: name,
          phoneNumber: phone,
          email: c.emailId || c.email || "",
          gender: c.gender || "",
          isExisting: true,
        });
      }
    });

    (appointments || []).forEach((apt) => {
      const name = (
        apt.client?.clientName ||
        apt.clientName ||
        apt.ClientName ||
        apt.client_name ||
        ""
      ).trim();
      const phone = (
        apt.client?.phoneNumber ||
        apt.phoneNumber ||
        apt.PhoneNumber ||
        apt.phone_number ||
        ""
      ).trim();
      if (name && name.toLowerCase() !== "walk-in client") {
        const key = phone ? `${name.toLowerCase()}___${phone}` : name.toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            id: apt.clientId || `apt_${name}`,
            clientName: name,
            phoneNumber: phone,
            email: apt.email || apt.emailId || "",
            gender: "",
            isExisting: true,
          });
        }
      }
    });

    return Array.from(map.values());
  }, [clients, appointments]);

  // Filtered client suggestions when typing client name or phone
  const clientSuggestionsList = useMemo(() => {
    const q = (client.clientName || "").trim().toLowerCase();
    if (!q || q.length < 1) return [];
    return allKnownClients
      .filter((c) => {
        const nameMatches = c.clientName.toLowerCase().includes(q);
        const phoneMatches = c.phoneNumber && c.phoneNumber.includes(q);
        return nameMatches || phoneMatches;
      })
      .slice(0, 6);
  }, [allKnownClients, client.clientName]);

  const handleSelectExistingClient = (c) => {
    setClient({
      clientName: c.clientName,
      phoneNumber: c.phoneNumber || "",
    });
    setSelectedExistingClient(c);
    setClientSuggestions(false);
  };

  const handleClearClient = () => {
    setClient({ clientName: "", phoneNumber: "" });
    setSelectedExistingClient(null);
    setClientSuggestions(false);
  };

  // GST from Database (institutionData)
  const gstConfig = useMemo(() => {
    return getStoredGstSettings(institutionData);
  }, [institutionData]);

  const initialGst = useMemo(() => {
    if (gstConfig.gstEnabled === false) return 0;
    return gstConfig.defaultGstRate != null ? gstConfig.defaultGstRate : 18;
  }, [gstConfig]);
  const [selectedGst, setSelectedGst] = useState(initialGst);

  useEffect(() => {
    if (gstConfig.gstEnabled === false) {
      setSelectedGst(0);
    } else if (gstConfig.defaultGstRate != null) {
      setSelectedGst(gstConfig.defaultGstRate);
    }
  }, [gstConfig]);

  // Ensure institution data is fetched from DB if not already loaded
  useEffect(() => {
    if (fetchInstitutionData && (!institutionData || Object.keys(institutionData).length === 0)) {
      fetchInstitutionData();
    }
  }, [fetchInstitutionData, institutionData]);

  // Discount
  const [discountType, setDiscountType] = useState("amount");
  const [discountValue, setDiscountValue] = useState("");

  // Payment
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [splitAmounts, setSplitAmounts] = useState({ cash: "", upi: "", card: "" });
  const [isSettlingPOS, setIsSettlingPOS] = useState(false);

  // Appointments picker
  const [linkedAppointment, setLinkedAppointment] = useState(null);
  const [appointmentSearch, setAppointmentSearch] = useState("");
  const [appointmentFilterTab, setAppointmentFilterTab] = useState("all");

  // Receipt
  const [billToPrint, setBillToPrint] = useState(null);
  const [isDraftPrint, setIsDraftPrint] = useState(false);

  useEffect(() => {
    const handleClick = () => setClientSuggestions(false);
    document.addEventListener("pointerdown", handleClick);
    document.addEventListener("touchstart", handleClick);
    window.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("pointerdown", handleClick);
      document.removeEventListener("touchstart", handleClick);
      window.removeEventListener("click", handleClick);
    };
  }, []);

  // Ensure products list is loaded on mount
  useEffect(() => {
    const instId = institutionId || institutionData?.institutionid || institutionData?.institutionId;
    if (fetchProducts && instId && (!products || products.length === 0)) {
      fetchProducts(instId);
    }
  }, [fetchProducts, products, institutionId, institutionData]);

  useEffect(() => {
    if (location.state?.selectedAppointment) {
      handleSelectAppointment(location.state.selectedAppointment);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const getStaffName = (staffId) => {
    if (!staffId) return "Assigned";
    const found = (barbers || []).find(
      (b) => b.id === staffId || b.staffId === staffId || b.name === staffId
    );
    return found ? found.name : staffId;
  };

  /* Opening helpers: close whatever is open first, so overlays never stack */
  const openPicker = () => {
    setShowMobileCart(false);
    setShowAppointmentPicker(true);
  };

  /* ------------------------------ Appointments ----------------------------- */

  const activeAppointments = useMemo(() => {
    return (appointments || []).filter((apt) => {
      const st = (apt.status || apt.Status || apt.appointment_status || "").toLowerCase();
      return st !== "cancelled" && st !== "completed" && st !== "settled";
    });
  }, [appointments]);

  const inServiceCount = useMemo(
    () =>
      activeAppointments.filter(
        (a) => normalizeStatus(a.status || a.appointment_status) === "in_progress"
      ).length,
    [activeAppointments]
  );

  const scheduledCount = useMemo(
    () =>
      activeAppointments.filter(
        (a) => normalizeStatus(a.status || a.appointment_status) === "scheduled"
      ).length,
    [activeAppointments]
  );

  const filteredWaitingAppointments = useMemo(() => {
    const q = appointmentSearch.toLowerCase().trim();
    return activeAppointments.filter((apt) => {
      const name = (apt.client?.clientName || apt.clientName || "").toLowerCase();
      const phone = String(apt.client?.phoneNumber || apt.phoneNumber || "").toLowerCase();
      const srv = (
        Array.isArray(apt.services)
          ? apt.services.map((s) => (typeof s === "string" ? s : s?.serviceName || "")).join(" ")
          : typeof apt.service === "string"
          ? apt.service
          : ""
      ).toLowerCase();
      const staff = String(apt.staff || apt.staffId || "").toLowerCase();

      const matchesQuery = !q || name.includes(q) || phone.includes(q) || srv.includes(q) || staff.includes(q);
      const normSt = normalizeStatus(apt.status || apt.appointment_status);
      if (appointmentFilterTab === "in_service") return matchesQuery && normSt === "in_progress";
      if (appointmentFilterTab === "scheduled") return matchesQuery && normSt === "scheduled";
      return matchesQuery;
    });
  }, [activeAppointments, appointmentSearch, appointmentFilterTab]);

  // Crash-proof: invalid dates are skipped instead of throwing
  const todayStats = useMemo(() => {
    const todayStr = safeFormat(new Date(), "yyyy-MM-dd", "");
    let count = 0;
    let revenue = 0;
    (appointments || []).forEach((apt) => {
      const st = String(apt.status || apt.Status || apt.appointment_status || "").toLowerCase();
      if (!(st === "completed" || st === "settled" || st === "paid")) return;
      const d = tryParseDate(apt.dateTime) || tryParseDate(apt.createdAt);
      if (!d || safeFormat(d, "yyyy-MM-dd", "") !== todayStr) return;
      count += 1;
      revenue += Number(apt.total || apt.amount || 0) || 0;
    });
    return { count, revenue };
  }, [appointments]);

  /* ------------------------------- Catalogue ------------------------------- */

  const catalogCategories = useMemo(() => {
    const list = showProducts ? products || [] : services || [];
    const unique = [
      ...new Set(list.map((it) => it?.category).filter((c) => typeof c === "string" && c.trim())),
    ];
    return ["all", ...unique];
  }, [showProducts, services, products]);

  const filteredCatalogItems = useMemo(() => {
    const list = showProducts ? products || [] : services || [];
    const q = catalogSearch.toLowerCase().trim();
    return list.filter((item) => {
      const name = (showProducts ? item.productName : item.serviceName) || "";
      const matchesSearch =
        !q || name.toLowerCase().includes(q) || (item.category || "").toLowerCase().includes(q);
      const matchesCat =
        selectedCategory === "all" ||
        (item.category || "").toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCat;
    });
  }, [showProducts, services, products, catalogSearch, selectedCategory]);

  const getItemCartQty = (item, isProduct) => {
    const itemId = isProduct ? item.productId : item.serviceId;
    const found = cart.find((i) => (isProduct ? i.productId === itemId : i.serviceId === itemId));
    return found ? found.quantity || 1 : 0;
  };

  /* --------------------------------- Cart ---------------------------------- */

  const addToCart = (item, isProductOverride) => {
    const isProd = isProductOverride !== undefined ? isProductOverride : showProducts || !!item.productId;
    const itemId = isProd ? item.productId : item.serviceId;

    setCart((prev) => {
      const idx = prev.findIndex((i) => (isProd ? i.productId === itemId : i.serviceId === itemId));
      if (idx > -1) {
        return prev.map((i, n) => (n === idx ? { ...i, quantity: (i.quantity || 1) + 1 } : i));
      }
      return [
        ...prev,
        { ...item, isProduct: isProd, quantity: 1, amount: Number(item.amount || item.price || 0) },
      ];
    });
  };

  const decrementFromCart = (itemId, isProduct = false) => {
    setCart((prev) =>
      prev
        .map((i) => {
          const match = isProduct ? i.productId === itemId : i.serviceId === itemId;
          return match ? { ...i, quantity: (i.quantity || 1) - 1 } : i;
        })
        .filter((i) => (i.quantity || 0) > 0)
    );
  };

  const removeFromCart = (itemId, isProduct = false) => {
    setCart((prev) =>
      prev.filter((i) => (isProduct ? i.productId !== itemId : i.serviceId !== itemId))
    );
  };

  const clearCart = () => {
    setCart([]);
    setLinkedAppointment(null);
    setDiscountValue("");
    setClient({ clientName: "", phoneNumber: "" });
    setSelectedExistingClient(null);
    setSelectedStaff("");
    setIsSplitPayment(false);
    setPaymentMode("cash");
    setSplitAmounts({ cash: "", upi: "", card: "" });
  };

  /* ------------------------------ Calculations ----------------------------- */

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + (Number(item.amount) || 0) * (item.quantity || 1), 0),
    [cart]
  );

  const cartTotalItemsCount = useMemo(
    () => cart.reduce((sum, item) => sum + (item.quantity || 1), 0),
    [cart]
  );

  const cartTax = useMemo(
    () => Math.round((cartSubtotal * (Number(selectedGst) || 0)) / 100),
    [cartSubtotal, selectedGst]
  );

  const cartDiscount = useMemo(() => {
    if (!discountValue || isNaN(discountValue)) return 0;
    const val = parseFloat(discountValue);
    if (val <= 0 || isNaN(val)) return 0;
    const gross = (cartSubtotal || 0) + (cartTax || 0);
    if (discountType === "percentage") {
      return Math.round((gross * Math.min(val, 100)) / 100);
    }
    return Math.min(val, gross);
  }, [cartSubtotal, cartTax, discountValue, discountType]);

  const cartFinalTotal = useMemo(
    () => Math.max(0, (cartSubtotal || 0) + (cartTax || 0) - (cartDiscount || 0)),
    [cartSubtotal, cartTax, cartDiscount]
  );

  const totalSplitAllocated = useMemo(
    () =>
      (Number(splitAmounts.cash) || 0) +
      (Number(splitAmounts.upi) || 0) +
      (Number(splitAmounts.card) || 0),
    [splitAmounts]
  );

  const splitRemaining = cartFinalTotal - totalSplitAllocated;

  const isSplitValid = useMemo(() => {
    if (!isSplitPayment) return true;
    return totalSplitAllocated === cartFinalTotal && cartFinalTotal > 0;
  }, [isSplitPayment, totalSplitAllocated, cartFinalTotal]);

  /* --------------------------------- Actions ------------------------------- */

  const handlePrintDraftBill = async () => {
    if (cart.length === 0) {
      toast({
        variant: "destructive",
        title: "Cart is empty",
        description: "Add at least one service or product to print the bill.",
      });
      return;
    }

    const serviceItems = cart.filter((i) => !i.isProduct);
    const productItems = cart.filter((i) => i.isProduct);

    const draftBill = {
      id:
        linkedAppointment?.appointmentId ||
        linkedAppointment?.id ||
        `EST-${Math.floor(Date.now() / 1000).toString().slice(-6)}`,
      clientName: client.clientName.trim() || "Walk-in Client",
      phoneNumber: client.phoneNumber.trim() || "",
      date: new Date(),
      items: [
        ...serviceItems.map((s) => ({ ...s, name: s.serviceName, isProduct: false })),
        ...productItems.map((p) => ({ ...p, name: p.productName, isProduct: true })),
      ],
      services: serviceItems,
      products: productItems,
      subtotal: cartSubtotal,
      tax: cartTax,
      gstPercent: selectedGst,
      discount: cartDiscount,
      total: cartFinalTotal,
      status: "Draft Estimate",
      paymentMethod: isSplitPayment ? "split" : paymentMode,
      paymentSplit: isSplitPayment
        ? {
            cash: Number(splitAmounts.cash) || 0,
            upi: Number(splitAmounts.upi) || 0,
            card: Number(splitAmounts.card) || 0,
          }
        : null,
      staff: getStaffName(selectedStaff),
    };

    setShowMobileCart(false);

    const printerSettings = getStoredPrinterSettings(institutionData);
    const isBluetooth = printerSettings?.printerType === "bluetooth";

    toast({
      title: isBluetooth ? "Printing via Bluetooth..." : "Printing Receipt...",
      description: isBluetooth
        ? "Connecting via Web Bluetooth API..."
        : `Printing on USB (${printerSettings?.paperSize || "80mm"})...`,
    });

    try {
      await directPrintBill(draftBill, institutionData, printerSettings);
      if (isBluetooth) {
        toast({
          title: "Receipt Printed",
          description: "Estimate sent to Bluetooth thermal printer.",
        });
      }
    } catch (err) {
      console.warn("Direct draft print notice:", err);
      toast({
        variant: "destructive",
        title: "Printer Notice",
        description: err.message || "Direct print failed. Opening preview modal.",
      });
      setBillToPrint(draftBill);
      setIsDraftPrint(true);
      setShowBillPrint(true);
    }
  };

  const handleSelectAppointment = (apt) => {
    if (!apt) return;
    const clientName =
      apt.client?.clientName || apt.clientName || apt.ClientName || apt.client_name || "Walk-in Client";
    const phoneNumber =
      apt.client?.phoneNumber || apt.phoneNumber || apt.phone || apt.clientPhone || "";

    setClient({ clientName, phoneNumber });
    setSelectedExistingClient({ clientName, phoneNumber, isExisting: true });
    setSelectedStaff(apt.staffId || apt.staff || "");

    const itemsToAdd = [];
    const findService = (name) =>
      (services || []).find((cat) => cat.serviceName?.toLowerCase() === name.toLowerCase());

    if (Array.isArray(apt.services) && apt.services.length > 0) {
      apt.services.forEach((s) => {
        const sName = typeof s === "string" ? s : s?.serviceName || "Service";
        const matched = findService(sName);
        const qty = typeof s === "object" && s.quantity ? Number(s.quantity) : 1;
        if (matched) {
          itemsToAdd.push({ ...matched, isProduct: false, quantity: qty, amount: Number(matched.amount || matched.price || 0) });
        } else {
          itemsToAdd.push({
            serviceId: `apt-srv-${Math.random().toString(36).substring(2, 7)}`,
            serviceName: sName,
            amount: Number(s?.amount || apt.amount || 250),
            isProduct: false,
            quantity: qty,
          });
        }
      });
    } else if (typeof apt.service === "string" && apt.service.trim()) {
      apt.service
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((sName) => {
          const matched = findService(sName);
          if (matched) {
            itemsToAdd.push({ ...matched, isProduct: false, quantity: 1, amount: Number(matched.amount || matched.price || 0) });
          } else {
            itemsToAdd.push({
              serviceId: `apt-srv-${Math.random().toString(36).substring(2, 7)}`,
              serviceName: sName,
              amount: 250,
              isProduct: false,
              quantity: 1,
            });
          }
        });
    }

    if (Array.isArray(apt.products) && apt.products.length > 0) {
      apt.products.forEach((p) => {
        const pName = typeof p === "string" ? p : p?.productName || p?.name || "Product";
        const matched = (products || []).find(
          (prod) => prod.productName?.toLowerCase() === pName.toLowerCase()
        );
        const qty = typeof p === "object" && p.quantity ? Number(p.quantity) : 1;
        if (matched) {
          itemsToAdd.push({ ...matched, isProduct: true, quantity: qty, amount: Number(matched.amount || matched.price || 0) });
        } else {
          itemsToAdd.push({
            productId: `apt-prd-${Math.random().toString(36).substring(2, 7)}`,
            productName: pName,
            amount: Number(p?.amount || p?.price || 150),
            isProduct: true,
            quantity: qty,
          });
        }
      });
    }

    if (itemsToAdd.length > 0) setCart(itemsToAdd);

    setLinkedAppointment(apt);
    setShowAppointmentPicker(false);

    // Phones: go straight to checkout (picker is already closed, so no stacking)
    if (typeof window !== "undefined" && window.innerWidth < 768 && itemsToAdd.length > 0) {
      setShowMobileCart(true);
    }

    toast({
      title: "Appointment loaded",
      description: `${clientName} • ${itemsToAdd.length} item(s) added to the bill.`,
    });
  };

  const handleSettlePOS = async () => {
    if (isSettlingPOS) return;

    if (cart.length === 0) {
      toast({
        variant: "destructive",
        title: "Cart is empty",
        description: "Add at least one service or product to bill.",
      });
      return;
    }

    if (isSplitPayment && totalSplitAllocated !== cartFinalTotal) {
      toast({
        variant: "destructive",
        title: "Split payment mismatch",
        description: `Allocated ₹${totalSplitAllocated} must equal total ₹${cartFinalTotal}.`,
      });
      return;
    }

    setIsSettlingPOS(true);
    try {
      const epochNow = Math.floor(Date.now() / 1000);
      const rawName = String(client.clientName || "").trim();
      const rawPhone = String(client.phoneNumber || "").replace(/[^0-9+]/g, "").trim();

      const isRealClient =
        rawName.length > 0 &&
        !rawName.toLowerCase().includes("walk-in") &&
        !rawName.toLowerCase().includes("walk in") &&
        rawName.toLowerCase() !== "guest" &&
        rawName.toLowerCase() !== "client" &&
        rawPhone.length >= 7;

      const clientName = rawName || "Walk-in Client";
      const phoneNumber = rawPhone || "";

      let clientId = selectedExistingClient?.id || "";

      if (!clientId && isRealClient) {
        const found = (clients || []).find(
          (c) =>
            ((c.userName || c.clientName || c.name) &&
              (c.userName || c.clientName || c.name).toLowerCase() === rawName.toLowerCase()) ||
            (rawPhone && (c.phoneNumber === rawPhone || c.phone === rawPhone || c.PhoneNumber === rawPhone))
        );
        if (found) {
          clientId = found.clientId || found.cognitoId || found.id || "";
        }
      }

      // ONLY create client in directory if user explicitly provided a real name AND valid phone number
      if (!clientId && isRealClient) {
        try {
          const newC = await createClient({
            userName: rawName,
            clientName: rawName,
            phoneNumber: rawPhone,
            emailId: "",
            createdAt: epochNow,
          });
          clientId = newC?.client?.clientId || newC?.clientId || newC?.id || "";
          if (fetchClients) fetchClients();
        } catch (e) {
          console.warn("Client auto-create skipped or warning:", e);
        }
      }

      const serviceItems = cart.filter((i) => !i.isProduct);
      const productItems = cart.filter((i) => i.isProduct);

      const servicesMapped = serviceItems.map((s) => ({
        serviceName: s.serviceName,
        amount: Number(s.amount || 0),
        duration: Number(s.duration || 30),
        quantity: Number(s.quantity || 1),
      }));

      const productsMapped = productItems.map((p) => ({
        productId: p.productId,
        productName: p.productName,
        amount: Number(p.amount || 0),
        quantity: Number(p.quantity || 1),
      }));

      const allBillItems = [
        ...servicesMapped.map((s) => ({ ...s, name: s.serviceName, isProduct: false })),
        ...productsMapped.map((p) => ({ ...p, name: p.productName, isProduct: true })),
      ];

      const servicesOnlyCSV = servicesMapped
        .map((s) => `${s.serviceName}${s.quantity > 1 ? ` (×${s.quantity})` : ""}`)
        .join(", ");

      const targetAppointmentId = linkedAppointment?.appointmentId || linkedAppointment?.id;

      const totalServiceDuration = servicesMapped.reduce(
        (sum, s) => sum + (s.duration || 30) * (s.quantity || 1),
        0
      );

      const cashVal = isSplitPayment
        ? Number(splitAmounts.cash) || 0
        : paymentMode === "cash"
        ? cartFinalTotal
        : 0;
      const upiVal = isSplitPayment
        ? Number(splitAmounts.upi) || 0
        : (paymentMode === "upi" || paymentMode === "online")
        ? cartFinalTotal
        : 0;
      const cardVal = isSplitPayment
        ? Number(splitAmounts.card) || 0
        : paymentMode === "card"
        ? cartFinalTotal
        : 0;

      const paymentSplitData = isSplitPayment
        ? {
            cash: cashVal,
            upi: upiVal,
            card: cardVal,
          }
        : null;

      const paymentsArray = isSplitPayment
        ? [
            ...(cashVal > 0 ? [{ mode: "cash", amount: cashVal }] : []),
            ...(upiVal > 0 ? [{ mode: "upi", amount: upiVal }] : []),
            ...(cardVal > 0 ? [{ mode: "card", amount: cardVal }] : []),
          ]
        : [{ mode: paymentMode, amount: cartFinalTotal }];

      const summaryParts = [];
      if (cashVal > 0) summaryParts.push(`Cash: ₹${cashVal}`);
      if (upiVal > 0) summaryParts.push(`UPI: ₹${upiVal}`);
      if (cardVal > 0) summaryParts.push(`Card: ₹${cardVal}`);

      const paymentSummaryText = isSplitPayment
        ? summaryParts.join(" + ") || "Split"
        : paymentMode.toUpperCase();

      const billPayload = {
        appointmentId: targetAppointmentId || `INV-${epochNow}`,
        clientId: clientId || (isRealClient ? `CLT-${epochNow.toString().slice(-6)}` : null),
        clientName,
        phoneNumber,
        services: servicesMapped,
        products: productsMapped,
        items: allBillItems,
        service: servicesOnlyCSV || (productsMapped.length > 0 ? productsMapped.map(p => p.productName).join(", ") : "Salon Treatment"),
        isWalkinPOS: !isRealClient,
        isPosSale: true,
        source: "pos",
        duration: totalServiceDuration || 30,
        dateTime: epochNow,
        subtotal: cartSubtotal,
        tax: cartTax,
        gstPercent: selectedGst,
        discount: cartDiscount,
        discountAmount: cartDiscount,
        total: cartFinalTotal,
        amount: cartSubtotal,
        staffId: selectedStaff || "",
        staff: getStaffName(selectedStaff),
        paymentMode: isSplitPayment ? "split" : paymentMode,
        paymentSplit: paymentSplitData,
        paymentSummary: paymentSummaryText,
        cashAmount: cashVal,
        upiAmount: upiVal,
        cardAmount: cardVal,
        payments: paymentsArray,
        status: "completed",
        updatedAt: epochNow,
      };

      if (targetAppointmentId) {
        if (updateAppointmentBilling) await updateAppointmentBilling(targetAppointmentId, billPayload);
        if (updateAppointment) {
          await updateAppointment(targetAppointmentId, {
            status: "completed",
            paymentMode: isSplitPayment ? "split" : paymentMode,
            paymentSplit: paymentSplitData,
            paymentSummary: paymentSummaryText,
            cashAmount: cashVal,
            upiAmount: upiVal,
            cardAmount: cardVal,
            payments: paymentsArray,
            total: cartFinalTotal,
            subtotal: cartSubtotal,
            tax: cartTax,
            discount: cartDiscount,
            discountAmount: cartDiscount,
          });
        }
      } else {
        // Direct counter POS sale for walk-in client: tagged so it does not clutter the Appointments schedule
        await createAppointment({
          ...billPayload,
          isWalkinPOS: true,
          source: "pos",
          isPosSale: true,
          createdAt: epochNow,
        });
      }

      // Deduct sold products from inventory stock
      if (productItems && productItems.length > 0 && updateProduct) {
        const instId = institutionId || institutionData?.institutionid || institutionData?.institutionId;
        for (const item of productItems) {
          try {
            const pId = item.productId || item.id;
            if (!pId) continue;
            const fullProd = (products || []).find(
              (p) => String(p.productId || p.id) === String(pId)
            );
            const currentStock = Number(
              fullProd?.currentStock ?? fullProd?.stock ?? fullProd?.quantity ?? item.currentStock ?? 0
            );
            const soldQty = Number(item.quantity || 1);
            const newStock = Math.max(0, currentStock - soldQty);
            const minStock = Number(fullProd?.minStock || 5);
            const newStatus =
              newStock === 0
                ? "out_of_stock"
                : newStock <= minStock
                ? "low_stock"
                : "in_stock";

            const { productId: _p, institutionId: _i, ...cleanProd } = fullProd || {};
            await updateProduct(instId, pId, {
              ...cleanProd,
              currentStock: newStock,
              status: newStatus,
            });
          } catch (pErr) {
            console.error("Failed to deduct inventory for sold product:", item, pErr);
          }
        }
        if (fetchProducts) {
          try {
            const instId = institutionId || institutionData?.institutionid || institutionData?.institutionId;
            await fetchProducts(instId);
          } catch (_) {}
        }
      }

      const completedBill = {
        id: billPayload.appointmentId,
        clientName,
        phoneNumber,
        date: new Date(),
        items: allBillItems,
        services: servicesMapped,
        products: productsMapped,
        subtotal: cartSubtotal,
        tax: cartTax,
        gstPercent: selectedGst,
        discount: cartDiscount,
        total: cartFinalTotal,
        status: "completed",
        paymentMethod: isSplitPayment ? "split" : paymentMode,
        paymentMode: isSplitPayment ? "split" : paymentMode,
        paymentSplit: paymentSplitData,
        paymentSummary: paymentSummaryText,
        cashAmount: cashVal,
        upiAmount: upiVal,
        cardAmount: cardVal,
        payments: paymentsArray,
        staff: getStaffName(selectedStaff),
      };

      // 1) close the checkout sheet, 2) reset the cart
      setShowMobileCart(false);
      clearCart();

      toast({
        title: "Bill settled successfully",
        description: targetAppointmentId
          ? `Invoice #${completedBill.id} settled and appointment completed.`
          : `Invoice #${completedBill.id} generated and payment recorded.`,
      });

      // Direct auto-print if configured in Settings, completely without opening any modal
      const printerSettings = getStoredPrinterSettings(institutionData);
      if (printerSettings?.autoPrint) {
        try {
          await directPrintBill(completedBill, institutionData, printerSettings);
        } catch (printErr) {
          console.warn("Direct background print notice:", printErr);
        }
      }

      // Refresh in the background
      setTimeout(() => {
        Promise.resolve(fetchAppointments?.()).catch((e) =>
          console.warn("Fetch refresh warning:", e)
        );
      }, 400);
    } catch (err) {
      console.error("Billing settlement error:", err);
      toast({
        variant: "destructive",
        title: "Settlement error",
        description: "Could not settle the bill. Please try again.",
      });
    } finally {
      setIsSettlingPOS(false);
    }
  };

  /* ----------------------------------------------------------------------------
   * Checkout panel — a plain render function (NOT a nested component) so inputs
   * keep focus while typing.
   * -------------------------------------------------------------------------- */
  const renderCartPanel = (isSheet = false) => {
    const clientLabel = client.clientName.trim() || "Walk-in client";
    const staffLabel = selectedStaff ? getStaffName(selectedStaff) : "";

    return (
      <div className="flex flex-col h-full min-h-0 bg-white md:rounded-xl md:border md:border-slate-200/90 overflow-hidden">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-3 py-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <h3 className="font-bold text-sm text-slate-900">Checkout</h3>
              <span className="text-[11px] text-slate-500 font-medium">
                {cartTotalItemsCount} unit{cartTotalItemsCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs font-semibold text-rose-600 hover:bg-rose-50 px-2 py-1.5 rounded flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
            )}
            {isSheet && (
              <button
                onClick={() => setShowMobileCart(false)}
                className="p-2 rounded-md text-slate-500 hover:bg-slate-100 cursor-pointer"
                aria-label="Close checkout"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
          {/* Client & Staff Direct Inputs (No Edit Click Needed) */}
          <div className="rounded-lg border border-slate-200/80 bg-slate-50 p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Client & Stylist
              </span>

              <button
                type="button"
                onClick={openPicker}
                className="h-7 px-2 rounded-md bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 hover:bg-blue-100 flex items-center gap-1 cursor-pointer transition-colors"
                title="Load a waiting appointment"
              >
                <Calendar className="w-3 h-3" />
                <span>Appointments ({activeAppointments.length})</span>
              </button>
            </div>

            {linkedAppointment && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-md px-2 py-1 flex items-center justify-between gap-2 text-xs">
                <span className="text-emerald-900 font-semibold truncate flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Appointment #{linkedAppointment.appointmentId || linkedAppointment.id} linked
                </span>
                <button
                  type="button"
                  onClick={() => setLinkedAppointment(null)}
                  className="text-emerald-700 hover:text-rose-600 cursor-pointer shrink-0"
                  aria-label="Unlink appointment"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {selectedExistingClient && (
              <div className="bg-emerald-50 border border-emerald-200/90 rounded-md px-2 py-1 flex items-center justify-between gap-1.5 text-xs text-emerald-900">
                <span className="flex items-center gap-1 font-semibold truncate">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Existing Client: <strong>{selectedExistingClient.clientName}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleClearClient}
                  className="text-emerald-700 hover:text-rose-600 cursor-pointer text-xs font-bold px-1"
                  title="Clear selected client"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Direct Client Name & Phone Number */}
            <div className="grid grid-cols-2 gap-1.5">
              <div className="relative">
                <Input
                  placeholder="Client name"
                  value={client.clientName}
                  onChange={(e) => {
                    e.stopPropagation();
                    const newName = e.target.value;
                    setClient((prev) => ({ ...prev, clientName: newName }));
                    setSelectedExistingClient(null);
                    setClientSuggestions(true);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (client.clientName.trim()) setClientSuggestions(true);
                  }}
                  onFocus={() => {
                    if (client.clientName.trim()) setClientSuggestions(true);
                  }}
                  className="h-8 text-base md:text-xs rounded-md border-slate-200 bg-white"
                />
                {clientSuggestions && client.clientName.trim() && (
                  <>
                    <div
                      className="fixed inset-0 z-40 bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation();
                        setClientSuggestions(false);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        setClientSuggestions(false);
                      }}
                    />
                    <div
                      className="absolute left-0 top-full mt-1 w-[205%] max-w-[320px] bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                    <div className="px-2.5 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <span>Existing Clients</span>
                      <span>{clientSuggestionsList.length} found</span>
                    </div>

                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {clientSuggestionsList.length > 0 ? (
                        clientSuggestionsList.map((c, i) => (
                          <div
                            key={c.id || i}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSelectExistingClient(c);
                            }}
                            className="px-2.5 py-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between gap-2 transition-colors"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate flex items-center gap-1">
                                <User className="w-3 h-3 text-blue-600 shrink-0" />
                                {c.clientName}
                              </p>
                              {c.phoneNumber && (
                                <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                  <Phone className="w-2.5 h-2.5 text-slate-400" />
                                  {c.phoneNumber}
                                </p>
                              )}
                            </div>
                            <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded shrink-0">
                              Choose
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2.5 text-center text-[11px] text-slate-500">
                          <p className="font-semibold text-slate-700">No existing client matches "{client.clientName}"</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Will be saved as new client automatically</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

              <Input
                placeholder="Phone number"
                inputMode="tel"
                value={client.phoneNumber}
                onChange={(e) => {
                  e.stopPropagation();
                  setClient((prev) => ({ ...prev, phoneNumber: e.target.value }));
                }}
                onClick={(e) => e.stopPropagation()}
                className="h-8 text-base md:text-xs rounded-md border-slate-200 bg-white"
              />
            </div>

            {/* Direct Stylist Assignment Dropdown */}
            <select
              value={selectedStaff}
              onChange={(e) => {
                e.stopPropagation();
                setSelectedStaff(e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full h-8 text-base md:text-xs rounded-md border border-slate-200 px-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">Assign Stylist / Barber (Optional)</option>
              {(barbers || []).map((b) => (
                <option key={b.id || b.staffId} value={b.id || b.staffId}>
                  {b.name} ({b.role || "Stylist"})
                </option>
              ))}
            </select>
          </div>

          {/* Items */}
          <div className={cn("space-y-1.5", isSheet && "max-h-36 sm:max-h-48 overflow-y-auto pr-0.5")}>
            {cart.length > 0 ? (
              cart.map((item) => {
                const id = item.isProduct ? item.productId : item.serviceId;
                const name = item.isProduct ? item.productName : item.serviceName;
                const price = Number(item.amount) || 0;
                const qty = item.quantity || 1;

                return (
                  <div
                    key={`${item.isProduct ? "p" : "s"}-${id}`}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 truncate text-sm">{name}</p>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {formatCurrency(price)} • {item.isProduct ? "Product" : "Service"}
                      </span>
                    </div>

                    <div className="flex items-center border border-slate-200 rounded-md bg-slate-50 shrink-0">
                      <button
                        type="button"
                        onClick={() => decrementFromCart(id, item.isProduct)}
                        className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-black text-slate-900 font-mono">{qty}</span>
                      <button
                        type="button"
                        onClick={() => addToCart(item, item.isProduct)}
                        className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="font-black text-slate-900 w-16 text-right font-mono text-sm shrink-0">
                      {formatCurrency(price * qty)}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeFromCart(id, item.isProduct)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer shrink-0"
                      aria-label="Remove item"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="min-h-[140px] flex flex-col items-center justify-center text-center bg-slate-50/60 rounded-lg border border-dashed border-slate-200 p-4">
                <ShoppingCart className="w-8 h-8 mb-1.5 text-slate-300" />
                <p className="text-sm font-bold text-slate-600">Nothing added yet</p>
                <p className="text-xs text-slate-400 mt-0.5">Tap a service or product to add it</p>
              </div>
            )}
          </div>

          {/* On mobile drawer, render GST + Discount + Payment in scrollable section so virtual keyboard never clips or hides them */}
          {isSheet && (
            <div className="rounded-lg border border-slate-200/90 bg-slate-50/70 p-2.5 space-y-2.5">
              {/* GST rate row (Locked to salon configured rate) */}
              <div className="flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">GST Rate</span>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-bold text-xs shadow-2xs">
                  <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{gstConfig.gstEnabled === false ? "Exempt (0%)" : `${selectedGst}%`}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">(Settings)</span>
                </div>
              </div>

              {/* Discount row */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Discount</span>
                  {cartDiscount > 0 && (
                    <span className="text-[11px] font-bold text-emerald-600 font-mono">
                      (-{formatCurrency(cartDiscount)})
                    </span>
                  )}
                </div>

                <div
                  className="flex items-center gap-1.5 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                >
                  <select
                    value={discountType}
                    onChange={(e) => {
                      e.stopPropagation();
                      setDiscountType(e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                    className="h-8 text-xs font-semibold rounded border border-slate-200 px-1.5 bg-white text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                    aria-label="Discount type"
                  >
                    <option value="amount">₹ (Flat)</option>
                    <option value="percentage">% (Percent)</option>
                  </select>
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={discountValue}
                    onChange={(e) => {
                      e.stopPropagation();
                      setDiscountValue(e.target.value);
                    }}
                    onFocus={(e) => {
                      e.stopPropagation();
                      setTimeout(() => {
                        e.target.scrollIntoView({ behavior: "smooth", block: "center" });
                      }, 120);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.target.blur();
                      }
                    }}
                    className="h-8 w-24 text-base md:text-xs rounded border-slate-200 text-right bg-white px-2 font-mono font-bold focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Payment mode */}
              <div className="grid grid-cols-4 gap-1.5" onClick={(e) => e.stopPropagation()}>
                {PAYMENT_MODES.map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = !isSplitPayment && paymentMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSplitPayment(false);
                        setPaymentMode(mode.id);
                      }}
                      className={cn(
                        "flex items-center justify-center gap-1 h-10 rounded-lg border text-xs font-bold cursor-pointer transition-colors",
                        isSelected ? mode.activeCls : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <Icon className="w-3 h-3" />
                      {mode.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSplitPayment(true);
                  }}
                  className={cn(
                    "h-10 rounded-lg border text-xs font-bold cursor-pointer transition-colors",
                    isSplitPayment
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  Split
                </button>
              </div>

              {isSplitPayment && (
                <div
                  className="bg-purple-50/60 p-2 rounded-lg border border-purple-200/90 space-y-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { key: "cash", label: "Cash" },
                      { key: "upi", label: "UPI" },
                      { key: "card", label: "Card" },
                    ].map((f) => (
                      <label key={f.key} className="space-y-0.5">
                        <span className="text-[10px] text-slate-600 font-semibold block">{f.label}</span>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          value={splitAmounts[f.key]}
                          onChange={(e) => {
                            e.stopPropagation();
                            setSplitAmounts((p) => ({ ...p, [f.key]: e.target.value }));
                          }}
                          onFocus={(e) => {
                            e.stopPropagation();
                            setTimeout(() => {
                              e.target.scrollIntoView({ behavior: "smooth", block: "center" });
                            }, 120);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          onTouchEnd={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Enter") {
                              e.preventDefault();
                              e.target.blur();
                            }
                          }}
                          className="h-9 text-base md:text-sm font-bold font-mono border-slate-300 bg-white px-1 text-center"
                        />
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-purple-200">
                    <span className="text-slate-600 font-medium">
                      Allocated: <strong>₹{totalSplitAllocated}</strong>
                    </span>
                    {splitRemaining === 0 && cartFinalTotal > 0 ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Balanced
                      </span>
                    ) : splitRemaining > 0 ? (
                      <span className="text-amber-700 font-bold">₹{splitRemaining} remaining</span>
                    ) : (
                      <span className="text-rose-600 font-bold">₹{Math.abs(splitRemaining)} over</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pinned bottom: payment + settle (always visible) */}
        <div className="shrink-0 border-t border-slate-200 bg-white p-3 space-y-2 shadow-[0_-4px_12px_rgba(15,23,42,0.05)]">
          {/* On desktop, keep GST + Discount + Payment in pinned bottom */}
          {!isSheet && (
            <>
              {/* GST rate row (Locked to salon configured rate) */}
              <div className="flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">GST Rate</span>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-bold text-xs shadow-2xs">
                  <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{gstConfig.gstEnabled === false ? "Exempt (0%)" : `${selectedGst}%`}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">(Settings)</span>
                </div>
              </div>

              {/* Discount row */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Discount</span>
                  {cartDiscount > 0 && (
                    <span className="text-[11px] font-bold text-emerald-600 font-mono">
                      (-{formatCurrency(cartDiscount)})
                    </span>
                  )}
                </div>

                <div
                  className="flex items-center gap-1.5 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                >
                  <select
                    value={discountType}
                    onChange={(e) => {
                      e.stopPropagation();
                      setDiscountType(e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                    className="h-8 text-xs font-semibold rounded border border-slate-200 px-1.5 bg-white text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                    aria-label="Discount type"
                  >
                    <option value="amount">₹ (Flat)</option>
                    <option value="percentage">% (Percent)</option>
                  </select>
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={discountValue}
                    onChange={(e) => {
                      e.stopPropagation();
                      setDiscountValue(e.target.value);
                    }}
                    onFocus={(e) => {
                      e.stopPropagation();
                      setTimeout(() => {
                        e.target.scrollIntoView({ behavior: "smooth", block: "center" });
                      }, 120);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.target.blur();
                      }
                    }}
                    className="h-8 w-24 text-base md:text-xs rounded border-slate-200 text-right bg-white px-2 font-mono font-bold focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Payment mode */}
              <div className="grid grid-cols-4 gap-1.5" onClick={(e) => e.stopPropagation()}>
                {PAYMENT_MODES.map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = !isSplitPayment && paymentMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSplitPayment(false);
                        setPaymentMode(mode.id);
                      }}
                      className={cn(
                        "flex items-center justify-center gap-1 h-10 rounded-lg border text-xs font-bold cursor-pointer transition-colors",
                        isSelected ? mode.activeCls : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <Icon className="w-3 h-3" />
                      {mode.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSplitPayment(true);
                  }}
                  className={cn(
                    "h-10 rounded-lg border text-xs font-bold cursor-pointer transition-colors",
                    isSplitPayment
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  Split
                </button>
              </div>

              {isSplitPayment && (
                <div
                  className="bg-purple-50/60 p-2 rounded-lg border border-purple-200/90 space-y-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { key: "cash", label: "Cash" },
                      { key: "upi", label: "UPI" },
                      { key: "card", label: "Card" },
                    ].map((f) => (
                      <label key={f.key} className="space-y-0.5">
                        <span className="text-[10px] text-slate-600 font-semibold block">{f.label}</span>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          value={splitAmounts[f.key]}
                          onChange={(e) => {
                            e.stopPropagation();
                            setSplitAmounts((p) => ({ ...p, [f.key]: e.target.value }));
                          }}
                          onFocus={(e) => {
                            e.stopPropagation();
                            setTimeout(() => {
                              e.target.scrollIntoView({ behavior: "smooth", block: "center" });
                            }, 120);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          onTouchEnd={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Enter") {
                              e.preventDefault();
                              e.target.blur();
                            }
                          }}
                          className="h-9 text-base md:text-sm font-bold font-mono border-slate-300 bg-white px-1 text-center"
                        />
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-purple-200">
                    <span className="text-slate-600 font-medium">
                      Allocated: <strong>₹{totalSplitAllocated}</strong>
                    </span>
                    {splitRemaining === 0 && cartFinalTotal > 0 ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Balanced
                      </span>
                    ) : splitRemaining > 0 ? (
                      <span className="text-amber-700 font-bold">₹{splitRemaining} remaining</span>
                    ) : (
                      <span className="text-rose-600 font-bold">₹{Math.abs(splitRemaining)} over</span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Totals */}
          <div className="bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 text-xs space-y-0.5">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-800 font-mono">{formatCurrency(cartSubtotal)}</span>
            </div>
            {cartTax > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>GST ({selectedGst}%)</span>
                <span className="font-semibold text-slate-800 font-mono">+{formatCurrency(cartTax)}</span>
              </div>
            )}
            {cartDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount</span>
                <span className="font-mono">-{formatCurrency(cartDiscount)}</span>
              </div>
            )}
          </div>

          {/* Actions Bar with Compact Settle Button */}
          <div className="flex items-center justify-between gap-2 pt-1 pb-[env(safe-area-inset-bottom)]">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">
                Total Payable
              </span>
              <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                {formatCurrency(cartFinalTotal)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                type="button"
                onClick={handlePrintDraftBill}
                disabled={cart.length === 0 || isSettlingPOS}
                className="h-9 px-2.5 border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer text-xs font-semibold flex items-center gap-1"
                title="Preview bill before payment"
                aria-label="Preview bill"
              >
                <Printer className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Print</span>
              </Button>

              <Button
                type="button"
                onClick={handleSettlePOS}
                disabled={isSettlingPOS || cart.length === 0 || (isSplitPayment && !isSplitValid)}
                className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-lg shadow-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSettlingPOS ? (
                  <ScissorsLoader text="Settling..." />
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Settle</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* --------------------------------- Render -------------------------------- */

  return (
    <div className="h-full flex flex-col gap-2 font-sans min-h-0 text-slate-800">
      {/* Top bar */}
      <div className="shrink-0 bg-white px-3 py-2 rounded-xl border border-slate-200/90 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">
              POS & Billing
            </h1>
            <p className="text-[11px] text-slate-500 hidden lg:block">Tap items, pick payment, settle.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 text-xs">
            <span className="font-bold text-slate-400">Today</span>
            <strong className="text-slate-900">{todayStats.count} bills</strong>
            <span className="text-emerald-600 font-bold font-mono">({formatCurrency(todayStats.revenue)})</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={openPicker}
            className="h-9 text-xs font-bold border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg px-3 cursor-pointer flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4" />
            <span>Waiting</span>
            <span className="bg-blue-600 text-white rounded-full min-w-[18px] h-[18px] px-1 text-[10px] flex items-center justify-center">
              {activeAppointments.length}
            </span>
          </Button>
        </div>
      </div>

      {/* Main grid */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-2.5 overflow-hidden">
        {/* Catalogue */}
        <div className="md:col-span-7 xl:col-span-8 h-full flex flex-col min-h-0 gap-2">
          <div className="shrink-0 bg-white p-2 rounded-xl border border-slate-200/90 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 w-full sm:w-auto shrink-0">
                <button
                  onClick={() => {
                    setShowProducts(false);
                    setSelectedCategory("all");
                  }}
                  className={cn(
                    "flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 h-9 rounded-md text-xs font-bold cursor-pointer transition-colors",
                    !showProducts ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <Scissors className="w-3.5 h-3.5" />
                  Services ({services?.length || 0})
                </button>
                <button
                  onClick={() => {
                    setShowProducts(true);
                    setSelectedCategory("all");
                  }}
                  className={cn(
                    "flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 h-9 rounded-md text-xs font-bold cursor-pointer transition-colors",
                    showProducts ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Products ({products?.length || 0})
                </button>
              </div>

              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder={`Search ${showProducts ? "products" : "services"}...`}
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="pl-9 pr-8 h-9 text-sm rounded-lg border-slate-200 bg-white w-full"
                />
                {catalogSearch && (
                  <button
                    onClick={() => setCatalogSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {catalogCategories.map((cat) => {
                const isActive = selectedCategory.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-3.5 h-8 rounded-full text-xs font-semibold whitespace-nowrap capitalize cursor-pointer shrink-0 transition-colors",
                      isActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {cat === "all" ? "All" : cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Items grid — whole card is the tap target */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 pb-24 md:pb-1">
            <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2">
              {filteredCatalogItems.map((item) => {
                const id = showProducts ? item.productId : item.serviceId;
                const name = showProducts ? item.productName : item.serviceName;
                const price = Number(item.amount || item.price || 0);
                const qtyInCart = getItemCartQty(item, showProducts);
                const isInCart = qtyInCart > 0;
                const categoryTag = item.category || (showProducts ? "Product" : "Service");

                return (
                  <div
                    key={id}
                    role="button"
                    tabIndex={0}
                    onClick={() => addToCart(item, showProducts)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        addToCart(item, showProducts);
                      }
                    }}
                    className={cn(
                      "bg-white rounded-xl border p-2.5 flex flex-col justify-between gap-2 transition-all cursor-pointer select-none active:scale-[0.98] hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
                      isInCart
                        ? "border-blue-500 bg-blue-50/30 ring-1 ring-blue-300"
                        : "border-slate-200/90 hover:border-slate-300"
                    )}
                  >
                    <div className="space-y-1.5">
                      <span
                        className={cn(
                          "inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded border truncate max-w-full",
                          getCategoryColor(categoryTag)
                        )}
                      >
                        {categoryTag}
                      </span>
                      <h4 className="font-bold text-[13px] sm:text-sm text-slate-900 line-clamp-2 leading-snug">
                        {name}
                      </h4>
                    </div>

                    <div className="flex items-end justify-between gap-1 pt-2 border-t border-slate-100">
                      <div className="min-w-0">
                        <span className="text-sm font-black text-slate-900 font-mono block">
                          {formatCurrency(price)}
                        </span>
                        {!showProducts && item.duration && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {formatDuration(item.duration)}
                          </span>
                        )}
                      </div>

                      {isInCart ? (
                        <div
                          className="flex items-center border border-blue-300 rounded-md bg-white overflow-hidden shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => decrementFromCart(id, showProducts)}
                            className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                            aria-label="Decrease"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center text-xs font-black text-blue-700 font-mono">
                            {qtyInCart}
                          </span>
                          <button
                            onClick={() => addToCart(item, showProducts)}
                            className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                            aria-label="Increase"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="w-8 h-8 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                          <Plus className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredCatalogItems.length === 0 && (
                <div className="col-span-full py-12 text-center bg-white rounded-xl border border-slate-200">
                  <Scissors className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-sm font-bold text-slate-600">Nothing matches</p>
                  <p className="text-xs text-slate-400 mt-0.5">Try another category or search</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Checkout sidebar (tablet + desktop) */}
        <div className="hidden md:block md:col-span-5 xl:col-span-4 h-full min-h-0">
          {renderCartPanel(false)}
        </div>
      </div>

      {/* Mobile floating cart bar */}
      {cart.length > 0 && !showMobileCart && !showAppointmentPicker && !showBillPrint && (
        <div className="md:hidden fixed bottom-3 left-3 right-3 z-30">
          <Button
            onClick={() => setShowMobileCart(true)}
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xl flex items-center justify-between px-4 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
                <span className="absolute -top-1.5 -right-1.5 bg-white text-blue-700 text-[10px] font-black rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                  {cartTotalItemsCount}
                </span>
              </div>
              <span className="text-base font-black font-mono">{formatCurrency(cartFinalTotal)}</span>
            </div>
            <span className="text-xs bg-white text-blue-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1">
              Checkout <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Button>
        </div>
      )}

      {/* Mobile checkout sheet (plain overlay, no dialog) */}
      <Overlay open={showMobileCart} onClose={() => setShowMobileCart(false)} variant="sheet">
        {renderCartPanel(true)}
      </Overlay>

      {/* Waiting appointments (plain overlay, no dialog) */}
      <Overlay open={showAppointmentPicker} onClose={() => setShowAppointmentPicker(false)} variant="modal">
        <div className="shrink-0 px-4 py-3 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                Waiting appointments
              </h2>
              <p className="text-xs text-slate-500">Tap one to load it into the bill</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold text-xs px-2.5 py-0.5">
              {activeAppointments.length}
            </Badge>
            <button
              onClick={() => setShowAppointmentPicker(false)}
              className="p-2 rounded-md text-slate-500 hover:bg-slate-100 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-3 border-b border-slate-100 bg-white space-y-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search name, phone, service or stylist..."
              value={appointmentSearch}
              onChange={(e) => setAppointmentSearch(e.target.value)}
              className="pl-9 pr-8 h-10 text-sm rounded-lg bg-slate-50 border-slate-200 focus:bg-white"
            />
            {appointmentSearch && (
              <button
                onClick={() => setAppointmentSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              { id: "all", label: `All (${activeAppointments.length})`, on: "bg-slate-900 text-white", off: "bg-slate-100 text-slate-600 hover:bg-slate-200" },
              { id: "in_service", label: `In service (${inServiceCount})`, on: "bg-blue-600 text-white", off: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
              { id: "scheduled", label: `Scheduled (${scheduledCount})`, on: "bg-amber-600 text-white", off: "bg-amber-50 text-amber-800 hover:bg-amber-100" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setAppointmentFilterTab(t.id)}
                className={cn(
                  "px-3.5 h-8 rounded-full whitespace-nowrap cursor-pointer shrink-0 transition-colors",
                  appointmentFilterTab === t.id ? t.on : t.off
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 bg-slate-50/50">
          {filteredWaitingAppointments.map((apt) => {
            const id = apt.appointmentId || apt.id;
            const name = apt.client?.clientName || apt.clientName || "Walk-in Client";
            const phone = apt.client?.phoneNumber || apt.phoneNumber || "";
            const staffName = getStaffName(apt.staffId || apt.staff);
            const srvList = Array.isArray(apt.services)
              ? apt.services.map((s) => (typeof s === "string" ? s : s?.serviceName || "Service"))
              : typeof apt.service === "string" && apt.service.trim()
              ? apt.service.split(",").map((s) => s.trim())
              : ["Salon Treatment"];

            const aptDate = parseAppointmentDateTime(
              apt.dateTime,
              apt.date || apt.appointment_date,
              apt.time || apt.appointment_time,
              apt.createdAt
            );
            const amount = Number(apt.total || apt.amount || 0);
            const normStatus = normalizeStatus(apt.status || apt.appointment_status);
            const statusConfig = getStatusConfig(normStatus);
            const initials = name.slice(0, 2).toUpperCase() || "CL";

            return (
              <div
                key={id}
                onClick={() => handleSelectAppointment(apt)}
                className={cn(
                  "p-3 rounded-xl border border-slate-200/90 hover:border-blue-500 hover:shadow-md active:scale-[0.99] transition-all cursor-pointer bg-white border-l-4",
                  statusConfig.borderLeft
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 ring-2 bg-gradient-to-tr from-blue-600 to-indigo-600",
                        statusConfig.avatarRing
                      )}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 truncate">{name}</h4>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 rounded shrink-0">
                          #{id}
                        </span>
                      </div>
                      {phone ? (
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {phone}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400">Walk-in client</p>
                      )}
                    </div>
                  </div>
                  <StatusPill status={normStatus} />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {srvList.map((svc, idx) => (
                    <span
                      key={idx}
                      className={cn(
                        "text-[11px] font-bold py-0.5 px-2 rounded-md border inline-flex items-center gap-1",
                        getServiceBadgeStyle(svc)
                      )}
                    >
                      <Scissors className="w-2.5 h-2.5" />
                      {svc}
                    </span>
                  ))}
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      {formatDateLabel(aptDate)}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-slate-900">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      {safeFormat(aptDate, "hh:mm a")}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-slate-900">
                      <User className="w-3.5 h-3.5 text-indigo-500" />
                      {staffName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900 font-mono">
                      {amount > 0 ? formatCurrency(amount) : "₹—"}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-blue-600 text-white text-xs font-bold h-8 px-3 rounded-lg">
                      Bill <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredWaitingAppointments.length === 0 && (
            <div className="py-12 text-center bg-white rounded-xl border border-slate-200">
              <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No appointments found</p>
              <p className="text-xs text-slate-500 mt-1">
                {appointmentSearch ? "Try a different name or number" : "Nothing waiting in this group"}
              </p>
            </div>
          )}
        </div>
      </Overlay>

      {/* Receipt — isolated in its own boundary: if it ever fails, the page stays alive */}
      <ErrorBoundary inline>
        <BillPrintModal
          isOpen={showBillPrint}
          onClose={() => {
            setShowBillPrint(false);
            setBillToPrint(null);
          }}
          bill={billToPrint}
          isReprint={billToPrint?.status === "completed"}
          isDraft={isDraftPrint}
          onConfirmSettle={() => {
            setShowBillPrint(false);
            handleSettlePOS();
          }}
          isSettling={isSettlingPOS}
        />
      </ErrorBoundary>
    </div>
  );
};

const BillingPageWithBoundary = () => (
  <ErrorBoundary>
    <BillingPage />
  </ErrorBoundary>
);

export default BillingPageWithBoundary;