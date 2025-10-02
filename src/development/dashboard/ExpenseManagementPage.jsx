import React, { useContext, useEffect, useMemo, useState } from "react";
import { Receipt, Plus, Search, Calendar, IndianRupee, Tag, Edit, Trash2, TrendingUp, TrendingDown, Table, Grid3X3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
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

const ExpenseManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "table", "grid"

  // Context: vendors and order APIs
  const {
    vendors,
    adminGetVendors,
    orders,
    adminGetOrders,
    adminGetOrdersRaw,
    adminCreateOrder,
    adminDeleteOrder,
    loader,
  } = useContext(Context);

  // Local state for orders UI
  const [selectedVendorId, setSelectedVendorId] = useState("ALL");
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({ title: "", quantity: "", price: "", paymentMethod: "", notes: "" });
  const [dialogVendorId, setDialogVendorId] = useState("");
  const [localOrders, setLocalOrders] = useState([]); // used when 'ALL' vendors is selected

  // Auto-select the first vendor when vendors load to enable Add Order immediately
  useEffect(() => {
    if (!selectedVendorId && Array.isArray(vendors) && vendors.length > 0) {
      const firstId = vendors[0].id || vendors[0].vendorId;
      if (firstId != null) setSelectedVendorId(String(firstId));
    }
  }, [vendors, selectedVendorId]);

  // When vendor changes, load orders. If 'ALL', aggregate orders from all vendors locally.
  useEffect(() => {
    if (!selectedVendorId) return;
    if (selectedVendorId === 'ALL') {
      (async () => {
        if (!Array.isArray(vendors) || vendors.length === 0) {
          setLocalOrders([]);
          return;
        }
        try {
          const results = await Promise.all(
            vendors.map(async (v) => {
              const vId = v.id || v.vendorId;
              if (!vId) return [];
              const list = await (adminGetOrdersRaw ? adminGetOrdersRaw(vId) : Promise.resolve([]));
              return list.map((o) => ({ ...o, vendorId: o.vendorId || vId }));
            })
          );
          setLocalOrders(results.flat());
        } catch (e) {
          setLocalOrders([]);
        }
      })();
    } else {
      // Single vendor: use context-managed orders
      adminGetOrders && adminGetOrders(selectedVendorId);
      setLocalOrders([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVendorId, vendors]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { variant: "default", className: "bg-green-100 text-green-800" },
      pending: { variant: "secondary", className: "bg-yellow-100 text-yellow-800" },
      overdue: { variant: "destructive", className: "bg-red-100 text-red-800" },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getCategoryIcon = (category) => {
    const categoryIcons = {
      Inventory: Tag,
      Utilities: Receipt,
      Rent: Calendar,
      Marketing: Receipt,
      Equipment: Receipt,
      Insurance: Receipt,
    };
    return categoryIcons[category] || Receipt;
  };

  // Derive expense-like view from orders to reuse UI
  const effectiveOrders = selectedVendorId === 'ALL' ? localOrders : (orders || []);
  const ordersAsExpenses = useMemo(() => {
    return (effectiveOrders || []).map((o, idx) => ({
      id: o.id || o.orderId || idx + 1,
      description: o.title || o.product || o.description || "Order",
      category: "Inventory",
      amount: Number(o.price ?? 0) * Number(o.quantity ?? 1),
      date: o.date || o.createdAt || "",
      vendor: (() => {
        const vId = o.vendorId || (selectedVendorId !== 'ALL' ? selectedVendorId : undefined);
        const v = (vendors || []).find(v => String(v.id || v.vendorId) === String(vId));
        return v?.name || "";
      })(),
      paymentMethod: o.paymentMethod || "",
      status: o.status || "paid",
      receipt: o.receipt || null,
      notes: o.notes || "",
      raw: o,
    }));
  }, [effectiveOrders, vendors, selectedVendorId]);

  const filteredExpenses = ordersAsExpenses.filter(expense =>
    expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.vendor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
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

  const totalExpenses = ordersAsExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const paidExpenses = ordersAsExpenses.filter(e => e.status === 'paid').reduce((sum, expense) => sum + expense.amount, 0);
  const pendingExpenses = ordersAsExpenses.filter(e => e.status === 'pending').reduce((sum, expense) => sum + expense.amount, 0);
  
  const categoryTotals = ordersAsExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  const topCategory = Object.entries(categoryTotals).sort(([,a], [,b]) => b - a)[0];

  return (
    <div className="poppins-regular space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">Expense Management</h1>
          <p className="text-stone-600">Track and manage vendor orders as expenses</p>
        </div>
  <Dialog open={showAddOrder} onOpenChange={(o) => { setShowAddOrder(o); if (!o) { setNewOrder({ title: "", quantity: "", price: "", paymentMethod: "", notes: "" }); setDialogVendorId(""); } else { if (selectedVendorId === 'ALL') { const first = Array.isArray(vendors) && vendors.length > 0 ? (vendors[0].id || vendors[0].vendorId) : ""; setDialogVendorId(first ? String(first) : ""); } else { setDialogVendorId(selectedVendorId || ""); } } }}>
          <DialogTrigger asChild>
            <Button className="bg-stone-600 hover:bg-stone-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Order/Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Expense/Order</DialogTitle>
              <DialogDescription>Create a new order.</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!dialogVendorId) return;
                const payload = { ...newOrder, product: newOrder.title };
                await adminCreateOrder(dialogVendorId, payload);
                setShowAddOrder(false);
                setNewOrder({ title: "", quantity: "", price: "", paymentMethod: "", notes: "" });
                // Refresh orders after creation
                if (selectedVendorId === 'ALL') {
                  const results = await Promise.all(
                    (vendors || []).map(async (v) => {
                      const vId = v.id || v.vendorId;
                      if (!vId) return [];
                      const list = await (adminGetOrdersRaw ? adminGetOrdersRaw(vId) : Promise.resolve([]));
                      return list.map((o) => ({ ...o, vendorId: o.vendorId || vId }));
                    })
                  );
                  setLocalOrders(results.flat());
                } else {
                  adminGetOrders && adminGetOrders(selectedVendorId);
                }
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="mb-1 block" htmlFor="order-vendor">Vendor</Label>
                  <Select value={dialogVendorId} onValueChange={setDialogVendorId}>
                    <SelectTrigger id="order-vendor">
                      <SelectValue placeholder="Select a vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {(vendors || []).map(v => (
                        <SelectItem key={v.id || v.vendorId} value={(v.id || v.vendorId)?.toString?.() || String(v.id || v.vendorId)}>
                          {v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="order-title">Title</Label>
                  <Input id="order-title" value={newOrder.title} onChange={e => setNewOrder(s => ({ ...s, title: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="order-quantity">Quantity</Label>
                  <Input id="order-quantity" type="number" min="1" value={newOrder.quantity} onChange={e => setNewOrder(s => ({ ...s, quantity: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="order-price">Price</Label>
                  <Input id="order-price" type="number" min="0" step="0.01" value={newOrder.price} onChange={e => setNewOrder(s => ({ ...s, price: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="order-payment">Payment Method</Label>
                  <Select value={newOrder.paymentMethod} onValueChange={(val) => setNewOrder(s => ({ ...s, paymentMethod: val }))}>
                    <SelectTrigger id="order-payment">
                      <SelectValue placeholder="Select method" />
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
                  <Input id="order-notes" value={newOrder.notes} onChange={e => setNewOrder(s => ({ ...s, notes: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" className="bg-stone-600 text-white" disabled={loader || !dialogVendorId || !newOrder.title || !newOrder.quantity || !newOrder.price}>
                  {loader ? "Adding..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Vendor selector to scope orders */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
        <div className="flex-1">
          <Label className="mb-1 block text-sm">Vendor</Label>
          <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a vendor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All vendors</SelectItem>
              {(vendors || []).map(v => (
                <SelectItem key={v.id || v.vendorId} value={(v.id || v.vendorId)?.toString?.() || String(v.id || v.vendorId)}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Label className="mb-1 block text-sm">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 h-4 w-4" />
            <Input placeholder="Search orders by product or vendor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 border-stone-200" />
          </div>
        </div>
      </div>

      {/* Expense Summary - Compact */}
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
                <p className="text-lg font-bold text-blue-600">{topCategory?.[0] || 'N/A'}</p>
                <p className="text-xs text-stone-600">{formatCurrency(topCategory?.[1] || 0)}</p>
              </div>
              <Tag className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search, Stats, and View Toggle */}
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
            Paid: {ordersAsExpenses.filter(e => e.status === 'paid').length}
          </Badge>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pending: {ordersAsExpenses.filter(e => e.status === 'pending').length}
          </Badge>
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            Overdue: {ordersAsExpenses.filter(e => e.status === 'overdue').length}
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

      {/* Dynamic View Based on Selection */}
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
                  {/* Receipt column removed */}
                  <TableHead className="text-stone-600">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => {
                  const CategoryIcon = getCategoryIcon(expense.category);
                  const orderId = expense.raw?.id || expense.raw?.orderId || expense.id;
                  return (
                    <TableRow key={expense.id} className="hover:bg-stone-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-stone-200 flex items-center justify-center">
                            <CategoryIcon className="h-4 w-4 text-stone-600" />
                          </div>
                          <div>
                            <div className="font-medium text-stone-800">{expense.description}</div>
                            {expense.notes && (
                              <div className="text-xs text-stone-500 truncate max-w-xs" title={expense.notes}>
                                "{expense.notes}"
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-stone-200 text-stone-600">
                          {expense.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-stone-800">{expense.vendor}</TableCell>
                      <TableCell className="font-medium text-stone-800">{formatCurrency(expense.amount)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-stone-500" />
                          <span className="text-sm text-stone-800">{formatDate(expense.date)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-stone-500" />
                          <span className="text-sm text-stone-800">{expense.paymentMethod}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(expense.status)}</TableCell>
                      {/* Receipt cell removed */}
                      <TableCell>
                        <div className="flex gap-1">
                          {/* Edit could be added later */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-red-100"
                            onClick={async () => {
                              const vId = selectedVendorId === 'ALL' ? (expense.raw?.vendorId) : selectedVendorId;
                              if (!vId) return;
                              await (adminDeleteOrder && adminDeleteOrder(vId, orderId));
                              if (selectedVendorId === 'ALL') {
                                const results = await Promise.all(
                                  (vendors || []).map(async (v) => {
                                    const vendorId = v.id || v.vendorId;
                                    if (!vendorId) return [];
                                    const list = await (adminGetOrdersRaw ? adminGetOrdersRaw(vendorId) : Promise.resolve([]));
                                    return list.map((o) => ({ ...o, vendorId: o.vendorId || vendorId }));
                                  })
                                );
                                setLocalOrders(results.flat());
                              } else {
                                adminGetOrders && adminGetOrders(selectedVendorId);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
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
            const CategoryIcon = getCategoryIcon(expense.category);
            
            return (
              <Card key={expense.id} className="border-stone-200 hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-stone-800">{expense.description}</h3>
                      <span className="text-xs text-stone-500">•</span>
                      <span className="text-xs text-stone-600">{expense.vendor}</span>
                    </div>
                    {getStatusBadge(expense.status)}
                  </div>
                  
                  {/* Main Info Grid */}
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
                  
                  {/* Category Badge */}
                  <div className="mb-2">
                    <Badge variant="outline" className="text-xs px-1 py-0 border-stone-200 text-stone-600 h-5">
                      {expense.category}
                    </Badge>
                  </div>

                  {/* Notes */}
                  {expense.notes && (
                    <div className="mb-2">
                      <p className="text-xs text-stone-600 italic truncate" title={expense.notes}>
                        "{expense.notes}"
                      </p>
                    </div>
                  )}

                  {/* Status row (receipt removed) */}
                  <div className="flex justify-end items-center text-xs mb-2">
                    <div className="font-semibold text-stone-800">
                      {expense.status === 'paid' && '✓ Paid'}
                      {expense.status === 'pending' && '⏳ Pending'}
                      {expense.status === 'overdue' && '⚠ Overdue'}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end items-center pt-1 border-t border-stone-100">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-red-100"
                        onClick={async () => {
                          const orderId = expense.raw?.id || expense.raw?.orderId || expense.id;
                          const vId = selectedVendorId === 'ALL' ? (expense.raw?.vendorId) : selectedVendorId;
                          if (!vId) return;
                          await (adminDeleteOrder && adminDeleteOrder(vId, orderId));
                          if (selectedVendorId === 'ALL') {
                            const results = await Promise.all(
                              (vendors || []).map(async (v) => {
                                const vendorId = v.id || v.vendorId;
                                if (!vendorId) return [];
                                const list = await (adminGetOrdersRaw ? adminGetOrdersRaw(vendorId) : Promise.resolve([]));
                                return list.map((o) => ({ ...o, vendorId: o.vendorId || vendorId }));
                              })
                            );
                            setLocalOrders(results.flat());
                          } else {
                            adminGetOrders && adminGetOrders(selectedVendorId);
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-red-600" />
                      </Button>
                    </div>
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
