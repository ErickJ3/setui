import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "@/hooks/use-toast";

export interface Connection {
  id: number;
  name: string;
  uri_connection: string;
  color: string;
}

export interface RedisKeyInfo {
  key: string;
  value: string;
  ttl: number;
  type: string;
}

interface ConnectionState {
  connections: Connection[];
  selectedConnection: Connection | null;
  selectedKey: RedisKeyInfo | null;
  isLoading: boolean;
  error: string | null;
  connectionKeys: { [connectionId: number]: string[] };
  loadingKeys: { [connectionId: number]: boolean };
  expandedConnections: Set<number>;
  keyPattern: { [connectionId: number]: string };
}

interface ConnectionActions {
  // Connection management
  fetchConnections: () => Promise<void>;
  setSelectedConnection: (connection: Connection | null) => void;
  addConnection: (connection: Connection) => void;
  removeConnection: (id: number) => Promise<void>;
  updateConnection: (connection: Connection) => Promise<void>;

  // Redis connection and key management
  toggleConnection: (connectionId: number) => Promise<void>;
  fetchKeys: (connectionId: number, pattern?: string) => Promise<void>;
  setExpandedConnection: (connectionId: number, expanded: boolean) => void;
  refreshKeys: (connectionId: number) => Promise<void>;
  setKeyPattern: (connectionId: number, pattern: string) => void;
  refreshConnections: () => Promise<void>;

  // Key operations
  getKeyInfo: (connectionId: number, key: string) => Promise<void>;
  setKeyValue: (
    connectionId: number,
    key: string,
    value: string
  ) => Promise<void>;
  deleteKey: (connectionId: number, key: string) => Promise<void>;
  setKeyTTL: (connectionId: number, key: string, ttl: number) => Promise<void>;
  setSelectedKey: (keyInfo: RedisKeyInfo | null) => void;
}

type ConnectionStore = ConnectionState & ConnectionActions;

export const useConnectionStore = create<ConnectionStore>((set, get) => ({
  connections: [],
  selectedConnection: null,
  selectedKey: null,
  isLoading: false,
  error: null,
  connectionKeys: {},
  loadingKeys: {},
  expandedConnections: new Set(),
  keyPattern: {},

  refreshConnections: async () => {
    try {
      set({ isLoading: true, error: null });
      const connections = await invoke<Connection[]>("list_connection");

      const currentState = get();
      const expandedConnections = Array.from(currentState.expandedConnections);

      for (const connectionId of expandedConnections) {
        try {
          if (connections.some((conn) => conn.id === connectionId)) {
            await invoke("connect_redis", {
              id: connectionId,
              uri: connections.find((c) => c.id === connectionId)
                ?.uri_connection,
            });

            const keys = await invoke<string[]>("get_redis_keys", {
              id: connectionId,
              pattern: currentState.keyPattern[connectionId] || "*",
            });

            set((state) => ({
              connectionKeys: {
                ...state.connectionKeys,
                [connectionId]: keys,
              },
            }));
          }
        } catch (error) {
          console.error(`Failed to refresh connection ${connectionId}:`, error);
          set((state) => {
            const newExpanded = new Set(state.expandedConnections);
            newExpanded.delete(connectionId);
            return { expandedConnections: newExpanded };
          });
        }
      }

      set({
        connections,
        isLoading: false,
      });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  fetchConnections: async () => {
    try {
      set({ isLoading: true, error: null });
      const connections = await invoke<Connection[]>("list_connection");
      set({ connections, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  setSelectedConnection: (connection) => {
    set({ selectedConnection: connection });
  },

  addConnection: (connection) => {
    set((state) => ({
      connections: [...state.connections, connection],
    }));
  },

  removeConnection: async (id) => {
    try {
      await invoke("delete_connection", { id });
      set((state) => {
        const { [id]: removedKeys, ...restKeys } = state.connectionKeys;
        const { [id]: removedLoading, ...restLoading } = state.loadingKeys;
        const { [id]: removedPattern, ...restPattern } = state.keyPattern;

        const newExpanded = new Set(state.expandedConnections);
        newExpanded.delete(id);

        return {
          connections: state.connections.filter((conn) => conn.id !== id),
          selectedConnection:
            state.selectedConnection?.id === id
              ? null
              : state.selectedConnection,
          connectionKeys: restKeys,
          loadingKeys: restLoading,
          keyPattern: restPattern,
          expandedConnections: newExpanded,
        };
      });

      toast({
        title: "Success",
        description: "Connection removed successfully",
      });
    } catch (error) {
      set({ error: String(error) });
      toast({
        title: "Error",
        description: `Failed to remove connection: ${error}`,
        variant: "destructive",
      });
    }
  },

  updateConnection: async (connection) => {
    try {
      await invoke("update_connection", { entity: connection });
      set((state) => ({
        connections: state.connections.map((conn) =>
          conn.id === connection.id ? connection : conn
        ),
        selectedConnection:
          state.selectedConnection?.id === connection.id
            ? connection
            : state.selectedConnection,
      }));
      toast({
        title: "Success",
        description: "Connection updated successfully",
      });
    } catch (error) {
      set({ error: String(error) });
      toast({
        title: "Error",
        description: `Failed to update connection: ${error}`,
        variant: "destructive",
      });
    }
  },

  toggleConnection: async (connectionId) => {
    const { connections, expandedConnections, fetchKeys } = get();
    const connection = connections.find((c) => c.id === connectionId);
    const isExpanded = expandedConnections.has(connectionId);

    if (!connection) return;

    if (!isExpanded) {
      try {
        set((state) => ({
          loadingKeys: { ...state.loadingKeys, [connectionId]: true },
        }));

        await invoke("connect_redis", {
          id: connectionId,
          uri: connection.uri_connection,
        });

        await fetchKeys(connectionId);

        set((state) => ({
          expandedConnections: new Set([
            ...state.expandedConnections,
            connectionId,
          ]),
          loadingKeys: { ...state.loadingKeys, [connectionId]: false },
        }));
      } catch (error) {
        set((state) => ({
          loadingKeys: { ...state.loadingKeys, [connectionId]: false },
        }));
        toast({
          title: "Connection Error",
          description: String(error),
          variant: "destructive",
        });
      }
    } else {
      set((state) => {
        const newExpanded = new Set(state.expandedConnections);
        newExpanded.delete(connectionId);
        return { expandedConnections: newExpanded };
      });
    }
  },

  fetchKeys: async (connectionId, pattern = "*") => {
    set((state) => ({
      loadingKeys: { ...state.loadingKeys, [connectionId]: true },
    }));

    try {
      const keys = await invoke<string[]>("get_redis_keys", {
        id: connectionId,
        pattern,
      });

      set((state) => ({
        connectionKeys: {
          ...state.connectionKeys,
          [connectionId]: keys,
        },
        loadingKeys: {
          ...state.loadingKeys,
          [connectionId]: false,
        },
        keyPattern: {
          ...state.keyPattern,
          [connectionId]: pattern,
        },
      }));
    } catch (error) {
      set((state) => ({
        loadingKeys: {
          ...state.loadingKeys,
          [connectionId]: false,
        },
      }));
      throw error;
    }
  },

  setExpandedConnection: (connectionId, expanded) => {
    set((state) => {
      const newExpanded = new Set(state.expandedConnections);
      if (expanded) {
        newExpanded.add(connectionId);
      } else {
        newExpanded.delete(connectionId);
      }
      return { expandedConnections: newExpanded };
    });
  },

  refreshKeys: async (connectionId) => {
    const { keyPattern } = get();
    const pattern = keyPattern[connectionId] || "*";
    await get().fetchKeys(connectionId, pattern);
    toast({
      title: "Success",
      description: "Keys refreshed successfully",
    });
  },

  setKeyPattern: (connectionId, pattern) => {
    set((state) => ({
      keyPattern: { ...state.keyPattern, [connectionId]: pattern },
    }));
  },

  getKeyInfo: async (connectionId, key) => {
    try {
      const keyInfo = await invoke<RedisKeyInfo>("get_redis_key_info", {
        id: connectionId,
        key,
      });
      set({ selectedKey: keyInfo });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to get key info: ${error}`,
        variant: "destructive",
      });
    }
  },

  setKeyValue: async (connectionId, key, value) => {
    try {
      await invoke("set_redis_key", {
        id: connectionId,
        key,
        value,
      });
      await get().getKeyInfo(connectionId, key);
      toast({
        title: "Success",
        description: "Key value updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to set key value: ${error}`,
        variant: "destructive",
      });
    }
  },

  deleteKey: async (connectionId, key) => {
    try {
      await invoke("delete_redis_key", {
        id: connectionId,
        key,
      });
      set({ selectedKey: null });
      await get().refreshKeys(connectionId);
      toast({
        title: "Success",
        description: "Key deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete key: ${error}`,
        variant: "destructive",
      });
    }
  },

  setKeyTTL: async (connectionId, key, ttl) => {
    try {
      await invoke("set_redis_ttl", {
        id: connectionId,
        key,
        ttl,
      });
      await get().getKeyInfo(connectionId, key);
      toast({
        title: "Success",
        description: "Key TTL updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to set key TTL: ${error}`,
        variant: "destructive",
      });
    }
  },

  setSelectedKey: (keyInfo) => {
    set({ selectedKey: keyInfo });
  },
}));
