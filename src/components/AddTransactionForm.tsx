import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from 'aws-amplify/auth';
import axios from 'axios';
import { toast } from "sonner";
import { Plus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const AddTransactionForm = () => {
  const queryClient = useQueryClient();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("");
  const [account, setAccount] = useState<"checking" | "benefits">("checking");

  const addTransaction = useMutation({
    mutationFn: async () => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      await axios.post('/api/transactions', {
        userId: user.userId,
        description,
        amount: parseFloat(amount),
        type,
        category: type === "expense" ? category : null,
        account,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["budget-overview"] });
      queryClient.invalidateQueries({ queryKey: ["budget-chart"] });
      queryClient.invalidateQueries({ queryKey: ["budget-limits"] });
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      toast.success("Transação adicionada com sucesso!");
      setDescription("");
      setAmount("");
      setCategory("");
    },
    onError: () => {
      toast.error("Erro ao adicionar transação");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || (type === "expense" && !category)) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }
    addTransaction.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Plus className="h-5 w-5 text-primary" />
          </span>
          Nova Transação
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-secondary/60 p-1">
            <button
              type="button"
              onClick={() => setType("income")}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all",
                type === "income"
                  ? "bg-success text-success-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ArrowUpRight className="h-4 w-4" />
              Receita
            </button>
            <button
              type="button"
              onClick={() => setType("expense")}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all",
                type === "expense"
                  ? "bg-expense text-expense-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ArrowDownRight className="h-4 w-4" />
              Despesa
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account">Conta / Origem</Label>
            <Select value={account} onValueChange={(value: "checking" | "benefits") => setAccount(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Conta Corrente / Salário</SelectItem>
                <SelectItem value="benefits">Benefícios (VA/VR)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex: Salário, Aluguel, Supermercado..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                R$
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9 tabular-nums"
              />
            </div>
          </div>

          {type === "expense" && (
            <div className="space-y-2 animate-fade-in">
              <Label htmlFor="category">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed_expenses">Gastos Fixos (50%)</SelectItem>
                  <SelectItem value="variable_expenses">Gastos Variáveis (20%)</SelectItem>
                  <SelectItem value="savings">Economia/Investimentos (10%)</SelectItem>
                  <SelectItem value="tithe">Dízimo (10%)</SelectItem>
                  <SelectItem value="fiv">Projeto FIV (10%)</SelectItem>
                  <SelectItem value="discounts">Descontos (IRPF/INSS)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={addTransaction.isPending}>
            {addTransaction.isPending ? "Adicionando..." : "Adicionar Transação"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
