import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, LogOut, Calculator as CalcIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import StatCard from '@/components/StatCard';
import CalculatorComponent from '@/components/Calculator';
import RequestsTable from '@/components/RequestsTable';
import GoldDivider from '@/components/GoldDivider';
import Footer from '@/components/Footer';
import type { Tables } from '@/integrations/supabase/types';

type Request = Tables<'requests'>;

export default function Dashboard() {
  const { user, role, signOut } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false });
    setRequests(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const emitidos = requests.filter(r => r.status === 'Emitido');
  const pendentes = requests.filter(r => r.status !== 'Emitido');
  const comissaoReceber = emitidos.reduce((sum, r) => sum + r.comissao_imob, 0);
  const projecaoGanho = pendentes.reduce((sum, r) => sum + r.comissao_imob, 0);

  const isAdmin = role === 'admin';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border/30 bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalcIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-display tracking-tight">Imob Lucro</h1>
              <p className="text-xs text-muted-foreground">{isAdmin ? 'Administrador Donar' : 'Painel da Imobiliária'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-8">
        {/* Hero Headline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold font-display">
            {isAdmin ? 'Gestão de Solicitações' : 'Transforme gestão de seguros em receita líquida.'}
          </h2>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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

        <GoldDivider />

        {/* Calculator (only for imobiliárias) */}
        {!isAdmin && (
          <div className="mb-8 max-w-xl mx-auto">
            <CalculatorComponent />
          </div>
        )}

        {!isAdmin && <GoldDivider />}

        {/* Requests Table */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 font-display">
            {isAdmin ? 'Todos os Pedidos' : 'Suas Solicitações'}
          </h3>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Carregando...</div>
          ) : (
            <RequestsTable requests={requests} isAdmin={isAdmin} onRefresh={fetchRequests} />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
