import React, { useState, useEffect } from "react";
import { UserCheck, Plus, Search, Edit, Trash2, Phone, Mail, Calendar, Star, ChevronDown, X, Scissors, AlertCircle } from "lucide-react";
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
          <Scissors className="h-16 w-16 text-stone-600 animate-bounce" />
        </div>
        <div className="absolute -top-2 -right-2 h-4 w-4 bg-stone-300 rounded-full animate-ping"></div>
        <div className="absolute -bottom-2 -left-2 h-3 w-3 bg-stone-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
      </div>
      <div className="text-center">
        <p className="text-lg font-medium text-stone-700 animate-pulse">{text}</p>
        <div className="flex items-center justify-center mt-2 space-x-1">
          <div className="h-2 w-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="h-2 w-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="h-2 w-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
        className={`w-full p-2 border border-stone-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-stone-300'}`}
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
              <span className="text-stone-500">{placeholder}</span>
            ) : (
              selectedValues.map((value) => (
                <span
                  key={value}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-stone-100 text-stone-700 rounded text-sm"
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
          <ChevronDown className={`h-4 w-4 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-md shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-stone-200">
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-stone-200 text-sm"
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
              <div className="p-3 text-sm text-stone-500 text-center">No services found</div>
            ) : (
              filteredOptions.map((option) => (
                <label
                  key={option}
                  className="flex items-center p-2 hover:bg-stone-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option)}
                    onChange={() => handleToggle(option)}
                    className="mr-3 h-4 w-4 text-stone-600 focus:ring-stone-500 border-stone-300 rounded"
                  />
                  <span className="text-sm text-stone-700">{option}</span>
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
          <DialogTitle className="text-xl font-bold text-stone-800">
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
            <Button type="submit" className="bg-stone-600 hover:bg-stone-700 text-white" disabled={isLoading}>
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
              <DialogTitle className="text-lg font-bold text-stone-800">Delete Client</DialogTitle>
              <DialogDescription className="text-sm text-stone-600">
                This action cannot be undone
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-stone-700">
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
    <div className="poppins-regular space-y-6 p-6">
      {/* Header - Static */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">Client Management</h1>
          <p className="text-stone-600">Manage your salon clients and their information</p>
        </div>
        <Button 
          className="bg-stone-600 hover:bg-stone-700 text-white"
          onClick={handleAddClient}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Search and Stats - Static */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 h-4 w-4" />
          <Input
            placeholder="Search clients by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-stone-200"
          />
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-stone-100 text-stone-800">
            Total: {loader ? '...' : (clients?.length || 0)}
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Active: {loader ? '...' : (clients || []).filter(c => getClientStatus(c) === 'active').length}
          </Badge>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            VIP: {loader ? '...' : (clients || []).filter(c => getClientStatus(c) === 'vip').length}
          </Badge>
        </div>
      </div>

      {/* Clients Table - Dynamic Content */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="text-stone-800">Client List</CardTitle>
        </CardHeader>
        <CardContent>
          {loader ? (
            <div className="flex justify-center py-12">
              <ScissorsLoader text="Loading clients..." />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-stone-600">Client</TableHead>
                  <TableHead className="text-stone-600">Contact</TableHead>
                  <TableHead className="text-stone-600">Last Visit</TableHead>
                  <TableHead className="text-stone-600">Visits</TableHead>
                  <TableHead className="text-stone-600">Loyalty Points</TableHead>
                  <TableHead className="text-stone-600">Status</TableHead>
                  <TableHead className="text-stone-600">Preferred Services</TableHead>
                  <TableHead className="text-stone-600">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                <TableRow key={client.id} className="hover:bg-stone-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-stone-200 flex items-center justify-center">
                        <UserCheck className="h-5 w-5 text-stone-600" />
                      </div>
                      <div>
                        <div className="font-medium text-stone-800">{client.clientName || client.ClientName || client.name}</div>
                        <div className="text-sm text-stone-500">ID: #{client.clientId || client.ClientId || client.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-stone-600">
                        <Phone className="h-3 w-3" />
                        <span>{client.phoneNumber || client.PhoneNumber || client.phone}</span>
                      </div>
                      {(client.emailId || client.EmailId || client.email) && (
                        <div className="flex items-center gap-2 text-sm text-stone-600">
                          <Mail className="h-3 w-3" />
                          <span>{client.emailId || client.EmailId || client.email}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-stone-600">
                      <Calendar className="h-4 w-4" />
                      <span>{formatLastVisit(client.lastVisit || client.LastVisit || client.lastVisit)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-stone-200 text-stone-600">
                      {client.totalVisits || client.TotalVisits || client.totalVisits || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium text-stone-800">{client.loyaltyPoints || client.LoyaltyPoints || client.loyaltyPoints || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(client)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(client.preferredServices || client.PreferredServices || client.preferredServices || []).slice(0, 2).map((service, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-stone-200 text-stone-600">
                          {service}
                        </Badge>
                      ))}
                      {(client.preferredServices || client.PreferredServices || client.preferredServices || []).length > 2 && (
                        <Badge variant="outline" className="text-xs border-stone-200 text-stone-600">
                          +{(client.preferredServices || client.PreferredServices || client.preferredServices || []).length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 hover:bg-stone-100"
                        onClick={() => handleEditClient(client)}
                        disabled={isCreating || isUpdating || isDeleting}
                        title="Edit client"
                      >
                        <Edit className="h-4 w-4 text-stone-600" />
                      </Button>
                      {/* <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 hover:bg-stone-100"
                        disabled={isCreating || isUpdating || isDeleting}
                        title="View appointments"
                      >
                        <Calendar className="h-4 w-4 text-stone-600" />
                      </Button> */}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 hover:bg-red-100"
                        onClick={() => setShowDeleteConfirm(client.clientId || client.ClientId || client.id)}
                        disabled={isCreating || isUpdating || isDeleting}
                        title="Delete client"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!loader && hasInitiallyLoaded && clients.length === 0 && (
        <div className="text-center py-12">
          <UserCheck className="h-12 w-12 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-stone-600 mb-2">No clients found</h3>
          <p className="text-stone-500">No clients have been added yet. Click 'Add Client' to get started.</p>
        </div>
      )}

      {!loader && hasInitiallyLoaded && clients.length > 0 && filteredClients.length === 0 && (
        <div className="text-center py-12">
          <UserCheck className="h-12 w-12 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-stone-600 mb-2">No matching clients found</h3>
          <p className="text-stone-500">Try adjusting your search criteria</p>
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
