import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, CATEGORY_LABELS } from '@/lib/insurance';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Request = Tables<'requests'>;

const statusStyles: Record<string, string> = {
  Pendente: 'bg-primary/10 text-primary border-primary/20',
  'Em Cotação': 'bg-accent/20 text-accent-foreground border-accent/30',
  Emitido: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

interface Props {
  requests: Request[];
  isAdmin?: boolean;
  onRefresh: () => void;
}

export default function RequestsTable({ requests, isAdmin, onRefresh }: Props) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState<string | null>(null);

  async function uploadContrato(requestId: string, file: File) {
    if (!user) return;
    setUploading(requestId);
    const path = `${user.id}/${requestId}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('contratos').upload(path, file);
    if (uploadError) { toast.error('Erro no upload'); setUploading(null); return; }

    const { data: { publicUrl } } = supabase.storage.from('contratos').getPublicUrl(path);
    await supabase.from('requests').update({ contrato_url: publicUrl }).eq('id', requestId);
    toast.success('Contrato enviado!');
    setUploading(null);
    onRefresh();
  }

  async function uploadApolice(requestId: string, file: File, imobId: string) {
    setUploading(requestId);
    const path = `${imobId}/${requestId}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('apolices').upload(path, file);
    if (uploadError) { toast.error('Erro no upload'); setUploading(null); return; }

    const { data: { publicUrl } } = supabase.storage.from('apolices').getPublicUrl(path);
    await supabase.from('requests').update({ apolice_url: publicUrl, status: 'Emitido' }).eq('id', requestId);
    toast.success('Apólice anexada e status atualizado!');
    setUploading(null);
    onRefresh();
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-xl bg-card p-12 text-center gold-border-top">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <FileText className="w-8 h-8 text-primary/40" />
        </div>
        <p className="text-muted-foreground">Nenhuma solicitação encontrada</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card overflow-hidden gold-border-top">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/30">
              <th className="text-left p-4 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Data</th>
              <th className="text-left p-4 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Categoria</th>
              <th className="text-right p-4 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Valor Imóvel</th>
              <th className="text-right p-4 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Comissão</th>
              <th className="text-center p-4 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Status</th>
              <th className="text-center p-4 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req, i) => (
              <motion.tr
                key={req.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="border-b border-border/20 hover:bg-surface-elevated transition-colors duration-240"
              >
                <td className="p-4 text-muted-foreground">{new Date(req.created_at).toLocaleDateString('pt-BR')}</td>
                <td className="p-4">{CATEGORY_LABELS[req.categoria] ?? req.categoria}</td>
                <td className="p-4 text-right tabular-nums">{formatCurrency(req.valor_imovel)}</td>
                <td className="p-4 text-right tabular-nums font-medium text-primary">{formatCurrency(req.comissao_imob)}</td>
                <td className="p-4 text-center">
                  <Badge variant="outline" className={statusStyles[req.status] ?? ''}>
                    {req.status}
                  </Badge>
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {!isAdmin && !req.contrato_url && (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) uploadContrato(req.id, f);
                          }}
                        />
                        <Button size="sm" variant="outline" className="text-xs" disabled={uploading === req.id} asChild>
                          <span><Upload className="w-3 h-3 mr-1" /> Contrato</span>
                        </Button>
                      </label>
                    )}
                    {isAdmin && req.status !== 'Emitido' && (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) uploadApolice(req.id, f, req.imobiliaria_id);
                          }}
                        />
                        <Button size="sm" variant="outline" className="text-xs" disabled={uploading === req.id} asChild>
                          <span><Upload className="w-3 h-3 mr-1" /> Apólice</span>
                        </Button>
                      </label>
                    )}
                    {req.status === 'Emitido' && req.apolice_url && (
                      <a href={req.apolice_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="text-xs">
                          <Download className="w-3 h-3 mr-1" /> Apólice
                        </Button>
                      </a>
                    )}
                    {req.contrato_url && (
                      <a href={req.contrato_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost" className="text-xs">
                          <FileText className="w-3 h-3 mr-1" /> Ver Contrato
                        </Button>
                      </a>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
