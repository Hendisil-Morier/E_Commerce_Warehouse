import React from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { queryClient } from "@/lib/queryClient";
import { AppRouter } from "@/routes/AppRouter";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

export default function App(): React.JSX.Element {
  const appTree = (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AppRouter />
      </ToastProvider>
    </QueryClientProvider>
  );

  if (!googleClientId) {
    return appTree;
  }

  return <GoogleOAuthProvider clientId={googleClientId}>{appTree}</GoogleOAuthProvider>;
}
