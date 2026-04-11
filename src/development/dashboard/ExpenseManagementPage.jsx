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
  const [viewMode, setViewMode] = useState("grid");

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
        Array.isArray(o.items) && o.items.length > 0
          ? o.items.reduce((sum, item) => {
              const qty = Number(item?.quantity ?? 1) || 1;
              const price = Number(item?.price ?? 0) || 0;
              return sum + qty * price;
            }, 0)
          : Number(o.totalAmount ?? o.amount ?? 0) > 0
            ? Number(o.totalAmount ?? o.amount ?? 0)
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

  const filteredExpenses = ordersAsExpenses.filter(
    (expense) =>
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.vendor.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
    const statusConfig = {
      paid: { variant: "default", className: "bg-green-100 text-green-800" },
      pending: { variant: "secondary", className: "bg-yellow-100 text-yellow-800" },
      overdue: { variant: "destructive", className: "bg-red-100 text-red-800" },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge variant={config.variant} className={config.className}>
        {String(status || "pending").toUpperCase()}
      </Badge>
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
    <div className="poppins-regular space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">Expense Management</h1>
          <p className="text-stone-600">Track expenses with or without vendor</p>
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
            <Button className="bg-stone-600 hover:bg-stone-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Order/Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Expense/Order</DialogTitle>
              <DialogDescription>
                Create vendor or no-vendor expense. Vendor purchases increase inventory stock.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!canSave) return;

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
              }}
              className="space-y-6"
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
                  className="bg-stone-600 text-white"
                  disabled={loader || !canSave}
                >
                  {loader ? "Adding..." : "Save"}
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
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Expense</DialogTitle>
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
                        <div key={`${item?.productId || item?.productName || "item"}-${index}`} className="flex items-center justify-between text-stone-700">
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
                  className="bg-stone-600 text-white"
                  disabled={loader || !canEditSave}
                >
                  {loader ? "Saving..." : "Update"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
        <div className="flex-1">
          <Label className="mb-1 block text-sm">Vendor</Label>
          <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a vendor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All vendors</SelectItem>
              <SelectItem value={NO_VENDOR_ID}>No vendor</SelectItem>
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
        <div className="flex-1">
          <Label className="mb-1 block text-sm">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 h-4 w-4" />
            <Input
              placeholder="Search orders by product or vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-stone-200"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-stone-600">Total Expenses</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
              </div>
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-stone-600">Paid Expenses</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(paidExpenses)}</p>
              </div>
              <Receipt className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-stone-600">Pending Expenses</p>
                <p className="text-lg font-bold text-yellow-600">{formatCurrency(pendingExpenses)}</p>
              </div>
              <Calendar className="h-5 w-5 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-stone-600">Top Category</p>
                <p className="text-lg font-bold text-blue-600">{topCategory?.[0] || "N/A"}</p>
                <p className="text-xs text-stone-600">{formatCurrency(topCategory?.[1] || 0)}</p>
              </div>
              <Tag className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 h-4 w-4" />
          <Input
            placeholder="Search expenses by description, category, or vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-stone-200"
          />
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Paid: {ordersAsExpenses.filter((e) => e.status === "paid").length}
          </Badge>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pending: {ordersAsExpenses.filter((e) => e.status === "pending").length}
          </Badge>
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            Overdue: {ordersAsExpenses.filter((e) => e.status === "overdue").length}
          </Badge>
        </div>
        <div className="flex gap-1 border border-stone-200 rounded-lg p-1">
          <Button
            variant={viewMode === "table" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
            className={`h-8 w-8 p-0 ${viewMode === "table" ? "bg-stone-600 text-white" : "text-stone-600 hover:bg-stone-100"}`}
          >
            <Table className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className={`h-8 w-8 p-0 ${viewMode === "grid" ? "bg-stone-600 text-white" : "text-stone-600 hover:bg-stone-100"}`}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === "table" && (
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="text-stone-800">Expenses - Table View</CardTitle>
          </CardHeader>
          <CardContent>
            <TableComponent>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-stone-600">Description</TableHead>
                  <TableHead className="text-stone-600">Category</TableHead>
                  <TableHead className="text-stone-600">Vendor</TableHead>
                  <TableHead className="text-stone-600">Amount</TableHead>
                  <TableHead className="text-stone-600">Date</TableHead>
                  <TableHead className="text-stone-600">Payment Method</TableHead>
                  <TableHead className="text-stone-600">Status</TableHead>
                  <TableHead className="text-stone-600">Actions</TableHead>
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
                  return (
                    <TableRow key={expense.id} className="hover:bg-stone-50">
                      <TableCell className="font-medium text-stone-800">
                        <div>{expense.description}</div>
                        {expense.itemSummary && (
                          <div className="text-xs text-stone-500 mt-1">{expense.itemSummary}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-stone-200 text-stone-600">
                          {expense.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-stone-800">{expense.vendor}</TableCell>
                      <TableCell className="font-medium text-stone-800">{formatCurrency(expense.amount)}</TableCell>
                      <TableCell className="text-stone-800">{formatDate(expense.date)}</TableCell>
                      <TableCell className="text-stone-800">{expense.paymentMethod}</TableCell>
                      <TableCell>{getStatusBadge(expense.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-stone-100"
                            onClick={() => openEditDialog(expense)}
                          >
                            <Pencil className="h-4 w-4 text-stone-700" />
                          </Button>
                          {!isVendorItemExpense && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-100"
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
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </TableComponent>
          </CardContent>
        </Card>
      )}

      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredExpenses.map((expense) => {
            const isVendorItemExpense =
              !expense.raw?.noVendor &&
              String(expense.raw?.vendorId || "") !== NO_VENDOR_ID &&
              Array.isArray(expense.raw?.items) &&
              expense.raw.items.length > 0;
            return (
              <Card key={expense.id} className="border-stone-200 hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-stone-800">{expense.description}</h3>
                      <span className="text-xs text-stone-500">•</span>
                      <span className="text-xs text-stone-600">{expense.vendor}</span>
                    </div>
                    {getStatusBadge(expense.status)}
                  </div>

                  {expense.itemSummary && (
                    <p className="text-xs text-stone-500 mb-2 truncate" title={expense.itemSummary}>
                      {expense.itemSummary}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                    <div className="flex items-center gap-1">
                      <IndianRupee className="h-3 w-3 text-stone-500" />
                      <span className="text-stone-800">{formatCurrency(expense.amount)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-stone-500" />
                      <span className="text-stone-800">{formatDate(expense.date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Tag className="h-3 w-3 text-stone-500" />
                      <span className="text-stone-800 truncate">{expense.category}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Receipt className="h-3 w-3 text-stone-500" />
                      <span className="text-stone-800 truncate">{expense.paymentMethod}</span>
                    </div>
                  </div>

                  {expense.notes && (
                    <div className="mb-2">
                      <p className="text-xs text-stone-600 italic truncate" title={expense.notes}>
                        "{expense.notes}"
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end items-center pt-1 border-t border-stone-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-stone-100"
                      onClick={() => openEditDialog(expense)}
                    >
                      <Pencil className="h-3 w-3 text-stone-700" />
                    </Button>
                    {!isVendorItemExpense && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-red-100"
                        onClick={async () => {
                          const orderId = expense.raw?.id || expense.raw?.orderId || expense.id;
                          const vendorId =
                            selectedVendorId === "ALL"
                              ? expense.raw?.vendorId
                              : selectedVendorId;
                          if (!vendorId) return;

                          await (adminDeleteOrder && adminDeleteOrder(vendorId, orderId, { skipRefresh: true }));
                          await refreshAllOrders();
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-red-600" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredExpenses.length === 0 && (
        <div className="text-center py-12">
          <Receipt className="h-12 w-12 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-stone-600 mb-2">No expenses found</h3>
          <p className="text-stone-500">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
};

export default ExpenseManagementPage;