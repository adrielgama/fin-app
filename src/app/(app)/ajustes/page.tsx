import { Panel, Section } from "@/components/finance/section";
import { Reveal } from "@/components/motion/reveal";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { requireUser } from "@/lib/auth/session";
import { getRepository } from "@/lib/repository";

export const metadata = { title: "Ajustes" };

export default async function AjustesPage() {
  const user = await requireUser();
  const settings = await getRepository(user.uid).getNotificationSettings();

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <Reveal>
        <h1 className="text-2xl font-semibold">Ajustes</h1>
      </Reveal>
      <Reveal delay={0.08}>
        <Section title="Lembretes de contas a pagar">
          <Panel>
            <NotificationSettings initial={settings} />
          </Panel>
        </Section>
      </Reveal>
    </div>
  );
}
