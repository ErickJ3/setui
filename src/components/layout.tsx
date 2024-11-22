import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useWindowSize } from "@/hooks/use-window-size";
import { TooltipProvider } from "./ui/tooltip";

export default function Layout() {
  const [isMounted, setIsMounted] = useState(false);
  const { isDesktop } = useWindowSize();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <SidebarProvider>
      <TooltipProvider>
        <div className="h-screen w-screen overflow-hidden flex select-none">
          <AppSidebar />
          <main
            className={cn(
              "flex-1 overflow-y-auto",
              "bg-background",
              isDesktop ? "p-6" : "p-4"
            )}
          >
            <Outlet />
          </main>
        </div>
      </TooltipProvider>
    </SidebarProvider>
  );
}
