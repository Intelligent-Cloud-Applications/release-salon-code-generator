import React, { useContext, useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Receipt,
  Printer,
  CheckCircle,
  Copy,
  Check,
  X,
  Share2,
} from "lucide-react";
import { cn } from "../lib/utils";
import Context from "../Context/Context";
import { getStoredPrinterSettings, getStoredGstSettings } from "./SettingsPage";
import { directPrintBill } from "../lib/printerService";
import { parsePaymentSplit, isSplitPayment as checkIsSplit, formatPaymentSummary, buildDeduplicatedBillItems } from "../lib/paymentUtils";

export const formatCurrency = (amount, currency = "INR") => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(num);
};

export const parseAppointmentDate = (raw) => {
  if (!raw) return new Date();
  if (raw instanceof Date) return isNaN(raw.getTime()) ? new Date() : raw;
  if (typeof raw === "number") {
    return raw < 10000000000 ? new Date(raw * 1000) : new Date(raw);
  }
  if (typeof raw === "string") {
    const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmy) {
      return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
    }
  }
  const parsed = new Date(raw);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
};

export const BillPrintModal = ({
  isOpen,
  onClose,
  bill,
  onConfirmSettle,
  isReprint = false,
  isDraft = false,
  isSettling = false,
}) => {
  // 1. Hook: Context
  const { institutionData, landingPageData } = useContext(Context) || {};

  const printerSettings = getStoredPrinterSettings(institutionData);
  const gstSettings = getStoredGstSettings(institutionData);

  // 2. Hook: activePaperSize State
  const [activePaperSize, setActivePaperSize] = useState(
    printerSettings?.paperSize || "80mm"
  );

  // 3. Hook: copied State
  const [copied, setCopied] = useState(false);

  // 4. Hook: Sync printer settings Effect
  useEffect(() => {
    if (printerSettings?.paperSize) {
      setActivePaperSize(printerSettings.paperSize);
    }
  }, [printerSettings?.paperSize]);

  // Safe bill reference for memoized hooks so they never break even if bill is null
  const safeBill = bill || {};
  const rawSubtotal = Number(safeBill.subtotal || 0);
  const rawTotal = Number(safeBill.total || 0);
  const discount = Number(safeBill.discount || safeBill.discountAmount || 0);
  const tax = Number(safeBill.tax || 0);

  // 5. Hook: computedSubtotal Memo
  const computedSubtotal = useMemo(() => {
    if (rawSubtotal > 0) return rawSubtotal;
    if (rawTotal > 0) return Math.max(0, rawTotal - tax + discount);
    return 0;
  }, [rawSubtotal, rawTotal, tax, discount]);

  // 6. Hook: computedTotal Memo
  const computedTotal = useMemo(() => {
    if (rawTotal > 0) return rawTotal;
    const calc = computedSubtotal + tax - discount;
    return calc > 0 ? calc : computedSubtotal;
  }, [rawTotal, computedSubtotal, tax, discount]);

  // 7. Hook: billItems Memo - Deduplicated to ensure products are not listed twice
  const billItems = useMemo(() => {
    return buildDeduplicatedBillItems(safeBill);
  }, [safeBill]);

  // All hooks have been called unconditionally!
  // Safe early return if modal is closed or no bill provided
  if (!isOpen || !bill) return null;

  const salonName =
    institutionData?.companyName ||
    institutionData?.InstitutionName ||
    landingPageData?.navigation?.logo?.text ||
    "Tekkzy Hair Salon";

  const salonLogo =
    institutionData?.logoUrl ||
    landingPageData?.navigation?.logo?.image ||
    "";

  const salonPhone =
    institutionData?.Query_PhoneNumber ||
    institutionData?.Contact ||
    institutionData?.phoneNumber ||
    "";

  const salonAddress =
    institutionData?.Query_Address ||
    institutionData?.Address ||
    "";

  const gstNumber = gstSettings.gstNumber || institutionData?.gstNumber || "";

  const parseSafeDate = (input) => {
    if (!input) return new Date();
    if (input instanceof Date) return isNaN(input.getTime()) ? new Date() : input;
    if (typeof input === "number") {
      return input < 10000000000 ? new Date(input * 1000) : new Date(input);
    }
    if (typeof input === "string") {
      const dmy = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (dmy) {
        return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
      }
      const d = new Date(input);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  };

  const formatDate = (input) => {
    const d = parseSafeDate(input);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (input) => {
    const d = parseSafeDate(input);
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Payment Breakdown
  const parsedSplit = parsePaymentSplit(bill);
  const isSplitPayment = checkIsSplit(bill) || !!parsedSplit;
  const splitDetails = parsedSplit || {};

  // Print execution: delegates to directPrintBill (Bluetooth ESC/POS or USB direct print)
  const handlePrint = async () => {
    try {
      await directPrintBill(bill, institutionData, {
        ...printerSettings,
        paperSize: activePaperSize,
      });
    } catch (e) {
      console.error("Print execution error:", e);
    }
  };

  // Copy Plain Text Receipt for WhatsApp / SMS
  const handleCopyTextReceipt = () => {
    try {
      const dateStr = formatDate(bill.rawDate || bill.date);
      const timeStr = formatTime(bill.rawDate || bill.date);
      const lines = [
        "===============================",
        `     ${salonName.toUpperCase()}`,
        salonAddress ? `  ${salonAddress}` : "",
        salonPhone ? `  Tel: ${salonPhone}` : "",
        gstNumber ? `  GSTIN: ${gstNumber}` : "",
        "===============================",
`Date: ${dateStr} ${timeStr}`,
        `Client: ${bill.clientName || "Walk-in"}`,
        bill.phoneNumber ? `Phone: ${bill.phoneNumber}` : "",
"-------------------------------",
        "ITEMS & SERVICES:",
      ];

      if (billItems.length === 0) {
        lines.push(`- Salon Treatment: ${formatCurrency(computedTotal)}`);
      } else {
        billItems.forEach((it) => {
          const name = it.serviceName || it.productName || it.name || "Treatment";
          const qty = Number(it.quantity) || 1;
          const unit =
            Number(
              it.amount != null ? it.amount : it.price != null ? it.price : 0
            ) ||
            (billItems.length > 0
              ? Math.round(computedSubtotal / billItems.length)
              : 0);
          lines.push(`- ${name} (x${qty}): ${formatCurrency(unit * qty)}`);
        });
      }

      lines.push("-------------------------------");
      lines.push(`Subtotal: ${formatCurrency(computedSubtotal)}`);
      if (discount > 0) lines.push(`Discount: -${formatCurrency(discount)}`);
      if (tax > 0) lines.push(`Tax/GST: +${formatCurrency(tax)}`);
      lines.push(`TOTAL PAYABLE: ${formatCurrency(computedTotal)}`);

      if (isSplitPayment) {
        lines.push("Payment: Split Payment");
        if (Number(splitDetails.cash || 0) > 0) {
          lines.push(`- Cash: ${formatCurrency(splitDetails.cash)}`);
        }
        if (Number(splitDetails.upi || 0) > 0) {
          lines.push(`- UPI: ${formatCurrency(splitDetails.upi)}`);
        }
        if (Number(splitDetails.card || 0) > 0) {
          lines.push(`- Card: ${formatCurrency(splitDetails.card)}`);
        }
      } else {
        lines.push(`Payment: ${bill.paymentMethod || bill.paymentMode || "Cash"}`);
      }

      lines.push("===============================");
      lines.push(
        printerSettings?.footerMessage ||
          "Thank you for visiting! Please visit again."
      );

      const text = lines.filter((l) => l !== "").join("\n");
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy receipt:", err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[92dvh] w-[96vw] max-w-md flex-col overflow-hidden p-0 rounded-2xl border border-slate-200 shadow-2xl bg-white [&>button.absolute]:hidden">
        <DialogTitle className="sr-only">Invoice Details</DialogTitle>
        <DialogDescription className="sr-only">
          Preview and print thermal bill receipt
        </DialogDescription>

        {/* Global Print Style for Mobile & Direct Printing */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              #thermal-print-direct-portal {
                display: none;
              }
              @media print {
                @page {
                  margin: 0;
                  size: ${activePaperSize} auto;
                }
                body {
                  margin: 0 !important;
                  padding: 0 !important;
                  background: #ffffff !important;
                  color: #000000 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                body > *:not(#thermal-print-direct-portal):not(#thermal-receipt-print-area) {
                  display: none !important;
                }
                #thermal-print-direct-portal {
                  display: block !important;
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: ${activePaperSize} !important;
                  max-width: ${activePaperSize} !important;
                  margin: 0 !important;
                  padding: 2.5mm 1.5mm !important;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Courier New", Courier, monospace !important;
                  font-size: 11px !important;
                  line-height: 1.35 !important;
                  background: #ffffff !important;
                  color: #000000 !important;
                  box-sizing: border-box !important;
                  z-index: 99999999 !important;
                }
              }
            `,
          }}
        />

        {/* Modal Header */}
        <div className="bg-white px-4 sm:px-5 py-3.5 border-b border-slate-200/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <Receipt className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
                {isDraft
                  ? "Draft Bill / Estimate"
                  : isReprint
                  ? "Tax Invoice Receipt"
                  : "Invoice Preview"}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-slate-500 font-mono font-semibold">
                  {isDraft ? "Pro-forma draft" : `#${bill.id || "N/A"}`}
                </span>
                <span className="text-slate-300">•</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] uppercase font-bold px-2 py-0 rounded-full border",
                    isDraft
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  )}
                >
                  {isDraft ? "Draft" : bill.status || "Completed"}
                </Badge>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Paper Size Quick Selector Toolbar */}
        <div className="bg-slate-50/90 px-4 sm:px-5 py-2 border-b border-slate-200/80 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-slate-600 text-xs font-semibold">
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Roll Width:</span>
          </div>
          <div className="grid grid-cols-2 gap-1 bg-slate-200/70 p-0.5 rounded-lg w-48 sm:w-52">
            <button
              type="button"
              onClick={() => setActivePaperSize("80mm")}
              className={cn(
                "py-1 rounded-md text-[11px] font-bold text-center transition-all cursor-pointer",
                activePaperSize === "80mm"
                  ? "bg-white text-blue-700 shadow-xs ring-1 ring-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              80mm (Standard)
            </button>
            <button
              type="button"
              onClick={() => setActivePaperSize("58mm")}
              className={cn(
                "py-1 rounded-md text-[11px] font-bold text-center transition-all cursor-pointer",
                activePaperSize === "58mm"
                  ? "bg-white text-blue-700 shadow-xs ring-1 ring-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              58mm (Compact)
            </button>
          </div>
        </div>

        {/* Thermal Receipt Body (Clean Professional On-Screen Preview) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-50/70 flex justify-center">
          <div
            id="thermal-receipt-print-area"
            className={cn(
              "bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/90 text-slate-900 font-mono text-[11px] leading-relaxed w-full transition-all duration-150 self-start",
              activePaperSize === "58mm" ? "max-w-[275px]" : "max-w-[340px]"
            )}
          >
            {/* Header: Logo, Salon Name, Address, GSTIN */}
            <div className="text-center space-y-1 pb-2.5 border-b border-dashed border-slate-300">
              {salonLogo && (
                <img
                  src={salonLogo}
                  alt="Logo"
                  className="h-8 mx-auto object-contain mb-1.5"
                />
              )}
              <h3 className="font-black text-sm uppercase tracking-tight text-slate-900 leading-tight">
                {salonName}
              </h3>
              {salonAddress && (
                <p className="text-[10px] text-slate-600 leading-tight">
                  {salonAddress}
                </p>
              )}
              {salonPhone && (
                <p className="text-[10px] text-slate-600">Tel: {salonPhone}</p>
              )}
              {gstNumber && (
                <p className="text-[10px] font-bold text-slate-800">
                  GSTIN: {gstNumber}
                </p>
              )}
              <div className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[10px] font-bold tracking-wider uppercase mt-1">
                {isDraft
                  ? "DRAFT BILL / ESTIMATE"
                  : printerSettings?.receiptTitle || "TAX INVOICE"}
              </div>
            </div>

            {/* Bill Meta */}
            <div className="space-y-1 text-[10px] py-2.5 border-b border-dashed border-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Time:</span>
                <span className="text-slate-800">{formatDate(bill.rawDate || bill.date)} {formatTime(bill.rawDate || bill.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Client:</span>
                <span className="font-bold text-slate-900">{bill.clientName || "Walk-in Client"}</span>
              </div>
              {bill.phoneNumber && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span className="text-slate-800">{bill.phoneNumber}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-2.5 border-b border-dashed border-slate-300">
              <div className="flex justify-between font-bold border-b border-slate-200 pb-1.5 text-[9px] uppercase tracking-wider text-slate-500">
                <span className="w-1/2">Item / Service</span>
                <span className="w-1/6 text-center">Qty</span>
                <span className="w-1/3 text-right">Amount</span>
              </div>
              <div className="divide-y divide-slate-100 pt-1">
                {billItems.length === 0 ? (
                  <div className="flex justify-between py-1.5 text-[10px]">
                    <div className="w-1/2 font-medium">Salon Treatment</div>
                    <div className="w-1/6 text-center font-bold">1</div>
                    <div className="w-1/3 text-right font-bold font-mono">
                      {formatCurrency(computedTotal)}
                    </div>
                  </div>
                ) : (
                  billItems.map((item, idx) => {
                    const name =
                      item.serviceName ||
                      item.productName ||
                      item.name ||
                      "Treatment";
                    const qty = Number(item.quantity) || 1;
                    const unitPrice =
                      Number(
                        item.amount != null
                          ? item.amount
                          : item.price != null
                          ? item.price
                          : 0
                      ) ||
                      (billItems.length > 0
                        ? Math.round(computedSubtotal / billItems.length)
                        : 0);
                    const totalItemPrice = unitPrice * qty;

                    return (
                      <div
                        key={idx}
                        className="flex justify-between py-1.5 text-[10px]"
                      >
                        <div className="w-1/2 truncate font-medium text-slate-800">
                          {name}
                          {item.isProduct && (
                            <span className="text-[8px] text-indigo-600 font-semibold ml-1">
                              (Prod)
                            </span>
                          )}
                        </div>
                        <div className="w-1/6 text-center font-bold text-slate-700">{qty}</div>
                        <div className="w-1/3 text-right font-bold font-mono text-slate-900">
                          {formatCurrency(totalItemPrice)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Calculations & GST */}
            <div className="space-y-1 text-[10px] py-2.5 border-b border-dashed border-slate-300">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-bold font-mono text-slate-900">
                  {formatCurrency(computedSubtotal)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount:</span>
                  <span className="font-mono">
                    -{formatCurrency(discount)}
                  </span>
                </div>
              )}
              {tax > 0 && (
                <>
                  {printerSettings?.showGstBreakdown ? (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>
                          CGST (
                          {(
                            Number(bill.gstPercent || 18) / 2
                          ).toFixed(1)}
                          %):
                        </span>
                        <span className="font-mono">
                          +{formatCurrency(tax / 2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>
                          SGST (
                          {(
                            Number(bill.gstPercent || 18) / 2
                          ).toFixed(1)}
                          %):
                        </span>
                        <span className="font-mono">
                          +{formatCurrency(tax / 2)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-slate-600">
                      <span>GST ({bill.gstPercent || 0}%):</span>
                      <span className="font-mono">
                        +{formatCurrency(tax)}
                      </span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between items-center font-black text-xs text-slate-900 pt-2 border-t border-slate-200 mt-1">
                <span className="uppercase tracking-tight">TOTAL PAYABLE:</span>
                <span className="text-blue-700 font-mono text-sm font-black">
                  {formatCurrency(computedTotal)}
                </span>
              </div>
            </div>

            {/* Payment Modes & Split Payment */}
            <div className="space-y-1 text-[10px] py-2 border-b border-dashed border-slate-300">
              {isSplitPayment ? (
                <>
                  <p className="font-bold text-slate-800">
                    Payment Mode: Split Payment
                  </p>
                  {Number(splitDetails.cash || 0) > 0 && (
                    <div className="flex justify-between text-slate-600 pl-2">
                      <span>• Cash Received:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatCurrency(splitDetails.cash)}
                      </span>
                    </div>
                  )}
                  {Number(splitDetails.upi || 0) > 0 && (
                    <div className="flex justify-between text-slate-600 pl-2">
                      <span>• UPI Paid:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatCurrency(splitDetails.upi)}
                      </span>
                    </div>
                  )}
                  {Number(splitDetails.card || 0) > 0 && (
                    <div className="flex justify-between text-slate-600 pl-2">
                      <span>• Card Paid:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatCurrency(splitDetails.card)}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex justify-between items-center font-semibold">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span className="uppercase font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                    {bill.paymentMode || bill.paymentMethod || "Cash"}
                  </span>
                </div>
              )}
            </div>

            {/* Footer Notes */}
            <div className="text-center pt-2.5 text-[9px] text-slate-500 space-y-0.5">
              <p className="font-bold text-slate-800">
                {printerSettings?.footerMessage ||
                  "Thank you for visiting! Please visit again."}
              </p>
              {printerSettings?.termsAndConditions && (
                <p className="text-[8px] leading-tight text-slate-400">
                  {printerSettings.termsAndConditions}
                </p>
              )}
              <p className="text-[8px] text-slate-400 pt-1 font-semibold">
                ***{" "}
                {isDraft
                  ? "ESTIMATE ONLY - NOT A TAX INVOICE"
                  : "THANK YOU"}
                ***
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: 100% Symmetric Grid Layout */}
        <div className="bg-white px-4 sm:px-5 py-3.5 border-t border-slate-200/90 shrink-0 space-y-2">
          {isDraft && onConfirmSettle ? (
            <>
              {/* Draft with Settlement: 2 Primary Symmetric Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="default"
                  onClick={handlePrint}
                  className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-[0.98] transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>
                    {printerSettings?.printerType === "bluetooth"
                      ? "Print Bluetooth"
                      : `Print ${activePaperSize}`}
                  </span>
                </Button>

                <Button
                  onClick={onConfirmSettle}
                  disabled={isSettling}
                  className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-[0.98] transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{isSettling ? "Settling..." : "Confirm & Settle"}</span>
                </Button>
              </div>

              {/* Secondary Row: Equal 50/50 width */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={handleCopyTextReceipt}
                  className="w-full h-9 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Copy receipt text to send via WhatsApp or SMS"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Text</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={onClose}
                  className="w-full h-9 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 text-slate-500" />
                  <span>Close</span>
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* View / Reprint Mode: Full-Width Prominent Primary Print Button */}
              <Button
                variant="default"
                onClick={handlePrint}
                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-[0.98] transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>
                  {printerSettings?.printerType === "bluetooth"
                    ? "Print via Bluetooth ESC/POS"
                    : `Print Receipt (${activePaperSize})`}
                </span>
              </Button>

              {/* Symmetric 50/50 Secondary Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={handleCopyTextReceipt}
                  className="w-full h-9.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Copy receipt text to send via WhatsApp or SMS"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Text</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={onClose}
                  className="w-full h-9.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 text-slate-500" />
                  <span>Close Preview</span>
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BillPrintModal;
