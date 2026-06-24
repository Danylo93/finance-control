import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from 'aws-amplify/auth';
import axios from 'axios';
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface CategoryLimit {
  name: string;
  spent: number;
  limit: number;
  color: string;
  type: 'ceiling' | 'floor';
}

export const BudgetLimits = () => {
  const { data: limitsData, isLoading } = useQuery<{ limits: CategoryLimit[], netIncome: number, grossIncome: number }>({
    queryKey: ["budget-limits"],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const response = await axios.get('/api/transactions');
      const allTransactions: any[] = response.data;
      
      const transactions = allTransactions.filter(t => t.account === 'checking');
      
      const grossIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const discounts = transactions
        .filter(t => t.type === 'expense' && t.category === 'discounts')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const netIncome = grossIncome - discounts;
      const safeNetIncome = netIncome > 0 ? netIncome : 1;
      const safeGrossIncome = grossIncome > 0 ? grossIncome : 1;

      const validExpenses = transactions.filter(t => t.type === 'expense' && t.category !== "discounts");

      const spent = {
        fixed: validExpenses.filter(t => t.category === "fixed_expenses").reduce((sum, t) => sum + Number(t.amount), 0),
        variable: validExpenses.filter(t => t.category === "variable_expenses").reduce((sum, t) => sum + Number(t.amount), 0),
        savings: validExpenses.filter(t => t.category === "savings").reduce((sum, t) => sum + Number(t.amount), 0),
        tithe: validExpenses.filter(t => t.category === "tithe").reduce((sum, t) => sum + Number(t.amount), 0),
        fiv: validExpenses.filter(t => t.category === "fiv").reduce((sum, t) => sum + Number(t.amount), 0),
      };

      const limits: CategoryLimit[] = [
        {
          name: "Gastos Fixos (50%)",
          spent: spent.fixed,
          limit: safeNetIncome * 0.50,
          color: "hsl(var(--chart-1))",
          type: 'ceiling'
        },
        {
          name: "Gastos Variáveis (20%)",
          spent: spent.variable,
          limit: safeNetIncome * 0.20,
          color: "hsl(var(--chart-2))",
          type: 'ceiling'
        },
        {
          name: "Dízimo (10% do Bruto)",
          spent: spent.tithe,
          limit: safeGrossIncome * 0.10,
          color: "hsl(var(--chart-4))",
          type: 'floor'
        },
        {
          name: "Economia/Investimentos (10%)",
          spent: spent.savings,
          limit: safeNetIncome * 0.10,
          color: "hsl(var(--chart-3))",
          type: 'floor'
        },
        {
          name: "Projeto FIV (10%)",
          spent: spent.fiv,
          limit: safeNetIncome * 0.10,
          color: "hsl(var(--chart-5))",
          type: 'floor'
        }
      ];

      return { limits, netIncome, grossIncome };
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card className="col-span-full lg:col-span-1">
        <CardHeader>
          <CardTitle>Limites de Orçamento</CardTitle>
        </CardHeader>
        <CardContent>Carregando limites...</CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader>
        <CardTitle>Limites de Orçamento</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Baseado no seu Salário Líquido ({formatCurrency(limitsData?.netIncome || 0)})
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {limitsData?.limits.map((item) => {
          const percentUsed = Math.min((item.spent / item.limit) * 100, 100) || 0;
          
          if (item.type === 'ceiling') {
            const isOverLimit = item.spent > item.limit;
            const available = Math.max(item.limit - item.spent, 0);

            return (
              <div key={item.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                  <span className={`text-sm font-bold ${isOverLimit ? 'text-destructive' : ''}`}>
                    {formatCurrency(item.spent)} / {formatCurrency(item.limit)}
                  </span>
                </div>
                
                <Progress 
                  value={percentUsed} 
                  className={`h-2 ${isOverLimit ? 'bg-destructive/20' : 'bg-secondary'}`}
                  indicatorColor={isOverLimit ? 'hsl(var(--destructive))' : item.color}
                />
                
                <div className="flex items-center justify-between text-xs">
                  {isOverLimit ? (
                    <span className="flex items-center gap-1 text-destructive font-medium">
                      <AlertCircle className="h-3 w-3" />
                      Estourou {formatCurrency(item.spent - item.limit)}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-success/70" />
                      Restam {formatCurrency(available)}
                    </span>
                  )}
                  <span className="text-muted-foreground">
                    {((item.spent / item.limit) * 100).toFixed(1)}% usado
                  </span>
                </div>
              </div>
            );
          } else {
            // Floor logic (Savings, FIV, Tithe)
            const hasReached = item.spent >= item.limit;
            const remaining = Math.max(item.limit - item.spent, 0);
            const exceedAmount = Math.max(item.spent - item.limit, 0);

            return (
              <div key={item.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                  <span className={`text-sm font-bold ${hasReached ? 'text-success' : ''}`}>
                    {formatCurrency(item.spent)} / {formatCurrency(item.limit)}
                  </span>
                </div>
                
                <Progress 
                  value={percentUsed} 
                  className={`h-2 ${hasReached ? 'bg-success/20' : 'bg-secondary'}`}
                  indicatorColor={hasReached ? 'hsl(var(--success))' : item.color}
                />
                
                <div className="flex items-center justify-between text-xs">
                  {hasReached ? (
                    <span className="flex items-center gap-1 text-success font-medium">
                      <CheckCircle2 className="h-3 w-3" />
                      {exceedAmount > 0 ? `Superou a meta em ${formatCurrency(exceedAmount)}!` : `Meta atingida!`}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <AlertCircle className="h-3 w-3 text-muted-foreground/70" />
                      Faltam {formatCurrency(remaining)}
                    </span>
                  )}
                  <span className="text-muted-foreground">
                    {((item.spent / item.limit) * 100).toFixed(1)}% alcançado
                  </span>
                </div>
              </div>
            );
          }
        })}
      </CardContent>
    </Card>
  );
};
