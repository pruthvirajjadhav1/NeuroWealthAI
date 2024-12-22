import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@db/schema";
import { useEffect } from "react";
import { useSearchParams } from "@/hooks/use-search-params";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const { register } = useUser();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  // Redirect if no token provided
  // useEffect(() => {
  //   if (!token) {
  //     window.location.href = '/login';
  //   }
  // }, [token]);

  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      token: token || "",
    },
  });

  const onSubmit = async (values: { username: string; password: string; email?: string }) => {
    try {
      try {
        console.log('[Client Registration Debug] Starting registration:' )
        // Get stored UTM data from localStorage
        const storedUtmData = localStorage.getItem('utm_data');
        console.log('[UTM Debug] Retrieved stored UTM data:', {
          hasStoredData: !!storedUtmData,
          storedData: storedUtmData,
          timestamp: new Date().toISOString()
        });

        // Get token data to retrieve UTM parameters
        const tokenResponse = await fetch(`/api/admin/token-info?token=${token}`);
        const tokenData = await tokenResponse.json();
        const utmData = tokenData?.parameters?.utm_data;

        console.log('[UTM Debug] Token info response:', {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          tokenData: {
            ...tokenData,
            hasParameters: !!tokenData?.parameters,
            hasUtmData: !!tokenData?.parameters?.utm_data,
            utmDataContent: tokenData?.parameters?.utm_data
          },
          headers: Object.fromEntries(tokenResponse.headers.entries()),
          timestamp: new Date().toISOString()
        });

        // Parse stored UTM data
        const parsedUtmData = storedUtmData ? JSON.parse(storedUtmData) : null;
        console.log('[UTM Debug] Preparing registration data:', {
          hasUsername: !!values.username,
          hasPassword: !!values.password,
          hasEmail: !!values.email,
          hasToken: !!token,
          tokenValue: token,
          utmSources: {
            fromToken: utmData,
            fromLocalStorage: parsedUtmData,
            finalData: parsedUtmData || utmData
          },
          currentUrl: window.location.href,
          urlParams: Object.fromEntries(new URLSearchParams(window.location.search).entries()),
          timestamp: new Date().toISOString()
        });
        
        // Include UTM data from token in registration
        await register({
          ...values,
          token,
          utm_data: parsedUtmData || utmData
        });
      } catch (error) {
        console.error('[Client Registration Debug] Failed to fetch token info:', error);
        // Proceed with registration without UTM data if token info fetch fails
        await register({
          ...values,
          token
        });
      }
      
      // Clean up any stored UTM data
      localStorage.removeItem('utm_data');
    } catch (error) {
      console.error('[Client Registration Debug] Registration failed:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        values: {
          hasUsername: !!values.username,
          hasPassword: !!values.password,
          hasEmail: !!values.email,
          hasToken: !!token
        }
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">NeuroWealth AI</h1>
          <p className="text-muted-foreground mt-2">
            Transform your wealth consciousness through voice analysis
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription>
              Create a new account to start your journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Register
                </Button>
              </form>
            </Form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">
                Already have an account? Login here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}