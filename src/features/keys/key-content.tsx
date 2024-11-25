import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";

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
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Value</Label>
            <Textarea
              value={editedValue || value}
              onChange={(e) => onValueChange(e.target.value)}
              className="min-h-[200px] font-mono"
            />
          </div>

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
