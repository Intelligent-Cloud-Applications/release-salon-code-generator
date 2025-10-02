
import React, { useState, useContext, useEffect } from "react";
import Context from "../Context/Context";
import { Truck, Plus, Search, Phone, MapPin, Star, Edit, Trash2, Package } from "lucide-react";
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
  const {
    vendors,
    adminGetVendors,
    adminCreateVendor,
    adminUpdateVendor,
    adminDeleteVendor,
    adminGetOrdersRaw,
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

  // Derived data & helpers
  const totalVendors = vendors ? vendors.length : 0;
  const activeVendors = vendors ? vendors.filter((v) => v.status === "active").length : 0;
  const totalSpent = vendors ? vendors.reduce((sum, v) => sum + (v.totalSpent || 0), 0) : 0;
  const avgRating = vendors && vendors.length > 0
    ? (vendors.reduce((sum, v) => sum + (v.rating || 0), 0) / vendors.length).toFixed(1)
    : 0;

  const filteredVendors = vendors
    ? vendors.filter((v) => {
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
    const base = "px-2 py-1 rounded text-xs font-medium";
    const variants = {
      active: "bg-green-100 text-green-700",
      inactive: "bg-stone-100 text-stone-700",
      suspended: "bg-yellow-100 text-yellow-700",
    };
    const cls = variants[status] || "bg-stone-100 text-stone-700";
    return <span className={`${base} ${cls}`}>{status || "unknown"}</span>;
  };

  // Removed rating stars from card UI per requirement

  const handleDeleteVendor = async (id) => {
    if (!id) return;
    await adminDeleteVendor(id);
  };

  // Per-vendor order stats (count, total amount, and last order info)
  const [vendorOrderStats, setVendorOrderStats] = useState({}); // { [vendorId]: { count, amount, lastDate, lastTitle } }

  useEffect(() => {
    // When vendors load/update, fetch orders for each vendor to compute stats
    if (!Array.isArray(vendors) || vendors.length === 0 || !adminGetOrdersRaw) {
      setVendorOrderStats({});
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const entries = await Promise.all(
          vendors.map(async (v) => {
            const vId = v.id || v.vendorId;
            if (!vId) return [null, { count: 0, amount: 0 }];
            try {
              const list = await adminGetOrdersRaw(vId);
              const safeList = Array.isArray(list) ? list : [];
              const count = safeList.length;
              const amount = safeList.reduce((sum, o) => {
                const qty = Number(o?.quantity ?? 1) || 1;
                const price = Number(o?.price ?? 0) || 0;
                return sum + qty * price;
              }, 0);
              // Determine last order by date (createdAt/date)
              let lastDate = null;
              let lastTitle = "";
              for (const o of safeList) {
                const d = new Date(o?.date || o?.createdAt || 0);
                if (!isNaN(d)) {
                  if (!lastDate || d > lastDate) {
                    lastDate = d;
                    lastTitle = o?.title || o?.product || o?.description || "Order";
                  }
                }
              }
              return [String(vId), { count, amount, lastDate: lastDate ? lastDate.toISOString() : null, lastTitle }];
            } catch (e) {
              return [String(vId), { count: 0, amount: 0, lastDate: null, lastTitle: "" }];
            }
          })
        );
        if (cancelled) return;
        const map = {};
        for (const [id, val] of entries) {
          if (id) map[id] = val;
        }
        setVendorOrderStats(map);
      } catch (e) {
        if (!cancelled) setVendorOrderStats({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [vendors, adminGetOrdersRaw]);

  const totalSpentInr = Array.isArray(vendors)
    ? vendors.reduce((sum, v) => sum + (vendorOrderStats[String(v.id || v.vendorId)]?.amount || 0), 0)
    : 0;

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
    <div className="poppins-regular space-y-6 p-6">
      {/* Header */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">Vendor Management</h1>
          <p className="text-stone-600">Manage your salon suppliers and vendors</p>
        </div>
        <div>
          <Dialog open={showAddModal} onOpenChange={(open) => { setShowAddModal(open); if (!open) { setNewVendor({ name: "", phone: "", product: "", address: "" }); } }}>
            <DialogTrigger asChild>
              <Button className="bg-stone-600 hover:bg-stone-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Vendor</DialogTitle>
                <DialogDescription>Add a new vendor with basic details.</DialogDescription>
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
                className="space-y-6"
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
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit" className="bg-stone-600 text-white" disabled={loader || !newVendor.name || !newVendor.phone || !newVendor.product || !newVendor.address}>
                    {loader ? "Adding..." : "Add Vendor"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Vendor Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-stone-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-600">Total Vendors</p>
                <p className="text-2xl font-bold text-stone-800">{vendors ? vendors.length : 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-stone-100">
                <Truck className="h-6 w-6 text-stone-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-stone-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-600">Active Vendors</p>
                <p className="text-2xl font-bold text-green-600">{vendors ? vendors.filter(v => v.status === 'active').length : 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-100">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-stone-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-600">Total Spent</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalSpentInr)}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-stone-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-600">Avg Rating</p>
                <p className="text-2xl font-bold text-yellow-600">{vendors && vendors.length > 0 ? (vendors.reduce((sum, v) => sum + (v.rating || 0), 0) / vendors.length).toFixed(1) : 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-100">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      

      {/* Search and Stats */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 h-4 w-4" />
          <Input
            placeholder="Search by name, product, or contact number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-stone-200"
          />
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-stone-100 text-stone-800">
            Total: {totalVendors}
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Active: {activeVendors}
          </Badge>
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredVendors.map((vendor) => (
          <Card key={vendor.id} className="border-stone-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-stone-200 flex items-center justify-center">
                    <Truck className="h-6 w-6 text-stone-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-stone-800">{vendor.name}</CardTitle>
                    <p className="text-sm text-stone-600">{vendor.category}</p>
                  </div>
                </div>
                {getStatusBadge(vendor.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Contact Information */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-stone-600">
                  <Phone className="h-4 w-4" />
                  <span>{vendor.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-stone-600">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{vendor.address}</span>
                </div>
              </div>

              {/* Vendor Stats */}
              <div className="pt-3 border-t border-stone-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-stone-600">Total Orders</p>
                    <p className="text-sm font-medium text-stone-800">{vendorOrderStats[String(vendor.id || vendor.vendorId)]?.count ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-600">Total Spent</p>
                    <p className="text-sm font-medium text-stone-800">{formatCurrency(vendorOrderStats[String(vendor.id || vendor.vendorId)]?.amount ?? 0)}</p>
                  </div>
                </div>
              </div>

              {/* Last order (computed from orders) */}
              <div className="pt-3 border-t border-stone-100">
                <div className="text-sm text-stone-600">
                  Last order: {vendorOrderStats[String(vendor.id || vendor.vendorId)]?.lastTitle || "—"}
                  {vendorOrderStats[String(vendor.id || vendor.vendorId)]?.lastDate ? (
                    <span className="text-stone-500"> • {formatDate(vendorOrderStats[String(vendor.id || vendor.vendorId)]?.lastDate)}</span>
                  ) : null}
                </div>
              </div>

              {/* Notes */}
              {vendor.notes && (
                <div className="pt-3 border-t border-stone-100">
                  <p className="text-xs text-stone-500 italic">"{vendor.notes}"</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-stone-200 text-stone-600 hover:bg-stone-50"
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
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                {/* Order action removed per requirement */}
      {/* Edit Vendor Dialog */}
      <Dialog open={!!editVendor} onOpenChange={(open) => {
        if (!open) {
          setEditVendor(null);
          setEditVendorState(null);
        }
      }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Vendor</DialogTitle>
            <DialogDescription>Update vendor details and save changes.</DialogDescription>
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
              await handleEditVendor(editVendor.id || editVendor.vendorId, vendorData);
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
                <Button type="button" variant="outline" onClick={() => { setEditVendor(null); setEditVendorState(null); }}>Cancel</Button>
              </DialogClose>
              <Button type="submit" className="bg-stone-600 text-white" disabled={loader || !editVendorState?.name || !editVendorState?.phone || !editVendorState?.product || !editVendorState?.address}>
                {loader ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Order dialog removed per requirement */}
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => handleDeleteVendor(vendor.id || vendor.vendorId)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVendors.length === 0 && (
        <div className="text-center py-12">
          <Truck className="h-12 w-12 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-stone-600 mb-2">No vendors found</h3>
          <p className="text-stone-500">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
};

export default VendorManagementPage;
