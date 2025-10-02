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
import { set } from "date-fns";

const InventoryPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "table", "grid"
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
  // Fetch products and vendors on mount
  useEffect(() => {
    fetchProducts();
    if (adminGetVendors) {
      adminGetVendors();
    }
  }, []);

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
        institutionId: institutionData.institutionid,
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
      await fetchProducts(institutionData.institutionid);
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
        institutionData.institutionid,
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
        institutionData.institutionid,
        selectedProduct.productId,
      );
      await fetchProducts();
      // Product deleted successfully
    } catch (err) {
      console.error("Delete Error:", err);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      in_stock: {
        variant: "default",
        className: "bg-green-100 text-green-800",
        icon: CheckCircle,
      },
      low_stock: {
        variant: "secondary",
        className: "bg-yellow-100 text-yellow-800",
        icon: AlertTriangle,
      },
      out_of_stock: {
        variant: "destructive",
        className: "bg-red-100 text-red-800",
        icon: AlertTriangle,
      },
    };
    const config = statusConfig[status] || statusConfig.in_stock;
    const Icon = config.icon;
    return (
      <Badge
        variant={config.variant}
        className={`${config.className} flex items-center gap-1`}
      >
        <Icon className="h-3 w-3" />
        {status.replace("_", " ").toUpperCase()}
      </Badge>
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
    products?.filter(
      (item) =>
        item &&
        (item?.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item?.category?.toLowerCase().includes(searchTerm.toLowerCase())),
      // ||
      // item.sku.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

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
          {/* Bigger Icon + Bounce */}
          <div className="animate-pulse">
            <Scissors className="h-24 w-24 animate-bounce text-stone-700" />
          </div>

          {/* Bigger Ping Animations */}
          <div className="absolute -right-3 -top-3 h-6 w-6 animate-ping rounded-full bg-stone-400"></div>
          <div
            className="absolute -bottom-3 -left-3 h-5 w-5 animate-ping rounded-full bg-stone-500"
            style={{ animationDelay: "0.5s" }}
          ></div>
        </div>

        {/* Text + Dots */}
        <div className="text-center">
          <p className="animate-pulse text-2xl font-semibold text-stone-800">
            {text}
          </p>
          <div className="mt-3 flex items-center justify-center space-x-2">
            <div
              className="h-3 w-3 animate-bounce rounded-full bg-stone-500"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="h-3 w-3 animate-bounce rounded-full bg-stone-500"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="h-3 w-3 animate-bounce rounded-full bg-stone-500"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="poppins-regular space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">
            Inventory Management
          </h1>
          <p className="text-stone-600">
            Track and manage your salon inventory
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-stone-600 text-white hover:bg-stone-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Inventory Summary - Compact */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-stone-600">
                  Total Items
                </p>
                <p className="text-lg font-bold text-stone-800">{totalItems}</p>
              </div>
              <Package className="h-5 w-5 text-stone-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-stone-600">Low Stock</p>
                <p className="text-lg font-bold text-yellow-600">
                  {lowStockItems}
                </p>
              </div>
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-stone-600">
                  Out of Stock
                </p>
                <p className="text-lg font-bold text-red-600">
                  {outOfStockItems}
                </p>
              </div>
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-stone-600">
                  Total Value
                </p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(totalValue)}
                </p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search, Stats, and View Toggle */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-stone-400" />
          <Input
            placeholder="Search inventory by name, category, or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-stone-200 pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            In Stock:{" "}
            {products?.filter((i) => i && i.status === "in_stock").length || 0}
          </Badge>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Low Stock: {lowStockItems}
          </Badge>
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            Out of Stock: {outOfStockItems}
          </Badge>
        </div>
        <div className="flex gap-1 rounded-lg border border-stone-200 p-1">
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

      {isLoading ? (
        <div className="flex justify-center py-12">
          <ScissorsLoader text="Loading Services..." />
        </div>
      ) : (
        <>
          {/* Dynamic View Based on Selection */}
          {viewMode === "table" && (
            <Card className="border-stone-200">
              <CardHeader>
                <CardTitle className="text-stone-800">
                  Inventory Items - Table View
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TableComponent>
                  <TableHeader>
                    <TableRow>
                      {/* <TableHead className="text-stone-600">Item</TableHead> */}
                      <TableHead className="text-stone-600">Name</TableHead>
                      <TableHead className="text-stone-600">Category</TableHead>
                      <TableHead className="text-stone-600">
                        Current Stock
                      </TableHead>
                      <TableHead className="text-stone-600">Min/Max</TableHead>
                      <TableHead className="text-stone-600">
                        Unit Price
                      </TableHead>
                      <TableHead className="text-stone-600">Supplier</TableHead>
                      {/* <TableHead className="text-stone-600">
                    Last Restocked
                  </TableHead> */}
                      <TableHead className="text-stone-600">Status</TableHead>
                      <TableHead className="text-stone-600">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.map((item) => {
                      const stockTrend = getStockTrend(
                        item.currentStock,
                        item.minStock,
                      );
                      const TrendIcon = stockTrend.icon;

                      return (
                        <TableRow key={item.id} className="hover:bg-stone-50">
                          {/* <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-200">
                            <Package className="h-4 w-4 text-stone-600" />
                          </div>
                          <div>
                            <div className="font-medium text-stone-800">
                              {item.name}
                            </div>
                            <div className="text-sm text-stone-500">
                              SKU: {item.sku}
                            </div>
                          </div>
                        </div>
                      </TableCell> */}
                          <TableCell>{item.productName}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="border-stone-200 text-stone-600"
                            >
                              {item.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <TrendIcon
                                className={`h-4 w-4 ${stockTrend.color}`}
                              />
                              <span className="font-medium text-stone-800">
                                {item.currentStock}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-stone-600">
                              <div>Min: {item.minStock}</div>
                              <div>Max: {item.maxStock}</div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-stone-800">
                            {formatCurrency(item.amount)}
                          </TableCell>
                          <TableCell className="text-stone-800">
                            {item.supplier}
                          </TableCell>
                          {/* <TableCell className="text-stone-600">
                        {item.lastRestocked}
                      </TableCell> */}
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {/* Edit Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-stone-100"
                                onClick={() => handleEditClick(item)}
                              >
                                <Edit className="h-3 w-3 text-stone-600" />
                              </Button>

                              {/* Stock Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-green-100"
                                onClick={() =>
                                  console.log(
                                    "Stock button clicked for:",
                                    item.productName,
                                  )
                                }
                              >
                                <Package className="h-3 w-3 text-green-600" />
                              </Button>

                              {/* Delete Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-red-100"
                                onClick={() => {
                                  setSelectedProduct(item);
                                  setOpen(true);
                                }}
                              >
                                <Trash2 className="h-3 w-3 text-red-600" />
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
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredInventory.map((item) => {
                const stockTrend = getStockTrend(
                  item.currentStock,
                  item.minStock,
                );
                const TrendIcon = stockTrend.icon;

                return (
                  <Card
                    key={item.id}
                    className="border-stone-200 transition-shadow hover:shadow-md"
                  >
                    <CardContent className="p-3">
                      {/* Header */}
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-stone-800">
                            {item.productName}
                          </h3>
                          {/* <span className="text-xs text-stone-500">•</span>
                      <span className="text-xs text-stone-600">{item.sku}</span> */}
                        </div>
                        {getStatusBadge(item.status)}
                      </div>

                      {/* Main Info Grid */}
                      <div className="mb-2 grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3 text-stone-500" />
                          <span className="text-stone-800">
                            {item.currentStock} units
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendIcon
                            className={`h-3 w-3 ${stockTrend.color}`}
                          />
                          <span
                            className={`text-stone-800 ${stockTrend.color}`}
                          >
                            {stockTrend.text}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-stone-500">Min:</span>
                          <span className="text-stone-800">
                            {item.minStock}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-stone-500">Max:</span>
                          <span className="text-stone-800">
                            {item.maxStock}
                          </span>
                        </div>
                      </div>

                      {/* Category */}
                      <div className="mb-2">
                        <Badge
                          variant="outline"
                          className="h-5 border-stone-200 px-1 py-0 text-xs text-stone-600"
                        >
                          {item.category}
                        </Badge>
                      </div>

                      {/* Financial Details */}
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <div className="text-stone-600">
                          Price: {formatCurrency(item.amount)}
                        </div>
                        <div className="font-semibold text-stone-800">
                          Value:{" "}
                          {formatCurrency(item.currentStock * item.amount)}
                        </div>
                      </div>

                      {/* Supplier Info */}
                      <div className="mb-2 text-xs text-stone-500">
                        Supplier: {item.supplier}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between border-t border-stone-100 pt-1">
                        <div className="text-xs text-stone-500">
                          Last: {item.lastRestocked}
                        </div>
                        <div className="flex gap-1">
                          {/* Edit Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-stone-100"
                            onClick={() => handleEditClick(item)} // Pass current product
                          >
                            <Edit className="h-3 w-3 text-stone-600" />
                          </Button>

                          {/* Stock Button (Optional future feature) */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-green-100"
                            onClick={() =>
                              console.log(
                                "Stock button clicked for:",
                                item.productName,
                              )
                            }
                          >
                            <Package className="h-3 w-3 text-green-600" />
                          </Button>

                          {/* Delete Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-red-100"
                            onClick={() => {
                              setSelectedProduct(item);
                              setOpen(true);
                            }} // Pass current product
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
        </>
      )}

      {filteredInventory.length === 0 && (
        <div className="py-12 text-center">
          <Package className="mx-auto mb-4 h-12 w-12 text-stone-300" />
          <h3 className="mb-2 text-lg font-medium text-stone-600">
            No inventory items found
          </h3>
          <p className="text-stone-500">Try adjusting your search criteria</p>
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-6">
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
                className="bg-stone-700 hover:bg-stone-800"
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit} className="space-y-6">
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
                className="bg-stone-700 hover:bg-stone-800"
                disabled={isLoading}
              >
                {isLoading ? "Updating..." : "Update Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
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
