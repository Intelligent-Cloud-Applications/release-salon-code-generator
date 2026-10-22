import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  Plus,
  Search,
  Download,
  Eye,
  DollarSign,
  Calendar,
  User,
  Edit,
  Trash2,
  CheckCircle,
  X,
  Table,
  Grid3X3,
  ShoppingCart,
  Star,
  Scissors,
  Sparkles,
  Heart,
  Zap,
  Droplets,
  Palette,
  Shield,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  CalendarIcon,
  CurrencyIcon,
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
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { Calendar as CalendarComponent } from "../components/ui/calendar";
import { cn } from "../lib/utils";
import Context from "../Context/Context";
import ScissorsLoader from "../components/Loader";
import { useToast } from "../hooks/use-toast";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { format } from "date-fns";
import { FaBook, FaCreditCard, FaDollarSign, FaMoneyBill, FaMoneyBillWave } from "react-icons/fa";

// Bill print/reprint modal
const BillPrintModal = ({
  isOpen,
  onClose,
  bill,
  onConfirmSettle,
  isReprint,
  isSettling,
}) => {
  if (!isOpen || !bill) return null;

  const formatCurrency = (amount, currency = "INR") => {
    const locale = currency === "INR" ? "en-IN" : "en-US";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(amount || 0);
  };

  const formatDate = (input) => {
    if (!input) return "N/A";
    const d = input instanceof Date ? input : new Date(input);
    return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString();
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      console.error("Print failed:", e);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl font-bold text-slate-900">
            Salon Invoice
          </DialogTitle>
          <p className="text-sm text-slate-600">
            Phone: (555) 123-4567 | Email: info@mirrorsalon.com
          </p>
        </DialogHeader>

        {/* Scrollable content */}
        <div className="flex-1 space-y-6 overflow-y-auto pr-2">
          {/* Bill Details */}
          <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Client Information */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                Bill To:
              </h3>
              <div className="space-y-2">
                <p className="text-slate-700">
                  <strong>Name:</strong> {bill.clientName}
                </p>
                <p className="text-slate-700">
                  <strong>Invoice ID:</strong> {bill.id}
                </p>
                <p className="text-slate-700">
                  <strong>Date:</strong> {formatDate(bill.date)}
                </p>
                <p className="text-slate-700">
                  <strong>Staff:</strong> {bill.staff}
                </p>
              </div>
            </div>

            {/* Service Details */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                Service Details:
              </h3>
              <div className="space-y-2">
                <p className="text-slate-700">
                  <strong>Payment Method:</strong> {bill.paymentMethod}
                </p>
                <p className="text-slate-700">
                  <strong>Status:</strong>{" "}
                  <span className="capitalize">{bill.status}</span>
                </p>
                {bill.duration != null && (
                  <p className="text-slate-700">
                    <strong>Duration:</strong> {bill.duration} minutes
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Services Table */}
          <div className="mb-8">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              Services Provided:
            </h3>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-4 text-left font-semibold text-slate-700">
                      Service
                    </th>
                    <th className="p-4 text-right font-semibold text-slate-700">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bill.services?.map((service, index) => (
                    <tr key={index} className="border-t border-slate-200">
                      <td className="p-4 text-slate-700">{service}</td>
                      <td className="p-4 text-right text-slate-700">
                        {formatCurrency(
                          (bill.subtotal || 0) / (bill.services?.length || 1),
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="rounded-lg bg-slate-50 p-6">
            <div className="ml-auto max-w-md space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-700">Subtotal:</span>
                <span className="text-slate-700">
                  {formatCurrency(bill.subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-700">Tax:</span>
                <span className="text-slate-700">
                  {formatCurrency(bill.tax)}
                </span>
              </div>
              <div className="border-t border-slate-300 pt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-slate-900">
                    Total:
                  </span>
                  <span className="text-lg font-semibold text-slate-900">
                    {formatCurrency(bill.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-slate-500">
            <p>Thank you for choosing Mirror Salon!</p>
            <p>Visit us again for all your beauty needs.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <DialogFooter className="mt-6 flex-shrink-0">
          {isSettling ? (
            <div className="flex w-full items-center justify-center py-4">
              <ScissorsLoader text="Settling bill..." />
            </div>
          ) : (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                {isReprint ? "Close" : "Cancel"}
              </Button>
              {!isReprint && (
                <Button
                  onClick={onConfirmSettle}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Settle & Print
                </Button>
              )}
              {isReprint && (
                <Button
                  onClick={handlePrint}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Print Invoice
                </Button>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const BillingPage = () => {
  const {
    billing,
    createBilling,
    updateBilling,
    updateAppointmentBilling,
    appointments,
    loader,
    clients,
    barbers,
    createClient,
    createAppointment,
    fetchAppointments,
    institutionData,
  } = useContext(Context);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "table", "grid", "list"
  const [activeSubPage, setActiveSubPage] = useState("overview"); // "overview", "create-invoice"
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [billToDelete, setBillToDelete] = useState(null);
  const [showBillPrint, setShowBillPrint] = useState(false);
  const [billToPrint, setBillToPrint] = useState(null);
  const [billData, setBillData] = useState(null);
  const [isSettlingBill, setIsSettlingBill] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    from: undefined,
    to: undefined,
    isActive: false,
  });
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showExportMenu &&
        !event.target.closest(".export-dropdown-container")
      ) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showExportMenu]);

  // // Ensure appointments are loaded when landing on BillingPage
  // useEffect(() => {
  //   if (!Array.isArray(appointments) || appointments.length === 0) {
  //     fetchAppointments?.().catch(() => {});
  //   }
  // }, [appointments?.length, fetchAppointments]);

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Use appointments data directly as billing data

  // Helper function to get staff name from staff ID
  const getStaffName = (staffId) => {
    if (!staffId) return "Not Assigned";
    const staff = barbers.find(
      (barber) =>
        barber.id === staffId ||
        barber.staffId === staffId ||
        barber.name === staffId,
    );
    return staff ? staff.name : staffId;
  };

  const bills = appointments
    .map((appointment) => {
      const staffId =
        appointment.staffId ||
        appointment.staff ||
        appointment.Staff ||
        appointment.staff_name ||
        "Not Assigned";

      return {
        id:
          appointment.appointmentId ||
          appointment.id ||
          appointment.Id ||
          appointment.appointment_id,
        clientName:
          appointment.client?.clientName ||
          appointment.clientName ||
          appointment.ClientName ||
          appointment.client_name ||
          "N/A",
        date: appointment.dateTime
          ? new Date(appointment.dateTime).toLocaleDateString("en-GB")
          : "N/A",
        services: appointment.service
          ? appointment.service.split(", ")
          : appointment.services ||
            appointment.Services ||
            appointment.service_names ||
            [],
        subtotal:
          appointment.subtotal ||
          appointment.Subtotal ||
          appointment.subtotal_amount ||
          0,
        tax: appointment.tax || appointment.Tax || appointment.tax_amount || 0,
        discount:
          appointment.discount ||
          appointment.Discount ||
          appointment.discount_value ||
          0,
        discountAmount:
          appointment.discountAmount ||
          appointment.discount_amount ||
          appointment.discount ||
          0,
        gstPercent:
          appointment.gstPercent ||
          appointment.gst_percent ||
          appointment.gst ||
          null,
        total:
          appointment.total ||
          appointment.Total ||
          appointment.total_amount ||
          0,
        status:
          appointment.status ||
          appointment.Status ||
          appointment.appointment_status ||
          "pending",
        paymentMethod:
          appointment.paymentMode ||
          appointment.paymentMethod ||
          appointment.PaymentMethod ||
          appointment.payment_method ||
          "Cash",
        staff: getStaffName(staffId),
        staffId: staffId, // Keep original staffId for reference
        notes: appointment.notes || "",
        duration: appointment.duration || 0,
        createdAt: appointment.createdAt || appointment.created_at || "",
        updatedAt: appointment.updatedAt || appointment.updated_at || "",
      };
    })
    .filter(
      (b) =>
        b.status === "confirmed" ||
        b.status === "completed" ||
        b.status === "pending" ||
        b.status === "in_progress",
    );

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: {
        variant: "default",
        className: "bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold text-[11px] px-2 py-0.5",
      },
      settled: { 
        variant: "default", 
        className: "bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold text-[11px] px-2 py-0.5",
      },
      scheduled: {
        variant: "secondary",
        className: "bg-blue-50 text-blue-700 border border-blue-200/80 font-semibold text-[11px] px-2 py-0.5",
      },
      confirmed: {
        variant: "secondary",
        className: "bg-blue-50 text-blue-700 border border-blue-200/80 font-semibold text-[11px] px-2 py-0.5",
      },
      in_progress: {
        variant: "secondary",
        className: "bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-semibold text-[11px] px-2 py-0.5",
      },
      cancelled: {
        variant: "destructive",
        className: "bg-rose-50 text-rose-700 border border-rose-200/80 font-semibold text-[11px] px-2 py-0.5",
      },
      paid: { 
        variant: "default", 
        className: "bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold text-[11px] px-2 py-0.5",
      },
      pending: {
        variant: "secondary",
        className: "bg-amber-50 text-amber-700 border border-amber-200/80 font-semibold text-[11px] px-2 py-0.5",
      },
      overdue: { 
        variant: "destructive", 
        className: "bg-rose-50 text-rose-700 border border-rose-200/80 font-semibold text-[11px] px-2 py-0.5",
      },
    };
    const config = statusConfig[status] || statusConfig.scheduled;
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  // Date filtering helper function
  const isDateInRange = (billDate, startDate, endDate) => {
    if (!startDate && !endDate) return true;
    if (!billDate || billDate === "N/A") return false;

    // Convert bill date to YYYY-MM-DD format for comparison
    let billDateStr;
    try {
      if (billDate.includes("/")) {
        // Handle DD/MM/YYYY format (from toLocaleDateString("en-GB"))
        const parts = billDate.split("/");
        if (parts.length === 3) {
          const day = parts[0].padStart(2, "0");
          const month = parts[1].padStart(2, "0");
          const year = parts[2];
          billDateStr = `${year}-${month}-${day}`;
        }
      } else {
        // Handle other date formats
        const billDateObj = new Date(billDate);
        billDateStr = billDateObj.toISOString().split("T")[0];
      }

      // Convert Date objects to YYYY-MM-DD format for comparison
      const startDateStr = startDate ? format(startDate, "yyyy-MM-dd") : null;
      const endDateStr = endDate ? format(endDate, "yyyy-MM-dd") : null;

      if (startDateStr && endDateStr) {
        return billDateStr >= startDateStr && billDateStr <= endDateStr;
      } else if (startDateStr) {
        return billDateStr >= startDateStr;
      } else if (endDateStr) {
        return billDateStr <= endDateStr;
      }

      return true;
    } catch (error) {
      console.error("Date filtering error:", error);
      return false;
    }
  };

  // Apply date filter based on date range
  const applyDateFilter = (bills) => {
    if (!dateFilter.isActive || (!dateFilter.from && !dateFilter.to)) {
      return bills;
    }

    const filtered = bills.filter((bill) =>
      isDateInRange(bill.date, dateFilter.from, dateFilter.to),
    );
    const filterDescription =
      dateFilter.from && dateFilter.to
        ? `${format(dateFilter.from, "MMM dd, yyyy")} to ${format(dateFilter.to, "MMM dd, yyyy")}`
        : dateFilter.from
          ? `from ${format(dateFilter.from, "MMM dd, yyyy")}`
          : `to ${format(dateFilter.to, "MMM dd, yyyy")}`;

    console.log(
      `Date filter: ${filterDescription} - Found ${filtered.length} bills`,
    );
    if (filtered.length > 0) {
      console.log(
        "Filtered bills:",
        filtered.map((bill) => ({
          id: bill.id,
          date: bill.date,
          clientName: bill.clientName,
          status: bill.status,
        })),
      );
    } else {
      console.log("No bills found for the selected date range");
    }
    return filtered;
  };

  const filteredBills = applyDateFilter(
    bills.filter(
      (bill) =>
        bill.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.id.toLowerCase().includes(searchTerm.toLowerCase()),
    ),
  );

  // Handle billing actions
  const handleAddBilling = () => {
    setShowAddForm(true);
  };

  const handleEditBilling = (bill) => {
    setEditingBill(bill);
    setShowAddForm(true);
  };

  const handleDeleteBilling = (bill) => {
    setBillToDelete(bill);
    setShowDeleteConfirm(true);
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      // Map billing status to appointment status
      const statusMap = {
        paid: "completed",
        pending: "scheduled",
        overdue: "cancelled",
        settled: "settled",
      };
      const appointmentStatus = statusMap[newStatus] || newStatus;
      await updateBilling(appointmentId, { status: appointmentStatus });
      toast({
        variant: "success",
        title: "Success!",
        description: "Billing status has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating billing status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update billing status. Please try again.",
      });
    }
  };

  const handleSettle = async (appointmentId) => {
    try {
      // Find the bill to print
      const bill = bills.find((b) => b.id === appointmentId);
      if (bill) {
        setBillToPrint(bill);
        setShowBillPrint(true);
      }
    } catch (error) {
      console.error("Error settling appointment:", error);
    }
  };

  const handleConfirmSettle = async () => {
    setIsSettlingBill(true);
    try {
      if (billToPrint) {
        await updateBilling(billToPrint.id, { status: "settled" });
        setShowBillPrint(false);
        setBillToPrint(null);
        toast({
          variant: "success",
          title: "Success!",
          description: "Bill has been settled successfully.",
        });
      }
    } catch (error) {
      console.error("Error settling appointment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to settle bill. Please try again.",
      });
    } finally {
      setIsSettlingBill(false);
    }
  };

  const handleReprint = (bill) => {
    // Open print modal for reprinting
    setBillToPrint(bill);
    setShowBillPrint(true);
  };

  const handleCreateInvoice = async (invoiceData) => {
    // Generate Bill: ensure client + appointment, update appointment billing, then navigate to preview
    try {
      // 1) Ensure client exists or create one
      const name = (invoiceData?.client?.clientName || "").trim();
      const phone = (invoiceData?.client?.phoneNumber || "").trim();
      const existingClient = (clients || []).find(
        (c) =>
          (c.clientName && c.clientName === name && name) ||
          (phone && (c.phoneNumber === phone || c.PhoneNumber === phone)),
      );
      let clientId =
        existingClient?.clientId ||
        existingClient?.ClientId ||
        existingClient?.id ||
        existingClient?.Id;

      if (!clientId) {
        const newClientPayload = {
          clientName: name || "Walk-in",
          phoneNumber: phone || "",
          emailId: "",
          createdAt: Math.floor(Date.now() / 1000),
        };
        const createdResp = await createClient(newClientPayload);
        const createdClient = createdResp?.client || createdResp;
        clientId =
          createdClient?.clientId ||
          createdClient?.ClientId ||
          createdClient?.id ||
          createdClient?.Id;
      }

      // 2) Determine appointmentId (use selected bill's id if present; else create)
      let appointmentId = billData?.id || billData?.appointmentId;
      const epochNow = Math.floor(Date.now() / 1000);

      // Normalize services/products from cart (invoiceData.services)
      const rawItems = Array.isArray(invoiceData?.services)
        ? invoiceData.services
        : [];
      const serviceItems = rawItems.filter((it) => it.serviceId);
      const productItems = rawItems.filter((it) => it.productId);
      const servicesMapped = serviceItems.map((s) => ({
        serviceName: s.serviceName,
        amount: s.amount,
        duration: s.duration || 0,
      }));
      const productsMapped = productItems.map((p) => ({
        productId: p.productId,
        productName: p.productName,
        amount: p.amount,
        quantity: p.quantity || 1,
      }));
      const serviceCSV = servicesMapped.map((s) => s.serviceName).join(", ");
      let duration = servicesMapped.reduce(
        (sum, s) => sum + (Number(s.duration) || 0),
        0,
      );
      if (!duration || duration <= 0) duration = 1; // Minimum 1

      // invoiceData.staff carries the selected staff option value (likely b.id). Map to staffId if present.
      const staffObj = (barbers || []).find(
        (b) => b.id === invoiceData?.staff || b.staffId === invoiceData?.staff,
      );
      const staffId =
        staffObj?.staffId || staffObj?.id || invoiceData?.staff || "";

      if (!appointmentId) {
        // Create a new appointment only (no update)
        const createPayload = {
          clientId,
          clientName: name,
          phoneNumber: phone,
          services: servicesMapped,
          products: productsMapped,
          service: serviceCSV,
          duration,
          dateTime: epochNow, // epoch format
          subtotal: Number(invoiceData?.subtotal || 0),
          tax: Number(invoiceData?.tax || 0),
          gstPercent: Number(invoiceData?.gstPercent || 0),
          discount: Number(invoiceData?.discount || 0),
          discountAmount: Number(invoiceData?.discount || 0),
          total: Number(
            invoiceData?.finalAmount != null
              ? invoiceData.finalAmount
              : invoiceData?.total || 0,
          ),
          amount: Number(invoiceData?.subtotal || 0),
          staffId,
          createdAt: epochNow,
        };
        const resp = await createAppointment(createPayload);
        const created = resp?.appointment || resp;
        appointmentId = created?.appointmentId || created?.id || created?.Id;

        if (!appointmentId) {
          throw new Error("No appointmentId returned from createAppointment");
        }

        // Prepare bill state for preview
        const billForState = {
          id: appointmentId,
          clientName: name,
          phoneNumber: phone,
          date: new Date(epochNow * 1000),
          services: servicesMapped.map((s) => s.serviceName),
          subtotal: createPayload.subtotal,
          tax: createPayload.tax,
          gstPercent: createPayload.gstPercent,
          total: createPayload.total,
          discount: createPayload.discount,
          discountAmount: createPayload.discount, // expose for preview
          staff: invoiceData?.staff || "",
          paymentMethod: "",
          status: "completed",
        };

        // Fetch fresh appointments and use the returned list to find the created one
        const list = (await fetchAppointments()) || [];
        const found = list.find((a) => {
          const aid = String(appointmentId);
          const candidates = [a?.appointmentId, a?.id, a?.Id, a?.appointment_id]
            .filter(Boolean)
            .map(String);
          return candidates.includes(aid);
        });

        navigate(`/dashboard/billing/preview/${appointmentId}`, {
          state: {
            bill: billForState,
            appointment: found || null,
            mode: "generate",
          },
        });
      } else {
        // Update existing appointment only (no create)
        const updatePayload = {
          appointmentId,
          clientId,
          clientName: name,
          phoneNumber: phone,
          services: servicesMapped,
          products: productsMapped,
          service: serviceCSV,
          duration,
          dateTime: epochNow, // keep epoch
          subtotal: Number(invoiceData?.subtotal || 0),
          tax: Number(invoiceData?.tax || 0),
          gstPercent: Number(invoiceData?.gstPercent || 0),
          discount: Number(invoiceData?.discount || 0),
          discountAmount: Number(invoiceData?.discount || 0),
          total: Number(
            invoiceData?.finalAmount != null
              ? invoiceData.finalAmount
              : invoiceData?.total || 0,
          ),
          amount: Number(invoiceData?.subtotal || 0),
          staffId,
          paymentMode: "",
          paymentPlatform: "",
        };

        await updateAppointmentBilling(appointmentId, updatePayload);

        const billForState = {
          id: appointmentId,
          clientName: name,
          phoneNumber: phone,
          date: new Date(epochNow * 1000),
          services: servicesMapped.map((s) => s.serviceName),
          subtotal: updatePayload.subtotal,
          tax: updatePayload.tax,
          gstPercent: updatePayload.gstPercent,
          total: updatePayload.total,
          discount: updatePayload.discount,
          discountAmount: updatePayload.discount, // expose for preview
          staff: invoiceData?.staff || "",
          paymentMethod: "",
          status: "completed",
        };

        // Fetch fresh appointments and use the returned list to find the updated one
        const list = (await fetchAppointments()) || [];
        const found = list.find((a) => {
          const aid = String(appointmentId);
          const candidates = [a?.appointmentId, a?.id, a?.Id, a?.appointment_id]
            .filter(Boolean)
            .map(String);
          return candidates.includes(aid);
        });

        navigate(`/dashboard/billing/preview/${appointmentId}`, {
          state: {
            bill: billForState,
            appointment: found || null,
            mode: "generate",
          },
        });
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate bill. Please try again.",
      });
    }
  };

  const formatCurrency = (amount, currency = "INR") => {
    // Choose locale based on currency
    const locale = currency === "INR" ? "en-IN" : "en-US";

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  // Export data to CSV
  const handleExportToCSV = () => {
    const dataToExport = dateFilter.isActive ? filteredBills : bills;

    if (dataToExport.length === 0) {
      toast({
        title: "No Data",
        description: "There is no data to export.",
        variant: "destructive",
      });
      return;
    }

    // Create CSV headers
    const headers = [
      "Invoice ID",
      "Client Name",
      "Date",
      "Services",
      "Subtotal",
      "Tax",
      "Discount",
      "Total",
      "Status",
      "Payment Method",
      "Staff",
      "Duration (min)",
    ];

    // Create CSV rows
    const rows = dataToExport.map((bill) => [
      bill.id,
      bill.clientName,
      bill.date,
      Array.isArray(bill.services)
        ? bill.services.join("; ")
        : bill.services || "",
      bill.subtotal || 0,
      bill.tax || 0,
      bill.discountAmount || 0,
      bill.total || 0,
      bill.status,
      bill.paymentMethod,
      bill.staff,
      bill.duration || 0,
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => {
            // Escape quotes and wrap in quotes if contains comma
            const cellStr = String(cell);
            if (cellStr.includes(",") || cellStr.includes('"')) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          })
          .join(","),
      ),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    const fileName = dateFilter.isActive
      ? `billing_data_${dateFilter.from ? format(dateFilter.from, "yyyy-MM-dd") : "all"}_to_${dateFilter.to ? format(dateFilter.to, "yyyy-MM-dd") : "all"}.csv`
      : `billing_data_all_${new Date().toISOString().split("T")[0]}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `Exported ${dataToExport.length} records to CSV.`,
    });
  };

  // Export data to Excel
  const handleExportToExcel = () => {
    const dataToExport = dateFilter.isActive ? filteredBills : bills;

    if (dataToExport.length === 0) {
      toast({
        title: "No Data",
        description: "There is no data to export.",
        variant: "destructive",
      });
      return;
    }

    // Create Excel XML format
    const headers = [
      "Invoice ID",
      "Client Name",
      "Date",
      "Services",
      "Subtotal",
      "Tax",
      "Discount",
      "Total",
      "Status",
      "Payment Method",
      "Staff",
      "Duration (min)",
    ];

    let excelContent = `<?xml version="1.0"?>
      <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
        xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:x="urn:schemas-microsoft-com:office:excel"
        xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
        xmlns:html="http://www.w3.org/TR/REC-html40">
        <Worksheet ss:Name="Billing Data">
          <Table>
            <Row>`;

    // Add headers
    headers.forEach((header) => {
      excelContent += `<Cell><Data ss:Type="String">${header}</Data></Cell>`;
    });
    excelContent += `</Row>`;

    // Add data rows
    dataToExport.forEach((bill) => {
      excelContent += `<Row>`;
      const rowData = [
        bill.id,
        bill.clientName,
        bill.date,
        Array.isArray(bill.services)
          ? bill.services.join("; ")
          : bill.services || "",
        bill.subtotal || 0,
        bill.tax || 0,
        bill.discountAmount || 0,
        bill.total || 0,
        bill.status,
        bill.paymentMethod,
        bill.staff,
        bill.duration || 0,
      ];

      rowData.forEach((cell, index) => {
        const isNumber = (index >= 4 && index <= 7) || index === 11;
        const type = isNumber ? "Number" : "String";
        const value = String(cell)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        excelContent += `<Cell><Data ss:Type="${type}">${value}</Data></Cell>`;
      });
      excelContent += `</Row>`;
    });

    excelContent += `</Table></Worksheet></Workbook>`;

    // Create blob and download
    const blob = new Blob([excelContent], { type: "application/vnd.ms-excel" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    const fileName = dateFilter.isActive
      ? `billing_data_${dateFilter.from ? format(dateFilter.from, "yyyy-MM-dd") : "all"}_to_${dateFilter.to ? format(dateFilter.to, "yyyy-MM-dd") : "all"}.xls`
      : `billing_data_all_${new Date().toISOString().split("T")[0]}.xls`;

    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `Exported ${dataToExport.length} records to Excel.`,
    });
  };

  // Export data to PDF
  const handleExportToPDF = () => {
    const dataToExport = dateFilter.isActive ? filteredBills : bills;

    if (dataToExport.length === 0) {
      toast({
        title: "No Data",
        description: "There is no data to export.",
        variant: "destructive",
      });
      return;
    }

    const institutionName =
      institutionData?.companyName ||
      institutionData?.institutionName ||
      "Salon";

    // Create HTML content for PDF
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Billing Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .institute-name { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 10px; }
          h1 { color: #555; font-size: 20px; margin: 10px 0; }
          .meta { text-align: center; color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #f4f4f4; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .status { padding: 2px 6px; border-radius: 3px; font-size: 10px; }
          .status-completed { background-color: #dcfce7; color: #166534; }
          .status-pending { background-color: #fef3c7; color: #92400e; }
          .status-cancelled { background-color: #fee2e2; color: #991b1b; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="institute-name">${institutionName}</div>
          <h1>Billing Report</h1>
        </div>
        <div class="meta">
          ${
            dateFilter.isActive
              ? `<p>Date Range: ${dateFilter.from ? format(dateFilter.from, "MMM dd, yyyy") : "All"} to ${dateFilter.to ? format(dateFilter.to, "MMM dd, yyyy") : "All"}</p>`
              : "<p>All Time Report</p>"
          }
          <p>Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
          <p>Total Records: ${dataToExport.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Client Name</th>
              <th>Date</th>
              <th>Services</th>
              <th>Subtotal</th>
              <th>Tax</th>
              <th>Discount</th>
              <th>Total</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Staff</th>
            </tr>
          </thead>
          <tbody>`;

    dataToExport.forEach((bill) => {
      const statusClass =
        bill.status === "completed"
          ? "status-completed"
          : bill.status === "pending"
            ? "status-pending"
            : "status-cancelled";

      htmlContent += `
        <tr>
          <td>${bill.id}</td>
          <td>${bill.clientName}</td>
          <td>${bill.date}</td>
          <td>${Array.isArray(bill.services) ? bill.services.join(", ") : bill.services || ""}</td>
          <td>₹${(bill.subtotal || 0).toFixed(2)}</td>
          <td>₹${(bill.tax || 0).toFixed(2)}</td>
          <td>₹${(bill.discountAmount || 0).toFixed(2)}</td>
          <td>₹${(bill.total || 0).toFixed(2)}</td>
          <td><span class="status ${statusClass}">${bill.status.toUpperCase()}</span></td>
          <td>${bill.paymentMethod}</td>
          <td>${bill.staff}</td>
        </tr>`;
    });

    htmlContent += `
          </tbody>
        </table>
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>`;

    // Create hidden iframe for printing
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    // Write content to iframe and trigger print
    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();

    // Remove iframe after printing
    iframe.contentWindow.onafterprint = () => {
      document.body.removeChild(iframe);
    };

    toast({
      title: "PDF Export",
      description: "Opening print dialog for PDF export...",
    });
  };

  // Calculate revenue from filtered bills
  const filteredRevenue = filteredBills
    .filter(
      (b) =>
        b.status === "completed" ||
        b.status === "paid" ||
        b.status === "settled",
    )
    .reduce((sum, bill) => sum + bill.total, 0);
  const filteredPendingAmount = filteredBills
    .filter(
      (b) =>
        b.status === "scheduled" ||
        b.status === "confirmed" ||
        b.status === "pending" ||
        b.status === "in_progress",
    )
    .reduce((sum, bill) => sum + bill.total, 0);
  const filteredOverdueAmount = filteredBills
    .filter((b) => b.status === "cancelled" || b.status === "overdue")
    .reduce((sum, bill) => sum + bill.total, 0);

  // Keep original calculations for all-time data
  const totalRevenue = bills
    .filter(
      (b) =>
        b.status === "completed" ||
        b.status === "paid" ||
        b.status === "settled",
    )
    .reduce((sum, bill) => sum + bill.total, 0);
  const pendingAmount = bills
    .filter(
      (b) =>
        b.status === "scheduled" ||
        b.status === "confirmed" ||
        b.status === "pending" ||
        b.status === "in_progress",
    )
    .reduce((sum, bill) => sum + bill.total, 0);
  const overdueAmount = bills
    .filter((b) => b.status === "cancelled" || b.status === "overdue")
    .reduce((sum, bill) => sum + bill.total, 0);

  // Use filtered amounts when date filter is active
  const displayRevenue = dateFilter.isActive ? filteredRevenue : totalRevenue;
  const displayPending = dateFilter.isActive
    ? filteredPendingAmount
    : pendingAmount;
  const displayOverdue = dateFilter.isActive
    ? filteredOverdueAmount
    : overdueAmount;

  if (loader) {
    return (
      <div className="poppins-regular flex h-64 items-center justify-center">
        <ScissorsLoader text="Loading billing data..." />
      </div>
    );
  }

  return (
    <div className="p-3.5 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 font-sans bg-[#f8fafc] min-h-full">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Billing & Invoices
          </h1>
          <p className="text-slate-600">
            Manage your salon billing and payment tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export Button with Dropdown */}
          <div className="export-dropdown-container relative">
            <Button
              variant="outline"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="border-slate-200 text-slate-600 hover:bg-slate-50"
              title={
                dateFilter.isActive ? "Export filtered data" : "Export all data"
              }
            >
              <Download className="mr-2 h-4 w-4" />
              Export {dateFilter.isActive ? "Filtered" : "All"}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>

            {/* Export Dropdown Menu */}
            {showExportMenu && (
              <div className="absolute left-0 top-full z-50 mt-2 w-48 rounded-lg border border-slate-200 bg-white shadow-lg">
                <div className="py-1">
                  <button
                    onClick={() => {
                      handleExportToExcel();
                      setShowExportMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Export as Excel
                  </button>
                  <button
                    onClick={() => {
                      handleExportToPDF();
                      setShowExportMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <FileText className="h-4 w-4" />
                    Export as PDF
                  </button>
                </div>
              </div>
            )}
          </div>

          <Button
            variant={activeSubPage === "overview" ? "default" : "outline"}
            onClick={() => {
              setActiveSubPage("overview");
              setBillData(null);
            }}
            className={
              activeSubPage === "overview"
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }
          >
            Overview
          </Button>
          <Button
            variant={activeSubPage === "create-invoice" ? "default" : "outline"}
            onClick={() => {
              setActiveSubPage("create-invoice");
              handleAddBilling();
            }}
            className={
              activeSubPage === "create-invoice"
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>

          {/* Date Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-auto justify-start text-left font-normal",
                  !dateFilter.from && !dateFilter.to && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFilter.from ? (
                  dateFilter.to ? (
                    <>
                      {format(dateFilter.from, "LLL dd, y")} -{" "}
                      {format(dateFilter.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateFilter.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={dateFilter.from}
                selected={{ from: dateFilter.from, to: dateFilter.to }}
                onSelect={(range) => {
                  setDateFilter({
                    from: range?.from,
                    to: range?.to,
                    isActive: !!(range?.from || range?.to),
                  });
                }}
                numberOfMonths={2}
              />
              {(dateFilter.from || dateFilter.to) && (
                <div className="border-t p-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDateFilter({
                        from: undefined,
                        to: undefined,
                        isActive: false,
                      });
                    }}
                    className="w-full"
                  >
                    Clear Filter
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Conditional Content Based on Active Sub Page */}
      {activeSubPage === "overview" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600">
                      {dateFilter.isActive
                        ? "Filtered Revenue"
                        : "Total Revenue"}
                    </p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(displayRevenue)}
                    </p>
                    {dateFilter.isActive && (
                      <p className="text-xs text-slate-500">
                        All time: {formatCurrency(totalRevenue)}
                      </p>
                    )}
                  </div>
                  <FaDollarSign className="h-5 w-5 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600">
                      {dateFilter.isActive ? "Filtered Cash" : "Cash Payments"}
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency(
                        (dateFilter.isActive ? filteredBills : bills)
                          .filter(
                            (b) => b.paymentMethod?.toLowerCase() === "cash",
                          )
                          .reduce((sum, bill) => sum + bill.total, 0),
                      )}
                    </p>
                    {dateFilter.isActive && (
                      <p className="text-xs text-slate-500">
                        All time:{" "}
                        {formatCurrency(
                          bills
                            .filter(
                              (b) => b.paymentMethod?.toLowerCase() === "cash",
                            )
                            .reduce((sum, bill) => sum + bill.total, 0),
                        )}
                      </p>
                    )}
                  </div>
                  <FaMoneyBillWave className="h-5 w-5 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600">
                      {dateFilter.isActive
                        ? "Filtered Online"
                        : "Online Payments"}
                    </p>
                    <p className="text-lg font-bold text-purple-600">
                      {formatCurrency(
                        (dateFilter.isActive ? filteredBills : bills)
                          .filter(
                            (b) => b.paymentMethod?.toLowerCase() !== "cash",
                          )
                          .reduce((sum, bill) => sum + bill.total, 0),
                      )}
                    </p>
                    {dateFilter.isActive && (
                      <p className="text-xs text-slate-500">
                        All time:{" "}
                        {formatCurrency(
                          bills
                            .filter(
                              (b) => b.paymentMethod?.toLowerCase() !== "cash",
                            )
                            .reduce((sum, bill) => sum + bill.total, 0),
                        )}
                      </p>
                    )}
                  </div>
                  <FaCreditCard className="h-5 w-5 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600">
                      {dateFilter.isActive
                        ? "Filtered Invoices"
                        : "Total Invoices"}
                    </p>
                    <p className="text-lg font-bold text-slate-600">
                      {filteredBills.length}
                    </p>
                    {dateFilter.isActive && (
                      <p className="text-xs text-slate-500">
                        All time: {bills.length}
                      </p>
                    )}
                  </div>
                  <FaBook className="h-5 w-5 text-slate-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search, Stats, and View Toggle */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-slate-400" />
              <Input
                placeholder="Search invoices by client name or invoice ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-slate-200 pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                Completed:{" "}
                {
                  filteredBills.filter(
                    (b) =>
                      b.status === "completed" ||
                      b.status === "paid" ||
                      b.status === "settled",
                  ).length
                }
              </Badge>
              <Badge
                variant="secondary"
                className="bg-yellow-100 text-yellow-800"
              >
                Pending:{" "}
                {
                  filteredBills.filter(
                    (b) =>
                      b.status === "scheduled" ||
                      b.status === "confirmed" ||
                      b.status === "pending" ||
                      b.status === "in_progress",
                  ).length
                }
              </Badge>
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                Cancelled:{" "}
                {
                  filteredBills.filter(
                    (b) => b.status === "cancelled" || b.status === "overdue",
                  ).length
                }
              </Badge>
              {dateFilter.isActive && (
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800"
                >
                  Filtered: {filteredBills.length} / {bills.length}
                </Badge>
              )}
            </div>
            <div className="flex gap-1 rounded-lg border border-slate-200 p-1">
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className={`h-8 w-8 p-0 rounded-lg cursor-pointer ${viewMode === "table" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                <Table className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`h-8 w-8 p-0 rounded-lg cursor-pointer ${viewMode === "grid" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Dynamic View Based on Selection */}
          {viewMode === "table" && (
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-slate-900">
                  Invoices & Bills - Table View
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <TableComponent>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24 text-slate-600">
                          ID
                        </TableHead>
                        <TableHead className="min-w-32 text-slate-600">
                          Client
                        </TableHead>
                        <TableHead className="w-24 text-slate-600">
                          Date
                        </TableHead>
                        <TableHead className="min-w-40 text-slate-600">
                          Services
                        </TableHead>
                        <TableHead className="w-20 text-slate-600">
                          Staff
                        </TableHead>
                        <TableHead className="w-20 text-slate-600">
                          Payment
                        </TableHead>
                        <TableHead className="w-20 text-slate-600">
                          Subtotal
                        </TableHead>
                        <TableHead className="w-16 text-slate-600">
                          Tax
                        </TableHead>
                        <TableHead className="w-20 text-slate-600">
                          Total
                        </TableHead>
                        <TableHead className="w-24 text-slate-600">
                          Status
                        </TableHead>
                        <TableHead className="w-32 text-slate-600">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBills.map((bill) => (
                        <TableRow key={bill.id} className="hover:bg-slate-50">
                          <TableCell className="truncate text-xs font-medium text-slate-900">
                            {bill.id}
                          </TableCell>
                          <TableCell className="truncate text-sm text-slate-900">
                            {bill.clientName}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-slate-500" />
                              <span className="text-xs text-slate-900">
                                {bill.date}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {bill.services
                                .slice(0, 1)
                                .map((service, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="border-slate-200 px-1 py-0 text-xs text-slate-600"
                                  >
                                    {service}
                                  </Badge>
                                ))}
                              {bill.services.length > 1 && (
                                <Badge
                                  variant="outline"
                                  className="border-slate-200 px-1 py-0 text-xs text-slate-600"
                                >
                                  +{bill.services.length - 1}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="truncate text-xs text-slate-900">
                              {bill.staff}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="truncate text-xs text-slate-900">
                              {bill.paymentMethod}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-slate-900">
                            {formatCurrency(bill.subtotal)}
                          </TableCell>
                          <TableCell className="text-xs text-slate-900">
                            {formatCurrency(bill.tax)}
                          </TableCell>
                          <TableCell className="text-xs font-medium text-slate-900">
                            {formatCurrency(bill.total)}
                          </TableCell>
                          <TableCell>{getStatusBadge(bill.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-0.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-slate-100"
                                title="View invoice"
                                onClick={() => {
                                  setBillData(bill);
                                  setActiveSubPage("create-invoice");
                                }}
                              >
                                <Eye className="h-3 w-3 text-slate-600" />
                              </Button>
                              {bill.status === "in_progress" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-green-100"
                                  onClick={() => handleSettle(bill.id)}
                                  title="Settle"
                                >
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                </Button>
                              )}
                              {bill.status === "settled" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-blue-100"
                                  onClick={() => handleReprint(bill)}
                                  title="Reprint"
                                >
                                  <Download className="h-3 w-3 text-blue-600" />
                                </Button>
                              )}
                              {(bill.status === "scheduled" ||
                                bill.status === "confirmed" ||
                                bill.status === "pending") && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-green-100"
                                  onClick={() =>
                                    handleStatusUpdate(bill.id, "completed")
                                  }
                                  title="Mark as completed"
                                >
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-slate-100"
                                onClick={() => handleEditBilling(bill)}
                                title="Edit invoice"
                              >
                                <Edit className="h-3 w-3 text-slate-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </TableComponent>
                </div>
              </CardContent>
            </Card>
          )}

          {viewMode === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {filteredBills.map((bill) => {
                const clientInitials = (bill.clientName || "CL").slice(0, 2).toUpperCase();
                return (
                  <div
                    key={bill.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all p-4 flex flex-col justify-between gap-3 group relative overflow-hidden"
                  >
                    {/* Header: Client & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
                          {clientInitials}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-slate-900 truncate">
                            {bill.clientName || "Walk-in Client"}
                          </h3>
                          <span className="text-[11px] font-mono font-medium text-slate-400">
                            #{bill.id}
                          </span>
                        </div>
                      </div>
                      {getStatusBadge(bill.status)}
                    </div>

                    {/* Details Box */}
                    <div className="bg-slate-50/80 rounded-xl p-3 space-y-2 border border-slate-100 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>{bill.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                          <CreditCard className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="capitalize">{bill.paymentMethod || "Cash"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-600 text-[11px] pt-1 border-t border-slate-200/60">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Stylist: <strong className="text-slate-800 font-semibold">{bill.staff || "Any"}</strong></span>
                      </div>

                      {/* Services Pills */}
                      {bill.services && bill.services.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {bill.services.slice(0, 3).map((service, index) => (
                            <span
                              key={index}
                              className="text-[10px] font-medium bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-700 truncate max-w-[140px]"
                            >
                              {service}
                            </span>
                          ))}
                          {bill.services.length > 3 && (
                            <span className="text-[10px] font-bold bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md text-slate-600">
                              +{bill.services.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Financials & Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 leading-tight">
                          Sub: {formatCurrency(bill.subtotal)}
                        </div>
                        <div className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                          {formatCurrency(bill.total)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                          title="View invoice"
                          onClick={() => {
                            setBillData(bill);
                            setActiveSubPage("create-invoice");
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {bill.status === "completed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg hover:bg-blue-50 text-blue-600 cursor-pointer"
                            onClick={() => handleReprint(bill)}
                            title="Reprint Receipt"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                          onClick={() => handleEditBilling(bill)}
                          title="Edit invoice"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filteredBills.length === 0 && (
            <div className="py-12 text-center">
              <CreditCard className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <h3 className="mb-2 text-lg font-medium text-slate-600">
                No invoices found
              </h3>
              <p className="text-slate-500">
                Try adjusting your search criteria
              </p>
            </div>
          )}
        </>
      )}

      {activeSubPage === "create-invoice" && (
        <CreateInvoicePage
          handleCreateInvoice={handleCreateInvoice}
          billData={billData}
          bills={bills}
          onExit={() => {
            setBillData(null);
            setActiveSubPage("overview");
          }}
        />
      )}

      {/* Bill Print Modal */}
      <BillPrintModal
        isOpen={showBillPrint}
        onClose={() => {
          setShowBillPrint(false);
          setBillToPrint(null);
        }}
        bill={billToPrint}
        onConfirmSettle={handleConfirmSettle}
        isReprint={billToPrint?.status === "settled"}
        isSettling={isSettlingBill}
      />
    </div>
  );
};

const generateClientId = () => {
  const currentEpoch = Math.floor(Date.now() / 1000);
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CLT${currentEpoch.toString().slice(-6)}${randomSuffix}`;
};

// Create Invoice Page Component
const CreateInvoicePage = ({
  handleCreateInvoice,
  billData,
  onExit,
  bills,
}) => {
  const { institutionData, userData } = useContext(Context);
  const { clients, services, products, barbers, updateAppointmentBilling } =
    useContext(Context);
  const primaryColor = institutionData?.PrimaryColor || "#6366f1";
  const [selectedCategory, setSelectedCategory] = useState("best-seller");
  const [showProducts, setShowProducts] = useState(false); // Toggle: false = services, true = products
  const [cart, setCart] = useState([]);
  const [client, setClient] = useState({ clientName: "", phoneNumber: "" });
  const [selectedStaff, setSelectedStaff] = useState("");
  const [includeGST, setIncludeGST] = useState(true);
  const [finalBillAmount, setFinalBillAmount] = useState("");
  const [discountType, setDiscountType] = useState("amount");
  const [discountValue, setDiscountValue] = useState("");
  const [selectedGst, setSelectedGst] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [paymentMode, setPaymentMode] = useState("");
  const [paymentPlatform, setPaymentPlatform] = useState("");
  const [open, setOpen] = useState(false);
  const [isSettling, setIsSettling] = useState(false);

  // Payment platform options based on mode
  const platformOptions = {
    upi: [
      "PhonePe",
      "Paytm",
      "Google Pay",
      "BHIM",
      "Amazon Pay",
      "Mobikwik",
      "Freecharge",
      "CRED",
      "WhatsApp Pay",
      "Other",
    ],
    debitCard: ["Visa", "Mastercard", "RuPay"],
    creditCard: ["Visa", "Mastercard", "Amex"],
    cash: ["Cash Payment"],
  };

  // Icons for categories
  const categoryIcons = {
    "Best Seller": Star,
    Facial: Sparkles,
    "Hair Styling": Scissors,
    "Hair Treatment": Heart,
    "Tattoo & Piercing": Zap,
    "Basic Service": Shield,
    "Beard & Shave Service": Scissors,
    Bleach: Droplets,
    "Nail Services": Palette,
    Pedicure: Heart,
    "Waxing Services": Sparkles,
  };

  // Normalize category string to a stable id (e.g., "Best Seller" -> "best-seller")
  const normalizeCategoryId = (name) =>
    (name || "").toString().trim().toLowerCase().replace(/\s+/g, "-");

  // Extract categories for services or products
  const extractCategoriesWithIcons = (items) => {
    if (!Array.isArray(items)) return [];
    const uniqueCategories = [
      ...new Set(
        items
          .map((item) => item?.category)
          .filter((cat) => typeof cat === "string" && cat.trim() !== ""),
      ),
    ];
    const categories = uniqueCategories.map((category) => ({
      id: normalizeCategoryId(category),
      name: category,
      icon: categoryIcons[category] || Scissors,
    }));

    // Sort categories to put "Best Seller" at the top for services
    if (!showProducts) {
      return categories.sort((a, b) => {
        if (a.name.toLowerCase() === "best seller") return -1;
        if (b.name.toLowerCase() === "best seller") return 1;
        return a.name.localeCompare(b.name);
      });
    }

    return categories;
  };

  // console.log("products:", products);

  const activeList = showProducts ? products : services;
  // console.log("Active List:", activeList);

  const categories = extractCategoriesWithIcons(activeList);

  // Get category name from id for filtering
  const getCategoryName = (id) => {
    const cat = categories.find((c) => c.id === id);
    return cat?.name || "";
  };
  // Convert duration in seconds to HH:MM or MM:SS
  function formatDuration(durationStr) {
    if (!durationStr) return null;

    // Split API string into hours and minutes
    const [hours, minutes] = durationStr?.split(":").map(Number);

    // Convert total to minutes (or seconds if needed)
    const totalMinutes = hours * 60 + minutes;

    // Convert back to HH:MM format for display
    const displayHours = Math.floor(totalMinutes / 60);
    const displayMinutes = totalMinutes % 60;

    return `${String(displayHours).padStart(2, "0")}:${String(displayMinutes).padStart(2, "0")}`;
  }

  const filteredItems = activeList
    .filter((item) => {
      const itemCategoryId = normalizeCategoryId(item?.category);
      return itemCategoryId === selectedCategory;
    })
    .sort((a, b) => Number(a?.amount || 0) - Number(b?.amount || 0));

  // Add to cart with quantity support for products
  const addToCart = (item) => {
    if (showProducts) {
      const existingProduct = cart.find(
        (it) => it.productId === item.productId,
      );

      if (existingProduct) {
        // Increment quantity if product exists
        setCart((prev) =>
          prev.map((it) =>
            it.productId === item.productId
              ? { ...it, quantity: (it.quantity || 1) + 1 }
              : it,
          ),
        );
      } else {
        // Add new product with quantity = 1
        setCart((prev) => [...prev, { ...item, quantity: 1 }]);
      }
    } else {
      // Services: only allow one, no quantity
      const exists = cart.find((it) => it.serviceId === item.serviceId);
      if (!exists) setCart((prev) => [...prev, item]);
    }
  };

  // Remove product/service from cart (or decrement quantity)
  const removeFromCart = (itemId) => {
    if (showProducts) {
      setCart((prev) =>
        prev
          .map((it) =>
            it.productId === itemId
              ? { ...it, quantity: (it.quantity || 1) - 1 }
              : it,
          )
          // Only remove products whose quantity hits 0; keep services as-is
          .filter((it) => (it.productId ? (it.quantity || 0) > 0 : true)),
      );
    } else {
      setCart((prev) => prev.filter((it) => it.serviceId !== itemId));
    }
  };
  // Update quantity of a product in cart
  const updateProductQuantity = (productId, newQuantity) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: newQuantity }
            : item,
        )
        // Only remove products with qty <= 0; keep services untouched
        .filter((item) => (item.productId ? (item.quantity || 0) > 0 : true)),
    );
  };

  // Format currency
  const formatCurrency = (amount, currency = "INR") => {
    const locale = currency === "INR" ? "en-IN" : "en-US";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  // Get total of cart items
  // Get total of cart items
  const getTotal = () => {
    return cart?.reduce((sum, item) => {
      const quantity = showProducts ? item.quantity || 1 : 1;
      return sum + (item.amount || 0) * quantity;
    }, 0);
  };

  // GST Amount calculation
  const getGSTAmount = () => {
    return includeGST ? (getTotal() * selectedGst) / 100 : 0;
  };

  // Final total including GST
  const getFinalTotal = () => {
    return getTotal() + getGSTAmount();
  };

  // Discount calculation
  const getCalculatedDiscount = () => {
    if (!discountValue) return 0;
    const parsedDiscountValue = parseFloat(discountValue);

    // Check for invalid discount values
    if (!isFinite(parsedDiscountValue) || parsedDiscountValue < 0) return 0;

    if (discountType === "percentage") {
      const total = getFinalTotal();
      if (!isFinite(total) || total <= 0) return 0;

      const calculatedDiscount = (total * parsedDiscountValue) / 100;
      return isFinite(calculatedDiscount) ? Math.max(0, calculatedDiscount) : 0;
    } else {
      return parsedDiscountValue;
    }
  };

  // Discounted total after applying discount
  const getDiscountedTotal = () => {
    return Math.max(0, getFinalTotal() - getCalculatedDiscount());
  };

  // Display discount value based on final bill amount input
  const getDisplayedDiscount = () => {
    if (!finalBillAmount) return discountValue || 0;
    const total = getFinalTotal();
    const final = parseFloat(finalBillAmount);

    // Handle edge cases to prevent crashes
    if (total <= 0 || !isFinite(total) || !isFinite(final)) {
      return 0;
    }

    if (discountType === "percentage") {
      const percentage = ((total - final) / total) * 100;
      // Ensure the result is a valid number
      return isFinite(percentage) ? Math.max(0, percentage) : 0;
    } else {
      const amount = total - final;
      return isFinite(amount) ? Math.max(0, amount) : 0;
    }
  };

  // Handle discount input and validation
  const handleFinalBillAmountChange = (value) => {
    const total = getFinalTotal();
    const entered = parseFloat(value) || 0;

    // Check for invalid total to prevent crashes
    if (!isFinite(total) || total <= 0) {
      setErrorMessage("Invalid total amount");
      return;
    }

    if (entered > total) {
      setErrorMessage(`Amount cannot exceed ₹${total.toFixed(2)}`);
      return;
    } else {
      setErrorMessage("");
      setFinalBillAmount(value);
      if (discountType === "percentage") {
        if (entered < total && entered > 0) {
          const percentage = ((total - entered) / total) * 100;
          if (isFinite(percentage) && percentage >= 0) {
            setDiscountValue(percentage.toFixed(2));
          } else {
            setDiscountValue("");
          }
        } else {
          setDiscountValue("");
        }
      } else {
        if (entered < total && entered > 0) {
          const amount = total - entered;
          if (isFinite(amount) && amount >= 0) {
            setDiscountValue(amount.toString());
          } else {
            setDiscountValue("");
          }
        } else {
          setDiscountValue("");
        }
      }
    }
  };

  // When discount value changes, recompute the final bill amount accordingly
  const handleDiscountChange = (value) => {
    setDiscountValue(value);
    const total = getFinalTotal();
    if (value === "" || !isFinite(total) || total <= 0) {
      setFinalBillAmount("");
      return;
    }
    const parsed = parseFloat(value);
    if (!isFinite(parsed) || parsed < 0) {
      setFinalBillAmount("");
      return;
    }
    let discountAmt = 0;
    if (discountType === "percentage") {
      const pct = Math.min(Math.max(parsed, 0), 100);
      discountAmt = (total * pct) / 100;
    } else {
      discountAmt = parsed;
    }
    const final = Math.max(0, total - discountAmt);
    setFinalBillAmount(final.toFixed(2));
  };

  // When discount type changes, recompute final using the current discount value
  const handleDiscountTypeChange = (type) => {
    setDiscountType(type);
    const total = getFinalTotal();
    if (!discountValue || !isFinite(total) || total <= 0) {
      setFinalBillAmount("");
      return;
    }
    const parsed = parseFloat(discountValue);
    if (!isFinite(parsed) || parsed < 0) {
      setFinalBillAmount("");
      return;
    }
    let discountAmt = 0;
    if (type === "percentage") {
      const pct = Math.min(Math.max(parsed, 0), 100);
      // Normalize the input if it was out-of-range
      if (pct !== parsed) {
        setDiscountValue(String(pct));
      }
      discountAmt = (total * pct) / 100;
    } else {
      discountAmt = parsed;
    }
    const final = Math.max(0, total - discountAmt);
    setFinalBillAmount(final.toFixed(2));
  };

  // Filter clients for suggestions
  const filteredClients = clients.filter((c) =>
    c.clientName?.toLowerCase().includes(client.clientName.toLowerCase()),
  );

  // Select client from suggestions
  const handleSelect = (selectedClient) => {
    console.log("Selected client:", selectedClient);

    setClient({
      clientName: selectedClient.clientName,
      phoneNumber: selectedClient.phoneNumber,
    });
    setShowSuggestions(false);
  };

  // Set Invoice from billData on load and reset on unmount
  const handleSetInvoiceFromBillData = (billData) => {
    console.log("[GST-DEBUG] handleSetInvoiceFromBillData: incoming billData", {
      gstPercent: billData?.gstPercent,
      tax: billData?.tax,
      subtotal: billData?.subtotal,
      total: billData?.total,
      services: billData?.services,
      staff: billData?.staff,
      id: billData?.id,
    });
    const clientMatch = clients.find(
      (c) => c.clientName === billData.clientName,
    );
    const phoneNumber = clientMatch ? clientMatch.phoneNumber : "";
    setClient({
      clientName: billData.clientName || "",
      phoneNumber: phoneNumber,
    });
    setSelectedStaff(billData.staff.split("-")[0] || "");
    const updatedCart = billData.services
      .map((serviceName) => services.find((s) => s.serviceName === serviceName))
      .filter(Boolean);
    setCart(updatedCart);

    // Preselect GST based strictly on tax and subtotal (percent is not stored)
    const supportedGstOptions = [0, 2.5, 9, 20, 24];
    const snapNearest = (val) =>
      supportedGstOptions.reduce(
        (a, b) => (Math.abs(b - val) < Math.abs(a - val) ? b : a),
        supportedGstOptions[0],
      );
    const taxAmt = Number(billData.tax) || 0;
    const subAmt = Number(billData.subtotal) || 0;
    const totalAmt = Number(billData.total) || 0;
    console.log("[GST-DEBUG] parsed values (ignoring stored gstPercent)", {
      taxAmt,
      subAmt,
      supportedGstOptions,
    });
    // Infer from subtotal and tax amount (subtotal is pre-discount)
    if (subAmt > 0) {
      const inferred = (taxAmt / subAmt) * 100;
      const snapped = snapNearest(inferred);
      console.log("[GST-DEBUG] inferred from tax/subtotal:", {
        taxAmt,
        subAmt,
        inferredPercent: inferred,
        snapped,
      });
      setSelectedGst(snapped);
    } else {
      console.log(
        "[GST-DEBUG] cannot infer GST — subtotal is 0 or invalid, defaulting to 0%",
        { subAmt, taxAmt },
      );
      setSelectedGst(0);
    }

    // Prefill discount (amount) and final amount from stored values
    let storedDiscountAmt = Number(
      billData.discountAmount ?? billData.discount ?? 0,
    );
    if (!isFinite(storedDiscountAmt) || storedDiscountAmt < 0) {
      storedDiscountAmt = 0;
    }
    // If stored discount is 0/missing but total is provided, derive the discount from subtotal + tax - total
    let derivedDiscountAmt = storedDiscountAmt;
    if (
      (storedDiscountAmt === 0 || !isFinite(storedDiscountAmt)) &&
      isFinite(subAmt) &&
      isFinite(taxAmt) &&
      isFinite(totalAmt)
    ) {
      const diff = subAmt + taxAmt - totalAmt;
      if (isFinite(diff) && diff > 0) {
        derivedDiscountAmt = diff;
      }
    }
    console.log("[DISCOUNT-DEBUG] prefill values", {
      rawDiscountAmount: billData.discountAmount,
      rawDiscount: billData.discount,
      parsedStoredDiscountAmt: storedDiscountAmt,
      subAmt,
      taxAmt,
      totalAmt,
      derivedDiscountAmt,
    });
    // Always use amount mode for stored/derived discounts and prefill value (even 0)
    setDiscountType("amount");
    setDiscountValue(String(derivedDiscountAmt));
    // Prefer stored total for final to avoid recomputation mismatches
    if (billData.total != null && !Number.isNaN(Number(billData.total))) {
      setFinalBillAmount(String(Number(billData.total)));
    } else {
      // As a fallback, compute final from current fields
      const final = Math.max(0, subAmt + taxAmt - (storedDiscountAmt || 0));
      setFinalBillAmount(final.toFixed(2));
    }
  };

  useEffect(() => {
    if (billData && billData.id) {
      handleSetInvoiceFromBillData(billData);
    }
    return () => {
      setClient({ clientName: "", phoneNumber: "" });
      setSelectedStaff("");
      setCart([]);
      setFinalBillAmount("");
      setDiscountValue("");
      setDiscountType("amount");
    };
  }, [billData]);

  // Auto-select category only when not set or invalid for current list
  useEffect(() => {
    if (categories.length === 0) return;

    const categoryIds = categories.map((c) => c.id);
    const hasValidSelection =
      selectedCategory && categoryIds.includes(selectedCategory);
    if (hasValidSelection) return;

    if (!showProducts) {
      const bestSellerCategory = categories.find(
        (cat) => cat.name?.toLowerCase() === "best seller",
      );
      setSelectedCategory(
        bestSellerCategory ? bestSellerCategory.id : categories[0].id,
      );
    } else {
      setSelectedCategory(categories[0].id);
    }
  }, [showProducts, categories, selectedCategory]);

  // Payment settlement handler
  const handleSettlePayment = async () => {
    setIsSettling(true);

    try {
      // Prepare invoice data for API call
      const invoiceData = {
        appointmentId: billData?.id || `${bills.length + 1}`,
        services: cart
          .filter((item) => item.serviceId)
          .map((service) => ({
            serviceName: service.serviceName,
            amount: service.amount,
            duration: service.duration || 0,
          })),
        products: cart
          .filter((item) => item.productId)
          .map((product) => ({
            productId: product.productId,
            productName: product.productName,
            amount: product.amount,
            quantity: product.quantity,
          })),
        discountAmount: getCalculatedDiscount(),
        clientId:
          clients.find((c) => c.clientName === client.clientName)?.clientId ||
          generateClientId(),
        dateTime: Math.floor(Date.now() / 1000),
        service: cart
          .filter((item) => item.serviceId)
          .map((service) => service.serviceName)
          .join(", "),
        duration:
          cart.filter((item) => item.serviceId && item.duration).length * 30 ||
          0,
        clientName: client.clientName,
        phoneNumber: client.phoneNumber,
        amount: getTotal(),
        emailId: "",
        staffId: barbers.find((b) => b.name === selectedStaff)?.staffId || "",
        subtotal: getTotal(),
        gstPercent: selectedGst,
        tax: getGSTAmount(),
        total: getDiscountedTotal(),
        paymentMode: paymentMode,
        paymentPlatform: paymentPlatform,
        status: "completed",
        createdAt: Math.floor(Date.now() / 1000),
      };

      // Call updateAppointment API
      await updateAppointmentBilling(invoiceData.appointmentId, invoiceData);
      console.log("Invoice updated successfully");

      // Close modal and go back to overview
      setOpen(false);
      setPaymentMode("");
      setPaymentPlatform("");
      // Signal parent to exit invoice view
      onExit?.();
      // Optionally refresh appointments to reflect status change
      try {
        await fetchAppointments();
      } catch {}
    } catch (error) {
      console.error("Error updating appointment:", error);
    } finally {
      setIsSettling(false);
    }
  };

  return (
    <div className="relative h-full w-full p-0">
      {/* Toggle buttons */}
      <div className="mb-4 flex gap-2">
        <button
          className={`rounded px-4 py-2 ${
            !showProducts
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-900"
          }`}
          onClick={() => setShowProducts(false)}
        >
          Services
        </button>
        <button
          className={`rounded px-4 py-2 ${
            showProducts
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-900"
          }`}
          onClick={() => setShowProducts(true)}
        >
          Products
        </button>
      </div>

      <div className="flex h-full w-3/5 gap-3">
        {/* Categories Sidebar */}
        <div className="w-48 rounded-lg bg-slate-50 px-4">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            {showProducts ? "Product" : "Service"} Categories
          </h3>
          <div className="space-y-2">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${
                    selectedCategory === category.id
                      ? "bg-blue-600 text-white"
                      : "bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {IconComponent && <IconComponent className="h-5 w-5" />}
                  <span className="text-sm font-medium">{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          <div className="mb-6 flex items-center justify-start gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {categories.find((cat) => cat.id === selectedCategory)?.name}{" "}
                {showProducts ? "Products" : "Services"}
              </h2>
              <p className="text-sm text-slate-600">
                Select {showProducts ? "products" : "services"} to add to your
                invoice
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2">
                <ShoppingCart className="h-5 w-5 text-slate-600" />
                <span className="text-sm font-medium text-slate-900">
                  {cart?.length} {showProducts ? "products" : "services"} -{" "}
                  {formatCurrency(getTotal())}
                </span>
              </div>
            </div>
          </div>

          {/* Items Grid */}
          <div className="flex flex-wrap gap-4">
            {filteredItems.map((item) => {
              const id = showProducts ? item.productId : item.serviceId;
              const imageUrl = item.imageUrl || "";
              const name = showProducts ? item.productName : item.serviceName;
              const amount = item.amount || 0;
              return (
                <Card
                  key={id}
                  className="w-40 border-slate-200 transition-shadow hover:shadow-md"
                >
                  <div className="relative">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={name}
                        className="h-28 w-full rounded-t-lg object-cover transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-28 w-full items-center justify-center rounded-t-lg bg-stone-300">
                        {(() => {
                          const Icon = categoryIcons[item.category] || Scissors;
                          return (
                            <Icon size={40} className="text-white opacity-70" />
                          );
                        })()}
                      </div>
                    )}
                    <div className="absolute right-2 top-2">
                      <Badge className="bg-blue-600 px-1.5 py-0.5 text-[10px]">
                        {item.currency} {amount}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-2">
                    <h3 className="mb-1 truncate text-xs font-semibold text-slate-900">
                      {name}
                    </h3>

                    {/* Service description only if services are being shown */}
                    {item.serviceDescription && !showProducts && (
                      <p className="mb-1 line-clamp-2 text-[10px] text-slate-600">
                        {item.serviceDescription}
                      </p>
                    )}

                    {/* Duration + Add Button for Services */}
                    {!showProducts && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">
                          ⏱ {formatDuration(item.duration)}
                        </span>

                        {/* Same add button logic for services */}
                        <Button
                          onClick={() => addToCart(item)}
                          className="h-6 w-6 bg-blue-600 p-0 text-white hover:bg-blue-700"
                          size="icon"
                          disabled={cart?.some((c) => c.serviceId === id)}
                        >
                          {cart?.some((c) => c.serviceId === id) ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Products with quantity control */}
                    {showProducts && (
                      <div className="flex items-center justify-end">
                        <Button
                          onClick={() => addToCart(item)}
                          className="h-6 w-6 bg-blue-600 p-0 text-white hover:bg-blue-700"
                          size="icon"
                        >
                          {cart?.some((c) => c.productId === id) ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cart / Invoice Sidebar */}
      <div className="absolute right-0 top-4 z-30 -mx-7 w-[460px] rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Invoice Details
        </h3>
        {/* Customer Info */}
        <div className="mb-3 grid grid-cols-2 gap-3">
          <div className="relative col-span-1">
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Name
            </label>
            <Input
              type="text"
              value={client.clientName}
              onChange={(e) => {
                setClient({ ...client, clientName: e.target.value });
                setShowSuggestions(true);
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onFocus={() => setShowSuggestions(true)}
              className="w-full rounded-lg border border-slate-200 p-1 text-sm"
              placeholder="Enter name"
            />
            {showSuggestions &&
              client.clientName &&
              filteredClients.length > 0 && (
                <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-md">
                  {filteredClients.map((c, i) => (
                    <li
                      key={i}
                      onMouseDown={() => handleSelect(c)}
                      className="cursor-pointer px-3 py-2 text-sm hover:bg-slate-100"
                    >
                      {c.clientName} – {c.phoneNumber}
                    </li>
                  ))}
                </ul>
              )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Phone
            </label>
            <Input
              type="tel"
              value={client.phoneNumber}
              onChange={(e) =>
                setClient({ ...client, phoneNumber: e.target.value })
              }
              className="w-full rounded-lg border border-slate-200 p-1 text-sm"
              placeholder="Phone number"
            />
          </div>
        </div>

        {/* Staff Select */}
        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Staff
          </label>
          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            className="w-full rounded-lg border border-slate-200 p-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select</option>
            {barbers.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.name}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Items (services or products) */}
        <div className="my-3">
          <h4 className="mb-2 text-sm font-medium text-slate-700">
            Selected {showProducts ? "Products" : "Services"}
          </h4>
          <div className="grid max-h-32 grid-cols-2 gap-2 overflow-y-auto">
            {cart.length > 0 ? (
              cart.map((item) => {
                const isProduct = !!item.productId; // Check if it's a product
                return (
                  <div
                    key={isProduct ? item.productId : item.serviceId}
                    className="flex items-center justify-between rounded border border-slate-200 bg-white p-2"
                  >
                    <div>
                      <h4 className="text-sm font-medium text-slate-900">
                        {isProduct ? item.productName : item.serviceName}
                      </h4>
                      <p className="text-xs text-slate-600">
                        {formatCurrency(item.amount)}
                      </p>

                      {/* Show quantity only for products */}
                      {isProduct && (
                        <div className="mt-1 flex items-center gap-2">
                          <button
                            className="rounded bg-slate-200 px-2 text-sm font-bold"
                            onClick={() => removeFromCart(item.productId)}
                          >
                            −
                          </button>
                          <span className="text-sm">{item.quantity}</span>
                          <button
                            className="rounded bg-slate-200 px-2 text-sm font-bold"
                            onClick={() => addToCart(item)}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Remove button for services */}
                    {!isProduct && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.serviceId)}
                        className="h-5 w-5 p-0 text-red-600 hover:bg-red-100"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 py-4 text-center text-slate-500">
                <ShoppingCart className="mx-auto mb-1 h-6 w-6 opacity-50" />
                <p className="text-xs">No products or services selected</p>
              </div>
            )}
          </div>
        </div>

        {/* GST Options */}
        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-slate-700">
            GST
          </label>
          <div className="flex flex-wrap gap-2">
            {[0, 2.5, 6, 12, 18, 24].map((rate) => (
              <label
                key={rate}
                className="flex cursor-pointer items-center gap-1 rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
              >
                <input
                  type="radio"
                  name="gstRate"
                  value={rate}
                  checked={selectedGst === rate}
                  onChange={() => setSelectedGst(rate)}
                  className="text-slate-600"
                />
                {rate}%
              </label>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-2 border-t border-slate-200 pt-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Subtotal:</span>
            <span className="font-medium">
              {formatCurrency(getTotal(), "INR")}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">GST:</span>
            <span className="font-medium">
              {formatCurrency(getGSTAmount())}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Total:</span>
            <span className="font-medium">
              {formatCurrency(getFinalTotal())}
            </span>
          </div>
          {/* Discount Display */}
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-yellow-800">Discount:</span>
            <span className="text-sm font-medium text-yellow-800">
              {(() => {
                const discount = getDisplayedDiscount();
                const numericDiscount = Number(discount);
                const safeDiscount = isFinite(numericDiscount)
                  ? numericDiscount
                  : 0;
                return discountType === "percentage"
                  ? `${safeDiscount.toFixed(2)} %`
                  : formatCurrency(safeDiscount);
              })()}
            </span>
          </div>
          {/* Discount Input */}
          <div className="mb-2 flex gap-2">
            <select
              value={discountType}
              onChange={(e) => handleDiscountTypeChange(e.target.value)}
              className="rounded p-1 text-xs"
            >
              <option value="amount">Amount (₹)</option>
              <option value="percentage">Percentage (%)</option>
            </select>
            <Input
              type="number"
              value={discountValue}
              onChange={(e) => handleDiscountChange(e.target.value)}
              placeholder={discountType === "percentage" ? "00" : "00"}
              className="h-6 w-full text-xs"
            />
          </div>

          {/* Final Bill Amount */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Final Bill Amount
            </label>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={finalBillAmount}
                  onChange={(e) => handleFinalBillAmountChange(e.target.value)}
                  placeholder={getFinalTotal().toString()}
                  className="h-8 flex-1 text-sm"
                />
                <span className="text-xs text-slate-500">₹</span>
              </div>
              {errorMessage && (
                <p className="text-xs text-red-600">{errorMessage}</p>
              )}
            </div>
          </div>

          <div className="mt-2 flex gap-2">
            <Button
              className="flex-1 bg-stone-300 text-slate-900 hover:bg-slate-200"
              disabled={cart.length === 0 || !selectedStaff}
              onClick={() =>
                handleCreateInvoice({
                  client,
                  services: cart,
                  staff: selectedStaff,
                  gstPercent: selectedGst,
                  subtotal: getTotal(),
                  tax: getGSTAmount(),
                  total: getFinalTotal(),
                  discount: getCalculatedDiscount(),
                  finalAmount: finalBillAmount || getFinalTotal(),
                })
              }
            >
              Generate Bill
            </Button>
            <Button
              className="flex-1 bg-stone-800 text-stone-100 hover:bg-blue-700"
              disabled={
                cart.length === 0 ||
                !selectedStaff ||
                (billData && billData.status === "completed")
              }
              onClick={() => setOpen(true)}
            >
              Settle
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Settlement Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bill Settlement</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium">
              Payment Mode
            </label>
            <select
              value={paymentMode}
              onChange={(e) => {
                setPaymentMode(e.target.value);
                setPaymentPlatform("");
              }}
              className="w-full rounded border border-slate-300 p-2 text-sm"
            >
              <option value="">Select Payment Mode</option>
              <option value="upi">UPI</option>
              <option value="debitCard">Debit Card</option>
              <option value="creditCard">Credit Card</option>
              <option value="cash">Cash</option>
            </select>
          </div>
          {paymentMode === "upi" && (
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium">
                Payment Platform
              </label>
              <select
                value={paymentPlatform}
                onChange={(e) => setPaymentPlatform(e.target.value)}
                className="w-full rounded border p-2 text-sm"
              >
                <option value="">Select UPI Platform</option>
                {platformOptions[paymentMode].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          )}
          <DialogFooter className="mt-6">
            {isSettling ? (
              <div className="flex w-full items-center justify-center py-2">
                <ScissorsLoader text="Settling payment..." />
              </div>
            ) : (
              <Button
                disabled={
                  !paymentMode || (paymentMode === "upi" && !paymentPlatform)
                }
                onClick={handleSettlePayment}
              >
                Settle Payment
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default BillingPage;
