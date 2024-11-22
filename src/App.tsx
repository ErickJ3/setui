import "./index.css";
import { ThemeProvider } from "@/components/theme-provider";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import { router } from "./routes";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
