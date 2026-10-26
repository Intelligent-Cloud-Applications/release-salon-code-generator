import React, { useContext, useState, useEffect } from "react";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2,
  TrendingDown,
  TrendingUp,
  Table,
  List,
  Grid3X3,
  X,
  LogIn,
  Scissors,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/development/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/development/components/ui/select";
import { Label } from "@/development/components/ui/label";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import Context from "../Context/Context";

const InventoryPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("auto"); // "auto", "table", "grid"
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    institutionData,
    createProduct,
    updateProduct,
    deleteProduct,
    fetchProducts,
    products,
    vendors,
    adminGetVendors,
  } = useContext(Context);
  const activeInstitutionId =
    institutionData?.institutionid || institutionData?.institutionId;

  // Fetch products and vendors on mount
  useEffect(() => {
    if (activeInstitutionId && (!Array.isArray(products) || products.length === 0)) {
      fetchProducts(activeInstitutionId);
    }
    if (adminGetVendors && (!Array.isArray(vendors) || vendors.length === 0)) {
      adminGetVendors();
    }
  }, [activeInstitutionId, products, vendors, fetchProducts, adminGetVendors]);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const primaryColor = institutionData?.primaryColor || "#4F46E5"; // Default to indigo if not set

  // Current product data for form
  const [formData, setFormData] = useState({
    productName: "",
    category: "",
    currentStock: "",
    minStock: "",
    maxStock: "",
    amount: "",
    supplier: "",
    status: "",
  });

  // Loading state for API calls
  const [isLoading, setIsLoading] = useState(false);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      productName: "",
      category: "",
      currentStock: "",
      minStock: "",
      maxStock: "",
      amount: "",
      supplier: "",
      status: "",
    });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        institutionId: activeInstitutionId,
        productName: formData.productName,
        category: formData.category,
        currentStock: Number(formData.currentStock),
        minStock: Number(formData.minStock),
        maxStock: Number(formData.maxStock),
        amount: Number(formData.amount),
        supplier: formData.supplier,
        status: formData.status,
      };

        const res = await createProduct(payload);
      console.log("Product Created:", res);

      // Product created successfully, refetch products if needed
      resetForm();
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error("Create Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (product) => {
    setSelectedProduct(product);
    setFormData({
      productName: product.productName,
      category: product.category,
      currentStock: product.currentStock,
      minStock: product.minStock,
      maxStock: product.maxStock,
      amount: product.amount,
      supplier: product.supplier,
      status: product.status,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setIsLoading(true);

    try {
      const payload = {
        productName: formData.productName,
        category: formData.category,
        currentStock: Number(formData.currentStock),
        minStock: Number(formData.minStock),
        maxStock: Number(formData.maxStock),
        amount: Number(formData.amount),
        supplier: formData.supplier,
        status: formData.status,
      };

      const res = await updateProduct(
        activeInstitutionId,
        selectedProduct.productId,
        payload,
      );
      console.log("Product Updated:", res);

      // Product updated successfully

      resetForm();
      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Update Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await deleteProduct(
        activeInstitutionId,
        selectedProduct.productId,
      );
      // Product deleted successfully
    } catch (err) {
      console.error("Delete Error:", err);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const getInventoryCategoryBadge = (cat) => {
    const c = String(cat || "").toLowerCase();
    if (c.includes("hair") || c.includes("shampoo") || c.includes("conditioner") || c.includes("oil")) {
      return "bg-sky-100 text-sky-800 border-sky-300";
    }
    if (c.includes("color") || c.includes("dye") || c.includes("bleach")) {
      return "bg-purple-100 text-purple-800 border-purple-300";
    }
    if (c.includes("skin") || c.includes("facial") || c.includes("cream") || c.includes("lotion") || c.includes("glow")) {
      return "bg-emerald-100 text-emerald-800 border-emerald-300";
    }
    if (c.includes("nail") || c.includes("polish") || c.includes("manicure")) {
      return "bg-pink-100 text-pink-800 border-pink-300";
    }
    if (c.includes("tool") || c.includes("scissor") || c.includes("clipper") || c.includes("blade")) {
      return "bg-indigo-100 text-indigo-800 border-indigo-300";
    }
    return "bg-blue-100 text-blue-800 border-blue-300";
  };

  const getStatusBadge = (status) => {
    const s = String(status || "in_stock").toLowerCase();
    if (s === "out_of_stock") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-800 shadow-2xs whitespace-nowrap shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
          Out of Stock
        </span>
      );
    }
    if (s === "low_stock") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-900 shadow-2xs whitespace-nowrap shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
          Low Stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 shadow-2xs whitespace-nowrap shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
        In Stock
      </span>
    );
  };

  const getStockTrend = (current, min) => {
    // Handle undefined or null values
    if (current == null || min == null) {
      return {
        icon: TrendingDown,
        color: "text-gray-500",
        text: "Unknown",
      };
    }

    if (current === 0)
      return {
        icon: TrendingDown,
        color: "text-red-500",
        text: "Out of Stock",
      };
    if (current <= min)
      return {
        icon: TrendingDown,
        color: "text-yellow-500",
        text: "Low Stock",
      };
    return { icon: TrendingUp, color: "text-green-500", text: "Good Stock" };
  };

  const filteredInventory =
    products?.filter((item) => {
      if (!item) return false;
      const matchesSearch =
        !searchTerm ||
        String(item?.productName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item?.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item?.supplier || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || String(item?.status || "").toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    }) || [];

  const formatCurrency = (amount) => {
    if (amount == null || isNaN(amount)) {
      return "₹0.00";
    }
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const totalItems = products?.length || 0;
  const lowStockItems =
    products?.filter((item) => item && item.status === "low_stock").length || 0;
  const outOfStockItems =
    products?.filter((item) => item && item.status === "out_of_stock").length ||
    0;
  const totalValue =
    products?.reduce((sum, item) => {
      if (
        !item ||
        typeof item.currentStock !== "number" ||
        typeof item.amount !== "number"
      ) {
        return sum;
      }
      return sum + item.currentStock * item.amount;
    }, 0) || 0;

  const ScissorsLoader = ({ text = "Loading..." }) => {
    return (
      <div className="flex h-80 flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="animate-pulse">
            <Scissors className="h-16 w-16 animate-bounce text-blue-600" />
          </div>
          <div className="absolute -right-2 -top-2 h-4 w-4 animate-ping rounded-full bg-blue-300"></div>
          <div
            className="absolute -bottom-2 -left-2 h-3.5 w-3.5 animate-ping rounded-full bg-blue-400"
            style={{ animationDelay: "0.5s" }}
          ></div>
        </div>

        <div className="text-center">
          <p className="animate-pulse text-lg font-semibold text-slate-800">
            {text}
          </p>
          <div className="mt-3 flex items-center justify-center space-x-1.5">
            <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500" style={{ animationDelay: "0ms" }}></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500" style={{ animationDelay: "150ms" }}></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500" style={{ animationDelay: "300ms" }}></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="poppins-regular space-y-4 sm:space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Inventory Management
          </h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Track stock levels, thresholds, and valuation across all items
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="h-9 gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Inventory Summary - Compact Tinted KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="rounded-xl border border-blue-200/90 bg-gradient-to-br from-blue-50/90 via-white to-blue-50/30 p-2 sm:p-2.5 shadow-2xs">
          <div className="flex items-center justify-between gap-1 mb-1">
            <p className="text-[10px] sm:text-xs font-semibold text-blue-700 truncate">Total Items</p>
            <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md bg-blue-600 text-white shadow-2xs shrink-0">
              <Package className="h-3 w-3" />
            </div>
          </div>
          <p className="text-sm sm:text-base font-black tracking-tight text-blue-950 truncate">{totalItems}</p>
        </div>

        <div className="rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50/90 via-white to-amber-50/30 p-2 sm:p-2.5 shadow-2xs">
          <div className="flex items-center justify-between gap-1 mb-1">
            <p className="text-[10px] sm:text-xs font-semibold text-amber-800 truncate">Low Stock</p>
            <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md bg-amber-500 text-white shadow-2xs shrink-0">
              <AlertTriangle className="h-3 w-3" />
            </div>
          </div>
          <p className="text-sm sm:text-base font-black tracking-tight text-amber-950 truncate">{lowStockItems}</p>
        </div>

        <div className="rounded-xl border border-rose-200/90 bg-gradient-to-br from-rose-50/90 via-white to-rose-50/30 p-2 sm:p-2.5 shadow-2xs">
          <div className="flex items-center justify-between gap-1 mb-1">
            <p className="text-[10px] sm:text-xs font-semibold text-rose-800 truncate">Out of Stock</p>
            <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md bg-rose-600 text-white shadow-2xs shrink-0">
              <AlertTriangle className="h-3 w-3" />
            </div>
          </div>
          <p className="text-sm sm:text-base font-black tracking-tight text-rose-950 truncate">{outOfStockItems}</p>
        </div>

        <div className="rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/30 p-2 sm:p-2.5 shadow-2xs">
          <div className="flex items-center justify-between gap-1 mb-1">
            <p className="text-[10px] sm:text-xs font-semibold text-emerald-800 truncate">Total Value</p>
            <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md bg-emerald-600 text-white shadow-2xs shrink-0">
              <CheckCircle className="h-3 w-3" />
            </div>
          </div>
          <p className="text-xs sm:text-sm font-black tracking-tight text-emerald-950 truncate">{formatCurrency(totalValue)}</p>
        </div>
      </div>

      {/* Symmetrical Search & Controls Bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar - Full Width on Mobile, max-w-md on Desktop */}
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search items, category, supplier..."
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

        {/* Row 2 on mobile: Status Filter (50%) + View Toggle (50%) */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2">
          {/* Status Filter */}
          <div className="w-full sm:w-44">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 rounded-xl border-slate-200 bg-white text-xs shadow-xs w-full">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status ({products?.length || 0})</SelectItem>
                <SelectItem value="in_stock">In Stock ({products?.filter((i) => i && i.status === "in_stock").length || 0})</SelectItem>
                <SelectItem value="low_stock">Low Stock ({lowStockItems})</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock ({outOfStockItems})</SelectItem>
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

            {isLoading ? (
        <div className="flex justify-center py-12">
          <ScissorsLoader text="Loading Inventory..." />
        </div>
      ) : (
        <>
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
            {/* DESKTOP TABLE (hidden sm:block): Full 8-Column Data Table */}
            <div className="hidden sm:block rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
              <TableComponent>
                <TableHeader className="bg-slate-50/75">
                  <TableRow className="border-b border-slate-200/80">
                    <TableHead className="text-xs font-semibold text-slate-600">Product Name</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Category</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Current Stock</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Min / Max</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Unit Price</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Supplier</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-slate-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => {
                    const stockTrend = getStockTrend(item.currentStock, item.minStock);
                    const TrendIcon = stockTrend.icon;
                    const isOut = item.status === "out_of_stock";
                    const isLow = item.status === "low_stock";
                    const statusBorder = isOut
                      ? "border-l-4 border-l-rose-500"
                      : isLow
                      ? "border-l-4 border-l-amber-500"
                      : "border-l-4 border-l-emerald-500";

                    return (
                      <TableRow key={item.id || item.productId} className={`hover:bg-slate-50/75 transition-colors border-b border-slate-100 ${statusBorder}`}>
                        <TableCell className={`font-bold text-slate-900 text-xs sm:text-sm border-l-4 ${statusBorder}`}>
                          {item.productName}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs ${getInventoryCategoryBadge(item.category)}`}>
                            {item.category || "General"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs sm:text-sm">
                            <TrendIcon className={`h-3.5 w-3.5 ${stockTrend.color}`} />
                            <span>{item.currentStock ?? 0}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 font-medium">
                          <div>Min: {item.minStock ?? 0} • Max: {item.maxStock ?? "—"}</div>
                        </TableCell>
                        <TableCell>
                          <span className="font-extrabold text-blue-700 text-xs sm:text-sm bg-blue-50/90 border border-blue-200/90 px-2 py-0.5 rounded-lg shadow-2xs">
                            {formatCurrency(item.amount)}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 font-medium">
                          {item.supplier || "—"}
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 rounded-lg p-0 text-slate-500 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                              onClick={() => handleEditClick(item)}
                              title="Edit product"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 rounded-lg p-0 text-slate-500 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                              onClick={() => {
                                setSelectedProduct(item);
                                setOpen(true);
                              }}
                              title="Delete product"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
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
              {filteredInventory.map((item) => {
                const isOut = item.status === "out_of_stock";
                const isLow = item.status === "low_stock";
                const statusBorder = isOut
                  ? "border-l-4 border-l-rose-500"
                  : isLow
                  ? "border-l-4 border-l-amber-500"
                  : "border-l-4 border-l-emerald-500";

                return (
                  <div
                    key={item.id || item.productId}
                    className={`p-2 sm:p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50/80 transition-colors ${statusBorder}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm capitalize truncate max-w-[160px]">
                          {item.productName}
                        </h4>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border shrink-0 ${getInventoryCategoryBadge(item.category)}`}>
                          {item.category || "General"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span className="font-bold text-slate-800">Stock: {item.currentStock ?? 0}</span>
                        <span>•</span>
                        <span className="font-extrabold text-blue-700 bg-blue-50/90 border border-blue-200/90 px-1.5 py-0.2 rounded text-[10px]">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {getStatusBadge(item.status)}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 rounded-lg p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                        onClick={() => handleEditClick(item)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 rounded-lg p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        onClick={() => {
                          setSelectedProduct(item);
                          setOpen(true);
                        }}
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
              {filteredInventory.map((item) => {
                const stockTrend = getStockTrend(
                  item.currentStock,
                  item.minStock,
                );
                const TrendIcon = stockTrend.icon;
                const isOut = item.status === "out_of_stock";
                const isLow = item.status === "low_stock";
                const statusBorder = isOut
                  ? "border-l-4 border-l-rose-500"
                  : isLow
                  ? "border-l-4 border-l-amber-500"
                  : "border-l-4 border-l-emerald-500";

                return (
                  <Card
                    key={item.id || item.productId}
                    className={`group relative rounded-xl border border-slate-200/90 bg-white p-2.5 sm:p-3 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer border-l-4 ${statusBorder}`}
                  >
                    {/* Top Row: Title + Category on left, Status Badge on right */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3
                            className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors capitalize"
                            title={item.productName}
                          >
                            {item.productName}
                          </h3>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border truncate shadow-2xs ${getInventoryCategoryBadge(item.category)}`}>
                            {item.category || "General"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {item.supplier ? `by ${item.supplier}` : "General Inventory"}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {getStatusBadge(item.status)}
                      </div>
                    </div>

                    {/* Bottom Row: Inline Stock info on left, Price & Actions on right */}
                    <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 border border-slate-200/80 px-2 py-0.5 font-semibold text-slate-700">
                          <span className="text-[10px] text-slate-400">Stock:</span>
                          <span className="font-bold text-slate-900">{item.currentStock ?? 0}</span>
                          <TrendIcon className={`h-3 w-3 ${stockTrend.color}`} />
                        </span>
                        <span className="text-[10px] text-slate-400 hidden xs:inline">
                          Min: {item.minStock ?? 0}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs sm:text-sm font-black text-blue-700 tracking-tight bg-blue-50/90 border border-blue-200/90 px-2 py-0.5 rounded-lg shadow-2xs">
                          {formatCurrency(item.amount)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg p-0 text-slate-400 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(item);
                          }}
                          title="Edit product"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg p-0 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProduct(item);
                            setOpen(true);
                          }}
                          title="Delete product"
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
        </>
      )}

            {filteredInventory.length === 0 && (
        <div className="py-12 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <h3 className="mb-1 text-sm font-medium text-slate-700">
            No inventory items found
          </h3>
          <p className="text-xs text-slate-400">Try adjusting your search or status filter</p>
        </div>
      )}
      {/* Create Product Dialog */}
      <Dialog
        open={isCreateModalOpen}
        onOpenChange={(open) => {
          setIsCreateModalOpen(open);
          if (!open) {
            resetForm();
          }
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] sm:w-full sm:max-w-xl max-h-[85vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">Add New Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-1">
            {/* Product Name + Category */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name *</Label>
                <Input
                  id="productName"
                  name="productName"
                  value={formData.productName}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="Enter category"
                  required
                />
              </div>
            </div>

            {/* Stock Fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="currentStock">Current Stock</Label>
                <Input
                  id="currentStock"
                  name="currentStock"
                  type="number"
                  value={formData.currentStock}
                  onChange={handleInputChange}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">Min Stock</Label>
                <Input
                  id="minStock"
                  name="minStock"
                  type="number"
                  value={formData.minStock}
                  onChange={handleInputChange}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxStock">Max Stock</Label>
                <Input
                  id="maxStock"
                  name="maxStock"
                  type="number"
                  value={formData.maxStock}
                  onChange={handleInputChange}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Amount */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Supplier + Status */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Select
                  value={formData.supplier}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, supplier: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors && vendors.length > 0 ? (
                      vendors.map((vendor) => (
                        <SelectItem
                          key={vendor.id || vendor.vendorId}
                          value={vendor.name}
                        >
                          {vendor.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-vendors" disabled>
                        No vendors available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    <SelectItem value="discontinued">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Add Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog
        open={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) {
            resetForm();
          }
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] sm:w-full sm:max-w-xl max-h-[85vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">Edit Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit} className="space-y-4 pt-1">
            {/* Product Name + Category */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-productName">Product Name *</Label>
                <Input
                  id="edit-productName"
                  name="productName"
                  value={formData.productName}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category *</Label>
                <Input
                  id="edit-category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="Enter category"
                  required
                />
              </div>
            </div>

            {/* Stock Fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="edit-currentStock">Current Stock</Label>
                <Input
                  id="edit-currentStock"
                  name="currentStock"
                  type="number"
                  value={formData.currentStock}
                  onChange={handleInputChange}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-minStock">Min Stock</Label>
                <Input
                  id="edit-minStock"
                  name="minStock"
                  type="number"
                  value={formData.minStock}
                  onChange={handleInputChange}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-maxStock">Max Stock</Label>
                <Input
                  id="edit-maxStock"
                  name="maxStock"
                  type="number"
                  value={formData.maxStock}
                  onChange={handleInputChange}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Amount */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Amount</Label>
                <Input
                  id="edit-amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Supplier + Status */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-supplier">Supplier</Label>
                <Select
                  value={formData.supplier}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, supplier: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors && vendors.length > 0 ? (
                      vendors.map((vendor) => (
                        <SelectItem
                          key={vendor.id || vendor.vendorId}
                          value={vendor.name}
                        >
                          {vendor.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-vendors" disabled>
                        No vendors available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    <SelectItem value="discontinued">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold"
                disabled={isLoading}
              >
                {isLoading ? "Updating..." : "Update Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-sm p-4 sm:p-5 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete Product
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-gray-600">
            Are you sure you want to delete{" "}
            <b>{selectedProduct?.productName}</b>? This action cannot be undone.
          </p>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryPage;
