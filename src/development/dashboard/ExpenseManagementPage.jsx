import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Receipt,
  Plus,
  Search,
  Calendar,
  IndianRupee,
  Tag,
  Pencil,
  Trash2,
  TrendingDown,
  Table,
  List,
  X,
  Grid3X3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "../components/ui/dialog";
import Context from "../Context/Context";
import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

const NO_VENDOR_ID = "NO_VENDOR";

const ExpenseManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("auto"); // "auto", "table", "grid"

  const {
    vendors,
    products,
    institutionData,
    adminGetVendors,
    adminCreateOrder,
    adminUpdateOrder,
    adminDeleteOrder,
    fetchProducts,
    updateProduct,
    loader,
  } = useContext(Context);

  const activeInstitutionId =
    institutionData?.institutionid || institutionData?.institutionId;

  const [selectedVendorId, setSelectedVendorId] = useState("ALL");
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [isCreatingExpense, setIsCreatingExpense] = useState(false);
  const [newOrder, setNewOrder] = useState({
    title: "",
    quantity: "",
    price: "",
    paymentMethod: "",
    status: "pending",
    notes: "",
  });
  const [dialogVendorId, setDialogVendorId] = useState(NO_VENDOR_ID);
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [orderItems, setOrderItems] = useState([{ itemId: "", quantity: "1" }]);
  const [showEditOrder, setShowEditOrder] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState("");
  const [editingVendorId, setEditingVendorId] = useState("");
  const [isEditingVendorItemExpense, setIsEditingVendorItemExpense] = useState(false);
  const [editOrderItems, setEditOrderItems] = useState([]);
  const [editOrder, setEditOrder] = useState({
    title: "",
    quantity: "",
    price: "",
    paymentMethod: "",
    status: "pending",
    notes: "",
  });

  const resetDialog = () => {
    setNewOrder({ title: "", quantity: "", price: "", paymentMethod: "", status: "pending", notes: "" });
    setDialogVendorId(NO_VENDOR_ID);
    setItemSearchTerm("");
    setOrderItems([{ itemId: "", quantity: "1" }]);
  };

  const resetEditDialog = () => {
    setEditOrder({
      title: "",
      quantity: "",
      price: "",
      paymentMethod: "",
      status: "pending",
      notes: "",
    });
    setEditingOrderId("");
    setEditingVendorId("");
    setIsEditingVendorItemExpense(false);
    setEditOrderItems([]);
  };

  const openEditDialog = (expense) => {
    const orderId = String(expense?.raw?.orderId || expense?.raw?.id || expense?.id || "");
    const vendorId = String(
      expense?.raw?.vendorId || (selectedVendorId !== "ALL" ? selectedVendorId : ""),
    );
    if (!orderId || !vendorId) return;

    const hasVendorItems =
      !expense?.raw?.noVendor &&
      String(expense?.raw?.vendorId || "") !== NO_VENDOR_ID &&
      Array.isArray(expense?.raw?.items) &&
      expense.raw.items.length > 0;

    const amountValue =
      expense?.raw?.totalAmount ??
      expense?.raw?.amount ??
      expense?.raw?.price ??
      expense?.amount ??
      "";

    setEditingOrderId(orderId);
    setEditingVendorId(vendorId);
    setIsEditingVendorItemExpense(hasVendorItems);
    setEditOrderItems(Array.isArray(expense?.raw?.items) ? expense.raw.items : []);
    setEditOrder({
      title: expense?.raw?.title || expense?.description || "",
      quantity: String(expense?.raw?.quantity ?? 1),
      price: String(amountValue ?? ""),
      paymentMethod: expense?.raw?.paymentMethod || "",
      status: expense?.raw?.status || "pending",
      notes: expense?.raw?.notes || "",
    });
    setShowEditOrder(true);
  };

  const addOrderItemRow = () => {
    setOrderItems((prev) => [...prev, { itemId: "", quantity: "1" }]);
  };

  const removeOrderItemRow = (index) => {
    setOrderItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateOrderItemRow = (index, patch) => {
    setOrderItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  const getVendorId = (vendor) => String(vendor?.vendorId || vendor?.id || "");

  const refreshAllOrders = async () => {
    if (adminGetVendors) {
      await adminGetVendors();
    }
  };

  useEffect(() => {
    if (adminGetVendors && (!Array.isArray(vendors) || vendors.length === 0)) {
      adminGetVendors();
    }
  }, [adminGetVendors, vendors]);

  useEffect(() => {
    if (
      activeInstitutionId &&
      (!Array.isArray(products) || products.length === 0) &&
      fetchProducts
    ) {
      fetchProducts(activeInstitutionId);
    }
  }, [activeInstitutionId, products, fetchProducts]);

  const allOrders = useMemo(() => {
    return (vendors || []).flatMap((vendor) => {
      const vendorId = getVendorId(vendor);
      const vendorOrders = Array.isArray(vendor?.orders) ? vendor.orders : [];
      return vendorOrders.map((order) => ({
        ...order,
        vendorId: order.vendorId || vendorId,
        noVendor: String(order.vendorId || vendorId) === NO_VENDOR_ID,
      }));
    });
  }, [vendors]);

  const filteredItems = useMemo(() => {
    const q = itemSearchTerm.trim().toLowerCase();
    return (products || []).filter((item) => {
      if (!q) return true;
      return (
        item?.productName?.toLowerCase().includes(q) ||
        item?.category?.toLowerCase().includes(q)
      );
    });
  }, [products, itemSearchTerm]);

  const effectiveOrders = useMemo(() => {
    if (selectedVendorId === "ALL") return allOrders;
    return allOrders.filter(
      (order) => String(order.vendorId || "") === String(selectedVendorId),
    );
  }, [allOrders, selectedVendorId]);

  const ordersAsExpenses = useMemo(() => {
    return (effectiveOrders || []).map((o, idx) => ({
      id: o.id || o.orderId || idx + 1,
      description:
        o.title ||
        (Array.isArray(o.items) && o.items.length > 0
          ? o.items.map((item) => item.productName).join(", ")
          : null) ||
        o.product ||
        o.description ||
        "Order",
      category: "Inventory",
      amount:
        Number(o.totalAmount ?? o.amount ?? o.price ?? 0) > 0
          ? Number(o.totalAmount ?? o.amount ?? o.price ?? 0)
          : Array.isArray(o.items) && o.items.length > 0
            ? o.items.reduce((sum, item) => {
                const qty = Number(item?.quantity ?? 1) || 1;
                const price = Number(item?.price ?? 0) || 0;
                return sum + qty * price;
              }, 0)
            : Number(o.price ?? 0) * Number(o.quantity ?? 1),
      date: o.date || o.createdAt || "",
      vendor: (() => {
        const vId = o.vendorId || (selectedVendorId !== "ALL" ? selectedVendorId : undefined);
        if (String(vId) === NO_VENDOR_ID || o.noVendor) return "No Vendor";
        const vendor = (vendors || []).find(
          (v) => String(v.vendorId || v.id) === String(vId),
        );
        return vendor?.name || "";
      })(),
      paymentMethod: o.paymentMethod || "",
      status: o.status || "paid",
      notes: o.notes || "",
      items: Array.isArray(o.items) ? o.items : [],
      itemSummary:
        Array.isArray(o.items) && o.items.length > 0
          ? o.items
              .map((item) => `${item?.productName || "Item"} x${Number(item?.quantity ?? 1) || 1}`)
              .join(", ")
          : "",
      raw: o,
    }));
  }, [effectiveOrders, vendors, selectedVendorId]);

  const filteredExpenses = ordersAsExpenses.filter((expense) => {
    const matchesSearch =
      !searchTerm ||
      String(expense.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(expense.vendor || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(expense.category || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || String(expense.status || "").toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const totalExpenses = ordersAsExpenses.reduce((sum, e) => sum + e.amount, 0);
  const paidExpenses = ordersAsExpenses
    .filter((e) => e.status === "paid")
    .reduce((sum, e) => sum + e.amount, 0);
  const pendingExpenses = ordersAsExpenses
    .filter((e) => e.status === "pending")
    .reduce((sum, e) => sum + e.amount, 0);

  const categoryTotals = ordersAsExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});
  const topCategory = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)[0];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (value) => {
    if (!value) return "—";
    const dt = new Date(value);
    if (isNaN(dt)) return String(value);
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(dt);
  };

  const getStatusBadge = (status) => {
    const s = String(status || "pending").toLowerCase();
    if (s === "paid") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-[10px] sm:text-xs font-bold text-emerald-800 shadow-2xs">
          PAID
        </span>
      );
    }
    if (s === "overdue") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-100 px-2.5 py-0.5 text-[10px] sm:text-xs font-bold text-rose-800 shadow-2xs">
          OVERDUE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-[10px] sm:text-xs font-bold text-amber-900 shadow-2xs">
        PENDING
      </span>
    );
  };

  const canSave = (() => {
    if (!dialogVendorId) return false;
    if ((newOrder.status || "pending") === "paid" && !newOrder.paymentMethod) {
      return false;
    }
    if (Number(newOrder.price) <= 0) return false;
    if (dialogVendorId === NO_VENDOR_ID) {
      return !!newOrder.title;
    }
    return orderItems.some(
      (row) =>
        !!row.itemId &&
        (products || []).some(
          (p) => String(p.productId || p.id) === String(row.itemId),
        ),
    );
  })();

  const canEditSave = (() => {
    if (!editingOrderId || !editingVendorId) return false;
    if (!String(editOrder.title || "").trim()) return false;
    if (Number(editOrder.price) <= 0) return false;
    if ((editOrder.status || "pending") === "paid" && !editOrder.paymentMethod) {
      return false;
    }
    return true;
  })();

  return (
    <div className="poppins-regular space-y-4 sm:space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Expense Management
          </h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Track vendor purchases, salon overheads, and payment statuses
          </p>
        </div>

        <Dialog
          open={showAddOrder}
          onOpenChange={(open) => {
            setShowAddOrder(open);
            if (!open) {
              resetDialog();
            } else {
              setDialogVendorId(NO_VENDOR_ID);
              setItemSearchTerm("");
              setOrderItems([{ itemId: "", quantity: "1" }]);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="h-9 gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition-all">
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100%-2rem)] sm:w-full sm:max-w-xl max-h-[85vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">Add Expense / Order</DialogTitle>
              <DialogDescription>
                Create vendor or no-vendor expense. Vendor purchases increase inventory stock.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!canSave) return;
                setIsCreatingExpense(true);

                try {

                  const isNoVendor = dialogVendorId === NO_VENDOR_ID;
                  const quantity = Number(newOrder.quantity || 1);
                  const resolvedItems = isNoVendor
                    ? []
                    : orderItems
                        .map((row) => {
                          const product = (products || []).find(
                            (p) => String(p.productId || p.id) === String(row.itemId),
                          );
                          const rowQty = Number(row.quantity || 1);
                          if (!product || rowQty <= 0) return null;
                          const rowPrice = Number(product.amount || 0);
                          return {
                            productId: product.productId || product.id,
                            productName: product.productName,
                            quantity: rowQty,
                            price: rowPrice,
                            amount: rowPrice * rowQty,
                          };
                        })
                        .filter(Boolean);

                  const itemTotal = resolvedItems.reduce(
                    (sum, item) => sum + Number(item.amount || 0),
                    0,
                  );
                  const generatedVendorTitle = resolvedItems.length > 1
                    ? `${resolvedItems[0].productName} +${resolvedItems.length - 1} items`
                    : resolvedItems[0]?.productName || "Order";
                  const title = String(newOrder.title || "").trim() || (isNoVendor ? "Order" : generatedVendorTitle);
                  const price = Number(newOrder.price || 0);

                  const payload = {
                    ...newOrder,
                    title,
                    product: title,
                    price,
                    amount: price,
                    totalAmount: price,
                    status: newOrder.status || "pending",
                    paymentMethod:
                      (newOrder.status || "pending") === "paid"
                        ? newOrder.paymentMethod
                        : "",
                    quantity: isNoVendor ? quantity : 1,
                    productId: isNoVendor ? null : resolvedItems[0]?.productId || null,
                    items: resolvedItems,
                    noVendor: isNoVendor,
                  };

                  await adminCreateOrder(dialogVendorId, payload, { skipRefresh: true });

                  if (!isNoVendor && resolvedItems.length > 0 && updateProduct && activeInstitutionId) {
                    const latestProducts =
                      (fetchProducts ? await fetchProducts(activeInstitutionId) : products) ||
                      products ||
                      [];
                    const productById = new Map(
                      latestProducts.map((p) => [String(p.productId || p.id), p]),
                    );

                    const qtyByProduct = resolvedItems.reduce((acc, item) => {
                      const key = String(item.productId);
                      acc[key] = (acc[key] || 0) + Number(item.quantity || 0);
                      return acc;
                    }, {});

                    for (const [productId, qtyToAdd] of Object.entries(qtyByProduct)) {
                      const product = productById.get(String(productId));
                      if (!product) continue;

                      const currentStock = Number(product.currentStock ?? 0) || 0;
                      const minStock = Number(product.minStock || 0);
                      const newStock = Math.max(0, currentStock + Number(qtyToAdd || 0));
                      let status = "in_stock";
                      if (newStock === 0) status = "out_of_stock";
                      else if (newStock <= minStock) status = "low_stock";

                      const updated = await updateProduct(activeInstitutionId, product.productId || product.id, {
                        currentStock: newStock,
                        status,
                      });

                      productById.set(String(productId), {
                        ...product,
                        ...(updated || {}),
                        currentStock: newStock,
                        status,
                      });
                    }
                  }

                  setShowAddOrder(false);
                  resetDialog();

                  await refreshAllOrders();
                } finally {
                  setIsCreatingExpense(false);
                }
              }}
              className="space-y-4 pt-1"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="mb-1 block" htmlFor="order-vendor">
                    Vendor
                  </Label>
                  <Select value={dialogVendorId} onValueChange={setDialogVendorId}>
                    <SelectTrigger id="order-vendor">
                      <SelectValue placeholder="Select a vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {(vendors || [])
                        .filter((vendor) => String(getVendorId(vendor)) !== NO_VENDOR_ID)
                        .map((vendor) => (
                          <SelectItem
                            key={vendor.vendorId || vendor.id}
                            value={String(vendor.vendorId || vendor.id)}
                          >
                            {vendor.name}
                          </SelectItem>
                        ))}
                      <SelectItem value={NO_VENDOR_ID}>No Vendor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {dialogVendorId !== NO_VENDOR_ID && (
                  <>
                    <div className="space-y-2 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <Label className="mb-1 block">Items</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addOrderItemRow}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Item
                        </Button>
                      </div>

                      {orderItems.map((row, index) => (
                        <div key={index} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end rounded-md border p-2">
                          <div className="sm:col-span-3 space-y-1">
                            <Label htmlFor={`order-item-${index}`}>Select Item</Label>
                            <Select
                              value={row.itemId}
                              onValueChange={(value) => {
                                updateOrderItemRow(index, { itemId: value });
                              }}
                            >
                              <SelectTrigger id={`order-item-${index}`}>
                                <SelectValue placeholder="Select inventory item" />
                              </SelectTrigger>
                              <SelectContent>
                                <div className="sticky top-0 z-10 bg-white p-2 border-b">
                                  <Input
                                    id={`item-search-${index}`}
                                    placeholder="Search inventory item"
                                    value={itemSearchTerm}
                                    onChange={(e) => setItemSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.stopPropagation()}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                                {filteredItems.map((item) => (
                                  <SelectItem
                                    key={item.productId || item.id}
                                    value={String(item.productId || item.id)}
                                  >
                                    {item.productName} ({item.currentStock ?? 0} in stock)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="sm:col-span-1 space-y-1">
                            <Label htmlFor={`order-quantity-${index}`}>Qty</Label>
                            <Input
                              id={`order-quantity-${index}`}
                              type="number"
                              min="1"
                              value={row.quantity}
                              onChange={(e) =>
                                updateOrderItemRow(index, { quantity: e.target.value })
                              }
                            />
                          </div>

                          <div className="sm:col-span-1 flex justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeOrderItemRow(index)}
                              disabled={orderItems.length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="order-title">Title</Label>
                  <Input
                    id="order-title"
                    value={newOrder.title}
                    onChange={(e) => setNewOrder((s) => ({ ...s, title: e.target.value }))}
                    required
                  />
                </div>
                {dialogVendorId === NO_VENDOR_ID && (
                  <div className="space-y-1.5">
                    <Label htmlFor="order-quantity">Quantity</Label>
                    <Input
                      id="order-quantity"
                      type="number"
                      min="1"
                      value={newOrder.quantity}
                      onChange={(e) =>
                        setNewOrder((s) => ({ ...s, quantity: e.target.value }))
                      }
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="order-price">
                    {dialogVendorId === NO_VENDOR_ID ? "Price" : "Total Expense"}
                  </Label>
                  <Input
                    id="order-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newOrder.price}
                    onChange={(e) => setNewOrder((s) => ({ ...s, price: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="order-status">Status</Label>
                  <Select
                    value={newOrder.status || "pending"}
                    onValueChange={(value) =>
                      setNewOrder((s) => ({
                        ...s,
                        status: value,
                        paymentMethod: value === "paid" ? s.paymentMethod : "",
                      }))
                    }
                  >
                    <SelectTrigger id="order-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="order-payment">Payment Method</Label>
                  <Select
                    value={newOrder.paymentMethod}
                    onValueChange={(value) =>
                      setNewOrder((s) => ({ ...s, paymentMethod: value }))
                    }
                    disabled={(newOrder.status || "pending") !== "paid"}
                  >
                    <SelectTrigger id="order-payment">
                      <SelectValue
                        placeholder={
                          (newOrder.status || "pending") === "paid"
                            ? "Select method"
                            : "Choose status as Paid first"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="order-notes">Notes</Label>
                  <Input
                    id="order-notes"
                    value={newOrder.notes}
                    onChange={(e) => setNewOrder((s) => ({ ...s, notes: e.target.value }))}
                  />
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold"
                  disabled={loader || isCreatingExpense || !canSave}
                >
                  {isCreatingExpense ? "Creating..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showEditOrder}
          onOpenChange={(open) => {
            setShowEditOrder(open);
            if (!open) resetEditDialog();
          }}
        >
          <DialogContent className="w-[calc(100%-2rem)] sm:w-full sm:max-w-xl max-h-[85vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">Edit Expense</DialogTitle>
              <DialogDescription>
                Update expense details and save changes.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!canEditSave || !adminUpdateOrder) return;

                const title = String(editOrder.title || "").trim() || "Order";
                const price = Number(editOrder.price || 0);
                const status = editOrder.status || "pending";

                const payload = {
                  title,
                  product: title,
                  price,
                  amount: price,
                  totalAmount: price,
                  status,
                  paymentMethod: status === "paid" ? editOrder.paymentMethod : "",
                  notes: editOrder.notes || "",
                };

                if (!isEditingVendorItemExpense) {
                  payload.quantity = Number(editOrder.quantity || 1);
                }

                await adminUpdateOrder(editingVendorId, editingOrderId, payload, {
                  skipRefresh: true,
                });

                setShowEditOrder(false);
                resetEditDialog();
                await refreshAllOrders();
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-order-title">Title</Label>
                  <Input
                    id="edit-order-title"
                    value={editOrder.title}
                    onChange={(e) => setEditOrder((s) => ({ ...s, title: e.target.value }))}
                    required
                  />
                </div>

                {editOrderItems.length > 0 ? (
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Items (Read Only)</Label>
                    <div className="rounded-md border p-2 space-y-1 text-sm">
                      {editOrderItems.map((item, index) => (
                        <div key={`${item?.productId || item?.productName || "item"}-${index}`} className="flex items-center justify-between text-slate-700">
                          <span>{item?.productName || "Item"}</span>
                          <span>
                            Qty: {Number(item?.quantity ?? 1) || 1}
                            {Number(item?.price ?? 0) > 0 ? ` | ${formatCurrency(Number(item?.price ?? 0))}` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-order-quantity">Quantity (Read Only)</Label>
                    <Input
                      id="edit-order-quantity"
                      type="number"
                      value={editOrder.quantity}
                      disabled
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="edit-order-price">Total Cost</Label>
                  <Input
                    id="edit-order-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editOrder.price}
                    onChange={(e) => setEditOrder((s) => ({ ...s, price: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-order-status">Status</Label>
                  <Select
                    value={editOrder.status || "pending"}
                    onValueChange={(value) =>
                      setEditOrder((s) => ({
                        ...s,
                        status: value,
                        paymentMethod: value === "paid" ? s.paymentMethod : "",
                      }))
                    }
                  >
                    <SelectTrigger id="edit-order-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-order-payment">Payment Method</Label>
                  <Select
                    value={editOrder.paymentMethod}
                    onValueChange={(value) =>
                      setEditOrder((s) => ({ ...s, paymentMethod: value }))
                    }
                    disabled={(editOrder.status || "pending") !== "paid"}
                  >
                    <SelectTrigger id="edit-order-payment">
                      <SelectValue
                        placeholder={
                          (editOrder.status || "pending") === "paid"
                            ? "Select method"
                            : "Choose status as Paid first"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="edit-order-notes">Notes</Label>
                  <Input
                    id="edit-order-notes"
                    value={editOrder.notes}
                    onChange={(e) => setEditOrder((s) => ({ ...s, notes: e.target.value }))}
                  />
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold"
                  disabled={loader || !canEditSave}
                >
                  {loader ? "Saving..." : "Update"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Expense Summary - Compact Tinted KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="rounded-xl border border-rose-200/90 bg-gradient-to-br from-rose-50/90 via-white to-rose-50/30 p-2 sm:p-2.5 shadow-2xs">
          <div className="flex items-center justify-between gap-1 mb-1">
            <p className="text-[10px] sm:text-xs font-semibold text-rose-800 truncate">Total Expenses</p>
            <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md bg-rose-600 text-white shadow-2xs shrink-0">
              <TrendingDown className="h-3 w-3" />
            </div>
          </div>
          <p className="text-xs sm:text-sm font-black tracking-tight text-rose-950 truncate">
            {formatCurrency(totalExpenses)}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/30 p-2 sm:p-2.5 shadow-2xs">
          <div className="flex items-center justify-between gap-1 mb-1">
            <p className="text-[10px] sm:text-xs font-semibold text-emerald-800 truncate">Paid Expenses</p>
            <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md bg-emerald-600 text-white shadow-2xs shrink-0">
              <Receipt className="h-3 w-3" />
            </div>
          </div>
          <p className="text-xs sm:text-sm font-black tracking-tight text-emerald-950 truncate">
            {formatCurrency(paidExpenses)}
          </p>
        </div>

        <div className="rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50/90 via-white to-amber-50/30 p-2 sm:p-2.5 shadow-2xs">
          <div className="flex items-center justify-between gap-1 mb-1">
            <p className="text-[10px] sm:text-xs font-semibold text-amber-800 truncate">Pending Expenses</p>
            <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md bg-amber-500 text-white shadow-2xs shrink-0">
              <Calendar className="h-3 w-3" />
            </div>
          </div>
          <p className="text-xs sm:text-sm font-black tracking-tight text-amber-950 truncate">
            {formatCurrency(pendingExpenses)}
          </p>
        </div>

        <div className="rounded-xl border border-blue-200/90 bg-gradient-to-br from-blue-50/90 via-white to-blue-50/30 p-2 sm:p-2.5 shadow-2xs">
          <div className="flex items-center justify-between gap-1 mb-1">
            <p className="text-[10px] sm:text-xs font-semibold text-blue-700 truncate">Top Category</p>
            <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md bg-blue-600 text-white shadow-2xs shrink-0">
              <Tag className="h-3 w-3" />
            </div>
          </div>
          <p className="text-xs sm:text-sm font-black tracking-tight text-blue-950 truncate">
            {topCategory?.[0] || "General"}
          </p>
        </div>
      </div>

      {/* Symmetrical Search & Controls Bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search expenses, vendor, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 rounded-xl border-slate-200 bg-white pl-9 pr-8 text-xs sm:text-sm shadow-xs focus-visible:ring-1 focus-visible:ring-blue-500 w-full"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Row 2 on mobile: Filters & View Toggle */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
          {/* Vendor Filter */}
          <div className="w-full sm:w-40">
            <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
              <SelectTrigger className="h-9 rounded-xl border-slate-200 bg-white text-xs shadow-xs w-full">
                <SelectValue placeholder="All Vendors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Vendors</SelectItem>
                <SelectItem value={NO_VENDOR_ID}>No Vendor</SelectItem>
                {(vendors || [])
                  .filter((vendor) => String(getVendorId(vendor)) !== NO_VENDOR_ID)
                  .map((vendor) => (
                    <SelectItem
                      key={vendor.vendorId || vendor.id}
                      value={String(vendor.vendorId || vendor.id)}
                    >
                      {vendor.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* View Mode Toggle: Table (List) / Grid / Auto */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-0.5 shadow-xs h-9 w-full sm:w-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("table")}
              className={`h-7.5 flex-1 sm:w-8 sm:flex-initial rounded-lg p-0 transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-blue-600 text-white shadow-xs hover:bg-blue-600 hover:text-white"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
              title="Table view (Desktop)"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={`h-7.5 flex-1 sm:w-8 sm:flex-initial rounded-lg p-0 transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white shadow-xs hover:bg-blue-600 hover:text-white"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
              title="Card view (Tablet & Mobile)"
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("auto")}
              className={`h-7.5 px-2 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                viewMode === "auto"
                  ? "bg-blue-600 text-white shadow-xs hover:bg-blue-600 hover:text-white"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
              title="Auto: Table on Big Screen, Cards on Tablet & Mobile"
            >
              Auto
            </Button>
          </div>
        </div>
      </div>

      {/* 1. TABLE VIEW (Desktop 8-Column Table + Native Mobile Table List) */}
      <div
        className={
          viewMode === "table"
            ? "block"
            : viewMode === "grid"
            ? "hidden"
            : "hidden lg:block"
        }
      >
        {/* DESKTOP TABLE (hidden sm:block): Full 8-Column Table */}
        <div className="hidden sm:block rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
          <TableComponent>
            <TableHeader className="bg-slate-50/75">
              <TableRow className="border-b border-slate-200/80">
                <TableHead className="text-xs font-semibold text-slate-600">Description</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Category</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Vendor</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Amount</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Date</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Payment</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                <TableHead className="text-right text-xs font-semibold text-slate-600">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((expense) => {
                const orderId = expense.raw?.id || expense.raw?.orderId || expense.id;
                const isVendorItemExpense =
                  !expense.raw?.noVendor &&
                  String(expense.raw?.vendorId || "") !== NO_VENDOR_ID &&
                  Array.isArray(expense.raw?.items) &&
                  expense.raw.items.length > 0;
                const isPaid = expense.status === "paid";
                const isOverdue = expense.status === "overdue";
                const statusBorder = isPaid
                  ? "border-l-4 border-l-emerald-500"
                  : isOverdue
                  ? "border-l-4 border-l-rose-500"
                  : "border-l-4 border-l-amber-500";

                return (
                  <TableRow key={expense.id} className={`hover:bg-slate-50/75 transition-colors border-b border-slate-100 ${statusBorder}`}>
                    <TableCell className={`font-bold text-slate-900 text-xs sm:text-sm border-l-4 ${statusBorder}`}>
                      <div>{expense.description}</div>
                      {expense.itemSummary && (
                        <div className="text-[11px] text-slate-400 mt-0.5 font-normal">{expense.itemSummary}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="inline-block text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-full shadow-2xs">
                        {expense.category || "General"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-700">
                      <span className="bg-slate-100/90 text-slate-800 border border-slate-200/90 px-2 py-0.5 rounded-md">
                        {expense.vendor || "No Vendor"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-extrabold text-xs sm:text-sm px-2 py-0.5 rounded-lg border shadow-2xs bg-emerald-50/90 text-emerald-800 border-emerald-200/90">
                        {formatCurrency(expense.amount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-medium">{formatDate(expense.date)}</TableCell>
                    <TableCell>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-full shadow-2xs">
                        {expense.paymentMethod || "—"}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(expense.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 rounded-lg p-0 text-slate-500 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                          onClick={() => openEditDialog(expense)}
                          title="Edit expense"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {!isVendorItemExpense && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 rounded-lg p-0 text-slate-500 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                            onClick={async () => {
                              const vendorId =
                                selectedVendorId === "ALL"
                                  ? expense.raw?.vendorId
                                  : selectedVendorId;
                              if (!vendorId) return;
                              await (adminDeleteOrder && adminDeleteOrder(vendorId, orderId, { skipRefresh: true }));
                              await refreshAllOrders();
                            }}
                            title="Delete expense"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </TableComponent>
        </div>

        {/* MOBILE TABLE VIEW (sm:hidden): Native Compact Row List (No Sideways Scroll!) */}
        <div className="sm:hidden bg-white rounded-2xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
          {filteredExpenses.map((expense) => {
            const orderId = expense.raw?.id || expense.raw?.orderId || expense.id;
            const isVendorItemExpense =
              !expense.raw?.noVendor &&
              String(expense.raw?.vendorId || "") !== NO_VENDOR_ID &&
              Array.isArray(expense.raw?.items) &&
              expense.raw.items.length > 0;
            const isPaid = expense.status === "paid";
            const isOverdue = expense.status === "overdue";
            const statusBorder = isPaid
              ? "border-l-4 border-l-emerald-500"
              : isOverdue
              ? "border-l-4 border-l-rose-500"
              : "border-l-4 border-l-amber-500";

            return (
              <div
                key={expense.id}
                className={`p-2 sm:p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50/80 transition-colors ${statusBorder}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate max-w-[150px]">
                      {expense.description}
                    </h4>
                    <span className="text-[9px] font-bold text-slate-700 bg-slate-100 border border-slate-200/80 px-1.5 py-0.2 rounded shrink-0">
                      {expense.category || "General"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                    <span className="font-bold text-slate-800">{expense.vendor || "No Vendor"}</span>
                    <span>•</span>
                    <span className="font-extrabold text-emerald-800 bg-emerald-50/90 border border-emerald-200/90 px-1.5 py-0.2 rounded text-[10px]">
                      {formatCurrency(expense.amount)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {getStatusBadge(expense.status)}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 rounded-lg p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                    onClick={() => openEditDialog(expense)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {!isVendorItemExpense && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 rounded-lg p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                      onClick={async () => {
                        const vendorId =
                          selectedVendorId === "ALL"
                            ? expense.raw?.vendorId
                            : selectedVendorId;
                        if (!vendorId) return;
                        await (adminDeleteOrder && adminDeleteOrder(vendorId, orderId, { skipRefresh: true }));
                        await refreshAllOrders();
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. RESPONSIVE CARD DESIGN: 1 Card per row on mobile (grid-cols-1) for compact, spacious design! */}
      <div
        className={
          viewMode === "grid"
            ? "block"
            : viewMode === "table"
            ? "hidden"
            : "block lg:hidden"
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
          {filteredExpenses.map((expense) => {
            const isVendorItemExpense =
              !expense.raw?.noVendor &&
              String(expense.raw?.vendorId || "") !== NO_VENDOR_ID &&
              Array.isArray(expense.raw?.items) &&
              expense.raw.items.length > 0;
            const isPaid = expense.status === "paid";
            const isOverdue = expense.status === "overdue";
            const statusBorder = isPaid
              ? "border-l-4 border-l-emerald-500"
              : isOverdue
              ? "border-l-4 border-l-rose-500"
              : "border-l-4 border-l-amber-500";

            return (
              <Card
                key={expense.id}
                className={`group relative rounded-xl border border-slate-200/90 bg-white p-2.5 sm:p-3 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer border-l-4 ${statusBorder}`}
              >
                {/* Top Row: Description + Category on left, Status Badge on right */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3
                        className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors"
                        title={expense.description}
                      >
                        {expense.description}
                      </h3>
                      <span className="text-[9px] font-bold text-slate-700 bg-slate-100 border border-slate-200/80 px-1.5 py-0.2 rounded-md truncate shadow-2xs">
                        {expense.category || "General"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {expense.vendor ? (
                        <span className="font-medium text-slate-600">Vendor: {expense.vendor}</span>
                      ) : (
                        "No Vendor"
                      )}
                      {" • "}
                      <span>{formatDate(expense.date)}</span>
                    </p>
                  </div>
                  <div className="shrink-0">
                    {getStatusBadge(expense.status)}
                  </div>
                </div>

                {/* Bottom Row: Amount & Payment method on left, Actions on right */}
                <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                      {formatCurrency(expense.amount)}
                    </span>
                    {expense.paymentMethod && (
                      <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.2 rounded-md shadow-2xs">
                        {expense.paymentMethod}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg p-0 text-slate-400 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(expense);
                      }}
                      title="Edit expense"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {!isVendorItemExpense && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg p-0 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const orderId = expense.raw?.id || expense.raw?.orderId || expense.id;
                          const vendorId =
                            selectedVendorId === "ALL"
                              ? expense.raw?.vendorId
                              : selectedVendorId;
                          if (!vendorId) return;

                          await (adminDeleteOrder && adminDeleteOrder(vendorId, orderId, { skipRefresh: true }));
                          await refreshAllOrders();
                        }}
                        title="Delete expense"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

            {filteredExpenses.length === 0 && (
        <div className="text-center py-12">
          <Receipt className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-slate-700 mb-1">No expenses found</h3>
          <p className="text-xs text-slate-400">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

export default ExpenseManagementPage;