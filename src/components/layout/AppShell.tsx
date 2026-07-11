import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { navItems } from "@/components/layout/navItems";

function getTitle(pathname: string) {
  if (pathname.startsWith("/graph")) {
    return "Life Graph";
  }
  if (pathname.startsWith("/relationships")) {
    return "Relationship Review";
  }
  if (pathname.startsWith("/entities/")) {
    return "Entity";
  }
  return navItems.find((item) => item.path === pathname)?.label ?? "Home";
}

export function AppShell() {
  const location = useLocation();
  const title = getTitle(location.pathname);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto min-h-dvh w-full max-w-xl border-x border-border/50 bg-background">
        <MobileHeader title={title} />
        <main className="mx-auto w-full max-w-xl px-5 pb-44 pt-5 sm:px-6 sm:pb-28">
          <Suspense fallback={<div aria-label="Loading page" className="h-48 animate-pulse rounded-xl bg-muted" role="status" />}>
            <Outlet />
          </Suspense>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
