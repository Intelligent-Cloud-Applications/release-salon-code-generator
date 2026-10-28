/**
 * Thermal Printer Service for Salon POS
 * Supports:
 * 1. Web Bluetooth ESC/POS Direct Printing (58mm & 80mm)
 * 2. USB / Desktop Thermal Direct Printing (58mm & 80mm) without modal popup
 */

import { getStoredPrinterSettings, getStoredGstSettings } from "../dashboard/SettingsPage";
import { parsePaymentSplit, buildDeduplicatedBillItems } from "./paymentUtils";

// In-memory cache for paired Bluetooth device & characteristic to avoid repeated pairing prompts
let cachedBluetoothDevice = null;
let cachedCharacteristic = null;

// Standard known Bluetooth Thermal Printer GATT Services & Characteristics
const KNOWN_PRINTER_SERVICES = [
  "000018f0-0000-1000-8000-00805f9b34fb", // Standard ESC/POS Service
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2", // Common Chinese Thermal Printer Service
  "49535343-fe7d-4ae5-8fa9-9fafd205e455", // ISSC Transparent Serial UART
  "0000ff00-0000-1000-8000-00805f9b34fb", // Generic 0xFF00
  "0000ff12-0000-1000-8000-00805f9b34fb", // Feasycom / AI-Thinker
  "0000fee7-0000-1000-8000-00805f9b34fb", // MPT-II / POS-58
  "0000af30-0000-1000-8000-00805f9b34fb",
  "0000ae00-0000-1000-8000-00805f9b34fb",
  "0000ae30-0000-1000-8000-00805f9b34fb",
];

export const isWebBluetoothSupported = () => {
  return typeof navigator !== "undefined" && Boolean(navigator.bluetooth);
};

export const formatCurrencyINR = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
};

/**
 * Connect to a Bluetooth Thermal Printer via Web Bluetooth API
 */
export const connectBluetoothPrinter = async () => {
  if (!isWebBluetoothSupported()) {
    throw new Error(
      "Web Bluetooth is not supported by your browser. Please use Chrome/Edge on Android or Desktop, or switch to USB printing in Settings."
    );
  }

  // Reuse existing connection if active
  if (
    cachedBluetoothDevice &&
    cachedBluetoothDevice.gatt &&
    cachedBluetoothDevice.gatt.connected &&
    cachedCharacteristic
  ) {
    return { device: cachedBluetoothDevice, characteristic: cachedCharacteristic };
  }

  // Request Bluetooth Device
  const device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: KNOWN_PRINTER_SERVICES,
  });

  if (!device) {
    throw new Error("No Bluetooth printer selected.");
  }

  const server = await device.gatt.connect();

  let writableChar = null;

  // 1. Try probing each known service directly
  for (const sUuid of KNOWN_PRINTER_SERVICES) {
    try {
      const service = await server.getPrimaryService(sUuid);
      const chars = await service.getCharacteristics();
      for (const c of chars) {
        if (c.properties.write || c.properties.writeWithoutResponse) {
          writableChar = c;
          break;
        }
      }
      if (writableChar) break;
    } catch (e) {
      // Continue to next service
    }
  }

  // 2. Fallback: discover all primary services
  if (!writableChar) {
    try {
      const services = await server.getPrimaryServices();
      for (const service of services) {
        try {
          const chars = await service.getCharacteristics();
          for (const c of chars) {
            if (c.properties.write || c.properties.writeWithoutResponse) {
              writableChar = c;
              break;
            }
          }
          if (writableChar) break;
        } catch (err) {}
      }
    } catch (err) {}
  }

  if (!writableChar) {
    throw new Error(
      "Could not find a writable ESC/POS characteristic on this Bluetooth device. Make sure it is an ESC/POS thermal printer."
    );
  }

  // Cache device and handle disconnection
  cachedBluetoothDevice = device;
  cachedCharacteristic = writableChar;

  device.addEventListener("gattserverdisconnected", () => {
    cachedBluetoothDevice = null;
    cachedCharacteristic = null;
  });

  return { device, characteristic: writableChar };
};

/**
 * Build ESC/POS Byte Array from bill data
 */
export const buildEscPosPayload = (bill, institutionData, printerSettings) => {
  const paperSize = printerSettings?.paperSize || "80mm";
  const cols = paperSize === "58mm" ? 32 : 42; // Column width for text wrapping

  const encoder = new TextEncoder();
  const bytes = [];

  const addBytes = (...arr) => bytes.push(...arr);
  const addText = (str) => {
    // Replace Indian Rupee symbol ₹ with Rs. to prevent corrupted characters on thermal printers
    const safeStr = (str || "").replace(/₹/g, "Rs. ");
    const encoded = encoder.encode(safeStr);
    for (let i = 0; i < encoded.length; i++) {
      bytes.push(encoded[i]);
    }
  };

  // Helper row formatters
  const makeRow = (left, right) => {
    const l = String(left || "");
    const r = String(right || "");
    const spaces = Math.max(1, cols - l.length - r.length);
    return l + " ".repeat(spaces) + r + "\n";
  };

  const makeItemRow = (name, qty, amt) => {
    if (cols === 32) {
      // 58mm: 16 chars name, 4 chars qty, 12 chars amt
      const n = String(name || "").slice(0, 16).padEnd(16);
      const q = String(qty || 1).padStart(4);
      const a = String(amt || "").padStart(12);
      return n + q + a + "\n";
    } else {
      // 80mm: 22 chars name, 6 chars qty, 14 chars amt
      const n = String(name || "").slice(0, 22).padEnd(22);
      const q = String(qty || 1).padStart(6);
      const a = String(amt || "").padStart(14);
      return n + q + a + "\n";
    }
  };

  // ESC/POS Command Constants
  const ESC_INIT = [0x1b, 0x40];
  const ALIGN_LEFT = [0x1b, 0x61, 0x00];
  const ALIGN_CENTER = [0x1b, 0x61, 0x01];
  const ALIGN_RIGHT = [0x1b, 0x61, 0x02];
  const BOLD_ON = [0x1b, 0x45, 0x01];
  const BOLD_OFF = [0x1b, 0x45, 0x00];
  const DOUBLE_HEIGHT_ON = [0x1d, 0x21, 0x01];
  const DOUBLE_SIZE_ON = [0x1d, 0x21, 0x11];
  const NORMAL_SIZE = [0x1d, 0x21, 0x00];
  const CUT_PAPER = [0x1d, 0x56, 0x41, 0x03]; // GS V 65 3

  // 1. Initialize Printer
  addBytes(...ESC_INIT);

  // 2. Header
  const salonName =
    institutionData?.companyName ||
    institutionData?.InstitutionName ||
    "TEKKZY HAIR SALON";
  const salonAddress = institutionData?.Query_Address || institutionData?.Address || "";
  const salonPhone = institutionData?.Query_PhoneNumber || institutionData?.Contact || institutionData?.phoneNumber || "";
  const gstNumber = printerSettings?.gstNumber || institutionData?.gstNumber || institutionData?.gstSettings?.gstNumber || "";
  const receiptTitle = printerSettings?.receiptTitle || (bill.status === "Draft Estimate" ? "ESTIMATE BILL" : "TAX INVOICE");

  addBytes(...ALIGN_CENTER);
  addBytes(...BOLD_ON, ...DOUBLE_HEIGHT_ON);
  addText(salonName.toUpperCase() + "\n");
  addBytes(...BOLD_OFF, ...NORMAL_SIZE);

  if (salonAddress) {
    addText(salonAddress + "\n");
  }
  if (salonPhone) {
    addText("Tel: " + salonPhone + "\n");
  }
  if (gstNumber) {
    addBytes(...BOLD_ON);
    addText("GSTIN: " + gstNumber + "\n");
    addBytes(...BOLD_OFF);
  }

  addBytes(...BOLD_ON);
  addText(`*** ${receiptTitle.toUpperCase()} ***\n`);
  addBytes(...BOLD_OFF);

  // Separator
  addBytes(...ALIGN_LEFT);
  addText("-".repeat(cols) + "\n");

  // Meta
  const safeDate = bill.date ? new Date(bill.date) : new Date();
  const dateStr = safeDate.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timeStr = safeDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  addText(makeRow("Inv #: " + (bill.id || "N/A"), "Date: " + dateStr));
  addText(makeRow("Client: " + (bill.clientName || "Walk-in"), "Time: " + timeStr));
  if (bill.phoneNumber || bill.staff) {
    addText(makeRow(bill.phoneNumber ? "Ph: " + bill.phoneNumber : "", bill.staff ? "Stylist: " + bill.staff : ""));
  }

  // Items Table Header
  addText("-".repeat(cols) + "\n");
  addBytes(...BOLD_ON);
  addText(makeItemRow("ITEM", "QTY", "AMOUNT"));
  addBytes(...BOLD_OFF);
  addText("-".repeat(cols) + "\n");

  // Items List - deduplicated to prevent products from showing twice
  const items = buildDeduplicatedBillItems(bill);

  const rawSubtotal = Number(bill.subtotal || 0);
  const rawTotal = Number(bill.total || 0);
  const discount = Number(bill.discount || bill.discountAmount || 0);
  const tax = Number(bill.tax || 0);
  const computedSubtotal = rawSubtotal > 0 ? rawSubtotal : Math.max(0, rawTotal - tax + discount) || rawTotal || 0;
  const computedTotal = rawTotal > 0 ? rawTotal : (computedSubtotal + tax - discount);

  if (items.length === 0) {
    addText(makeItemRow("Salon Treatment", 1, "Rs." + computedTotal));
  } else {
    items.forEach((it) => {
      const name = it.serviceName || it.productName || it.name || "Treatment";
      const qty = Number(it.quantity || it.qty) || 1;
      const unit = Number(it.amount != null ? it.amount : it.price != null ? it.price : 0) ||
        (items.length > 0 ? Math.round(computedSubtotal / items.length) : 0);
      const totalAmt = unit * qty;
      addText(makeItemRow(name, qty, "Rs." + totalAmt));
    });
  }

  // Separator & Totals
  addText("-".repeat(cols) + "\n");
  addText(makeRow("Subtotal:", "Rs." + computedSubtotal));
  if (discount > 0) {
    addText(makeRow("Discount:", "-Rs." + discount));
  }
  if (tax > 0) {
    if (printerSettings?.showGstBreakdown) {
      const halfTax = (tax / 2).toFixed(0);
      const halfPct = (Number(bill.gstPercent || 18) / 2).toFixed(1);
      addText(makeRow(`CGST (${halfPct}%):`, "+Rs." + halfTax));
      addText(makeRow(`SGST (${halfPct}%):`, "+Rs." + halfTax));
    } else {
      addText(makeRow(`GST (${bill.gstPercent || 0}%):`, "+Rs." + tax));
    }
  }

  // Total Payable (Emphasized)
  addBytes(...BOLD_ON, ...DOUBLE_HEIGHT_ON);
  addText(makeRow("TOTAL PAYABLE:", "Rs." + computedTotal));
  addBytes(...BOLD_OFF, ...NORMAL_SIZE);
  addText("-".repeat(cols) + "\n");

  // Payment Mode
  const parsedSplit = parsePaymentSplit(bill);
  const isSplit = (bill.paymentMode || bill.paymentMethod || "").toLowerCase() === "split" || !!parsedSplit;
  if (isSplit && parsedSplit) {
    addBytes(...BOLD_ON);
    addText("Payment: Split Payment\n");
    addBytes(...BOLD_OFF);
    if (Number(parsedSplit.cash || 0) > 0) addText(makeRow("  Cash:", "Rs." + parsedSplit.cash));
    if (Number(parsedSplit.upi || 0) > 0) addText(makeRow("  UPI:", "Rs." + parsedSplit.upi));
    if (Number(parsedSplit.card || 0) > 0) addText(makeRow("  Card:", "Rs." + parsedSplit.card));
  } else {
    addText(makeRow("Payment Mode:", (bill.paymentMode || bill.paymentMethod || "Cash").toUpperCase()));
  }

  // Footer Message
  addText("-".repeat(cols) + "\n");
  addBytes(...ALIGN_CENTER);
  addText((printerSettings?.footerMessage || "Thank you for visiting! Please visit again.") + "\n");
  if (printerSettings?.termsAndConditions) {
    addText(printerSettings.termsAndConditions + "\n");
  }
  addText("*** THANK YOU ***\n");

  // Feeds and Cut
  addText("\n\n\n\n");
  addBytes(...CUT_PAPER);

  return new Uint8Array(bytes);
};

/**
 * Print directly via Web Bluetooth ESC/POS
 */
export const printViaBluetooth = async (bill, institutionData, printerSettings) => {
  const { characteristic } = await connectBluetoothPrinter();
  const payload = buildEscPosPayload(bill, institutionData, printerSettings);

  // Send payload in 100-byte chunks to avoid Bluetooth BLE MTU buffer overflow
  const CHUNK_SIZE = 100;
  for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
    const chunk = payload.slice(i, i + CHUNK_SIZE);
    if (characteristic.properties.writeWithoutResponse) {
      await characteristic.writeValueWithoutResponse(chunk);
    } else {
      await characteristic.writeValue(chunk);
    }
    await new Promise((r) => setTimeout(r, 25));
  }

  return { success: true, mode: "bluetooth" };
};

/**
 * Generate formatted HTML for USB / Desktop Thermal Printing
 */
export const generateThermalReceiptHtml = (bill, institutionData, printerSettings) => {
  const paperSize = printerSettings?.paperSize || "80mm";
  const targetWidth = paperSize === "58mm" ? "58mm" : "80mm";

  const salonName =
    institutionData?.companyName ||
    institutionData?.InstitutionName ||
    "Tekkzy Hair Salon";

  const salonLogo =
    institutionData?.logoUrl ||
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

  const gstNumber = printerSettings?.gstNumber || institutionData?.gstNumber || institutionData?.gstSettings?.gstNumber || "";
  const receiptTitle = printerSettings?.receiptTitle || (bill.status === "Draft Estimate" ? "ESTIMATE BILL" : "TAX INVOICE");

  const safeDate = bill.date ? new Date(bill.date) : new Date();
  const dateStr = safeDate.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timeStr = safeDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  const rawSubtotal = Number(bill.subtotal || 0);
  const rawTotal = Number(bill.total || 0);
  const discount = Number(bill.discount || bill.discountAmount || 0);
  const tax = Number(bill.tax || 0);
  const computedSubtotal = rawSubtotal > 0 ? rawSubtotal : Math.max(0, rawTotal - tax + discount) || rawTotal || 0;
  const computedTotal = rawTotal > 0 ? rawTotal : (computedSubtotal + tax - discount);

  const items = buildDeduplicatedBillItems(bill);

  const splitDetails = parsePaymentSplit(bill);
  const isSplit = (bill.paymentMode || bill.paymentMethod || "").toLowerCase() === "split" || !!splitDetails;

  return `
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
          * { box-sizing: border-box; margin: 0; padding: 0; }
          .center { text-align: center; }
          .right { text-align: right; }
          .bold { font-weight: 700; }
          .bolder { font-weight: 900; }
          .uppercase { text-transform: uppercase; }
          .dashed { border-bottom: 1px dashed #333333; margin: 4px 0; }
          .flex { display: flex; justify-content: space-between; }
          .table-header { display: flex; justify-content: space-between; font-weight: bold; border-bottom: 1px solid #444; padding-bottom: 2px; }
          .item-row { display: flex; justify-content: space-between; padding: 2px 0; }
          .logo { max-width: 60%; max-height: 44px; display: block; margin: 0 auto 5px auto; object-fit: contain; }
        </style>
      </head>
      <body>
        <div class="center">
          ${salonLogo ? `<img src="${salonLogo}" class="logo" alt="Logo" />` : ""}
          <div class="bolder uppercase" style="font-size: 13px;">${salonName}</div>
          ${salonAddress ? `<div style="font-size: 10px;">${salonAddress}</div>` : ""}
          ${salonPhone ? `<div style="font-size: 10px;">Tel: ${salonPhone}</div>` : ""}
          ${gstNumber ? `<div class="bold" style="font-size: 10px;">GSTIN: ${gstNumber}</div>` : ""}
          <div class="bolder uppercase" style="font-size: 10px; margin-top: 3px;">*** ${receiptTitle} ***</div>
        </div>

        <div class="dashed"></div>

        <div style="font-size: 10px;">
          <div class="flex"><span>Inv #: ${bill.id || "N/A"}</span><span>Date: ${dateStr}</span></div>
          <div class="flex"><span>Client: <b>${bill.clientName || "Walk-in"}</b></span><span>Time: ${timeStr}</span></div>
          ${bill.phoneNumber ? `<div class="flex"><span>Ph: ${bill.phoneNumber}</span>${bill.staff ? `<span>Stylist: ${bill.staff}</span>` : ""}</div>` : ""}
        </div>

        <div class="dashed"></div>

        <div>
          <div class="table-header" style="font-size: 10px;">
            <span style="width: 50%;">Item</span>
            <span style="width: 15%; text-align: center;">Qty</span>
            <span style="width: 35%; text-align: right;">Amount</span>
          </div>
          <div style="margin-top: 2px;">
            ${
              items.length === 0
                ? `<div class="item-row" style="font-size: 10px;"><span style="width: 50%;">Salon Treatment</span><span style="width: 15%; text-align: center;">1</span><span style="width: 35%; text-align: right; font-weight: bold;">${formatCurrencyINR(computedTotal)}</span></div>`
                : items
                    .map((it) => {
                      const name = it.serviceName || it.productName || it.name || "Treatment";
                      const qty = Number(it.quantity || it.qty) || 1;
                      const unit = Number(it.amount != null ? it.amount : it.price != null ? it.price : 0) ||
                        (items.length > 0 ? Math.round(computedSubtotal / items.length) : 0);
                      return `<div class="item-row" style="font-size: 10px;"><span style="width: 50%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${name}</span><span style="width: 15%; text-align: center;">${qty}</span><span style="width: 35%; text-align: right; font-weight: bold;">${formatCurrencyINR(unit * qty)}</span></div>`;
                    })
                    .join("")
            }
          </div>
        </div>

        <div class="dashed"></div>

        <div style="font-size: 10px;">
          <div class="flex"><span>Subtotal:</span><span class="bold">${formatCurrencyINR(computedSubtotal)}</span></div>
          ${discount > 0 ? `<div class="flex"><span>Discount:</span><span>-${formatCurrencyINR(discount)}</span></div>` : ""}
          ${tax > 0 ? `<div class="flex"><span>Tax / GST:</span><span>+${formatCurrencyINR(tax)}</span></div>` : ""}
          <div class="flex bold" style="font-size: 12px; margin-top: 3px; border-top: 1px solid #444; padding-top: 3px;">
            <span>TOTAL PAYABLE:</span>
            <span>${formatCurrencyINR(computedTotal)}</span>
          </div>
        </div>

        <div class="dashed"></div>

        <div style="font-size: 10px;">
          ${
            isSplit
              ? `<div class="bold">Payment: Split Payment</div>
                 ${Number(splitDetails.cash || 0) > 0 ? `<div class="flex"><span>• Cash:</span><span class="bold">${formatCurrencyINR(splitDetails.cash)}</span></div>` : ""}
                 ${Number(splitDetails.upi || 0) > 0 ? `<div class="flex"><span>• UPI:</span><span class="bold">${formatCurrencyINR(splitDetails.upi)}</span></div>` : ""}
                 ${Number(splitDetails.card || 0) > 0 ? `<div class="flex"><span>• Card:</span><span class="bold">${formatCurrencyINR(splitDetails.card)}</span></div>` : ""}`
              : `<div class="flex"><span>Payment Mode:</span><span class="bold uppercase">${bill.paymentMode || bill.paymentMethod || "Cash"}</span></div>`
          }
        </div>

        <div class="dashed"></div>

        <div class="center" style="font-size: 9px; margin-top: 5px;">
          <div class="bold">${printerSettings?.footerMessage || "Thank you for visiting! Please visit again."}</div>
          ${printerSettings?.termsAndConditions ? `<div style="font-size: 8px; margin-top: 2px;">${printerSettings.termsAndConditions}</div>` : ""}
          <div style="margin-top: 3px;">*** THANK YOU ***</div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Print directly via USB / Desktop Browser Dialog without modal popup
 */
export const printViaUSB = async (bill, institutionData, printerSettings) => {
  const isMobile =
    typeof navigator !== "undefined" &&
    /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  const paperSize = printerSettings?.paperSize || "80mm";
  const targetWidth = paperSize === "58mm" ? "58mm" : "80mm";
  const receiptHtml = generateThermalReceiptHtml(bill, institutionData, printerSettings);

  if (isMobile) {
    let directContainer = document.getElementById("thermal-print-direct-portal");
    if (!directContainer) {
      directContainer = document.createElement("div");
      directContainer.id = "thermal-print-direct-portal";
      document.body.appendChild(directContainer);
    }
    directContainer.innerHTML = receiptHtml;

    const cleanup = () => {
      if (directContainer && directContainer.parentNode) {
        directContainer.innerHTML = "";
      }
      window.removeEventListener("afterprint", cleanup);
    };

    window.addEventListener("afterprint", cleanup);
    setTimeout(() => {
      window.print();
      setTimeout(cleanup, 2500);
    }, 120);
    return { success: true, mode: "usb-mobile" };
  }

  // Desktop zero-opacity on-screen iframe
  let iframe = document.getElementById("thermal-direct-print-iframe");
  if (iframe) {
    iframe.remove();
  }

  iframe = document.createElement("iframe");
  iframe.id = "thermal-direct-print-iframe";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = targetWidth;
  iframe.style.height = "100vh";
  iframe.style.border = "none";
  iframe.style.opacity = "0.01";
  iframe.style.pointerEvents = "none";
  iframe.style.zIndex = "-1";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(receiptHtml);
  doc.close();

  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        resolve({ success: true, mode: "usb-desktop" });
      } catch (err) {
        console.warn("Direct iframe print fallback to window.print:", err);
        window.print();
        resolve({ success: true, mode: "usb-desktop-fallback" });
      }
    }, 250);
  });
};

/**
 * Master Direct Print Function:
 * Automatically inspects stored printer settings:
 * - If Bluetooth: connects to Bluetooth printer via Web Bluetooth API and prints directly
 * - If USB: triggers USB print with configured paper size (80mm/58mm) directly
 * NO MODAL POPUP NEEDED!
 */
export const directPrintBill = async (bill, institutionData, explicitSettings = null) => {
  const printerSettings = explicitSettings || getStoredPrinterSettings(institutionData);
  const isBluetooth = printerSettings?.printerType === "bluetooth";

  if (isBluetooth) {
    if (!isWebBluetoothSupported()) {
      console.warn("Web Bluetooth not supported, falling back to direct USB print.");
      return await printViaUSB(bill, institutionData, printerSettings);
    }
    try {
      return await printViaBluetooth(bill, institutionData, printerSettings);
    } catch (err) {
      console.error("Bluetooth print failed:", err);
      // If user cancelled Bluetooth pairing, don't force, rethrow so UI can notify
      throw err;
    }
  } else {
    return await printViaUSB(bill, institutionData, printerSettings);
  }
};
