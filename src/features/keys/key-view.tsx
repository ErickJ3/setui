import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useConnectionStore } from "@/store/connection";
import { KeyHeader } from "./key-header";
import { KeyContent } from "./key-content";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const KeyView = () => {
  const { connectionId, keyName } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [editedValue, setEditedValue] = useState("");
  const { selectedKey, getKeyInfo, setKeyValue, deleteKey, setKeyTTL } =
    useConnectionStore();

  useEffect(() => {
    if (connectionId && keyName) {
      loadKeyInfo();
    }
  }, [connectionId, keyName]);

  const loadKeyInfo = async () => {
    try {
      setIsLoading(true);
      await getKeyInfo(Number(connectionId), keyName!);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load key information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!connectionId || !keyName || !editedValue) return;
    try {
      setIsLoading(true);
      await setKeyValue(Number(connectionId), keyName, editedValue);
      toast({ title: "Success", description: "Value updated successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update value",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!connectionId || !keyName) return;
    try {
      setIsLoading(true);
      await deleteKey(Number(connectionId), keyName);
      window.history.back();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete key",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTtlUpdate = async (ttl: number) => {
    if (!connectionId || !keyName) return;
    try {
      await setKeyTTL(Number(connectionId), keyName, ttl);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update TTL",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!selectedKey) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Key not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <KeyHeader
        keyName={keyName!}
        keyType={selectedKey.data_type}
        ttl={selectedKey.ttl}
        onDelete={handleDelete}
        onTtlUpdate={handleTtlUpdate}
      />
      <KeyContent
        value={selectedKey.value}
        editedValue={editedValue}
        onValueChange={setEditedValue}
        onSave={handleSave}
      />
    </div>
  );
};

export default KeyView;
