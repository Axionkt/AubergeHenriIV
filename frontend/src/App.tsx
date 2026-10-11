import { Outlet, ScrollRestoration } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { queryClient } from "./lib/query";
import Navbar from "./components/Navbar";

const GOOGLE_CLIENT_ID =
  "346477495379-2l0haf1o560rs6ll7r785m5g1ll96248.apps.googleusercontent.com";

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Navbar />
          <ScrollRestoration />
          <ToastProvider>
            <Outlet />
          </ToastProvider>
        </AuthProvider>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
