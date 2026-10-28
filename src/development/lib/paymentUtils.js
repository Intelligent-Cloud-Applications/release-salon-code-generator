/**
 * Payment & Split Collection Utilities
 * Provides resilient parsing and accounting for split payments and collection breakdowns.
 */

/**
 * Safely parses split amounts from any bill or appointment record.
 * Handles:
 *  - Objects: { cash: 200, upi: 300, card: 0 }
 *  - Serialized JSON strings: '{"cash":200,"upi":300}'
 *  - Top-level numbers: cashAmount, upiAmount, cardAmount
 *  - Payments array: [{ mode: "upi", amount: 200 }, { mode: "card", amount: 300 }]
 *  - Summary strings: "Cash: ₹200 + UPI: ₹300"
 * 
 * @param {object} item Bill or appointment object
 * @returns {{ cash: number, upi: number, card: number } | null}
 */
export const parsePaymentSplit = (item) => {
  if (!item || typeof item !== "object") return null;

  let split = item.paymentSplit || item.paymentsplit || item.payment_split;
  if (typeof split === "string") {
    try {
      split = JSON.parse(split);
    } catch {
      split = null;
    }
  }

  let cash = Number(split?.cash != null ? split.cash : item.cashAmount != null ? item.cashAmount : 0) || 0;
  let upi = Number(split?.upi != null ? split.upi : item.upiAmount != null ? item.upiAmount : 0) || 0;
  let card = Number(split?.card != null ? split.card : item.cardAmount != null ? item.cardAmount : 0) || 0;

  // Payments array fallback: [{ mode: "cash", amount: 200 }, ...]
  if (cash === 0 && upi === 0 && card === 0 && Array.isArray(item.payments) && item.payments.length > 0) {
    item.payments.forEach((p) => {
      const mode = String(p.mode || p.method || "").toLowerCase();
      const amt = Number(p.amount) || 0;
      if (mode === "cash") cash += amt;
      else if (mode.includes("card")) card += amt;
      else upi += amt;
    });
  }

  // Regex parse paymentSummary fallback e.g. "Cash: ₹200, UPI: ₹300" or "UPI ₹200 + Card ₹300"
  if (cash === 0 && upi === 0 && card === 0 && typeof item.paymentSummary === "string" && item.paymentSummary.includes("₹")) {
    const cashMatch = item.paymentSummary.match(/cash[:\s]*₹?\s*(\d+(\.\d+)?)/i);
    const upiMatch = item.paymentSummary.match(/upi[:\s]*₹?\s*(\d+(\.\d+)?)/i);
    const cardMatch = item.paymentSummary.match(/card[:\s]*₹?\s*(\d+(\.\d+)?)/i);
    if (cashMatch) cash = Number(cashMatch[1]) || 0;
    if (upiMatch) upi = Number(upiMatch[1]) || 0;
    if (cardMatch) card = Number(cardMatch[1]) || 0;
  }

  if (cash > 0 || upi > 0 || card > 0) {
    return { cash, upi, card };
  }

  return split && typeof split === "object" ? { cash: Number(split.cash) || 0, upi: Number(split.upi) || 0, card: Number(split.card) || 0 } : null;
};

/**
 * Returns true if the transaction is a split payment
 */
export const isSplitPayment = (item) => {
  if (!item) return false;
  const mode = String(item.paymentMode || item.paymentMethod || "").toLowerCase();
  if (mode === "split") return true;
  const split = parsePaymentSplit(item);
  if (!split) return false;
  const activeCount = [split.cash, split.upi, split.card].filter((v) => Number(v) > 0).length;
  return activeCount > 1 || (activeCount === 1 && mode === "split");
};

/**
 * Returns exact amounts collected per channel for an order/bill.
 * Accurately divides split payments into Cash, UPI, and Card.
 * 
 * @param {object} item Bill or appointment object
 * @returns {{ cash: number, upi: number, card: number, digital: number, total: number }}
 */
export const getCollectionBreakdown = (item) => {
  if (!item) return { cash: 0, upi: 0, card: 0, digital: 0, total: 0 };
  const total =
    Number(
      item.total != null
        ? item.total
        : item.totalAmount != null
        ? item.totalAmount
        : item.amount != null
        ? item.amount
        : item.price != null
        ? item.price
        : 0
    ) || 0;
  const split = parsePaymentSplit(item);
  const mode = String(
    item.paymentMode || item.paymentMethod || item.mode || item.payment_mode || ""
  )
    .toLowerCase()
    .trim();

  if (split && (split.cash > 0 || split.upi > 0 || split.card > 0 || mode === "split")) {
    const cash = Number(split.cash) || 0;
    const upi = Number(split.upi) || 0;
    const card = Number(split.card) || 0;
    const splitSum = cash + upi + card;
    return {
      cash,
      upi,
      card,
      digital: upi + card,
      total: total > 0 ? total : splitSum,
    };
  }

  if (mode === "cash" || mode.includes("cash")) {
    return { cash: total, upi: 0, card: 0, digital: 0, total };
  }
  if (
    mode.includes("card") ||
    mode.includes("pos") ||
    mode.includes("credit") ||
    mode.includes("debit")
  ) {
    return { cash: 0, upi: 0, card: total, digital: total, total };
  }
  if (
    mode.includes("upi") ||
    mode.includes("online") ||
    mode.includes("qr") ||
    mode.includes("gpay") ||
    mode.includes("paytm") ||
    mode.includes("phonepe") ||
    mode.includes("netbanking")
  ) {
    return { cash: 0, upi: total, card: 0, digital: total, total };
  }

  // Check explicit amount attributes if mode string is ambiguous or empty
  const cAmt = Number(item.cashAmount) || 0;
  const uAmt = Number(item.upiAmount) || 0;
  const cdAmt = Number(item.cardAmount) || 0;
  if (cAmt > 0 || uAmt > 0 || cdAmt > 0) {
    return {
      cash: cAmt,
      upi: uAmt,
      card: cdAmt,
      digital: uAmt + cdAmt,
      total: total > 0 ? total : cAmt + uAmt + cdAmt,
    };
  }

  // Default to Cash for settled salon transactions if mode is unspecified
  return { cash: total, upi: 0, card: 0, digital: 0, total };
};

/**
 * Human-readable payment summary for invoice labels and tables
 * e.g. "UPI ₹200 + Card ₹300" or "CASH"
 */
export const formatPaymentSummary = (item) => {
  if (!item) return "Cash";
  const split = parsePaymentSplit(item);
  if (split && (split.cash > 0 || split.upi > 0 || split.card > 0)) {
    const parts = [];
    if (split.cash > 0) parts.push(`Cash ₹${split.cash}`);
    if (split.upi > 0) parts.push(`UPI ₹${split.upi}`);
    if (split.card > 0) parts.push(`Card ₹${split.card}`);
    if (parts.length > 0) return parts.join(" + ");
  }

  if (typeof item.paymentSummary === "string" && item.paymentSummary.trim()) {
    return item.paymentSummary;
  }

  const mode = item.paymentMode || item.paymentMethod || "Cash";
  return String(mode).toUpperCase();
};

/**
 * Normalizes an item or service name for resilient comparison and deduplication.
 * Strips '(Prod)', '[Product]', '(×3)', etc.
 */
export const normalizeItemName = (name) => {
  if (!name) return "";
  return String(name)
    .toLowerCase()
    .replace(/\(prod(uct)?\)/gi, "")
    .replace(/\[prod(uct)?\]/gi, "")
    .replace(/\s*\(×\d+\)/gi, "")
    .replace(/\s*\(x\d+\)/gi, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
};

/**
 * Builds a clean, deduplicated list of bill items for receipt printing and previews.
 * Prevents products from erroneously appearing twice (once as a ghost service and once as a product).
 */
export const buildDeduplicatedBillItems = (bill) => {
  if (!bill) return [];

  const rawItems = Array.isArray(bill.items) && bill.items.length > 0 ? bill.items : [];
  const prods = Array.isArray(bill.products) ? bill.products : [];
  const srvs = Array.isArray(bill.services) ? bill.services : [];

  const prodNormNames = new Set(
    prods.map((p) => normalizeItemName(p?.productName || p?.name)).filter(Boolean)
  );

  const items = [];

  if (rawItems.length > 0) {
    rawItems.forEach((it) => {
      const isProd = it.isProduct === true;
      const name = it.serviceName || it.productName || it.name || "";
      const norm = normalizeItemName(name);
      if (!isProd && norm && prodNormNames.has(norm)) {
        return; // Skip duplicate ghost service
      }
      items.push(it);
    });
  } else {
    srvs.forEach((s) => {
      const name = typeof s === "string" ? s : s?.serviceName || s?.name || "";
      const norm = normalizeItemName(name);
      if (norm && prodNormNames.has(norm)) {
        return; // Skip ghost service item duplicating a product
      }
      items.push(
        typeof s === "string"
          ? { serviceName: s, isProduct: false }
          : { ...s, isProduct: false }
      );
    });

    prods.forEach((p) => {
      items.push({ ...p, isProduct: true });
    });
  }

  // Deduplicate exact duplicate keys
  const seen = new Set();
  const deduped = [];
  items.forEach((it) => {
    const itName = it.serviceName || it.productName || it.name || "Item";
    const key = `${normalizeItemName(itName)}_${it.isProduct ? "prod" : "srv"}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(it);
    }
  });

  return deduped;
};
