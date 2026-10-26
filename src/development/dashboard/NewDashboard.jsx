import React, { useState, useMemo, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  UserCheck,
  Calendar,
  CreditCard,
  Package,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertCircle,
  Scissors,
  Plus,
  ChevronRight,
  Receipt,
  Sparkles,
  Phone,
  ShieldCheck,
} from "lucide-react";
import clsx from "clsx";
import Context from "../Context/Context";
import { getCollectionBreakdown } from "../lib/paymentUtils";

/* ---------- helpers ---------- */

const parseNumeric = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const sanitized = value.replace(/[^0-9.-]/g, "");
    if (!sanitized) return null;
    const parsed = Number(sanitized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const formatCurrency = (amount) => {
  const numeric = Number(amount) || 0;
  const isNegative = numeric < 0;
  const absolute = Math.abs(numeric);
  return `${isNegative ? "-" : ""}₹${absolute.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

const formatTimeOrDate = (dateTimeVal) => {
  if (!dateTimeVal) return "Scheduled";
  try {
    const d =
      typeof dateTimeVal === "number"
        ? new Date(dateTimeVal < 10000000000 ? dateTimeVal * 1000 : dateTimeVal)
        : new Date(dateTimeVal);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
  } catch (e) {}
  if (typeof dateTimeVal === "string" && dateTimeVal.length > 0) {
    return dateTimeVal;
  }
  return "Today";
};

const avatarGradients = [
  "from-blue-600 to-indigo-600",
  "from-purple-600 to-pink-600",
  "from-emerald-600 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-red-600",
];

export default function NewDashboard() {
  const navigate = useNavigate();
  const {
    institutionData,
    userData,
    appointments = [],
    barbers = [],
    clients = [],
    services = [],
    products = [],
    billing = [],
    orders = [],
  } = useContext(Context);

  const [activeQueueFilter, setActiveQueueFilter] = useState("All");

  /* ---------- 100% Dynamic Original Data Processing (All Salon Data) ---------- */
  const dashboardData = useMemo(() => {
    // 1. Appointments counts & status breakdown
    let completedCount = 0;
    let inServiceCount = 0;
    let scheduledCount = 0;
    let cancelledCount = 0;

    appointments.forEach((appt) => {
      const status = (
        appt?.status ||
        appt?.Status ||
        appt?.appointment_status ||
        "scheduled"
      ).toLowerCase();
      if (status.includes("complete") || status.includes("done")) {
        completedCount++;
      } else if (
        status.includes("chair") ||
        status.includes("serving") ||
        status.includes("service") ||
        status.includes("progress")
      ) {
        inServiceCount++;
      } else if (status.includes("cancel")) {
        cancelledCount++;
      } else {
        scheduledCount++;
      }
    });

    const totalApptsCount = appointments.length;

    // 2. Billing & POS Revenue calculation
    let totalRevenue = 0;
    let cashRevenue = 0;
    let upiRevenue = 0;
    let cardRevenue = 0;
    let billsCount = 0;

    const seenBillIds = new Set();
    const billedItems = [];

    // First collect from billing array (if populated)
    if (Array.isArray(billing) && billing.length > 0) {
      billing.forEach((b, idx) => {
        const id = String(b.id || b.billId || b.appointmentId || `bill-${idx}`);
        seenBillIds.add(id);
        billedItems.push(b);
      });
    }

    // Next collect from appointments where status is completed or has settled billing data
    appointments.forEach((appt, idx) => {
      const status = String(
        appt?.status || appt?.Status || appt?.appointment_status || ""
      ).toLowerCase();
      const isCompleted =
        status.includes("complete") ||
        status.includes("done") ||
        status.includes("settled") ||
        status.includes("paid");

      const apptId = String(
        appt.appointmentId || appt.id || appt._id || `appt-${idx}`
      );

      // Only count as settled bill if completed/billed, and not already counted
      if (isCompleted && !seenBillIds.has(apptId)) {
        seenBillIds.add(apptId);
        billedItems.push(appt);
      }
    });

    // Compute totals and channel breakdown from all billed items using getCollectionBreakdown
    billedItems.forEach((item) => {
      const breakdown = getCollectionBreakdown(item);
      if (
        breakdown.total > 0 ||
        breakdown.cash > 0 ||
        breakdown.upi > 0 ||
        breakdown.card > 0
      ) {
        billsCount++;
        totalRevenue += breakdown.total;
        cashRevenue += breakdown.cash;
        upiRevenue += breakdown.upi;
        cardRevenue += breakdown.card;
      }
    });

    // If no completed appointments yet, check if any appointment has an amount
    if (billsCount === 0 && appointments.length > 0) {
      appointments.forEach((appt) => {
        const amt =
          parseNumeric(
            appt?.total ||
              appt?.totalAmount ||
              appt?.amount ||
              appt?.price ||
              appt?.subtotal
          ) || 0;
        if (amt > 0) {
          const breakdown = getCollectionBreakdown(appt);
          billsCount++;
          totalRevenue += breakdown.total || amt;
          cashRevenue += breakdown.cash || amt;
          upiRevenue += breakdown.upi;
          cardRevenue += breakdown.card;
        }
      });
    }

    const channelTotal = cashRevenue + upiRevenue + cardRevenue;
    const baseRev = channelTotal > 0 ? channelTotal : totalRevenue;
    const cashPct = baseRev > 0 ? Math.round((cashRevenue / baseRev) * 100) : 0;
    const upiPct = baseRev > 0 ? Math.round((upiRevenue / baseRev) * 100) : 0;
    const cardPct =
      baseRev > 0 ? Math.max(100 - (cashPct + upiPct), 0) : 0;

    const avgTicket =
      billsCount > 0 ? Math.round(totalRevenue / billsCount) : 0;

    // 3. Clients: Dynamic count from registered clients + appointments
    const uniqueClientsSet = new Set();
    clients.forEach((c) => {
      const n = (
        c.clientName ||
        c.userName ||
        c.name ||
        c.fullName ||
        c.customerName ||
        ""
      ).trim();
      if (n) uniqueClientsSet.add(n.toLowerCase());
    });
    appointments.forEach((a) => {
      const n = (
        a.client?.clientName ||
        a.clientName ||
        a.userName ||
        a.client?.name ||
        a.customerName ||
        a.name ||
        (typeof a.client === "string" ? a.client : "") ||
        ""
      ).trim();
      if (n && n.toLowerCase() !== "walk-in client") {
        uniqueClientsSet.add(n.toLowerCase());
      }
    });
    const totalClientsCount = Math.max(clients.length, uniqueClientsSet.size);

    // 4. Staff / Stylists: Dynamic discovery from barbers + appointments + billing
    const stylistsMap = new Map();

    // Add all registered barbers from Context
    barbers.forEach((b, idx) => {
      const name = (
        b.name ||
        b.barberName ||
        b.staffName ||
        b.fullName ||
        b.stylistName ||
        b.stylist ||
        b.barber?.name ||
        ""
      ).trim();
      if (!name) return;

      const role =
        Array.isArray(b.specialization) && b.specialization.length > 0
          ? b.specialization.join(", ")
          : b.yearsOfExperience
          ? `${b.yearsOfExperience} yrs exp`
          : b.role || b.specialty || b.title || "Senior Stylist";

      stylistsMap.set(name.toLowerCase(), {
        id: b.staffId || b._id || b.id || `barber-${idx}`,
        name,
        role,
        status: b.status || "available",
        gradient: avatarGradients[stylistsMap.size % avatarGradients.length],
        appointmentsCount: 0,
        revenue: 0,
      });
    });

    // Also discover any assigned stylists from appointments
    appointments.forEach((appt) => {
      const staffVal =
        appt.staff ||
        appt.Staff ||
        appt.staff_name ||
        appt.barberName ||
        appt.barber?.name ||
        (typeof appt.barber === "string" ? appt.barber : null) ||
        appt.stylist;
      if (!staffVal || typeof staffVal !== "string") return;
      const trimmed = staffVal.trim();
      if (
        !trimmed ||
        trimmed.toLowerCase() === "unassigned" ||
        trimmed.toLowerCase() === "assigned stylist"
      ) {
        return;
      }

      const key = trimmed.toLowerCase();
      if (!stylistsMap.has(key)) {
        stylistsMap.set(key, {
          id: `appt-staff-${stylistsMap.size}`,
          name: trimmed,
          role: "Stylist",
          status: "available",
          gradient: avatarGradients[stylistsMap.size % avatarGradients.length],
          appointmentsCount: 0,
          revenue: 0,
        });
      }
    });

    // Also discover stylists from billing records
    billing.forEach((bill) => {
      const staffVal =
        bill.staff || bill.Staff || bill.stylist || bill.barberName;
      if (!staffVal || typeof staffVal !== "string") return;
      const trimmed = staffVal.trim();
      if (!trimmed || trimmed.toLowerCase() === "unassigned") return;

      const key = trimmed.toLowerCase();
      if (!stylistsMap.has(key)) {
        stylistsMap.set(key, {
          id: `bill-staff-${stylistsMap.size}`,
          name: trimmed,
          role: "Stylist",
          status: "available",
          gradient: avatarGradients[stylistsMap.size % avatarGradients.length],
          appointmentsCount: 0,
          revenue: 0,
        });
      }
    });

    // Compute genuine appointments count and revenue for each stylist
    const staffList = Array.from(stylistsMap.values()).map((st) => {
      const stNameLower = st.name.toLowerCase();
      let count = 0;
      let rev = 0;

      appointments.forEach((appt) => {
        const aStaff = (
          appt.staff ||
          appt.Staff ||
          appt.staff_name ||
          appt.barberName ||
          appt.barber?.name ||
          (typeof appt.barber === "string" ? appt.barber : null) ||
          appt.stylist ||
          ""
        )
          .toLowerCase()
          .trim();
        const aStaffId = String(
          appt.staffId || appt.barberId || appt.barber?._id || ""
        );

        if (
          (aStaff && aStaff === stNameLower) ||
          (aStaffId && aStaffId === String(st.id))
        ) {
          count++;
          rev +=
            parseNumeric(
              appt.total || appt.totalAmount || appt.price || appt.amount
            ) || 0;
        }
      });

      billing.forEach((bill) => {
        const bStaff = (
          bill.staff ||
          bill.Staff ||
          bill.stylist ||
          bill.barberName ||
          ""
        )
          .toLowerCase()
          .trim();
        if (bStaff && bStaff === stNameLower) {
          rev +=
            parseNumeric(bill.total || bill.amount || bill.finalAmount) || 0;
        }
      });

      return {
        ...st,
        appointmentsCount: count,
        revenue: rev,
      };
    });

    const totalStaffCount = Math.max(barbers.length, staffList.length);

    // 5. Inventory: Low Stock calculation
    const lowStockAlerts = products.filter((p) => {
      const qty = parseNumeric(p.quantity ?? p.stock ?? p.currentStock ?? 0);
      const threshold = parseNumeric(
        p.threshold ?? p.minStock ?? p.minimumStock ?? 5
      );
      return qty !== null && qty <= threshold;
    });

    // 6. Normalizing Appointments for Display (100% Dynamic, no fallback names)
    const displayAppointments = appointments.map((appt, i) => {
      const clientName =
        appt.client?.clientName ||
        appt.clientName ||
        appt.userName ||
        appt.name ||
        appt.client?.name ||
        appt.customerName ||
        (typeof appt.client === "string" ? appt.client : null) ||
        "Client";

      const phone =
        appt.client?.phone ||
        appt.clientPhone ||
        appt.phone ||
        appt.contact ||
        appt.phoneNumber ||
        appt.client?.phoneNumber ||
        "";

      const service =
        appt.service ||
        appt.Service ||
        appt.service_name ||
        appt.serviceName ||
        appt.service?.name ||
        (Array.isArray(appt.services) && appt.services.length > 0
          ? appt.services.join(", ")
          : null) ||
        "Salon Service";

      const stylist =
        appt.staff ||
        appt.Staff ||
        appt.staff_name ||
        appt.barberName ||
        appt.barber?.name ||
        (typeof appt.barber === "string" ? appt.barber : null) ||
        appt.stylist ||
        "Unassigned";

      const amount =
        parseNumeric(
          appt.total ||
            appt.totalAmount ||
            appt.TotalAmount ||
            appt.price ||
            appt.amount
        ) || 0;
      const statusRaw = (
        appt.status ||
        appt.Status ||
        appt.appointment_status ||
        "Scheduled"
      ).trim();
      let statusNormalized = "Scheduled";
      const sLower = statusRaw.toLowerCase();
      if (sLower.includes("complete") || sLower.includes("done")) {
        statusNormalized = "Completed";
      } else if (
        sLower.includes("chair") ||
        sLower.includes("progress") ||
        sLower.includes("service")
      ) {
        statusNormalized = "In Service";
      } else if (sLower.includes("cancel")) {
        statusNormalized = "Cancelled";
      }

      return {
        id: appt._id || appt.id || i,
        clientName,
        phone,
        service,
        stylist,
        time: formatTimeOrDate(appt.dateTime || appt.date || appt.time),
        amount,
        status: statusNormalized,
        rawStatus: statusRaw,
      };
    });

    return {
      totalApptsCount,
      completedCount,
      inServiceCount,
      scheduledCount,
      cancelledCount,
      totalRevenue,
      cashRevenue,
      upiRevenue,
      cardRevenue,
      cashPct,
      upiPct,
      cardPct,
      billsCount,
      avgTicket,
      totalClientsCount,
      totalStaffCount,
      staffList,
      lowStockAlerts,
      displayAppointments,
    };
  }, [appointments, billing, barbers, clients, services, products, orders]);

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-3.5 sm:space-y-5 bg-[#f8fafc] min-h-full font-sans text-slate-800">
      {/* 1. Color-Coded 4 KPI Cards: Symmetric 2x2 on Mobile, 4x1 on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Emerald / Teal Theme - POS Revenue */}
        <div
          onClick={() => navigate("/dashboard/billing")}
          className="bg-gradient-to-br from-emerald-50/60 via-teal-50/30 to-white rounded-2xl p-3 sm:p-4.5 border border-emerald-200/80 hover:border-emerald-400 shadow-2xs hover:shadow-md hover:shadow-emerald-500/10 transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
        >
          {/* Top color accent strip */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400" />

          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 uppercase tracking-wider truncate">
                Total Revenue
              </span>
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs shadow-emerald-600/30 group-hover:scale-105 transition-transform shrink-0">
                <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>

            <div className="mt-2 sm:mt-2.5">
              <div className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                {formatCurrency(dashboardData.totalRevenue)}
              </div>
              <div className="text-[10px] sm:text-xs font-medium text-emerald-700 mt-0.5 truncate">
                {dashboardData.billsCount} bills settled
              </div>
            </div>
          </div>

          <div className="mt-2.5 sm:mt-3 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-600 gap-1 flex-wrap">
            <span>Cash: {formatCurrency(dashboardData.cashRevenue)}</span>
            <span className="text-blue-700 font-semibold truncate">
              UPI: {formatCurrency(dashboardData.upiRevenue)}
            </span>
            {dashboardData.cardRevenue > 0 && (
              <span className="text-purple-700 font-semibold truncate">
                Card: {formatCurrency(dashboardData.cardRevenue)}
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Blue / Indigo Theme - Appointments */}
        <div
          onClick={() => navigate("/dashboard/appointments")}
          className="bg-gradient-to-br from-blue-50/60 via-indigo-50/30 to-white rounded-2xl p-3 sm:p-4.5 border border-blue-200/80 hover:border-blue-400 shadow-2xs hover:shadow-md hover:shadow-blue-500/10 transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-400" />

          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] sm:text-[11px] font-bold text-blue-800 uppercase tracking-wider truncate">
                Appointments
              </span>
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-xs shadow-blue-600/30 group-hover:scale-105 transition-transform shrink-0">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>

            <div className="mt-2 sm:mt-2.5">
              <div className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                {dashboardData.totalApptsCount} Bookings
              </div>
              <div className="text-[10px] sm:text-xs font-medium text-blue-700 mt-0.5 truncate">
                {dashboardData.inServiceCount} currently in-service
              </div>
            </div>
          </div>

          <div className="mt-2.5 sm:mt-3 pt-2 border-t border-blue-200/60 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-600">
            <span>Done: {dashboardData.completedCount}</span>
            <span className="text-blue-700 font-semibold truncate ml-1">
              Queue: {dashboardData.scheduledCount}
            </span>
          </div>
        </div>

        {/* Card 3: Purple / Fuchsia Theme - Clients */}
        <div
          onClick={() => navigate("/dashboard/clients")}
          className="bg-gradient-to-br from-purple-50/60 via-fuchsia-50/30 to-white rounded-2xl p-3 sm:p-4.5 border border-purple-200/80 hover:border-purple-400 shadow-2xs hover:shadow-md hover:shadow-purple-500/10 transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-400" />

          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] sm:text-[11px] font-bold text-purple-800 uppercase tracking-wider truncate">
                Client Base
              </span>
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-fuchsia-500 text-white flex items-center justify-center shadow-xs shadow-purple-600/30 group-hover:scale-105 transition-transform shrink-0">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>

            <div className="mt-2 sm:mt-2.5">
              <div className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                {dashboardData.totalClientsCount} Clients
              </div>
              <div className="text-[10px] sm:text-xs font-medium text-purple-700 mt-0.5 truncate">
                Active registered directory
              </div>
            </div>
          </div>

          <div className="mt-2.5 sm:mt-3 pt-2 border-t border-purple-200/60 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-600">
            <span>Directory</span>
            <span className="text-purple-700 font-semibold flex items-center gap-0.5">
              <span>View</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 4: Amber / Warm Sunset Theme - Stylists */}
        <div
          onClick={() => navigate("/dashboard/staffs")}
          className="bg-gradient-to-br from-amber-50/60 via-orange-50/30 to-white rounded-2xl p-3 sm:p-4.5 border border-amber-200/80 hover:border-amber-400 shadow-2xs hover:shadow-md hover:shadow-amber-500/10 transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400" />

          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] sm:text-[11px] font-bold text-amber-900 uppercase tracking-wider truncate">
                Stylists & Staff
              </span>
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-xs shadow-orange-500/30 group-hover:scale-105 transition-transform shrink-0">
                <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>

            <div className="mt-2 sm:mt-2.5">
              <div className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                {dashboardData.totalStaffCount} Stylists
              </div>
              <div className="text-[10px] sm:text-xs font-medium text-amber-800 mt-0.5 truncate">
                Salon team on duty
              </div>
            </div>
          </div>

          <div className="mt-2.5 sm:mt-3 pt-2 border-t border-amber-200/60 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-600">
            <span>Roster</span>
            <span className="text-amber-800 font-semibold flex items-center gap-0.5">
              <span>Team</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Operational Layout: Fully Responsive & Symmetric */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4">
        {/* Left Column (8 cols): Appointments Schedule */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                    Appointments Schedule
                  </h2>
                </div>
                <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-700 rounded-full">
                  {dashboardData.displayAppointments.length}
                </span>
              </div>
              <Link
                to="/dashboard/appointments"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto"
              >
                <span>Full Roster</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Filter Pills with clear active styling */}
            <div className="flex items-center gap-1.5 my-3 overflow-x-auto pb-1 sm:pb-0">
              {["All", "In Service", "Scheduled", "Completed"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveQueueFilter(filter)}
                  className={clsx(
                    "px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer shrink-0",
                    activeQueueFilter === filter
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Appointments List or Genuine Empty State */}
            {dashboardData.displayAppointments.length === 0 ? (
              <div className="py-12 text-center bg-blue-50/30 rounded-xl border border-dashed border-blue-200 my-2">
                <Calendar className="mx-auto w-10 h-10 text-blue-300 mb-2" />
                <p className="text-sm font-bold text-slate-800">
                  No appointments scheduled yet
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Book client appointments to manage live chairs and stylist assignments in real time.
                </p>
                <button
                  onClick={() => navigate("/dashboard/appointments?tab=new")}
                  className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Book First Appointment</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2 mt-2">
                {dashboardData.displayAppointments
                  .filter(
                    (appt) =>
                      activeQueueFilter === "All" ||
                      appt.status.toLowerCase() === activeQueueFilter.toLowerCase()
                  )
                  .slice(0, 6)
                  .map((appt) => {
                    const isInService = appt.status === "In Service";
                    const isCompleted = appt.status === "Completed";
                    const isScheduled = appt.status === "Scheduled";

                    return (
                      <div
                        key={appt.id}
                        className={clsx(
                          "p-3 rounded-xl border transition-all duration-150",
                          isInService
                            ? "bg-blue-50/40 border-blue-200/80 hover:bg-blue-50/70"
                            : isCompleted
                            ? "bg-emerald-50/30 border-emerald-200/80 hover:bg-emerald-50/60"
                            : "bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/60"
                        )}
                      >
                        {/* Mobile Symmetrical Layout / Desktop Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          {/* Client info & time badge */}
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-center shrink-0 min-w-16 shadow-2xs">
                              <span className="text-xs font-bold block leading-tight">
                                {appt.time}
                              </span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900 truncate">
                                  {appt.clientName}
                                </span>
                                {appt.phone && (
                                  <span className="text-[11px] text-slate-400 font-medium">
                                    • {appt.phone}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-blue-700 font-semibold truncate mt-0.5">
                                {appt.service}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                                <span>Stylist:</span>
                                <span className="text-slate-800 font-semibold">
                                  {appt.stylist}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Symmetrical Bottom Row on Mobile / Right side on Desktop */}
                          <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 shrink-0">
                            {appt.amount > 0 && (
                              <div className="text-left sm:text-right">
                                <span className="text-xs font-black text-slate-900">
                                  {formatCurrency(appt.amount)}
                                </span>
                              </div>
                            )}

                            <span
                              className={clsx(
                                "text-[10px] font-bold px-2.5 py-0.5 rounded-full",
                                isInService &&
                                  "bg-blue-600 text-white shadow-2xs",
                                isCompleted &&
                                  "bg-emerald-600 text-white shadow-2xs",
                                isScheduled &&
                                  "bg-amber-100 text-amber-900 border border-amber-300",
                                appt.status === "Cancelled" &&
                                  "bg-slate-200 text-slate-700 border border-slate-300"
                              )}
                            >
                              {appt.status}
                            </span>

                            <button
                              onClick={() => navigate("/dashboard/billing")}
                              className="px-2.5 py-1 text-xs font-bold text-blue-600 hover:text-white hover:bg-blue-600 bg-white border border-blue-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
                            >
                              POS Bill
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {dashboardData.displayAppointments.slice(0, 6).length} of{" "}
              {dashboardData.displayAppointments.length} bookings
            </span>
            <Link
              to="/dashboard/appointments"
              className="font-bold text-blue-600 hover:text-blue-700"
            >
              Manage all →
            </Link>
          </div>
        </div>

        {/* Right Column (4 cols): Financial Register, Stylists & Stock Alerts */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-3.5 sm:space-y-4">
          {/* Payment Mode Register */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Collections Breakdown
                </h2>
              </div>
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
                {formatCurrency(dashboardData.totalRevenue)}
              </span>
            </div>

            <div className="space-y-3 mt-3.5">
              {/* Cash */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs shadow-emerald-500" />
                    Cash Counter
                  </span>
                  <span className="text-slate-900 font-bold">
                    {formatCurrency(dashboardData.cashRevenue)} ({dashboardData.cashPct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${dashboardData.cashPct}%` }}
                  />
                </div>
              </div>

              {/* UPI */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-2xs shadow-blue-500" />
                    UPI & QR Payments
                  </span>
                  <span className="text-slate-900 font-bold">
                    {formatCurrency(dashboardData.upiRevenue)} ({dashboardData.upiPct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${dashboardData.upiPct}%` }}
                  />
                </div>
              </div>

              {/* Card */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-2xs shadow-purple-500" />
                    Card POS Machines
                  </span>
                  <span className="text-slate-900 font-bold">
                    {formatCurrency(dashboardData.cardRevenue)} ({dashboardData.cardPct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${dashboardData.cardPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Symmetrical mini stats */}
            <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                  Settled Invoices
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {dashboardData.billsCount} Bills
                </span>
              </div>
              <div className="p-2 rounded-xl bg-blue-50 border border-blue-200/80">
                <span className="text-[10px] text-blue-700 uppercase font-bold block">
                  Avg Ticket Size
                </span>
                <span className="text-xs font-bold text-blue-800">
                  {formatCurrency(dashboardData.avgTicket)}
                </span>
              </div>
            </div>
          </div>

          {/* Stylists on Duty */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Stylists on Floor
                </h2>
              </div>
              <Link
                to="/dashboard/staffs"
                className="text-xs font-bold text-purple-700 hover:text-purple-800"
              >
                Team ({dashboardData.totalStaffCount})
              </Link>
            </div>

            {dashboardData.staffList.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No stylists registered yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 mt-1">
                {dashboardData.staffList.slice(0, 4).map((st) => (
                  <div
                    key={st.id}
                    className="py-2.5 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={clsx(
                          "w-7 h-7 rounded-full bg-gradient-to-tr text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs",
                          st.gradient
                        )}
                      >
                        {st.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {st.name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {st.role}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-bold text-purple-800 bg-purple-50 border border-purple-200/70 px-2 py-0.5 rounded-full">
                        {st.appointmentsCount} bookings
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inventory Alerts with Color Coding */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Inventory Alerts
                </h2>
              </div>
              <Link
                to="/dashboard/inventory"
                className="text-xs font-bold text-rose-700 hover:text-rose-800"
              >
                All SKU ({products.length})
              </Link>
            </div>

            {dashboardData.lowStockAlerts.length === 0 ? (
              <div className="py-3 flex items-center gap-2.5 text-xs text-emerald-800 bg-emerald-50/80 p-3 rounded-xl border border-emerald-200/70 mt-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="font-medium">All products are healthy & in stock.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 mt-1">
                {dashboardData.lowStockAlerts.slice(0, 3).map((item, idx) => (
                  <div
                    key={item._id || item.id || idx}
                    className="py-2.5 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {item.productName || item.name}
                      </div>
                      <div className="text-[11px] text-rose-700 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-500" />
                        <span>Only {item.quantity ?? item.stock} units left</span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate("/dashboard/vendor-management")}
                      className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-300 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      Reorder
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
