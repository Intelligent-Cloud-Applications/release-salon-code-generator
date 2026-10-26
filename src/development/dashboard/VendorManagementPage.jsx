
import React, { useState, useContext, useMemo } from "react";
import Context from "../Context/Context";
import { Truck, Plus, Search, Phone, MapPin, Edit, Trash2, Package, Grid3X3, Table as TableIcon,
  List,
  X,
  ShoppingBag,
  CreditCard } from "lucide-react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";

const VendorManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("auto"); // "auto", "table", "grid"
  const {
    vendors,
    adminGetVendors,
    adminCreateVendor,
    adminUpdateVendor,
    adminDeleteVendor,
    loader
  } = useContext(Context);

  // Modal state for add/edit
  const [showAddModal, setShowAddModal] = useState(false);
  const [editVendor, setEditVendor] = useState(null);
  const [editVendorState, setEditVendorState] = useState(null);
  const [newVendor, setNewVendor] = useState({
    name: "",
    phone: "",
    product: "",
    address: "",
  });

  const updateField = (key, value) => setNewVendor((prev) => ({ ...prev, [key]: value }));

  // useEffect(() => {
  //   adminGetVendors();
  //   // eslint-disable-next-line
  // }, []);

  // Handler for add vendor (basic, you can expand form fields as needed)
  // Handler for edit vendor
  const handleEditVendor = async (vendorId, vendorData) => {
    await adminUpdateVendor(vendorId, vendorData);
    setEditVendor(null);
    setEditVendorState(null);
  };

  const handleAddVendor = async (vendorData) => {
    await adminCreateVendor(vendorData);
    setShowAddModal(false);
    setNewVendor({ name: "", phone: "", product: "", address: "" });
  };

  const visibleVendors = useMemo(
    () =>
      Array.isArray(vendors)
        ? vendors.filter(
            (v) => String(v.vendorId || v.id) !== "NO_VENDOR" && !!v?.name,
          )
        : [],
    [vendors],
  );

  // Derived data & helpers
  const totalVendors = visibleVendors.length;
  const activeVendors = visibleVendors.filter((v) => v.status === "active").length;
  const totalSpent = visibleVendors.reduce((sum, v) => sum + (v.totalSpent || 0), 0);

  const filteredVendors = visibleVendors
    ? visibleVendors.filter((v) => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return true;
        return [v.name, v.product, v.category, v.phone]
          .map((x) => (x || "").toLowerCase())
          .some((s) => s.includes(q));
      })
    : [];

  // INR currency formatting to align with Expense page
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount || 0);

  const getStatusBadge = (status) => {
    const s = String(status || "active").toLowerCase();
    if (s === "inactive") {
      return (
        <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-[10px] sm:text-xs font-bold text-slate-700 shadow-2xs">
          INACTIVE
        </span>
      );
    }
    if (s === "suspended") {
      return (
        <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-[10px] sm:text-xs font-bold text-amber-900 shadow-2xs">
          SUSPENDED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-[10px] sm:text-xs font-bold text-emerald-800 shadow-2xs">
        ACTIVE
      </span>
    );
  };

  // Removed rating stars from card UI per requirement

  const handleDeleteVendor = async (id) => {
    if (!id) return;
    await adminDeleteVendor(id);
  };

  const vendorOrderStats = useMemo(() => {
    const map = {};
    for (const vendor of visibleVendors) {
      const vId = String(vendor.vendorId || vendor.id || "");
      if (!vId) continue;

      const safeList = Array.isArray(vendor.orders) ? vendor.orders : [];
      const count = safeList.length;
      const amount = safeList.reduce((sum, o) => {
        const qty = Number(o?.quantity ?? 1) || 1;
        const price = Number(o?.price ?? 0) || 0;
        return sum + qty * price;
      }, 0);

      let lastDate = null;
      let lastTitle = "";
      for (const o of safeList) {
        const d = new Date(o?.date || o?.createdAt || 0);
        if (!isNaN(d) && (!lastDate || d > lastDate)) {
          lastDate = d;
          lastTitle = o?.title || o?.product || o?.description || "Order";
        }
      }

      map[vId] = {
        count,
        amount,
        lastDate: lastDate ? lastDate.toISOString() : null,
        lastTitle,
      };
    }
    return map;
  }, [visibleVendors]);

  const totalSpentInr = Array.isArray(visibleVendors)
    ? visibleVendors.reduce((sum, v) => sum + (vendorOrderStats[String(v.vendorId || v.id)]?.amount || 0), 0)
    : 0;

  const totalOrdersCount = useMemo(() => {
    return Object.values(vendorOrderStats).reduce(
      (sum, s) => sum + (s.count || 0),
      0
    );
  }, [vendorOrderStats]);

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

  return (
    <div className="poppins-regular space-y-4 sm:space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Vendor Management
          </h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Manage your salon suppliers, contacts, and purchase orders
          </p>
        </div>
        <div>
          <Dialog open={showAddModal} onOpenChange={(open) => { setShowAddModal(open); if (!open) { setNewVendor({ name: "", phone: "", product: "", address: "" }); } }}>
            <DialogTrigger asChild>
              <Button className="h-9 gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition-all">
                <Plus className="h-4 w-4" />
                Add Vendor
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100%-2rem)] sm:w-full sm:max-w-md max-h-[85vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">Add Vendor</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">Add a new supplier or vendor to your salon directory.</DialogDescription>
              </DialogHeader>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const vendorData = {
                    ...newVendor,
                    category: newVendor.product,
                    status: "active",
                    rating: 0,
                    totalOrders: 0,
                    totalSpent: 0,
                  };
                  await handleAddVendor(vendorData);
                }}
                className="space-y-3.5 pt-1"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="Ex: Acme Supplies" value={newVendor.name} onChange={(e) => updateField("name", e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Contact Number</Label>
                    <Input id="phone" placeholder="Ex: +1 555 123 4567" value={newVendor.phone} onChange={(e) => updateField("phone", e.target.value)} required />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="product">Product</Label>
                    <Input id="product" placeholder="Ex: Shampoos, Clippers, Towels" value={newVendor.product} onChange={(e) => updateField("product", e.target.value)} required />
                  </div>
                </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="address">Location</Label>
                    <Input id="address" placeholder="Ex: Street, City, State" value={newVendor.address} onChange={(e) => updateField("address", e.target.value)} required />
                  </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline" className="rounded-xl">Cancel</Button>
                  </DialogClose>
                  <Button type="submit" className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold" disabled={loader || !newVendor.name || !newVendor.phone || !newVendor.product || !newVendor.address}>
                    {loader ? "Adding..." : "Add Vendor"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Vendor Summary - Compact Tinted KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="rounded-xl border border-blue-200/90 bg-gradient-to-br from-blue-50/90 via-white to-blue-50/30 p-2 sm:p-2.5 shadow-2xs">
          <div className="flex items-center justify-between gap-1 mb-1">
            <p className="text-[10px] sm:text-xs font-semibold text-blue-700 truncate">Total Vendors</p>
            <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md bg-blue-600 text-white shadow-2xs shrink-0">
              <Truck className="h-3 w-3" />
            </div>
          </div>
          <p className="text-sm sm:text-base font-black tracking-tight text-blue-950 truncate">{totalVendors}</p>
        </div>

        <div className="rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/30 p-2 sm:p-2.5 shadow-2xs">
          <div className="flex items-center justify-between gap-1 mb-1">
            <p className="text-[10px] sm:text-xs font-semibold text-emerald-800 truncate">Active Vendors</p>
            <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md bg-emerald-600 text-white shadow-2xs shrink-0">
              <Package className="h-3 w-3" />
            </div>
          </div>
          <p className="text-sm sm:text-base font-black tracking-tight text-emerald-950 truncate">{activeVendors}</p>
        </div>

        <div className="rounded-xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/90 via-white to-indigo-50/30 p-2 sm:p-2.5 shadow-2xs">
          <div className="flex items-center justify-between gap-1 mb-1">
            <p className="text-[10px] sm:text-xs font-semibold text-indigo-800 truncate">Total Spent</p>
            <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md bg-indigo-600 text-white shadow-2xs shrink-0">
              <CreditCard className="h-3 w-3" />
            </div>
          </div>
          <p className="text-xs sm:text-sm font-black tracking-tight text-indigo-950 truncate">{formatCurrency(totalSpentInr)}</p>
        </div>

        <div className="rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50/90 via-white to-amber-50/30 p-2 sm:p-2.5 shadow-2xs">
          <div className="flex items-center justify-between gap-1 mb-1">
            <p className="text-[10px] sm:text-xs font-semibold text-amber-800 truncate">Total Orders</p>
            <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md bg-amber-500 text-white shadow-2xs shrink-0">
              <ShoppingBag className="h-3 w-3" />
            </div>
          </div>
          <p className="text-sm sm:text-base font-black tracking-tight text-amber-950 truncate">{totalOrdersCount}</p>
        </div>
      </div>

      {/* Symmetrical Search and Controls Bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by vendor name, product, or phone..."
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

        {/* Row 2 on mobile: Stats + View Mode Toggle */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs h-9">
              Total: {totalVendors}
            </span>
            <span className="inline-flex items-center rounded-xl border border-emerald-300 bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 shadow-xs h-9">
              Active: {activeVendors}
            </span>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-xs h-9">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("table")}
              className={`h-7.5 w-8 rounded-lg p-0 transition-colors cursor-pointer ${
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
              className={`h-7.5 w-8 rounded-lg p-0 transition-colors cursor-pointer ${
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

      {/* 1. TABLE VIEW (Desktop Table + Native Mobile Table List) */}
      <div
        className={
          viewMode === "table"
            ? "block"
            : viewMode === "grid"
            ? "hidden"
            : "hidden lg:block"
        }
      >
        {/* DESKTOP TABLE (hidden sm:block): Full Table */}
        <div className="hidden sm:block rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/75">
              <TableRow className="border-b border-slate-200/80">
                <TableHead className="text-xs font-semibold text-slate-600">Vendor</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Category</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Contact</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Orders</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Total Spent</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                <TableHead className="text-right text-xs font-semibold text-slate-600">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendors.map((vendor) => {
                const stats = vendorOrderStats[String(vendor.vendorId || vendor.id)] || { count: 0, amount: 0 };
                const isActive = vendor.status === "active";
                const isSuspended = vendor.status === "suspended";
                const borderAccent = isActive
                  ? "border-l-4 border-l-emerald-500"
                  : isSuspended
                  ? "border-l-4 border-l-amber-500"
                  : "border-l-4 border-l-slate-400";

                return (
                  <TableRow
                    key={vendor.vendorId || vendor.id}
                    className={`hover:bg-slate-50/75 transition-colors border-b border-slate-100 ${borderAccent}`}
                  >
                    {/* Vendor Avatar + Name */}
                    <TableCell className={`py-2.5 px-4 font-bold text-slate-900 text-xs sm:text-sm border-l-4 ${borderAccent}`}>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-xs shrink-0 shadow-xs shadow-blue-200">
                          {vendor.name ? vendor.name.substring(0, 2).toUpperCase() : <Truck className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">{vendor.name}</div>
                          {vendor.notes && (
                            <div className="text-[11px] text-slate-400 font-normal italic truncate max-w-xs">{vendor.notes}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Category */}
                    <TableCell className="py-2.5 px-3">
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full inline-block shadow-2xs">
                        {vendor.category || vendor.product || "General"}
                      </span>
                    </TableCell>

                    {/* Contact */}
                    <TableCell className="py-2.5 px-3 text-xs">
                      <div className="space-y-0.5">
                        {vendor.phone && (
                          <a
                            href={`tel:${vendor.phone}`}
                            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium"
                          >
                            <Phone className="h-3 w-3 text-blue-500 shrink-0" />
                            <span>{vendor.phone}</span>
                          </a>
                        )}
                        {vendor.address && (
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[150px]">{vendor.address}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Orders */}
                    <TableCell className="py-2.5 px-3">
                      <span className="text-xs font-bold text-blue-700 bg-blue-50/90 border border-blue-200/90 px-2 py-0.5 rounded-lg shadow-2xs">
                        {stats.count} orders
                      </span>
                    </TableCell>

                    {/* Total Spent */}
                    <TableCell className="py-2.5 px-3">
                      <span className="text-xs font-black text-emerald-800 bg-emerald-50/90 border border-emerald-200/90 px-2 py-0.5 rounded-lg shadow-2xs">
                        {formatCurrency(stats.amount)}
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-2.5 px-3">
                      {getStatusBadge(vendor.status)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 rounded-lg p-0 text-slate-500 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                          onClick={() => {
                            setEditVendor(vendor);
                            setEditVendorState({
                              name: vendor.name || "",
                              phone: vendor.phone || "",
                              product: vendor.product || vendor.category || "",
                              address: vendor.address || "",
                            });
                          }}
                          title="Edit vendor"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 rounded-lg p-0 text-slate-500 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                          onClick={() => handleDeleteVendor(vendor.vendorId || vendor.id)}
                          title="Delete vendor"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* MOBILE TABLE VIEW (sm:hidden): Native Compact Row List (No Sideways Scroll!) */}
        <div className="sm:hidden bg-white rounded-2xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
          {filteredVendors.map((vendor) => {
            const stats = vendorOrderStats[String(vendor.vendorId || vendor.id)] || { count: 0, amount: 0 };
            const isActive = vendor.status === "active";
            const isSuspended = vendor.status === "suspended";
            const borderAccent = isActive
              ? "border-l-4 border-l-emerald-500"
              : isSuspended
              ? "border-l-4 border-l-amber-500"
              : "border-l-4 border-l-slate-400";

            return (
              <div
                key={vendor.vendorId || vendor.id}
                className={`p-2 sm:p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50/80 transition-colors ${borderAccent}`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-xs shrink-0 shadow-xs shadow-blue-200">
                    {vendor.name ? vendor.name.substring(0, 2).toUpperCase() : <Truck className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate max-w-[140px]">
                        {vendor.name}
                      </h4>
                      <span className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-1.5 py-0.2 rounded-full shrink-0">
                        {vendor.category || vendor.product || "General"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                      <span className="font-bold text-emerald-700">{formatCurrency(stats.amount)}</span>
                      <span>•</span>
                      <span>{stats.count} orders</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {getStatusBadge(vendor.status)}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 rounded-lg p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                    onClick={() => {
                      setEditVendor(vendor);
                      setEditVendorState({
                        name: vendor.name || "",
                        phone: vendor.phone || "",
                        product: vendor.product || vendor.category || "",
                        address: vendor.address || "",
                      });
                    }}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 rounded-lg p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    onClick={() => handleDeleteVendor(vendor.vendorId || vendor.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
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
          {filteredVendors.map((vendor) => {
            const stats = vendorOrderStats[String(vendor.vendorId || vendor.id)] || { count: 0, amount: 0 };
            const isActive = vendor.status === "active";
            const isSuspended = vendor.status === "suspended";
            const borderAccent = isActive
              ? "border-l-4 border-l-emerald-500"
              : isSuspended
              ? "border-l-4 border-l-amber-500"
              : "border-l-4 border-l-slate-400";

            return (
              <Card
                key={vendor.vendorId || vendor.id}
                className={`group relative rounded-xl border border-slate-200/90 bg-white p-2.5 sm:p-3 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all border-l-4 ${borderAccent}`}
              >
                {/* Top Row: Avatar + Name + Category + Contact on left, Status on right */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-xs shrink-0 shadow-2xs">
                      {vendor.name ? vendor.name.substring(0, 2).toUpperCase() : <Truck className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3
                          className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors"
                          title={vendor.name}
                        >
                          {vendor.name}
                        </h3>
                        <span className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-1.5 py-0.2 rounded-md truncate shadow-2xs">
                          {vendor.category || vendor.product || "General"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 truncate">
                        {vendor.phone && (
                          <a
                            href={`tel:${vendor.phone}`}
                            className="flex items-center gap-1 text-blue-600 hover:underline shrink-0"
                            title="Call vendor"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone className="h-3 w-3" />
                            <span>{vendor.phone}</span>
                          </a>
                        )}
                        {vendor.address && (
                          <span className="truncate text-slate-400">• {vendor.address}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {getStatusBadge(vendor.status)}
                  </div>
                </div>

                {/* Bottom Row: Orders & Spent on left, Edit & Delete on right */}
                <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-slate-100">
                  <div className="flex items-center gap-2 sm:gap-2.5 text-[11px]">
                    <span className="text-slate-500">
                      Orders: <strong className="text-blue-700 font-bold">{stats.count}</strong>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">
                      Spent: <strong className="text-emerald-700 font-bold">{formatCurrency(stats.amount)}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 sm:h-7 px-2 text-[11px] rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer font-medium"
                      onClick={() => {
                        setEditVendor(vendor);
                        setEditVendorState({
                          name: vendor.name || "",
                          phone: vendor.phone || "",
                          product: vendor.product || vendor.category || "",
                          address: vendor.address || "",
                        });
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg p-0 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                      onClick={() => handleDeleteVendor(vendor.vendorId || vendor.id)}
                      title="Delete vendor"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

            {filteredVendors.length === 0 && (
        <div className="text-center py-12">
          <Truck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-slate-700 mb-1">No vendors found</h3>
          <p className="text-xs text-slate-400">Try adjusting your search criteria</p>
        </div>
      )}

      {/* Edit Vendor Dialog (Cleanly outside loop) */}
      <Dialog
        open={!!editVendor}
        onOpenChange={(open) => {
          if (!open) {
            setEditVendor(null);
            setEditVendorState(null);
          }
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] sm:w-full sm:max-w-md max-h-[85vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">Edit Vendor</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">Update vendor details and save changes.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const vendorData = {
                ...editVendorState,
                category: editVendorState.product,
                address: editVendorState.address,
                status: editVendor.status || "active",
                rating: editVendor.rating || 0,
                totalOrders: editVendor.totalOrders || 0,
                totalSpent: editVendor.totalSpent || 0,
              };
              await handleEditVendor(editVendor.vendorId || editVendor.id, vendorData);
            }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" value={editVendorState?.name || ""} onChange={e => setEditVendorState(s => ({ ...s, name: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-phone">Contact Number</Label>
                <Input id="edit-phone" value={editVendorState?.phone || ""} onChange={e => setEditVendorState(s => ({ ...s, phone: e.target.value }))} required />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="edit-product">Product</Label>
                <Input id="edit-product" value={editVendorState?.product || ""} onChange={e => setEditVendorState(s => ({ ...s, product: e.target.value }))} required />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="edit-address">Location</Label>
                <Input id="edit-address" value={editVendorState?.address || ""} onChange={e => setEditVendorState(s => ({ ...s, address: e.target.value }))} required />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => { setEditVendor(null); setEditVendorState(null); }}>Cancel</Button>
              </DialogClose>
              <Button type="submit" className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold" disabled={loader || !editVendorState?.name || !editVendorState?.phone || !editVendorState?.product || !editVendorState?.address}>
                {loader ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorManagementPage;
