import { createBrowserRouter } from "react-router-dom";
import Layout from "@/components/layout";
import { HomePage } from "@/pages/home";
import { TabLayout } from "@/features/tabs/tab-layout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "connection/:connectionId/key/:keyName",
        element: <TabLayout />,
      },
    ],
  },
]);
