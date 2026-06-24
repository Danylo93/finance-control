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
import { Plus } from "lucide-react";

export const AddTransactionForm = () => {
  const queryClient = useQueryClient();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("");

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
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["budget-overview"] });
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
          <Plus className="h-5 w-5" />
          Nova Transação
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select value={type} onValueChange={(value: "income" | "expense") => setType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Receita</SelectItem>
                <SelectItem value="expense">Despesa</SelectItem>
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
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {type === "expense" && (
            <div className="space-y-2">
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
