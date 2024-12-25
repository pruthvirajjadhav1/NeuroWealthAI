import { Table, TableHeader, TableRow } from '@/components/ui/table';
import { TableBody, TableCell, TableHead } from "@/components/ui/table";
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SearchBar from '@/components/SearchBar';

const AdminUtmPage = () => {
    const [utmDatas, setUtmData] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSource, setSelectedSource] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");

    useEffect(() => {
        const getUtmData = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/api/users/utm');
                setUtmData(response.data);
                setFilteredData(response.data);
            } catch (error) {
                console.error('Error fetching UTM data:', error);
            } finally {
                setLoading(false);
            }
        };
        getUtmData();
    }, []);

    useEffect(() => {
        const filterData = () => {
            let filtered = utmDatas;

            // Filter by selected source
            if (selectedSource) {
                filtered = filtered.filter((data) => data.source === selectedSource);
            }

            // Filter by search query
            if (searchQuery) {
                filtered = filtered.filter((data) =>
                    Object.values(data).some(value =>
                        typeof value === 'string' && value.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                );
            }

            setFilteredData(filtered);
        };

        filterData();
    }, [selectedSource, searchQuery, utmDatas]);

    const renderSkeletonRows = () => (
        Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
                <TableCell className="px-4 py-3 animate-pulse bg-gray-200 dark:bg-gray-700" colSpan={7}></TableCell>
            </TableRow>
        ))
    );

    const renderRawParams = (rawParams: string) => {
        try {
            const params = JSON.parse(rawParams);
            return (
                <ul className="list-disc pl-4 text-sm">
                    {Object.entries(params).map(([key, value]) => (
                        <li key={key}>
                            <strong>{key}:</strong> {value}
                        </li>
                    ))}
                </ul>
            );
        } catch (error) {
            return <span className="text-red-500">Invalid JSON</span>;
        }
    };

    return (
        <div className="w-full md:mt-10 p-4 max-w-7xl mx-auto">
            <div className='md:flex justify-between items-center '>
                <h1 className="scroll-mt-8 text-lg font-semibold text-white sm:text-xl">
                    Overview
                    <div className='text-sm text-[#ffffff64]'>Manage Sessions and Create</div>
                </h1>
                <div className='flex justify-center items-center gap-2'>
                    <SearchBar onSearch={(query) => setSearchQuery(query)} />
                </div>
            </div>

            {/* Responsive Table Section */}
            <div className="rounded-xl border dark:border-[#3B4254] border-[#E9ECF1] shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <Table className="min-w-full">
                        <TableHeader>
                            <TableRow className="bg-gray-100 dark:bg-[#212A39] rounded-t-xl">
                                <TableHead className="border-b dark:border-[#3B4254] px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">User ID</TableHead>
                                <TableHead className="border-b dark:border-[#3B4254] px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Source</TableHead>
                                <TableHead className="border-b dark:border-[#3B4254] px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Adid</TableHead>
                                <TableHead className="border-b dark:border-[#3B4254] px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Angle</TableHead>
                                <TableHead className="border-b dark:border-[#3B4254] px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Funnel</TableHead>
                                <TableHead className="border-b dark:border-[#3B4254] px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Created At</TableHead>
                                <TableHead className="border-b dark:border-[#3B4254] px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Raw Params</TableHead> {/* New column */}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                renderSkeletonRows()
                            ) : filteredData.length > 0 ? (
                                filteredData.map((utmData) => (
                                    <TableRow key={utmData.userId} className="hover:bg-gray-100 hover:text-black border-b dark:border-[#3B4254]">
                                        <TableCell className="px-4 py-3">{utmData.userId}</TableCell>
                                        <TableCell className="px-4 py-3">{utmData.source}</TableCell>
                                        <TableCell className="px-4 py-3">{utmData.adid}</TableCell>
                                        <TableCell className="px-4 py-3">{utmData.angle}</TableCell>
                                        <TableCell className="px-4 py-3">{utmData.funnel}</TableCell>
                                        <TableCell className="px-4 py-3">{new Date(utmData.createdAt).toLocaleString()}</TableCell>
                                        <TableCell className="px-4 py-3">{renderRawParams(utmData.rawParams)}</TableCell> {/* Raw Params column */}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-4">No data found for the selected source.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
};

export default AdminUtmPage;
