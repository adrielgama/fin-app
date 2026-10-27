import { SignOutButton } from "@/components/auth/sign-out-button";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { isMockMode } from "@/lib/env";
import type { SessionUser } from "@/lib/auth/constants";

export function Sidebar({ user }: { user: SessionUser }) {
  return (
    <aside className="sticky top-0 flex h-svh w-60 shrink-0 flex-col gap-8 border-r bg-sidebar p-5 max-md:hidden">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-lg font-semibold">
          <span className="size-8 rounded-xl bg-linear-to-br from-hero-from to-hero-to" />
          Fin App
        </span>
        <ThemeToggle />
      </div>
      <SidebarNav />
      <div className="mt-auto flex flex-col gap-2">
        {isMockMode && (
          <span className="mx-3 w-fit rounded-full bg-primary/12 px-2 py-0.5 text-[11px] font-medium text-primary">Dados mock</span>
        )}
        <div className="truncate px-3 text-xs text-muted-foreground">{user.email}</div>
        <SignOutButton />
      </div>
    </aside>
  );
}
