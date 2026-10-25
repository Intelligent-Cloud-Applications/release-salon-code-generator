import React, { useState, useContext, useMemo, useEffect } from "react";
import {
  FileSpreadsheet,
  FileText,
  Calendar,
  Search,
  Filter,
  Users,
  Receipt,
  Scissors,
  Wallet,
  Sparkles,
  Package,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  RotateCcw,
  CheckCircle,
  Clock,
  X,
  CreditCard,
  Smartphone,
  Check,
  Building,
  Phone,
  ArrowUpDown,
  Download,
  Printer,
  LayoutGrid,
  Table as TableIcon,
  HelpCircle,
  Eye,
  Layers,
  TrendingUp,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { cn } from "../lib/utils";
import Context from "../Context/Context";
import { format } from "date-fns";
import { formatCurrency, parseAppointmentDate } from "./BillPrintModal";
import {
  parsePaymentSplit,
  isSplitPayment,
  formatPaymentSummary,
  getCollectionBreakdown,
} from "../lib/paymentUtils";

/* ----------------------------------------------------------------------------
 * Report Definitions
 * -------------------------------------------------------------------------- */
const REPORT_TYPES = [
  {
    id: "guest",
    title: "Guest Report",
    shortTitle: "Guest Report",
    subtitle: "Guest information and visit history from billing data",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-100",
  },
  {
    id: "sales",
    title: "Sales & Invoicing Report",
    shortTitle: "Sales Report",
    subtitle: "Comprehensive invoice breakdown, discounts, taxes, and collections",
    icon: Receipt,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 border-emerald-100",
  },
  {
    id: "daily_collection",
    title: "Daily Collection Register",
    shortTitle: "Collection Register",
    subtitle: "Day-end reconciliation of Cash, UPI, Card, and Split settlements",
    icon: Wallet,
    color: "text-amber-600",
    bgColor: "bg-amber-50 border-amber-100",
  },
  {
    id: "staff",
    title: "Stylist Performance Report",
    shortTitle: "Stylist Report",
    subtitle: "Staff workload, clients served, service revenue, and commissions",
    icon: Scissors,
    color: "text-purple-600",
    bgColor: "bg-purple-50 border-purple-100",
  },
  {
    id: "services",
    title: "Services & Treatments Report",
    shortTitle: "Services Report",
    subtitle: "Service volume, popular treatments, and revenue contribution",
    icon: Sparkles,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 border-indigo-100",
  },
  {
    id: "products",
    title: "Product & Retail Sales Report",
    shortTitle: "Product Sales",
    subtitle: "Retail inventory sales, product quantities sold, and retail revenue",
    icon: Package,
    color: "text-rose-600",
    bgColor: "bg-rose-50 border-rose-100",
  },
  {
    id: "tax",
    title: "GST & Tax Audit Report",
    shortTitle: "Tax & GST",
    subtitle: "Taxable turnover, CGST, SGST, and GST invoice audit register",
    icon: FileSpreadsheet,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50 border-cyan-100",
  },
];

/* ----------------------------------------------------------------------------
 * Date Range Presets
 * -------------------------------------------------------------------------- */
const DATE_PRESETS = [
  { id: "all", label: "All Time" },
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "last_7_days", label: "Last 7 Days" },
  { id: "this_month", label: "This Month" },
  { id: "last_month", label: "Last Month" },
  { id: "custom", label: "Custom Range" },
];

const ReportsPage = () => {
  const { appointments, barbers, services, products, institutionData } =
    useContext(Context);

  // Layout & UI State
  const [selectedReportType, setSelectedReportType] = useState("guest");
  const [isConfigHidden, setIsConfigHidden] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'cards'
  const [searchQuery, setSearchQuery] = useState("");
  const [datePreset, setDatePreset] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // PDF Page Orientation: Default A4 Vertical ("portrait") as requested
  const [pdfOrientation, setPdfOrientation] = useState("portrait");

  // Contextual Filters
  const [filterStaff, setFilterStaff] = useState("all");
  const [filterPaymentMode, setFilterPaymentMode] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterGst, setFilterGst] = useState("all");

  const salonName =
    institutionData?.companyName ||
    institutionData?.InstitutionName ||
    "Tekkzy Hair Salon";
  const salonAddress =
    institutionData?.Query_Address || institutionData?.Address || "";
  const salonPhone =
    institutionData?.Query_PhoneNumber ||
    institutionData?.Contact ||
    institutionData?.phoneNumber ||
    "";
  const salonGst = institutionData?.gstNumber || "";

  // Helper to safely resolve stylist name with full fallbacks
  const getStaffName = (staffIdOrName) => {
    if (!staffIdOrName) return "Unassigned";
    const str = String(staffIdOrName).trim();
    if (
      !str ||
      str.toLowerCase() === "undefined" ||
      str.toLowerCase() === "null"
    ) {
      return "Unassigned";
    }
    const found = (barbers || []).find(
      (b) =>
        b.id === str ||
        b.staffId === str ||
        b._id === str ||
        String(b.name || "").toLowerCase() === str.toLowerCase() ||
        String(b.userName || "").toLowerCase() === str.toLowerCase()
    );
    if (found) {
      return found.name || found.userName || found.barberName || str;
    }
    return str;
  };

  /* --------------------------------------------------------------------------
   * Normalized Transaction Base (Zero undefined fields guaranteed)
   * ------------------------------------------------------------------------ */
  const normalizedTransactions = useMemo(() => {
    return (appointments || []).map((apt, index) => {
      const d = parseAppointmentDate(apt?.dateTime || apt?.createdAt || apt?.date);

      const rawStaff =
        apt?.staffName ||
        apt?.barberName ||
        apt?.staff ||
        apt?.Staff ||
        apt?.staff_name ||
        apt?.staffId ||
        "";
      const stylist = getStaffName(rawStaff);

      let serviceList = [];
      let detailedItems = [];

      if (Array.isArray(apt?.services)) {
        apt.services.forEach((s) => {
          if (typeof s === "string" && s.trim()) {
            serviceList.push(s.trim());
            detailedItems.push({
              name: s.trim(),
              amount: null,
              quantity: 1,
              isProduct: false,
            });
          } else if (s && typeof s === "object") {
            const name =
              (s.serviceName || s.name || s.title || s.service || "").trim() ||
              "Treatment";
            serviceList.push(name);
            detailedItems.push({
              name,
              amount:
                s.amount != null && Number(s.amount) > 0
                  ? Number(s.amount)
                  : s.price != null && Number(s.price) > 0
                  ? Number(s.price)
                  : null,
              quantity: Number(s.quantity || s.qty) || 1,
              isProduct: false,
            });
          }
        });
      } else if (typeof apt?.service === "string" && apt.service.trim()) {
        serviceList = apt.service
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        detailedItems = serviceList.map((name) => ({
          name,
          amount: null,
          quantity: 1,
          isProduct: false,
        }));
      } else if (apt?.service && typeof apt.service === "object") {
        const name =
          (apt.service.serviceName || apt.service.name || "").trim() ||
          "Treatment";
        serviceList.push(name);
        detailedItems.push({
          name,
          amount: Number(apt.service.amount || apt.service.price || 0) || null,
          quantity: 1,
          isProduct: false,
        });
      }

      if (serviceList.length === 0) {
        serviceList = ["Salon Treatment"];
        detailedItems.push({
          name: "Salon Treatment",
          amount: null,
          quantity: 1,
          isProduct: false,
        });
      }

      if (Array.isArray(apt?.products)) {
        apt.products.forEach((p) => {
          if (typeof p === "string" && p.trim()) {
            detailedItems.push({
              name: p.trim(),
              amount: 0,
              quantity: 1,
              isProduct: true,
            });
          } else if (p && typeof p === "object") {
            const name =
              (p.productName || p.name || p.title || "").trim() ||
              "Retail Product";
            detailedItems.push({
              name,
              amount: Number(p.price || p.amount || 0) || 0,
              quantity: Number(p.quantity || p.qty) || 1,
              isProduct: true,
            });
          }
        });
      }

      const subtotal =
        Number(
          apt?.subtotal != null
            ? apt.subtotal
            : apt?.amount != null
            ? apt.amount
            : apt?.total != null
            ? apt.total
            : 0
        ) || 0;
      const tax = Number(apt?.tax || 0) || 0;
      const discount =
        Number(
          apt?.discountAmount != null
            ? apt.discountAmount
            : apt?.discount != null
            ? apt.discount
            : apt?.discount_value != null
            ? apt.discount_value
            : 0
        ) || 0;
      const computed = subtotal + tax - discount;
      const total =
        Number(
          apt?.total != null ? apt.total : computed > 0 ? computed : subtotal
        ) || 0;

      const rawStatus = String(
        apt?.status || apt?.Status || apt?.appointment_status || "Completed"
      ).trim();
      const statusNormalized = rawStatus.toLowerCase();

      const rawPaymentMethod =
        apt?.paymentMode ||
        apt?.paymentMethod ||
        apt?.PaymentMethod ||
        apt?.payment_method ||
        "Cash";

      const paymentMethod =
        rawPaymentMethod &&
        String(rawPaymentMethod).toLowerCase() !== "undefined"
          ? String(rawPaymentMethod)
          : "Cash";

      const parsedSplit = parsePaymentSplit(apt);
      const isSplit = isSplitPayment(apt) || !!parsedSplit;
      const paymentSummary =
        isSplit && parsedSplit
          ? formatPaymentSummary(apt)
          : paymentMethod.toUpperCase();
      const breakdown = getCollectionBreakdown(apt);

      const rawClient =
        apt?.clientName ||
        apt?.client?.clientName ||
        apt?.userName ||
        apt?.client?.userName ||
        apt?.name ||
        apt?.client?.name ||
        apt?.ClientName ||
        apt?.client_name ||
        "";
      const clientName =
        String(rawClient).trim() &&
        String(rawClient).toLowerCase() !== "undefined" &&
        String(rawClient).toLowerCase() !== "null"
          ? String(rawClient).trim()
          : "Walk-in Guest";

      const rawPhone =
        apt?.phoneNumber ||
        apt?.clientPhone ||
        apt?.client?.phoneNumber ||
        apt?.client?.phone ||
        apt?.phone ||
        "";
      const phoneNumber =
        String(rawPhone).trim() &&
        String(rawPhone).toLowerCase() !== "undefined" &&
        String(rawPhone).toLowerCase() !== "null"
          ? String(rawPhone).trim()
          : "—";

      const rawId =
        apt?.appointmentId ||
        apt?.id ||
        apt?.Id ||
        apt?.appointment_id ||
        apt?.billId ||
        `INV-${String(index + 1).padStart(5, "0")}`;
      const id =
        String(rawId).trim() &&
        String(rawId).toLowerCase() !== "undefined" &&
        String(rawId).toLowerCase() !== "null"
          ? String(rawId).trim()
          : `INV-${String(index + 1).padStart(5, "0")}`;

      return {
        id,
        clientName,
        phoneNumber,
        date: d,
        dateKey: format(d, "yyyy-MM-dd"),
        dateDisplay: format(d, "dd/MM/yyyy"),
        dateTimeDisplay: format(d, "dd/MM/yyyy, hh:mm a"),
        services: serviceList,
        items: detailedItems,
        products: apt?.products || [],
        subtotal,
        discount,
        tax,
        total,
        gstPercent: Number(apt?.gstPercent || apt?.gst_percent || 0),
        status:
          statusNormalized === "completed" ||
          statusNormalized === "settled" ||
          statusNormalized === "paid"
            ? "Completed"
            : statusNormalized === "cancelled"
            ? "Cancelled"
            : "Scheduled",
        rawStatus,
        paymentMethod,
        isSplit,
        paymentSplit: parsedSplit,
        paymentSummary,
        breakdown,
        staff: stylist || "Unassigned",
        staffId: apt?.staffId || "",
      };
    });
  }, [appointments, barbers]);

  /* --------------------------------------------------------------------------
   * Date Range Filtering Helper
   * ------------------------------------------------------------------------ */
  const dateRangeBounds = useMemo(() => {
    const now = new Date();
    const todayStr = format(now, "yyyy-MM-dd");

    if (datePreset === "today") {
      return { start: todayStr, end: todayStr, label: "Today" };
    }
    if (datePreset === "yesterday") {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = format(y, "yyyy-MM-dd");
      return { start: yStr, end: yStr, label: "Yesterday" };
    }
    if (datePreset === "last_7_days") {
      const s = new Date(now);
      s.setDate(s.getDate() - 6);
      return {
        start: format(s, "yyyy-MM-dd"),
        end: todayStr,
        label: "Last 7 Days",
      };
    }
    if (datePreset === "this_month") {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        start: format(s, "yyyy-MM-dd"),
        end: todayStr,
        label: "This Month",
      };
    }
    if (datePreset === "last_month") {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        start: format(s, "yyyy-MM-dd"),
        end: format(e, "yyyy-MM-dd"),
        label: "Last Month",
      };
    }
    if (datePreset === "custom") {
      return {
        start: customStartDate || null,
        end: customEndDate || customStartDate || null,
        label:
          customStartDate && customEndDate
            ? `${customStartDate} to ${customEndDate}`
            : customStartDate || "Custom Range",
      };
    }
    return { start: null, end: null, label: "All Time" };
  }, [datePreset, customStartDate, customEndDate]);

  /* --------------------------------------------------------------------------
   * Filtered Transactions (Base Filter)
   * ------------------------------------------------------------------------ */
  const filteredTransactions = useMemo(() => {
    const { start, end } = dateRangeBounds;
    const q = searchQuery.trim().toLowerCase();

    return normalizedTransactions.filter((tx) => {
      // Date filter
      if (start && tx.dateKey < start) return false;
      if (end && tx.dateKey > end) return false;

      // Staff filter
      if (filterStaff !== "all") {
        if (tx.staffId !== filterStaff && tx.staff !== filterStaff) return false;
      }

      // Payment mode filter
      if (filterPaymentMode !== "all") {
        const mode = tx.paymentMethod.toLowerCase();
        if (filterPaymentMode === "split" && !tx.isSplit) return false;
        if (filterPaymentMode === "cash" && (tx.isSplit || mode !== "cash"))
          return false;
        if (
          filterPaymentMode === "upi" &&
          (tx.isSplit || (!mode.includes("upi") && !mode.includes("online")))
        )
          return false;
        if (filterPaymentMode === "card" && (tx.isSplit || !mode.includes("card")))
          return false;
      }

      // Status filter
      if (filterStatus !== "all") {
        if (tx.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
      }

      // GST filter
      if (filterGst === "gst_only" && tx.tax <= 0) return false;
      if (filterGst === "non_gst" && tx.tax > 0) return false;

      // Search filter
      if (q) {
        const match =
          tx.id.toLowerCase().includes(q) ||
          tx.clientName.toLowerCase().includes(q) ||
          tx.phoneNumber.includes(q) ||
          tx.staff.toLowerCase().includes(q) ||
          tx.services.some((s) => s.toLowerCase().includes(q)) ||
          tx.paymentSummary.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [
    normalizedTransactions,
    dateRangeBounds,
    filterStaff,
    filterPaymentMode,
    filterStatus,
    filterGst,
    searchQuery,
  ]);

  /* --------------------------------------------------------------------------
   * Active Filter Count
   * ------------------------------------------------------------------------ */
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (datePreset !== "all") count += 1;
    if (searchQuery.trim()) count += 1;
    if (filterStaff !== "all") count += 1;
    if (filterPaymentMode !== "all") count += 1;
    if (filterStatus !== "all") count += 1;
    if (filterGst !== "all") count += 1;
    return count;
  }, [datePreset, searchQuery, filterStaff, filterPaymentMode, filterStatus, filterGst]);

  /* --------------------------------------------------------------------------
   * Specialized Report Data Aggregators
   * ------------------------------------------------------------------------ */

  // 1. Daily Collection Summary Aggregator
  const dailyCollectionRows = useMemo(() => {
    const map = {};
    filteredTransactions.forEach((tx) => {
      const key = tx.dateKey;
      if (!map[key]) {
        map[key] = {
          dateKey: key,
          dateDisplay: tx.dateDisplay,
          rawDate: tx.date,
          billsCount: 0,
          totalRevenue: 0,
          cash: 0,
          upi: 0,
          card: 0,
          splitRevenue: 0,
        };
      }
      map[key].billsCount += 1;
      map[key].totalRevenue += tx.total;
      map[key].cash += tx.breakdown.cash;
      map[key].upi += tx.breakdown.upi;
      map[key].card += tx.breakdown.card;
      if (tx.isSplit) {
        map[key].splitRevenue += tx.total;
      }
    });

    return Object.values(map).sort(
      (a, b) => b.rawDate.getTime() - a.rawDate.getTime()
    );
  }, [filteredTransactions]);

  // 2. Stylist Performance Aggregator
  const stylistPerformanceRows = useMemo(() => {
    const map = {};
    (barbers || []).forEach((b) => {
      const bName = b.name || b.userName || b.barberName;
      if (bName && String(bName).toLowerCase() !== "undefined") {
        map[bName] = {
          name: bName,
          specialization: Array.isArray(b.specialization)
            ? b.specialization.join(", ")
            : b.specialization || "Hair & Styling",
          clientsCount: 0,
          servicesCount: 0,
          totalRevenue: 0,
          cash: 0,
          digital: 0,
        };
      }
    });

    filteredTransactions.forEach((tx) => {
      const sName = tx.staff || "Unassigned";
      if (!map[sName]) {
        map[sName] = {
          name: sName,
          specialization: "General Stylist",
          clientsCount: 0,
          servicesCount: 0,
          totalRevenue: 0,
          cash: 0,
          digital: 0,
        };
      }
      map[sName].clientsCount += 1;
      map[sName].servicesCount += Math.max(tx.services.length, 1);
      map[sName].totalRevenue += tx.total;
      map[sName].cash += tx.breakdown.cash;
      map[sName].digital += tx.breakdown.digital;
    });

    return Object.values(map).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredTransactions, barbers]);

  // 3. Services Performance Aggregator
  const servicesPerformanceRows = useMemo(() => {
    const map = {};
    let grandRevenue = 0;

    (services || []).forEach((s) => {
      const sName = s.serviceName || s.name;
      if (sName && String(sName).toLowerCase() !== "undefined") {
        map[sName] = {
          serviceName: sName,
          category: s.category || "Salon Service",
          timesBooked: 0,
          totalRevenue: 0,
        };
      }
    });

    filteredTransactions.forEach((tx) => {
      grandRevenue += tx.total;
      (tx.items || [])
        .filter((it) => !it.isProduct)
        .forEach((it) => {
          const sName = it.name;
          if (!sName || String(sName).toLowerCase() === "undefined") return;
          if (!map[sName]) {
            const cat =
              services.find(
                (s) => (s.serviceName || s.name) === sName
              )?.category || "Treatment";
            map[sName] = {
              serviceName: sName,
              category: cat,
              timesBooked: 0,
              totalRevenue: 0,
            };
          }
          const qty = Number(it.quantity) || 1;
          const itemAmount =
            it.amount != null && Number(it.amount) > 0
              ? Number(it.amount) * qty
              : tx.items.length > 0
              ? Math.round(tx.subtotal / tx.items.length)
              : 0;

          map[sName].timesBooked += qty;
          map[sName].totalRevenue += itemAmount;
        });
    });

    return Object.values(map)
      .map((r) => ({
        ...r,
        avgRate:
          r.timesBooked > 0 ? Math.round(r.totalRevenue / r.timesBooked) : 0,
        percentOfTotal:
          grandRevenue > 0
            ? Math.round((r.totalRevenue / grandRevenue) * 100)
            : 0,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredTransactions, services]);

  // 4. Products & Retail Aggregator
  const productSalesRows = useMemo(() => {
    const map = {};

    (products || []).forEach((p) => {
      const pName = p.productName || p.name;
      if (pName && String(pName).toLowerCase() !== "undefined") {
        map[pName] = {
          productName: pName,
          category: p.category || "Hair Care",
          unitsSold: 0,
          unitPrice: Number(p.price || p.amount || 0),
          totalRevenue: 0,
          latestSaleDate: "—",
        };
      }
    });

    filteredTransactions.forEach((tx) => {
      (tx.items || [])
        .filter((it) => it.isProduct)
        .forEach((it) => {
          const pName = it.name;
          if (!pName || String(pName).toLowerCase() === "undefined") return;
          if (!map[pName]) {
            const cat =
              products.find(
                (p) => (p.productName || p.name) === pName
              )?.category || "Hair Care";
            map[pName] = {
              productName: pName,
              category: cat,
              unitsSold: 0,
              unitPrice: Number(it.amount || 0),
              totalRevenue: 0,
              latestSaleDate: tx.dateDisplay,
            };
          }
          const qty = Number(it.quantity) || 1;
          const amt = Number(it.amount) || 0;
          map[pName].unitsSold += qty;
          map[pName].totalRevenue += amt * qty;
          map[pName].latestSaleDate = tx.dateDisplay;
        });
    });

    return Object.values(map).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredTransactions, products]);

  // Current active report definition
  const currentReportDef =
    REPORT_TYPES.find((r) => r.id === selectedReportType) || REPORT_TYPES[0];

  /* --------------------------------------------------------------------------
   * Active Table Records & Totals
   * ------------------------------------------------------------------------ */
  const activeRecords = useMemo(() => {
    if (selectedReportType === "daily_collection") return dailyCollectionRows;
    if (selectedReportType === "staff") return stylistPerformanceRows;
    if (selectedReportType === "services") return servicesPerformanceRows;
    if (selectedReportType === "products") return productSalesRows;
    // For guest, sales, tax: uses filteredTransactions
    return filteredTransactions;
  }, [
    selectedReportType,
    filteredTransactions,
    dailyCollectionRows,
    stylistPerformanceRows,
    servicesPerformanceRows,
    productSalesRows,
  ]);

  // KPI Summary Metrics
  const summaryMetrics = useMemo(() => {
    let totalRevenue = 0;
    let totalCash = 0;
    let totalDigital = 0;
    let totalTax = 0;

    filteredTransactions.forEach((tx) => {
      totalRevenue += Number(tx.total) || 0;
      totalCash += Number(tx.breakdown?.cash) || 0;
      totalDigital += Number(tx.breakdown?.digital) || 0;
      totalTax += Number(tx.tax) || 0;
    });

    return {
      recordsCount: activeRecords.length,
      totalOrders: filteredTransactions.length,
      totalRevenue,
      totalCash,
      totalDigital,
      totalTax,
      avgTicket:
        filteredTransactions.length > 0
          ? Math.round(totalRevenue / filteredTransactions.length)
          : 0,
    };
  }, [filteredTransactions, activeRecords]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setDatePreset("all");
    setCustomStartDate("");
    setCustomEndDate("");
    setFilterStaff("all");
    setFilterPaymentMode("all");
    setFilterStatus("all");
    setFilterGst("all");
  };

  /* --------------------------------------------------------------------------
   * Excel Export Generation (CSV with UTF-8 BOM)
   * ------------------------------------------------------------------------ */
  const handleExportExcel = () => {
    if (activeRecords.length === 0) {
      alert("No data available to export for the selected filters.");
      return;
    }

    const escapeCsv = (str) =>
      `"${String(str ?? "").replace(/"/g, '""').replace(/\n/g, " ")}"`;

    let headers = [];
    let rows = [];

    if (selectedReportType === "guest") {
      headers = [
        "Bill ID",
        "Guest Name",
        "Mobile Number",
        "Services Taken",
        "Stylist",
        "Visit Date",
        "Total (Rs)",
        "Payment Mode",
        "Status",
      ];
      rows = activeRecords.map((r) => [
        r.id || "N/A",
        r.clientName || "Walk-in Guest",
        r.phoneNumber || "—",
        Array.isArray(r.services) ? r.services.join(" | ") : "Salon Treatment",
        r.staff || "Unassigned",
        r.dateTimeDisplay || r.dateDisplay || "—",
        r.total || 0,
        r.paymentSummary || "CASH",
        r.status || "Completed",
      ]);
    } else if (selectedReportType === "sales") {
      headers = [
        "Invoice ID",
        "Date & Time",
        "Client Name",
        "Mobile",
        "Stylist",
        "Subtotal (Rs)",
        "Discount (Rs)",
        "Tax / GST (Rs)",
        "Net Total (Rs)",
        "Payment Mode",
        "Status",
      ];
      rows = activeRecords.map((r) => [
        r.id || "N/A",
        r.dateTimeDisplay || r.dateDisplay || "—",
        r.clientName || "Walk-in Guest",
        r.phoneNumber || "—",
        r.staff || "Unassigned",
        r.subtotal || 0,
        r.discount || 0,
        r.tax || 0,
        r.total || 0,
        r.paymentSummary || "CASH",
        r.status || "Completed",
      ]);
    } else if (selectedReportType === "daily_collection") {
      headers = [
        "Date",
        "Bills Count",
        "Total Collected (Rs)",
        "Cash Received (Rs)",
        "UPI / QR (Rs)",
        "Card (Rs)",
        "Split Bills Total (Rs)",
        "Average Ticket (Rs)",
      ];
      rows = activeRecords.map((r) => [
        r.dateDisplay || "—",
        r.billsCount || 0,
        r.totalRevenue || 0,
        r.cash || 0,
        r.upi || 0,
        r.card || 0,
        r.splitRevenue || 0,
        r.billsCount > 0 ? Math.round(r.totalRevenue / r.billsCount) : 0,
      ]);
    } else if (selectedReportType === "staff") {
      headers = [
        "Stylist Name",
        "Specialization",
        "Clients Served",
        "Services Done",
        "Total Revenue (Rs)",
        "Cash Collected (Rs)",
        "Digital Collected (Rs)",
        "Avg Per Client (Rs)",
      ];
      rows = activeRecords.map((r) => [
        r.name || "Stylist",
        r.specialization || "General Hair & Styling",
        r.clientsCount || 0,
        r.servicesCount || 0,
        r.totalRevenue || 0,
        r.cash || 0,
        r.digital || 0,
        r.clientsCount > 0 ? Math.round(r.totalRevenue / r.clientsCount) : 0,
      ]);
    } else if (selectedReportType === "services") {
      headers = [
        "Service Name",
        "Category",
        "Times Booked",
        "Total Revenue (Rs)",
        "Average Rate (Rs)",
        "% of Total Revenue",
      ];
      rows = activeRecords.map((r) => [
        r.serviceName || "Service",
        r.category || "Treatment",
        r.timesBooked || 0,
        r.totalRevenue || 0,
        r.avgRate || 0,
        `${r.percentOfTotal || 0}%`,
      ]);
    } else if (selectedReportType === "products") {
      headers = [
        "Product Name",
        "Category",
        "Units Sold",
        "Unit Price (Rs)",
        "Total Revenue (Rs)",
        "Latest Sale Date",
      ];
      rows = activeRecords.map((r) => [
        r.productName || "Product",
        r.category || "Hair Care",
        r.unitsSold || 0,
        r.unitPrice || 0,
        r.totalRevenue || 0,
        r.latestSaleDate || "—",
      ]);
    } else if (selectedReportType === "tax") {
      headers = [
        "Invoice No",
        "Date",
        "Client Name",
        "GSTIN",
        "Taxable Subtotal (Rs)",
        "CGST (Rs)",
        "SGST (Rs)",
        "Total GST (Rs)",
        "Invoice Total (Rs)",
      ];
      rows = activeRecords.map((r) => {
        const halfTax = Math.round(((Number(r.tax) || 0) / 2) * 100) / 100;
        return [
          r.id || "N/A",
          r.dateDisplay || "—",
          r.clientName || "Walk-in Guest",
          salonGst || "N/A",
          Math.max(0, (Number(r.subtotal) || 0) - (Number(r.discount) || 0)),
          halfTax,
          halfTax,
          Number(r.tax) || 0,
          Number(r.total) || 0,
        ];
      });
    }

    const csvContent = [
      escapeCsv(salonName.toUpperCase()),
      escapeCsv(`${currentReportDef.title} — Export`),
      escapeCsv(`Period: ${dateRangeBounds.label} | Generated on ${format(new Date(), "dd-MMM-yyyy hh:mm a")}`),
      escapeCsv(salonAddress ? `Address: ${salonAddress}` : ""),
      escapeCsv(`Total Records: ${activeRecords.length} | Net Revenue: Rs. ${summaryMetrics.totalRevenue}`),
      "",
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ]
      .filter((line) => line !== undefined)
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const cleanFileName = `${currentReportDef.title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${format(new Date(), "yyyyMMdd")}.csv`;
    link.setAttribute("download", cleanFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /* --------------------------------------------------------------------------
   * PDF Export Generation (A4 Vertical Default as requested)
   * ------------------------------------------------------------------------ */
  const handleExportPDF = () => {
    if (activeRecords.length === 0) {
      alert("No data available to print or export to PDF.");
      return;
    }

    const printWin = window.open("", "_blank");
    if (!printWin) {
      alert("Pop-up blocked. Please enable pop-ups to generate PDF.");
      return;
    }

    let tableHeadHtml = "";
    let tableRowsHtml = "";

    if (selectedReportType === "guest") {
      tableHeadHtml = `
        <tr>
          <th style="width:12%">BILL ID</th>
          <th style="width:18%">GUEST NAME</th>
          <th style="width:14%">MOBILE</th>
          <th style="width:20%">SERVICES</th>
          <th style="width:12%">STYLIST</th>
          <th style="width:10%">DATE</th>
          <th style="width:14%; text-align:right">TOTAL (₹)</th>
        </tr>
      `;
      tableRowsHtml = activeRecords
        .map(
          (r) => `
        <tr>
          <td><b>#${r.id || "N/A"}</b></td>
          <td>${r.clientName || "Walk-in Guest"}</td>
          <td>${r.phoneNumber || "—"}</td>
          <td>${Array.isArray(r.services) ? r.services.join(", ") : "Salon Treatment"}</td>
          <td>${r.staff || "Stylist"}</td>
          <td>${r.dateDisplay || "—"}</td>
          <td style="text-align:right; font-weight:bold;">₹${(Number(r.total) || 0).toLocaleString("en-IN")}</td>
        </tr>
      `
        )
        .join("");
    } else if (selectedReportType === "sales") {
      tableHeadHtml = `
        <tr>
          <th>INVOICE ID</th>
          <th>DATE & TIME</th>
          <th>CLIENT NAME</th>
          <th>STYLIST</th>
          <th style="text-align:right">SUBTOTAL</th>
          <th style="text-align:right">DISCOUNT</th>
          <th style="text-align:right">TAX</th>
          <th style="text-align:right">TOTAL (₹)</th>
          <th>PAYMENT</th>
        </tr>
      `;
      tableRowsHtml = activeRecords
        .map(
          (r) => `
        <tr>
          <td><b>#${r.id || "N/A"}</b></td>
          <td>${r.dateTimeDisplay || r.dateDisplay || "—"}</td>
          <td>${r.clientName || "Walk-in Guest"}</td>
          <td>${r.staff || "Stylist"}</td>
          <td style="text-align:right">₹${(Number(r.subtotal) || 0).toLocaleString("en-IN")}</td>
          <td style="text-align:right; color:#e11d48;">-₹${(Number(r.discount) || 0).toLocaleString("en-IN")}</td>
          <td style="text-align:right">₹${(Number(r.tax) || 0).toLocaleString("en-IN")}</td>
          <td style="text-align:right; font-weight:bold;">₹${(Number(r.total) || 0).toLocaleString("en-IN")}</td>
          <td>${r.paymentSummary || "CASH"}</td>
        </tr>
      `
        )
        .join("");
    } else if (selectedReportType === "daily_collection") {
      tableHeadHtml = `
        <tr>
          <th>DATE</th>
          <th style="text-align:center">BILLS</th>
          <th style="text-align:right">TOTAL (₹)</th>
          <th style="text-align:right">CASH (₹)</th>
          <th style="text-align:right">UPI (₹)</th>
          <th style="text-align:right">CARD (₹)</th>
          <th style="text-align:right">SPLIT (₹)</th>
        </tr>
      `;
      tableRowsHtml = activeRecords
        .map(
          (r) => `
        <tr>
          <td><b>${r.dateDisplay || "—"}</b></td>
          <td style="text-align:center">${r.billsCount || 0}</td>
          <td style="text-align:right; font-weight:bold;">₹${(Number(r.totalRevenue) || 0).toLocaleString("en-IN")}</td>
          <td style="text-align:right">₹${(Number(r.cash) || 0).toLocaleString("en-IN")}</td>
          <td style="text-align:right">₹${(Number(r.upi) || 0).toLocaleString("en-IN")}</td>
          <td style="text-align:right">₹${(Number(r.card) || 0).toLocaleString("en-IN")}</td>
          <td style="text-align:right">₹${(Number(r.splitRevenue) || 0).toLocaleString("en-IN")}</td>
        </tr>
      `
        )
        .join("");
    } else if (selectedReportType === "staff") {
      tableHeadHtml = `
        <tr>
          <th>STYLIST NAME</th>
          <th>SPECIALIZATION</th>
          <th style="text-align:center">CLIENTS</th>
          <th style="text-align:center">SERVICES</th>
          <th style="text-align:right">TOTAL REVENUE (₹)</th>
          <th style="text-align:right">CASH (₹)</th>
          <th style="text-align:right">DIGITAL (₹)</th>
        </tr>
      `;
      tableRowsHtml = activeRecords
        .map(
          (r) => `
        <tr>
          <td><b>${r.name || "Stylist"}</b></td>
          <td>${r.specialization || "General Hair & Styling"}</td>
          <td style="text-align:center">${r.clientsCount || 0}</td>
          <td style="text-align:center">${r.servicesCount || 0}</td>
          <td style="text-align:right; font-weight:bold;">₹${(Number(r.totalRevenue) || 0).toLocaleString("en-IN")}</td>
          <td style="text-align:right">₹${(Number(r.cash) || 0).toLocaleString("en-IN")}</td>
          <td style="text-align:right">₹${(Number(r.digital) || 0).toLocaleString("en-IN")}</td>
        </tr>
      `
        )
        .join("");
    } else if (selectedReportType === "services") {
      tableHeadHtml = `
        <tr>
          <th>SERVICE NAME</th>
          <th>CATEGORY</th>
          <th style="text-align:center">BOOKINGS</th>
          <th style="text-align:right">TOTAL REVENUE (₹)</th>
          <th style="text-align:right">AVG RATE (₹)</th>
          <th style="text-align:center">% SHARE</th>
        </tr>
      `;
      tableRowsHtml = activeRecords
        .map(
          (r) => `
        <tr>
          <td><b>${r.serviceName || "Service"}</b></td>
          <td>${r.category || "Treatment"}</td>
          <td style="text-align:center">${r.timesBooked || 0}</td>
          <td style="text-align:right; font-weight:bold;">₹${(Number(r.totalRevenue) || 0).toLocaleString("en-IN")}</td>
          <td style="text-align:right">₹${(Number(r.avgRate) || 0).toLocaleString("en-IN")}</td>
          <td style="text-align:center">${r.percentOfTotal || 0}%</td>
        </tr>
      `
        )
        .join("");
    } else if (selectedReportType === "products") {
      tableHeadHtml = `
        <tr>
          <th>PRODUCT NAME</th>
          <th>CATEGORY</th>
          <th style="text-align:center">UNITS SOLD</th>
          <th style="text-align:right">UNIT PRICE</th>
          <th style="text-align:right">TOTAL REVENUE (₹)</th>
          <th>LATEST SALE</th>
        </tr>
      `;
      tableRowsHtml = activeRecords
        .map(
          (r) => `
        <tr>
          <td><b>${r.productName || "Product"}</b></td>
          <td>${r.category || "Hair Care"}</td>
          <td style="text-align:center">${r.unitsSold || 0}</td>
          <td style="text-align:right">₹${(Number(r.unitPrice) || 0).toLocaleString("en-IN")}</td>
          <td style="text-align:right; font-weight:bold;">₹${(Number(r.totalRevenue) || 0).toLocaleString("en-IN")}</td>
          <td>${r.latestSaleDate || "—"}</td>
        </tr>
      `
        )
        .join("");
    } else {
      // GST / Tax Report
      tableHeadHtml = `
        <tr>
          <th>INVOICE NO</th>
          <th>DATE</th>
          <th>CLIENT NAME</th>
          <th>GSTIN</th>
          <th style="text-align:right">TAXABLE</th>
          <th style="text-align:right">CGST</th>
          <th style="text-align:right">SGST</th>
          <th style="text-align:right">TOTAL GST</th>
          <th style="text-align:right">TOTAL (₹)</th>
        </tr>
      `;
      tableRowsHtml = activeRecords
        .map((r) => {
          const halfTax = Math.round(((Number(r.tax) || 0) / 2) * 100) / 100;
          return `
          <tr>
            <td><b>#${r.id || "N/A"}</b></td>
            <td>${r.dateDisplay || "—"}</td>
            <td>${r.clientName || "Walk-in Guest"}</td>
            <td>${salonGst || "N/A"}</td>
            <td style="text-align:right">₹${Math.max(0, (Number(r.subtotal) || 0) - (Number(r.discount) || 0)).toLocaleString("en-IN")}</td>
            <td style="text-align:right">₹${halfTax.toLocaleString("en-IN")}</td>
            <td style="text-align:right">₹${halfTax.toLocaleString("en-IN")}</td>
            <td style="text-align:right">₹${(Number(r.tax) || 0).toLocaleString("en-IN")}</td>
            <td style="text-align:right; font-weight:bold;">₹${(Number(r.total) || 0).toLocaleString("en-IN")}</td>
          </tr>
        `;
        })
        .join("");
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${currentReportDef.title} — ${salonName}</title>
          <style>
            @page {
              size: A4 ${pdfOrientation};
              margin: ${pdfOrientation === "portrait" ? "8mm 8mm 8mm 8mm" : "8mm 10mm 8mm 10mm"};
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
              padding: 0;
              margin: 0;
              font-size: ${pdfOrientation === "portrait" ? "9.5px" : "10.5px"};
              line-height: 1.35;
            }
            .header-box {
              border-bottom: 2px solid #2563eb;
              padding-bottom: 10px;
              margin-bottom: 12px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .title-area h1 {
              margin: 0;
              font-size: 16px;
              font-weight: 800;
              color: #0f172a;
              letter-spacing: -0.02em;
            }
            .title-area p {
              margin: 2px 0 0;
              color: #475569;
              font-size: 10px;
            }
            .salon-info {
              text-align: right;
              font-size: 10px;
              color: #334155;
            }
            .salon-info b {
              font-size: 12px;
              color: #0f172a;
            }
            .kpi-row {
              display: flex;
              gap: 8px;
              margin-bottom: 12px;
            }
            .kpi-card {
              flex: 1;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 6px 8px;
            }
            .kpi-card .lbl {
              font-size: 8.5px;
              text-transform: uppercase;
              color: #64748b;
              font-weight: 700;
              letter-spacing: 0.05em;
            }
            .kpi-card .val {
              font-size: 13px;
              font-weight: 800;
              color: #0f172a;
              margin-top: 1px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: ${pdfOrientation === "portrait" ? "8.5px" : "9.5px"};
              table-layout: auto;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: ${pdfOrientation === "portrait" ? "4.5px 5px" : "5.5px 7px"};
              text-align: left;
              word-break: break-word;
            }
            th {
              background-color: #f1f5f9;
              color: #334155;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.03em;
            }
            tr:nth-child(even) td {
              background-color: #f8fafc;
            }
            .footer-note {
              margin-top: 12px;
              text-align: right;
              font-size: 8.5px;
              color: #94a3b8;
            }
          </style>
        </head>
        <body>
          <div class="header-box">
            <div class="title-area">
              <h1>${salonName.toUpperCase()}</h1>
              <p><b>Report:</b> ${currentReportDef.title} • <b>Date Range:</b> ${dateRangeBounds.label}</p>
              <p>Generated on ${format(new Date(), "dd MMM yyyy, hh:mm a")} • Orientation: ${pdfOrientation.toUpperCase()} • Showing ${activeRecords.length} records</p>
            </div>
            <div class="salon-info">
              <b>${salonName}</b><br/>
              ${salonAddress ? `${salonAddress}<br/>` : ""}
              ${salonPhone ? `Phone: ${salonPhone}<br/>` : ""}
              ${salonGst ? `GSTIN: ${salonGst}` : ""}
            </div>
          </div>

          <div class="kpi-row">
            <div class="kpi-card">
              <div class="lbl">Total Records</div>
              <div class="val">${activeRecords.length}</div>
            </div>
            <div class="kpi-card">
              <div class="lbl">Total Revenue</div>
              <div class="val">₹${summaryMetrics.totalRevenue.toLocaleString("en-IN")}</div>
            </div>
            <div class="kpi-card">
              <div class="lbl">Cash Collected</div>
              <div class="val">₹${summaryMetrics.totalCash.toLocaleString("en-IN")}</div>
            </div>
            <div class="kpi-card">
              <div class="lbl">Digital (UPI/Card)</div>
              <div class="val">₹${summaryMetrics.totalDigital.toLocaleString("en-IN")}</div>
            </div>
          </div>

          <table>
            <thead>
              ${tableHeadHtml}
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>

          <div class="footer-note">
            ${salonName} • Generated via Salon Management System • Format: A4 ${pdfOrientation.toUpperCase()}
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWin.document.write(html);
    printWin.document.close();
  };

  /* --------------------------------------------------------------------------
   * Configuration Form Component (Shared between Sidebar and Mobile Drawer)
   * ------------------------------------------------------------------------ */
  const renderConfigForm = () => (
    <div className="space-y-4">
      {/* 1. Select Report Type */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 block">
          Select Report Type
        </label>
        <div className="relative">
          <select
            value={selectedReportType}
            onChange={(e) => {
              setSelectedReportType(e.target.value);
              setIsMobileDrawerOpen(false);
            }}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm rounded-xl py-2.5 px-3 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium cursor-pointer"
          >
            {REPORT_TYPES.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {rt.title}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
            <ArrowUpDown className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* 2. Date Range Presets */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 block">
          Date Range (Optional)
        </label>
        <div className="relative">
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm rounded-xl py-2 px-3 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium cursor-pointer"
          >
            {DATE_PRESETS.map((dp) => (
              <option key={dp.id} value={dp.id}>
                {dp.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Custom Date Pickers when 'custom' selected */}
        {datePreset === "custom" && (
          <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in-50 duration-150">
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                From:
              </span>
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="text-xs h-8 rounded-lg bg-slate-50 border-slate-200"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                To:
              </span>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="text-xs h-8 rounded-lg bg-slate-50 border-slate-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Search Filter */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 block">
          Search Filter
        </label>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            placeholder="Search in data..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-8 h-9 text-xs sm:text-sm rounded-xl bg-slate-50 border-slate-200"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="pt-2 border-t border-slate-100">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
          Report Filters
        </p>

        {/* 4. Stylist / Staff Filter */}
        <div className="space-y-1.5 mb-3">
          <label className="text-xs font-semibold text-slate-700 block">
            Stylist / Barber
          </label>
          <select
            value={filterStaff}
            onChange={(e) => setFilterStaff(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium cursor-pointer"
          >
            <option value="all">All Stylists</option>
            {(barbers || []).map((b) => {
              const bName = b.name || b.userName || b.barberName;
              if (!bName) return null;
              return (
                <option key={b.id || bName} value={bName}>
                  {bName}
                </option>
              );
            })}
          </select>
        </div>

        {/* 5. Payment Method Filter */}
        <div className="space-y-1.5 mb-3">
          <label className="text-xs font-semibold text-slate-700 block">
            Payment Method
          </label>
          <select
            value={filterPaymentMode}
            onChange={(e) => setFilterPaymentMode(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium cursor-pointer"
          >
            <option value="all">All Payment Methods</option>
            <option value="cash">Cash Only</option>
            <option value="upi">UPI / Online QR Only</option>
            <option value="card">Card Only</option>
            <option value="split">Split Payments Only</option>
          </select>
        </div>

        {/* 6. GST Status Filter */}
        <div className="space-y-1.5 mb-3">
          <label className="text-xs font-semibold text-slate-700 block">
            GST Number / Tax
          </label>
          <select
            value={filterGst}
            onChange={(e) => setFilterGst(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium cursor-pointer"
          >
            <option value="all">All Invoices</option>
            <option value="gst_only">Tax Invoices (GST &gt; 0)</option>
            <option value="non_gst">Non-GST Invoices</option>
          </select>
        </div>

        {/* 7. Appointment Status Filter */}
        <div className="space-y-1.5 mb-4">
          <label className="text-xs font-semibold text-slate-700 block">
            Billing Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed / Settled</option>
            <option value="scheduled">Scheduled / In Queue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Reset Filters Button */}
        <Button
          type="button"
          variant="outline"
          onClick={handleResetFilters}
          className="w-full h-9 rounded-xl border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All Filters</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-full bg-slate-50/70 p-3 sm:p-5 lg:p-6 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-4">
        {/* ========================================================================= */}
        {/* Mobile Filter Button Bar (< 1024px)                                       */}
        {/* ========================================================================= */}
        <div className="flex lg:hidden items-center justify-between gap-2.5 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
                currentReportDef.bgColor
              )}
            >
              <currentReportDef.icon
                className={cn("w-4 h-4", currentReportDef.color)}
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {currentReportDef.shortTitle}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {activeRecords.length} records • {dateRangeBounds.label}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle Button */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  viewMode === "table"
                    ? "bg-white text-blue-700 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                )}
                title="Table View"
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  viewMode === "cards"
                    ? "bg-white text-blue-700 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                )}
                title="Mobile Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Filter Drawer Trigger */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="rounded-xl border-slate-200 text-slate-700 text-xs font-bold h-9 px-3 flex items-center gap-1.5 shadow-2xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Filter Drawer Overlay */}
        {isMobileDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                  <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                  <span>Configure Report</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {renderConfigForm()}

              <div className="pt-2">
                <Button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm"
                >
                  Apply &amp; View {activeRecords.length} Records
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main 2-Column Layout */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* ========================================================================= */}
          {/* Left Column: Report Configuration Sidebar (Desktop Only)                  */}
          {/* ========================================================================= */}
          <div
            className={cn(
              "w-full lg:w-80 shrink-0 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 transition-all duration-200 hidden lg:block",
              isConfigHidden && "lg:hidden"
            )}
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm sm:text-base">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <span>Report Configuration</span>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigHidden(true)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                title="Hide Configuration Panel"
              >
                <span>&lt; Hide</span>
              </button>
            </div>

            {renderConfigForm()}
          </div>

          {/* ========================================================================= */}
          {/* Right Column: Main Report Table & Actions                                 */}
          {/* ========================================================================= */}
          <div className="flex-1 min-w-0 w-full space-y-3.5">
            {/* Top Card: Report Header + Orientation + Excel & PDF Buttons */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                {/* Left: Icon + Title + Description */}
                <div className="flex items-start gap-3 min-w-0">
                  {/* Floating Toggle if Sidebar is Hidden on Desktop */}
                  {isConfigHidden && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsConfigHidden(false)}
                      className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold h-9 px-2.5 shrink-0 hidden lg:flex items-center gap-1.5 cursor-pointer"
                      title="Show Report Configuration"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                      <span>Filters</span>
                    </Button>
                  )}

                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                      currentReportDef.bgColor
                    )}
                  >
                    <currentReportDef.icon
                      className={cn("w-5 h-5", currentReportDef.color)}
                    />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight truncate">
                      {currentReportDef.title}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {currentReportDef.subtitle}
                    </p>
                  </div>
                </div>

                {/* Right: View Mode + PDF Orientation Toggle + Excel & PDF Export Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-center">
                  {/* Desktop View Mode Toggle */}
                  <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => setViewMode("table")}
                      className={cn(
                        "p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1",
                        viewMode === "table"
                          ? "bg-white text-blue-700 shadow-2xs"
                          : "text-slate-500 hover:text-slate-800"
                      )}
                      title="Table View"
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Table</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("cards")}
                      className={cn(
                        "p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1",
                        viewMode === "cards"
                          ? "bg-white text-blue-700 shadow-2xs"
                          : "text-slate-500 hover:text-slate-800"
                      )}
                      title="Cards View"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Cards</span>
                    </button>
                  </div>

                  {/* A4 Orientation Toggle */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => setPdfOrientation("portrait")}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
                        pdfOrientation === "portrait"
                          ? "bg-white text-blue-700 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      )}
                      title="Set PDF to A4 Vertical (Portrait)"
                    >
                      A4 Vert
                    </button>
                    <button
                      type="button"
                      onClick={() => setPdfOrientation("landscape")}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
                        pdfOrientation === "landscape"
                          ? "bg-white text-blue-700 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      )}
                      title="Set PDF to A4 Horizontal (Landscape)"
                    >
                      A4 Horiz
                    </button>
                  </div>

                  {/* Excel Button */}
                  <Button
                    type="button"
                    onClick={handleExportExcel}
                    className="h-9 px-3 sm:px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-[0.98] transition-all"
                    title="Export as Microsoft Excel / CSV"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Excel</span>
                  </Button>

                  {/* PDF Button */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleExportPDF}
                    className="h-9 px-3 sm:px-3.5 rounded-xl border-slate-200/90 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-[0.98] transition-all"
                    title={`Print or Save as PDF (${pdfOrientation === "portrait" ? "A4 Vertical" : "A4 Horizontal"})`}
                  >
                    <FileText className="w-3.5 h-3.5 text-rose-600" />
                    <span>PDF</span>
                  </Button>
                </div>
              </div>

              {/* Record Count Line & KPI Pills */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3.5 border-t border-slate-100 text-xs">
                <div className="text-slate-500 font-medium">
                  Showing{" "}
                  <span className="font-bold text-slate-800">
                    {activeRecords.length > 0 ? "1" : "0"}-
                    {activeRecords.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-slate-800">
                    {activeRecords.length}
                  </span>{" "}
                  records
                  {dateRangeBounds.label !== "All Time" && (
                    <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 px-2 py-0.5 rounded-full">
                      <Calendar className="w-3 h-3" />
                      {dateRangeBounds.label}
                    </span>
                  )}
                </div>

                {/* Quick Summary Aggregates */}
                <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
                  <div className="bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1 text-slate-600 text-[11px] shrink-0">
                    Revenue:{" "}
                    <b className="font-mono text-slate-900">
                      {formatCurrency(summaryMetrics.totalRevenue)}
                    </b>
                  </div>
                  <div className="bg-amber-50/80 border border-amber-200/80 rounded-lg px-2.5 py-1 text-amber-800 text-[11px] shrink-0">
                    Cash:{" "}
                    <b className="font-mono">
                      {formatCurrency(summaryMetrics.totalCash)}
                    </b>
                  </div>
                  <div className="bg-blue-50/80 border border-blue-200/80 rounded-lg px-2.5 py-1 text-blue-800 text-[11px] shrink-0">
                    Digital:{" "}
                    <b className="font-mono">
                      {formatCurrency(summaryMetrics.totalDigital)}
                    </b>
                  </div>
                </div>
              </div>
            </div>

            {/* =================================================================== */}
            {/* View Mode 1: Mobile Cards View (Optimized for Small Screens)        */}
            {/* =================================================================== */}
            {viewMode === "cards" ? (
              <div className="space-y-3">
                {activeRecords.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center text-slate-400">
                    <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No records found</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing filters</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* 1. Guest Report Cards */}
                    {selectedReportType === "guest" &&
                      activeRecords.map((r) => (
                        <div
                          key={r.id}
                          className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 space-y-2 hover:border-blue-200 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                              #{r.id}
                            </span>
                            <span
                              className={cn(
                                "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border",
                                r.status === "Completed"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              )}
                            >
                              {r.status}
                            </span>
                          </div>

                          <div>
                            <p className="font-bold text-sm text-slate-900 leading-tight">
                              {r.clientName}
                            </p>
                            <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{r.phoneNumber}</span>
                              <span className="text-slate-300">•</span>
                              <span>{r.dateDisplay}</span>
                            </p>
                          </div>

                          <div className="bg-slate-50 rounded-xl p-2 text-xs text-slate-600 flex justify-between items-center">
                            <span className="truncate pr-2">
                              {Array.isArray(r.services) ? r.services.join(", ") : "Treatment"}
                            </span>
                            <span className="font-semibold text-slate-800 shrink-0">
                              {r.staff}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                Amount Paid
                              </span>
                              <span className="font-mono font-black text-sm text-slate-900">
                                {formatCurrency(r.total)}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                Payment Mode
                              </span>
                              <span className="text-xs font-semibold text-slate-800">
                                {r.isSplit ? `Split (${r.paymentSummary})` : r.paymentMethod}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}

                    {/* 2. Sales Report Cards */}
                    {selectedReportType === "sales" &&
                      activeRecords.map((r) => (
                        <div
                          key={r.id}
                          className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 space-y-2 hover:border-emerald-200 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono font-bold text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                              #{r.id}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {r.dateTimeDisplay}
                            </span>
                          </div>

                          <div>
                            <p className="font-bold text-sm text-slate-900">{r.clientName}</p>
                            <p className="text-xs text-slate-500">Stylist: {r.staff}</p>
                          </div>

                          <div className="grid grid-cols-3 gap-1 bg-slate-50 rounded-xl p-2 text-center text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 block">Subtotal</span>
                              <span className="font-mono font-semibold">{formatCurrency(r.subtotal)}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">Discount</span>
                              <span className="font-mono text-rose-600 font-semibold">
                                {r.discount > 0 ? `-${formatCurrency(r.discount)}` : "—"}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">GST / Tax</span>
                              <span className="font-mono">{r.tax > 0 ? formatCurrency(r.tax) : "—"}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Net Total</span>
                              <span className="font-mono font-black text-sm text-emerald-700">
                                {formatCurrency(r.total)}
                              </span>
                            </div>
                            <span className="text-xs font-semibold text-slate-800">
                              {r.paymentSummary}
                            </span>
                          </div>
                        </div>
                      ))}

                    {/* 3. Daily Collection Cards */}
                    {selectedReportType === "daily_collection" &&
                      activeRecords.map((r) => (
                        <div
                          key={r.dateKey}
                          className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-slate-900">{r.dateDisplay}</span>
                            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                              {r.billsCount} bills
                            </span>
                          </div>
                          <div className="flex items-center justify-between font-mono">
                            <span className="text-xs text-slate-500">Total Collected:</span>
                            <span className="font-black text-sm text-slate-900">{formatCurrency(r.totalRevenue)}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100 text-xs font-mono text-center">
                            <div className="bg-amber-50/70 p-1.5 rounded-lg border border-amber-100">
                              <span className="text-[10px] text-amber-700 block font-sans font-bold">CASH</span>
                              <span className="font-bold text-amber-800">{formatCurrency(r.cash)}</span>
                            </div>
                            <div className="bg-blue-50/70 p-1.5 rounded-lg border border-blue-100">
                              <span className="text-[10px] text-blue-700 block font-sans font-bold">UPI</span>
                              <span className="font-bold text-blue-800">{formatCurrency(r.upi)}</span>
                            </div>
                            <div className="bg-indigo-50/70 p-1.5 rounded-lg border border-indigo-100">
                              <span className="text-[10px] text-indigo-700 block font-sans font-bold">CARD</span>
                              <span className="font-bold text-indigo-800">{formatCurrency(r.card)}</span>
                            </div>
                          </div>
                        </div>
                      ))}

                    {/* 4. Stylist Cards */}
                    {selectedReportType === "staff" &&
                      activeRecords.map((r) => (
                        <div
                          key={r.name}
                          className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-sm text-slate-900">{r.name}</p>
                            <span className="text-xs font-bold font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                              {formatCurrency(r.totalRevenue)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{r.specialization}</p>
                          <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-xl">
                            <span>Clients: <b>{r.clientsCount}</b></span>
                            <span>Services: <b>{r.servicesCount}</b></span>
                            <span>Digital: <b>{formatCurrency(r.digital)}</b></span>
                          </div>
                        </div>
                      ))}

                    {/* 5. Services Cards */}
                    {selectedReportType === "services" &&
                      activeRecords.map((r) => (
                        <div
                          key={r.serviceName}
                          className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-sm text-slate-900">{r.serviceName}</p>
                            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                              {r.timesBooked} bookings
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{r.category}</p>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                            <span>Revenue: <b className="font-mono">{formatCurrency(r.totalRevenue)}</b></span>
                            <span className="text-blue-600 font-bold">{r.percentOfTotal}% share</span>
                          </div>
                        </div>
                      ))}

                    {/* 6. Products Cards */}
                    {selectedReportType === "products" &&
                      activeRecords.map((r) => (
                        <div
                          key={r.productName}
                          className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-sm text-slate-900">{r.productName}</p>
                            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                              {r.unitsSold} sold
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{r.category} • Rate: {formatCurrency(r.unitPrice)}</p>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                            <span>Revenue: <b className="font-mono">{formatCurrency(r.totalRevenue)}</b></span>
                            <span className="text-slate-400">Latest: {r.latestSaleDate}</span>
                          </div>
                        </div>
                      ))}

                    {/* 7. Tax Cards */}
                    {selectedReportType === "tax" &&
                      activeRecords.map((r) => (
                        <div
                          key={r.id}
                          className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-xs text-cyan-700">#{r.id}</span>
                            <span className="text-xs text-slate-500">{r.dateDisplay}</span>
                          </div>
                          <p className="font-bold text-sm text-slate-900">{r.clientName}</p>
                          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-xl text-xs font-mono">
                            <div>Taxable: <b>{formatCurrency(r.subtotal - r.discount)}</b></div>
                            <div>Total GST: <b className="text-cyan-700">{formatCurrency(r.tax)}</b></div>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-xs">
                            <span className="text-slate-400 font-sans">Net Total:</span>
                            <span className="font-mono font-black text-sm text-slate-900">{formatCurrency(r.total)}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              /* =================================================================== */
              /* View Mode 2: Modern Responsive Table View with Sticky Columns       */
              /* =================================================================== */
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
                {/* Scroll Indicator Prompt on Small Screens */}
                <div className="flex sm:hidden items-center justify-between px-4 py-1.5 bg-slate-100/70 border-b border-slate-200/60 text-[10px] text-slate-500 font-medium">
                  <span>Swipe horizontally to view all columns</span>
                  <span className="font-bold text-blue-600">→</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    {/* Table Header */}
                    <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider sticky top-0 z-20">
                      {selectedReportType === "guest" && (
                        <tr>
                          <th className="py-3 px-4 sticky left-0 bg-slate-50 z-20 shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                            BILL ID
                          </th>
                          <th className="py-3 px-4">GUEST NAME</th>
                          <th className="py-3 px-4">MOBILE</th>
                          <th className="py-3 px-4">SERVICES</th>
                          <th className="py-3 px-4">STYLIST</th>
                          <th className="py-3 px-4">VISIT DATE</th>
                          <th className="py-3 px-4 text-right">TOTAL</th>
                          <th className="py-3 px-4">PAYMENT</th>
                          <th className="py-3 px-4">STATUS</th>
                        </tr>
                      )}

                      {selectedReportType === "sales" && (
                        <tr>
                          <th className="py-3 px-4 sticky left-0 bg-slate-50 z-20 shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                            INVOICE ID
                          </th>
                          <th className="py-3 px-4">DATE &amp; TIME</th>
                          <th className="py-3 px-4">CLIENT NAME</th>
                          <th className="py-3 px-4">STYLIST</th>
                          <th className="py-3 px-4 text-right">SUBTOTAL</th>
                          <th className="py-3 px-4 text-right">DISCOUNT</th>
                          <th className="py-3 px-4 text-right">TAX</th>
                          <th className="py-3 px-4 text-right">TOTAL</th>
                          <th className="py-3 px-4">PAYMENT</th>
                          <th className="py-3 px-4">STATUS</th>
                        </tr>
                      )}

                      {selectedReportType === "daily_collection" && (
                        <tr>
                          <th className="py-3 px-4 sticky left-0 bg-slate-50 z-20 shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                            DATE
                          </th>
                          <th className="py-3 px-4 text-center">BILLS COUNT</th>
                          <th className="py-3 px-4 text-right">TOTAL COLLECTED</th>
                          <th className="py-3 px-4 text-right">CASH IN HAND</th>
                          <th className="py-3 px-4 text-right">UPI / ONLINE</th>
                          <th className="py-3 px-4 text-right">CARD</th>
                          <th className="py-3 px-4 text-right">SPLIT REVENUE</th>
                        </tr>
                      )}

                      {selectedReportType === "staff" && (
                        <tr>
                          <th className="py-3 px-4 sticky left-0 bg-slate-50 z-20 shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                            STYLIST NAME
                          </th>
                          <th className="py-3 px-4">SPECIALIZATION</th>
                          <th className="py-3 px-4 text-center">CLIENTS SERVED</th>
                          <th className="py-3 px-4 text-center">SERVICES COMPLETED</th>
                          <th className="py-3 px-4 text-right">TOTAL REVENUE</th>
                          <th className="py-3 px-4 text-right">CASH</th>
                          <th className="py-3 px-4 text-right">DIGITAL</th>
                        </tr>
                      )}

                      {selectedReportType === "services" && (
                        <tr>
                          <th className="py-3 px-4 sticky left-0 bg-slate-50 z-20 shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                            SERVICE NAME
                          </th>
                          <th className="py-3 px-4">CATEGORY</th>
                          <th className="py-3 px-4 text-center">TIMES BOOKED</th>
                          <th className="py-3 px-4 text-right">TOTAL REVENUE</th>
                          <th className="py-3 px-4 text-right">AVERAGE RATE</th>
                          <th className="py-3 px-4 text-center">% REVENUE SHARE</th>
                        </tr>
                      )}

                      {selectedReportType === "products" && (
                        <tr>
                          <th className="py-3 px-4 sticky left-0 bg-slate-50 z-20 shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                            PRODUCT NAME
                          </th>
                          <th className="py-3 px-4">CATEGORY</th>
                          <th className="py-3 px-4 text-center">UNITS SOLD</th>
                          <th className="py-3 px-4 text-right">UNIT PRICE</th>
                          <th className="py-3 px-4 text-right">TOTAL REVENUE</th>
                          <th className="py-3 px-4">LATEST SALE</th>
                        </tr>
                      )}

                      {selectedReportType === "tax" && (
                        <tr>
                          <th className="py-3 px-4 sticky left-0 bg-slate-50 z-20 shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                            INVOICE NO
                          </th>
                          <th className="py-3 px-4">DATE</th>
                          <th className="py-3 px-4">CLIENT NAME</th>
                          <th className="py-3 px-4">GSTIN</th>
                          <th className="py-3 px-4 text-right">TAXABLE VALUE</th>
                          <th className="py-3 px-4 text-right">CGST</th>
                          <th className="py-3 px-4 text-right">SGST</th>
                          <th className="py-3 px-4 text-right">TOTAL GST</th>
                          <th className="py-3 px-4 text-right">NET TOTAL</th>
                        </tr>
                      )}
                    </thead>

                    {/* Table Body */}
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {activeRecords.length === 0 ? (
                        <tr>
                          <td
                            colSpan={10}
                            className="py-12 text-center text-slate-400 font-medium"
                          >
                            <div className="flex flex-col items-center justify-center">
                              <Search className="w-8 h-8 text-slate-300 mb-2" />
                              <p className="text-sm font-semibold text-slate-600">
                                No records found
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Try clearing filters or selecting a different date range.
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleResetFilters}
                                className="mt-3 rounded-lg text-xs"
                              >
                                Reset Filters
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <>
                          {/* 1. Guest Report Rows */}
                          {selectedReportType === "guest" &&
                            activeRecords.map((r) => (
                              <tr
                                key={r.id}
                                className="hover:bg-slate-50/70 transition-colors"
                              >
                                <td className="py-3 px-4 font-mono font-bold text-slate-900 sticky left-0 bg-white shadow-[2px_0_4px_rgba(0,0,0,0.03)] z-10">
                                  #{r.id || "N/A"}
                                </td>
                                <td className="py-3 px-4 font-semibold text-slate-900">
                                  {r.clientName || "Walk-in Guest"}
                                </td>
                                <td className="py-3 px-4 text-slate-500 font-mono">
                                  {r.phoneNumber || "—"}
                                </td>
                                <td
                                  className="py-3 px-4 text-slate-600 max-w-[200px] truncate"
                                  title={Array.isArray(r.services) ? r.services.join(", ") : ""}
                                >
                                  {Array.isArray(r.services) && r.services.length > 0
                                    ? r.services.join(", ")
                                    : "Salon Treatment"}
                                </td>
                                <td className="py-3 px-4 text-slate-600">
                                  {r.staff || "Unassigned"}
                                </td>
                                <td className="py-3 px-4 text-slate-500">
                                  {r.dateDisplay || "—"}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                                  {formatCurrency(r.total)}
                                </td>
                                <td className="py-3 px-4">
                                  {r.isSplit ? (
                                    <div className="space-y-0.5">
                                      <span className="inline-block text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                        Split
                                      </span>
                                      <p className="text-[11px] text-slate-500 font-medium truncate max-w-[150px]">
                                        {r.paymentSummary || "Multiple"}
                                      </p>
                                    </div>
                                  ) : (
                                    <span
                                      className={cn(
                                        "inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded border",
                                        (r.paymentMethod || "").toLowerCase() === "cash"
                                          ? "bg-amber-50 text-amber-700 border-amber-200"
                                          : (r.paymentMethod || "").toLowerCase().includes("card")
                                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                          : "bg-blue-50 text-blue-700 border-blue-200"
                                      )}
                                    >
                                      {r.paymentMethod || "CASH"}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <span
                                    className={cn(
                                      "inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border",
                                      r.status === "Completed"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : r.status === "Cancelled"
                                        ? "bg-rose-50 text-rose-700 border-rose-200"
                                        : "bg-amber-50 text-amber-700 border-amber-200"
                                    )}
                                  >
                                    {r.status || "Completed"}
                                  </span>
                                </td>
                              </tr>
                            ))}

                          {/* 2. Sales Report Rows */}
                          {selectedReportType === "sales" &&
                            activeRecords.map((r) => (
                              <tr
                                key={r.id}
                                className="hover:bg-slate-50/70 transition-colors"
                              >
                                <td className="py-3 px-4 font-mono font-bold text-slate-900 sticky left-0 bg-white shadow-[2px_0_4px_rgba(0,0,0,0.03)] z-10">
                                  #{r.id || "N/A"}
                                </td>
                                <td className="py-3 px-4 text-slate-500">
                                  {r.dateTimeDisplay || r.dateDisplay || "—"}
                                </td>
                                <td className="py-3 px-4 font-semibold text-slate-900">
                                  {r.clientName || "Walk-in Guest"}
                                </td>
                                <td className="py-3 px-4 text-slate-600">
                                  {r.staff || "Unassigned"}
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-slate-700">
                                  {formatCurrency(r.subtotal)}
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-rose-600 font-semibold">
                                  {r.discount > 0 ? `-${formatCurrency(r.discount)}` : "—"}
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-slate-600">
                                  {r.tax > 0 ? formatCurrency(r.tax) : "—"}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                                  {formatCurrency(r.total)}
                                </td>
                                <td className="py-3 px-4">
                                  {r.isSplit ? (
                                    <span className="inline-block text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                      Split ({r.paymentSummary || "Multiple"})
                                    </span>
                                  ) : (
                                    <span className="font-semibold text-slate-800 uppercase">
                                      {r.paymentMethod || "CASH"}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <span
                                    className={cn(
                                      "inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border",
                                      r.status === "Completed"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-amber-50 text-amber-700 border-amber-200"
                                    )}
                                  >
                                    {r.status || "Completed"}
                                  </span>
                                </td>
                              </tr>
                            ))}

                          {/* 3. Daily Collection Rows */}
                          {selectedReportType === "daily_collection" &&
                            activeRecords.map((r) => (
                              <tr
                                key={r.dateKey}
                                className="hover:bg-slate-50/70 transition-colors"
                              >
                                <td className="py-3 px-4 font-bold text-slate-900 sticky left-0 bg-white shadow-[2px_0_4px_rgba(0,0,0,0.03)] z-10">
                                  {r.dateDisplay || "—"}
                                </td>
                                <td className="py-3 px-4 text-center font-bold text-slate-700">
                                  {r.billsCount || 0}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-black text-blue-700 text-sm">
                                  {formatCurrency(r.totalRevenue)}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">
                                  {formatCurrency(r.cash)}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-blue-600">
                                  {formatCurrency(r.upi)}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-indigo-600">
                                  {formatCurrency(r.card)}
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-purple-700 font-semibold">
                                  {formatCurrency(r.splitRevenue)}
                                </td>
                              </tr>
                            ))}

                          {/* 4. Stylist Rows */}
                          {selectedReportType === "staff" &&
                            activeRecords.map((r) => (
                              <tr
                                key={r.name}
                                className="hover:bg-slate-50/70 transition-colors"
                              >
                                <td className="py-3 px-4 font-bold text-slate-900 sticky left-0 bg-white shadow-[2px_0_4px_rgba(0,0,0,0.03)] z-10">
                                  {r.name || "Stylist"}
                                </td>
                                <td className="py-3 px-4 text-slate-500 text-xs">
                                  {r.specialization || "General Hair & Styling"}
                                </td>
                                <td className="py-3 px-4 text-center font-bold text-slate-800">
                                  {r.clientsCount || 0}
                                </td>
                                <td className="py-3 px-4 text-center font-semibold text-slate-700">
                                  {r.servicesCount || 0}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                                  {formatCurrency(r.totalRevenue)}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">
                                  {formatCurrency(r.cash)}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-blue-700">
                                  {formatCurrency(r.digital)}
                                </td>
                              </tr>
                            ))}

                          {/* 5. Services Rows */}
                          {selectedReportType === "services" &&
                            activeRecords.map((r) => (
                              <tr
                                key={r.serviceName}
                                className="hover:bg-slate-50/70 transition-colors"
                              >
                                <td className="py-3 px-4 font-bold text-slate-900 sticky left-0 bg-white shadow-[2px_0_4px_rgba(0,0,0,0.03)] z-10">
                                  {r.serviceName || "Service"}
                                </td>
                                <td className="py-3 px-4 text-slate-500">
                                  {r.category || "Treatment"}
                                </td>
                                <td className="py-3 px-4 text-center font-bold text-slate-800">
                                  {r.timesBooked || 0}x
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                                  {formatCurrency(r.totalRevenue)}
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-slate-600">
                                  {formatCurrency(r.avgRate)}
                                </td>
                                <td className="py-3 px-4 text-center font-bold text-blue-600">
                                  {r.percentOfTotal || 0}%
                                </td>
                              </tr>
                            ))}

                          {/* 6. Products Rows */}
                          {selectedReportType === "products" &&
                            activeRecords.map((r) => (
                              <tr
                                key={r.productName}
                                className="hover:bg-slate-50/70 transition-colors"
                              >
                                <td className="py-3 px-4 font-bold text-slate-900 sticky left-0 bg-white shadow-[2px_0_4px_rgba(0,0,0,0.03)] z-10">
                                  {r.productName || "Product"}
                                </td>
                                <td className="py-3 px-4 text-slate-500">
                                  {r.category || "Hair Care"}
                                </td>
                                <td className="py-3 px-4 text-center font-bold text-slate-800">
                                  {r.unitsSold || 0}
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-slate-600">
                                  {formatCurrency(r.unitPrice)}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                                  {formatCurrency(r.totalRevenue)}
                                </td>
                                <td className="py-3 px-4 text-slate-500">
                                  {r.latestSaleDate || "—"}
                                </td>
                              </tr>
                            ))}

                          {/* 7. Tax Rows */}
                          {selectedReportType === "tax" &&
                            activeRecords.map((r) => {
                              const halfTax =
                                Math.round(((Number(r.tax) || 0) / 2) * 100) / 100;
                              return (
                                <tr
                                  key={r.id}
                                  className="hover:bg-slate-50/70 transition-colors"
                                >
                                  <td className="py-3 px-4 font-mono font-bold text-slate-900 sticky left-0 bg-white shadow-[2px_0_4px_rgba(0,0,0,0.03)] z-10">
                                    #{r.id || "N/A"}
                                  </td>
                                  <td className="py-3 px-4 text-slate-500">
                                    {r.dateDisplay || "—"}
                                  </td>
                                  <td className="py-3 px-4 font-semibold text-slate-900">
                                    {r.clientName || "Walk-in Guest"}
                                  </td>
                                  <td className="py-3 px-4 font-mono text-slate-500">
                                    {salonGst || "N/A"}
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono text-slate-700">
                                    {formatCurrency(
                                      Math.max(
                                        0,
                                        (Number(r.subtotal) || 0) -
                                          (Number(r.discount) || 0)
                                      )
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono text-slate-600">
                                    {formatCurrency(halfTax)}
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono text-slate-600">
                                    {formatCurrency(halfTax)}
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono font-bold text-cyan-700">
                                    {formatCurrency(r.tax)}
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                                    {formatCurrency(r.total)}
                                  </td>
                                </tr>
                              );
                            })}
                        </>
                      )}
                    </tbody>

                    {/* Summary Totals Footer Row (Accurately column-aligned) */}
                    {activeRecords.length > 0 && (
                      <tfoot className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-900 sticky bottom-0 z-10">
                        {selectedReportType === "guest" && (
                          <tr>
                            <td className="py-3 px-4 sticky left-0 bg-slate-100 shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                              TOTALS:
                            </td>
                            <td className="py-3 px-4" colSpan={5}>
                              {activeRecords.length} records computed
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-black text-sm text-blue-700">
                              {formatCurrency(summaryMetrics.totalRevenue)}
                            </td>
                            <td colSpan={2} className="py-3 px-4 text-slate-600 font-medium">
                              Cash: {formatCurrency(summaryMetrics.totalCash)} • Digital: {formatCurrency(summaryMetrics.totalDigital)}
                            </td>
                          </tr>
                        )}

                        {selectedReportType === "sales" && (
                          <tr>
                            <td className="py-3 px-4 sticky left-0 bg-slate-100 shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                              TOTALS:
                            </td>
                            <td className="py-3 px-4" colSpan={6}>
                              {activeRecords.length} invoices computed
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-black text-sm text-blue-700">
                              {formatCurrency(summaryMetrics.totalRevenue)}
                            </td>
                            <td colSpan={2} className="py-3 px-4 text-slate-600 font-medium">
                              Cash: {formatCurrency(summaryMetrics.totalCash)} • Digital: {formatCurrency(summaryMetrics.totalDigital)}
                            </td>
                          </tr>
                        )}

                        {selectedReportType === "daily_collection" && (
                          <tr>
                            <td className="py-3 px-4 sticky left-0 bg-slate-100 shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                              TOTALS:
                            </td>
                            <td className="py-3 px-4 text-center">
                              {dailyCollectionRows.reduce((sum, r) => sum + r.billsCount, 0)} bills
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-black text-sm text-blue-700">
                              {formatCurrency(summaryMetrics.totalRevenue)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-amber-700">
                              {formatCurrency(summaryMetrics.totalCash)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-blue-600">
                              {formatCurrency(summaryMetrics.totalDigital - dailyCollectionRows.reduce((sum, r) => sum + r.card, 0))}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-indigo-600">
                              {formatCurrency(dailyCollectionRows.reduce((sum, r) => sum + r.card, 0))}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-purple-700">
                              {formatCurrency(dailyCollectionRows.reduce((sum, r) => sum + r.splitRevenue, 0))}
                            </td>
                          </tr>
                        )}

                        {selectedReportType === "staff" && (
                          <tr>
                            <td className="py-3 px-4 sticky left-0 bg-slate-100 shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                              TOTALS:
                            </td>
                            <td className="py-3 px-4 text-slate-500 font-normal">
                              {stylistPerformanceRows.length} stylists
                            </td>
                            <td className="py-3 px-4 text-center">
                              {stylistPerformanceRows.reduce((sum, r) => sum + r.clientsCount, 0)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {stylistPerformanceRows.reduce((sum, r) => sum + r.servicesCount, 0)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-black text-sm text-blue-700">
                              {formatCurrency(summaryMetrics.totalRevenue)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-amber-700">
                              {formatCurrency(summaryMetrics.totalCash)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-blue-700">
                              {formatCurrency(summaryMetrics.totalDigital)}
                            </td>
                          </tr>
                        )}

                        {selectedReportType === "services" && (
                          <tr>
                            <td className="py-3 px-4 sticky left-0 bg-slate-100 shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                              TOTALS:
                            </td>
                            <td className="py-3 px-4 text-slate-500 font-normal">
                              {servicesPerformanceRows.length} treatments
                            </td>
                            <td className="py-3 px-4 text-center">
                              {servicesPerformanceRows.reduce((sum, r) => sum + r.timesBooked, 0)} bookings
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-black text-sm text-blue-700">
                              {formatCurrency(summaryMetrics.totalRevenue)}
                            </td>
                            <td colSpan={2} className="py-3 px-4 text-center font-bold text-blue-700">
                              100% Volume
                            </td>
                          </tr>
                        )}

                        {selectedReportType === "products" && (
                          <tr>
                            <td className="py-3 px-4 sticky left-0 bg-slate-100 shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                              TOTALS:
                            </td>
                            <td className="py-3 px-4 text-slate-500 font-normal">
                              {productSalesRows.length} inventory items
                            </td>
                            <td className="py-3 px-4 text-center">
                              {productSalesRows.reduce((sum, r) => sum + r.unitsSold, 0)} units
                            </td>
                            <td className="py-3 px-4 text-slate-400">—</td>
                            <td className="py-3 px-4 text-right font-mono font-black text-sm text-blue-700">
                              {formatCurrency(productSalesRows.reduce((sum, r) => sum + r.totalRevenue, 0))}
                            </td>
                            <td className="py-3 px-4 text-slate-400">—</td>
                          </tr>
                        )}

                        {selectedReportType === "tax" && (
                          <tr>
                            <td className="py-3 px-4 sticky left-0 bg-slate-100 shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                              TOTALS:
                            </td>
                            <td className="py-3 px-4" colSpan={3}>
                              {activeRecords.length} invoices
                            </td>
                            <td className="py-3 px-4 text-right font-mono">
                              {formatCurrency(summaryMetrics.totalRevenue - summaryMetrics.totalTax)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono">
                              {formatCurrency(Math.round((summaryMetrics.totalTax / 2) * 100) / 100)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono">
                              {formatCurrency(Math.round((summaryMetrics.totalTax / 2) * 100) / 100)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-cyan-700">
                              {formatCurrency(summaryMetrics.totalTax)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-black text-sm text-blue-700">
                              {formatCurrency(summaryMetrics.totalRevenue)}
                            </td>
                          </tr>
                        )}
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
