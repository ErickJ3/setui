import { useEffect, useState } from "react";
import AppManifest from "../../package.json";
import { useConnectionStore } from "@/store/connection";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import Typography from "./typography";
import { Separator } from "./ui/separator";
import CreateConnection from "@/features/new-connection/components/create-connection";
import { Loader2, RotateCw } from "lucide-react";
import { ConnectionItem } from "./connection-item";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const { connections, isLoading, fetchConnections, refreshConnections } =
    useConnectionStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshConnections();
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <Typography.H4 className="text-white select-none">Setui</Typography.H4>
        <Separator orientation="horizontal" />
        <div className="flex justify-between items-center select-none">
          <Typography.P className="text-sm text-slate-100 font-bold">
            Connections ({connections.length})
          </Typography.P>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 transition-all duration-300 ease-in-out",
                    isRefreshing && "text-primary"
                  )}
                  onClick={handleRefresh}
                  disabled={isLoading || isRefreshing}
                >
                  <RotateCw
                    className={cn(
                      "h-4 w-4",
                      isRefreshing && "animate-[spin_0.5s_linear_infinite]"
                    )}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Refresh connections</p>
              </TooltipContent>
            </Tooltip>
            <CreateConnection />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : connections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <Typography.P className="text-sm text-muted-foreground">
              No connections yet. Create your first Redis connection!
            </Typography.P>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {connections.map((connection) => (
              <ConnectionItem key={connection.id} connection={connection} />
            ))}
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 select-none">
        <Typography.P className="text-xs text-muted-foreground text-center">
          Version {AppManifest.version}
        </Typography.P>
      </SidebarFooter>
    </Sidebar>
  );
}
