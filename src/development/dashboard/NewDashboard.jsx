import React, { useState, useEffect, useContext } from "react";
import {
  Users,
  UserCheck,
  Calendar,
  CreditCard,
  Package,
  BarChart3,
  Truck,
  Receipt,
  Gift,
  TrendingUp,
  IndianRupee,
  Clock,
  CheckCircle,
} from "lucide-react";
import Context from "../Context/Context";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

const NewDashboard = () => {
  const { institutionData } = useContext(Context);
  const [stats, setStats] = useState({
    totalStaff: 12,
    activeClients: 156,
    todayAppointments: 8,
    monthlyRevenue: 45000,
    inventoryItems: 45,
    pendingReports: 3,
    activeVendors: 7,
    monthlyExpenses: 12000,
    loyaltyMembers: 89,
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const quickStats = [
    {
      title: "Total Staff",
      value: stats.totalStaff,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      change: "+2 this month",
    },
    {
      title: "Active Clients",
      value: stats.activeClients,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-100",
      change: "+12 this week",
    },
    {
      title: "Today's Appointments",
      value: stats.todayAppointments,
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      change: "3 pending",
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(stats.monthlyRevenue),
      icon: IndianRupee,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      change: "+15% from last month",
    },
  ];

  const recentActivities = [
    {
      id: 1,
      type: "appointment",
      message: "New appointment booked for Sarah Johnson",
      time: "2 minutes ago",
      icon: Calendar,
      color: "text-blue-600",
    },
    {
      id: 2,
      type: "payment",
      message: "Payment received from Mike Wilson - ₹1,200",
      time: "15 minutes ago",
      icon: CreditCard,
      color: "text-green-600",
    },
    {
      id: 3,
      type: "inventory",
      message: "Low stock alert: Shampoo bottles (5 remaining)",
      time: "1 hour ago",
      icon: Package,
      color: "text-orange-600",
    },
    {
      id: 4,
      type: "staff",
      message: "Emma Davis completed her shift",
      time: "2 hours ago",
      icon: Users,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="poppins-regular space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-stone-800">
          Welcome back, {institutionData?.companyName || "Salon"}!
        </h1>
        <p className="text-stone-600">
          Here's what's happening at your salon today.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <Card key={index} className="border-stone-200 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-600 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-stone-800">
                    {stat.value}
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    {stat.change}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <Card className="lg:col-span-2 border-stone-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-stone-800">
              <Clock className="h-5 w-5" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors"
                >
                  <div className={`p-2 rounded-full bg-stone-100`}>
                    <activity.icon className={`h-4 w-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-800">
                      {activity.message}
                    </p>
                    <p className="text-xs text-stone-500 mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-stone-800">
              <CheckCircle className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button className="w-full p-3 text-left rounded-lg bg-stone-100 hover:bg-stone-200 transition-colors">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-stone-600" />
                  <span className="text-sm font-medium text-stone-800">
                    Book New Appointment
                  </span>
                </div>
              </button>
              <button className="w-full p-3 text-left rounded-lg bg-stone-100 hover:bg-stone-200 transition-colors">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-5 w-5 text-stone-600" />
                  <span className="text-sm font-medium text-stone-800">
                    Add New Client
                  </span>
                </div>
              </button>
              <button className="w-full p-3 text-left rounded-lg bg-stone-100 hover:bg-stone-200 transition-colors">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-stone-600" />
                  <span className="text-sm font-medium text-stone-800">
                    Update Inventory
                  </span>
                </div>
              </button>
              <button className="w-full p-3 text-left rounded-lg bg-stone-100 hover:bg-stone-200 transition-colors">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-stone-600" />
                  <span className="text-sm font-medium text-stone-800">
                    View Reports
                  </span>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-stone-800">
              <Users className="h-5 w-5" />
              Staff Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-stone-600">Active Staff</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {stats.totalStaff}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-stone-600">On Duty</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  8
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-stone-600">Available</span>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                  6
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-stone-800">
              <Package className="h-5 w-5" />
              Inventory Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-stone-600">Total Items</span>
                <Badge variant="secondary" className="bg-stone-100 text-stone-800">
                  {stats.inventoryItems}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-stone-600">Low Stock</span>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  3
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-stone-600">Out of Stock</span>
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  1
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-stone-800">
              <Gift className="h-5 w-5" />
              Loyalty Program
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-stone-600">Total Members</span>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  {stats.loyaltyMembers}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-stone-600">Points Redeemed</span>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                  24
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-stone-600">New This Month</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  12
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewDashboard;
