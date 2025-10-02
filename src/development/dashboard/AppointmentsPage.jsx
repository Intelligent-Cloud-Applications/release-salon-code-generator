import React, { useState, useEffect, useContext } from "react";
import {
  Calendar,
  Plus,
  Search,
  Clock,
  User,
  Scissors,
  CheckCircle,
  X,
  AlertCircle,
  Edit,
  ChevronDown,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useToast } from "../hooks/use-toast";
import Context from "../Context/Context";

// Custom Scissors Loader Component
const ScissorsLoader = ({ text = "Loading..." }) => {
  return (
    <div className="flex h-64 flex-col items-center justify-center space-y-4">
      <div className="relative">
        <div className="animate-pulse">
          <Scissors className="h-16 w-16 animate-bounce text-stone-600" />
        </div>
        <div className="absolute -right-2 -top-2 h-4 w-4 animate-ping rounded-full bg-stone-300"></div>
        <div
          className="absolute -bottom-2 -left-2 h-3 w-3 animate-ping rounded-full bg-stone-400"
          style={{ animationDelay: "0.5s" }}
        ></div>
      </div>
      <div className="text-center">
        <p className="animate-pulse text-lg font-medium text-stone-700">
          {text}
        </p>
        <div className="mt-2 flex items-center justify-center space-x-1">
          <div
            className="h-2 w-2 animate-bounce rounded-full bg-stone-400"
            style={{ animationDelay: "0ms" }}
          ></div>
          <div
            className="h-2 w-2 animate-bounce rounded-full bg-stone-400"
            style={{ animationDelay: "150ms" }}
          ></div>
          <div
            className="h-2 w-2 animate-bounce rounded-full bg-stone-400"
            style={{ animationDelay: "300ms" }}
          ></div>
        </div>
      </div>
    </div>
  );
};

// Custom Multi-Select Dropdown Component
const MultiSelectDropdown = ({
  options,
  selectedValues,
  onChange,
  placeholder = "Select options",
  disabled = false,
}) => {
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

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleToggle = (value) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  const handleRemove = (value) => {
    const newValues = selectedValues.filter((v) => v !== value);
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
        className={`w-full rounded-md border border-stone-200 bg-white p-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-stone-500 ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:border-stone-300"
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
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
          <div className="flex flex-1 flex-wrap gap-1">
            {selectedCount === 0 ? (
              <span className="text-stone-500">{placeholder}</span>
            ) : (
              selectedValues.map((value) => (
                <span
                  key={value}
                  className="inline-flex items-center gap-1 rounded bg-stone-100 px-2 py-1 text-sm text-stone-700"
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
          <ChevronDown
            className={`h-4 w-4 text-stone-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-hidden rounded-md border border-stone-200 bg-white shadow-lg">
          <div className="border-b border-stone-200 p-2">
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-stone-200 text-sm"
            />
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="h-7 px-2 text-xs"
              >
                Select All
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="h-7 px-2 text-xs"
              >
                Clear All
              </Button>
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-sm text-stone-500">
                No services found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-center p-2 hover:bg-stone-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option)}
                    onChange={() => handleToggle(option)}
                    className="mr-3 h-4 w-4 rounded border-stone-300 text-stone-600 focus:ring-stone-500"
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

// Appointment Edit Modal Component
const AppointmentEditModal = ({
  isOpen,
  onClose,
  appointment,
  onSubmit,
  barbers = [],
  isLoading = false,
}) => {
  const { services } = useContext(Context);
  const [formData, setFormData] = useState({
    clientName: "",
    phoneNumber: "",
    dateTime: "",
    staffId: "",
    services: [],
    status: "scheduled",
    notes: "",
  });

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && appointment) {
      console.log("Appointment data for editing:", appointment);
      console.log(
        "Original dateTime:",
        appointment.dateTime,
        typeof appointment.dateTime,
      );

      // Convert dateTime to datetime-local format
      let dateTime;
      if (appointment.dateTime) {
        // Handle different date formats
        if (typeof appointment.dateTime === "number") {
          // If it's a number, determine if it's in seconds or milliseconds
          if (appointment.dateTime < 10000000000) {
            // Likely in seconds (epoch timestamp)
            dateTime = new Date(appointment.dateTime * 1000);
          } else {
            // Likely in milliseconds
            dateTime = new Date(appointment.dateTime);
          }
        } else if (typeof appointment.dateTime === "string") {
          // If it's a string, parse it directly
          dateTime = new Date(appointment.dateTime);
        } else {
          dateTime = new Date();
        }
      } else {
        dateTime = new Date();
      }

      // Format for datetime-local input
      const year = dateTime.getFullYear();
      const month = String(dateTime.getMonth() + 1).padStart(2, "0");
      const day = String(dateTime.getDate()).padStart(2, "0");
      const hours = String(dateTime.getHours()).padStart(2, "0");
      const minutes = String(dateTime.getMinutes()).padStart(2, "0");
      const dateTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;

      setFormData({
        clientName:
          appointment.client?.clientName || appointment.clientName || "",
        phoneNumber:
          appointment.client?.phoneNumber || appointment.clientPhone || "",
        dateTime: dateTimeString,
        staffId: appointment.staffId || "",
        services: appointment.service ? appointment.service.split(", ") : [],
        status: appointment.status || "scheduled",
        notes: appointment.notes || "",
      });
    }
  }, [isOpen, appointment]);

  // Clear form when modal closes
  const handleModalChange = (open) => {
    if (!open) {
      setFormData({
        clientName: "",
        phoneNumber: "",
        dateTime: "",
        staffId: "",
        services: [],
        status: "scheduled",
        notes: "",
      });
      onClose();
    }
  };

  // Predefined services
  const predefinedServices =
    services.map((service) => service.serviceName) || [];

  // Use barbers from context
  const staffMembers = barbers.map((barber) => ({
    id: barber.staffId,
    name: barber.name,
  }));

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLoading) return; // Prevent double submission

    if (
      !formData.clientName ||
      !formData.phoneNumber ||
      formData.services.length === 0
    ) {
      alert(
        "Please fill in all required fields (Client Name, Phone Number, and Services)",
      );
      return;
    }

    try {
      // Convert dateTime to epoch format
      const dateTimeEpoch = Math.floor(
        new Date(formData.dateTime).getTime() / 1000,
      );

      // Calculate duration based on selected services (assuming 30 minutes per service)
      const duration = formData.services.length * 30; // 30 minutes per service

      const appointmentData = {
        clientName: formData.clientName,
        phoneNumber: formData.phoneNumber,
        dateTime: dateTimeEpoch,
        service: formData.services.join(", "), // Convert array to string for API
        duration: duration, // Required field
        staffId: formData.staffId, // Required field
        status: formData.status,
        notes: formData.notes,
      };

      // Call the update API
      await onSubmit(
        appointment.appointmentId || appointment.id,
        appointmentData,
      );
      onClose();
    } catch (error) {
      console.error("Error updating appointment:", error);
      alert("Failed to update appointment. Please try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-stone-800">
            Edit Appointment
          </DialogTitle>
          <DialogDescription>
            Update the appointment details. All changes will be saved when you
            click Update Appointment.
          </DialogDescription>
        </DialogHeader>

        <form id="edit-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Client Details */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Client Name *
              </label>
              <Input
                name="clientName"
                value={formData.clientName}
                onChange={handleInputChange}
                required
                placeholder="Enter client name"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Phone Number *
              </label>
              <Input
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                required
                placeholder="Enter phone number"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Appointment Details */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Date & Time *
              </label>
              <Input
                name="dateTime"
                type="datetime-local"
                value={formData.dateTime}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            {/* <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Staff Member *
              </label>
              <select
                name="staffId"
                value={formData.staffId}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border border-stone-200 p-2 focus:outline-none focus:ring-2 focus:ring-stone-500"
              >
                <option value="">Select Staff Member *</option>
                {staffMembers.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </select>
            </div> */}
            <div>
              <Label className="mb-2 block text-sm font-medium text-stone-700">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Services Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">
              Services *
            </label>
            <MultiSelectDropdown
              options={predefinedServices}
              selectedValues={
                Array.isArray(formData.services) ? formData.services : []
              }
              onChange={(selectedServices) => {
                if (!isLoading) {
                  setFormData({
                    ...formData,
                    services: selectedServices,
                  });
                }
              }}
              placeholder="Select services"
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-stone-500">
              Select multiple services (searchable)
            </p>
          </div>

          {/* Notes */}
          <div>
            <Label className="mb-2 block text-sm font-medium text-stone-700">
              Notes (Optional)
            </Label>
            <Textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              placeholder="Add any special notes or requirements..."
              disabled={isLoading}
            />
          </div>
        </form>

        <DialogFooter className="flex justify-end gap-3 border-t border-stone-200 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleModalChange(false)}
            className="border-stone-200 text-stone-600 hover:bg-stone-50"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-form"
            className="bg-stone-600 text-white hover:bg-stone-700"
            disabled={
              !formData.clientName ||
              !formData.phoneNumber ||
              formData.services.length === 0 ||
              isLoading
            }
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Updating...
              </div>
            ) : (
              "Update Appointment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AppointmentsPage = () => {
  const {
    appointments,
    fetchAppointments,
    createAppointment,
    updateAppointment,
    barbers,
    loader,
    services,
  } = useContext(Context);

  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { toast } = useToast();

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Helper function to format time
  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    const time = new Date(timeString);
    return time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        variant: "secondary",
        className: "bg-yellow-100 text-yellow-800",
        icon: Clock,
      },
      confirmed: {
        variant: "default",
        className: "bg-blue-100 text-blue-800",
        icon: CheckCircle,
      },
      in_progress: {
        variant: "default",
        className: "bg-green-100 text-green-800",
        icon: AlertCircle,
      },
      completed: {
        variant: "default",
        className: "bg-emerald-100 text-emerald-800",
        icon: CheckCircle,
      },
      cancelled: {
        variant: "destructive",
        className: "bg-red-100 text-red-800",
        icon: X,
      },
    };
    const config = statusConfig[status] || statusConfig.pending;
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

  const filteredAppointments = appointments.filter((appointment) => {
    // Filter out completed appointments
    const status = appointment.status || appointment.Status || appointment.appointment_status;
    if (status === "completed") {
      return false;
    }

    const clientName =
      appointment.client?.clientName ||
      appointment.clientName ||
      appointment.ClientName ||
      appointment.client_name ||
      "";
    const service =
      appointment.service ||
      appointment.Service ||
      appointment.service_name ||
      "";
    const staff =
      appointment.staff || appointment.Staff || appointment.staff_name || "";

    return (
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  // Handle appointment actions
  const handleAddAppointment = () => {
    if (!showBookingModal) {
      setShowBookingModal(true);
    }
  };

  const handleEditAppointment = (appointment) => {
    setEditingAppointment(appointment);
    setShowEditModal(true);
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      await updateAppointment(appointmentId, { status: newStatus });
    } catch (error) {
      console.error("Error updating appointment status:", error);
    }
  };

  const handleUpdateAppointment = async (appointmentId, appointmentData) => {
    if (isUpdating) return;

    try {
      setIsUpdating(true);
      await updateAppointment(appointmentId, appointmentData);
      setShowEditModal(false);
      setEditingAppointment(null);

      toast({
        variant: "success",
        title: "Success!",
        description: "Appointment has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update appointment. Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBookingSubmit = async (appointmentData) => {
    if (isCreating) return;

    try {
      setIsCreating(true);
      console.log("Creating appointment with data:", appointmentData);
      await createAppointment(appointmentData);

      // Refresh appointments list
      await fetchAppointments();

      // Show toast first
      toast({
        variant: "success",
        title: "Success!",
        description: "Appointment has been created successfully.",
      });

      // Close modal after a brief delay to show the toast
      setTimeout(() => {
        setShowBookingModal(false);
      }, 500);
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create appointment. Please try again.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Appointment Booking Modal Component
  const AppointmentBookingModal = ({
    isOpen,
    onClose,
    onSubmit,
    barbers = [],
    isLoading = false,
  }) => {
    const [formData, setFormData] = useState({
      clientId: "",
      clientName: "",
      phoneNumber: "",
      clientEmailId: "",
      clientPreferredServices: [],
      dateTime: "",
      staffId: "",
      services: [],
      status: "Scheduled",
      notes: "",
    });

    const [searchTerm, setSearchTerm] = useState("");
    const [filteredClients, setFilteredClients] = useState([]);

    // Set default date and time when modal opens
    useEffect(() => {
      if (isOpen && !formData.dateTime) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const dateTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;

        setFormData((prev) => ({
          ...prev,
          dateTime: dateTimeString,
        }));
      }
    }, [isOpen, formData.dateTime]);

    // Clear form when modal closes
    const handleModalChange = (open) => {
      if (!open && !isCreating) {
        // Reset form data
        setFormData({
          clientId: "",
          clientName: "",
          phoneNumber: "",
          clientEmailId: "",
          clientPreferredServices: [],
          dateTime: "",
          staffId: "",
          services: [],
          status: "Scheduled",
          notes: "",
        });
        setSearchTerm("");
        setFilteredClients([]);
        onClose();
      }
    };

    // Get clients from context
    const { clients } = useContext(Context);

    // Filter clients based on search term
    useEffect(() => {
      if (searchTerm) {
        const filtered = clients.filter(
          (client) =>
            (client.clientName || client.ClientName || "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            (client.phoneNumber || client.PhoneNumber || "").includes(
              searchTerm,
            ),
        );
        setFilteredClients(filtered);
      } else {
        setFilteredClients([]);
      }
    }, [searchTerm, clients]);

    // Predefined services
    const predefinedServices =
      services.map((service) => service.serviceName) || [];

    // Use barbers from context
    const staffMembers = barbers.map((barber) => ({
      id: barber.staffId,
      name: barber.name,
    }));

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
    };

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    };

    const handleClientSelect = (client) => {
      const preferredServices =
        client.preferredServices || client.PreferredServices || [];
      setFormData((prev) => ({
        ...prev,
        clientId: client.clientId || client.ClientId || client.id,
        clientName: client.clientName || client.ClientName || client.name,
        phoneNumber: client.phoneNumber || client.PhoneNumber || client.phone,
        clientEmailId: client.emailId || client.EmailId || client.email || "",
        clientPreferredServices: preferredServices,
        services: preferredServices, // Auto-populate services from client's preferred services
        staffId: client.preferredStaffId || client.PreferredStaffId || "", // Auto-populate preferred staff if available
      }));
      setSearchTerm("");
      setFilteredClients([]);
    };

    const generateClientId = () => {
      const currentEpoch = Math.floor(Date.now() / 1000);
      const randomSuffix = Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase();
      return `CLT${currentEpoch.toString().slice(-6)}${randomSuffix}`;
    };

    const handleSubmit = async (e) => {
      e.preventDefault();

      if (isLoading) return; // Prevent double submission

      if (
        !formData.clientName ||
        !formData.phoneNumber ||
        formData.services.length === 0
      ) {
        alert(
          "Please fill in all required fields (Client Name, Phone Number, and Services)",
        );
        return;
      }

      try {
        // Convert dateTime to epoch format
        const dateTimeEpoch = Math.floor(
          new Date(formData.dateTime).getTime() / 1000,
        );

        // Calculate duration based on selected services (assuming 30 minutes per service)
        const duration = formData.services.length * 30; // 30 minutes per service

        const appointmentData = {
          clientId: formData.clientId || generateClientId(),
          clientName: formData.clientName,
          phoneNumber: formData.phoneNumber,
          emailId: formData.clientEmailId,
          preferredServices: formData.clientPreferredServices,
          appointmentDate: formData.appointmentDate,
          appointmentTime: formData.appointmentTime,
          // staffMember: formData.staffMember,
          services: formData.services.map((service) => {
            return { serviceName: service };
          }), // Send as array
          notes: formData.notes,
          status: "scheduled",
          dateTime: dateTimeEpoch,
          service: formData.services, // Send as array instead of string
          duration: duration, // Required field
          // staffId: formData.staffId,
        };

        // Call the parent's onSubmit function which handles the API call and state management
        await onSubmit(appointmentData);
      } catch (error) {
        console.error("Error creating appointment:", error);
        alert("Failed to create appointment. Please try again.");
      }
    };

    return (
      <Dialog open={isOpen} onOpenChange={handleModalChange}>
        <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-stone-800">
              Book New Appointment
            </DialogTitle>
            <DialogDescription>
              Create a new appointment for your salon. Fill in all required
              fields and select services.
            </DialogDescription>
          </DialogHeader>

          <form id="booking-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Client Search */}
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Search Existing Client (Optional)
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                  disabled={isLoading}
                />
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-stone-400" />
              </div>

              {filteredClients.length > 0 && (
                <div className="mt-2 max-h-32 overflow-y-auto rounded-lg border border-stone-200">
                  {filteredClients.map((client) => (
                    <div
                      key={client.clientId || client.ClientId || client.id}
                      className="cursor-pointer border-b border-stone-100 p-2 last:border-b-0 hover:bg-stone-50"
                      onClick={() => handleClientSelect(client)}
                    >
                      <div className="font-medium text-stone-800">
                        {client.clientName || client.ClientName || client.name}
                      </div>
                      <div className="text-sm text-stone-500">
                        {client.phoneNumber ||
                          client.PhoneNumber ||
                          client.phone}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {formData.clientName && (
                <div className="mt-2 rounded-lg border border-green-200 bg-green-50 p-2">
                  <div className="text-sm font-medium text-green-800">
                    Selected: {formData.clientName}
                  </div>
                  <div className="text-xs text-green-600">
                    {formData.phoneNumber}
                  </div>
                </div>
              )}
            </div>

            {/* Client Details */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Client Name *
                </label>
                <Input
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter client name"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Phone Number *
                </label>
                <Input
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter phone number"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Appointment Details */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Date & Time *
                </label>
                <Input
                  name="dateTime"
                  type="datetime-local"
                  value={formData.dateTime}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>
              {/* <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Staff Member *
                </label>
                <select
                  name="staffId"
                  value={formData.staffId}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-stone-200 p-2 focus:outline-none focus:ring-2 focus:ring-stone-500"
                >
                  <option value="">Select Staff Member *</option>
                  {staffMembers.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name}
                    </option>
                  ))}
                </select>
              </div> */}
              <div>
                <Label className="mb-2 block text-sm font-medium text-stone-700">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Services Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Services *
              </label>
              <MultiSelectDropdown
                options={predefinedServices}
                selectedValues={
                  Array.isArray(formData.services) ? formData.services : []
                }
                onChange={(selectedServices) => {
                  if (!isCreating) {
                    setFormData({
                      ...formData,
                      services: selectedServices,
                    });
                  }
                }}
                placeholder="Select services"
                disabled={isCreating}
              />
              <p className="mt-1 text-xs text-stone-500">
                Select multiple services (searchable)
              </p>
            </div>

            {/* Notes */}
            <div>
              <Label className="mb-2 block text-sm font-medium text-stone-700">
                Notes (Optional)
              </Label>
              <Textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                placeholder="Add any special notes or requirements..."
                disabled={isLoading}
              />
            </div>
          </form>

          <DialogFooter className="flex justify-end gap-3 border-t border-stone-200 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleModalChange(false)}
              className="border-stone-200 text-stone-600 hover:bg-stone-50"
              disabled={isLoading || isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="booking-form"
              className="bg-stone-600 text-white hover:bg-stone-700"
              disabled={
                !formData.clientName ||
                !formData.phoneNumber ||
                formData.services.length === 0 ||
                isLoading ||
                isCreating
              }
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Creating...
                </div>
              ) : (
                "Book Appointment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="poppins-regular space-y-6 p-6">
      {/* Header - Static */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">Appointments</h1>
          <p className="text-stone-600">
            Manage your salon appointments and bookings
          </p>
        </div>
        <Button
          className="bg-stone-600 text-white hover:bg-stone-700"
          onClick={handleAddAppointment}
        >
          <Plus className="mr-2 h-4 w-4" />
          Book Appointment
        </Button>
      </div>

      {/* Search and Stats - Static */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-stone-400" />
          <Input
            placeholder="Search appointments by client, service, or staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-stone-200 pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-stone-100 text-stone-800">
            Total: {loader ? "..." : filteredAppointments.length}
          </Badge>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Today:{" "}
            {loader
              ? "..."
              : appointments.filter((a) => {
                  const status = a.status || a.Status || a.appointment_status;
                  if (status === "completed") return false; // Exclude completed
                  const appointmentDate = a.dateTime
                    ? new Date(a.dateTime).toISOString().split("T")[0]
                    : a.date || a.Date || a.appointment_date;
                  const today = new Date().toISOString().split("T")[0];
                  return appointmentDate === today;
                }).length}
          </Badge>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pending:{" "}
            {loader
              ? "..."
              : appointments.filter((a) => {
                  const status = a.status || a.Status || a.appointment_status;
                  return status === "pending" || status === "scheduled";
                }).length}
          </Badge>
        </div>
      </div>

      {/* Appointments Table - Dynamic Content */}
      <Card className="border-stone-200">
        <CardContent>
          {loader ? (
            <div className="flex justify-center py-12">
              <ScissorsLoader text="Loading appointments..." />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-stone-600">Client</TableHead>
                  <TableHead className="text-stone-600">Date & Time</TableHead>
                  <TableHead className="text-stone-600">Service</TableHead>
                  <TableHead className="text-stone-600">Duration</TableHead>
                  <TableHead className="text-stone-600">Amount</TableHead>
                  <TableHead className="text-stone-600">Status</TableHead>
                  <TableHead className="text-stone-600">Notes</TableHead>
                  <TableHead className="text-stone-600">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((appointment) => (
                  <TableRow
                    key={appointment.appointmentId || appointment.id}
                    className="hover:bg-stone-50"
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium text-stone-800">
                          {appointment.client?.clientName ||
                            appointment.clientName ||
                            appointment.ClientName ||
                            appointment.client_name ||
                            "N/A"}
                        </div>
                        <div className="text-sm text-stone-500">
                          {appointment.client?.phoneNumber ||
                            appointment.clientPhone ||
                            appointment.ClientPhone ||
                            appointment.phone_number ||
                            "N/A"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-stone-500" />
                        <div>
                          <div className="text-sm font-medium text-stone-800">
                            {appointment.dateTime
                              ? formatDate(appointment.dateTime)
                              : formatDate(
                                  appointment.date ||
                                    appointment.Date ||
                                    appointment.appointment_date,
                                )}
                          </div>
                          <div className="text-xs text-stone-600">
                            {appointment.dateTime
                              ? formatTime(appointment.dateTime)
                              : formatTime(
                                  appointment.time ||
                                    appointment.Time ||
                                    appointment.appointment_time,
                                )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Scissors className="h-4 w-4 text-stone-500" />
                        <span className="text-sm text-stone-800">
                          {appointment.service ||
                            appointment.Service ||
                            appointment.service_name ||
                            "N/A"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-stone-200 text-stone-600"
                      >
                        {appointment.duration ||
                        appointment.Duration ||
                        appointment.duration_minutes
                          ? `${appointment.duration || appointment.Duration || appointment.duration_minutes} min`
                          : "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-stone-800">
                        {formatCurrency(
                          appointment.total ||
                            appointment.totalAmount ||
                            appointment.TotalAmount ||
                            appointment.total_amount ||
                            0,
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(
                        appointment.status ||
                          appointment.Status ||
                          appointment.appointment_status ||
                          "pending",
                      )}
                    </TableCell>
                    <TableCell>
                      {appointment.notes ||
                      appointment.Notes ||
                      appointment.notes_text ? (
                        <div className="max-w-xs">
                          <p
                            className="truncate text-xs text-stone-600"
                            title={
                              appointment.notes ||
                              appointment.Notes ||
                              appointment.notes_text
                            }
                          >
                            "
                            {appointment.notes ||
                              appointment.Notes ||
                              appointment.notes_text}
                            "
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-stone-400">No notes</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {(() => {
                          const status =
                            appointment.status ||
                            appointment.Status ||
                            appointment.appointment_status;
                          const appointmentId =
                            appointment.appointmentId ||
                            appointment.id ||
                            appointment.Id ||
                            appointment.appointment_id;

                          if (status === "pending") {
                            return (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-green-100"
                                  onClick={() =>
                                    handleStatusUpdate(
                                      appointmentId,
                                      "confirmed",
                                    )
                                  }
                                  title="Confirm appointment"
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-red-100"
                                  onClick={() =>
                                    handleStatusUpdate(
                                      appointmentId,
                                      "cancelled",
                                    )
                                  }
                                  title="Cancel appointment"
                                >
                                  <X className="h-4 w-4 text-red-600" />
                                </Button>
                              </>
                            );
                          }

                          if (status === "confirmed") {
                            return (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-blue-100"
                                onClick={() =>
                                  handleStatusUpdate(
                                    appointmentId,
                                    "in_progress",
                                  )
                                }
                                title="Start appointment"
                              >
                                <AlertCircle className="h-4 w-4 text-blue-600" />
                              </Button>
                            );
                          }

                          if (status === "in_progress") {
                            return (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-emerald-100"
                                onClick={() =>
                                  handleStatusUpdate(appointmentId, "completed")
                                }
                                title="Complete appointment"
                              >
                                <CheckCircle className="h-4 w-4 text-emerald-600" />
                              </Button>
                            );
                          }

                          return null;
                        })()}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-stone-100"
                          onClick={() => handleEditAppointment(appointment)}
                          title="Edit appointment"
                        >
                          <Edit className="h-4 w-4 text-stone-600" />
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

      {!loader && hasInitiallyLoaded && appointments.length === 0 && (
        <div className="py-12 text-center">
          <Calendar className="mx-auto mb-4 h-12 w-12 text-stone-300" />
          <h3 className="mb-2 text-lg font-medium text-stone-600">
            No appointments found
          </h3>
          <p className="text-stone-500">
            No appointments have been scheduled yet
          </p>
        </div>
      )}

      {!loader &&
        hasInitiallyLoaded &&
        appointments.length > 0 &&
        filteredAppointments.length === 0 && (
          <div className="py-12 text-center">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-stone-300" />
            <h3 className="mb-2 text-lg font-medium text-stone-600">
              No matching appointments found
            </h3>
            <p className="text-stone-500">Try adjusting your search criteria</p>
          </div>
        )}

      {/* Appointment Booking Modal */}
      <AppointmentBookingModal
        isOpen={showBookingModal}
        onClose={() => {
          if (!isCreating) {
            setShowBookingModal(false);
          }
        }}
        onSubmit={handleBookingSubmit}
        barbers={barbers}
        isLoading={isCreating}
      />

      {/* Appointment Edit Modal */}
      <AppointmentEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingAppointment(null);
        }}
        appointment={editingAppointment}
        onSubmit={handleUpdateAppointment}
        barbers={barbers}
        isLoading={isUpdating}
      />
    </div>
  );
};

export default AppointmentsPage;
