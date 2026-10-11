import { createBrowserRouter, Navigate } from "react-router-dom";
import api from "./lib/axios";

import App from "./App";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmailPending from "./pages/VerifyEmailPending";
import VerifyEmail from "./pages/VerifyEmail";
import VerifyEmailError from "./pages/VerifyEmailError";
import Profile from "./pages/Profile";
import ApartmentDetail from "./pages/ApartmentDetail";
import Admin from "./pages/admin/Admin";
import ProSpaceDetail from "./pages/ProSpaceDetail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { ProtectedRoute, AdminRoute } from "./components/RouteGuards";
import Archive from "./pages/Archive";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      // Public
      { index: true, element: <Home /> },
      { path: "/connexion", element: <Login /> },
      { path: "/inscription", element: <Register /> },
      { path: "/verification-email", element: <VerifyEmailPending /> },
      {
        path: "/verify-email",
        element: <VerifyEmail />,
        errorElement: <VerifyEmailError />,
        loader: async ({ request }) => {
          const token = new URL(request.url).searchParams.get("token");
          if (!token)
            throw new Response("Lien invalide ou manquant.", { status: 400 });

          return {
            verification: api.get(`/auth/verify-email?token=${token}`),
          };
        },
      },
      { path: "/mot-de-passe-oublie", element: <ForgotPassword /> },
      { path: "/reinitialisation-mot-de-passe", element: <ResetPassword /> },
      { path: "/histoire", element: <Archive /> },

      // Authenticated
      {
        element: <ProtectedRoute />,
        children: [
          { path: "/profil", element: <Profile /> },
          { path: "/appartements/:id", element: <ApartmentDetail /> },
          { path: "/espaces-pro/:id", element: <ProSpaceDetail /> },
        ],
      },

      // Admin
      {
        element: <AdminRoute />,
        children: [{ path: "/admin", element: <Admin /> }],
      },

      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
