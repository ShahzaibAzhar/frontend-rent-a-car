import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "@/app/store";
import { useAppSelector } from "@/app/hooks";
import { selectIsAuthenticated } from "@/features/auth/authSlice";
import AppLayout from "@/components/AppLayout";
import { ProtectedRoute, AdminRoute } from "@/components/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import FleetPage from "@/pages/FleetPage";
import AddVehiclePage from "@/pages/AddVehiclePage";
import BookingsPage from "@/pages/BookingsPage";
import MaintenancePage from "@/pages/MaintenancePage";
import JobsPage from "@/pages/JobsPage";
import DocumentsPage from "@/pages/DocumentsPage";
import FinesPage from "@/pages/FinesPage";
import AdminPage from "@/pages/AdminPage";
import CustomersPage from "@/pages/CustomersPage";
import AddCustomerPage from "@/pages/AddCustomerPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/fleet" element={<FleetPage />} />
          <Route path="/fleet/add" element={<AddVehiclePage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/add" element={<AddCustomerPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/fines" element={<FinesPage />} />
        </Route>
      </Route>
      <Route element={<AdminRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;
