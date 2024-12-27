import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatDistance, format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import axios from "axios";

type User = {
  id: number;
  username: string;
  email?: string;
  subscriptionStatus: "paid" | "trial" | "churned" | "free";
  createdAt: string;
  lastAccessDate: string;
  totalSessions: number;
  isDebug: boolean;
  isIntro: boolean;
  utm_source?: string;
  utm_adid?: string;
  utm_angle?: string;
  utm_funnel?: string;
};

type LtvTransaction = {
  id: number;
  amount: number;
  type: "addition" | "deduction";
  createdAt: string;
};

type LtvData = {
  transactions: LtvTransaction[];
  totalLtv: number;
};

export default function UserManagementPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userUtmData, setUserUtmData] = useState<{
    utm_source?: string;
    utm_adid?: string;
    utm_angle?: string;
    utm_funnel?: string;
  } | null>(null);
  const [open, setOpen] = useState(false);
  const [ltvDialogOpen, setLtvDialogOpen] = useState(false);
  const [ltvData, setLtvData] = useState<Record<number, number>>({});

  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (user?.isAdmin) {
      const fetchUsers = async () => {
        const response = await axios.get("/api/users/data");
        console.log(response);
        if (response.status == 200) {
          setUsers(response.data);
        } else {
          setError("Failed to fetch users.");
        }
      };
      fetchUsers();
    }
  }, [user]);

  useEffect(() => {
    const fetchAllLtvData = async () => {
      const ltvMap: Record<number, number> = {};
      await Promise.all(
        users.map(async (user) => {
          try {
            const response = await fetch(`/api/admin/users/${user.id}/ltv`, {
              credentials: "include",
            });
            if (response.ok) {
              const data = await response.json();
              ltvMap[user.id] = data.totalSpent; // Or `data.totalLtv` based on your API response
            }
          } catch (error) {
            console.error(
              `Error fetching LTV data for user ${user.id}:`,
              error
            );
          }
        })
      );
      setLtvData(ltvMap);
    };

    if (users.length > 0) {
      fetchAllLtvData();
    }
  }, [users]);

  const updateUserStatus = async (
    userId: number,
    newStatus: "paid" | "trial" | "churned" | "free",
    isDebug?: boolean
  ) => {
    try {
      console.log("[UserManagement] Attempting to update user status:", {
        userId,
        newStatus,
        isDebug,
      });

      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          ...(isDebug !== undefined && { isDebug }),
        }),
      });

      const responseData = await response.text();
      console.log("[UserManagement] Update status response:", {
        status: response.status,
        ok: response.ok,
        data: responseData,
      });

      if (response.ok) {
        setUsers(
          users.map((user) =>
            user.id === userId
              ? { ...user, subscriptionStatus: newStatus }
              : user
          )
        );
        toast({
          title: "Success",
          description: "User status updated successfully",
        });
      } else {
        throw new Error(`Failed to update user status: ${responseData}`);
      }
    } catch (error) {
      console.error("[UserManagement] Error updating user status:", {
        error,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  // const fetchLtvData = async (userId: number) => {
  //   try {
  //     const response = await fetch(`/api/admin/users/${userId}/ltv`, {
  //       credentials: "include",
  //     });
  //     if (response.ok) {
  //       const data = await response.json();
  //       setLtvData(data);
  //     } else {
  //       throw new Error("Failed to fetch LTV data");
  //     }
  //   } catch (error) {
  //     console.error("Error fetching LTV data:", error);
  //     toast({
  //       title: "Error",
  //       description: "Failed to fetch LTV data",
  //       variant: "destructive",
  //     });
  //   }
  // };

  // const recordLtvTransaction = async (
  //   userId: number,
  //   type: "addition" | "deduction"
  // ) => {
  //   try {
  //     const response = await fetch(`/api/admin/users/${userId}/ltv`, {
  //       method: "POST",
  //       credentials: "include",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         type,
  //         amount: 2999, // $29.99 in cents
  //       }),
  //     });

  //     if (response.ok) {
  //       await fetchLtvData(userId);
  //       toast({
  //         title: "Success",
  //         description: `Successfully recorded ${type}`,
  //       });
  //     } else {
  //       throw new Error("Failed to record transaction");
  //     }
  //   } catch (error) {
  //     console.error("Error recording transaction:", error);
  //     toast({
  //       title: "Error",
  //       description: "Failed to record transaction",
  //       variant: "destructive",
  //     });
  //   }
  // };

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Early return if not admin, but don't redirect
  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>

      {error && (
        <div className="mb-6 p-4 border border-red-500 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="mb-6">
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Intro Flow</TableHead>
              <TableHead>Status</TableHead>
              {/* <TableHead>Debug Mode</TableHead> */}
              <TableHead>Created</TableHead>
              <TableHead>Last Access</TableHead>
              {/* <TableHead>Total Sessions</TableHead> */}
              <TableHead>Total LTV</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email || "-"}</TableCell>
                <TableCell>
                  {user.isIntro ? (
                    <span className="text-emerald-600 font-medium">Yes</span>
                  ) : (
                    <span className="text-gray-600 font-medium">No</span>
                  )}
                </TableCell>
                <TableCell className="space-y-2">
                  <Select
                    value={user.subscriptionStatus}
                    onValueChange={(
                      value: "paid" | "trial" | "churned" | "free"
                    ) => updateUserStatus(user.id, value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="churned">Churned</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                {/* <TableCell className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={user.isDebug}
                      onChange={(e) =>
                        updateUserStatus(
                          user.id,
                          user.subscriptionStatus,
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-muted-foreground">
                      Debug Mode
                    </span>
                  </div>
                </TableCell> */}
                <TableCell>
                  {formatDistance(new Date(user.createdAt), new Date(), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell>
                  {formatDistance(new Date(user.lastAccessDate), new Date(), {
                    addSuffix: true,
                  })}
                </TableCell>
                {/* <TableCell>{user.totalSessions}</TableCell> */}
                <TableCell>
                  <div className="space-y-2">{ltvData[user.id] || 0}</div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View details for {selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">UTM Source</p>
                  <p className="text-sm text-muted-foreground">
                    {userUtmData?.utm_source || "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">UTM AdID</p>
                  <p className="text-sm text-muted-foreground">
                    {userUtmData?.utm_adid || "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">UTM Angle</p>
                  <p className="text-sm text-muted-foreground">
                    {userUtmData?.utm_angle || "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">UTM Funnel</p>
                  <p className="text-sm text-muted-foreground">
                    {userUtmData?.utm_funnel || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
