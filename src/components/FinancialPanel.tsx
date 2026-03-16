import { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import StatCard from '@/components/StatCard';
import { formatCurrency } from '@/lib/insurance';
import type { Tables } from '@/integrations/supabase/types';

type Request = Tables<'requests'>;

interface Props {
  requests: Request[];
}

export default function FinancialPanel({ requests }: Props) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filtered = useMemo(() => {
    return requests.filter(r => {
      const d = new Date(r.created_at);
      if (startDate && d < new Date(startDate)) return false;
      if (endDate && d > new Date(endDate + 'T23:59:59')) return false;
      return true;
    });
  }, [requests, startDate, endDate]);

  const emitidos = filtered.filter(r => r.status === 'Emitido');
  const pendentes = filtered.filter(r => r.status !== 'Emitido' && r.status !== 'Cancelado');
  const comissaoReceber = emitidos.reduce((sum, r) => sum + r.comissao_imob, 0);
  const projecaoGanho = pendentes.reduce((sum, r) => sum + r.comissao_imob, 0);

  function exportCSV() {
    const rows = emitidos.map(r => ({
      Data: new Date(r.created_at).toLocaleDateString('pt-BR'),
      Nome: (r as any).nome ?? '',
      Categoria: r.categoria,
      'Prêmio Total': r.premio_total.toFixed(2),
      'Prêmio Líquido': r.valor_liquido.toFixed(2),
      'Comissão a Receber': r.comissao_imob.toFixed(2),
    }));

    if (rows.length === 0) return;

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(';'),
      ...rows.map(r => Object.values(r).join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-comissoes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <div className="rounded-xl bg-card p-6 card-shadow border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Filtro por Período</h3>
        </div>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <Label className="text-xs text-muted-foreground">Data Inicial</Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 w-44" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Data Final</Label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 w-44" />
          </div>
          {(startDate || endDate) && (
            <Button variant="ghost" size="sm" onClick={() => { setStartDate(''); setEndDate(''); }}>
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Comissão a Receber"
          value={comissaoReceber}
          icon={<DollarSign className="w-5 h-5" />}
          highlight
        />
        <StatCard
          title="Projeção de Ganho"
          value={projecaoGanho}
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      {/* Export */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={exportCSV} disabled={emitidos.length === 0}>
          <Download className="w-4 h-4 mr-2" /> Gerar Relatório de Comissões (CSV)
        </Button>
      </div>
    </div>
  );
}
