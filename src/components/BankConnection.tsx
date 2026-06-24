import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from 'aws-amplify/auth';
import axios from 'axios';

export const BankConnection = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: connections } = useQuery({
    queryKey: ["bank-connections"],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      // Temporário: Banco de dados não tem a tabela bank_connections
      // Retornar lista vazia enquanto a Vercel API não possui o endpoint
      return [];
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const response = await axios.post('/api/pluggy-sync', { itemId });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Sincronização concluída",
        description: "Suas transações foram atualizadas com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["budget-overview"] });
    },
    onError: (error) => {
      toast({
        title: "Erro na sincronização",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      toast({
        title: "Em construção",
        description: "A integração com o Pluggy Connect está sendo refatorada para a nova infraestrutura.",
      });
      setIsConnecting(false);
      return;

      // Load Pluggy Connect Widget
      const script = document.createElement('script');
      script.src = 'https://cdn.pluggy.ai/pluggy-connect/v1.0.0/pluggy-connect.js';
      script.async = true;
      
      script.onload = () => {
        // @ts-ignore
        const pluggyConnect = new window.PluggyConnect({
          connectToken: tokenData.accessToken,
          includeSandbox: true,
          onSuccess: async (itemData: any) => {
            console.log('Bank connected:', itemData);
            
            // Save connection to database
            // await axios.post('/api/bank-connections', { ... });

            toast({
              title: "Banco conectado!",
              description: `${itemData.item.connector.name} foi conectado com sucesso.`,
            });

            queryClient.invalidateQueries({ queryKey: ["bank-connections"] });
            
            // Auto-sync after connection
            syncMutation.mutate(itemData.item.id);
          },
          onError: (error: any) => {
            console.error('Connection error:', error);
            toast({
              title: "Erro ao conectar",
              description: error.message || "Não foi possível conectar ao banco.",
              variant: "destructive",
            });
          },
          onClose: () => {
            setIsConnecting(false);
          },
        });

        pluggyConnect.init();
      };

      document.body.appendChild(script);

    } catch (error: any) {
      console.error('Error connecting bank:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível iniciar a conexão.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Conexões Bancárias
        </CardTitle>
        <CardDescription>
          Conecte suas contas bancárias para importar transações automaticamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {connections && connections.length > 0 ? (
          <div className="space-y-2">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{connection.connector_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {connection.last_sync_at
                      ? `Última sincronização: ${new Date(connection.last_sync_at).toLocaleString('pt-BR')}`
                      : "Nunca sincronizado"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => syncMutation.mutate(connection.item_id)}
                  disabled={syncMutation.isPending}
                >
                  <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum banco conectado ainda
          </p>
        )}
        
        <Button
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full"
        >
          {isConnecting ? "Conectando..." : "Conectar Novo Banco"}
        </Button>
      </CardContent>
    </Card>
  );
};
