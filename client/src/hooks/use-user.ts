import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { User } from "@db/schema";
import { useSearchParams } from "./use-search-params";

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
  const [isIntro, setIsIntro] = useState(false);
   const [searchParams] = useSearchParams();
  const flag = searchParams.get('is_intro');
  console.log(`flag is ${flag}`)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const introParam = urlParams.get("is_intro");
    if (flag) {
      setIsIntro(true);
          console.log(`is_intro is ${isIntro}`);
    }
    console.log(`is_intro is ${isIntro}`);
  }, []); // This will only run once on component mount

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
      console.log(`setting user_data ... ${JSON.stringify(data)}`)
  
      setUser(data);
      return data
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch user"));
    } finally {
      setIsLoading(false);
    }
  };
const triggerFunnelEvent = async (userId: string) => {
  console.log("Triggering funnel event for intro user");

  // Updated endpoint and ensured consistency with the funnel tracking format
  const funnelResponse = await fetch("/api/admin/funnel/track", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      eventType: "user_registered", // Ensure consistency with expected funnel events
      eventData: JSON.stringify({ source: "intro_flow" }), // eventData should be serialized as a string
      userId,
      sessionId: localStorage.getItem("sessionId") || Math.random().toString(36).substring(7), // Ensure sessionId exists
      clientTimestamp: new Date().toISOString(), // Match the funnel track format
    }),
  });

  const responseJson = await funnelResponse.json();

  console.log("Funnel Event Response:", responseJson);

  // Handle errors in the response
  if (!funnelResponse.ok) {
    console.error("Failed to trigger funnel event:", responseJson);
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
  const result = await handleRequest("/api/register", "POST", {
    ...userData,  // Spread the existing user data
    isIntro: isIntro,  // Add the isIntro value here
  });
    if (!result.ok) {
      toast({
        title: "Registration failed",
        description: result.message,
        variant: "destructive",
      });
    } else {
      const fetchedUser = await fetchUser(); // This fetches and updates the state
    console.log(`Fetched user data: ${JSON.stringify(fetchedUser)}`);
    
    // Use the fetched user data directly
    if (flag && fetchedUser?.id) {
      console.log(`Triggering event for user ID: ${fetchedUser.id}`);
      await triggerFunnelEvent(fetchedUser.id);
    }
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
