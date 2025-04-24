import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Navbar from "./components/Navbar";
import FindVendor from "./pages/FindVendor";
import VendorDashboard from "./pages/VendorDashboard";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import NotVerified from "./pages/NotVerified";
import AuthGuard from "./components/AuthGuard";
import Index from "./pages/Index";
import ConfirmPage from "./pages/ConfirmPage";
import NotFound from "./pages/NotFound";
import CommunityPage from "./pages/CommunityPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-[#fbed96]/30 via-[#E5DEFF]/30 to-[#abecd6]/30 flex flex-col font-inter">
          <Navbar />
          <div className="flex-1 relative">
            {/* Decorative elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-usfgreen/5 rounded-full blur-3xl"></div>
              <div className="absolute top-1/3 -left-32 w-64 h-64 bg-usfgold/5 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 right-1/4 w-64 h-64 bg-[#E5DEFF]/20 rounded-full blur-3xl"></div>
            </div>
            {/* Main content */}
            <div className="relative">
              <Routes>
                {/* Public route */}
                <Route path="/" element={<Index />} />
                <Route path="/confirm" element={<ConfirmPage />} />

                {/* Unverified users can access this */}
                <Route 
                  path="/verify" 
                  element={
                    <AuthGuard requireVerified={false}>
                      <NotVerified />
                    </AuthGuard>
                  } 
                />

                {/* Protected routes - require verification */}
                <Route
                  path="/find"
                  element={
                    <AuthGuard>
                      <FindVendor />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <AuthGuard>
                      <VendorDashboard />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/community"
                  element={
                    <AuthGuard>
                      <CommunityPage />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/chat/:conversationId?"
                  element={
                    <AuthGuard>
                      <ChatPage />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <AuthGuard>
                      <ProfilePage />
                    </AuthGuard>
                  }
                />

                {/* 404 catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </div>
        </div>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
