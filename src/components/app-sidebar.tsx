import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import Typograph from "./typography";
import { Separator } from "./ui/separator";
import CreateConnection from "@/features/new-connection/components/create-connection";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <Typograph.H4 className="text-white">Setui</Typograph.H4>
        <Separator orientation="horizontal" />
        <div className="flex justify-between items-center">
          <Typograph.P className="text-sm text-slate-100 font-bold">
            Connections (2)
          </Typograph.P>
          <CreateConnection />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup />
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
