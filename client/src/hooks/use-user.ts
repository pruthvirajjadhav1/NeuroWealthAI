import { useState, useEffect } from "react";
import type { User } from "@db/schema";
import { useToast } from "@/hooks/use-toast";

type RequestResult = {
  ok: true;
  isAdmin?: boolean;
} | {
  ok: false;
  message: string;
};

async function handleRequest(
  url: string,
  method: string,
  body?: any
): Promise<RequestResult> {
  try {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    if (!response.ok) {
      const message = await response.text();
      return { ok: false, message };
    }

    const data = await response.json();
    return { ok: true, isAdmin: data.user?.isAdmin };
  } catch (e: any) {
    return { ok: false, message: e.toString() };
  }
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/user", {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          setUser(null);
          setIsLoading(false);
          return;
        }
        throw new Error(await response.text());
      }

      const data = await response.json();
      setUser(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch user"));
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: any) => {
    const result = await handleRequest("/api/login", "POST", userData);
    if (!result.ok) {
      toast({
        title: "Login failed",
        description: result.message,
        variant: "destructive",
      });
    } else {
      await fetchUser();
      // Redirect admin users to /admin, others to dashboard
      window.location.href = result.isAdmin ? '/admin' : '/';
    }
    return result;
  };

  const logout = async () => {
    const result = await handleRequest("/api/logout", "POST");
    if (!result.ok) {
      toast({
        title: "Logout failed",
        description: result.message,
        variant: "destructive",
      });
    } else {
      setUser(null);
      window.location.href = '/login';
    }
    return result;
  };

  const register = async (userData: any) => {
    const result = await handleRequest("/api/register", "POST", userData);
    if (!result.ok) {
      toast({
        title: "Registration failed",
        description: result.message,
        variant: "destructive",
      });
    } else {
      await fetchUser();
      window.location.href = '/';
    }
    return result;
  };

  return {
    user,
    isLoading,
    error,
    login,
    logout,
    register,
  };
}