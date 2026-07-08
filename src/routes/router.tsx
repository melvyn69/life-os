import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Briefing } from "@/routes/Briefing";
import { Capture } from "@/routes/Capture";
import { Entities } from "@/routes/Entities";
import { Home } from "@/routes/Home";
import { Inbox } from "@/routes/Inbox";
import { Memory } from "@/routes/Memory";
import { Settings } from "@/routes/Settings";

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: "capture",
        element: <Capture />
      },
      {
        path: "inbox",
        element: <Inbox />
      },
      {
        path: "entities",
        element: <Entities />
      },
      {
        path: "memory",
        element: <Memory />
      },
      {
        path: "briefing",
        element: <Briefing />
      },
      {
        path: "settings",
        element: <Settings />
      }
    ]
  }
]);
