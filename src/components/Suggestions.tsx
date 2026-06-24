import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lightbulb, TrendingUp, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from 'aws-amplify/auth';
import axios from 'axios';

interface Suggestion {
  type: "success" | "warning" | "info";
  message: string;
  icon: React.ReactNode;
}

export const Suggestions = () => {
  const { data: suggestions } = useQuery<Suggestion[]>({
    queryKey: ["suggestions"],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const response = await axios.get('/api/transactions');
      const transactions: any[] = response.data;

      const income = transactions?.filter(t => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const expenses = transactions?.filter(t => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const categoryData = {
        fixed: transactions?.filter(t => t.category === "fixed_expenses")
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0,
        variable: transactions?.filter(t => t.category === "variable_expenses")
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0,
        savings: transactions?.filter(t => t.category === "savings")
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0,
        tithe: transactions?.filter(t => t.category === "tithe")
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0,
        fiv: transactions?.filter(t => t.category === "fiv")
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

        if (savingsPercent < 10 && income > 0) {
          suggestions.push({
            type: "info",
            message: "Tente manter pelo menos 10% da renda para a reserva de emergência/investimentos regulares.",
            icon: <Lightbulb className="h-5 w-5" />,
          });
        }

        if (fivPercent < 10 && income > 0) {
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
          <Lightbulb className="h-5 w-5" />
          Sugestões Inteligentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions?.map((suggestion, index) => (
          <Alert key={index} variant={suggestion.type === "warning" ? "destructive" : "default"}>
            <div className="flex items-start gap-3">
              <div className={
                suggestion.type === "success" ? "text-income" :
                suggestion.type === "warning" ? "text-expense" :
                "text-primary"
              }>
                {suggestion.icon}
              </div>
              <AlertDescription className="flex-1">
                {suggestion.message}
              </AlertDescription>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
};
