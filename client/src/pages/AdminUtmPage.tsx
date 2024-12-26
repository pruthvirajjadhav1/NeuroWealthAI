import { Table, TableHeader, TableRow } from "@/components/ui/table";
import { TableBody, TableCell, TableHead } from "@/components/ui/table";
import React, { useEffect, useState } from "react";
import axios from "axios";
import SearchBar from "@/components/SearchBar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const AdminUtmPage = () => {
  const [utmDatas, setUtmData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedColumn, setSelectedColumn] = useState<string>("userId");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    freeUsers: 0,
    trialUsers: 0,
    paidUsers: 0,
    churnedUsers: 0,
  });
  const [ltvAnalytics, setLtvAnalytics] = useState({
    freeUsersLTV: 0,
    trialUsersLTV: 0,
    paidUsersLTV: 0,
    churnedUsersLTV: 0,
  });

  // Fetch data based on user request
  const fetchFilteredUserAnalytics = async () => {
    if (searchQuery && selectedColumn) {
      try {
        const response = await axios.get("/api/users/analytics", {
          params: {
            column: selectedColumn,
            query: searchQuery,
          },
        });

        setAnalytics({
          totalUsers: response.data.totalUsers,
          freeUsers: response.data.freeUsers,
          trialUsers: response.data.trialUsers,
          paidUsers: response.data.paidUsers,
          churnedUsers: response.data.churnedUsers,
        });

        setLtvAnalytics({
          freeUsersLTV: response.data.freeUsersLTV,
          trialUsersLTV: response.data.trialUsersLTV,
          paidUsersLTV: response.data.paidUsersLTV,
          churnedUsersLTV: response.data.churnedUsersLTV,
        });
      } catch (error) {
        console.error("Error fetching filtered user analytics:", error);
      }
    }
  };

  // Fetch UTM data once on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const utmResponse = await axios.get("/api/users/utm");
        setUtmData(utmResponse.data);
        setFilteredData(utmResponse.data);
      } catch (error) {
        console.error("Error fetching UTM data:", error);
      } finally {
        setLoading(false);
      }
    };
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/users/analytics/all');
        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    
    fetchData();
    fetchAnalytics();
  }, []);

  const handleSearchClick = () => {
    fetchFilteredUserAnalytics();
  };

  return (
    <>
      <div className="p-6 min-h-screen">
        <h1 className="text-2xl font-semibold text-white mb-8">Analytics</h1>

        <div className="flex flex-wrap items-center justify-end gap-4 mb-4 w-full">
          <SearchBar onSearch={(query) => setSearchQuery(query)} />
          <select
            value={selectedColumn}
            onChange={(e) => setSelectedColumn(e.target.value)}
            className="w-full sm:w-1/5 h-10 border border-gray-700 rounded px-4 py-2 bg-gray-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="userId">User ID</option>
            <option value="source">Source</option>
            <option value="adid">Adid</option>
            <option value="angle">Angle</option>
            <option value="funnel">Funnel</option>
            <option value="rawParams">Params</option>
            <option value="createdAt">Created At</option>
          </select>

          {/* Button to trigger search */}
          <button
            onClick={fetchFilteredUserAnalytics}
            className="w-auto h-10 bg-blue-600 text-white px-4 py-2 rounded"
          >
            Search
          </button>
        </div>

        {/* First Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
          {/* Analytics Cards */}
          <Card className="border-0">
            <CardHeader className="pb-2">
              <h2 className="text-white text-sm font-medium">Total Users</h2>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-white">
              {analytics?.totalUsers || 0}
            </CardContent>
          </Card>

          <Card className="border-0">
            <CardHeader className="pb-2">
              <h2 className="text-white text-sm font-medium">Free Users</h2>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-white">
              {analytics?.freeUsers || 0}
            </CardContent>
          </Card>

          <Card className="border-0">
            <CardHeader className="pb-2">
              <h2 className="text-white text-sm font-medium">Trial Users</h2>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-white">
              {analytics?.trialUsers || 0}
            </CardContent>
          </Card>

          <Card className="border-0">
            <CardHeader className="pb-2">
              <h2 className="text-white text-sm font-medium">Paid Users</h2>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-white">
              {analytics?.paidUsers || 0}
            </CardContent>
          </Card>

          <Card className="border-0">
            <CardHeader className="pb-2">
              <h2 className="text-white text-sm font-medium">Churned Users</h2>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-white">
              {analytics?.churnedUsers || 0}
            </CardContent>
          </Card>

          {/* LTV Cards */}
          <Card className="border-0">
            <CardHeader className="pb-2">
              <h2 className="text-white text-sm font-medium">Free Users LTV</h2>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-white">
              {ltvAnalytics?.freeUsersLTV || 0}
            </CardContent>
          </Card>

          <Card className="border-0">
            <CardHeader className="pb-2">
              <h2 className="text-white text-sm font-medium">Trial Users LTV</h2>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-white">
              {ltvAnalytics?.trialUsersLTV || 0}
            </CardContent>
          </Card>

          <Card className="border-0">
            <CardHeader className="pb-2">
              <h2 className="text-white text-sm font-medium">Paid Users LTV</h2>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-white">
              {ltvAnalytics?.paidUsersLTV || 0}
            </CardContent>
          </Card>

          <Card className="border-0">
            <CardHeader className="pb-2">
              <h2 className="text-white text-sm font-medium">Churned Users LTV</h2>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-white">
              {ltvAnalytics?.churnedUsersLTV || 0}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AdminUtmPage;
