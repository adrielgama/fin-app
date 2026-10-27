"use client";

import { useEffect, useMemo, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { archiveAccount, saveAccount } from "@/app/(app)/cartoes/actions";
import { Field, selectClass } from "@/components/finance/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  accountFormSchema,
  accountFormToInput,
  accountToFormValues,
  type Account,
  type AccountFormValues,
} from "@/lib/schemas";

const typeLabels = {
  checking: "Conta corrente",
  savings: "Poupança",
  credit_card: "Cartão de crédito",
  cash: "Dinheiro",
  investment: "Investimentos",
} as const;

const emptyValues: AccountFormValues = {
  name: "",
  type: "credit_card",
  initialBalance: "",
  color: "#7c3aed",
  creditLimit: "",
  closingDay: "",
  dueDay: "",
  lastDigits: "",
};

interface AccountFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
}

export function AccountFormSheet({ open, onOpenChange, account }: AccountFormSheetProps) {
  const [pending, startTransition] = useTransition();
  const defaults = useMemo(() => (account ? accountToFormValues(account) : emptyValues), [account]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<AccountFormValues>({ resolver: zodResolver(accountFormSchema), defaultValues: defaults });

  useEffect(() => {
    if (open) reset(defaults);
  }, [open, defaults, reset]);

  const type = useWatch({ control, name: "type" });
  const isCard = type === "credit_card";

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await saveAccount(account?.id ?? null, accountFormToInput(values));
      if (result.ok) {
        toast.success(account ? "Conta atualizada" : "Conta criada");
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  });

  function onArchive() {
    if (!account) return;
    startTransition(async () => {
      const result = await archiveAccount(account.id);
      if (result.ok) {
        toast.success("Conta arquivada");
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
          <SheetTitle>{account ? "Editar conta" : "Nova conta ou cartão"}</SheetTitle>
          <SheetDescription>Contas e cartões separam seus lançamentos e faturas.</SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-4 px-4 pb-4">
          <Field label="Nome" error={errors.name?.message}>
            <Input {...register("name")} aria-invalid={!!errors.name} />
          </Field>

          <div className="grid grid-cols-[1fr_auto] gap-3">
            <Field label="Tipo">
              <select {...register("type")} className={selectClass}>
                {Object.entries(typeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Cor">
              <Input type="color" {...register("color")} className="h-9 w-14 p-1" />
            </Field>
          </div>

          {isCard ? (
            <>
              <Field label="Limite (R$)" error={errors.creditLimit?.message}>
                <Input {...register("creditLimit")} inputMode="decimal" placeholder="0,00" aria-invalid={!!errors.creditLimit} />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Fecha dia" error={errors.closingDay?.message}>
                  <Input {...register("closingDay")} inputMode="numeric" />
                </Field>
                <Field label="Vence dia" error={errors.dueDay?.message}>
                  <Input {...register("dueDay")} inputMode="numeric" />
                </Field>
                <Field label="Final" error={errors.lastDigits?.message}>
                  <Input {...register("lastDigits")} inputMode="numeric" maxLength={4} />
                </Field>
              </div>
            </>
          ) : (
            <Field label="Saldo inicial (R$)" error={errors.initialBalance?.message}>
              <Input {...register("initialBalance")} inputMode="decimal" placeholder="0,00" />
            </Field>
          )}

          <div className="mt-auto flex gap-2 pt-2">
            {account && (
              <Button type="button" variant="outline" disabled={pending} onClick={onArchive}>
                Arquivar
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
