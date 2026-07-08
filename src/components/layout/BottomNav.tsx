import { NavLink } from "react-router-dom";
import { navItems } from "@/components/layout/navItems";
import { cn } from "@/lib/utils";

export function BottomNav() {
  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-xl border-t border-border/80 bg-card/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur"
    >
      <div className="grid grid-cols-7 gap-1">
        {navItems.map((item) => (
          <NavLink
            aria-label={item.label}
            className={({ isActive }) =>
              cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-md px-1 text-[10px] font-medium text-muted-foreground transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                isActive && "bg-primary text-primary-foreground shadow-sm"
              )
            }
            end={item.path === "/"}
            key={item.path}
            to={item.path}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("h-5 w-5", isActive ? "stroke-[2.2]" : "stroke-[1.8]")} />
                <span className="w-full truncate text-center leading-none">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
