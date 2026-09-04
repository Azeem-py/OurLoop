"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/pushClient";
import { InstallBanner } from "./InstallBanner";
import { NotificationPrompt } from "./NotificationPrompt";

interface PwaManagerProps {
  partnerName?: string | null;
}

export function PwaManager({ partnerName }: PwaManagerProps) {
  useEffect(() => {
    // Automatically register Service Worker on mount
    registerServiceWorker();
  }, []);

  return (
    <>
      <InstallBanner />
      <NotificationPrompt partnerName={partnerName} />
    </>
  );
}
