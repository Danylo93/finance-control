import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const BankConnection = () => {
  const { toast } = useToast();

  const handleConnect = () => {
    toast({
      title: "Em breve",
      description: "A integração com bancos via Open Finance está sendo preparada.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </span>
          Conexões Bancárias
        </CardTitle>
        <CardDescription>
          Importe transações automaticamente conectando suas contas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-secondary/30 px-4 py-6 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm font-medium">Open Finance chegando em breve</p>
          <p className="text-xs text-muted-foreground">
            Por enquanto, registre suas transações manualmente no formulário ao lado.
          </p>
        </div>

        <Button onClick={handleConnect} variant="outline" className="w-full">
          Conectar Novo Banco
        </Button>
      </CardContent>
    </Card>
  );
};
