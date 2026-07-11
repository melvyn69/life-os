import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import {
  Briefing,
  Capture,
  Entities,
  EntityDetailPage,
  Home,
  Inbox,
  LifeGraphPage,
  Memory,
  RelationshipReviewPage,
  Settings
} from "@/routes/lazyRoutes";

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
        path: "entities/:entityId",
        element: <EntityDetailPage />
      },
      {
        path: "graph",
        element: <LifeGraphPage />
      },
      {
        path: "graph/:entityId",
        element: <LifeGraphPage />
      },
      {
        path: "relationships/review",
        element: <RelationshipReviewPage />
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
