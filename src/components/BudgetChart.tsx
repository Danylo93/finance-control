import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from 'aws-amplify/auth';
import axios from 'axios';
import { PieChart as PieChartIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CategoryData {
  name: string;
  value: number;
  color: string;
  recommended: number;
  percentageText: string;
}

interface BudgetChartProps {
  selectedMonth: number;
  selectedYear: number;
}

export const BudgetChart = ({ selectedMonth, selectedYear }: BudgetChartProps) => {
  const { data: chartData } = useQuery<CategoryData[]>({
    queryKey: ["budget-chart", selectedMonth, selectedYear],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const response = await axios.get('/api/transactions');
      const allTransactions: any[] = response.data.filter((t: any) => {
        const d = new Date(t.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      });

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

      return [
        {
          name: "Gastos Fixos",
          value: categoryData.fixed,
          color: "hsl(var(--chart-1))",
          recommended: 50,
          percentageText: `${((categoryData.fixed / safeNetIncome) * 100).toFixed(1)}% do Líquido`
        },
        {
          name: "Gastos Variáveis",
          value: categoryData.variable,
          color: "hsl(var(--chart-2))",
          recommended: 20,
          percentageText: `${((categoryData.variable / safeNetIncome) * 100).toFixed(1)}% do Líquido`
        },
        {
          name: "Economia/Investimentos",
          value: categoryData.savings,
          color: "hsl(var(--chart-3))",
          recommended: 10,
          percentageText: `${((categoryData.savings / safeNetIncome) * 100).toFixed(1)}% do Líquido`
        },
        {
          name: "Dízimo",
          value: categoryData.tithe,
          color: "hsl(var(--chart-4))",
          recommended: 10,
          percentageText: `${((categoryData.tithe / safeGrossIncome) * 100).toFixed(1)}% do Bruto`
        },
        {
          name: "Projeto FIV",
          value: categoryData.fiv,
          color: "hsl(var(--chart-5))",
          recommended: 10,
          percentageText: `${((categoryData.fiv / safeNetIncome) * 100).toFixed(1)}% do Líquido`
        },
      ];
    },
  });

  const totalExpenses = chartData?.reduce((sum, item) => sum + item.value, 0) ?? 0;
  const isEmpty = chartData && chartData.every(item => item.value === 0);

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <PieChartIcon className="h-5 w-5 text-primary" />
          </span>
          Distribuição por Categoria
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="flex h-[300px] flex-col items-center justify-center px-4 text-center text-muted-foreground">
            <PieChartIcon className="mb-4 h-16 w-16 opacity-20" />
            <p className="text-lg font-medium text-foreground">Nenhum dado neste mês</p>
            <p className="text-sm">Adicione receitas ou despesas para visualizar o gráfico de orçamento.</p>
          </div>
        ) : (
          <>
            <div className="relative">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                      boxShadow: "var(--shadow-md)",
                      color: "hsl(var(--popover-foreground))",
                    }}
                    itemStyle={{ color: "hsl(var(--popover-foreground))" }}
                    labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-muted-foreground">Total gasto</span>
                <span className="text-xl font-bold tabular-nums">{formatCurrency(totalExpenses)}</span>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <p className="mb-3 text-center text-xs font-medium text-muted-foreground">
                Padrão recomendado: 50 / 20 / 10 / 10 / 10
              </p>
              {chartData?.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted/50">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                  <div className="flex flex-col text-right">
                    <span className="font-semibold tabular-nums">{item.percentageText}</span>
                    <span className="text-xs text-muted-foreground">Recomendado: {item.recommended}%</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
