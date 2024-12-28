import { useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistance } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type Token = {
  id: number;
  token: string;
  createdAt: string;
  usedAt: string | null;
  usedBy: number | null;
  isActive: boolean;
  subscriptionType: 'paid' | 'trial' | 'free';
  parameters: Record<string, any>;
};

export default function AdminPage() {
  const { user, isLoading } = useUser();
  const { toast } = useToast();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [registrationLink, setRegistrationLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    console.log('[Admin Page Mount]', {
      isLoading,
      user: user ? {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
      } : null,
      timestamp: new Date().toISOString()
    });

    // Wait for user data to be loaded
    if (isLoading) {
      return;
    }

    setIsInitialLoad(false);

    // Only proceed with admin checks after user data is loaded
    if (!user?.isAdmin) {
      console.error('[Admin Page Access Denied]', {
        reason: 'User is not admin',
        user: user ? {
          id: user.id,
          username: user.username,
          isAdmin: user.isAdmin
        } : 'No user',
        timestamp: new Date().toISOString()
      });
      return;
    }

    fetchTokens();
  }, [user, isLoading]);

  const fetchTokens = async () => {
    if (!user?.isAdmin) {
      console.error('[Admin Token Fetch Blocked]', {
        reason: 'Not admin',
        timestamp: new Date().toISOString()
      });
      return;
    }

    setIsFetching(true);
    try {
      console.log('[Admin Token Fetch Start]', {
        userId: user?.id,
        timestamp: new Date().toISOString()
      });

      const response = await fetch("/api/admin/tokens", {
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Cache-Control": "no-cache"
        }
      });

      console.log('[Admin Token Fetch Response]', {
        status: response.status,
        ok: response.ok,
        timestamp: new Date().toISOString()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || await response.text() || 'Failed to fetch tokens';
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('[Admin Token Fetch Success]', {
        tokenCount: data.length,
        timestamp: new Date().toISOString()
      });

      setTokens(data);
      setError(null);
    } catch (error) {
      console.error('[Admin Token Fetch Error]', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        timestamp: new Date().toISOString()
      });

      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tokens';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(registrationLink);
      toast({
        title: "Success",
        description: "Registration link copied to clipboard",
      });
    } catch (error) {
      console.error('[Copy to Clipboard Error]', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        timestamp: new Date().toISOString()
      });
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const generateToken = async (subscriptionType: 'paid' | 'trial' | 'free') => {
    if (!user?.isAdmin) {
      console.error('[Admin Token Generation Blocked]', {
        reason: 'Not admin',
        timestamp: new Date().toISOString()
      });
      return;
    }

    try {
      console.log('[Admin Token Generation Start]', {
        subscriptionType,
        userId: user?.id,
        timestamp: new Date().toISOString()
      });

      const response = await fetch("/api/admin/tokens", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Cache-Control": "no-cache"
        },
        body: JSON.stringify({ subscriptionType }),
      });

      console.log('[Admin Token Generation Response]', {
        status: response.status,
        ok: response.ok,
        timestamp: new Date().toISOString()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || await response.text() || 'Failed to generate token';
        throw new Error(errorMessage);
      }

      const newToken = await response.json();
      const link = `${window.location.origin}/register?token=${newToken.token}`;
      setRegistrationLink(link);
      setError(null);

      console.log('[Admin Token Generation Success]', {
        subscriptionType,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Success",
        description: `New ${subscriptionType} registration token generated`,
      });

      fetchTokens();
    } catch (error) {
      console.error('[Admin Token Generation Error]', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        timestamp: new Date().toISOString()
      });

      const errorMessage = error instanceof Error ? error.message : 'Failed to generate token';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Show loading state while checking user data
  if (isLoading || isInitialLoad || isFetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Early return if not admin, but don't redirect
  if (!user?.isAdmin) {
    console.log('[Admin Page Render Blocked]', {
      reason: 'Not admin',
      user: user ? {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin
      } : 'No user',
      timestamp: new Date().toISOString()
    });
    return null;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Registration Token Management</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => window.location.href = '/admin/users'}
            variant="outline"
            className="border-cyan-700/50 hover:bg-cyan-950/30 hover:border-cyan-600/50 transition-all duration-300"
          >
            Manage Users
          </Button>
          <Button 
            onClick={() => window.location.href = '/admin/funnel'}
            variant="outline"
            className="border-cyan-700/50 hover:bg-cyan-950/30 hover:border-cyan-600/50 transition-all duration-300"
          >
            Funnel Analytics
          </Button>
          <Button 
            onClick={() => window.location.href = '/admin/utm'}
            variant="outline"
            className="border-cyan-700/50 hover:bg-cyan-950/30 hover:border-cyan-600/50 transition-all duration-300"
          >
            Utm Tracking
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 border border-red-500 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="mb-8">
        <div className="flex gap-2 mb-4">
          <Button onClick={() => generateToken('paid')} className="mb-4">
            Generate Paid Token
          </Button>
          <Button onClick={() => generateToken('trial')} variant="outline" className="mb-4">
            Generate Trial Token
          </Button>
          <Button 
            onClick={() => generateToken('free')} 
            variant="outline"
            className="mb-4 border-emerald-700/50 hover:bg-emerald-950/30 hover:border-emerald-600/50"
          >
            Generate Free Token
          </Button>
        </div>

        {registrationLink && (
          <div className="flex gap-2">
            <Input value={registrationLink} readOnly />
            <Button onClick={copyToClipboard}>Copy</Button>
          </div>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Token</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Used At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tokens.map((token) => (
            <TableRow key={token.id}>
              <TableCell>{token.token}</TableCell>
              <TableCell>
                {formatDistance(new Date(token.createdAt), new Date(), { addSuffix: true })}
              </TableCell>
              <TableCell>
                {token.isActive ? (
                  <span className="text-green-600">Active</span>
                ) : (
                  <span className="text-red-600">Used</span>
                )}
              </TableCell>
              <TableCell>
                <span className={token.subscriptionType === 'paid' ? 'text-green-600' : 'text-yellow-600'}>
                  {token.subscriptionType}
                </span>
              </TableCell>
              <TableCell>
                {(() => {
                  console.log('[Admin Page Debug] Token parameters:', {
                    tokenId: token.id,
                    parameters: token.parameters,
                    isIntro: token.parameters?.is_intro,
                    timestamp: new Date().toISOString()
                  });
                  return token.parameters?.is_intro ? 
                    <span className="text-emerald-600">Intro Flow</span> : 
                    <span className="text-blue-600">Direct</span>
                })()}
              </TableCell>
              <TableCell>
                {token.usedAt
                  ? formatDistance(new Date(token.usedAt), new Date(), {
                      addSuffix: true,
                    })
                  : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}