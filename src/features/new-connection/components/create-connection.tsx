import { invoke } from '@tauri-apps/api/core';
import Typograph from "@/components/typography";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@radix-ui/react-label";
import { Plus } from "lucide-react";

const CreateConnection = () => {
  const handleGreet = async () => {
    const greeting = await invoke("greet", { name: "John" });
    console.log(greeting);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" className="rounded-full">
          <Plus size={24} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New connection</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <div className="flex flex-col gap-y-2">
            <Label>URI</Label>
            <Textarea />
          </div>
          <div className="flex flex-col gap-y-2 py-2">
            <Label>Name</Label>
            <Input />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleGreet}>
            <Typograph.P className="font-bold">Connect</Typograph.P>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateConnection;
