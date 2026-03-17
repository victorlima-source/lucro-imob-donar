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
    
    // Pega os e-mails da variável BROKER_EMAIL. 
    // Se estiver vazio, usa os que você já tinha como reserva (fallback).
    const brokerEmailsRaw = Deno.env.get('BROKER_EMAIL') || 'donarseguros@donarseguros.com.br, vepel1999@gmail.com';
    const toEmails = brokerEmailsRaw.split(',').map(email => email.trim());

    if (!RESEND_API_KEY) {
      console.error('ERRO: RESEND_API_KEY não encontrada nas Edge Functions do Supabase');
      return new Response(JSON.stringify({ success: false, reason: 'Email not configured' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const htmlBody = `
      <h2>Nova Solicitação de Seguro - Imob Lucro</h2>
      <h3>Dados do Imóvel</h3>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
        <tr><td><strong>Categoria</strong></td><td>${data.categoria ?? 'N/A'}</td></tr>
        <tr><td><strong>Valor do Imóvel</strong></td><td>R$ ${Number(data.valor_imovel ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>
        <tr><td><strong>Prêmio Total</strong></td><td>R$ ${Number(data.premio_total ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>
        <tr><td><strong>Valor Líquido</strong></td><td>R$ ${Number(data.valor_liquido ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>
        <tr><td><strong>Comissão Imob</strong></td><td>R$ ${Number(data.comissao_imob ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>
      </table>
      <h3>Dados Pessoais</h3>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
        <tr><td><strong>Nome</strong></td><td>${data.nome ?? ''}</td></tr>
        <tr><td><strong>CPF/CNPJ</strong></td><td>${data.cpf_cnpj ?? ''}</td></tr>
        <tr><td><strong>E-mail</strong></td><td>${data.email_contato ?? ''}</td></tr>
        <tr><td><strong>Telefone</strong></td><td>${data.telefone ?? ''}</td></tr>
      </table>
      <h3>Endereço</h3>
      <p>${data.rua ?? ''}, ${data.numero ?? ''}<br/>
      ${data.bairro ?? ''} - ${data.cidade ?? ''}/${data.uf ?? ''}</p>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        // IMPORTANTE: Se você não validou seu domínio no Resend, 
        // use 'onboarding@resend.dev' aqui para testar!
        from: 'Imob Lucro <onboarding@resend.dev>', 
        to: toEmails, 
        subject: `Nova Solicitação - ${data.nome ?? 'Cliente'}`,
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
