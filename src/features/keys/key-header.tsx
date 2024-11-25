import { useState } from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Copy, Check, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface KeyHeaderProps {
  keyName: string;
  keyType: string;
  ttl: number;
  onDelete: () => void;
  onTtlUpdate: (ttl: number) => void;
}

export const KeyHeader = ({
  keyName,
  keyType,
  ttl,
  onDelete,
  onTtlUpdate,
}: KeyHeaderProps) => {
  const [ttlDialogOpen, setTtlDialogOpen] = useState(false);
  const [newTtl, setNewTtl] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(keyName);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Key name copied to clipboard",
    });
  };

  const handleTtlSave = () => {
    const ttlValue = parseInt(newTtl);
    onTtlUpdate(ttlValue);
    setTtlDialogOpen(false);
    setNewTtl("");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-2xl">{keyName}</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy key name</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <CardDescription>
              Type: <Badge className="px-2 mx-1"  variant="outline">{keyType}</Badge> | TTL:{" "}
              {ttl === -1 ? "No expiration" : `${ttl}s`}
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
                  <Button onClick={handleTtlSave}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm" onClick={onDelete}>
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};
