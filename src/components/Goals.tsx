import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from 'aws-amplify/auth';
import axios from 'axios';
import { Target, TrendingUp, Plus, DollarSign, Pencil, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
}

export const Goals = () => {
  const queryClient = useQueryClient();
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  
  // States for new goal
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");

  // States for adding funds
  const [fundsAmount, setFundsAmount] = useState("");

  const [editName, setEditName] = useState("");
  const [editTargetAmount, setEditTargetAmount] = useState("");
  const [editDeadline, setEditDeadline] = useState("");

  const { data: goals, isLoading } = useQuery<Goal[]>({
    queryKey: ["goals"],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const response = await axios.get(`/api/goals?userId=${user.userId}`);
      return response.data || [];
    },
  });

  const createGoal = useMutation({
    mutationFn: async () => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      await axios.post('/api/goals', {
        userId: user.userId,
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: 0,
        deadline: deadline ? new Date(deadline).toISOString() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Meta criada com sucesso!");
      setIsAddGoalOpen(false);
      setName("");
      setTargetAmount("");
      setDeadline("");
    },
    onError: () => toast.error("Erro ao criar meta"),
  });

  const addFunds = useMutation({
    mutationFn: async () => {
      if (!selectedGoal) return;
      
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const amountAdded = parseFloat(fundsAmount);
      const newAmount = Number(selectedGoal.currentAmount) + amountAdded;
      
      // Atualiza a meta
      await axios.put('/api/goals', {
        id: selectedGoal.id,
        currentAmount: newAmount,
      });

      // Cria a transação de despesa para descontar da Conta Corrente
      let category = 'savings'; // padrão para metas
      if (selectedGoal.name.toLowerCase().includes('fiv')) category = 'fiv';

      await axios.post('/api/transactions', {
        userId: user.userId,
        description: `Depósito: ${selectedGoal.name}`,
        amount: amountAdded,
        type: 'expense',
        category,
        account: 'checking',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["budget-overview"] });
      queryClient.invalidateQueries({ queryKey: ["budget-chart"] });
      toast.success("Valor adicionado com sucesso!");
      setIsAddFundsOpen(false);
      setFundsAmount("");
      setSelectedGoal(null);
    },
    onError: () => toast.error("Erro ao adicionar valor"),
  });

  const updateGoal = useMutation({
    mutationFn: async () => {
      if (!selectedGoal) return;
      await axios.put('/api/goals', {
        id: selectedGoal.id,
        name: editName,
        targetAmount: parseFloat(editTargetAmount),
        deadline: editDeadline ? new Date(editDeadline).toISOString() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Meta atualizada com sucesso!");
      setIsEditGoalOpen(false);
      setSelectedGoal(null);
    },
    onError: () => toast.error("Erro ao atualizar meta"),
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/goals?id=${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Meta excluída com sucesso!");
    },
    onError: () => toast.error("Erro ao excluir meta"),
  });

  const openEditModal = (goal: Goal) => {
    setSelectedGoal(goal);
    setEditName(goal.name);
    setEditTargetAmount(goal.targetAmount.toString());
    setEditDeadline(goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : "");
    setIsEditGoalOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));
  };

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Minhas Metas
        </CardTitle>
        <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Meta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nome da Meta</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Viagem, Carro..." />
              </div>
              <div className="space-y-2">
                <Label>Valor Alvo (R$)</Label>
                <Input type="number" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} placeholder="0,00" />
              </div>
              <div className="space-y-2">
                <Label>Data Limite (Opcional)</Label>
                <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
              </div>
              <Button className="w-full" onClick={() => createGoal.mutate()} disabled={createGoal.isPending || !name || !targetAmount}>
                {createGoal.isPending ? "Criando..." : "Salvar Meta"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <p className="text-center text-muted-foreground py-4">Carregando metas...</p>
        ) : goals?.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">Nenhuma meta cadastrada ainda.</p>
        ) : (
          goals?.map((goal) => {
            const current = Number(goal.currentAmount);
            const target = Number(goal.targetAmount);
            const percentComplete = Math.min((current / target) * 100, 100);
            
            return (
              <div 
                key={goal.id} 
                className={`space-y-3 p-4 border rounded-lg transition-colors ${
                  percentComplete >= 100 
                    ? "bg-success/5 border-success/30" 
                    : "bg-secondary/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 group">
                    {percentComplete >= 100 ? (
                      <CheckCircle2 className="h-5 w-5 text-success animate-in zoom-in duration-300" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-primary" />
                    )}
                    <span className={`font-semibold text-lg ${percentComplete >= 100 ? 'text-success' : ''}`}>
                      {goal.name}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ml-2">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditModal(goal)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => {
                        if (confirm('Tem certeza que deseja excluir esta meta?')) deleteGoal.mutate(goal.id);
                      }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(current)}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground ml-1">
                      / {formatCurrency(target)}
                    </span>
                  </div>
                </div>
                
                <Progress 
                  value={percentComplete} 
                  className={`h-3 w-full ${percentComplete >= 100 ? 'bg-success/20' : 'bg-secondary'}`} 
                  indicatorColor={percentComplete >= 100 ? 'hsl(var(--success))' : undefined}
                />
                
                <div className="flex items-center justify-between text-sm">
                  <span className={`font-medium ${percentComplete >= 100 ? 'text-success' : ''}`}>
                    {percentComplete >= 100 ? "Meta Alcançada! 🎉" : `${percentComplete.toFixed(1)}% alcançado`}
                  </span>
                  <div className="flex items-center gap-4">
                    {goal.deadline && (
                      <span className="text-muted-foreground">
                        Prazo: {format(new Date(goal.deadline), "MMM yyyy", { locale: ptBR })}
                      </span>
                    )}
                    
                    <Dialog open={isAddFundsOpen && selectedGoal?.id === goal.id} onOpenChange={(open) => {
                      setIsAddFundsOpen(open);
                      if (open) setSelectedGoal(goal);
                      else setSelectedGoal(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="secondary" className="h-8">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Guardar
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Guardar Dinheiro - {goal.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label>Valor a adicionar (R$)</Label>
                            <Input type="number" value={fundsAmount} onChange={e => setFundsAmount(e.target.value)} placeholder="0,00" />
                          </div>
                          <Button className="w-full" onClick={() => addFunds.mutate()} disabled={addFunds.isPending || !fundsAmount}>
                            {addFunds.isPending ? "Adicionando..." : "Confirmar Depósito"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>

      <Dialog open={isEditGoalOpen} onOpenChange={setIsEditGoalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Nome da Meta</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Valor Alvo (R$)</Label>
              <Input type="number" value={editTargetAmount} onChange={e => setEditTargetAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data Limite (Opcional)</Label>
              <Input type="date" value={editDeadline} onChange={e => setEditDeadline(e.target.value)} />
            </div>
            <Button className="w-full" onClick={() => updateGoal.mutate()} disabled={updateGoal.isPending || !editName || !editTargetAmount}>
              {updateGoal.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
