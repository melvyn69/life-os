import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { navItems } from "@/components/layout/navItems";

function getTitle(pathname: string) {
  return navItems.find((item) => item.path === pathname)?.label ?? "Home";
}

export function AppShell() {
  const location = useLocation();
  const title = getTitle(location.pathname);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto min-h-dvh w-full max-w-xl border-x border-border/50 bg-background">
        <MobileHeader title={title} />
        <main className="mx-auto w-full max-w-xl px-5 pb-28 pt-5 sm:px-6">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
