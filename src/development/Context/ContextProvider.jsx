import React, { useState, useEffect } from "react";
// CHANGE: New Modular Imports
import { getCurrentUser } from "aws-amplify/auth";
import { get, post, put, del, patch } from "aws-amplify/api";
import Context from "./Context";
import data from "../../operation/data.json";
import defaultLandingData from "../../operation/landingData.json";
import { useToast } from "@/development/hooks/use-toast.js";
import { mergeWithInstitutionData } from "../components/context/SiteContext";

const deepMerge = (target, source) => {
  if (!source || typeof source !== 'object') return target;
  if (!target || typeof target !== 'object') return source;
  const output = Array.isArray(target) ? [...target] : { ...target };

  Object.keys(source).forEach((key) => {
    const sVal = source[key];
    const tVal = target[key];
    if (sVal === undefined) return;

    if (Array.isArray(sVal)) {
      output[key] = sVal;
    } else if (
      typeof sVal === 'object' &&
      sVal !== null &&
      typeof tVal === 'object' &&
      tVal !== null &&
      !Array.isArray(tVal)
    ) {
      output[key] = deepMerge(tVal, sVal);
    } else {
      output[key] = sVal;
    }
  });

  return output;
};

const ContextProvider = (props) => {
  console.log("ContextProvider rendered");
  const { toast } = useToast();

  const [loader, setLoader] = useState(true);
  const [institutionData, setInstitutionData] = useState({});
  const [landingPageData, setLandingPageData] = useState(defaultLandingData);
  const [isAuth, setIsAuth] = useState(false);
  const [userData, setUserData] = useState({});
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [products, setProducts] = useState([]);
  const [billing, setBilling] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [orders, setOrders] = useState([]);

  const institutionId = React.useMemo(() => data.institutionId, []);

  // --- HELPER FOR V6 API CALLS ---
  // This reduces boilerplate for extracting the JSON body
  const apiRequest = async (method, path, options = {}) => {
    try {
      const restOperation = method({
        apiName: "main",
        path,
        options,
      });
      const { body } = await restOperation.response;
      return await body.json();
    } catch (error) {
      throw error;
    }
  };

  // Institution and User Data
  const fetchInstitutionData = async () => {
    try {
      setLoader(true);
      const response = await apiRequest(
        get,
        `/any/get-institution-data/${institutionId}`,
      );
      setInstitutionData(response || {});
      const merged = mergeWithInstitutionData(
        defaultLandingData,
        response,
        response?.landingPageData || {}
      );
      setLandingPageData(merged);
      console.log("Institution data fetched successfully:", response);
    } catch (error) {
      console.error("Error fetching institution data:", error);
    } finally {
      setLoader(false);
    }
  };

  const updateLandingPageData = async (newData) => {
    try {
      setLoader(true);

      // Store EVERYTHING OUTSIDE the companyInfo map as top-level attributes
      const topLevelData = {
        landingPageData: newData,
      };

      // Top-level company name outside companyInfo
      const name = newData?.navigation?.logo?.text || newData?.site?.name;
      if (name) {
        topLevelData.companyName = name;
      }

      // Top-level logo URL outside companyInfo
      const logo = newData?.navigation?.logo?.image || newData?.site?.logoImage;
      if (logo) {
        topLevelData.logoUrl = logo;
      }

      // Top-level phone outside companyInfo
      const phone =
        newData?.contact?.locationCard?.phone ||
        newData?.contact?.info?.phones?.[0] ||
        newData?.footer?.contact?.phone;
      if (phone) {
        topLevelData.Query_PhoneNumber = phone;
      }

      // Top-level address outside companyInfo
      const address =
        newData?.contact?.locationCard?.address ||
        newData?.contact?.info?.address ||
        newData?.footer?.contact?.address;
      if (address) {
        topLevelData.Query_Address = address;
      }

      // Top-level email outside companyInfo
      const email =
        newData?.contact?.locationCard?.email ||
        newData?.contact?.info?.email ||
        newData?.footer?.contact?.email;
      if (email) {
        topLevelData.email = email;
      }

      // Top-level socialMediaLinks outside companyInfo
      const socialLinks = newData?.footer?.columns?.social?.links;
      if (Array.isArray(socialLinks) && socialLinks.length > 0) {
        topLevelData.socialMediaLinks = socialLinks.map((s) => ({
          platform: s.platform || 'facebook',
          url: s.url || '',
        }));
      }

      // Top-level theme primary/secondary colors outside companyInfo
      if (newData?.theme?.primary) {
        topLevelData.PrimaryColor = newData.theme.primary;
      }
      if (newData?.theme?.accent || newData?.theme?.gold) {
        topLevelData.SecondaryColor = newData.theme.accent || newData.theme.gold;
      }

      const response = await apiRequest(
        patch,
        `/admin/${institutionId}/update-ui`,
        {
          body: { index: "0", data: topLevelData },
        },
      );
      setLandingPageData(newData);
      setInstitutionData((prev) => ({
        ...(prev || {}),
        ...topLevelData,
        landingPageData: newData,
      }));
      toast({
        variant: "default",
        title: "Website Updated!",
        description: "Your landing page changes have been saved successfully.",
      });
      return response;
    } catch (error) {
      console.error("Error updating landing page data:", error);
      // Still update locally so the user sees the changes in current session
      setLandingPageData(newData);
      setInstitutionData((prev) => ({
        ...(prev || {}),
        landingPageData: newData,
      }));
      toast({
        variant: "destructive",
        title: "Database Notice",
        description: error.message || "Failed to persist changes to the database.",
      });
      return newData;
    } finally {
      setLoader(false);
    }
  };

  const getUserData = async () => {
    try {
      setLoader(true);
      // CHANGE: Auth.currentAuthenticatedUser -> getCurrentUser
      await getCurrentUser();

      const userData = await apiRequest(
        get,
        `/auth/${institutionId}/user-data`,
      );
      setUserData(userData);
      setIsAuth(true);
      return userData;
    } catch (e) {
      console.log("Error fetching user data:", e);
      setIsAuth(false);
      return null;
    } finally {
      setLoader(false);
    }
  };

  // Admin Vendor Management APIs
  const adminGetVendors = async () => {
    setLoader(true);
    try {
      const response = await apiRequest(
        get,
        `/admin/${institutionId}/get-vendors`,
      );
      if (response && response.vendors) {
        setVendors(response.vendors);
      } else if (Array.isArray(response)) {
        setVendors(response);
      } else {
        setVendors([]);
      }
      return response;
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setVendors([]);
      return null;
    } finally {
      setLoader(false);
    }
  };

  const adminCreateVendor = async (vendorData) => {
    setLoader(true);
    try {
      const response = await apiRequest(
        post,
        `/admin/${institutionId}/create-vendor`,
        {
          body: vendorData,
        },
      );
      console.log("Vendor created successfully");
      await adminGetVendors();
      return response;
    } catch (error) {
      console.error("Error creating vendor:", error);
      throw error;
    } finally {
      setLoader(false);
    }
  };

  const adminUpdateVendor = async (vendorId, vendorData) => {
    setLoader(true);
    try {
      const response = await apiRequest(
        put,
        `/admin/${institutionId}/update-vendor/${vendorId}`,
        {
          body: vendorData,
        },
      );
      toast({
        variant: "success",
        title: "Success!",
        description: "Vendor updated successfully",
      });
      await adminGetVendors();
      return response;
    } catch (error) {
      console.error("Error updating vendor:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update vendor",
      });
      throw error;
    } finally {
      setLoader(false);
    }
  };

  const adminDeleteVendor = async (vendorId) => {
    setLoader(true);
    try {
      const response = await apiRequest(
        del,
        `/admin/${institutionId}/delete-vendor/${vendorId}`,
      );
      toast({
        variant: "success",
        title: "Success!",
        description: "Vendor deleted successfully",
      });
      await adminGetVendors();
      return response;
    } catch (error) {
      console.error("Error deleting vendor:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete vendor",
      });
      throw error;
    } finally {
      setLoader(false);
    }
  };

  // Admin Vendor Order Management APIs
  const adminGetOrders = async (vendorId) => {
    setLoader(true);
    try {
      const response = await apiRequest(
        get,
        `/admin/${institutionId}/vendors/${vendorId}/get-orders`,
      );
      if (response && response.orders) {
        setOrders(response.orders);
      } else if (Array.isArray(response)) {
        setOrders(response);
      } else {
        setOrders([]);
      }
      return response;
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch orders",
      });
      setOrders([]);
      return null;
    } finally {
      setLoader(false);
    }
  };

  const adminGetOrdersRaw = async (vendorId) => {
    try {
      const response = await apiRequest(
        get,
        `/admin/${institutionId}/vendors/${vendorId}/get-orders`,
      );
      if (response && Array.isArray(response.orders)) return response.orders;
      if (Array.isArray(response)) return response;
      return [];
    } catch (error) {
      console.error("Error fetching orders (raw):", error);
      return [];
    }
  };

  const adminCreateOrder = async (vendorId, orderData, options = {}) => {
    setLoader(true);
    try {
      const response = await apiRequest(
        post,
        `/admin/${institutionId}/vendors/${vendorId}/create-order`,
        {
          body: orderData,
        },
      );
      toast({
        variant: "success",
        title: "Success!",
        description: "Order created successfully",
      });
      if (!options.skipRefresh) {
        await adminGetOrders(vendorId);
      }
      return response;
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create order",
      });
      throw error;
    } finally {
      setLoader(false);
    }
  };

  const adminUpdateOrder = async (vendorId, orderId, orderData, options = {}) => {
    setLoader(true);
    try {
      const response = await apiRequest(
        put,
        `/admin/${institutionId}/vendors/${vendorId}/update-order/${orderId}`,
        {
          body: orderData,
        },
      );
      toast({
        variant: "success",
        title: "Success!",
        description: "Order updated successfully",
      });
      if (!options.skipRefresh) {
        await adminGetOrders(vendorId);
      }
      return response;
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update order",
      });
      throw error;
    } finally {
      setLoader(false);
    }
  };

  const adminDeleteOrder = async (vendorId, orderId, options = {}) => {
    setLoader(true);
    try {
      const response = await apiRequest(
        del,
        `/admin/${institutionId}/vendors/${vendorId}/delete-order/${orderId}`,
      );
      toast({
        variant: "success",
        title: "Success!",
        description: "Order deleted successfully",
      });
      if (!options.skipRefresh) {
        await adminGetOrders(vendorId);
      }
      return response;
    } catch (error) {
      console.error("Error deleting order:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete order",
      });
      throw error;
    } finally {
      setLoader(false);
    }
  };

  // Staff (Barber) APIs
  const fetchBarbers = async () => {
    setLoader(true);
    try {
      const response = await apiRequest(
        get,
        `/admin/${institutionId}/get-barbers`,
      );
      if (response && response.barbers) {
        // Normalize staff items so that both userName and name, phoneNumber and phone, emailId and email are available!
        const normalized = response.barbers.map((b) => {
          const rawName = (b.userName || b.name || b.barberName || b.fullName || "").trim();
          const rawPhone = (b.phoneNumber || b.phone || "").trim();
          const rawEmail = (b.emailId || b.email || "").trim();
          const rawId = b.staffId || b.id || b._id || "";

          return {
            ...b,
            staffId: rawId,
            id: rawId,
            name: rawName,
            userName: rawName,
            userType: (b.userType || "staff").toLowerCase().trim(),
            phoneNumber: rawPhone,
            phone: rawPhone,
            emailId: rawEmail,
            email: rawEmail,
            specialization: Array.isArray(b.specialization)
              ? b.specialization
              : b.specialization
              ? [b.specialization]
              : [],
            yearsOfExperience: Number(b.yearsOfExperience) || 0,
            gender: b.gender || "Male",
            status: b.status || "available",
            bio: b.bio || "",
          };
        });
        setBarbers(normalized);
      }
    } catch (error) {
      console.error("Error fetching barbers:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch barbers",
      });
    } finally {
      setLoader(false);
    }
  };

  const createStaff = async (dataParam) => {
    try {
      setLoader(true);
      const rawData = dataParam?.staffData || dataParam || {};
      const staffName = (rawData.userName || rawData.name || "").trim();
      const staffPhone = (rawData.phoneNumber || rawData.phone || "").trim();
      const staffEmail = (rawData.emailId || rawData.email || "").trim();
      const userType = (rawData.userType || "staff").toLowerCase().trim();

      const payload = {
        userName: staffName,
        name: staffName,
        userType: userType,
        phoneNumber: staffPhone,
        emailId: staffEmail,
        specialization: Array.isArray(rawData.specialization)
          ? rawData.specialization
          : rawData.specialization
          ? [rawData.specialization]
          : [],
        yearsOfExperience: Number(rawData.yearsOfExperience) || 0,
        gender: rawData.gender || "Male",
        bio: rawData.bio || "",
        status: rawData.status || "available",
      };

      const response = await apiRequest(
        post,
        `/admin/${institutionId}/create-barber`,
        {
          body: payload,
        },
      );
      if (response) {
        toast({
          variant: "success",
          title: "Success!",
          description: "Staff created successfully",
        });
        await fetchBarbers();
        return response;
      }
    } catch (error) {
      console.error("Error creating staff:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create staff",
      });
      throw error;
    } finally {
      setLoader(false);
    }
  };

  const updateStaff = async (param1, param2) => {
    try {
      setLoader(true);
      // Support all call styles: updateStaff({ staffId, staffData }), updateStaff(staffId, staffData), updateStaff(mergedObject)
      let targetStaffId = "";
      let rawData = {};

      if (typeof param1 === "string") {
        targetStaffId = param1;
        rawData = param2 || {};
      } else if (param1 && typeof param1 === "object") {
        targetStaffId =
          param1.staffId ||
          param1.id ||
          (param1.staffData && (param1.staffData.staffId || param1.staffData.id)) ||
          "";
        rawData = param1.staffData ? param1.staffData : param1;
      }

      const staffName = (rawData.userName || rawData.name || "").trim();
      const staffPhone = (rawData.phoneNumber || rawData.phone || "").trim();
      const staffEmail = (rawData.emailId || rawData.email || "").trim();
      const userType = rawData.userType !== undefined
        ? String(rawData.userType).toLowerCase().trim()
        : undefined;

      const payload = {
        staffId: targetStaffId,
        userName: staffName,
        name: staffName,
        ...(userType && { userType }),
        phoneNumber: staffPhone,
        emailId: staffEmail,
        specialization: Array.isArray(rawData.specialization)
          ? rawData.specialization
          : rawData.specialization
          ? [rawData.specialization]
          : [],
        yearsOfExperience: Number(rawData.yearsOfExperience) || 0,
        gender: rawData.gender || "Male",
        bio: rawData.bio || "",
        status: rawData.status || "available",
      };

      const response = await apiRequest(
        put,
        `/admin/${institutionId}/update-barbers`,
        {
          body: payload,
        },
      );
      if (response) {
        toast({
          variant: "success",
          title: "Success!",
          description: "Staff updated successfully",
        });
        await fetchBarbers();
        return response;
      }
    } catch (error) {
      console.error("Error updating staff:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update staff",
      });
      throw error;
    } finally {
      setLoader(false);
    }
  };

  const deleteStaff = async (staffIdParam) => {
    try {
      setLoader(true);
      const staffId =
        typeof staffIdParam === "object"
          ? staffIdParam.staffId || staffIdParam.id || staffIdParam._id
          : staffIdParam;

      const response = await apiRequest(
        del,
        `/admin/${institutionId}/delete-barbers`,
        {
          body: { staffId },
        },
      );
      if (response) {
        toast({
          variant: "success",
          title: "Success!",
          description: "Staff deleted successfully",
        });
        await fetchBarbers();
        return response;
      }
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete staff",
      });
      throw error;
    } finally {
      setLoader(false);
    }
  };

  // Service APIs
  const fetchServices = async () => {
    setLoader(true);
    try {
      const response = await apiRequest(
        get,
        `/admin/${institutionId}/get-services`,
      );
      if (response.services) {
        setServices(response.services);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch services",
      });
    } finally {
      setLoader(false);
    }
  };

  const createService = async (serviceData) => {
    try {
      setLoader(true);
      const response = await apiRequest(
        post,
        `/admin/${institutionId}/create-services`,
        {
          body: serviceData,
        },
      );
      if (response.service) {
        toast({
          variant: "success",
          title: "Success!",
          description: "Service added successfully",
        });
        await fetchServices();
        return response;
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to add service",
        });
        return null;
      }
    } catch (error) {
      console.error("Error creating service:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add service",
      });
      throw error;
    } finally {
      setLoader(false);
    }
  };

  const updateService = async (serviceId, serviceData) => {
    try {
      setLoader(true);
      const response = await apiRequest(
        put,
        `/admin/${institutionId}/services/${serviceId}`,
        {
          body: serviceData,
        },
      );
      if (response.service) {
        toast({
          variant: "success",
          title: "Success!",
          description: "Service updated successfully",
        });
        await fetchServices();
        return response;
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update service",
        });
        return null;
      }
    } catch (error) {
      console.error("Error updating service:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update service",
      });
      throw error;
    } finally {
      setLoader(false);
    }
  };

  const deleteService = async (serviceId) => {
    try {
      setLoader(true);
      const response = await apiRequest(
        del,
        `/admin/${institutionId}/services/${serviceId}`,
      );
      if (response) {
        toast({
          variant: "success",
          title: "Success!",
          description: "Service deleted successfully",
        });
        await fetchServices();
        return response;
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete service",
        });
        return null;
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete service",
      });
      throw error;
    } finally {
      setLoader(false);
    }
  };

  // Client APIs
  const fetchClients = async () => {
    try {
      setLoader(true);
      const response = await apiRequest(get, `/new/${institutionId}/clients`);

      if (response.clients) {
        setClients(response.clients);
      } else {
        setClients([]);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch clients",
      });
    } finally {
      setLoader(false);
    }
  };

  const createClient = async (clientData) => {
    try {
      setLoader(true);
      const response = await apiRequest(post, `/new/${institutionId}/clients`, {
        body: clientData,
      });

      if (response && (response.client || response.message)) {
        toast({
          variant: "success",
          title: "Success!",
          description: "Client created successfully",
        });
        await fetchClients();
        return response;
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create client",
        });
        return null;
      }
    } catch (error) {
      console.error("Error creating client:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create client",
      });
      throw error;
    } finally {
      setLoader(false);
    }
  };

  const updateClient = async (clientId, clientData) => {
    try {
      setLoader(true);
      const response = await apiRequest(
        put,
        `/new/${institutionId}/clients/${clientId}`,
        {
          body: clientData,
        },
      );

      if (response && (response.client || response.message)) {
        toast({
          variant: "success",
          title: "Success!",
          description: "Client updated successfully",
        });
        await fetchClients();
        return response;
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update client",
        });
        return null;
      }
    } catch (error) {
      console.error("Error updating client:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update client",
      });
      throw error;
    } finally {
      setLoader(false);
    }
  };

  const deleteClient = async (clientId) => {
    try {
      setLoader(true);
      const response = await apiRequest(
        del,
        `/new/${institutionId}/clients/${clientId}`,
      );

      if (response && (response.message || response.statusCode === 200)) {
        toast({
          variant: "success",
          title: "Success!",
          description: "Client deleted successfully",
        });
        await fetchClients();
        return response;
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete client",
        });
        return null;
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete client",
      });
      throw error;
    } finally {
      setLoader(false);
    }
  };

  // Appointments APIs
  const fetchAppointments = async () => {
    try {
      setLoader(true);
      const response = await apiRequest(
        get,
        `/new/${institutionId}/appointments`,
      );

      if (response.appointments) {
        setAppointments(response.appointments);
        return response.appointments;
      } else {
        setAppointments([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch appointments",
      });
    } finally {
      setLoader(false);
    }
  };

  const createAppointment = async (
    appointmentData,
    institutionIdParam = null,
  ) => {
    try {
      // setLoader(true);
      const targetInstitutionId = institutionIdParam || institutionId;
      const response = await apiRequest(
        post,
        `/new/${targetInstitutionId}/appointments`,
        {
          body: appointmentData,
        },
      );

      // V6 logic update: return response directly, handling specific UI updates here or in caller is fine.
      // Keeping original commented out checks for consistency with original file style
      return response;
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create appointment",
      });
      throw error;
    } finally {
      // setLoader(false);
    }
  };

  const updateAppointment = async (appointmentId, appointmentData) => {
    try {
      setLoader(true);
      const response = await apiRequest(
        put,
        `/new/${institutionId}/appointments/${appointmentId}`,
        {
          body: appointmentData,
        },
      );

      if (response && (response.appointment || response.message)) {
        toast({
          variant: "success",
          title: "Success!",
          description: "Appointment updated successfully",
        });
        await fetchAppointments();
        return response;
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update appointment",
        });
        return null;
      }
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update appointment",
      });
      throw error;
    } finally {
      setLoader(false);
    }
  };

  // Billing APIs
  const createBilling = async (billingData) => {
    try {
      setLoader(true);
      const response = await apiRequest(post, `/new/${institutionId}/billing`, {
        body: billingData,
      });

      if (response && (response.billing || response.message)) {
        console.log("Billing created successfully");
        return response;
      } else {
        console.log("Failed to create billing");
        return null;
      }
    } catch (error) {
      console.error("Error creating billing:", error);
      throw error;
    } finally {
      setLoader(false);
    }
  };

  const updateAppointmentBilling = async (appointmentId, billingData) => {
    try {
      setLoader(true);
      const response = await apiRequest(
        put,
        `/new/${institutionId}/appointments/${appointmentId}`,
        {
          body: billingData,
        },
      );

      if (response && (response.appointment || response.message)) {
        console.log("Appointment billing updated successfully");
        // Refresh appointments data
        await fetchAppointments();
        return response;
      } else {
        console.log("Failed to update appointment billing");
        return null;
      }
    } catch (error) {
      console.error("Error updating appointment billing:", error);
      throw error;
    } finally {
      setLoader(false);
    }
  };

  const updateBilling = async (appointmentId, billingData) => {
    try {
      setLoader(true);
      const response = await apiRequest(
        put,
        `/new/${institutionId}/billing/${appointmentId}`,
        {
          body: billingData,
        },
      );

      if (response && (response.billing || response.message)) {
        console.log("Billing updated successfully");
        return response;
      } else {
        console.log("Failed to update billing");
        return null;
      }
    } catch (error) {
      console.error("Error updating billing:", error);
      throw error;
    } finally {
      setLoader(false);
    }
  };

  // Product APIs
  const fetchProducts = async (instId) => {
    try {
      const resolvedInstitutionId =
        instId ||
        institutionData?.institutionid ||
        institutionData?.institutionId ||
        institutionId;

      if (!resolvedInstitutionId) {
        setProducts([]);
        return [];
      }

      const response = await apiRequest(get, "/admin/products", {
        // CHANGE: queryParameters -> queryParams
        queryParams: {
          institutionId: resolvedInstitutionId,
        },
      });

      setProducts(response || []);
      console.log("Fetched Products:", response);

      return response;
    } catch (error) {
      console.error("List Products Error:", error);
      throw error;
    }
  };

  const createProduct = async (data) => {
    try {
      const response = await apiRequest(post, "/admin/products", {
        body: data,
      });
      setProducts((prevProducts) => [...prevProducts, response.createdItem]);
      return response;
    } catch (error) {
      console.error("Create Product Error:", error);
      throw error;
    }
  };

  const updateProduct = async (instId, productId, data) => {
    try {
      const response = await apiRequest(put, `/admin/products/${productId}`, {
        body: { institutionId: instId, ...data },
      });
      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          String(product.productId || product.id) === String(productId)
            ? response.updatedItem
            : product,
        ),
      );
      return response.updatedItem;
    } catch (error) {
      console.error("Update Product Error:", error);
      throw error;
    }
  };

  const deleteProduct = async (instId, productId) => {
    try {
      // CHANGE: queryParameters -> queryParams
      const response = await apiRequest(del, `/admin/products/${productId}`, {
        queryParams: { institutionId: instId },
      });
      setProducts((prevProducts) =>
        prevProducts.filter(
          (product) => String(product.productId || product.id) !== String(productId),
        ),
      );
      await fetchProducts(instId);
      return response;
    } catch (error) {
      console.error("Delete Product Error:", error);
      throw error;
    }
  };

  const ContextData = React.useMemo(
    () => ({
      isAuth,
      setIsAuth,
      loader,
      setLoader,
      // Institution and User Data
      institutionData,
      fetchInstitutionData,
      setInstitutionData,
      userData: userData,
      setUserData: setUserData,
      getUserData,
      // Staff (Barber) Management
      barbers,
      setBarbers,
      fetchBarbers,
      createStaff,
      updateStaff,
      deleteStaff,
      // Service Management
      services,
      setServices,
      fetchServices,
      createService,
      updateService,
      deleteService,
      // Client Management
      clients,
      fetchClients,
      createClient,
      updateClient,
      deleteClient,
      // Appointment Management
      appointments,
      fetchAppointments,
      createAppointment,
      updateAppointment,
      // Billing Management
      billing,
      createBilling,
      updateBilling,
      updateAppointmentBilling,
      // Product Management
      products,
      setProducts,
      fetchProducts,
      createProduct,
      updateProduct,
      deleteProduct,
      // Vendor Management
      vendors,
      setVendors,
      adminGetVendors,
      adminCreateVendor,
      adminUpdateVendor,
      adminDeleteVendor,
      // Vendor Order Management
      orders,
      setOrders,
      adminGetOrders,
      adminGetOrdersRaw,
      adminCreateOrder,
      adminUpdateOrder,
      adminDeleteOrder,
      // Landing Page Dynamic Data & Customization
      landingPageData,
      setLandingPageData,
      updateLandingPageData,
    }),
    [
      isAuth,
      loader,
      institutionData,
      landingPageData,
      userData,
      barbers,
      services,
      clients,
      appointments,
      billing,
      products,
      vendors,
      orders,
    ],
  );

  // Initial data loading
  useEffect(() => {
    getUserData();
    fetchInstitutionData();
  }, []);

  // Dashboard data loading
  useEffect(() => {
    if (institutionId) {
      fetchServices(),
        fetchBarbers(),
        fetchClients(),
        fetchProducts(institutionId),
        fetchAppointments(),
        adminGetVendors();
    }
  }, [institutionId]);

  return (
    <Context.Provider value={ContextData}>
      {/* {loader && <Loader />} */}
      {props.children}
    </Context.Provider>
  );
};

export default ContextProvider;
