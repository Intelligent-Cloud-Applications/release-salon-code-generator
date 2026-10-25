import React, { useContext } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Receipt, Phone, Printer, CheckCircle, Smartphone, Laptop, Scissors } from "lucide-react";
import Context from "../Context/Context";
import { getStoredPrinterSettings, getStoredGstSettings } from "./SettingsPage";

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
  if (raw instanceof Date) return raw;
  if (typeof raw === "number") {
    return raw < 10000000000 ? new Date(raw * 1000) : new Date(raw);
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
  const { institutionData, landingPageData } = useContext(Context) || {};

  if (!isOpen || !bill) return null;

  const printerSettings = getStoredPrinterSettings();
  const gstSettings = getStoredGstSettings(institutionData);

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
  const isBluetooth = printerSettings.printerType === "bluetooth";
  const paperSize = printerSettings.paperSize || "80mm";

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
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatTime = (input) => {
    const d = parseSafeDate(input);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const handlePrint = () => {
    try {
      const printElement = document.getElementById("thermal-receipt-print-area");
      if (!printElement) {
        window.print();
        return;
      }

      // Check if existing print iframe exists and remove it
      let iframe = document.getElementById("thermal-print-iframe");
      if (iframe) {
        iframe.remove();
      }

      const targetWidth = paperSize === "58mm" ? "58mm" : "80mm";
      iframe = document.createElement("iframe");
      iframe.id = "thermal-print-iframe";
      // Off-screen layout with full dimensions to prevent blank white print preview in Chromium/WebKit
      iframe.style.position = "fixed";
      iframe.style.left = "-9999px";
      iframe.style.top = "-9999px";
      iframe.style.width = targetWidth;
      iframe.style.height = "1200px";
      iframe.style.border = "none";
      iframe.style.zIndex = "-9999";
      document.body.appendChild(iframe);

      const receiptHtml = printElement.innerHTML;

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Receipt-${bill.id || "INV"}</title>
            <style>
              @page {
                margin: 0;
                size: ${targetWidth} auto;
              }
              html, body {
                margin: 0;
                padding: 0;
                background: #ffffff;
                color: #000000;
              }
              body {
                width: ${targetWidth};
                max-width: ${targetWidth};
                padding: 2.5mm 1.5mm;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Courier New", Courier, monospace;
                font-size: 11px;
                line-height: 1.35;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                box-sizing: border-box;
              }
              * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
              }
              img {
                max-width: 65%;
                max-height: 44px;
                display: block;
                margin: 0 auto 5px auto;
                object-fit: contain;
              }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .text-left { text-align: left; }
              .font-bold { font-weight: 700; }
              .font-black { font-weight: 900; }
              .font-medium { font-weight: 500; }
              .font-semibold { font-weight: 600; }
              .font-mono { font-family: "Courier New", Courier, monospace; }
              .uppercase { text-transform: uppercase; }
              .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
              .flex { display: flex; }
              .justify-between { justify-content: space-between; }
              .items-center { align-items: center; }
              .w-full { width: 100%; }
              .w-1\\/2 { width: 50%; }
              .w-1\\/6 { width: 16.666667%; }
              .w-1\\/3 { width: 33.333333%; }
              .border-b { border-bottom: 1px dashed #444444; }
              .border-t { border-top: 1px dashed #444444; }
              .border-dashed { border-style: dashed; }
              .py-1 { padding-top: 2px; padding-bottom: 2px; }
              .py-1\\.5 { padding-top: 3px; padding-bottom: 3px; }
              .py-2 { padding-top: 4px; padding-bottom: 4px; }
              .pb-1 { padding-bottom: 2px; }
              .pb-2 { padding-bottom: 4px; }
              .pt-1 { padding-top: 2px; }
              .pt-2 { padding-top: 4px; }
              .pl-2 { padding-left: 8px; }
              .mt-1 { margin-top: 4px; }
              .space-y-0\\.5 > * + * { margin-top: 2px; }
              .space-y-1 > * + * { margin-top: 3px; }
              .divide-y > * + * { border-top: 1px dashed #cccccc; }
              .text-\\[10px\\] { font-size: 10px; }
              .text-\\[9px\\] { font-size: 9px; }
              .text-\\[8px\\] { font-size: 8px; }
              .text-\\[11px\\] { font-size: 11px; }
              .text-xs { font-size: 12px; }
              .text-sm { font-size: 13px; }
              .text-slate-900, .text-slate-800, .text-slate-700 { color: #000000; }
              .text-slate-600, .text-slate-500, .text-slate-400 { color: #111111; }
              .text-emerald-700, .text-emerald-600 { color: #000000; }
              .text-blue-600 { color: #000000; }
              .shadow-sm, .border, .rounded-lg { border: none !important; box-shadow: none !important; }
            </style>
          </head>
          <body>
            ${receiptHtml}
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (err) {
          console.warn("Iframe print fallback to window.print:", err);
          window.print();
        }
      }, 300);
    } catch (e) {
      console.error("Print failed:", e);
      window.print();
    }
  };

  // Payment Breakdown
  const isSplitPayment =
    (bill.paymentMode || bill.paymentMethod || "").toLowerCase() === "split" ||
    !!bill.paymentSplit;
  const splitDetails = bill.paymentSplit || {};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[92vh] w-[95vw] max-w-md flex-col overflow-hidden p-0 rounded-2xl border border-slate-200 shadow-2xl">
        {/* Printable Thermal Receipt Component */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                margin: 0;
                size: ${paperSize === "58mm" ? "58mm" : "80mm"} auto;
              }
              body * {
                visibility: hidden !important;
              }
              #thermal-receipt-print-area, #thermal-receipt-print-area * {
                visibility: visible !important;
              }
              #thermal-receipt-print-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: ${paperSize === "58mm" ? "58mm" : "80mm"} !important;
                margin: 0 !important;
                padding: 2.5mm !important;
                font-family: monospace !important;
                color: #000000 !important;
                background: #ffffff !important;
                border: none !important;
                box-shadow: none !important;
                z-index: 9999999 !important;
              }
            }
          `
        }} />

        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-sm sm:text-base font-bold text-white">
                {isDraft ? "Draft Bill / Estimate Preview" : isReprint ? "Tax Invoice Receipt" : "Invoice Preview & Settlement"}
              </DialogTitle>
              <p className="text-[11px] text-slate-400">
                {isDraft ? "Pro-forma draft before payment" : `Invoice #${bill.id || "N/A"}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[10px] font-mono flex items-center gap-1">
              {isBluetooth ? <Smartphone className="w-3 h-3 text-blue-400" /> : <Laptop className="w-3 h-3 text-indigo-400" />}
              {paperSize}
            </Badge>
            <Badge className={isDraft ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] uppercase font-bold" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] uppercase font-bold"}>
              {isDraft ? "Draft" : bill.status || "Completed"}
            </Badge>
          </div>
        </div>

        {/* Thermal Receipt Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100 flex justify-center">
          <div
            id="thermal-receipt-print-area"
            className={cn(
              "bg-white rounded-lg p-4 shadow-sm border border-slate-200 text-slate-900 font-mono text-[11px] leading-relaxed w-full transition-all",
              paperSize === "58mm" ? "max-w-[280px]" : "max-w-[340px]"
            )}
          >
            {/* Header: Logo, Salon Name, Address, GSTIN */}
            <div className="text-center space-y-1 pb-2 border-b border-dashed border-slate-300">
              {salonLogo && (
                <img src={salonLogo} alt="Logo" className="h-8 mx-auto object-contain mb-1" />
              )}
              <h3 className="font-black text-sm uppercase tracking-tight text-slate-900 leading-tight">
                {salonName}
              </h3>
              {salonAddress && <p className="text-[10px] text-slate-600 leading-tight">{salonAddress}</p>}
              {salonPhone && <p className="text-[10px] text-slate-600">Tel: {salonPhone}</p>}
              {gstNumber && (
                <p className="text-[10px] font-bold text-slate-800">
                  GSTIN: {gstNumber}
                </p>
              )}
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-900 pt-1">
                *** {isDraft ? "DRAFT BILL / ESTIMATE" : (printerSettings.receiptTitle || "TAX INVOICE")} ***
              </p>
            </div>

            {/* Bill Meta */}
            <div className="space-y-0.5 text-[10px] py-2 border-b border-dashed border-slate-300">
              <div className="flex justify-between">
                <span>Inv #: {bill.id || "INV-DRAFT"}</span>
                <span>Date: {formatDate(bill.rawDate || bill.date)}</span>
              </div>
              <div className="flex justify-between">
                <span>Client: <strong>{bill.clientName || "Walk-in Client"}</strong></span>
                <span>Time: {formatTime(bill.rawDate || bill.date)}</span>
              </div>
              {bill.phoneNumber && (
                <div className="flex justify-between text-slate-600">
                  <span>Phone: {bill.phoneNumber}</span>
                  {printerSettings.showStylist && <span>Stylist: {bill.staff || "Assigned"}</span>}
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-2 border-b border-dashed border-slate-300">
              <div className="flex justify-between font-bold border-b border-slate-200 pb-1 text-[10px] text-slate-700">
                <span className="w-1/2">Item</span>
                <span className="w-1/6 text-center">Qty</span>
                <span className="w-1/3 text-right">Amount</span>
              </div>
              <div className="divide-y divide-slate-100 pt-1">
                {(() => {
                  const items = [];
                  if (Array.isArray(bill.items) && bill.items.length > 0) {
                    items.push(...bill.items);
                  } else {
                    if (Array.isArray(bill.services)) {
                      items.push(...bill.services.map((s) => (typeof s === "string" ? { serviceName: s, isProduct: false } : { ...s, isProduct: false })));
                    }
                    if (Array.isArray(bill.products)) {
                      items.push(...bill.products.map((p) => ({ ...p, isProduct: true })));
                    }
                  }

                  if (items.length === 0) {
                    return (
                      <div className="py-1.5 text-center text-slate-400">
                        Salon Treatment
                      </div>
                    );
                  }

                  return items.map((item, idx) => {
                    const name = item.serviceName || item.productName || item.name || "Treatment";
                    const qty = Number(item.quantity) || 1;
                    const unitPrice = Number(item.amount != null ? item.amount : item.price != null ? item.price : 0) ||
                      (items.length > 0 ? Math.round(Number(bill.subtotal || bill.total || 0) / items.length) : 0);
                    const totalItemPrice = unitPrice * qty;

                    return (
                      <div key={idx} className="flex justify-between py-1 text-[10px]">
                        <div className="w-1/2 truncate font-medium">
                          {name}
                          {item.isProduct && <span className="text-[8px] text-indigo-600 ml-1">(Prod)</span>}
                        </div>
                        <div className="w-1/6 text-center font-bold">{qty}</div>
                        <div className="w-1/3 text-right font-bold font-mono">
                          {formatCurrency(totalItemPrice)}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Calculations & GST */}
            <div className="space-y-0.5 text-[10px] py-2 border-b border-dashed border-slate-300">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-bold font-mono">{formatCurrency(bill.subtotal)}</span>
              </div>
              {Number(bill.discount || 0) > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span className="font-mono">-{formatCurrency(bill.discount)}</span>
                </div>
              )}
              {Number(bill.tax || 0) > 0 && (
                <>
                  {printerSettings.showGstBreakdown ? (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>CGST ({(Number(bill.gstPercent || 18) / 2).toFixed(1)}%):</span>
                        <span className="font-mono">+{formatCurrency(Number(bill.tax) / 2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>SGST ({(Number(bill.gstPercent || 18) / 2).toFixed(1)}%):</span>
                        <span className="font-mono">+{formatCurrency(Number(bill.tax) / 2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-slate-600">
                      <span>GST ({bill.gstPercent || 0}%):</span>
                      <span className="font-mono">+{formatCurrency(bill.tax)}</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between font-black text-xs text-slate-900 pt-1 border-t border-slate-300 mt-1">
                <span>TOTAL PAYABLE:</span>
                <span className="text-blue-600 font-mono">{formatCurrency(bill.total)}</span>
              </div>
            </div>

            {/* Payment Modes & Split Payment */}
            <div className="space-y-0.5 text-[10px] py-1.5 border-b border-dashed border-slate-300">
              {isSplitPayment ? (
                <>
                  <p className="font-bold text-slate-800">Payment Mode: Split Payment</p>
                  {Number(splitDetails.cash || 0) > 0 && (
                    <div className="flex justify-between text-slate-600 pl-2">
                      <span>• Cash Received:</span>
                      <span className="font-mono font-bold">{formatCurrency(splitDetails.cash)}</span>
                    </div>
                  )}
                  {Number(splitDetails.upi || 0) > 0 && (
                    <div className="flex justify-between text-slate-600 pl-2">
                      <span>• UPI Paid:</span>
                      <span className="font-mono font-bold">{formatCurrency(splitDetails.upi)}</span>
                    </div>
                  )}
                  {Number(splitDetails.card || 0) > 0 && (
                    <div className="flex justify-between text-slate-600 pl-2">
                      <span>• Card Paid:</span>
                      <span className="font-mono font-bold">{formatCurrency(splitDetails.card)}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex justify-between font-semibold">
                  <span>Payment Mode:</span>
                  <span className="uppercase font-bold">{bill.paymentMethod || "Cash"}</span>
                </div>
              )}
            </div>

            {/* Footer Notes */}
            <div className="text-center pt-2 text-[9px] text-slate-500 space-y-0.5">
              <p className="font-bold text-slate-800">{printerSettings.footerMessage || "Thank you for visiting! Please visit again."}</p>
              {printerSettings.termsAndConditions && (
                <p className="text-[8px] leading-tight text-slate-400">{printerSettings.termsAndConditions}</p>
              )}
              <p className="text-[8px] text-slate-400 pt-1">
                *** {isDraft ? "ESTIMATE ONLY - NOT A TAX INVOICE" : "THANK YOU"} ***
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white px-5 py-3 border-t border-slate-200 flex flex-wrap justify-between items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-slate-200 text-slate-700 hover:bg-slate-100 text-xs h-8 cursor-pointer"
          >
            Close
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="border-slate-300 text-slate-800 hover:bg-slate-100 text-xs h-8 font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              <span>Print {isBluetooth ? "Bluetooth" : "Receipt"}</span>
            </Button>

            {isDraft && onConfirmSettle && (
              <Button
                size="sm"
                onClick={onConfirmSettle}
                disabled={isSettling}
                className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs h-8 px-3.5 cursor-pointer shadow-xs"
              >
                <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                <span>Confirm & Settle Now</span>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BillPrintModal;
