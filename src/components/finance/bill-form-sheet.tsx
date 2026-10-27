"use client";

import { useEffect, useMemo, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { removeBill, saveBill } from "@/app/(app)/contas/actions";
import { Field, selectClass } from "@/components/finance/form-field";
import { ReceiptsField } from "@/components/finance/receipts-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  billFormSchema,
  billFormToInput,
  billToFormValues,
  reminderOptions,
  type Account,
  type Bill,
  type BillFormValues,
  type Category,
} from "@/lib/schemas";

interface BillFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: Bill | null;
  categories: Category[];
  accounts: Account[];
  uid: string;
}

const frequencyLabels = { none: "Não repete", weekly: "Semanal", monthly: "Mensal", yearly: "Anual" } as const;

function emptyValues(categories: Category[], accounts: Account[]): BillFormValues {
  return {
    title: "",
    amount: "",
    dueDate: format(new Date(), "yyyy-MM-dd"),
    categoryId: categories.find((c) => c.kind === "expense")?.id ?? "",
    accountId: accounts.find((a) => a.type !== "credit_card" && !a.archived)?.id ?? "",
    frequency: "none",
    interval: "1",
    endDate: "",
    reminders: [3, 0],
  };
}

export function BillFormSheet({ open, onOpenChange, bill, categories, accounts, uid }: BillFormSheetProps) {
  const [pending, startTransition] = useTransition();
  const defaults = useMemo(() => (bill ? billToFormValues(bill) : emptyValues(categories, accounts)), [bill, categories, accounts]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<BillFormValues>({ resolver: zodResolver(billFormSchema), defaultValues: defaults });

  useEffect(() => {
    if (open) reset(defaults);
  }, [open, defaults, reset]);

  const frequency = useWatch({ control, name: "frequency" });
  const reminders = useWatch({ control, name: "reminders" });

  function toggleReminder(value: number) {
    const next = reminders.includes(value) ? reminders.filter((r) => r !== value) : [...reminders, value].toSorted((a, b) => b - a);
    setValue("reminders", next, { shouldValidate: true });
  }

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await saveBill(bill?.id ?? null, billFormToInput(values));
      if (result.ok) {
        toast.success(bill ? "Conta atualizada" : "Conta criada");
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  });

  function onDelete() {
    if (!bill) return;
    startTransition(async () => {
      const result = await removeBill(bill.id);
      if (result.ok) {
        toast.success("Conta excluída");
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{bill ? "Editar conta" : "Nova conta a pagar"}</SheetTitle>
          <SheetDescription>Vencimento, recorrência e lembretes por push/e-mail.</SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-4 px-4 pb-4">
          <Field label="Título" error={errors.title?.message}>
            <Input {...register("title")} aria-invalid={!!errors.title} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor (R$)" error={errors.amount?.message}>
              <Input {...register("amount")} inputMode="decimal" placeholder="0,00" aria-invalid={!!errors.amount} />
            </Field>
            <Field label="Vencimento" error={errors.dueDate?.message}>
              <Input type="date" {...register("dueDate")} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoria" error={errors.categoryId?.message}>
              <select {...register("categoryId")} className={selectClass}>
                {categories
                  .filter((c) => c.kind === "expense")
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Pagar com" error={errors.accountId?.message}>
              <select {...register("accountId")} className={selectClass}>
                {accounts
                  .filter((a) => !a.archived)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Recorrência" className={frequency === "none" ? "col-span-2" : undefined}>
              <select {...register("frequency")} className={selectClass}>
                {Object.entries(frequencyLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            {frequency !== "none" && (
              <Field label="A cada (n)" error={errors.interval?.message}>
                <Input {...register("interval")} inputMode="numeric" />
              </Field>
            )}
          </div>
          {frequency !== "none" && (
            <Field label="Até (opcional)" error={errors.endDate?.message}>
              <Input type="date" {...register("endDate")} />
            </Field>
          )}

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">Lembretes</legend>
            <div className="flex flex-wrap gap-2">
              {reminderOptions.map(({ value, label }) => {
                const active = reminders.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleReminder(value)}
                    className={
                      active
                        ? "rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                        : "rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {errors.reminders?.message && <p className="text-xs text-destructive">{errors.reminders.message}</p>}
          </fieldset>

          {bill ? (
            <ReceiptsField target={{ kind: "bill", id: bill.id }} receipts={bill.receipts} uid={uid} />
          ) : (
            <p className="text-xs text-muted-foreground">Salve a conta para anexar comprovantes.</p>
          )}

          <div className="mt-auto flex gap-2 pt-2">
            {bill && (
              <Button type="button" variant="destructive" disabled={pending} onClick={onDelete}>
                Excluir
              </Button>
            )}
            <Button type="submit" className="flex-1" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
