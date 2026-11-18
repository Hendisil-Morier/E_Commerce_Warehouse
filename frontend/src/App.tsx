import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { queryClient } from "@/lib/queryClient";
import { AppRouter } from "@/routes/AppRouter";

export default function App(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AppRouter />
      </ToastProvider>
    </QueryClientProvider>
  );
}
