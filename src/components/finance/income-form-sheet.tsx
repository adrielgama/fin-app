"use client";

import { useEffect, useMemo, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { removeIncomeEntry, saveIncomeEntry } from "@/app/(app)/renda/actions";
import { Field, selectClass } from "@/components/finance/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  incomeFormSchema,
  incomeFormToInput,
  incomeKindsBySource,
  incomeToFormValues,
  type Account,
  type IncomeEntry,
  type IncomeFormValues,
} from "@/lib/schemas";
import { cn } from "@/lib/utils";

interface IncomeFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: IncomeEntry | null;
  accounts: Account[];
}

function emptyValues(accounts: Account[]): IncomeFormValues {
  const today = new Date();
  return {
    source: "clt",
    kind: "salary",
    description: "",
    grossAmount: "",
    deductions: "",
    date: format(today, "yyyy-MM-dd"),
    competence: format(today, "yyyy-MM"),
    accountId: accounts.find((a) => a.type !== "credit_card" && !a.archived)?.id ?? "",
    client: "",
    invoiceNumber: "",
  };
}

export function IncomeFormSheet({ open, onOpenChange, entry, accounts }: IncomeFormSheetProps) {
  const [pending, startTransition] = useTransition();
  const defaults = useMemo(() => (entry ? incomeToFormValues(entry) : emptyValues(accounts)), [entry, accounts]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<IncomeFormValues>({ resolver: zodResolver(incomeFormSchema), defaultValues: defaults });

  useEffect(() => {
    if (open) reset(defaults);
  }, [open, defaults, reset]);

  const source = useWatch({ control, name: "source" });
  const kind = useWatch({ control, name: "kind" });

  function changeSource(next: IncomeFormValues["source"]) {
    setValue("source", next);
    setValue("kind", incomeKindsBySource[next][0].value);
  }

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await saveIncomeEntry(entry?.id ?? null, incomeFormToInput(values));
      if (result.ok) {
        toast.success(entry ? "Renda atualizada" : "Renda registrada");
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  });

  function onDelete() {
    if (!entry) return;
    startTransition(async () => {
      const result = await removeIncomeEntry(entry.id);
      if (result.ok) {
        toast.success("Registro excluído");
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
          <SheetTitle>{entry ? "Editar renda" : "Nova renda"}</SheetTitle>
          <SheetDescription>Salário e adiantamento (CLT), notas e impostos (PJ).</SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-4 px-4 pb-4">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1" role="radiogroup" aria-label="Fonte">
            {(["clt", "pj"] as const).map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={source === s}
                onClick={() => changeSource(s)}
                className={cn(
                  "rounded-lg py-1.5 text-sm font-medium transition-colors",
                  source === s ? "bg-card text-primary shadow-sm" : "text-muted-foreground",
                )}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo">
              <select {...register("kind")} className={selectClass}>
                {incomeKindsBySource[source].map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Competência" error={errors.competence?.message}>
              <Input type="month" {...register("competence")} />
            </Field>
          </div>

          <Field label="Descrição" error={errors.description?.message}>
            <Input {...register("description")} aria-invalid={!!errors.description} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={kind === "tax" ? "Valor do imposto (R$)" : "Valor bruto (R$)"} error={errors.grossAmount?.message}>
              <Input {...register("grossAmount")} inputMode="decimal" placeholder="0,00" aria-invalid={!!errors.grossAmount} />
            </Field>
            {kind !== "tax" && (
              <Field label="Descontos (R$)" error={errors.deductions?.message}>
                <Input {...register("deductions")} inputMode="decimal" placeholder="0,00" aria-invalid={!!errors.deductions} />
              </Field>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Data" error={errors.date?.message}>
              <Input type="date" {...register("date")} />
            </Field>
            <Field label="Conta" error={errors.accountId?.message}>
              <select {...register("accountId")} className={selectClass}>
                {accounts
                  .filter((a) => a.type !== "credit_card" && !a.archived)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </select>
            </Field>
          </div>

          {source === "pj" && kind === "invoice" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cliente">
                <Input {...register("client")} />
              </Field>
              <Field label="Nº da nota">
                <Input {...register("invoiceNumber")} />
              </Field>
            </div>
          )}

          <div className="mt-auto flex gap-2 pt-2">
            {entry && (
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
