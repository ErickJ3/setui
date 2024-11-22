import { Connection, useConnectionStore } from "@/store/connection";
import {
  ChevronRight,
  ChevronDown,
  Loader2,
  Database,
  Key,
} from "lucide-react";
import { Button } from "./ui/button";

import Typography from "@/components/typography";
import { useNavigate } from "react-router-dom";

export function ConnectionItem({ connection }: { connection: Connection }) {
  const navigate = useNavigate();
  const {
    selectedConnection,
    toggleConnection,
    expandedConnections,
    connectionKeys,
    loadingKeys,
  } = useConnectionStore();

  const isExpanded = expandedConnections.has(connection.id);
  const isLoading = loadingKeys[connection.id];
  const keys = connectionKeys[connection.id] || [];

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    await toggleConnection(connection.id);
  };

  const handleKeyClick = (key: string) => {
    navigate(`/connection/${connection.id}/key/${encodeURIComponent(key)}`);
  };

  return (
    <div className="space-y-0.5">
      <Button
        variant="ghost"
        className={`w-full h-auto px-2 py-1.5 ${
          selectedConnection?.id === connection.id ? "bg-primary/10" : ""
        }`}
        onClick={handleClick}
      >
        <div className="flex items-center w-full gap-2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <div className="flex items-center gap-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <Database className="h-4 w-4" />
            </div>
          )}

          <div className="flex items-center flex-1">
            <Typography.P className="text-sm font-medium truncate">
              {connection.name}
            </Typography.P>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: connection.color }}
              />
              <span className="capitalize">{connection.color}</span>
            </div>
          </div>
        </div>
      </Button>

      {isExpanded && (
        <div className="pl-9 space-y-0.5 select-none">
          {keys.length === 0 ? (
            <Typography.P className="text-xs text-muted-foreground py-1 px-2">
              No keys found
            </Typography.P>
          ) : (
            keys.map((key: any) => (
              <Button
                key={key}
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 py-1 h-auto text-xs"
                onClick={() => handleKeyClick(key)}
              >
                <Key className="h-3 w-3" />
                <span className="truncate">{key}</span>
              </Button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
