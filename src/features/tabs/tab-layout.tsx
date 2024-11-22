import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn, truncateText } from "@/lib/utils";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTabStore } from "@/store/tabs";
import KeyView from "@/features/keys/key-view";

export function TabLayout() {
  const navigate = useNavigate();
  const params = useParams();
  const { tabs, activeTabId, addTab, removeTab, setActiveTab } = useTabStore();

  useEffect(() => {
    const { connectionId, keyName } = params;
    if (connectionId && keyName) {
      addTab({
        connectionId,
        keyName: decodeURIComponent(keyName),
        label: decodeURIComponent(keyName),
      });
    }
  }, [params.connectionId, params.keyName, addTab]);

  const handleTabClick = (tab: {
    id: string;
    connectionId: string;
    keyName: string;
  }) => {
    setActiveTab(tab.id);
    navigate(
      `/connection/${tab.connectionId}/key/${encodeURIComponent(tab.keyName)}`
    );
  };

  const handleTabClose = async (tabId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const newActiveTabId = removeTab(tabId);

    if (newActiveTabId) {
      const nextTab = tabs.find((t) => t.id === newActiveTabId);
      if (nextTab) {
        navigate(
          `/connection/${nextTab.connectionId}/key/${encodeURIComponent(
            nextTab.keyName
          )}`,
          { replace: true }
        );
      }
    } else {
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {tabs.length > 0 && (
        <div className="border-b border-border bg-background">
          <div className="flex items-center">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant="ghost"
                className={cn(
                  "relative h-10 px-4 py-2 text-sm rounded-none border-border",
                  "hover:bg-muted/30 transition-colors duration-150",
                  "flex items-center gap-2",
                  activeTabId === tab.id && [
                    "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-foreground/30",
                  ]
                )}
                onClick={() => handleTabClick(tab)}
              >
                <span className="truncate max-w-[200px]">
                  {truncateText(tab.label)}
                </span>
                <button
                  onClick={(e) => handleTabClose(tab.id, e)}
                  className={cn(
                    "p-0.5 rounded-sm hover:bg-muted/50 transition-colors duration-150",
                    "flex items-center justify-center"
                  )}
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors duration-150" />
                </button>
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {activeTabId ? (
          <div className="h-full">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={cn(
                  "h-full",
                  activeTabId === tab.id ? "block" : "hidden"
                )}
              >
                <KeyView />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a key to view its content
          </div>
        )}
      </div>
    </div>
  );
}
