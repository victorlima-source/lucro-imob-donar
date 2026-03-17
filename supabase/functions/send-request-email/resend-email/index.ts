import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data = await req.json();
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    
    const brokerEmailsRaw = Deno.env.get('BROKER_EMAIL') || 'donarseguros@donarseguros.com.br';
    const toEmails = brokerEmailsRaw.split(',').map(email => email.trim());

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ success: false, reason: 'Email not configured' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const htmlBody = `
      <div style="font-family: sans-serif; color: #333;">
        <h2 style="color: #1a365d;">Nova Solicitação de Seguro - Imob Lucro</h2>
        <h3>Dados do Cliente</h3>
        <table border="0" cellpadding="8" cellspacing="0" style="width: 100%; border-bottom: 1px solid #eee;">
          <tr><td><strong>Nome:</strong></td><td>${data.nome ?? 'N/A'}</td></tr>
          <tr><td><strong>CPF/CNPJ:</strong></td><td>${data.cpf_cnpj ?? 'N/A'}</td></tr>
          <tr><td><strong>E-mail:</strong></td><td>${data.email_contato ?? 'N/A'}</td></tr>
          <tr><td><strong>Telefone:</strong></td><td>${data.telefone ?? 'N/A'}</td></tr>
        </table>
        <h3>Resumo Financeiro</h3>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
          <tr style="background-color: #f8fafc;"><td><strong>Categoria</strong></td><td>${data.categoria ?? 'N/A'}</td></tr>
          <tr><td><strong>Valor do Imóvel</strong></td><td>R$ ${Number(data.valor_imovel ?? 0).toLocaleString('pt-BR')}</td></tr>
          <tr style="color: #2563eb;"><td><strong>Comissão Imob</strong></td><td>R$ ${Number(data.comissao_imob ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>
        </table>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {https://github.com/victorlima-source/lucro-imob-donar/tree/main/supabase/functions/send-request-email
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Imob Lucro <onboarding@resend.dev>',
        to: toEmails,
        subject: `🔥 Nova Solicitação: ${data.nome ?? 'Cliente'}`,
        html: htmlBody,
      }),
    });

    const result = await res.json();
    return new Response(JSON.stringify({ success: res.ok, result }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
