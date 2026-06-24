import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from 'aws-amplify/auth';
import axios from 'axios';
import { Target, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
}

export const Goals = () => {
  const { data: goals } = useQuery<Goal[]>({
    queryKey: ["goals"],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const response = await axios.get(`/api/goals?userId=${user.userId}`);
      return response.data || [];
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Minhas Metas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {goals?.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Nenhuma meta cadastrada ainda.
          </p>
        ) : (
          goals?.map((goal) => {
            const percentComplete = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
            
            return (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{goal.name}</span>
                  </div>
                  <span className="text-sm font-medium">
                    {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                  </span>
                </div>
                
                <Progress value={percentComplete} className="h-3 w-full" />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{percentComplete.toFixed(1)}% alcançado</span>
                  {goal.deadline && (
                    <span>
                      Prazo: {format(new Date(goal.deadline), "MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
