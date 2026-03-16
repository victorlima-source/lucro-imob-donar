import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator as CalcIcon, Building2, Home, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { calculateInsurance, formatCurrency, CATEGORY_LABELS } from '@/lib/insurance';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const categoryIcons: Record<string, React.ReactNode> = {
  apto: <Building2 className="w-5 h-5" />,
  casa: <Home className="w-5 h-5" />,
  comercial: <Store className="w-5 h-5" />,
};

export default function CalculatorComponent() {
  const { user } = useAuth();
  const [valorStr, setValorStr] = useState('');
  const [categoria, setCategoria] = useState('apto');
  const [submitting, setSubmitting] = useState(false);

  const valorImovel = parseFloat(valorStr.replace(/\D/g, '')) / 100 || 0;
  const result = valorImovel > 0 ? calculateInsurance(valorImovel, categoria) : null;

  function handleValueChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) { setValorStr(''); return; }
    const num = parseInt(raw) / 100;
    setValorStr(num.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
  }

  async function handleSubmit() {
    if (!result || !user) return;
    setSubmitting(true);
    const { error } = await supabase.from('requests').insert({
      imobiliaria_id: user.id,
      valor_imovel: valorImovel,
      categoria,
      premio_total: result.premioTotal,
      valor_liquido: result.valorLiquido,
      comissao_imob: result.comissaoImob,
    });
    setSubmitting(false);
    if (error) {
      toast.error('Erro ao solicitar emissão');
    } else {
      toast.success('Solicitação enviada com sucesso!');
      setValorStr('');
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl bg-card p-8 backdrop-blur-md gold-border-top">
        <div className="flex items-center gap-3 mb-6">
          <CalcIcon className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold font-display">Calculadora de Seguro</h2>
        </div>

        <div className="space-y-6">
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Valor do Imóvel (R$)</Label>
            <Input
              value={valorStr}
              onChange={handleValueChange}
              placeholder="0,00"
              className="text-lg tabular-nums bg-muted border-2 border-transparent focus:border-primary transition-all h-12"
            />
          </div>

          <div>
            <Label className="text-sm text-muted-foreground mb-3 block">Categoria</Label>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setCategoria(key)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-medium transition-all duration-240 ${
                    categoria === key
                      ? 'bg-primary text-primary-foreground gold-glow'
                      : 'bg-muted text-muted-foreground hover:bg-surface-elevated'
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
            <div className="rounded-xl bg-card p-8 gold-border-top">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Coberturas</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Incêndio Prédio', result.coberturas.incendioPredio],
                  ['Incêndio Conteúdo', result.coberturas.incendioConteudo],
                  ['Perda de Aluguel', result.coberturas.perdaAluguel],
                  ['Vendaval', result.coberturas.vendaval],
                  ['R. Civil', result.coberturas.rcCivil],
                  ['Danos Elétricos', result.coberturas.danosEletricos],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex justify-between py-2 border-b border-border/30">
                    <span className="text-sm text-muted-foreground">{label as string}</span>
                    <span className="text-sm font-medium tabular-nums">{formatCurrency(value as number)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue */}
            <div className="rounded-xl bg-card p-8 gold-border-top">
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
                <div className="gold-divider" />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Sua Comissão (30%)</span>
                  <span className="text-3xl font-bold text-primary tabular-nums">{formatCurrency(result.comissaoImob)}</span>
                </div>
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full h-14 text-lg font-semibold gold-glow"
                size="lg"
              >
                {submitting ? 'Enviando...' : 'Solicitar Emissão'}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
