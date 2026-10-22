import React, { useState, useEffect } from "react";
import { UserCheck, Plus, Search, Edit, Trash2, Phone, Mail, Calendar, Star, ChevronDown, X, Scissors, AlertCircle, Grid3X3, List } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { useToast } from "../hooks/use-toast";
import Context from "../Context/Context";

// Custom Scissors Loader Component
const ScissorsLoader = ({ text = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <div className="relative">
        <div className="animate-pulse">
          <Scissors className="h-16 w-16 text-slate-600 animate-bounce" />
        </div>
        <div className="absolute -top-2 -right-2 h-4 w-4 bg-blue-100 rounded-full animate-ping"></div>
        <div className="absolute -bottom-2 -left-2 h-3 w-3 bg-blue-300 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
      </div>
      <div className="text-center">
        <p className="text-lg font-medium text-slate-700 animate-pulse">{text}</p>
        <div className="flex items-center justify-center mt-2 space-x-1">
          <div className="h-2 w-2 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="h-2 w-2 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="h-2 w-2 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

// Custom Multi-Select Dropdown Component
const MultiSelectDropdown = ({ options, selectedValues, onChange, placeholder = "Select options", disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = React.useRef(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggle = (value) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  const handleRemove = (value) => {
    const newValues = selectedValues.filter(v => v !== value);
    onChange(newValues);
  };

  const handleSelectAll = () => {
    onChange([...options]);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const selectedCount = selectedValues.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`w-full p-2 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-slate-300'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-disabled={disabled}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedCount === 0 ? (
              <span className="text-slate-500">{placeholder}</span>
            ) : (
              selectedValues.map((value) => (
                <span
                  key={value}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm"
                >
                  {value}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!disabled) handleRemove(value);
                    }}
                  />
                </span>
              ))
            )}
          </div>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-slate-200">
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-slate-200 text-sm"
            />
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs h-7 px-2"
              >
                Select All
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="text-xs h-7 px-2"
              >
                Clear All
              </Button>
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-sm text-slate-500 text-center">No services found</div>
            ) : (
              filteredOptions.map((option) => (
                <label
                  key={option}
                  className="flex items-center p-2 hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option)}
                    onChange={() => handleToggle(option)}
                    className="mr-3 h-4 w-4 text-slate-600 focus:ring-blue-500 border-slate-300 rounded"
                  />
                  <span className="text-sm text-slate-700">{option}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Client Form Component
const ClientForm = ({ client, services, onSubmit, onClose, isOpen, isLoading = false }) => {
  const { toast } = useToast();  // Predefined services for now - will be replaced with API later

  const predefinedServices = services.map(s => s.serviceName || s.name || s.ServiceName || s.Name).filter(Boolean);

  // Helper function to convert epoch to date string for input
  const epochToDateString = (epoch) => {
    if (!epoch) return "";
    if (typeof epoch === 'string' && epoch.includes('T')) {
      // Already in ISO format
      return epoch.split('T')[0];
    }
    if (typeof epoch === 'number') {
      // Convert epoch to date string
      return new Date(epoch * 1000).toISOString().split('T')[0];
    }
    return "";
  };

  const [formData, setFormData] = useState({
    clientName: "",
    phoneNumber: "",
    emailId: "",
    preferredServices: [],
    notes: "",
    totalVisits: 0,
    lastVisit: "",
    loyaltyPoints: 0,
    status: 'active',
  });

  const [errors, setErrors] = useState({});

  // Validation functions
  const validateName = (name) => {
    if (!name || name.trim().length === 0) {
      return "Client name is required";
    }
    if (name.trim().length < 2) {
      return "Client name must be at least 2 characters long";
    }
    if (name.trim().length > 50) {
      return "Client name must be less than 50 characters";
    }
    if (!/^[a-zA-Z\s.'-]+$/.test(name.trim())) {
      return "Client name can only contain letters, spaces, periods, apostrophes, and hyphens";
    }
    return "";
  };

  const validatePhoneNumber = (phone) => {
    if (!phone || phone.trim().length === 0) {
      return "Phone number is required";
    }
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return "Please enter a valid phone number";
    }
    if (cleanPhone.length < 10) {
      return "Phone number must be at least 10 digits";
    }
    return "";
  };

  const validateEmail = (email) => {
    if (email && email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return "Please enter a valid email address";
      }
      if (email.trim().length > 100) {
        return "Email address must be less than 100 characters";
      }
    }
    return "";
  };

  const validateVisits = (visits) => {
    if (visits !== null && visits !== undefined && visits !== '') {
      const numVisits = parseInt(visits);
      if (isNaN(numVisits) || numVisits < 0) {
        return "Total visits must be a non-negative number";
      }
      if (numVisits > 10000) {
        return "Total visits seems too high (maximum 10,000)";
      }
    }
    return "";
  };

  const validateLoyaltyPoints = (points) => {
    if (points !== null && points !== undefined && points !== '') {
      const numPoints = parseInt(points);
      if (isNaN(numPoints) || numPoints < 0) {
        return "Loyalty points must be a non-negative number";
      }
      if (numPoints > 100000) {
        return "Loyalty points seems too high (maximum 100,000)";
      }
    }
    return "";
  };

  const validateForm = () => {
    const newErrors = {};
    
    newErrors.clientName = validateName(formData.clientName);
    newErrors.phoneNumber = validatePhoneNumber(formData.phoneNumber);
    newErrors.emailId = validateEmail(formData.emailId);
    newErrors.totalVisits = validateVisits(formData.totalVisits);
    newErrors.loyaltyPoints = validateLoyaltyPoints(formData.loyaltyPoints);

    // Remove empty error messages
    Object.keys(newErrors).forEach(key => {
      if (!newErrors[key]) {
        delete newErrors[key];
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Set default values for new clients or update form data when editing
  React.useEffect(() => {
    if (isOpen) {
      if (client) {
        // Editing existing client - populate form with client data
        setFormData({
          clientName: client?.clientName || client?.ClientName || client?.name || "",
          phoneNumber: client?.phoneNumber || client?.PhoneNumber || client?.phone || "",
          emailId: client?.emailId || client?.EmailId || client?.email || "",
          preferredServices: client?.preferredServices || client?.PreferredServices || client?.preferredServices || [],
          notes: client?.notes || "",
          totalVisits: client?.totalVisits || client?.TotalVisits || client?.totalVisits || 0,
          lastVisit: epochToDateString(client?.lastVisit || client?.LastVisit || client?.lastVisit) || "",
          loyaltyPoints: client?.loyaltyPoints || client?.LoyaltyPoints || client?.loyaltyPoints || 0,
          status: client?.status || 'active',
        });
      } else {
        // Adding new client - set default values
        setFormData({
          clientName: "",
          phoneNumber: "",
          emailId: "",
          preferredServices: [],
          notes: "",
          totalVisits: 0,
          lastVisit: new Date().toISOString().split('T')[0], // Today's date
          loyaltyPoints: 0,
          status: 'active',
        });
      }
      // Clear any existing errors when modal opens
      setErrors({});
    }
  }, [client, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isLoading) return; // Prevent double submission
    
    // Validate form
    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
      });
      return;
    }
    
    // Convert lastVisit to epoch format if it exists
    const processedData = {
      ...formData,
      lastVisit: formData.lastVisit ? Math.floor(new Date(formData.lastVisit).getTime() / 1000) : null
    };
    
    onSubmit(processedData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    if (name === 'totalVisits' || name === 'loyaltyPoints') {
      processedValue = parseInt(value) || 0;
    } else if (name === 'lastVisit' && value) {
      // Store the date as-is for display, will convert to epoch on submit
      processedValue = value;
    }
    
    setFormData({
      ...formData,
      [name]: processedValue,
    });

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (value, fieldName) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      clientName: "",
      phoneNumber: "",
      emailId: "",
      preferredServices: [],
      notes: "",
      totalVisits: 0,
      lastVisit: new Date().toISOString().split('T')[0],
      loyaltyPoints: 0,
      status: 'active',
    });
    setErrors({});
  };

  const handleModalChange = (open) => {
    if (!open) {
      resetForm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { handleModalChange(open); if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            {client ? "Edit Client" : "Add New Client"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                required
                placeholder="Enter client name"
                disabled={isLoading}
                className={errors.clientName ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
              />
              {errors.clientName && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.clientName}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                placeholder="Enter phone number"
                disabled={isLoading}
                className={errors.phoneNumber ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
              />
              {errors.phoneNumber && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.phoneNumber}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emailId">Email ID</Label>
              <Input
                id="emailId"
                name="emailId"
                type="email"
                value={formData.emailId}
                onChange={handleChange}
                placeholder="Enter email address (optional)"
                disabled={isLoading}
                className={errors.emailId ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
              />
              {errors.emailId && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.emailId}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleSelectChange(value, "status")} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalVisits">Total Visits</Label>
              <Input
                id="totalVisits"
                name="totalVisits"
                type="number"
                value={formData.totalVisits}
                onChange={handleChange}
                placeholder="0"
                min="0"
                disabled={isLoading}
                className={errors.totalVisits ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
              />
              {errors.totalVisits && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.totalVisits}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastVisit">Last Visit Date</Label>
              <Input
                id="lastVisit"
                name="lastVisit"
                type="date"
                value={formData.lastVisit ? (formData.lastVisit.includes('T') ? formData.lastVisit.split('T')[0] : formData.lastVisit) : ''}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loyaltyPoints">Loyalty Points</Label>
              <Input
                id="loyaltyPoints"
                name="loyaltyPoints"
                type="number"
                value={formData.loyaltyPoints}
                onChange={handleChange}
                placeholder="0"
                min="0"
                disabled={isLoading}
                className={errors.loyaltyPoints ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
              />
              {errors.loyaltyPoints && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.loyaltyPoints}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Preferred Services</Label>
            <MultiSelectDropdown
              options={predefinedServices}
              selectedValues={Array.isArray(formData.preferredServices) ? formData.preferredServices : []}
              onChange={(selectedServices) => {
                setFormData({
                  ...formData,
                  preferredServices: selectedServices
                });
              }}
              placeholder="Select preferred services"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">Select multiple services (searchable)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Additional notes about the client..."
              className="resize-none"
              disabled={isLoading}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onClose(); }} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="button" variant="secondary" onClick={resetForm} disabled={isLoading}>
              Clear
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  {client ? 'Updating...' : 'Adding...'}
                </div>
              ) : (
                client ? "Update Client" : "Add Client"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Delete Confirmation Dialog Component
const DeleteConfirmDialog = ({ clientId, onConfirm, onCancel, isOpen, isLoading = false }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">Delete Client</DialogTitle>
              <DialogDescription className="text-sm text-slate-600">
                This action cannot be undone
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-slate-700">
            Are you sure you want to delete this client? This will permanently remove their information from the system.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={() => onConfirm(clientId)}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Deleting...
              </div>
            ) : (
              'Delete Client'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ClientsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  
  const { toast } = useToast();
  
  const { 
    clients, 
    fetchClients, 
    createClient, 
    updateClient, 
    deleteClient,
    services,
    loader 
  } = React.useContext(Context);

  // Debug clients data
  useEffect(() => {
    console.log("Clients data received:", clients);
  }, [clients]);


  // Helper function to format last visit date
  const formatLastVisit = (lastVisit) => {
    if (!lastVisit) return 'Never';
    
    if (typeof lastVisit === 'string' && lastVisit.includes('T')) {
      // ISO format
      return new Date(lastVisit).toLocaleDateString();
    }
    
    if (typeof lastVisit === 'number') {
      // Epoch format
      return new Date(lastVisit * 1000).toLocaleDateString();
    }
    
    return 'Never';
  };

  const getClientStatus = (client) => {
    // Determine status based on client data
    if (client.status) {
      return client.status;
    }
    
    // If no status field, determine based on other data
    const totalVisits = client.totalVisits || client.TotalVisits || client.totalVisits || 0;
    const loyaltyPoints = client.loyaltyPoints || client.LoyaltyPoints || client.loyaltyPoints || 0;
    
    if (totalVisits >= 10 || loyaltyPoints >= 100) {
      return 'vip';
    } else if (totalVisits > 0) {
      return 'active';
    } else {
      return 'inactive';
    }
  };

  const getStatusBadge = (client) => {
    const statusConfig = {
      active: { variant: "default", className: "bg-green-100 text-green-800" },
      inactive: { variant: "secondary", className: "bg-gray-100 text-gray-800" },
      vip: { variant: "default", className: "bg-purple-100 text-purple-800" },
    };
    
    const clientStatus = getClientStatus(client);
    const config = statusConfig[clientStatus] || statusConfig.active;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {clientStatus.toUpperCase()}
      </Badge>
    );
  };

  const filteredClients = (clients || []).filter(client =>
    (client.clientName || client.ClientName || client.name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.phoneNumber || client.PhoneNumber || client.phone)?.includes(searchTerm) ||
    (client.emailId || client.EmailId || client.email)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddClient = () => {
    setShowAddForm(true);
    setEditingClient(null);
  };

  const handleEditClient = (client) => {
    setEditingClient(client);
    setShowAddForm(true);
  };

  const handleCreateClient = async (clientData) => {
    if (isCreating) return;
    
    try {
      setIsCreating(true);
      await createClient(clientData);
      await fetchClients(); // Ensure clients are fetched after creation
      setShowAddForm(false);
      setEditingClient(null);
      // Refresh the client list
      await fetchClients();
      
      toast({
        variant: "success",
        title: "Success!",
        description: "Client has been added successfully.",
      });
    } catch (error) {
      console.error("Error creating client:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add client. Please try again.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateClient = async (clientData) => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      await updateClient(editingClient.clientId || editingClient.ClientId || editingClient.id, clientData);
      setShowAddForm(false);
      setEditingClient(null);
      // Refresh the client list
      await fetchClients();
      
      toast({
        variant: "success",
        title: "Success!",
        description: "Client has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating client:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update client. Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClient = async (clientId) => {
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
      await deleteClient(clientId);
      setShowDeleteConfirm(null);
      // Refresh the client list
      await fetchClients();
      
      toast({
        variant: "success",
        title: "Success!",
        description: "Client has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting client:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete client. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (clientData) => {
    if (editingClient) {
      await handleUpdateClient(clientData);
    } else {
      await handleCreateClient(clientData);
    }
  };

  return (
    <div className="p-3.5 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 font-sans bg-[#f8fafc] min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Client Directory</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Manage salon clients, contact details, visit history & loyalty rewards</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-all w-full sm:w-auto h-10 px-4 cursor-pointer"
          onClick={handleAddClient}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Search, Stats, and View Mode Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Search clients by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 text-xs sm:text-sm h-10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-bold border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs">
            Total: {loader ? '...' : (clients?.length || 0)}
          </Badge>
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 rounded-xl px-3 py-1.5 text-xs">
            Active: {loader ? '...' : (clients || []).filter(c => getClientStatus(c) === 'active').length}
          </Badge>
          <Badge variant="secondary" className="bg-purple-50 text-purple-700 font-bold border border-purple-200 rounded-xl px-3 py-1.5 text-xs">
            VIP: {loader ? '...' : (clients || []).filter(c => getClientStatus(c) === 'vip').length}
          </Badge>
          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 ml-auto">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              title="Box / Card View (Mobile & Tablet)"
              className={`h-8 w-8 p-0 rounded-lg cursor-pointer ${viewMode === "grid" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              title="Table View"
              className={`h-8 w-8 p-0 rounded-lg cursor-pointer ${viewMode === "table" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Clients Content */}
      {loader ? (
        <div className="flex justify-center py-12">
          <ScissorsLoader text="Loading clients..." />
        </div>
      ) : viewMode === "grid" ? (
        /* Box / Card View for Mobile, Tablet & Responsive Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredClients.map((client) => {
            const clientName = client.clientName || client.ClientName || client.name || "Client";
            const clientId = client.clientId || client.ClientId || client.id;
            const phone = client.phoneNumber || client.PhoneNumber || client.phone || "N/A";
            const email = client.emailId || client.EmailId || client.email;
            const lastVisit = formatLastVisit(client.lastVisit || client.LastVisit || client.lastVisit);
            const totalVisits = client.totalVisits || client.TotalVisits || 0;
            const points = client.loyaltyPoints || client.LoyaltyPoints || 0;
            const preferredServices = client.preferredServices || client.PreferredServices || [];

            return (
              <div
                key={clientId}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all p-4 flex flex-col justify-between gap-3 group relative overflow-hidden"
              >
                {/* Top: Avatar, Name, Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
                      {clientName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-slate-900 truncate">
                        {clientName}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        ID: #{clientId}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(client)}
                </div>

                {/* Details Container */}
                <div className="bg-slate-50/80 rounded-xl p-3 space-y-2 border border-slate-100 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{phone}</span>
                  </div>
                  {email && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{email}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>Last: {lastVisit}</span>
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-amber-600">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                      <span>{points} pts</span>
                    </div>
                  </div>

                  {preferredServices.length > 0 && (
                    <div className="pt-1.5 border-t border-slate-200/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Preferred Services</span>
                      <div className="flex flex-wrap gap-1 max-w-full overflow-hidden">
                        {preferredServices.slice(0, 3).map((srv, idx) => (
                          <Badge key={idx} variant="outline" className="text-[10px] font-medium border-slate-200 text-slate-600 bg-white">
                            {srv}
                          </Badge>
                        ))}
                        {preferredServices.length > 3 && (
                          <Badge variant="outline" className="text-[10px] font-medium border-slate-200 text-slate-500 bg-white">
                            +{preferredServices.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Row: Visits count + Edit/Delete */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                  <span className="text-xs font-semibold text-slate-600">
                    {totalVisits} Total {totalVisits === 1 ? 'Visit' : 'Visits'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 font-semibold rounded-xl text-xs h-8 px-3 cursor-pointer"
                      onClick={() => handleEditClient(client)}
                      disabled={isCreating || isUpdating || isDeleting}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl h-8 w-8 p-0 cursor-pointer"
                      onClick={() => setShowDeleteConfirm(clientId)}
                      disabled={isCreating || isUpdating || isDeleting}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Professional Table View */
        <Card className="border-slate-200/90 rounded-2xl bg-white shadow-2xs overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 border-b border-slate-200/90">
                    <TableHead className="text-slate-700 font-bold text-xs">Client</TableHead>
                    <TableHead className="text-slate-700 font-bold text-xs">Contact</TableHead>
                    <TableHead className="text-slate-700 font-bold text-xs">Last Visit</TableHead>
                    <TableHead className="text-slate-700 font-bold text-xs">Visits</TableHead>
                    <TableHead className="text-slate-700 font-bold text-xs">Loyalty Points</TableHead>
                    <TableHead className="text-slate-700 font-bold text-xs">Status</TableHead>
                    <TableHead className="text-slate-700 font-bold text-xs">Preferred Services</TableHead>
                    <TableHead className="text-slate-700 font-bold text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => {
                    const clientId = client.clientId || client.ClientId || client.id;
                    return (
                      <TableRow key={clientId} className="hover:bg-slate-50/70 border-b border-slate-100 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-100">
                              {(client.clientName || client.ClientName || client.name || "CL").slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-xs sm:text-sm text-slate-900">{client.clientName || client.ClientName || client.name}</div>
                              <div className="text-[11px] text-slate-400">#{clientId}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-xs text-slate-600">
                              <Phone className="h-3 w-3 text-slate-400" />
                              <span>{client.phoneNumber || client.PhoneNumber || client.phone}</span>
                            </div>
                            {(client.emailId || client.EmailId || client.email) && (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                <Mail className="h-3 w-3 text-slate-400" />
                                <span>{client.emailId || client.EmailId || client.email}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs text-slate-700">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>{formatLastVisit(client.lastVisit || client.LastVisit || client.lastVisit)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                            {client.totalVisits || client.TotalVisits || 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 font-bold text-amber-600 text-xs">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span>{client.loyaltyPoints || client.LoyaltyPoints || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(client)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {(client.preferredServices || client.PreferredServices || []).slice(0, 2).map((service, index) => (
                              <Badge key={index} variant="outline" className="text-[10px] border-slate-200 text-slate-600 bg-slate-50">
                                {service}
                              </Badge>
                            ))}
                            {(client.preferredServices || client.PreferredServices || []).length > 2 && (
                              <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-500 bg-slate-50">
                                +{(client.preferredServices || client.PreferredServices || []).length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                              onClick={() => handleEditClient(client)}
                              disabled={isCreating || isUpdating || isDeleting}
                              title="Edit client"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                              onClick={() => setShowDeleteConfirm(clientId)}
                              disabled={isCreating || isUpdating || isDeleting}
                              title="Delete client"
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
          </CardContent>
        </Card>
      )}

      {!loader && (clients?.length === 0) && (
        <div className="py-12 text-center bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <UserCheck className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <h3 className="mb-1 text-base font-bold text-slate-800">No clients found</h3>
          <p className="text-xs text-slate-500">No clients have been registered yet</p>
        </div>
      )}

      {/* Client Form Modal */}
      <ClientForm
        client={editingClient}
        onSubmit={handleFormSubmit}
        services={services}
        onClose={() => {
          setShowAddForm(false);
          setEditingClient(null);
        }}
        isOpen={showAddForm}
        isLoading={editingClient ? isUpdating : isCreating}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        clientId={showDeleteConfirm}
        onConfirm={handleDeleteClient}
        onCancel={() => setShowDeleteConfirm(null)}
        isOpen={!!showDeleteConfirm}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ClientsPage;
