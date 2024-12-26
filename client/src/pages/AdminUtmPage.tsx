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
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    freeUsers: 0,
    trialUsers: 0,
    paidUsers: 0,
    churnedUsers: 0,
  });
  const [ltvanalytics, setltvAnalytics] = useState({
    totalAmount: 0,
    uniqueUsers: 0,
    totalTransactions: 0,
    averageAmountPerTransaction: 0,
    averageAmountPerUser: 0,
  });
  const [userStatistics, setUserStatistics] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get("/api/users/ltvanalytics");
        const { summary, userStatistics } = response.data;

        // Update the analytics state with the fetched summary
        setltvAnalytics({
          totalAmount: summary.totalAmount,
          uniqueUsers: summary.uniqueUsers,
          totalTransactions: summary.totalTransactions,
          averageAmountPerTransaction: summary.averageAmountPerTransaction,
          averageAmountPerUser: summary.averageAmountPerUser,
        });

        // Update the userStatistics state
        setUserStatistics(userStatistics);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      }
    };

    fetchAnalytics();
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get("/api/users/analytics");
        const { totalUsers, subscriptionBreakdown } = response.data.analytics;

        setAnalytics({
          totalUsers,
          freeUsers: subscriptionBreakdown.free || 0,
          trialUsers: subscriptionBreakdown.trial || 0,
          paidUsers: subscriptionBreakdown.paid || 0,
          churnedUsers: subscriptionBreakdown.churned || 0,
        });
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      }
    };

    const getUtmData = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/users/utm");
        setUtmData(response.data);
        setFilteredData(response.data);
      } catch (error) {
        console.error("Error fetching UTM data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    getUtmData();
  }, []);

  useEffect(() => {
    const filterData = () => {
      let filtered = utmDatas;

      if (selectedSource) {
        filtered = filtered.filter((data) => data.source === selectedSource);
      }

      if (searchQuery) {
        filtered = filtered.filter((data) => {
          try {
            const params = JSON.parse(data.rawParams);
            return Object.values(params).some(
              (value) =>
                typeof value === "string" &&
                value.toLowerCase().includes(searchQuery.toLowerCase())
            );
          } catch (error) {
            return false;
          }
        });
      }

      setFilteredData(filtered);
    };

    filterData();
  }, [selectedSource, searchQuery, utmDatas]);

  const renderSkeletonRows = () =>
    Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={index}>
        <TableCell
          className="px-4 py-3 animate-pulse bg-gray-200 dark:bg-gray-700"
          colSpan={7}
        ></TableCell>
      </TableRow>
    ));

  const renderRawParams = (rawParams: string) => {
    try {
      const params = JSON.parse(rawParams);
      return (
        <ul className="list-disc pl-4 text-sm">
          {Object.entries(params).map(([key, value]) => (
            <li key={key}>
              <strong>{key}:</strong> {String(value)}
            </li>
          ))}
        </ul>
      );
    } catch (error) {
      return <span className="text-red-500">Invalid JSON</span>;
    }
  };
  return (
    <>
      <div className="p-6 min-h-screen">
        <h1 className="text-2xl font-semibold text-white mb-8">Analytics</h1>

        {/* First Row */}
        <div className="grid grid-cols-3 gap-6 mb-4">
          {/* Analytics Cards */}
          <Card className=" border-0">
            <CardHeader className="pb-2">
              <h2 className="text-white text-sm font-medium">Total Users</h2>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-white">
              {analytics?.totalUsers || 0}
            </CardContent>
          </Card>

          <Card className=" border-0">
            <CardHeader className="pb-2">
              <h2 className="text-white text-sm font-medium">Free Users</h2>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-white">
              {analytics?.freeUsers || 0}
            </CardContent>
          </Card>

          <Card className=" border-0">
            <CardHeader className="pb-2">
              <h2 className="text-white text-sm font-medium">Trial Users</h2>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-white">
              {analytics?.trialUsers || 0}
            </CardContent>
          </Card>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-3 gap-6 mb-4">
          <Card className=" border-0">
            <CardHeader className="pb-2">
              <h2 className="text-white text-sm font-medium">Paid Users</h2>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-white">
              {analytics?.paidUsers || 0}
            </CardContent>
          </Card>

          <Card className=" border-0">
            <CardHeader className="pb-2">
              <h2 className="text-white text-sm font-medium">Churned Users</h2>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-white">
              {analytics?.churnedUsers || 0}
            </CardContent>
          </Card>

          <Card className=" border-0">
            <CardHeader className="pb-2">
              <h2 className="text-white text-sm font-medium">LTV Value</h2>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-white">
              Total Amount: ${ltvanalytics.totalAmount}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <h2>User Analytics</h2>
          </CardHeader>
          <CardContent>
            <div>
              <p>Total Amount: ${ltvanalytics.totalAmount}</p>
              <p>Unique Users: {ltvanalytics.uniqueUsers}</p>
              <p>Total Transactions: {ltvanalytics.totalTransactions}</p>
              <p>
                Average Amount Per Transaction: $
                {ltvanalytics.averageAmountPerTransaction}
              </p>
              <p>
                Average Amount Per User: ${ltvanalytics.averageAmountPerUser}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Overview Section */}
        <div className="mt-4">
          <div className="w-full p-4 max-w-7xl mx-auto">
            <div className="md:flex justify-between items-center">
              <h1 className="text-lg font-semibold text-white sm:text-xl">
                Overview
                <div className="text-sm text-[#ffffff64]">
                  Manage Sessions and Create
                </div>
              </h1>
              <div className="flex justify-center items-center gap-2">
                <SearchBar onSearch={(query) => setSearchQuery(query)} />
              </div>
            </div>

            <div className="rounded-xl border dark:border-[#3B4254] border-[#E9ECF1] shadow-md overflow-hidden mt-4">
              <div className="overflow-x-auto">
                <Table className="min-w-full">
                  {/* Table Header */}
                  <TableHeader>
                    <TableRow className="bg-gray-100 dark:bg-[#212A39] rounded-t-xl">
                      <TableHead className="border-b dark:border-[#3B4254] px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        User ID
                      </TableHead>
                      <TableHead className="border-b dark:border-[#3B4254] px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Source
                      </TableHead>
                      <TableHead className="border-b dark:border-[#3B4254] px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Adid
                      </TableHead>
                      <TableHead className="border-b dark:border-[#3B4254] px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Angle
                      </TableHead>
                      <TableHead className="border-b dark:border-[#3B4254] px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Funnel
                      </TableHead>
                      <TableHead className="border-b dark:border-[#3B4254] px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Created At
                      </TableHead>
                      <TableHead className="border-b dark:border-[#3B4254] px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Raw Params
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  {/* Table Body */}
                  <TableBody>
                    {loading ? (
                      renderSkeletonRows()
                    ) : filteredData.length > 0 ? (
                      filteredData.map((utmData) => (
                        <TableRow
                          key={utmData.userId}
                          className="hover:bg-gray-100 hover:text-black border-b dark:border-[#3B4254]"
                        >
                          <TableCell className="px-4 py-3">
                            {utmData.userId}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            {utmData.source}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            {utmData.adid}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            {utmData.angle}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            {utmData.funnel}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            {new Date(utmData.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            {renderRawParams(utmData.rawParams)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          No data found for the selected source.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminUtmPage;
