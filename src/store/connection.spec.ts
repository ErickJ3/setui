import { beforeEach, describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";
import { useConnectionStore } from "./connection";
import { invoke } from "@tauri-apps/api/core";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

describe("Connection Store", () => {
  const createMockConnection = () => {
    faker.seed(Date.now());
    return {
      id: faker.number.int({ min: 1, max: 1000 }),
      name: faker.company.name(),
      uri_connection: `redis://${faker.internet.ip()}:${faker.number.int({
        min: 1000,
        max: 9999,
      })}`,
      color: faker.color.rgb(),
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useConnectionStore.setState({
      connections: [],
      selectedConnection: null,
      selectedKey: null,
      error: null,
      connectionKeys: {},
      loadingKeys: {},
      expandedConnections: new Set(),
      keyPattern: {},
      isLoading: false,
      addConnection: useConnectionStore.getState().addConnection,
      setSelectedConnection:
        useConnectionStore.getState().setSelectedConnection,
      fetchConnections: useConnectionStore.getState().fetchConnections,
      removeConnection: useConnectionStore.getState().removeConnection,
      updateConnection: useConnectionStore.getState().updateConnection,
      toggleConnection: useConnectionStore.getState().toggleConnection,
      fetchKeys: useConnectionStore.getState().fetchKeys,
      setExpandedConnection:
        useConnectionStore.getState().setExpandedConnection,
      refreshKeys: useConnectionStore.getState().refreshKeys,
      setKeyPattern: useConnectionStore.getState().setKeyPattern,
      refreshConnections: useConnectionStore.getState().refreshConnections,
      getKeyInfo: useConnectionStore.getState().getKeyInfo,
      setKeyValue: useConnectionStore.getState().setKeyValue,
      deleteKey: useConnectionStore.getState().deleteKey,
      setKeyTTL: useConnectionStore.getState().setKeyTTL,
      setSelectedKey: useConnectionStore.getState().setSelectedKey,
    });
  });

  it("should add multiple connections", () => {
    const connections = Array.from({ length: 3 }, createMockConnection);

    connections.forEach((connection) => {
      useConnectionStore.getState().addConnection(connection);
    });

    const updatedStore = useConnectionStore.getState();
    expect(updatedStore.connections).toHaveLength(3);
    connections.forEach((connection) => {
      expect(updatedStore.connections).toContainEqual(connection);
    });
  });

  it("should set and update selected connection", async () => {
    const connection = createMockConnection();
    useConnectionStore.getState().addConnection(connection);

    const updatedConnection = {
      ...connection,
      name: "Updated Name",
      uri_connection: `redis://${faker.internet.ip()}:${faker.number.int({
        min: 1000,
        max: 9999,
      })}`,
    };

    useConnectionStore.getState().setSelectedConnection(connection);
    expect(useConnectionStore.getState().selectedConnection).toEqual(
      connection
    );

    vi.mocked(invoke).mockResolvedValueOnce(undefined);
    await useConnectionStore.getState().updateConnection(updatedConnection);

    const updatedStore = useConnectionStore.getState();
    expect(updatedStore.selectedConnection).toEqual(updatedConnection);
    expect(
      updatedStore.connections.find((c) => c.id === connection.id)
    ).toEqual(updatedConnection);
  });

  it("should fetch connections with different configurations", async () => {
    const mockConnections = Array.from({ length: 5 }, createMockConnection);
    vi.mocked(invoke).mockResolvedValueOnce(mockConnections);

    await useConnectionStore.getState().fetchConnections();

    const store = useConnectionStore.getState();
    expect(store.connections).toHaveLength(5);
    expect(store.isLoading).toBe(false);
    expect(store.error).toBeNull();
  });

  it("should handle connection removal", async () => {
    const connections = [
      {
        id: 1,
        name: "Connection 1",
        uri_connection: "redis://localhost:6379",
        color: "#ff0000",
      },
      {
        id: 2,
        name: "Connection 2",
        uri_connection: "redis://localhost:6380",
        color: "#00ff00",
      },
      {
        id: 3,
        name: "Connection 3",
        uri_connection: "redis://localhost:6381",
        color: "#0000ff",
      },
    ];

    useConnectionStore.setState({
      ...useConnectionStore.getState(),
      connections: connections,
      connectionKeys: {},
      loadingKeys: {},
      expandedConnections: new Set(),
      keyPattern: {},
      selectedConnection: null,
      selectedKey: null,
      error: null,
      isLoading: false,
    });

    const initialState = useConnectionStore.getState();
    expect(initialState.connections).toHaveLength(3);

    vi.mocked(invoke).mockResolvedValueOnce(undefined);

    await useConnectionStore.getState().removeConnection(2);

    const finalState = useConnectionStore.getState();

    expect(finalState.connections).toHaveLength(2);
    expect(finalState.connections.map((c) => c.id)).toEqual([1, 3]);
    expect(finalState.connections.find((c) => c.id === 2)).toBeUndefined();
    expect(invoke).toHaveBeenCalledWith("delete_connection", { id: 2 });
  });

  it("should toggle multiple connections and fetch their keys", async () => {
    const connections = Array.from({ length: 2 }, createMockConnection);

    useConnectionStore.setState({
      ...useConnectionStore.getState(),
      connections: [...connections],
    });

    const mockKeys = Array.from({ length: 5 }, () =>
      faker.string.alphanumeric(10)
    );

    for (const connection of connections) {
      vi.mocked(invoke).mockReset();

      vi.mocked(invoke)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(mockKeys);

      await useConnectionStore.getState().toggleConnection(connection.id);
      const updatedStore = useConnectionStore.getState();

      expect(updatedStore.expandedConnections.has(connection.id)).toBe(true);
      expect(updatedStore.connectionKeys[connection.id]).toEqual(mockKeys);
      expect(invoke).toHaveBeenCalledWith("connect_redis", {
        id: connection.id,
        uri: connection.uri_connection,
      });
      expect(invoke).toHaveBeenCalledWith("get_redis_keys", {
        id: connection.id,
        pattern: "*",
      });

      await useConnectionStore.getState().toggleConnection(connection.id);
      const finalStore = useConnectionStore.getState();
      expect(finalStore.expandedConnections.has(connection.id)).toBe(false);
    }
  });

  it("should handle key pattern updates", () => {
    const connection = createMockConnection();
    const pattern = faker.string.alphanumeric(5) + "*";

    useConnectionStore.getState().addConnection(connection);
    useConnectionStore.getState().setKeyPattern(connection.id, pattern);

    const updatedStore = useConnectionStore.getState();
    expect(updatedStore.keyPattern[connection.id]).toBe(pattern);
  });

  it("should manage connection key TTL", async () => {
    const connection = createMockConnection();
    const key = faker.string.alphanumeric(10);
    const ttl = faker.number.int({ min: 60, max: 3600 });

    useConnectionStore.getState().addConnection(connection);
    vi.mocked(invoke).mockResolvedValueOnce(undefined).mockResolvedValueOnce({
      key,
      value: "test",
      ttl,
      data_type: "string",
    });

    await useConnectionStore.getState().setKeyTTL(connection.id, key, ttl);

    expect(invoke).toHaveBeenCalledWith("set_redis_ttl", {
      id: connection.id,
      key,
      ttl,
    });

    expect(invoke).toHaveBeenCalledWith("get_redis_key_info", {
      id: connection.id,
      key,
    });
  });
});
