import React, { useState, useContext, useMemo } from "react";
import {
  TrendingUp,
  Receipt,
  Award,
  User,
  Clock,
  BarChart3,
  PieChart,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Zap,
  Crown,
  Scissors,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { cn } from "../lib/utils";
import Context from "../Context/Context";
import { format } from "date-fns";
import { formatCurrency, parseAppointmentDate } from "./BillPrintModal";
import { FaMoneyBillWave, FaCreditCard, FaQrcode } from "react-icons/fa";
import { getCollectionBreakdown, isSplitPayment, formatPaymentSummary } from "../lib/paymentUtils";

/* ----------------------------------------------------------------------------
 * Safe date helpers (an invalid date passed to date-fns format() would crash
 * the whole page, so every date is validated first)
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

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const endOfDay = (d) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

/* ----------------------------------------------------------------------------
 * Formatting helpers
 * -------------------------------------------------------------------------- */

const compactCurrency = (n) => {
  const v = Number(n) || 0;
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1).replace(/\.0$/, "")}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1).replace(/\.0$/, "")}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `₹${Math.round(v)}`;
};

const niceMax = (v) => {
  if (!v || v <= 0) return 1000;
  const pow = 10 ** Math.floor(Math.log10(v));
  const m = v / pow;
  const nice = m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10;
  return nice * pow;
};

const hourLabel = (h) => {
  const suffix = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr} ${suffix}`;
};
const hourShort = (h) => {
  const suffix = h >= 12 ? "p" : "a";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}${suffix}`;
};

/* ----------------------------------------------------------------------------
 * Period configuration
 * -------------------------------------------------------------------------- */

const PERIODS = [
  { id: "today", label: "Today" },
  { id: "week", label: "7 Days" },
  { id: "this_month", label: "This Month" },
  { id: "all", label: "All Time" },
];

const getPeriodRange = (period) => {
  const now = new Date();
  const today0 = startOfDay(now);

  if (period === "today") {
    const y = new Date(today0);
    y.setDate(y.getDate() - 1);
    return {
      start: today0,
      end: endOfDay(now),
      prevStart: y,
      prevEnd: endOfDay(y),
      compare: true,
      prevLabel: "vs yesterday",
      trendTitle: "Today (Hourly)",
    };
  }
  if (period === "week") {
    const s = new Date(today0);
    s.setDate(s.getDate() - 6);
    const ps = new Date(s);
    ps.setDate(ps.getDate() - 7);
    const pe = new Date(s);
    pe.setMilliseconds(-1);
    return {
      start: s,
      end: endOfDay(now),
      prevStart: ps,
      prevEnd: pe,
      compare: true,
      prevLabel: "vs previous 7 days",
      trendTitle: "7-Day (Daily)",
    };
  }
  if (period === "this_month") {
    const s = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    const ps = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const pe = endOfDay(
      new Date(now.getFullYear(), now.getMonth() - 1, Math.min(now.getDate(), prevMonthDays))
    );
    return {
      start: s,
      end: endOfDay(now),
      prevStart: ps,
      prevEnd: pe,
      compare: true,
      prevLabel: "vs same days last month",
      trendTitle: "This Month (Date-wise)",
    };
  }
  return {
    start: null,
    end: null,
    prevStart: null,
    prevEnd: null,
    compare: false,
    prevLabel: "",
    trendTitle: "All-Time (Monthly)",
  };
};

const inRange = (b, start, end) => {
  if (!start || !end) return true;
  const t = b.rawDate.getTime();
  return t >= start.getTime() && t <= end.getTime();
};

const computeStats = (bills) => {
  let totalRev = 0;
  let cash = 0;
  let upi = 0;
  let card = 0;

  bills.forEach((b) => {
    totalRev += b.total || 0;
    const bd = getCollectionBreakdown(b);
    cash += bd.cash;
    upi += bd.upi;
    card += bd.card;
  });

  const orders = bills.length;
  const channelTotal = cash + upi + card;
  return {
    totalRev,
    orders,
    avgTicket: orders > 0 ? Math.round(totalRev / orders) : 0,
    cash,
    upi,
    card,
    channelTotal,
    cashPct: channelTotal > 0 ? (cash / channelTotal) * 100 : 0,
    upiPct: channelTotal > 0 ? (upi / channelTotal) * 100 : 0,
    cardPct: channelTotal > 0 ? (card / channelTotal) * 100 : 0,
  };
};

/* ----------------------------------------------------------------------------
 * Small presentational components (module level = stable identity)
 * -------------------------------------------------------------------------- */

const Panel = ({ className, children }) => (
  <section
    className={cn(
      "bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/40",
      className
    )}
  >
    {children}
  </section>
);

const PanelHeader = ({ icon: Icon, iconClass, title, subtitle, right }) => (
  <div className="flex items-start justify-between gap-3 mb-4">
    <div className="flex items-center gap-2.5 min-w-0">
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
          iconClass || "bg-slate-100 text-slate-600"
        )}
      >
        <Icon className="w-[18px] h-[18px]" />
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-slate-900 leading-tight truncate">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>}
      </div>
    </div>
    {right}
  </div>
);

const Delta = ({ current, previous, label }) => {
  if (previous === null || previous === undefined) return null;
  if (previous === 0 && current === 0) {
    return <span className="text-[11px] text-slate-400 font-medium">No change {label}</span>;
  }
  if (previous === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
        <ArrowUpRight className="w-3 h-3" /> New {label}
      </span>
    );
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  const up = pct >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-semibold",
        up ? "text-emerald-600" : "text-rose-600"
      )}
    >
      {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(pct)}%<span className="text-slate-400 font-medium"> {label}</span>
    </span>
  );
};

const KPI_TONES = {
  emerald: { icon: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-500" },
  blue: { icon: "bg-blue-50 text-blue-600", bar: "bg-blue-500" },
  amber: { icon: "bg-amber-50 text-amber-600", bar: "bg-amber-500" },
  indigo: { icon: "bg-indigo-50 text-indigo-600", bar: "bg-indigo-500" },
};

const KpiCard = ({ tone, icon: Icon, label, value, footer }) => {
  const t = KPI_TONES[tone];
  return (
    <div className="relative bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/40 p-3.5 sm:p-4 overflow-hidden">
      <span className={cn("absolute left-0 top-0 h-full w-1", t.bar)} />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500 truncate">{label}</span>
        <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", t.icon)}>
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <div className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tracking-tight truncate">
        {value}
      </div>
      <div className="mt-1 min-h-[16px] truncate">{footer}</div>
    </div>
  );
};

const Highlight = ({ icon: Icon, tone, label, value, sub }) => (
  <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200/80 px-3 py-2.5 min-w-0">
    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", tone)}>
      <Icon className="w-4 h-4" />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-bold text-slate-900 truncate">{value}</p>
      {sub && <p className="text-[11px] text-slate-400 truncate">{sub}</p>}
    </div>
  </div>
);

const EmptyHint = ({ icon: Icon, text }) => (
  <div className="flex flex-col items-center justify-center text-center py-10 text-slate-400">
    <Icon className="w-8 h-8 mb-2 text-slate-300" />
    <p className="text-sm font-medium text-slate-500">{text}</p>
  </div>
);

const PAY_BADGE = {
  cash: "bg-amber-50 text-amber-700 border-amber-200",
  upi: "bg-blue-50 text-blue-700 border-blue-200",
  card: "bg-indigo-50 text-indigo-700 border-indigo-200",
  split: "bg-purple-50 text-purple-700 border-purple-200",
};

const payKey = (mode) => {
  const m = String(mode || "").toLowerCase();
  if (m === "split") return "split";
  if (m === "cash") return "cash";
  if (m.includes("card")) return "card";
  return "upi";
};

/* ----------------------------------------------------------------------------
 * Page
 * -------------------------------------------------------------------------- */

const RevenuePage = () => {
  const { appointments, barbers } = useContext(Context);

  const [revenuePeriod, setRevenuePeriod] = useState("today");
  const [activeTrend, setActiveTrend] = useState(null);
  const [activeHour, setActiveHour] = useState(null);

  /* ---- normalize every completed appointment into a bill record ---- */
  const allBills = useMemo(() => {
    const list = [];
    (appointments || []).forEach((apt) => {
      const st = String(apt.status || apt.Status || apt.appointment_status || "").toLowerCase();
      if (!(st === "completed" || st === "settled" || st === "paid")) return;

      const rawDate = tryParseDate(apt.dateTime) || tryParseDate(apt.createdAt);
      if (!rawDate) return;

      const staffId = apt.staffId || apt.staff || apt.Staff || apt.staff_name || "";

      let normServices = [];
      if (Array.isArray(apt.services)) {
        normServices = apt.services.map((s) =>
          typeof s === "string"
            ? { name: s, amount: null, qty: 1 }
            : {
                name: s?.serviceName || s?.name || "Service",
                amount: s?.amount != null && Number(s.amount) > 0 ? Number(s.amount) : null,
                qty: Number(s?.quantity) || 1,
              }
        );
      } else if (typeof apt.service === "string" && apt.service.trim()) {
        normServices = apt.service
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((name) => ({ name, amount: null, qty: 1 }));
      }

      const subtotal = Number(apt.subtotal || apt.amount || 0);
      const tax = Number(apt.tax || 0);
      const discount = Number(apt.discountAmount || apt.discount || apt.discount_value || 0);
      const computed = subtotal + tax - discount;
      const total = Number(apt.total != null ? apt.total : computed > 0 ? computed : subtotal) || 0;

      const foundStaff = (barbers || []).find(
        (b) => b.id === staffId || b.staffId === staffId || b.name === staffId
      );

      list.push({
        id: apt.appointmentId || apt.id,
        clientName: apt.client?.clientName || apt.clientName || "Walk-in Client",
        rawDate,
        dateStr: safeFormat(rawDate, "yyyy-MM-dd", ""),
        hour: rawDate.getHours(),
        services: normServices,
        total,
        paymentMethod: apt.paymentMode || apt.paymentMethod || apt.PaymentMethod || "Cash",
        paymentMode: apt.paymentMode || apt.paymentMethod || apt.PaymentMethod || "Cash",
        paymentSplit: apt.paymentSplit || apt.paymentsplit || null,
        paymentSummary: apt.paymentSummary || "",
        cashAmount: apt.cashAmount,
        upiAmount: apt.upiAmount,
        cardAmount: apt.cardAmount,
        payments: apt.payments || [],
        staff: foundStaff ? foundStaff.name : staffId || "Unassigned",
      });
    });
    return list;
  }, [appointments, barbers]);

  const range = useMemo(() => getPeriodRange(revenuePeriod), [revenuePeriod]);

  const revenueBills = useMemo(
    () => allBills.filter((b) => inRange(b, range.start, range.end)),
    [allBills, range]
  );

  const prevBills = useMemo(
    () => (range.compare ? allBills.filter((b) => inRange(b, range.prevStart, range.prevEnd)) : []),
    [allBills, range]
  );

  const stats = useMemo(() => computeStats(revenueBills), [revenueBills]);
  const prevStats = useMemo(() => (range.compare ? computeStats(prevBills) : null), [prevBills, range]);

  /* ---- dynamic trend based on revenuePeriod:
     - "today": hourly progression (time-wise)
     - "week": 7 days progression (day-wise)
     - "this_month": 1st to today progression (date-wise)
     - "all": last 12 months progression (month-wise)
  ---- */
  const trendData = useMemo(() => {
    const now = new Date();

    if (revenuePeriod === "today") {
      let minH = 9;
      let maxH = 21; // 9 PM
      revenueBills.forEach((b) => {
        if (b.hour < minH) minH = Math.max(0, b.hour);
        if (b.hour > maxH) maxH = Math.min(23, b.hour);
      });

      const list = [];
      for (let h = minH; h <= maxH; h++) {
        const nextH = h + 1;
        const startLabel = hourLabel(h);
        const endLabel = hourLabel(nextH);
        list.push({
          key: `hour-${h}`,
          hour: h,
          label: startLabel,
          longLabel: `${startLabel} – ${endLabel}`,
          amount: 0,
          orders: 0,
          isCurrent: now.getHours() === h,
          isToday: false,
        });
      }

      const map = Object.fromEntries(list.map((item) => [item.hour, item]));
      revenueBills.forEach((b) => {
        if (map[b.hour]) {
          map[b.hour].amount += b.total || 0;
          map[b.hour].orders += 1;
        }
      });
      return list;
    }

    if (revenuePeriod === "week") {
      const list = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = safeFormat(d, "yyyy-MM-dd", `w${i}`);
        list.push({
          key,
          label: safeFormat(d, "EEE dd"),
          longLabel: safeFormat(d, "EEE, dd MMM yyyy"),
          amount: 0,
          orders: 0,
          isToday: i === 0,
          isCurrent: i === 0,
        });
      }
      const map = Object.fromEntries(list.map((item) => [item.key, item]));
      revenueBills.forEach((b) => {
        if (map[b.dateStr]) {
          map[b.dateStr].amount += b.total || 0;
          map[b.dateStr].orders += 1;
        }
      });
      return list;
    }

    if (revenuePeriod === "this_month") {
      const year = now.getFullYear();
      const month = now.getMonth();
      const currentDay = now.getDate();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const maxBillDay = revenueBills.reduce((acc, b) => {
        if (b.rawDate && b.rawDate.getMonth() === month && b.rawDate.getFullYear() === year) {
          return Math.max(acc, b.rawDate.getDate());
        }
        return acc;
      }, currentDay);
      const endDay = Math.min(Math.max(maxBillDay, 7), daysInMonth);

      const list = [];
      for (let dayNum = 1; dayNum <= endDay; dayNum++) {
        const d = new Date(year, month, dayNum);
        const key = safeFormat(d, "yyyy-MM-dd", `m${dayNum}`);
        list.push({
          key,
          label: safeFormat(d, "dd MMM"),
          longLabel: safeFormat(d, "EEE, dd MMM yyyy"),
          amount: 0,
          orders: 0,
          isToday: dayNum === currentDay,
          isCurrent: dayNum === currentDay,
        });
      }
      const map = Object.fromEntries(list.map((item) => [item.key, item]));
      revenueBills.forEach((b) => {
        if (map[b.dateStr]) {
          map[b.dateStr].amount += b.total || 0;
          map[b.dateStr].orders += 1;
        }
      });
      return list;
    }

    // Default / "all": Month-wise for the past 12 months
    const list = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = safeFormat(d, "yyyy-MM", `all-m-${i}`);
      list.push({
        key,
        label: safeFormat(d, "MMM yy"),
        longLabel: safeFormat(d, "MMMM yyyy"),
        amount: 0,
        orders: 0,
        isCurrent: i === 0,
      });
    }
    const map = Object.fromEntries(list.map((item) => [item.key, item]));
    allBills.forEach((b) => {
      const mKey = safeFormat(b.rawDate, "yyyy-MM", "");
      if (map[mKey]) {
        map[mKey].amount += b.total || 0;
        map[mKey].orders += 1;
      }
    });
    return list;
  }, [allBills, revenueBills, revenuePeriod]);

  /* ---- hourly footfall (9 AM – 8 PM, extended if data falls outside) ---- */
  const hourlyData = useMemo(() => {
    let minH = 9;
    let maxH = 20;
    revenueBills.forEach((b) => {
      if (b.hour < minH) minH = b.hour;
      if (b.hour > maxH) maxH = b.hour;
    });
    const hours = [];
    for (let h = minH; h <= maxH; h++) {
      hours.push({ hour: h, label: hourLabel(h), short: hourShort(h), count: 0, revenue: 0 });
    }
    revenueBills.forEach((b) => {
      const t = hours.find((x) => x.hour === b.hour);
      if (t) {
        t.count += 1;
        t.revenue += b.total || 0;
      }
    });
    return hours;
  }, [revenueBills]);

  const peakHour = useMemo(() => {
    const top = [...hourlyData].sort((a, b) => b.count - a.count)[0];
    return top && top.count > 0 ? top : null;
  }, [hourlyData]);

  /* ---- top services ---- */
  const topServices = useMemo(() => {
    const map = {};
    revenueBills.forEach((b) => {
      const n = Math.max(b.services.length, 1);
      b.services.forEach((s) => {
        if (!map[s.name]) map[s.name] = { name: s.name, count: 0, revenue: 0 };
        map[s.name].count += s.qty || 1;
        map[s.name].revenue += s.amount != null ? s.amount * (s.qty || 1) : Math.round((b.total || 0) / n);
      });
    });
    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [revenueBills]);

  /* ---- stylists ---- */
  const staffData = useMemo(() => {
    const map = {};
    revenueBills.forEach((b) => {
      const name = b.staff || "Unassigned";
      if (!map[name]) map[name] = { name, revenue: 0, count: 0 };
      map[name].revenue += b.total || 0;
      map[name].count += 1;
    });
    const total = stats.totalRev || 1;
    return Object.values(map)
      .map((s) => ({ ...s, percent: Math.round((s.revenue / total) * 100) }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [revenueBills, stats.totalRev]);

  const recentBills = useMemo(
    () => [...revenueBills].sort((a, b) => b.rawDate - a.rawDate).slice(0, 6),
    [revenueBills]
  );

  const bestDay = useMemo(() => {
    const top = [...trendData].sort((a, b) => b.amount - a.amount)[0];
    return top && top.amount > 0 ? top : null;
  }, [trendData]);

  const rangeLabel = useMemo(() => {
    if (!range.start) return "All recorded sales";
    const s = safeFormat(range.start, "dd MMM");
    const e = safeFormat(range.end, "dd MMM yyyy");
    return revenuePeriod === "today" ? safeFormat(range.start, "EEEE, dd MMM yyyy") : `${s} – ${e}`;
  }, [range, revenuePeriod]);

  /* ---- trend chart geometry ---- */
  const chart = useMemo(() => {
    const W = 640;
    const H = 250;
    const padL = 46;
    const padR = 14;
    const padT = 16;
    const padB = 30;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;
    const maxVal = niceMax(Math.max(...trendData.map((d) => d.amount), 0));
    const n = trendData.length;

    const pts = trendData.map((d, i) => {
      const x = n > 1 ? padL + (i / (n - 1)) * innerW : padL + innerW / 2;
      const y = padT + innerH - (d.amount / maxVal) * innerH;
      return { ...d, x, y, i };
    });

    // smooth curve
    let path = "";
    pts.forEach((p, i) => {
      if (i === 0) {
        path = `M ${p.x} ${p.y}`;
      } else {
        const prev = pts[i - 1];
        const cx = (prev.x + p.x) / 2;
        path += ` C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
      }
    });
    const baseY = padT + innerH;
    const area = pts.length ? `${path} L ${pts[pts.length - 1].x} ${baseY} L ${pts[0].x} ${baseY} Z` : "";

    const ticks = [0, 1, 2, 3, 4].map((t) => ({
      value: (maxVal / 4) * t,
      y: padT + innerH - (t / 4) * innerH,
    }));

    const step = Math.max(1, Math.ceil(n / 6));
    const hitW = n > 1 ? innerW / (n - 1) : innerW;

    return { W, H, padL, padR, padT, padB, innerW, innerH, pts, path, area, ticks, step, hitW, baseY };
  }, [trendData]);

  const activePoint =
    activeTrend !== null && chart.pts[activeTrend] ? chart.pts[activeTrend] : null;

  const maxHourCount = Math.max(...hourlyData.map((h) => h.count), 1);
  const shownHour = activeHour || peakHour;

  const donutSegments = [
    { key: "cash", label: "Cash", color: "#f59e0b", pct: stats.cashPct, amount: stats.cash, icon: FaMoneyBillWave },
    { key: "upi", label: "UPI / QR", color: "#2563eb", pct: stats.upiPct, amount: stats.upi, icon: FaQrcode },
    { key: "card", label: "Card", color: "#6366f1", pct: stats.cardPct, amount: stats.card, icon: FaCreditCard },
  ];
  let donutOffset = 0;

  const digitalPct = Math.round(stats.upiPct + stats.cardPct);

  return (
    <div className="min-h-full bg-slate-50/80 font-sans text-slate-800">
      <div className="max-w-[1400px] mx-auto p-3 sm:p-5 space-y-4">
        {/* ================= Header ================= */}
        <header className="bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/40 p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Revenue & Analytics
                  </h1>
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[11px] font-semibold">
                    Live
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{rangeLabel}</span>
                </p>
              </div>
            </div>

            {/* Period selector */}
            <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl w-full lg:w-auto lg:inline-flex">
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setRevenuePeriod(p.id);
                    setActiveTrend(null);
                    setActiveHour(null);
                  }}
                  className={cn(
                    "px-2 sm:px-4 h-9 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap",
                    revenuePeriod === p.id
                      ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200"
                      : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* ================= KPI strip ================= */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <KpiCard
            tone="emerald"
            icon={Wallet}
            label="Total Revenue"
            value={formatCurrency(stats.totalRev)}
            footer={
              prevStats ? (
                <Delta current={stats.totalRev} previous={prevStats.totalRev} label={range.prevLabel} />
              ) : (
                <span className="text-[11px] text-slate-400">All time collections</span>
              )
            }
          />
          <KpiCard
            tone="blue"
            icon={Receipt}
            label="Paid Invoices"
            value={stats.orders}
            footer={
              prevStats ? (
                <Delta current={stats.orders} previous={prevStats.orders} label={range.prevLabel} />
              ) : (
                <span className="text-[11px] text-slate-400">Completed bills</span>
              )
            }
          />
          <KpiCard
            tone="amber"
            icon={Zap}
            label="Avg. Ticket"
            value={formatCurrency(stats.avgTicket)}
            footer={
              prevStats ? (
                <Delta current={stats.avgTicket} previous={prevStats.avgTicket} label={range.prevLabel} />
              ) : (
                <span className="text-[11px] text-slate-400">Per client visit</span>
              )
            }
          />
          <KpiCard
            tone="indigo"
            icon={FaCreditCard}
            label="Digital Payments"
            value={formatCurrency(stats.upi + stats.card)}
            footer={
              <span className="text-[11px] text-slate-500 font-medium">
                {digitalPct}% of collections • Cash {Math.round(stats.cashPct)}%
              </span>
            }
          />
        </div>

        {/* ================= Highlights ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <Highlight
            icon={Clock}
            tone="bg-amber-50 text-amber-600"
            label="Busiest hour"
            value={peakHour ? peakHour.label : "—"}
            sub={peakHour ? `${peakHour.count} appointments` : "No data yet"}
          />
          <Highlight
            icon={Sparkles}
            tone="bg-emerald-50 text-emerald-600"
            label={
              revenuePeriod === "today"
                ? "Peak sales hour"
                : revenuePeriod === "all"
                ? "Best month"
                : "Best day"
            }
            value={bestDay ? bestDay.longLabel : "—"}
            sub={bestDay ? formatCurrency(bestDay.amount) : "No data yet"}
          />
          <Highlight
            icon={Scissors}
            tone="bg-sky-50 text-sky-600"
            label="Top treatment"
            value={topServices[0] ? topServices[0].name : "—"}
            sub={topServices[0] ? `${topServices[0].count} sold • ${compactCurrency(topServices[0].revenue)}` : "No data yet"}
          />
          <Highlight
            icon={Crown}
            tone="bg-purple-50 text-purple-600"
            label="Top stylist"
            value={staffData[0] ? staffData[0].name : "—"}
            sub={staffData[0] ? `${compactCurrency(staffData[0].revenue)} • ${staffData[0].count} clients` : "No data yet"}
          />
        </div>

        {revenueBills.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            No paid invoices in this period yet. Settle a bill in POS & Billing and it will appear here.
          </div>
        )}

        {/* ================= Trend + Payments ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Panel className="lg:col-span-2 p-4 sm:p-5">
            <PanelHeader
              icon={BarChart3}
              iconClass="bg-blue-50 text-blue-600"
              title={
                revenuePeriod === "today"
                  ? "Hourly Revenue Trend"
                  : revenuePeriod === "week"
                  ? "7-Day Revenue Trend"
                  : revenuePeriod === "this_month"
                  ? "Monthly Revenue Trend"
                  : "All-Time Revenue Trend"
              }
              subtitle={`${range.trendTitle} • ${
                revenuePeriod === "today"
                  ? "hourly collections"
                  : revenuePeriod === "all"
                  ? "monthly collections"
                  : "daily collections"
              }`}
              right={
                activePoint ? (
                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold text-slate-900 font-mono">
                      {formatCurrency(activePoint.amount)}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {activePoint.longLabel} • {activePoint.orders} bills
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 text-right shrink-0 hidden sm:block">
                    {revenuePeriod === "today"
                      ? "Hover or tap an hour"
                      : revenuePeriod === "all"
                      ? "Hover or tap a month"
                      : "Hover or tap a date"}
                  </p>
                )
              }
            />

            <div className="relative w-full" onMouseLeave={() => setActiveTrend(null)}>
              <svg
                viewBox={`0 0 ${chart.W} ${chart.H}`}
                className="w-full h-auto select-none"
                role="img"
                aria-label={
                  revenuePeriod === "today"
                    ? "Hourly revenue trend chart"
                    : revenuePeriod === "all"
                    ? "Monthly revenue trend chart"
                    : "Daily revenue trend chart"
                }
              >
                <defs>
                  <linearGradient id="revArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* grid + y labels */}
                {chart.ticks.map((t, i) => (
                  <g key={i}>
                    <line
                      x1={chart.padL}
                      x2={chart.W - chart.padR}
                      y1={t.y}
                      y2={t.y}
                      stroke={i === 0 ? "#cbd5e1" : "#eef2f7"}
                      strokeWidth="1"
                      strokeDasharray={i === 0 ? "0" : "3 4"}
                    />
                    <text x={chart.padL - 8} y={t.y + 3.5} textAnchor="end" fontSize="10" fill="#94a3b8">
                      {compactCurrency(t.value)}
                    </text>
                  </g>
                ))}

                {chart.area && <path d={chart.area} fill="url(#revArea)" />}
                {chart.path && (
                  <path
                    d={chart.path}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* active guide */}
                {activePoint && (
                  <line
                    x1={activePoint.x}
                    x2={activePoint.x}
                    y1={chart.padT}
                    y2={chart.baseY}
                    stroke="#93c5fd"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                )}

                {/* points */}
                {chart.pts.map((p) => {
                  const show =
                    activeTrend === p.i ||
                    p.isCurrent ||
                    p.isToday ||
                    chart.pts.length <= 14;
                  return show ? (
                    <circle
                      key={p.key}
                      cx={p.x}
                      cy={p.y}
                      r={activeTrend === p.i ? 5.5 : 3.5}
                      fill="#fff"
                      stroke={p.isCurrent || p.isToday ? "#f59e0b" : "#2563eb"}
                      strokeWidth="2"
                    />
                  ) : null;
                })}

                {/* x labels */}
                {chart.pts.map((p) =>
                  p.i % chart.step === 0 || p.i === chart.pts.length - 1 ? (
                    <text
                      key={`l-${p.key}`}
                      x={p.x}
                      y={chart.H - 8}
                      textAnchor={p.i === 0 ? "start" : p.i === chart.pts.length - 1 ? "end" : "middle"}
                      fontSize="10"
                      fontWeight={p.isCurrent || p.isToday ? "700" : "500"}
                      fill={p.isCurrent || p.isToday ? "#b45309" : "#64748b"}
                    >
                      {p.isToday && revenuePeriod !== "today" ? "Today" : p.label}
                    </text>
                  ) : null
                )}

                {/* hit areas (hover + tap) */}
                {chart.pts.map((p) => (
                  <rect
                    key={`h-${p.key}`}
                    x={p.x - chart.hitW / 2}
                    y={chart.padT}
                    width={chart.hitW}
                    height={chart.innerH}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setActiveTrend(p.i)}
                    onClick={() => setActiveTrend(p.i)}
                  />
                ))}
              </svg>
            </div>
          </Panel>

          <Panel className="p-4 sm:p-5">
            <PanelHeader
              icon={PieChart}
              iconClass="bg-indigo-50 text-indigo-600"
              title="Payment Mix"
              subtitle="How clients are paying"
            />

            <div className="flex items-center justify-center">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                  {stats.channelTotal > 0 &&
                    donutSegments.map((seg) => {
                      if (seg.pct <= 0) return null;
                      const el = (
                        <circle
                          key={seg.key}
                          cx="18"
                          cy="18"
                          r="15.9155"
                          fill="none"
                          stroke={seg.color}
                          strokeWidth="4"
                          pathLength="100"
                          strokeDasharray={`${Math.max(seg.pct - 0.8, 0.2)} ${100 - Math.max(seg.pct - 0.8, 0.2)}`}
                          strokeDashoffset={-donutOffset}
                        />
                      );
                      donutOffset += seg.pct;
                      return el;
                    })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    {compactCurrency(stats.totalRev)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {donutSegments.map((seg) => {
                const Icon = seg.icon;
                return (
                  <div
                    key={seg.key}
                    className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
                      <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-sm font-semibold text-slate-700 truncate">{seg.label}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-slate-900 font-mono leading-tight">
                        {formatCurrency(seg.amount)}
                      </p>
                      <p className="text-[11px] text-slate-400">{Math.round(seg.pct)}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* ================= Peak hours + Stylists ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel className="p-4 sm:p-5">
            <PanelHeader
              icon={Clock}
              iconClass="bg-amber-50 text-amber-600"
              title="Peak Hours"
              subtitle="When the salon is busiest"
              right={
                shownHour ? (
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-amber-700">{shownHour.label}</p>
                    <p className="text-[11px] text-slate-500">
                      {shownHour.count} apts • {compactCurrency(shownHour.revenue)}
                    </p>
                  </div>
                ) : null
              }
            />

            <div
              className="flex items-end gap-1 sm:gap-1.5 h-44"
              onMouseLeave={() => setActiveHour(null)}
            >
              {hourlyData.map((h) => {
                const heightPct = h.count > 0 ? Math.max((h.count / maxHourCount) * 100, 10) : 4;
                const isPeak = peakHour && h.hour === peakHour.hour;
                const isActive = activeHour?.hour === h.hour;
                return (
                  <button
                    key={h.hour}
                    type="button"
                    onMouseEnter={() => setActiveHour(h)}
                    onClick={() => setActiveHour(h)}
                    className="flex-1 min-w-0 h-full flex flex-col items-center justify-end gap-1 group cursor-pointer focus:outline-none"
                    aria-label={`${h.label}: ${h.count} appointments`}
                  >
                    <span
                      className={cn(
                        "text-[10px] font-bold font-mono transition-opacity",
                        h.count > 0 ? "text-slate-500" : "opacity-0",
                        isActive || isPeak ? "opacity-100" : "sm:opacity-0 sm:group-hover:opacity-100"
                      )}
                    >
                      {h.count}
                    </span>
                    <div className="w-full flex-1 flex items-end">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={cn(
                          "w-full rounded-md transition-all duration-300",
                          isPeak
                            ? "bg-gradient-to-t from-amber-500 to-amber-300"
                            : isActive
                            ? "bg-blue-600"
                            : h.count > 0
                            ? "bg-gradient-to-t from-blue-500 to-sky-300 group-hover:from-blue-600"
                            : "bg-slate-100"
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-semibold",
                        isPeak ? "text-amber-700" : "text-slate-400"
                      )}
                    >
                      {h.short}
                    </span>
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel className="p-4 sm:p-5">
            <PanelHeader
              icon={User}
              iconClass="bg-purple-50 text-purple-600"
              title="Stylist Leaderboard"
              subtitle="Revenue contribution by team member"
            />

            {staffData.length > 0 ? (
              <ul className="space-y-3.5">
                {staffData.slice(0, 5).map((s, idx) => (
                  <li key={s.name}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center shrink-0",
                            idx === 0
                              ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                              : "bg-slate-100 text-slate-600"
                          )}
                        >
                          {idx === 0 ? <Crown className="w-4 h-4" /> : s.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{s.name}</p>
                          <p className="text-[11px] text-slate-400">{s.count} clients</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-slate-900 font-mono">{formatCurrency(s.revenue)}</p>
                        <p className="text-[11px] text-slate-400">{s.percent}%</p>
                      </div>
                    </div>
                    <div className="mt-1.5 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(s.percent, 100)}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyHint icon={User} text="No stylist revenue in this period" />
            )}
          </Panel>
        </div>

        {/* ================= Top treatments + Recent invoices ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel className="p-4 sm:p-5">
            <PanelHeader
              icon={Award}
              iconClass="bg-emerald-50 text-emerald-600"
              title="Top Treatments"
              subtitle="Best performing services by revenue"
            />

            {topServices.length > 0 ? (
              <ul className="space-y-3">
                {topServices.map((item, idx) => {
                  const pct = Math.round((item.revenue / (topServices[0]?.revenue || 1)) * 100);
                  return (
                    <li key={item.name} className="flex items-center gap-3">
                      <span
                        className={cn(
                          "w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0",
                          idx === 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900 truncate">{item.name}</p>
                          <p className="text-sm font-black text-slate-900 font-mono shrink-0">
                            {formatCurrency(item.revenue)}
                          </p>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${pct}%` }}
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                            />
                          </div>
                          <span className="text-[11px] text-slate-400 shrink-0">{item.count}x</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyHint icon={Scissors} text="No treatment sales in this period" />
            )}
          </Panel>

          <Panel className="p-4 sm:p-5">
            <PanelHeader
              icon={Receipt}
              iconClass="bg-sky-50 text-sky-600"
              title="Recent Invoices"
              subtitle="Latest settled bills in this period"
            />

            {recentBills.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {recentBills.map((b) => {
                  const pk = payKey(b.paymentMethod);
                  return (
                    <li key={`${b.id}-${b.rawDate.getTime()}`} className="py-2.5 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {b.clientName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">{b.clientName}</p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {safeFormat(b.rawDate, "dd MMM, hh:mm a")} •{" "}
                          {b.services.map((s) => s.name).join(", ") || "Salon service"}
                        </p>
                      </div>
                      <div className="text-right shrink-0 space-y-0.5">
                        <p className="text-sm font-black text-slate-900 font-mono">{formatCurrency(b.total)}</p>
                        <div className="flex flex-col items-end">
                          <span
                            className={cn(
                              "inline-block text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border",
                              PAY_BADGE[pk]
                            )}
                          >
                            {isSplitPayment(b) ? "Split" : pk}
                          </span>
                          {isSplitPayment(b) && (
                            <span className="text-[10px] text-slate-500 font-medium truncate max-w-[160px] text-right mt-0.5">
                              {formatPaymentSummary(b)}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyHint icon={Receipt} text="No invoices in this period" />
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
};

export default RevenuePage;