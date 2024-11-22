import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface Tab {
  id: string;
  connectionId: string;
  keyName: string;
  label: string;
}

interface TabState {
  tabs: Tab[];
  activeTabId: string | null;
  addTab: (tab: Omit<Tab, "id">) => void;
  removeTab: (tabId: string) => string | null;
  setActiveTab: (tabId: string) => void;
  getTabById: (tabId: string) => Tab | undefined;
}

export const useTabStore = create<TabState>()(
  devtools(
    (set, get) => ({
      tabs: [],
      activeTabId: null,

      addTab: (newTab) => {
        const tabId = `${newTab.connectionId}-${newTab.keyName}`;

        set((state) => {
          if (state.tabs.some((tab) => tab.id === tabId)) {
            return { ...state, activeTabId: tabId };
          }

          return {
            tabs: [...state.tabs, { ...newTab, id: tabId }],
            activeTabId: tabId,
          };
        });
      },

      removeTab: (tabId: string) => {
        const currentState = get();
        const currentIndex = currentState.tabs.findIndex(
          (tab) => tab.id === tabId
        );

        if (currentIndex === -1) return currentState.activeTabId;

        const newTabs = currentState.tabs.filter((tab) => tab.id !== tabId);

        let newActiveTabId: string | null = null;

        if (currentState.activeTabId === tabId) {
          const nextTab = newTabs[currentIndex] || newTabs[currentIndex - 1];
          newActiveTabId = nextTab?.id || null;
        } else {
          newActiveTabId = currentState.activeTabId;
        }

        set({
          tabs: newTabs,
          activeTabId: newActiveTabId,
        });

        return newActiveTabId;
      },

      setActiveTab: (tabId) => {
        set({ activeTabId: tabId });
      },

      getTabById: (tabId) => {
        return get().tabs.find((tab) => tab.id === tabId);
      },
    }),
    { name: "tabs-store" }
  )
);
