import { Switch, Route, Link, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useUser } from "./hooks/use-user";
import { DailyOverlay } from "@/components/DailyOverlay";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarClose,
} from "@/components/ui/sidebar";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import GammaSessionPage from "./pages/GammaSessionPage";
import AdvisorPage from "./pages/AdvisorPage";
import CommunityPage from "./pages/CommunityPage";
import ActionGuidePage from "./pages/ActionGuidePage";
import AdminPage from "./pages/AdminPage";
import UserManagementPage from "./pages/UserManagementPage";
import ResultsPage from "./pages/ResultsPage";
import ScientificAnalysisPage from "./pages/ScientificAnalysisPage";
import AffirmationsPage from "./pages/AffirmationsPage";
import TrialPage from "./pages/TrialPage";
import TrialSuccessPage from "./pages/TrialSuccessPage";
import ProofPage from "./pages/ProofPage";
import HelpPage from "./pages/HelpPage";
import IntroPage from "./pages/IntroPage";
import FunnelAnalyticsPage from "./pages/FunnelAnalyticsPage";
import { cn } from "@/lib/utils";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { HelpCircle } from "lucide-react";
import AdminUtmPage from "./pages/AdminUtmPage";

function App() {
  const { user, isLoading } = useUser();
  const [location] = useLocation();

  // Add debug logging for authentication state
  console.log('[App Authentication Debug]', {
    location,
    isLoading,
    user: user ? {
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin
    } : null,
    timestamp: new Date().toISOString()
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Handle authentication-exempt pages
  if (location === "/register") {
    return <RegisterPage />;
  }

  if (location === "/intro") {
    return <IntroPage />;
  }

  if (location === "/forgot-password") {
    return <ForgotPasswordPage />;
  }

  if (location.startsWith("/reset-password/")) {
    return <ResetPasswordPage />;
  }

  // Handle admin page access with detailed logging
  if (location === "/admin" || location.startsWith("/admin/")) {
    console.log('[Admin Route Check]', {
      location,
      isAuthenticated: !!user,
      isAdmin: user?.isAdmin,
      timestamp: new Date().toISOString()
    });

    if (!user) {
      console.log('[Admin Route Redirect]', {
        reason: 'Not authenticated',
        redirectTo: '/login',
        timestamp: new Date().toISOString()
      });
      return <LoginPage />;
    }

    if (!user.isAdmin) {
      console.log('[Admin Route Redirect]', {
        reason: 'Not admin',
        userId: user.id,
        username: user.username,
        redirectTo: '/',
        timestamp: new Date().toISOString()
      });
      return <HomePage />;  // Component-based redirect instead of window.location
    }

    console.log('[Admin Route Access Granted]', {
      userId: user.id,
      username: user.username,
      location,
      timestamp: new Date().toISOString()
    });

    if (location === "/admin") return <AdminPage />;
    if (location === "/admin/users") return <UserManagementPage />;
    if (location === "/admin/funnel") return <FunnelAnalyticsPage />;
    if (location === "/admin/utm") return <AdminUtmPage />
    return <AdminPage />; 
  }

  // Handle regular authentication
  if (!user) {
    return <LoginPage />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <div className="flex min-h-screen bg-neural-gradient animate-neural-flow">
          <div className="fixed inset-0 bg-wealth-pattern opacity-30 pointer-events-none" />
          <header className="absolute top-0 left-0 right-0 z-50 bg-background/40 backdrop-blur-sm border-b border-primary/10 shadow-glow">
            <div className="container mx-auto px-4">
              <div className="flex h-16 items-center justify-between w-full">
                <div className="flex items-center">
                  <SidebarTrigger className="md:hidden mr-4" />
                  <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
                    <span
                      onClick={() => window.location.href = "/"}
                      className={cn(
                        "relative px-3 py-2 rounded-md transition-all duration-300 hover:bg-primary/10 hover:shadow-glow-sm cursor-pointer group",
                        location === "/" ? "text-primary animate-pulse-glow" : "text-foreground/70"
                      )}>
                      <span className="relative z-10 group-hover:text-primary transition-colors">Voice Analysis</span>
                    </span>
                    <span
                      onClick={() => window.location.href = "/gamma"}
                      className={cn(
                        "relative px-3 py-2 rounded-md transition-all duration-300 hover:bg-primary/10 hover:shadow-glow-sm cursor-pointer group",
                        location === "/gamma" ? "text-primary animate-pulse-glow" : "text-foreground/70"
                      )}>
                      <span className="relative z-10 group-hover:text-primary transition-colors">Gamma Sessions</span>
                    </span>
                    <span
                      onClick={() => window.location.href = "/advisor"}
                      className={cn(
                        "relative px-3 py-2 rounded-md transition-all duration-300 hover:bg-primary/10 hover:shadow-glow-sm cursor-pointer group",
                        location === "/advisor" ? "text-primary animate-pulse-glow" : "text-foreground/70"
                      )}>
                      <span className="relative z-10 group-hover:text-primary transition-colors">Frequency Advisor</span>
                    </span>
                    <span
                      onClick={() => window.location.href = "/community"}
                      className={cn(
                        "relative px-3 py-2 rounded-md transition-all duration-300 hover:bg-primary/10 hover:shadow-glow-sm cursor-pointer group",
                        location === "/community" ? "text-primary animate-pulse-glow" : "text-foreground/70"
                      )}>
                      <span className="relative z-10 group-hover:text-primary transition-colors">Community</span>
                    </span>
                    <span
                      onClick={() => window.location.href = "/action-guide"}
                      className={cn(
                        "relative px-3 py-2 rounded-md transition-all duration-300 hover:bg-primary/10 hover:shadow-glow-sm cursor-pointer group",
                        location === "/action-guide" ? "text-primary animate-pulse-glow" : "text-foreground/70"
                      )}>
                      <span className="relative z-10 group-hover:text-primary transition-colors">Action Guide</span>
                    </span>
                    <span
                      onClick={() => window.location.href = "/scientific-analysis"}
                      className={cn(
                        "relative px-3 py-2 rounded-md transition-all duration-300 hover:bg-primary/10 hover:shadow-glow-sm cursor-pointer group",
                        location === "/scientific-analysis" ? "text-primary animate-pulse-glow" : "text-foreground/70"
                      )}>
                      <span className="relative z-10 group-hover:text-primary transition-colors">Scientific Analysis</span>
                    </span>
                    <span
                      onClick={() => window.location.href = "/affirmations"}
                      className={cn(
                        "relative px-3 py-2 rounded-md transition-all duration-300 hover:bg-primary/10 hover:shadow-glow-sm cursor-pointer group",
                        location === "/affirmations" ? "text-primary animate-pulse-glow" : "text-foreground/70"
                      )}>
                      <span className="relative z-10 group-hover:text-primary transition-colors">Wealth Affirmations</span>
                    </span>
                    <span
                      onClick={() => window.location.href = "/help"}
                      className={cn(
                        "relative px-3 py-2 rounded-md transition-all duration-300 hover:bg-primary/10 hover:shadow-glow-sm cursor-pointer group",
                        location === "/help" ? "text-primary animate-pulse-glow" : "text-foreground/70"
                      )}>
                      <span className="relative z-10 group-hover:text-primary transition-colors flex items-center">
                        <HelpCircle className="w-4 h-4 mr-2" />
                        Help
                      </span>
                    </span>
                    <span
                      onClick={() => {
                        fetch('/api/logout', {
                          method: 'POST',
                          credentials: 'include'
                        }).then(() => window.location.href = '/login');
                      }}
                      className="relative px-3 py-2 rounded-md transition-all duration-300 hover:bg-red-500/10 hover:shadow-glow-sm cursor-pointer text-red-500 hover:text-red-400">
                      <span className="relative z-10 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Logout
                      </span>
                    </span>
                  </nav>
                </div>
              </div>
            </div>
          </header>

          <Sidebar variant="floating" collapsible="offcanvas">
            <SidebarClose />
            <SidebarHeader className="relative">
              <h2 className="text-lg font-semibold px-2 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">Navigation</h2>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => window.location.href = "/"}
                    isActive={location === "/"}>
                    Voice Analysis
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => window.location.href = "/gamma"}
                    isActive={location === "/gamma"}>
                    Gamma Sessions
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => window.location.href = "/advisor"}
                    isActive={location === "/advisor"}>
                    Frequency Advisor
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => window.location.href = "/community"}
                    isActive={location === "/community"}>
                    Community
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => window.location.href = "/action-guide"}
                    isActive={location === "/action-guide"}>
                    Action Guide
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => window.location.href = "/scientific-analysis"}
                    isActive={location === "/scientific-analysis"}>
                    Scientific Analysis
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => window.location.href = "/affirmations"}
                    isActive={location === "/affirmations"}>
                    Wealth Affirmations
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => window.location.href = "/help"}
                    isActive={location === "/help"}
                    className="flex items-center"
                  >
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Help
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
              <div className="mt-auto p-4 border-t border-primary/20">
                <SidebarMenuButton
                  onClick={() => {
                    fetch('/api/logout', {
                      method: 'POST',
                      credentials: 'include'
                    }).then(() => window.location.href = '/login');
                  }}
                  className="w-full justify-start text-red-500 hover:text-red-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Logout
                </SidebarMenuButton>
              </div>
            </SidebarContent>
          </Sidebar>

          <DailyOverlay />

          <div className="flex-1 mt-16 pt-16"> {/* Added top margin and padding to account for header and overlay */}
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/admin" component={AdminPage} />
              <Route path="/admin/users" component={UserManagementPage} />
              <Route path="/admin/funnel" component={FunnelAnalyticsPage} />
              <Route path="/gamma" component={GammaSessionPage} />
              <Route path="/advisor" component={AdvisorPage} />
              <Route path="/community" component={CommunityPage} />
              <Route path="/action-guide" component={ActionGuidePage} />
              <Route path="/scientific-analysis" component={ScientificAnalysisPage} />
              <Route path="/affirmations" component={AffirmationsPage} />
              <Route path="/trial" component={TrialPage} />
              <Route path="/trial-thank-you" component={TrialSuccessPage} />
              <Route path="/results" component={ResultsPage} />
              <Route path="/proof" component={ProofPage} />
              <Route path="/help" component={HelpPage} />
              <Route>404 Page Not Found</Route>
            </Switch>
          </div>
        </div>
      </SidebarProvider>
    </QueryClientProvider>
  );
}

export default App;