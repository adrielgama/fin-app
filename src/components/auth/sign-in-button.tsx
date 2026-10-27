"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getFirebaseClient } from "@/lib/firebase/client";

async function createSession(body: { idToken: string } | { mock: true }) {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Falha ao criar sessão");
}

export function SignInButton({ mock }: { mock: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    try {
      if (mock) {
        await createSession({ mock: true });
      } else {
        const { auth } = getFirebaseClient();
        const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
        await createSession({ idToken: await user.getIdToken() });
      }
      router.replace("/");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao entrar");
      setLoading(false);
    }
  }

  return (
    <Button size="lg" className="w-full" onClick={handleSignIn} disabled={loading}>
      {mock ? "Entrar com conta demo" : "Entrar com Google"}
    </Button>
  );
}
