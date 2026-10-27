"use client";

import { useState, useTransition } from "react";
import { BellRingIcon } from "lucide-react";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { toast } from "sonner";
import { registerFcmToken, saveNotificationPreferences } from "@/app/(app)/ajustes/actions";
import { Button } from "@/components/ui/button";
import { isMockMode, publicEnv } from "@/lib/env";
import { getFirebaseClient } from "@/lib/firebase/client";
import type { NotificationSettings as Settings } from "@/lib/repository/types";

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl p-3 hover:bg-muted/60">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-5 accent-primary" />
    </label>
  );
}

export function NotificationSettings({ initial }: { initial: Settings }) {
  const [prefs, setPrefs] = useState({ push: initial.push, email: initial.email });
  const [pending, startTransition] = useTransition();

  function update(next: typeof prefs) {
    setPrefs(next);
    startTransition(async () => {
      const result = await saveNotificationPreferences(next);
      if (!result.ok) toast.error("Não foi possível salvar");
    });
  }

  function enablePush() {
    startTransition(async () => {
      try {
        if (isMockMode) throw new Error("Push indisponível no modo mock");
        const vapidKey = publicEnv.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey || !(await isSupported())) throw new Error("Push não suportado ou VAPID key ausente");
        if ((await Notification.requestPermission()) !== "granted") throw new Error("Permissão negada no navegador");

        const { app } = getFirebaseClient();
        const query = new URLSearchParams({
          apiKey: publicEnv.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
          projectId: publicEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
          messagingSenderId: publicEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
          appId: publicEnv.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
        });
        const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${query}`);
        const token = await getToken(getMessaging(app), { vapidKey, serviceWorkerRegistration: registration });
        const result = await registerFcmToken(token);
        if (!result.ok) throw new Error("Falha ao registrar dispositivo");
        toast.success("Notificações ativadas neste dispositivo");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao ativar push");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Toggle label="Push (FCM)" description="Lembretes de vencimento no navegador/celular." checked={prefs.push} onChange={(push) => update({ ...prefs, push })} />
      <Toggle label="E-mail" description="Resumo das contas que vencem, enviado ao seu e-mail." checked={prefs.email} onChange={(email) => update({ ...prefs, email })} />
      <div className="flex items-center justify-between gap-3 p-3">
        <span className="text-xs text-muted-foreground">
          {initial.pushDevices > 0 ? `${initial.pushDevices} dispositivo(s) registrado(s)` : "Nenhum dispositivo registrado"}
        </span>
        <Button variant="outline" size="sm" disabled={pending} onClick={enablePush}>
          <BellRingIcon className="size-4" /> Ativar neste dispositivo
        </Button>
      </div>
    </div>
  );
}
