import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import JsonView from "@uiw/react-json-view";
import { customColorForJson } from "./constants";

interface KeyContentProps {
  value: string;
  editedValue: string;
  onValueChange: (value: string) => void;
  onSave: () => void;
}

export const KeyContent = ({
  value,
  editedValue,
  onValueChange,
  onSave,
}: KeyContentProps) => {
  const [viewMode, setViewMode] = useState("raw");

  const parsedJson = useMemo(() => {
    try {
      return JSON.parse(editedValue || value);
    } catch {
      return null;
    }
  }, [value, editedValue]);

  const isValidJson = parsedJson !== null;

  useEffect(() => {
    if (!isValidJson && viewMode === "json") {
      setViewMode("raw");
    }
  }, [isValidJson, viewMode]);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Value</Label>
            <Select value={viewMode} onValueChange={setViewMode}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="View mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="raw">Raw</SelectItem>
                <SelectItem value="json" disabled={!isValidJson}>
                  JSON
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {viewMode === "raw" || !isValidJson ? (
            <Textarea
              value={editedValue || value}
              onChange={(e) => onValueChange(e.target.value)}
              className="min-h-[200px] font-mono"
            />
          ) : (
            <div className="border rounded-md p-4 min-h-[200px] bg-background">
              <JsonView
                value={parsedJson}
                displayDataTypes={false}
                style={customColorForJson}
              />
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={onSave} disabled={!editedValue}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
