import {
  Home,
  Inbox,
  Layers3,
  Library,
  PlusCircle,
  Settings,
  Sparkles
} from "lucide-react";
import type { ComponentType } from "react";

export type NavItem = {
  label: string;
  path: string;
  icon: ComponentType<{ className?: string }>;
};

export const navItems: NavItem[] = [
  {
    label: "Home",
    path: "/",
    icon: Home
  },
  {
    label: "Capture",
    path: "/capture",
    icon: PlusCircle
  },
  {
    label: "Inbox",
    path: "/inbox",
    icon: Inbox
  },
  {
    label: "Entities",
    path: "/entities",
    icon: Layers3
  },
  {
    label: "Memory",
    path: "/memory",
    icon: Library
  },
  {
    label: "Briefing",
    path: "/briefing",
    icon: Sparkles
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings
  }
];
