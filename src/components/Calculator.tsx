import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator as CalcIcon, Building2, Home, Store, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { calculateInsurance, formatCurrency, CATEGORY_LABELS } from '@/lib/insurance';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import PersonalDataForm from '@/components/PersonalDataForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const categoryIcons: Record<string, React.ReactNode> = {
  apto: <Building2 className="w-5 h-5" />,
  casa: <Home className="w-5 h-5" />,
  comercial: <Store className="w-5 h-5" />,
  escritorio: <Building className="w-5 h-5" />,
};

export interface PersonalData {
  nome: string;
  cpf_cnpj: string;
  email_contato: string;
  telefone: string;
  telefone2: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export default function CalculatorComponent() {
  const { user } = useAuth();
  const [valorStr, setValorStr] = useState('');
  const [categoria, setCategoria] = useState('apto');
  const [submitting, setSubmitting] = useState(false);
  const [showDataForm, setShowDataForm] = useState(false);

  const valorImovel = parseFloat(valorStr.replace(/\D/g, '')) / 100 || 0;
  const result = valorImovel > 0 ? calculateInsurance(valorImovel, categoria) : null;

  function handleValueChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) { setValorStr(''); return; }
    const num = parseInt(raw) / 100;
    setValorStr(num.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
  }

  async function handleSubmitWithData(data: PersonalData) {
    if (!result || !user) return;
    setSubmitting(true);

    const requestData = {
      imobiliaria_id: user.id,
      valor_imovel: valorImovel,
      categoria,
      premio_total: result.premioTotal,
      valor_liquido: result.valorLiquido,
      comissao_imob: result.comissaoImob,
      nome: data.nome,
      cpf_cnpj: data.cpf_cnpj,
      email_contato: data.email_contato,
      telefone: data.telefone,
      telefone2: data.telefone2 || null,
      cep: data.cep,
      rua: data.rua,
      numero: data.numero,
      complemento: data.complemento || null,
      bairro: data.bairro,
      cidade: data.cidade,
      uf: data.uf,
    };

    const { error } = await supabase.from('requests').insert(requestData);

    if (error) {
      toast.error('Erro ao solicitar emissão');
      setSubmitting(false);
      return;
    }

    // Send email notification
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      await fetch(`https://${projectId}.supabase.co/functions/v1/send-request-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          ...requestData,
          coberturas: result.coberturas,
          categoria_label: CATEGORY_LABELS[categoria],
        }),
      });
    } catch {
      // Email is best-effort, don't block user
    }

    toast.success('Solicitação enviada com sucesso!');
    setValorStr('');
    setShowDataForm(false);
    setSubmitting(false);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-card p-8 card-shadow border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <CalcIcon className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold font-display">Calculadora de Seguro</h2>
        </div>

        <div className="space-y-6">
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Valor do Imóvel (R$)</Label>
            <Input
              value={valorStr}
              onChange={handleValueChange}
              placeholder="0,00"
              className="text-lg tabular-nums h-12"
            />
          </div>

          <div>
            <Label className="text-sm text-muted-foreground mb-3 block">Categoria</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setCategoria(key)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-medium transition-all duration-200 border ${
                    categoria === key
                      ? 'bg-primary text-primary-foreground border-primary navy-shadow'
                      : 'bg-background text-muted-foreground border-border hover:border-primary/40'
                  }`}
                >
                  {categoryIcons[key]}
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            className="space-y-6"
          >
            {/* Coberturas */}
            <div className="rounded-xl bg-card p-8 card-shadow border border-border">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Coberturas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  ['Incêndio Prédio', result.coberturas.incendioPredio],
                  ['Incêndio Conteúdo', result.coberturas.incendioConteudo],
                  ['Perda de Aluguel', result.coberturas.perdaAluguel],
                  ['Vendaval', result.coberturas.vendaval],
                  ['R. Civil', result.coberturas.rcCivil],
                  ['Danos Elétricos', result.coberturas.danosEletricos],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">{label as string}</span>
                    <span className="text-sm font-medium tabular-nums">{formatCurrency(value as number)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue */}
            <div className="rounded-xl bg-card p-8 card-shadow border border-border">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Receita Estimada</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prêmio Total</span>
                  <span className="font-medium tabular-nums">{formatCurrency(result.premioTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor Líquido (s/ IOF)</span>
                  <span className="font-medium tabular-nums">{formatCurrency(result.valorLiquido)}</span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Sua Comissão (30%)</span>
                  <span className="text-3xl font-bold text-accent tabular-nums">{formatCurrency(result.comissaoImob)}</span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setShowDataForm(true)}
              className="w-full h-14 text-lg font-semibold navy-shadow"
              size="lg"
            >
              Solicitar Emissão
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={showDataForm} onOpenChange={setShowDataForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-display">Dados para Emissão</DialogTitle>
          </DialogHeader>
          <PersonalDataForm
            onSubmit={handleSubmitWithData}
            submitting={submitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
