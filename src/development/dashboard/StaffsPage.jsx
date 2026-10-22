import React, { useState, useContext, useEffect } from "react";
import { Users, Plus, Search, Edit, Trash2, Phone, Mail, MapPin, X, Scissors, Grid3X3, List, AlertCircle } from "lucide-react";
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

// Staff Modal Component
const StaffModal = ({ isOpen, onClose, onSubmit, title, staffData = null, isLoading = false }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    gender: 'Male',
    specialization: [],
    yearsOfExperience: '',
    bio: '',
    status: 'available'
  });

  const [newSpecialization, setNewSpecialization] = useState('');
  const [errors, setErrors] = useState({});

  // Validation functions
  const validateName = (name) => {
    if (!name || name.trim().length === 0) {
      return "Staff name is required";
    }
    if (name.trim().length < 2) {
      return "Staff name must be at least 2 characters long";
    }
    if (name.trim().length > 50) {
      return "Staff name must be less than 50 characters";
    }
    if (!/^[a-zA-Z\s.'-]+$/.test(name.trim())) {
      return "Staff name can only contain letters, spaces, periods, apostrophes, and hyphens";
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

  const validateExperience = (experience) => {
    if (experience && experience.trim().length > 0) {
      const numExperience = parseInt(experience);
      if (isNaN(numExperience) || numExperience < 0) {
        return "Years of experience must be a non-negative number";
      }
      if (numExperience > 50) {
        return "Years of experience seems too high (maximum 50 years)";
      }
    }
    return "";
  };

  const validateSpecialization = (specializations) => {
    if (!specializations || specializations.length === 0) {
      return "At least one specialization is required";
    }
    return "";
  };

  const validateForm = () => {
    const newErrors = {};
    
    newErrors.name = validateName(formData.name);
    newErrors.phoneNumber = validatePhoneNumber(formData.phoneNumber);
    newErrors.email = validateEmail(formData.email);
    newErrors.yearsOfExperience = validateExperience(formData.yearsOfExperience);
    newErrors.specialization = validateSpecialization(formData.specialization);

    // Remove empty error messages
    Object.keys(newErrors).forEach(key => {
      if (!newErrors[key]) {
        delete newErrors[key];
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Predefined specializations
  const predefinedSpecializations = [
    'BEAUTICIAN',
    'MENS HAIR DRESSER',
    'UNISEX HAIR DRESSER',
    'OWNER',
    'COLOR SPECIALIST',
    'STYLIST',
    'BARBER',
    'NAIL TECHNICIAN',
    'SKIN SPECIALIST',
    'MASSAGE THERAPIST'
  ];

  // Initialize form data when editing
  useEffect(() => {
    if (staffData) {
      setFormData({
        name: staffData.name || '',
        phoneNumber: staffData.phoneNumber || '',
        email: staffData.email || '',
        gender: staffData.gender || 'Male',
        specialization: staffData.specialization || [],
        yearsOfExperience: staffData.yearsOfExperience || '',
        bio: staffData.bio || '',
        status: staffData.status || 'available'
      });
    } else {
      setFormData({
        name: '',
        phoneNumber: '',
        email: '',
        gender: 'Male',
        specialization: [],
        yearsOfExperience: '',
        bio: '',
        status: 'available'
      });
    }
  }, [staffData, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

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

  const handleAddSpecialization = () => {
    if (newSpecialization.trim() && !formData.specialization.includes(newSpecialization.trim())) {
      setFormData(prev => ({
        ...prev,
        specialization: [...prev.specialization, newSpecialization.trim()]
      }));
      setNewSpecialization('');
      
      // Clear specialization error when adding
      if (errors.specialization) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.specialization;
          return newErrors;
        });
      }
    }
  };

  const handleRemoveSpecialization = (spec) => {
    setFormData(prev => ({
      ...prev,
      specialization: prev.specialization.filter(s => s !== spec)
    }));
  };

  const handleSubmit = async (e) => {
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

    try {
      const submitData = {
        ...formData,
        staffId: staffData?.staffId || `${formData.name.toLowerCase().replace(/\s+/g, '-')}-${formData.phoneNumber}`,
        email: formData.email
      };

      if (staffData) {
        await onSubmit({ staffId: submitData.staffId, staffData: submitData });
      } else {
        await onSubmit({ staffData: submitData });
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving staff:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phoneNumber: '',
      email: '',
      gender: 'Male',
      specialization: [],
      yearsOfExperience: '',
      bio: '',
      status: 'available'
    });
    setNewSpecialization('');
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
          <DialogTitle className="text-xl font-bold text-slate-900">{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter staff name"
                disabled={isLoading}
                className={errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
              />
              {errors.name && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.name}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email address"
                disabled={isLoading}
                className={errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
              />
              {errors.email && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.email}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={formData.gender} onValueChange={(value) => handleSelectChange(value, "gender")} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="yearsOfExperience">Years of Experience</Label>
              <Input
                id="yearsOfExperience"
                name="yearsOfExperience"
                type="number"
                value={formData.yearsOfExperience}
                onChange={handleInputChange}
                placeholder="Enter years of experience"
                disabled={isLoading}
                className={errors.yearsOfExperience ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
              />
              {errors.yearsOfExperience && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.yearsOfExperience}</span>
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
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="on_break">On Break</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Specializations *</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newSpecialization}
                onChange={(e) => setNewSpecialization(e.target.value)}
                placeholder="Add specialization"
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                type="button"
                onClick={handleAddSpecialization}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.specialization.map((spec, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  {spec}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-500"
                    onClick={() => handleRemoveSpecialization(spec)}
                  />
                </Badge>
              ))}
            </div>
            {errors.specialization && (
              <div className="flex items-center gap-1 text-sm text-red-600 mt-2">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.specialization}</span>
              </div>
            )}
            <div className="mt-2">
              <p className="text-xs text-slate-500 mb-1">Quick add:</p>
              <div className="flex flex-wrap gap-1">
                {predefinedSpecializations.map((spec) => (
                  <Button
                    key={spec}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-6"
                    onClick={() => {
                      if (!formData.specialization.includes(spec)) {
                        setFormData(prev => ({
                          ...prev,
                          specialization: [...prev.specialization, spec]
                        }));
                      }
                    }}
                    disabled={formData.specialization.includes(spec) || isLoading}
                  >
                    {spec}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={3}
              placeholder="Enter staff bio or description..."
              className="resize-none"
              disabled={isLoading}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { resetForm(); onClose(); }}
              className="border-slate-200 text-slate-600 hover:bg-slate-50"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"  
              onClick={resetForm}
              disabled={isLoading}
            >
              Clear
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  {staffData ? 'Updating...' : 'Adding...'}
                </div>
              ) : (
                staffData ? 'Update Staff' : 'Add Staff'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Delete Confirmation Modal Component
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, staffName, isLoading = false }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">Delete Staff</DialogTitle>
              <DialogDescription className="text-sm text-slate-600">
                This action cannot be undone
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-slate-700">
            Are you sure you want to delete <strong>{staffName}</strong>? This will permanently remove their information from the system.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-200 text-slate-600 hover:bg-slate-50"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
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
              'Delete Staff'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const StaffsPage = () => {
  const { barbers, fetchBarbers, createStaff, updateStaff, deleteStaff, loader } = useContext(Context);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "table"
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getStatusBadge = (status) => {
    const statusConfig = {
      available: { className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      occupied: { className: "bg-amber-50 text-amber-700 border-amber-200" },
      on_break: { className: "bg-orange-50 text-orange-700 border-orange-200" },
      inactive: { className: "bg-rose-50 text-rose-700 border-rose-200" },
    };
    const safeStatus = status || 'available';
    const config = statusConfig[safeStatus] || statusConfig.available;
    return (
      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${config.className}`}>
        {safeStatus.replace("_", " ")}
      </span>
    );
  };

  const filteredStaffs = barbers.filter(staff => {
    const name = (staff.name || staff.barberName || '').toLowerCase();
    const specializations = Array.isArray(staff.specialization) 
      ? staff.specialization.join(' ').toLowerCase() 
      : (staff.role || staff.specialization || '').toLowerCase();
    
    return name.includes(searchTerm.toLowerCase()) ||
           specializations.includes(searchTerm.toLowerCase());
  });

  // Handler functions
  const handleAddStaff = () => {
    setShowAddModal(true);
  };

  const handleEditStaff = (staff) => {
    setEditingStaff(staff);
    setShowEditModal(true);
  };

  const handleDeleteStaff = (staff) => {
    setStaffToDelete(staff);
    setShowDeleteConfirm(true);
  };

  const handleCreateStaff = async (staffData) => {
    if (isCreating) return;
    
    try {
      setIsCreating(true);
      await createStaff(staffData);
      setShowAddModal(false);
      // Refresh the staff list
      await fetchBarbers();
      
      toast({
        variant: "success",
        title: "Success!",
        description: "Staff member has been added successfully.",
      });
    } catch (error) {
      console.error("Error creating staff:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add staff member. Please try again.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateStaff = async (staffUpdateData) => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      await updateStaff(staffUpdateData);
      setShowEditModal(false);
      setEditingStaff(null);
      // Refresh the staff list
      await fetchBarbers();
      
      toast({
        variant: "success",
        title: "Success!",
        description: "Staff member has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating staff:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update staff member. Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (staffToDelete && !isDeleting) {
      try {
        setIsDeleting(true);
        await deleteStaff(staffToDelete.staffId);
        setShowDeleteConfirm(false);
        setStaffToDelete(null);
        // Refresh the staff list
        await fetchBarbers();
        
        toast({
          variant: "success",
          title: "Success!",
          description: "Staff member has been deleted successfully.",
        });
      } catch (error) {
        console.error("Error deleting staff:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete staff member. Please try again.",
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="p-3.5 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 font-sans bg-[#f8fafc] min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Staff & Stylists</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Manage your salon styling team, availability, and roles</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-all w-full sm:w-auto h-10 px-4 cursor-pointer"
          onClick={handleAddStaff}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Stylist
        </Button>
      </div>

      {/* Search and Stats */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Search staff by name or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 text-xs sm:text-sm h-10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-bold border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs">
            Total: {loader ? '...' : barbers.length}
          </Badge>
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 rounded-xl px-3 py-1.5 text-xs">
            Available: {loader ? '...' : barbers.filter(s => s.status === 'available').length}
          </Badge>
          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 ml-auto">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={`h-8 w-8 p-0 rounded-lg cursor-pointer ${viewMode === "grid" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className={`h-8 w-8 p-0 rounded-lg cursor-pointer ${viewMode === "table" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Staff Content */}
      {loader ? (
        <div className="flex justify-center py-12">
          <ScissorsLoader text="Loading staff..." />
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredStaffs.map((staff) => (
            <Card key={staff.staffId || staff.id} className="border-slate-200/90 rounded-2xl bg-white shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
              <CardHeader className="p-4 pb-3 border-b border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-11 w-11 rounded-full bg-blue-50 text-blue-600 font-bold text-sm flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
                      {(staff.name || 'ST').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-sm font-bold text-slate-900 truncate">{staff.name || 'N/A'}</CardTitle>
                      <span className="text-[11px] font-medium text-slate-500 truncate block mt-0.5">
                        {staff.yearsOfExperience ? `${staff.yearsOfExperience} yrs experience` : 'Stylist'}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(staff.status)}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-3 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{staff.phoneNumber || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{staff.email || staff.emailId || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{staff.gender || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-slate-100">
                  {staff.bio && (
                    <p className="text-xs text-slate-500 mb-2 italic break-words line-clamp-2">"{staff.bio}"</p>
                  )}
                  <div className="flex flex-wrap gap-1 max-w-full overflow-hidden">
                    {(staff.specialization || []).map((spec, index) => (
                      <Badge key={index} variant="outline" className="text-[10px] font-semibold border-slate-200 text-slate-600 bg-slate-50 break-all">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 font-semibold rounded-xl text-xs h-8 cursor-pointer"
                    onClick={() => handleEditStaff(staff)}
                    disabled={isCreating || isUpdating || isDeleting}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl h-8 w-8 p-0 cursor-pointer"
                    onClick={() => handleDeleteStaff(staff)}
                    disabled={isCreating || isUpdating || isDeleting}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Table View */
        <Card className="border-slate-200/90 rounded-2xl bg-white shadow-2xs overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/70 border-b border-slate-200/80">
                    <TableHead className="text-slate-700 font-bold text-xs">Staff Member</TableHead>
                    <TableHead className="text-slate-700 font-bold text-xs">Contact</TableHead>
                    <TableHead className="text-slate-700 font-bold text-xs">Specialization</TableHead>
                    <TableHead className="text-slate-700 font-bold text-xs">Experience</TableHead>
                    <TableHead className="text-slate-700 font-bold text-xs">Status</TableHead>
                    <TableHead className="text-slate-700 font-bold text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaffs.map((staff) => (
                    <TableRow key={staff.staffId || staff.id} className="hover:bg-slate-50/70 border-b border-slate-100">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-100">
                            {(staff.name || 'ST').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-xs sm:text-sm text-slate-900">{staff.name || 'N/A'}</div>
                            <div className="text-[11px] text-slate-500">{staff.gender || 'N/A'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            <span>{staff.phoneNumber || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <Mail className="h-3 w-3 text-slate-400" />
                            <span>{staff.email || staff.emailId || 'N/A'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(staff.specialization || []).map((spec, index) => (
                            <Badge key={index} variant="outline" className="text-[10px] border-slate-200 text-slate-600 bg-slate-50">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-semibold text-slate-700">
                          {staff.yearsOfExperience ? `${staff.yearsOfExperience} yrs` : 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(staff.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                            onClick={() => handleEditStaff(staff)}
                            title="Edit staff"
                            disabled={isCreating || isUpdating || isDeleting}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            onClick={() => handleDeleteStaff(staff)}
                            title="Delete staff"
                            disabled={isCreating || isUpdating || isDeleting}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {!loader && hasInitiallyLoaded && barbers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">No staff found</h3>
          <p className="text-slate-500">No staff members have been added yet</p>
        </div>
      )}

      {!loader && hasInitiallyLoaded && barbers.length > 0 && filteredStaffs.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">No matching staff found</h3>
          <p className="text-slate-500">Try adjusting your search criteria</p>
        </div>
      )}

      {/* Add Staff Modal */}
      <StaffModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreateStaff}
        title="Add New Staff"
        isLoading={isCreating}
      />

      {/* Edit Staff Modal */}
      <StaffModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingStaff(null);
        }}
        onSubmit={handleUpdateStaff}
        title="Edit Staff"
        staffData={editingStaff}
        isLoading={isUpdating}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setStaffToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        staffName={staffToDelete?.name}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default StaffsPage;
