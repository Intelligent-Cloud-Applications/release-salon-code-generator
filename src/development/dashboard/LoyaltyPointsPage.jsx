import React, { useState } from "react";
import { Gift, Plus, Search, Star, Award, TrendingUp, Users, Crown, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";

const LoyaltyPointsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [members] = useState([
    {
      id: 1,
      name: "Jennifer Smith",
      phone: "+1 (555) 123-4567",
      email: "jennifer@email.com",
      totalPoints: 1250,
      availablePoints: 850,
      redeemedPoints: 400,
      tier: "Gold",
      joinDate: "2023-06-15",
      lastVisit: "2024-01-20",
      totalVisits: 24,
      status: "active",
      notes: "VIP customer, very loyal",
    },
    {
      id: 2,
      name: "Robert Johnson",
      phone: "+1 (555) 234-5678",
      email: "robert@email.com",
      totalPoints: 680,
      availablePoints: 680,
      redeemedPoints: 0,
      tier: "Silver",
      joinDate: "2023-08-22",
      lastVisit: "2024-01-18",
      totalVisits: 12,
      status: "active",
      notes: "Regular customer",
    },
    {
      id: 3,
      name: "Maria Garcia",
      phone: "+1 (555) 345-6789",
      email: "maria@email.com",
      totalPoints: 320,
      availablePoints: 320,
      redeemedPoints: 0,
      tier: "Bronze",
      joinDate: "2023-11-10",
      lastVisit: "2024-01-15",
      totalVisits: 6,
      status: "active",
      notes: "New member, showing good potential",
    },
    {
      id: 4,
      name: "David Lee",
      phone: "+1 (555) 456-7890",
      email: "david@email.com",
      totalPoints: 2100,
      availablePoints: 1200,
      redeemedPoints: 900,
      tier: "Platinum",
      joinDate: "2023-03-05",
      lastVisit: "2024-01-19",
      totalVisits: 35,
      status: "active",
      notes: "Top tier customer, highest points holder",
    },
    {
      id: 5,
      name: "Lisa Brown",
      phone: "+1 (555) 567-8901",
      email: "lisa@email.com",
      totalPoints: 150,
      availablePoints: 150,
      redeemedPoints: 0,
      tier: "Bronze",
      joinDate: "2023-12-28",
      lastVisit: "2024-01-10",
      totalVisits: 3,
      status: "inactive",
      notes: "Inactive for 2 months",
    },
  ]);

  const getTierBadge = (tier) => {
    const tierConfig = {
      Bronze: { variant: "secondary", className: "bg-orange-100 text-orange-800", icon: Star },
      Silver: { variant: "default", className: "bg-gray-100 text-gray-800", icon: Award },
      Gold: { variant: "default", className: "bg-yellow-100 text-yellow-800", icon: Crown },
      Platinum: { variant: "default", className: "bg-purple-100 text-purple-800", icon: Crown },
    };
    const config = tierConfig[tier] || tierConfig.Bronze;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className={`${config.className} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {tier}
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { variant: "default", className: "bg-green-100 text-green-800" },
      inactive: { variant: "secondary", className: "bg-gray-100 text-gray-800" },
    };
    const config = statusConfig[status] || statusConfig.active;
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phone.includes(searchTerm) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === 'active').length;
  const totalPointsIssued = members.reduce((sum, member) => sum + member.totalPoints, 0);
  const totalPointsRedeemed = members.reduce((sum, member) => sum + member.redeemedPoints, 0);
  const availablePoints = members.reduce((sum, member) => sum + member.availablePoints, 0);

  const tierDistribution = members.reduce((acc, member) => {
    acc[member.tier] = (acc[member.tier] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="poppins-regular space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">Loyalty Points Program</h1>
          <p className="text-stone-600">Manage your salon's loyalty program and member rewards</p>
        </div>
        <Button className="bg-stone-600 hover:bg-stone-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      {/* Program Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-stone-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-600">Total Members</p>
                <p className="text-2xl font-bold text-stone-800">{totalMembers}</p>
              </div>
              <div className="p-3 rounded-lg bg-stone-100">
                <Users className="h-6 w-6 text-stone-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-600">Active Members</p>
                <p className="text-2xl font-bold text-green-600">{activeMembers}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-100">
                <Gift className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-600">Points Issued</p>
                <p className="text-2xl font-bold text-blue-600">{totalPointsIssued.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-600">Available Points</p>
                <p className="text-2xl font-bold text-purple-600">{availablePoints.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(tierDistribution).map(([tier, count]) => (
          <Card key={tier} className="border-stone-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-600">{tier} Members</p>
                  <p className="text-xl font-bold text-stone-800">{count}</p>
                </div>
                {getTierBadge(tier)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Stats */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 h-4 w-4" />
          <Input
            placeholder="Search members by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-stone-200"
          />
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-stone-100 text-stone-800">
            Total: {totalMembers}
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Active: {activeMembers}
          </Badge>
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="border-stone-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-stone-200 flex items-center justify-center">
                    <Gift className="h-6 w-6 text-stone-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-stone-800">{member.name}</CardTitle>
                    <p className="text-sm text-stone-600">Member ID: #{member.id}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {getTierBadge(member.tier)}
                  {getStatusBadge(member.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Contact Information */}
              <div className="space-y-2">
                <p className="text-sm text-stone-600">{member.phone}</p>
                <p className="text-sm text-stone-600">{member.email}</p>
              </div>

              {/* Points Information */}
              <div className="pt-3 border-t border-stone-100">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-stone-800">{member.totalPoints}</p>
                    <p className="text-xs text-stone-600">Total Points</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600">{member.availablePoints}</p>
                    <p className="text-xs text-stone-600">Available</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-blue-600">{member.redeemedPoints}</p>
                    <p className="text-xs text-stone-600">Redeemed</p>
                  </div>
                </div>
              </div>

              {/* Member Stats */}
              <div className="pt-3 border-t border-stone-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-stone-600">Total Visits</p>
                    <p className="text-sm font-medium text-stone-800">{member.totalVisits}</p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-600">Last Visit</p>
                    <p className="text-sm font-medium text-stone-800">{member.lastVisit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-600">Join Date</p>
                    <p className="text-sm font-medium text-stone-800">{member.joinDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-600">Status</p>
                    <p className="text-sm font-medium text-stone-800">{member.status}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {member.notes && (
                <div className="pt-3 border-t border-stone-100">
                  <p className="text-xs text-stone-500 italic">"{member.notes}"</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-3">
                <Button variant="outline" size="sm" className="flex-1 border-stone-200 text-stone-600 hover:bg-stone-50">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="border-stone-200 text-stone-600 hover:bg-stone-50">
                  <Gift className="h-4 w-4 mr-1" />
                  Add Points
                </Button>
                <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <Gift className="h-12 w-12 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-stone-600 mb-2">No members found</h3>
          <p className="text-stone-500">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
};

export default LoyaltyPointsPage;
