import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useConnectionStore } from "@/store/connection";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Trash, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

function KeyView() {
  const { connectionId, keyName } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [ttlDialogOpen, setTtlDialogOpen] = useState(false);
  const [newTtl, setNewTtl] = useState("");
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
      toast({
        title: "Success",
        description: "Value updated successfully",
      });
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

  const handleTtlUpdate = async () => {
    if (!connectionId || !keyName) return;

    try {
      const ttl = parseInt(newTtl);
      await setKeyTTL(Number(connectionId), keyName, ttl);
      setTtlDialogOpen(false);
      setNewTtl("");
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
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start select-none">
            <div>
              <CardTitle className="text-2xl">{keyName}</CardTitle>
              <CardDescription>
                Type: {selectedKey.type} | TTL:{" "}
                {selectedKey.ttl === -1
                  ? "No expiration"
                  : `${selectedKey.ttl}s`}
              </CardDescription>
            </div>

            <div className="flex gap-2">
              <Dialog open={ttlDialogOpen} onOpenChange={setTtlDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Clock className="h-4 w-4 mr-2" />
                    Set TTL
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Set Time To Live</DialogTitle>
                    <DialogDescription>
                      Set the expiration time in seconds. Use -1 for no
                      expiration.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Label htmlFor="ttl">TTL (seconds)</Label>
                    <Input
                      id="ttl"
                      value={newTtl}
                      onChange={(e) => setNewTtl(e.target.value)}
                      type="number"
                      placeholder="Enter TTL in seconds"
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setTtlDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleTtlUpdate}>Save</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button variant="outline" size="sm" onClick={handleDelete}>
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Value</Label>
              <Textarea
                value={editedValue || selectedKey.value}
                onChange={(e) => setEditedValue(e.target.value)}
                className="min-h-[200px] font-mono"
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={!editedValue}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default KeyView;
