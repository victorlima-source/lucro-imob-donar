import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Footer from '@/components/Footer';
import { Shield } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, company_name: companyName },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) toast.error(error.message);
      else toast.success('Conta criada! Verifique seu e-mail.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary mb-4">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold font-display tracking-tight">Imob Lucro</h1>
            <p className="text-sm text-muted-foreground mt-1">By Donar Corretora</p>
          </div>

          <div className="rounded-xl bg-card p-8 card-shadow border border-border">
            <h2 className="text-lg font-semibold mb-6">{isLogin ? 'Entrar' : 'Criar Conta'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div>
                    <Label className="text-sm text-muted-foreground">Nome Completo</Label>
                    <Input value={fullName} onChange={e => setFullName(e.target.value)} required className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Nome da Imobiliária</Label>
                    <Input value={companyName} onChange={e => setCompanyName(e.target.value)} required className="mt-1" />
                  </div>
                </>
              )}
              <div>
                <Label className="text-sm text-muted-foreground">E-mail</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1" />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Senha</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="mt-1" />
              </div>
              <Button type="submit" className="w-full h-12 text-base font-semibold navy-shadow" disabled={loading}>
                {loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar Conta'}
              </Button>
            </form>
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="w-full mt-4 text-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
            </button>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
