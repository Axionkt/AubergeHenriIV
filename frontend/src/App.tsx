import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { queryClient } from "./lib/query";
import Navbar from "./components/Navbar";
import Footer from "./components/home/Footer";

export default function App() {
  // The legal notice must be reachable from every public page.
  const isAdmin = useLocation().pathname.startsWith("/admin");

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Navbar />
        <ScrollRestoration />
        <ToastProvider>
          <Outlet />
        </ToastProvider>
        {!isAdmin && <Footer />}
      </AuthProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
