import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Calculator as CalcIcon, ClipboardList, BarChart3, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import CalculatorComponent from '@/components/Calculator';
import RequestsTable from '@/components/RequestsTable';
import FinancialPanel from '@/components/FinancialPanel';
import Footer from '@/components/Footer';
import type { Tables } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

type Request = Tables<'requests'>;

type Tab = 'calculadora' | 'emissoes' | 'financeiro';

export default function Dashboard() {
  const { user, role, signOut } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('calculadora');

  const isAdmin = role === 'admin';

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

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = isAdmin
    ? [
        { key: 'emissoes', label: 'Gestão de Pedidos', icon: <ClipboardList className="w-4 h-4" /> },
        { key: 'financeiro', label: 'Financeiro', icon: <BarChart3 className="w-4 h-4" /> },
      ]
    : [
        { key: 'calculadora', label: 'Calculadora', icon: <CalcIcon className="w-4 h-4" /> },
        { key: 'emissoes', label: 'Controle de Emissão', icon: <ClipboardList className="w-4 h-4" /> },
        { key: 'financeiro', label: 'Painel Financeiro', icon: <BarChart3 className="w-4 h-4" /> },
      ];

  // Admin defaults to emissoes
  useEffect(() => {
    if (isAdmin && activeTab === 'calculadora') setActiveTab('emissoes');
  }, [isAdmin, activeTab]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <CalcIcon className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-display tracking-tight">Imob Lucro</h1>
              <p className="text-xs text-muted-foreground">{isAdmin ? 'Administrador Donar' : 'By Donar Corretora'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" /> Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6">
          <nav className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-6 py-8">
        {activeTab === 'calculadora' && !isAdmin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
            <CalculatorComponent />
          </motion.div>
        )}

        {activeTab === 'emissoes' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-xl font-bold font-display mb-6">
              {isAdmin ? 'Gestão de Todos os Pedidos' : 'Controle de Emissão'}
            </h2>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Carregando...</div>
            ) : (
              <RequestsTable requests={requests} isAdmin={isAdmin} onRefresh={fetchRequests} />
            )}
          </motion.div>
        )}

        {activeTab === 'financeiro' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-xl font-bold font-display mb-6">Painel Financeiro</h2>
            <FinancialPanel requests={requests} />
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
