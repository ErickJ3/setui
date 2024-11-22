import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Connection, useConnectionStore } from "@/store/connection";
import {
  ChevronRight,
  ChevronDown,
  Loader2,
  Database,
  Key,
  MoreVertical,
  Pencil,
  Trash,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import Typography from "@/components/typography";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditConnection from "@/features/connection/edit-connection";
import { truncateText } from "@/lib/utils";

export function ConnectionItem({ connection }: { connection: Connection }) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const navigate = useNavigate();
  const {
    selectedConnection,
    toggleConnection,
    expandedConnections,
    connectionKeys,
    loadingKeys,
    removeConnection,
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

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditModalOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await removeConnection(connection.id);
  };

  return (
    <div className="space-y-0.5">
      <div className="flex items-center w-full">
        <Button
          variant="ghost"
          className={`flex-1 h-auto px-2 py-1.5 ${
            selectedConnection?.id === connection.id ? "bg-primary/10" : ""
          }`}
          onClick={handleClick}
        >
          <div className="flex items-center w-full gap-2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <div className="flex items-center gap-2 flex-shrink-0">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <Database className="h-4 w-4" />
              </div>
            )}

            <div className="flex items-center justify-between w-full min-w-0">
              <Typography.P className="text-sm font-medium text-left">
                {truncateText(connection.name)}
              </Typography.P>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-2 flex-shrink-0">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: connection.color }}
                />
                <span className="capitalize">{connection.color}</span>
              </div>
            </div>
          </div>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete}>
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <EditConnection
        connection={connection}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
      />

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
                <span>{key}</span>
              </Button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default ConnectionItem;
