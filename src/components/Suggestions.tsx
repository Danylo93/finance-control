import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingUp, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from 'aws-amplify/auth';
import axios from 'axios';
import { cn } from "@/lib/utils";

const suggestionStyles: Record<string, string> = {
  success: "border-success/30 bg-success/5 text-success",
  warning: "border-warning/40 bg-warning/5 text-warning",
  info: "border-primary/30 bg-primary/5 text-primary",
};

interface Suggestion {
  type: "success" | "warning" | "info";
  message: string;
  icon: React.ReactNode;
}

interface SuggestionsProps {
  selectedMonth: number;
  selectedYear: number;
}

export const Suggestions = ({ selectedMonth, selectedYear }: SuggestionsProps) => {
  const { data: suggestions } = useQuery<Suggestion[]>({
    queryKey: ["suggestions", selectedMonth, selectedYear],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const response = await axios.get('/api/transactions');
      const allTransactions: any[] = response.data;

      const transactions = allTransactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
      });

      // Consideramos apenas o Salário (Conta Corrente) para o orçamento de sugestões
      const checkingTransactions = transactions?.filter(t => t.account === "checking") || [];

      // Vamos calcular a renda LÍQUIDA (renda - descontos) e as despesas (sem descontos)
      const income = checkingTransactions.filter(t => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        
      const discounts = checkingTransactions.filter(t => t.type === "expense" && t.category === "discounts")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        
      const netIncome = income - discounts;

      const validExpenses = checkingTransactions.filter(t => t.type === "expense" && t.category !== "discounts") || [];
      const expenses = validExpenses.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const categoryData = {
        fixed: validExpenses.filter(t => t.category === "fixed_expenses")
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0,
        variable: validExpenses.filter(t => t.category === "variable_expenses")
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0,
        savings: validExpenses.filter(t => t.category === "savings")
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0,
        tithe: validExpenses.filter(t => t.category === "tithe")
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0,
        fiv: validExpenses.filter(t => t.category === "fiv")
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0,
      };

      const suggestions: Suggestion[] = [];

      // Análise do padrão 50/20/10/10/10
      if (expenses > 0) {
        const fixedPercent = (categoryData.fixed / expenses) * 100;
        const variablePercent = (categoryData.variable / expenses) * 100;
        const savingsPercent = (categoryData.savings / expenses) * 100;
        const fivPercent = (categoryData.fiv / expenses) * 100;

        if (fixedPercent > 55) {
          suggestions.push({
            type: "warning",
            message: "Seus gastos fixos estão acima de 50%. Considere revisar contratos e assinaturas.",
            icon: <AlertTriangle className="h-5 w-5" />,
          });
        }

        if (variablePercent > 25) {
          suggestions.push({
            type: "warning",
            message: "Gastos variáveis acima do recomendado (20%). Tente reduzir despesas não essenciais.",
            icon: <AlertTriangle className="h-5 w-5" />,
          });
        }

        if (savingsPercent < 10 && netIncome > 0) {
          suggestions.push({
            type: "info",
            message: "Tente manter pelo menos 10% da sua renda líquida para a reserva de emergência.",
            icon: <Lightbulb className="h-5 w-5" />,
          });
        }

        if (fivPercent < 10 && netIncome > 0) {
          suggestions.push({
            type: "warning",
            message: "Você está destinando menos de 10% para o Projeto FIV. Tente aportar mais para bater a meta!",
            icon: <AlertTriangle className="h-5 w-5" />,
          });
        }
      }

      // Sugestões positivas
      if (income > expenses && expenses > 0) {
        suggestions.push({
          type: "success",
          message: "Parabéns! Suas receitas são maiores que suas despesas. Continue assim!",
          icon: <TrendingUp className="h-5 w-5" />,
        });
      }

      if (categoryData.savings >= expenses * 0.1) {
        suggestions.push({
          type: "success",
          message: "Excelente! Você está mantendo uma boa reserva de emergência.",
          icon: <TrendingUp className="h-5 w-5" />,
        });
      }

      // Sugestão padrão se não houver outras
      if (suggestions.length === 0) {
        suggestions.push({
          type: "info",
          message: "Comece registrando suas transações para receber sugestões personalizadas!",
          icon: <Lightbulb className="h-5 w-5" />,
        });
      }

      return suggestions;
    },
  });

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
            <Lightbulb className="h-5 w-5 text-warning" />
          </span>
          Sugestões Inteligentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions?.map((suggestion, index) => (
          <div
            key={index}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-4 text-sm",
              suggestionStyles[suggestion.type] || suggestionStyles.info
            )}
          >
            <div className="mt-0.5 shrink-0">{suggestion.icon}</div>
            <p className="flex-1 text-foreground/90">{suggestion.message}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
