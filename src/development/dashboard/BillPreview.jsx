import React, { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Context from "../Context/Context";
import { Button } from "../components/ui/button";
import { X, Download } from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
// No controls on this page; only the bill is shown

const inr = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n || 0);
const fmtDT = (d) => {
  if (!d) return "N/A";
  const dt = new Date(d);
  return dt.toLocaleString("en-IN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
};

export default function BillPreview() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { appointments, institutionData, services, fetchAppointments } = useContext(Context);
  const [paperSize, setPaperSize] = useState("55mm"); // default size; controls hidden on standalone
  const [delayDone, setDelayDone] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchedAppt, setFetchedAppt] = useState(null);
  const isDashboard = location.pathname.startsWith("/dashboard");

  const salonName = institutionData?.InstitutionName || institutionData?.institutionname || "THE MIRROR SALON AND MAKEUP STUDIO";
  const salonAddress = institutionData?.Address || institutionData?.address || "Hilltown Beside of SBI ATM, Bhawanipatna, ODISHA - 766001";
  const salonContact = institutionData?.Contact || institutionData?.contact || "Contact: 8144122018";

  const stateBill = location.state?.bill;
  const mode = location.state?.mode || "generate";

  // Robustly get appointment id across API variants
  const extractAppointmentId = (obj) => {
    if (!obj) return undefined;
    const candidates = [
      obj.appointmentId,
      obj.appointmentID,
      obj.AppointmentId,
      obj.AppointmentID,
      obj.id,
      obj.Id,
      obj.ID,
      obj.appointment_id,
      obj.Appointment_id,
    ];
    const val = candidates.find((v) => v != null);
    return val != null ? String(val).trim() : undefined;
  };
  const routeId = id != null ? String(id).trim() : undefined;
  const contextFallback = appointments.find((a) => extractAppointmentId(a) === routeId);
  const preferredAppt = fetchedAppt || contextFallback;

  const bill = useMemo(() => stateBill || (preferredAppt && {
    id: extractAppointmentId(preferredAppt),
    clientName: preferredAppt.client?.clientName || preferredAppt.clientName || preferredAppt.ClientName || preferredAppt.client_name || "N/A",
    phoneNumber: preferredAppt.client?.phoneNumber || preferredAppt.phoneNumber || preferredAppt.client_phone || "",
    date: preferredAppt.dateTime ? new Date(preferredAppt.dateTime * 1000) : (preferredAppt.date ? new Date(preferredAppt.date) : new Date()),
    services: preferredAppt.service ? preferredAppt.service.split(", ") : preferredAppt.services || preferredAppt.Services || preferredAppt.service_names || [],
    subtotal: preferredAppt.billAmount || preferredAppt.subtotal || 0,
    tax: preferredAppt.tax || 0,
    total: preferredAppt.totalAmount || preferredAppt.total || preferredAppt.billAmount || 0,
    discount: preferredAppt.discount || 0,
    discountAmount: preferredAppt.discountAmount,
  staff: preferredAppt.staffName || preferredAppt.staff || preferredAppt.Staff || "",
    paymentMethod: preferredAppt.paymentMethod || preferredAppt.PaymentMethod || "Cash",
    payments: preferredAppt.payments || null,
    status: preferredAppt.status || "completed",
    loyaltyPoints: preferredAppt.loyaltyPoints || 0,
    notes: preferredAppt.notes || "",
  }), [stateBill, preferredAppt]);

  // Actively fetch appointments and use the returned array directly to find this bill
  useEffect(() => {
    let canceled = false;
    if (!stateBill && routeId) {
      setIsFetching(true);
      (async () => {
        try {
          const list = await fetchAppointments();
          if (canceled) return;
          const found = Array.isArray(list)
            ? list.find((a) => extractAppointmentId(a) === routeId)
            : null;
          setFetchedAppt(found || null);
        } catch (e) {
          // swallow
          setFetchedAppt(null);
        } finally {
          if (!canceled) setIsFetching(false);
        }
      })();
    } else {
      setFetchedAppt(null);
      setIsFetching(false);
    }
    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, routeId, stateBill]);

  // Ensure loader shows briefly for UX even on fast loads
  useEffect(() => {
    const t = setTimeout(() => setDelayDone(true), 600);
    return () => clearTimeout(t);
  }, []);

  // Derive a human readable barber/staff name if available from items or bill
  const barberName = useMemo(() => {
    if (bill?.staff) return String(bill.staff);
    const firstWithStaff = Array.isArray(bill?.services)
      ? bill.services.find((s) => typeof s === 'object' && (s.staff || s.barber || s.employee))
      : null;
    return firstWithStaff ? (firstWithStaff.staff || firstWithStaff.barber || firstWithStaff.employee) : '';
  }, [bill]);

  const items = useMemo(() => {
    const billServices = bill?.services || [];
    // Normalize items: { name, qty, price, discount, final }
    if (!Array.isArray(billServices)) return [];
    const normalized = billServices.map((s) => {
      if (typeof s === "string") return { name: s, qty: 1 };
      return {
        name: s.serviceName || s.name || "Service",
        qty: s.qty || 1,
        price: s.amount || s.price,
        discount: s.discount || 0,
        staff: s.staff || bill?.staff || "",
      };
    });
    // Map names to master services list (from Context) for price when missing
    const master = Array.isArray(services) ? services : [];
    normalized.forEach((n) => {
      if (n.price == null && Array.isArray(master)) {
        const m = master.find((ms) => ms.serviceName === n.name);
        if (m) n.price = m.amount ?? m.price ?? null;
      }
    });
    // If still missing, distribute subtotal across items
    const havePrice = normalized.every((n) => n.price != null);
    if (!havePrice) {
      const subtotal = Number(bill?.subtotal || bill?.total || 0);
      const per = subtotal / Math.max(normalized.length, 1);
      normalized.forEach((n) => { if (n.price == null) n.price = per; });
    }
    // Final price = price - discount (clamped)
    normalized.forEach((n) => { n.final = Math.max((n.price || 0) - (n.discount || 0), 0); });
    return normalized;
  }, [bill, services]);

  const totals = useMemo(() => {
    // Subtotal from items (computed) and from stored bill (preferred for reconciliation)
    const computedSubtotal = items.reduce((sum, it) => sum + (it.price || 0) * (it.qty || 1), 0);
    const storedSubtotal = bill?.subtotal != null ? Number(bill.subtotal) : null;
    const subtotal = storedSubtotal != null ? storedSubtotal : computedSubtotal;

    // Item-level discount from items
    const itemDiscount = items.reduce((sum, it) => sum + (it.discount || 0) * (it.qty || 1), 0);

  // Tax field on appointment: if <= 50 treat as percentage, else as absolute amount
  const taxField = Number(bill?.tax || 0);
  const isPercentTax = taxField > 0 && taxField <= 50; // heuristically treat <=50 as percent
  const hasExplicitGstPercent = bill?.gstPercent != null && !Number.isNaN(Number(bill.gstPercent));

    // If total is stored, derive discount (and tax amount if percent) so bill matches persisted values
    const totalStored = bill?.total != null ? Number(bill.total) : null;
    let taxAmount = 0;
    const rawDiscount = (bill?.discountAmount != null && !Number.isNaN(Number(bill.discountAmount)))
      ? bill.discountAmount
      : bill?.discount;
    let addlDiscount = Math.max(Number(rawDiscount || 0), 0);
    let total = 0;
    const hasExplicitDiscount = rawDiscount != null && !Number.isNaN(Number(rawDiscount));

    // In generate mode, if user provided discount explicitly, recompute total from discount
    if (mode === 'generate' && hasExplicitDiscount) {
      const baseBeforeTax = Math.max(subtotal - itemDiscount - addlDiscount, 0);
      if (isPercentTax) {
        taxAmount = baseBeforeTax * (taxField / 100);
      } else {
        taxAmount = Math.max(taxField, 0);
      }
      total = baseBeforeTax + taxAmount;
    } else if (totalStored != null) {
      if (isPercentTax) {
        // Solve: total = (subtotal - itemDiscount - addlDiscount) * (1 + taxPct)
        const baseBeforeTax = totalStored / (1 + taxField / 100);
        taxAmount = totalStored - baseBeforeTax;
        // Derive additional discount so that totals reconcile with stored values
        addlDiscount = Math.max(subtotal - itemDiscount - baseBeforeTax, 0);
        total = totalStored;
      } else {
        // Absolute tax amount
        taxAmount = Math.max(taxField, 0);
        addlDiscount = Math.max(subtotal + taxAmount - totalStored - itemDiscount, 0);
        total = totalStored;
      }
    } else {
      // No stored total; compute from fields available
      if (isPercentTax) {
        addlDiscount = Math.max(addlDiscount, 0);
        const baseBeforeTax = Math.max(subtotal - itemDiscount - addlDiscount, 0);
        taxAmount = baseBeforeTax * (taxField / 100);
        total = baseBeforeTax + taxAmount;
      } else {
        taxAmount = Math.max(taxField, 0);
        addlDiscount = Math.max(addlDiscount, 0);
        total = Math.max(subtotal - itemDiscount - addlDiscount, 0) + taxAmount;
      }
    }

    const totalDiscount = itemDiscount + addlDiscount;
    const effectivePercent = hasExplicitGstPercent
      ? Number(bill.gstPercent)
      : (isPercentTax ? taxField : undefined);
    return { subtotal, itemDiscount, addlDiscount, tax: taxAmount, taxPercent: effectivePercent, totalDiscount, total };
  }, [items, bill, mode]);

  const taxBreakup = useMemo(() => {
    const t = totals.tax || 0;
    // Prefer explicit percent if present; else derive from base
    let percent = totals.taxPercent;
    if (percent == null) {
      const base = Math.max(totals.subtotal - totals.totalDiscount, 0);
      percent = base > 0 ? Math.round((t / base) * 100) : 0;
    }
    return { percent, amount: t };
  }, [totals]);

  // Prefer an explicitly provided discountAmount for display, else use computed addlDiscount
  const displayDiscount = useMemo(() => {
    const raw = bill?.discountAmount;
    if (raw != null && !Number.isNaN(Number(raw))) {
      return Math.max(Number(raw), 0);
    }
    return Math.max(Number(totals.addlDiscount || 0), 0);
  }, [bill?.discountAmount, totals.addlDiscount]);

  const payment = useMemo(() => {
    // If payments array provided, group by mode; else single method
    const out = {};
    if (Array.isArray(bill?.payments) && bill.payments.length) {
      for (const p of bill.payments) {
        const key = (p.method || p.mode || bill.paymentMethod || "Cash").toUpperCase();
        out[key] = (out[key] || 0) + Number(p.amount || 0);
      }
    } else {
      const key = (bill?.paymentMethod || "Cash").toUpperCase();
      out[key] = totals.total;
    }
    return out;
  }, [bill, totals]);

  // Always use the detached BillPreview route for QR, regardless of current route
  const canonicalUrl = useMemo(() => {
    if (typeof window === 'undefined' || !bill?.id) return '';
    const origin = window.location.origin;
    return `${origin}/bill/preview/${encodeURIComponent(bill.id)}`;
  }, [bill?.id]);
  const qrSrc = useMemo(() =>
    canonicalUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(canonicalUrl)}` : '',
  [canonicalUrl]);

  // Simple inline loader while resolving the bill
  if (!delayDone || isFetching) {
    const widthPx = paperSize === '80mm' ? 360 : 300;
    return (
      <div className="min-h-screen bg-stone-50 py-4">
        <div className="mt-2">
          <div className="mx-auto" style={{ width: widthPx }}>
            <div className="rounded-lg bg-white p-3 shadow">
              <div className="mb-3 text-center">
                <Skeleton className="mx-auto h-5 w-40" />
                <Skeleton className="mx-auto mt-2 h-3 w-56" />
              </div>
              <Skeleton className="h-6 w-full" />
              <div className="my-2 h-px w-full bg-stone-200" />
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="grid grid-cols-4 gap-2">
                    <Skeleton className="col-span-2 h-4" />
                    <Skeleton className="col-span-1 h-4" />
                    <Skeleton className="col-span-1 h-4" />
                  </div>
                ))}
              </div>
              <div className="my-2 h-px w-full bg-stone-200" />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
              <div className="mt-4 text-center text-xs text-stone-500">Loading bill…</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-lg text-center">
          <p className="text-stone-600">No bill found for ID {routeId}.</p>
          <p className="mt-1 text-xs text-stone-500">If this was just created, please wait a moment or refresh to fetch the latest appointments.</p>
          {isDashboard ? (
            <Button className="mt-4" variant="outline" onClick={() => navigate(-1)}>
              <X className="mr-1 h-4 w-4" /> Back
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-4">
      <style>{`
        @media print {
          @page { size: ${paperSize} auto; margin: 0; }
          .no-print { display: none !important; }
          .receipt { width: ${paperSize} !important; max-width: ${paperSize} !important; margin: 0 !important; padding: ${paperSize === '80mm' ? '0 4mm' : '0'} !important; overflow: hidden !important; }
          .receipt * { font-family: Arial, Helvetica, sans-serif !important; font-size: ${paperSize === '80mm' ? '10px' : '9px'} !important; line-height: 1.3 !important; font-weight: 600 !important; box-sizing: border-box !important; word-break: break-word !important; overflow-wrap: anywhere !important; }
          .receipt-hr { border: 0; border-top: 1px dashed #000; margin: 6px 0; }
          body * { visibility: hidden; }
          .receipt, .receipt * { visibility: visible; }
          .receipt { position: absolute; left: 0; top: 0; }
        }
  .receipt { width: ${paperSize === '80mm' ? '360px' : '300px'}; max-width: 100%; margin: 0 auto; background: white; padding: ${paperSize === '80mm' ? '12px 16px 16px 16px' : '10px 10px 16px 10px'}; border-radius: 6px; overflow: hidden; box-sizing: border-box; font-family: Arial, Helvetica, sans-serif; }
  .receipt * { font-weight: 600; }
        .receipt-hr { border: 0; border-top: 1px dashed #d4d4d4; margin: 6px 0; }
        .divider { border-top: 1px dashed #000; margin: 6px 0; }
  .muted { color: #000; }
        .bold { font-weight: 700; }
        .right { text-align: right; }
        .center { text-align: center; }
        .header { font-size: 14px; font-weight: 700; text-align: center; }
        .sub-header { font-size: 12px; text-align: center; }
        .info { font-size: 12px; text-align: center; }
        .footer { font-size: 10px; text-align: center; }
  .meta { font-size: ${paperSize === '80mm' ? '12px' : '11px'}; row-gap: ${paperSize === '80mm' ? '6px' : '3px'}; }
        .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .table th, .table td, .totals td { padding: 2px; word-break: break-word; }
        .table thead th { border-bottom: 1px solid #000; font-weight: bold; font-size: 10px; }
  .table .nm { width: 42%; text-align: left; font-weight: 700; font-size: 11px; }
  .table .qt { width: 18%; text-align: center; font-weight: 700; font-size: 11px; }
  .table .rt { width: 20%; text-align: right; font-size: 10px; font-weight: 600; }
  .table .tl { width: 20%; text-align: right; font-weight: 700; font-size: 11px; }
  .totals { font-size: 11px; font-weight: 600; }
        .totals .grand-total { font-weight: bold; border-top: 2px solid #000; font-size: 12px; }
      `}</style>

      {/* Controls shown only inside dashboard route; hidden on standalone /bill routes */}
      {isDashboard && (
        <div className="mx-auto max-w-xl rounded-lg bg-white p-2 shadow no-print">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-800">Invoice - {bill.id}</h2>
            <div className="flex gap-2">
              <select
                aria-label="Paper size"
                className="h-8 rounded border border-stone-200 bg-white px-2 text-sm text-stone-700"
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value)}
              >
                <option value="55mm">55 mm</option>
                <option value="80mm">80 mm</option>
              </select>
              <Button variant="outline" onClick={() => window.print()} className="h-8 border-stone-200 px-2 text-stone-700">
                <Download className="mr-1 h-4 w-4" /> Print
              </Button>
              <Button variant="outline" onClick={() => navigate(-1)} className="h-8 border-stone-200 px-2 text-stone-700">
                <X className="mr-1 h-4 w-4" /> Back
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-2">
        <div className="print-content receipt">
          {/* Header */}
          <div className="header">{salonName}</div>
          <div className="sub-header" style={{ whiteSpace: 'pre-line' }}>{salonAddress}</div>
          <div className="info">Contact: {salonContact} <br/> Date: {fmtDT(bill.date)}</div>
          {/* Optional GSTIN */}
          {institutionData?.gstin || institutionData?.GSTIN ? (
            <div className="info">GSTIN: {institutionData?.gstin || institutionData?.GSTIN}</div>
          ) : null}
          <div className="divider" />

          {/* Invoice Meta */}
          <div className="muted meta" style={{ display: 'grid', gridTemplateColumns: '110px 1fr' }}>
            <div>INVOICE ID:</div><div className="bold truncate">{bill.id}</div>
            <div>CUSTOMER NAME:</div><div className="truncate" title={bill.clientName}>{bill.clientName}</div>
            {bill.phoneNumber ? (<><div>MOBILE:</div><div className="truncate">{bill.phoneNumber}</div></>) : null}
            {barberName ? (<><div>BARBER:</div><div className="truncate" title={String(barberName)}>{String(barberName)}</div></>) : null}
          </div>

          <div className="divider" />

          {/* Items Table (BillPreview2 style) */}
          <table className="table">
            <thead>
              <tr style={{ borderBottom: '2px solid #000', fontSize: 10 }}>
                <th className="nm">Item</th>
                <th className="qt">Qty</th>
                <th className="rt">Rate</th>
                <th className="tl">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => {
                const rate = Number(it.price || 0);
                const unit = it.final != null ? Number(it.final) : rate;
                const total = unit * Number(it.qty || 1);
                return (
                  <tr key={i}>
                    <td className="nm">
                      {it.name}
                      {it.staff ? (
                        <div className="muted">{String(it.staff).toUpperCase()}</div>
                      ) : null}
                    </td>
                    <td className="qt">{it.qty}</td>
                    <td className="rt">{inr(rate)}</td>
                    <td className="tl">{inr(total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="divider" />

          {/* Totals Table */}
          <table className="totals">
            <tbody>
              <tr>
                <td><b>Total Qty:</b></td>
                <td className="right">{items.reduce((a, b) => a + (Number(b.qty || 0)), 0)}</td>
              </tr>
              <tr>
                <td>Sub Total:</td>
                <td className="right">{inr(totals.subtotal)}</td>
              </tr>
              {displayDiscount > 0 ? (
                <tr>
                  <td>Discount:</td>
                  <td className="right">-{inr(displayDiscount)}</td>
                </tr>
              ) : null}
              <tr>
                <td>GST ({taxBreakup.percent} %):</td>
                <td className="right">{inr(taxBreakup.amount)}</td>
              </tr>
              <tr className="grand-total">
                <td><b>Total (Including Taxes):</b></td>
                <td className="right"><b>{inr(totals.total)}</b></td>
              </tr>
              <tr>
                <td>Paid:</td>
                <td className="right">{inr(Object.values(payment).reduce((a, b) => a + b, 0))}</td>
              </tr>
              {Object.entries(payment).map(([k, v]) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td className="right">{inr(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Loyalty and Notes */}
          <div className="muted">Loyalty points received: {bill.loyaltyPoints || 0}</div>
          <div className="muted">Notes: {bill.notes || ""}</div>

          {/* QR and footer */}
          <div className="center" style={{ marginTop: 8 }}>
            {/* Live QR for this exact preview URL */}
            {qrSrc ? (
              <img
                src={qrSrc}
                alt="Bill QR"
                style={{ width: 96, height: 96, margin: '0 auto', imageRendering: 'pixelated' }}
              />
            ) : (
              <div style={{ width: 96, height: 96, border: '1px solid #000', margin: '0 auto' }} />
            )}
            <div style={{ marginTop: 4 }}>Thank you, visit again!</div>
            <div className="muted">Empower your business with tekkzy.com</div>
            <div className="muted" style={{ marginTop: 6 }}>*Final price calculation is subjected to changes</div>
          </div>
        </div>
      </div>

      {/* Action buttons removed: no print or back buttons */}
    </div>
  );
}
