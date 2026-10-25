import React, { useState, useContext, useMemo, useEffect } from "react";
import {
  Search,
  Receipt,
  FileSpreadsheet,
  FileText,
  Wallet,
  Smartphone,
  ShoppingBag,
  IndianRupee,
  SearchX,
  X,
  Calendar,
  Scissors,
  Printer,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { cn } from "../lib/utils";
import Context from "../Context/Context";
import { useToast } from "../hooks/use-toast";
import { format } from "date-fns";
import { BillPrintModal, formatCurrency, parseAppointmentDate } from "./BillPrintModal";
import { directPrintBill } from "../lib/printerService";
import {
  getCollectionBreakdown,
  isSplitPayment,
  formatPaymentSummary,
  parsePaymentSplit,
} from "../lib/paymentUtils";

/* ----------------------------- helpers ----------------------------- */

const PAGE_SIZE = 25;
const DONE = ["completed", "settled", "paid"];
const isDone = (s) => DONE.includes(s);

const PERIODS = [
  { id: "today", label: "Today" },
  { id: "week", label: "7 days" },
  { id: "month", label: "This month" },
  { id: "all", label: "All" },
  { id: "custom", label: "Custom" },
];

const escapeHtml = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

const splitText = (b) => formatPaymentSummary(b);

const isSplit = (b) => isSplitPayment(b);

/* ------------------------- small components ------------------------- */

const StatCard = ({ label, value, hint, icon: Icon, className }) => (
  <div className={cn("rounded-2xl p-3 sm:p-5 text-white shadow-sm flex flex-col justify-between", className)}>
    <div className="flex items-center justify-between gap-1.5">
      <p className="text-xs sm:text-sm font-medium text-white/85 truncate">{label}</p>
      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/70 shrink-0" />
    </div>
    <div className="mt-1 sm:mt-2">
      <p className="text-lg sm:text-3xl font-extrabold tabular-nums leading-tight truncate">{value}</p>
      {hint && <p className="mt-0.5 sm:mt-1.5 text-[10px] sm:text-xs text-white/75 truncate">{hint}</p>}
    </div>
  </div>
);

const Pill = ({ active, children, ...props }) => (
  <button
    {...props}
    className={cn(
      "px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors cursor-pointer",
      "focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2",
      active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
    )}
  >
    {children}
  </button>
);

const PaymentLabel = ({ bill }) => {
  if (isSplit(bill)) {
    return (
      <div className="space-y-0.5">
        <span className="inline-block text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
          Split
        </span>
        <p className="text-xs font-semibold text-slate-700 truncate max-w-[180px]" title={splitText(bill)}>
          {splitText(bill)}
        </p>
      </div>
    );
  }
  const mode = (bill.paymentMethod || "").toLowerCase();
  const dot = mode === "cash" ? "bg-amber-500" : mode.includes("card") ? "bg-indigo-500" : "bg-emerald-500";
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-800 capitalize">
      <span className={cn("w-2 h-2 rounded-full", dot)} />
      {bill.paymentMethod}
    </span>
  );
};

const StatusText = ({ status }) => {
  const done = isDone(status);
  return (
    <span
      className={cn(
        "inline-block rounded-md px-2 py-0.5 text-xs font-semibold capitalize",
        done ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
      )}
    >
      {status}
    </span>
  );
};

const Services = ({ list }) =>
  list.length === 0 ? (
    <span className="text-slate-400">–</span>
  ) : (
    <span title={list.join(", ")}>
      {list.slice(0, 2).join(", ")}
      {list.length > 2 && <span className="text-slate-500"> +{list.length - 2} more</span>}
    </span>
  );

/* ------------------------------ page ------------------------------ */

const OrderHistoryPage = () => {
  const { appointments, barbers, institutionData } = useContext(Context);
  const { toast } = useToast();

  const [period, setPeriod] = useState("today");
  const [status, setStatus] = useState("completed");
  const [search, setSearch] = useState("");
  const [range, setRange] = useState({ from: "", to: "" });
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [showBillPrint, setShowBillPrint] = useState(false);
  const [billToPrint, setBillToPrint] = useState(null);

  const getStaffName = (staffId) => {
    if (!staffId) return "Unassigned";
    const f = (barbers || []).find(
      (b) => b.id === staffId || b.staffId === staffId || b.name === staffId
    );
    return f ? f.name : staffId;
  };

  const bills = useMemo(() => {
    return (appointments || [])
      .map((apt, index) => {
        const staffId = apt.staffId || apt.staff || apt.Staff || apt.staff_name || "";
        const d = parseAppointmentDate(apt.dateTime || apt.createdAt || apt.date);

        let serviceNames = [];
        let detailedItems = [];

        if (Array.isArray(apt.services)) {
          apt.services.forEach((s) => {
            if (typeof s === "string") {
              serviceNames.push(s);
              detailedItems.push({ serviceName: s, amount: null, quantity: 1, isProduct: false });
            } else if (s && typeof s === "object") {
              const name = s.serviceName || s.name || "Service";
              serviceNames.push(name);
              detailedItems.push({
                serviceName: name,
                amount: s.amount != null && Number(s.amount) > 0 ? Number(s.amount) : null,
                quantity: Number(s.quantity || s.qty) || 1,
                isProduct: false,
              });
            }
          });
        } else if (typeof apt.service === "string" && apt.service.trim()) {
          serviceNames = apt.service.split(",").map((s) => s.trim()).filter(Boolean);
          detailedItems = serviceNames.map((name) => ({
            serviceName: name,
            amount: null,
            quantity: 1,
            isProduct: false,
          }));
        }

        if (Array.isArray(apt.products)) {
          apt.products.forEach((p) => {
            const name = p?.productName || p?.name || "Product";
            detailedItems.push({
              serviceName: name,
              amount: Number(p?.price || p?.amount || 0),
              quantity: Number(p?.quantity || p?.qty) || 1,
              isProduct: true,
            });
          });
        }

        const rawSubtotal = Number(apt.subtotal || apt.billAmount || apt.amount || 0);
        const rawTotal = Number(apt.total != null ? apt.total : apt.totalAmount != null ? apt.totalAmount : 0);
        const tax = Number(apt.tax || 0);
        const discount = Number(apt.discountAmount || apt.discount || apt.discount_value || 0);

        let subtotal = rawSubtotal;
        let total = rawTotal;
        if (!subtotal && total) {
          subtotal = Math.max(0, total - tax + discount);
        }
        if (!total && subtotal) {
          total = Math.max(0, subtotal + tax - discount);
        }

        const assignedStaff = getStaffName(staffId);

        return {
          id: String(
            apt.appointmentId || apt.id || apt.Id || apt.appointment_id ||
              `INV-${String(index + 1).padStart(5, "0")}`
          ),
          clientName:
            apt.client?.clientName || apt.clientName || apt.ClientName || apt.client_name || "Walk-in Client",
          phoneNumber: String(
            apt.client?.phoneNumber || apt.phoneNumber || apt.phone || apt.clientPhone || ""
          ),
          rawDate: d,
          dateKey: format(d, "yyyy-MM-dd"),
          date: d,
          dateDisplay: format(d, "dd/MM/yyyy"),
          dateShort: format(d, "dd MMM yyyy"),
          time: format(d, "hh:mm a"),
          dateTimeFormatted: format(d, "dd MMM yyyy, hh:mm a"),
          services: serviceNames,
          items: detailedItems,
          products: apt.products || [],
          subtotal,
          tax,
          gstPercent: Number(apt.gstPercent || apt.gst_percent || 0),
          discount,
          total,
          status: String(apt.status || apt.Status || apt.appointment_status || "pending").toLowerCase(),
          paymentMethod:
            apt.paymentMode || apt.paymentMethod || apt.PaymentMethod || apt.payment_method || "Cash",
          paymentMode:
            apt.paymentMode || apt.paymentMethod || apt.PaymentMethod || apt.payment_method || "Cash",
          paymentSplit: parsePaymentSplit(apt),
          paymentSummary: apt.paymentSummary || "",
          cashAmount: apt.cashAmount,
          upiAmount: apt.upiAmount,
          cardAmount: apt.cardAmount,
          payments: apt.payments || [],
          paymentPlatform: apt.paymentPlatform || "",
          staff: assignedStaff,
          staffId,
          duration: apt.duration || 30,
        };
      })
      .sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments, barbers]);

  const filtered = useMemo(() => {
    const now = new Date();
    const todayKey = format(now, "yyyy-MM-dd");

    let r = bills.filter((b) => {
      if (period === "today") return b.dateKey === todayKey;
      if (period === "week") {
        const diff = (now.getTime() - b.rawDate.getTime()) / 86400000;
        return diff >= 0 && diff <= 7;
      }
      if (period === "month")
        return b.rawDate.getMonth() === now.getMonth() && b.rawDate.getFullYear() === now.getFullYear();
      if (period === "custom" && range.from)
        return b.dateKey >= range.from && b.dateKey <= (range.to || range.from);
      return true;
    });

    if (status === "completed") r = r.filter((b) => isDone(b.status));

    const q = search.trim().toLowerCase();
    if (q) {
      r = r.filter(
        (b) =>
          b.clientName.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q) ||
          b.phoneNumber.includes(q) ||
          b.staff.toLowerCase().includes(q)
      );
    }
    return r;
  }, [bills, period, status, search, range]);

  useEffect(() => setVisible(PAGE_SIZE), [period, status, search, range]);

  const { total, cash, digital, avg } = useMemo(() => {
    let t = 0, c = 0, d = 0;
    filtered.forEach((b) => {
      t += b.total || 0;
      const bd = getCollectionBreakdown(b);
      c += bd.cash;
      d += bd.digital;
    });
    return { total: t, cash: c, digital: d, avg: filtered.length ? t / filtered.length : 0 };
  }, [filtered]);

  const shown = filtered.slice(0, visible);
  const dirty = search.trim() !== "" || status !== "completed" || period !== "today";
  const reset = () => {
    setPeriod("today");
    setStatus("completed");
    setSearch("");
    setRange({ from: "", to: "" });
  };
  const open = (b) => {
    setBillToPrint(b);
    setShowBillPrint(true);
  };
  const handleQuickPrint = async (e, b) => {
    e.stopPropagation();
    try {
      await directPrintBill(b, institutionData);
    } catch (err) {
      console.warn("Direct print fallback to modal:", err);
      open(b);
    }
  };

  const periodLabel =
    period === "custom" && range.from
      ? `${format(new Date(`${range.from}T00:00:00`), "dd MMM")} – ${format(
          new Date(`${range.to || range.from}T00:00:00`),
          "dd MMM"
        )}`
      : PERIODS.find((p) => p.id === period)?.label;

  /* exports */
  const exportExcel = () => {
    if (!filtered.length) {
      toast({ title: "Nothing to export", description: "Change the filters and try again." });
      return;
    }
    const headers = ["Invoice ID","Client Name","Phone","Date","Services","Staff","Payment Mode","Subtotal","Tax","Discount","Total","Status"];
    const rows = filtered.map((b) => [
      b.id, b.clientName, b.phoneNumber, b.dateDisplay || format(b.date, "dd/MM/yyyy"), b.services.join(" | "), b.staff,
      isSplit(b) ? `Split (${splitText(b) || "Multiple"})` : b.paymentMethod,
      b.subtotal, b.tax, b.discount, b.total, b.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `order_history_${format(new Date(), "yyyyMMdd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: `${filtered.length} orders exported.` });
  };

  const exportPDF = () => {
    if (!filtered.length) {
      toast({ title: "Nothing to export", description: "Change the filters and try again." });
      return;
    }
    const w = window.open("", "_blank");
    if (!w) {
      toast({ title: "Pop-up blocked", description: "Allow pop-ups to export the PDF." });
      return;
    }
    const salon = escapeHtml(institutionData?.companyName || "Salon Management");
    w.document.write(`<html><head><title>Order History</title><style>
      body{font-family:-apple-system,"Segoe UI",Roboto,sans-serif;padding:24px;color:#0f172a}
      h2{margin:0 0 4px;font-size:18px} p{font-size:12px;color:#64748b;margin:2px 0}
      table{width:100%;border-collapse:collapse;margin-top:16px;font-size:11px}
      th,td{border:1px solid #cbd5e1;padding:6px 8px;text-align:left}
      th{background:#f1f5f9} .r{text-align:right}
    </style></head><body>
      <h2>${salon} — Order History</h2>
      <p>${escapeHtml(periodLabel)} • ${filtered.length} orders • Total ₹${total.toLocaleString("en-IN")} • Cash ₹${cash.toLocaleString("en-IN")} • Digital ₹${digital.toLocaleString("en-IN")}</p>
      <table><thead><tr><th>Invoice</th><th>Client</th><th>Date</th><th>Services</th><th>Staff</th><th>Payment</th><th class="r">Total (₹)</th><th>Status</th></tr></thead><tbody>
      ${filtered.map((b) => `<tr>
        <td>#${escapeHtml(b.id)}</td><td>${escapeHtml(b.clientName)}</td><td>${escapeHtml(b.dateDisplay || format(b.date, "dd/MM/yyyy"))}</td>
        <td>${escapeHtml(b.services.join(", "))}</td><td>${escapeHtml(b.staff)}</td>
        <td>${escapeHtml(isSplit(b) ? `Split (${splitText(b)})` : b.paymentMethod)}</td>
        <td class="r"><b>${escapeHtml(b.total)}</b></td><td>${escapeHtml(b.status)}</td></tr>`).join("")}
      </tbody></table><script>window.print();</script></body></html>`);
    w.document.close();
  };

  /* ------------------------------ render ------------------------------ */

  return (
    <div className="min-h-full bg-slate-50 text-slate-800 font-sans">
      <div className="mx-auto max-w-7xl p-3 sm:p-5 lg:p-6 space-y-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Order history</h1>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total collected"
            value={formatCurrency(total)}
            hint={periodLabel}
            icon={IndianRupee}
            className="bg-gradient-to-br from-blue-500 to-blue-700"
          />
          <StatCard
            label="Orders"
            value={filtered.length}
            hint={filtered.length ? `Avg ${formatCurrency(avg)}` : "No orders yet"}
            icon={ShoppingBag}
            className="bg-gradient-to-br from-violet-500 to-purple-700"
          />
          <StatCard
            label="Cash"
            value={formatCurrency(cash)}
            hint="Received in hand"
            icon={Wallet}
            className="bg-gradient-to-br from-orange-500 to-orange-700"
          />
          <StatCard
            label="UPI & card"
            value={formatCurrency(digital)}
            hint="Received online"
            icon={Smartphone}
            className="bg-gradient-to-br from-emerald-500 to-emerald-700"
          />
        </div>

        {/* Filters */}
        <div className="rounded-2xl bg-white border border-slate-200 p-3 sm:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Search client, phone, invoice or stylist"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-9 h-10 rounded-xl border-slate-200 text-xs sm:text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:flex gap-2 shrink-0">
              <Button
                onClick={exportExcel}
                className="h-10 px-3 sm:px-4 gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Excel
              </Button>
              <Button
                onClick={exportPDF}
                className="h-10 px-3 sm:px-4 gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold cursor-pointer shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> PDF
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1 touch-pan-x flex-nowrap sm:flex-wrap">
            {PERIODS.map((p) => (
              <Pill key={p.id} active={period === p.id} onClick={() => setPeriod(p.id)}>
                {p.label}
              </Pill>
            ))}
            <span className="hidden sm:block w-px h-6 bg-slate-200 mx-1 shrink-0" />
            <Pill active={status === "completed"} onClick={() => setStatus("completed")}>
              Completed
            </Pill>
            <Pill active={status === "all"} onClick={() => setStatus("all")}>
              All statuses
            </Pill>
            {dirty && (
              <button
                onClick={reset}
                className="ml-auto text-xs sm:text-sm font-semibold text-blue-600 hover:underline cursor-pointer shrink-0 pl-2 whitespace-nowrap"
              >
                Reset
              </button>
            )}
          </div>

          {period === "custom" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-600 pt-1">
              <label className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="font-semibold text-slate-700 w-12 shrink-0">From:</span>
                <input
                  type="date"
                  value={range.from}
                  max={range.to || undefined}
                  onChange={(e) => setRange((p) => ({ ...p, from: e.target.value }))}
                  className="bg-transparent flex-1 text-slate-800 focus:outline-none text-xs sm:text-sm"
                />
              </label>
              <label className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="font-semibold text-slate-700 w-12 shrink-0">To:</span>
                <input
                  type="date"
                  value={range.to}
                  min={range.from || undefined}
                  onChange={(e) => setRange((p) => ({ ...p, to: e.target.value }))}
                  className="bg-transparent flex-1 text-slate-800 focus:outline-none text-xs sm:text-sm"
                />
              </label>
            </div>
          )}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="rounded-2xl bg-white border border-slate-200 py-14 px-6 text-center">
            <SearchX className="w-8 h-8 mx-auto text-slate-300" />
            <p className="mt-3 font-semibold text-slate-900">No orders found</p>
            <p className="mt-1 text-sm text-slate-500">
              Try a wider period or clear your search.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              {period !== "all" && (
                <Button onClick={() => setPeriod("all")} className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 cursor-pointer">
                  Show all orders
                </Button>
              )}
              {dirty && (
                <Button variant="outline" onClick={reset} className="rounded-xl cursor-pointer">
                  Reset filters
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Table (tablet & desktop) */}
        {filtered.length > 0 && (
          <div className="hidden md:block rounded-2xl bg-white border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <TableComponent>
                <TableHeader className="bg-slate-50">
                  <TableRow className="hover:bg-slate-50">
                    <TableHead className="pl-5 py-3 text-xs font-semibold text-slate-600">Invoice</TableHead>
                    <TableHead className="py-3 text-xs font-semibold text-slate-600">Client</TableHead>
                    <TableHead className="py-3 text-xs font-semibold text-slate-600">Date</TableHead>
                    <TableHead className="py-3 text-xs font-semibold text-slate-600 min-w-[160px]">Services</TableHead>
                    <TableHead className="py-3 text-xs font-semibold text-slate-600">Stylist</TableHead>
                    <TableHead className="py-3 text-xs font-semibold text-slate-600">Payment</TableHead>
                    <TableHead className="py-3 text-xs font-semibold text-slate-600 text-right">Total</TableHead>
                    {status === "all" && (
                      <TableHead className="py-3 text-xs font-semibold text-slate-600">Status</TableHead>
                    )}
                    <TableHead className="pr-5 py-3 text-right">
                      <span className="sr-only">Receipt</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shown.map((b) => (
                    <TableRow
                      key={b.id}
                      onClick={() => open(b)}
                      className="cursor-pointer border-slate-100 hover:bg-blue-50/50"
                    >
                      <TableCell className="pl-5 py-3.5 font-mono text-xs font-semibold text-blue-600">
                        #{b.id}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <p className="text-sm font-semibold text-slate-900">{b.clientName}</p>
                        {b.phoneNumber && (
                          <p className="text-xs text-slate-500 tabular-nums">{b.phoneNumber}</p>
                        )}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <p className="text-sm text-slate-800">{b.dateShort}</p>
                        <p className="text-xs text-slate-500">{b.time}</p>
                      </TableCell>
                      <TableCell className="py-3.5 text-sm text-slate-700">
                        <Services list={b.services} />
                      </TableCell>
                      <TableCell className="py-3.5 text-sm text-slate-700">{b.staff}</TableCell>
                      <TableCell className="py-3.5">
                        <PaymentLabel bill={b} />
                      </TableCell>
                      <TableCell className="py-3.5 text-right">
                        <p className="text-sm font-bold text-slate-900 tabular-nums">
                          {formatCurrency(b.total)}
                        </p>
                        {b.discount > 0 && (
                          <p className="text-xs text-emerald-600 tabular-nums">
                            −{formatCurrency(b.discount)} off
                          </p>
                        )}
                      </TableCell>
                      {status === "all" && (
                        <TableCell className="py-3.5">
                          <StatusText status={b.status} />
                        </TableCell>
                      )}
                      <TableCell className="pr-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleQuickPrint(e, b)}
                            className="h-8 px-2.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer text-xs font-semibold flex items-center gap-1"
                            title="Print directly to configured thermal printer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span className="hidden lg:inline">Print</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              open(b);
                            }}
                            className="h-8 gap-1.5 rounded-lg text-slate-700 hover:text-blue-600 hover:border-blue-200 cursor-pointer"
                          >
                            <Receipt className="w-3.5 h-3.5" /> View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </TableComponent>
            </div>
          </div>
        )}

        {/* Cards (mobile) */}
        {filtered.length > 0 && (
          <div className="md:hidden space-y-3">
            {shown.map((b) => (
              <div
                key={b.id}
                onClick={() => open(b)}
                className="w-full text-left rounded-2xl bg-white border border-slate-200/90 shadow-2xs p-3.5 active:bg-slate-50 cursor-pointer transition-all"
              >
                {/* Header: Client & Total */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        #{b.id}
                      </span>
                      <p className="font-bold text-slate-900 text-sm truncate">{b.clientName}</p>
                    </div>
                    {b.phoneNumber && (
                      <p className="text-xs text-slate-500 mt-0.5 tabular-nums">{b.phoneNumber}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-black text-slate-900 tabular-nums">
                      {formatCurrency(b.total)}
                    </p>
                    {b.discount > 0 && (
                      <p className="text-[10px] font-semibold text-emerald-600 tabular-nums">
                        −{formatCurrency(b.discount)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Date, Time & Stylist */}
                <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 bg-slate-50/80 rounded-xl px-2.5 py-1.5 border border-slate-100">
                  <div className="flex items-center gap-1.5 truncate">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{b.dateShort}, {b.time}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 font-medium text-slate-700">
                    <Scissors className="w-3 h-3 text-slate-400" />
                    <span>{b.staff}</span>
                  </div>
                </div>

                {/* Services List */}
                <div className="mt-2 text-xs text-slate-600 line-clamp-2">
                  <span className="font-semibold text-slate-700">Services: </span>
                  <Services list={b.services} />
                </div>

                {/* Footer: Payment & View/Print Action */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex items-center gap-2">
                    <PaymentLabel bill={b} />
                    {status === "all" && <StatusText status={b.status} />}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => handleQuickPrint(e, b)}
                      className="h-8 px-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                      title="Print directly to configured thermal printer"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-600" />
                      <span>Print</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        open(b);
                      }}
                      className="h-8 px-2.5 rounded-xl bg-blue-50/80 border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-bold flex items-center gap-1 shrink-0 shadow-2xs cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>View</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer: count + load more */}
        {filtered.length > 0 && (
          <div className="flex flex-col items-center gap-3 pb-4">
            <p className="text-sm text-slate-500" aria-live="polite">
              Showing {shown.length} of {filtered.length} orders
            </p>
            {visible < filtered.length && (
              <Button
                variant="outline"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="h-10 px-6 rounded-xl bg-white cursor-pointer"
              >
                Show more
              </Button>
            )}
          </div>
        )}
      </div>

      <BillPrintModal
        isOpen={showBillPrint}
        onClose={() => {
          setShowBillPrint(false);
          setBillToPrint(null);
        }}
        bill={billToPrint}
        isReprint={true}
      />
    </div>
  );
};

export default OrderHistoryPage;