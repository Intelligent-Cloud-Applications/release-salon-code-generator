import React, { useState } from "react";
import { BarChart3, Download, Calendar, TrendingUp, TrendingDown, IndianRupee, Users, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

const ReportsPage = () => {
  const [selectedReport, setSelectedReport] = useState("revenue");

  const reports = [
    {
      id: "revenue",
      title: "Revenue Report",
      description: "Monthly revenue analysis and trends",
  icon: IndianRupee,
      color: "text-green-600",
      bgColor: "bg-green-100",
      data: {
        currentMonth: 45000,
        lastMonth: 38000,
        growth: 18.4,
        trend: "up"
      }
    },
    {
      id: "appointments",
      title: "Appointments Report",
      description: "Booking statistics and client analysis",
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      data: {
        currentMonth: 156,
        lastMonth: 142,
        growth: 9.9,
        trend: "up"
      }
    },
    {
      id: "clients",
      title: "Client Report",
      description: "Client demographics and retention",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      data: {
        currentMonth: 89,
        lastMonth: 76,
        growth: 17.1,
        trend: "up"
      }
    },
    {
      id: "inventory",
      title: "Inventory Report",
      description: "Stock levels and usage patterns",
      icon: Package,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      data: {
        currentMonth: 45,
        lastMonth: 52,
        growth: -13.5,
        trend: "down"
      }
    }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getTrendIcon = (trend) => {
    return trend === "up" ? TrendingUp : TrendingDown;
  };

  const getTrendColor = (trend) => {
    return trend === "up" ? "text-green-600" : "text-red-600";
  };

  const selectedReportData = reports.find(r => r.id === selectedReport);

  return (
    <div className="poppins-regular space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">Reports & Analytics</h1>
          <p className="text-stone-600">Analyze your salon performance and trends</p>
        </div>
        <Button className="bg-stone-600 hover:bg-stone-700 text-white">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reports.map((report) => {
          const TrendIcon = getTrendIcon(report.data.trend);
          const trendColor = getTrendColor(report.data.trend);
          
          return (
            <Card 
              key={report.id} 
              className={`border-stone-200 cursor-pointer transition-all hover:shadow-md ${
                selectedReport === report.id ? 'ring-2 ring-stone-400' : ''
              }`}
              onClick={() => setSelectedReport(report.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${report.bgColor}`}>
                    <report.icon className={`h-6 w-6 ${report.color}`} />
                  </div>
                  <TrendIcon className={`h-5 w-5 ${trendColor}`} />
                </div>
                <h3 className="text-lg font-semibold text-stone-800 mb-1">{report.title}</h3>
                <p className="text-sm text-stone-600 mb-3">{report.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-stone-600">This Month</span>
                    <span className="text-sm font-medium text-stone-800">
                      {report.id === 'revenue' ? formatCurrency(report.data.currentMonth) : report.data.currentMonth}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-stone-600">Growth</span>
                    <span className={`text-sm font-medium ${trendColor}`}>
                      {report.data.growth > 0 ? '+' : ''}{report.data.growth}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected Report Details */}
      {selectedReportData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Summary */}
          <Card className="lg:col-span-2 border-stone-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-stone-800">
                <selectedReportData.icon className="h-5 w-5" />
                {selectedReportData.title} - January 2024
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-stone-50 rounded-lg">
                    <p className="text-sm text-stone-600 mb-1">Current Month</p>
                    <p className="text-2xl font-bold text-stone-800">
                      {selectedReportData.id === 'revenue' 
                        ? formatCurrency(selectedReportData.data.currentMonth)
                        : selectedReportData.data.currentMonth
                      }
                    </p>
                  </div>
                  <div className="p-4 bg-stone-50 rounded-lg">
                    <p className="text-sm text-stone-600 mb-1">Previous Month</p>
                    <p className="text-2xl font-bold text-stone-800">
                      {selectedReportData.id === 'revenue' 
                        ? formatCurrency(selectedReportData.data.lastMonth)
                        : selectedReportData.data.lastMonth
                      }
                    </p>
                  </div>
                </div>

                {/* Growth Indicator */}
                <div className="flex items-center gap-2 p-4 bg-stone-50 rounded-lg">
                  {(() => {
                    const TrendIcon = getTrendIcon(selectedReportData.data.trend);
                    const trendColor = getTrendColor(selectedReportData.data.trend);
                    return (
                      <>
                        <TrendIcon className={`h-5 w-5 ${trendColor}`} />
                        <span className={`text-sm font-medium ${trendColor}`}>
                          {selectedReportData.data.growth > 0 ? '+' : ''}{selectedReportData.data.growth}% 
                          {selectedReportData.data.trend === 'up' ? ' increase' : ' decrease'} from last month
                        </span>
                      </>
                    );
                  })()}
                </div>

                {/* Chart Placeholder */}
                <div className="h-64 bg-stone-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-stone-300 mx-auto mb-2" />
                    <p className="text-stone-500">Chart visualization would go here</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle className="text-stone-800">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full justify-start bg-stone-600 hover:bg-stone-700 text-white">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" className="w-full justify-start border-stone-200 text-stone-600 hover:bg-stone-50">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Report
                </Button>
                <Button variant="outline" className="w-full justify-start border-stone-200 text-stone-600 hover:bg-stone-50">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Custom Report
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t border-stone-200">
                <h4 className="text-sm font-medium text-stone-800 mb-3">Report Filters</h4>
                <div className="space-y-2">
                  <select className="w-full p-2 border border-stone-200 rounded-md text-sm">
                    <option>Last 30 days</option>
                    <option>Last 3 months</option>
                    <option>Last 6 months</option>
                    <option>Last year</option>
                  </select>
                  <select className="w-full p-2 border border-stone-200 rounded-md text-sm">
                    <option>All services</option>
                    <option>Hair cutting</option>
                    <option>Hair coloring</option>
                    <option>Styling</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Reports */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="text-stone-800">Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "Monthly Revenue Report - December 2023", date: "2024-01-01", type: "PDF" },
              { name: "Client Retention Analysis - Q4 2023", date: "2023-12-28", type: "Excel" },
              { name: "Inventory Usage Report - December 2023", date: "2023-12-25", type: "PDF" },
              { name: "Staff Performance Report - December 2023", date: "2023-12-22", type: "PDF" },
            ].map((report, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-stone-800">{report.name}</p>
                  <p className="text-xs text-stone-600">Generated on {report.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-stone-200 text-stone-600">
                    {report.type}
                  </Badge>
                  <Button size="sm" variant="outline" className="border-stone-200 text-stone-600 hover:bg-stone-50">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;
