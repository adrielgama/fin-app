"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isMockMode } from "@/lib/env";
import { getFirebaseClient } from "@/lib/firebase/client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/auth/session", { method: "DELETE" });
    if (!isMockMode) await signOut(getFirebaseClient().auth);
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleSignOut}>
      <LogOutIcon className="size-4" />
      Sair
    </Button>
  );
}
