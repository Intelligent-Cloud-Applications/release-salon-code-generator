import React, { useState, useEffect, useCallback } from "react";
import { API, Amplify, Auth } from "aws-amplify";
import Context from "./Context";
import Loader from "../components/Loader";
import data from "../../operation/data.json";
import { set } from "date-fns";
import { useToast } from "@/development/hooks/use-toast.js";

const ContextProvider = (props) => {
  console.log("ContextProvider rendered");
  const { toast } = useToast();

  const [loader, setLoader] = useState(true);
  const [institutionData, setInstitutionData] = useState({});
  const [isAuth, setIsAuth] = useState(false);
  const [userData, setUserData] = useState({});
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [products, setProducts] = useState([]);
  const [billing, setBilling] = useState([]); // Vendor and Order state
  const [vendors, setVendors] = useState([]);
  const [orders, setOrders] = useState([]);

  const institutionId = React.useMemo(() => data.institutionId, []);

  // Institution and User Data

  const fetchInstitutionData = async () => {
    try {
      setLoader(true);
      console.log("Registered APIs:", API);
      const response = await API.get(
        "main",
        `/any/get-institution-data/${institutionId}`,
      );
      setInstitutionData(response);
      console.log("Institution data fetched successfully:", response);
    } catch (error) {
      console.error("Error fetching institution data:", error);
    } finally {
      setLoader(false);
    }
  };

  const getUserData = async () => {
    try {
      setLoader(true);
      await Auth.currentAuthenticatedUser();
      const userData = await API.get(
        "main",
        `/auth/${institutionId}/user-data`,
        {},
      );
      setUserData(userData);
    } catch (e) {
      console.log("Error fetching user data:", e);
    } finally {
      setLoader(false);
    }
  };

  // Admin Vendor Management APIs (inside provider, with state management)
  const adminGetVendors = async () => {
    setLoader(true);
    try {
      const response = await API.get(
        "main",
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
      const response = await API.post(
        "main",
        `/admin/${institutionId}/create-vendor`,
        { body: vendorData },
      );
      console.log("Vendor created successfully");
      // Refresh vendor list
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
      const response = await API.put(
        "main",
        `/admin/${institutionId}/update-vendor/${vendorId}`,
        { body: vendorData },
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
      const response = await API.del(
        "main",
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

  // Admin Vendor Order Management APIs (inside provider, with state management)
  const adminGetOrders = async (vendorId) => {
    setLoader(true);
    try {
      const response = await API.get(
        "main",
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
      const response = await API.get(
        "main",
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

  const adminCreateOrder = async (vendorId, orderData) => {
    setLoader(true);
    try {
      const response = await API.post(
        "main",
        `/admin/${institutionId}/vendors/${vendorId}/create-order`,
        { body: orderData },
      );
      toast({
        variant: "success",
        title: "Success!",
        description: "Order created successfully",
      });
      await adminGetOrders(vendorId);
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

  const adminUpdateOrder = async (vendorId, orderId, orderData) => {
    setLoader(true);
    try {
      const response = await API.put(
        "main",
        `/admin/${institutionId}/vendors/${vendorId}/update-order/${orderId}`,
        { body: orderData },
      );
      toast({
        variant: "success",
        title: "Success!",
        description: "Order updated successfully",
      });
      await adminGetOrders(vendorId);
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

  const adminDeleteOrder = async (vendorId, orderId) => {
    setLoader(true);
    try {
      const response = await API.del(
        "main",
        `/admin/${institutionId}/vendors/${vendorId}/delete-order/${orderId}`,
      );
      toast({
        variant: "success",
        title: "Success!",
        description: "Order deleted successfully",
      });
      await adminGetOrders(vendorId);
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
      const response = await API.get(
        "main",
        `/admin/${institutionId}/get-barbers`,
      );
      if (response.barbers) {
        setBarbers(response.barbers);
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

  const createStaff = async ({ staffData }) => {
    try {
      setLoader(true);
      const response = await API.post(
        "main",
        `/admin/${institutionId}/create-barber`,
        { body: staffData },
      );
      if (response) {
        toast({
          variant: "success",
          title: "Success!",
          description: "Staff created successfully",
        });
        await fetchBarbers();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create staff",
        });
      }
    } catch (error) {
      console.error("Error creating staff:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create staff",
      });
    } finally {
      setLoader(false);
    }
  };

  const updateStaff = async ({ staffId, staffData }) => {
    try {
      console.log("Updating staff:", staffId, staffData);

      setLoader(true);
      const response = await API.put(
        "main",
        `/admin/${institutionId}/update-barbers`,
        { body: { staffId, ...staffData } },
      );
      if (response) {
        toast({
          variant: "success",
          title: "Success!",
          description: "Staff updated successfully",
        });
        await fetchBarbers();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update staff",
        });
      }
    } catch (error) {
      console.error("Error updating staff:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update staff",
      });
    } finally {
      setLoader(false);
    }
  };

  const deleteStaff = async (staffId) => {
    try {
      setLoader(true);
      const response = await API.del(
        "main",
        `/admin/${institutionId}/delete-barbers`,
        { body: { staffId } },
      );
      if (response) {
        toast({
          variant: "success",
          title: "Success!",
          description: "Staff deleted successfully",
        });
        await fetchBarbers();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete staff",
        });
      }
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete staff",
      });
    } finally {
      setLoader(false);
    }
  };

  // Service APIs
  const fetchServices = async () => {
    setLoader(true);
    try {
      const response = await API.get(
        "main",
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
      const response = await API.post(
        "main",
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
        // Refresh services data
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
      const response = await API.put(
        "main",
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
        // Refresh services data
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
      const response = await API.del(
        "main",
        `/admin/${institutionId}/services/${serviceId}`,
      );
      if (response) {
        toast({
          variant: "success",
          title: "Success!",
          description: "Service deleted successfully",
        });
        // Refresh services data
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
      const response = await API.get("main", `/new/${institutionId}/clients`);

      if (response.clients) {
        setClients(response.clients);
      } else if (response.body) {
        // Handle case where response is wrapped in body
        const parsedBody =
          typeof response.body === "string"
            ? JSON.parse(response.body)
            : response.body;
        if (parsedBody.clients) {
          setClients(parsedBody.clients);
        }
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
      const response = await API.post("main", `/new/${institutionId}/clients`, {
        body: clientData,
      });

      // Handle different response formats
      let responseData = response;
      if (response.body) {
        responseData =
          typeof response.body === "string"
            ? JSON.parse(response.body)
            : response.body;
      }
      if (responseData && (responseData.client || responseData.message)) {
        toast({
          variant: "success",
          title: "Success!",
          description: "Client created successfully",
        });
        await fetchClients();
        return responseData;
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
      const response = await API.put(
        "main",
        `/new/${institutionId}/clients/${clientId}`,
        { body: clientData },
      );

      // Handle different response formats
      let responseData = response;
      if (response.body) {
        responseData =
          typeof response.body === "string"
            ? JSON.parse(response.body)
            : response.body;
      }
      if (responseData && (responseData.client || responseData.message)) {
        toast({
          variant: "success",
          title: "Success!",
          description: "Client updated successfully",
        });
        await fetchClients();
        return responseData;
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
      const response = await API.del(
        "main",
        `/new/${institutionId}/clients/${clientId}`,
      );

      // Handle different response formats
      let responseData = response;
      if (response.body) {
        responseData =
          typeof response.body === "string"
            ? JSON.parse(response.body)
            : response.body;
      }
      if (
        responseData &&
        (responseData.message || responseData.statusCode === 200)
      ) {
        toast({
          variant: "success",
          title: "Success!",
          description: "Client deleted successfully",
        });
        await fetchClients();
        return responseData;
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
      const response = await API.get(
        "main",
        `/new/${institutionId}/appointments`,
      );

      if (response.appointments) {
        setAppointments(response.appointments);
        return response.appointments;
      } else if (response.body) {
        // Handle case where response is wrapped in body
        const parsedBody =
          typeof response.body === "string"
            ? JSON.parse(response.body)
            : response.body;
        if (parsedBody.appointments) {
          setAppointments(parsedBody.appointments);
          return parsedBody.appointments;
        }
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
      setLoader(true);
      const targetInstitutionId = institutionIdParam || institutionId;
      const response = await API.post(
        "main",
        `/new/${targetInstitutionId}/appointments`,
        { body: appointmentData },
      );
      // Handle different response formats
      let responseData = response;
      if (response.body) {
        responseData =
          typeof response.body === "string"
            ? JSON.parse(response.body)
            : response.body;
      }

      // Handle different response formats
      if (responseData && (responseData.appointment || responseData.message)) {
        toast({
          variant: "success",
          title: "Success!",
          description: "Appointment created successfully",
        });
        // Refresh appointments data
        await fetchAppointments();
        await fetchClients();
        return responseData;
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create appointment",
        });
        return null;
      }
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create appointment",
      });
      throw error;
    } finally {
      setLoader(false);
    }
  };

  const updateAppointment = async (appointmentId, appointmentData) => {
    try {
      setLoader(true);
      const response = await API.put(
        "main",
        `/new/${institutionId}/appointments/${appointmentId}`,
        { body: appointmentData },
      );
      // Handle different response formats
      let responseData = response;
      if (response.body) {
        responseData =
          typeof response.body === "string"
            ? JSON.parse(response.body)
            : response.body;
      }
      if (responseData && (responseData.appointment || responseData.message)) {
        toast({
          variant: "success",
          title: "Success!",
          description: "Appointment updated successfully",
        });
        await fetchAppointments();
        return responseData;
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
      const response = await API.post("main", `/new/${institutionId}/billing`, {
        body: billingData,
      });

      // Handle different response formats
      let responseData = response;
      if (response.body) {
        responseData =
          typeof response.body === "string"
            ? JSON.parse(response.body)
            : response.body;
      }

      if (responseData && (responseData.billing || responseData.message)) {
        console.log("Billing created successfully");
        return responseData;
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
      const response = await API.put(
        "main",
        `/new/${institutionId}/appointments/${appointmentId}`,
        { body: billingData },
      );
      // Handle different response formats
      let responseData = response;
      if (response.body) {
        responseData =
          typeof response.body === "string"
            ? JSON.parse(response.body)
            : response.body;
      }
      if (responseData && (responseData.appointment || responseData.message)) {
        console.log("Appointment billing updated successfully");
        // Refresh appointments data
        await fetchAppointments();
        return responseData;
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
      const response = await API.put(
        "main",
        `/new/${institutionId}/billing/${appointmentId}`,
        { body: billingData },
      );

      // Handle different response formats
      let responseData = response;
      if (response.body) {
        responseData =
          typeof response.body === "string"
            ? JSON.parse(response.body)
            : response.body;
      }

      if (responseData && (responseData.billing || responseData.message)) {
        console.log("Billing updated successfully");
        return responseData;
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
  const fetchProducts = async (institutionId) => {
    try {
      const response = await API.get("main", "/admin/products", {
        queryStringParameters: {
          institutionId: institutionId || "mirrorsalon",
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
      const response = await API.post("main", "/admin/products", {
        body: data,
      });
      setProducts((prevProducts) => [...prevProducts, response.createdItem]);
      return response;
    } catch (error) {
      console.error("Create Product Error:", error);
      throw error;
    }
  };

  const updateProduct = async (institutionId, productId, data) => {
    try {
      const response = await API.put("main", `/admin/products/${productId}`, {
        body: { institutionId, ...data },
      });
      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.id === productId ? response.updatedItem : product,
        ),
      );
      return response.updatedItem;
    } catch (error) {
      console.error("Update Product Error:", error);
      throw error;
    }
  };

  const deleteProduct = async (institutionId, productId) => {
    try {
      const response = await API.del("main", `/admin/products/${productId}`, {
        queryStringParameters: { institutionId },
      });
      setProducts((prevProducts) =>
        prevProducts.filter((product) => product.id !== productId),
      );
      await fetchProducts();
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
    }),
    [
      isAuth,
      loader,
      institutionData,
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
      fetchProducts(),
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
