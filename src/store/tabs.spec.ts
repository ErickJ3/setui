import { beforeEach, describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";
import { useTabStore } from "./tabs";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

describe("Tab Store", () => {
  const createMockTab = () => ({
    connectionId: faker.string.uuid(),
    keyName: faker.database.column(),
    label: faker.word.words(2),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    faker.seed(Date.now());
    useTabStore.setState({
      tabs: [],
      activeTabId: null,
      addTab: useTabStore.getState().addTab,
      removeTab: useTabStore.getState().removeTab,
      setActiveTab: useTabStore.getState().setActiveTab,
      getTabById: useTabStore.getState().getTabById,
    });
  });

  it("should add a new tab", () => {
    const newTab = createMockTab();

    useTabStore.getState().addTab(newTab);

    const expectedTabId = `${newTab.connectionId}-${newTab.keyName}`;
    const updatedStore = useTabStore.getState();
    expect(updatedStore.tabs).toHaveLength(1);
    expect(updatedStore.tabs[0]).toEqual({
      ...newTab,
      id: expectedTabId,
    });
    expect(updatedStore.activeTabId).toBe(expectedTabId);
  });

  it("should not duplicate tabs with same id", () => {
    const tab = createMockTab();

    const store = useTabStore.getState();
    store.addTab(tab);
    store.addTab(tab);

    const updatedStore = useTabStore.getState();
    expect(updatedStore.tabs).toHaveLength(1);
  });

  it("should remove a tab and update active tab correctly", () => {
    const tabs = Array.from({ length: 2 }, createMockTab);

    const store = useTabStore.getState();
    tabs.forEach((tab) => store.addTab(tab));

    const firstTabId = `${tabs[0].connectionId}-${tabs[0].keyName}`;
    const secondTabId = `${tabs[1].connectionId}-${tabs[1].keyName}`;

    store.removeTab(firstTabId);

    const updatedStore = useTabStore.getState();
    expect(updatedStore.tabs).toHaveLength(1);
    expect(updatedStore.activeTabId).toBe(secondTabId);
  });

  it("should get tab by id", () => {
    const tab = createMockTab();

    const store = useTabStore.getState();
    store.addTab(tab);

    const tabId = `${tab.connectionId}-${tab.keyName}`;
    const updatedStore = useTabStore.getState();
    const retrievedTab = updatedStore.getTabById(tabId);

    expect(retrievedTab).toEqual({
      ...tab,
      id: tabId,
    });
  });

  it("should set active tab", () => {
    const tab = createMockTab();
    const store = useTabStore.getState();
    store.addTab(tab);

    const tabId = `${tab.connectionId}-${tab.keyName}`;
    store.setActiveTab(tabId);

    const updatedStore = useTabStore.getState();
    expect(updatedStore.activeTabId).toBe(tabId);
  });
});
