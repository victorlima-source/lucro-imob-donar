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
    
    if (!RESEND_API_KEY) {
      console.log('RESEND_API_KEY not configured, skipping email send');
      return new Response(JSON.stringify({ success: false, reason: 'Email not configured' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const htmlBody = `
      <h2>Nova Solicitação de Seguro - Imob Lucro</h2>
      <h3>Dados do Imóvel</h3>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
        <tr><td><strong>Categoria</strong></td><td>${data.categoria_label}</td></tr>
        <tr><td><strong>Valor do Imóvel</strong></td><td>R$ ${Number(data.valor_imovel).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>
        <tr><td><strong>Prêmio Total</strong></td><td>R$ ${Number(data.premio_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>
        <tr><td><strong>Valor Líquido</strong></td><td>R$ ${Number(data.valor_liquido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>
        <tr><td><strong>Comissão Imob</strong></td><td>R$ ${Number(data.comissao_imob).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>
      </table>
      <h3>Coberturas</h3>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
        <tr><td>Incêndio Prédio</td><td>R$ ${Number(data.coberturas?.incendioPredio ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>
        <tr><td>Incêndio Conteúdo</td><td>R$ ${Number(data.coberturas?.incendioConteudo ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>
        <tr><td>Perda de Aluguel</td><td>R$ ${Number(data.coberturas?.perdaAluguel ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>
        <tr><td>Vendaval</td><td>R$ ${Number(data.coberturas?.vendaval ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>
        <tr><td>R. Civil</td><td>R$ ${Number(data.coberturas?.rcCivil ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>
        <tr><td>Danos Elétricos</td><td>R$ ${Number(data.coberturas?.danosEletricos ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>
      </table>
      <h3>Dados Pessoais</h3>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
        <tr><td><strong>Nome</strong></td><td>${data.nome ?? ''}</td></tr>
        <tr><td><strong>CPF/CNPJ</strong></td><td>${data.cpf_cnpj ?? ''}</td></tr>
        <tr><td><strong>E-mail</strong></td><td>${data.email_contato ?? ''}</td></tr>
        <tr><td><strong>Telefone</strong></td><td>${data.telefone ?? ''}</td></tr>
        <tr><td><strong>Telefone 2</strong></td><td>${data.telefone2 ?? ''}</td></tr>
      </table>
      <h3>Endereço</h3>
      <p>${data.rua ?? ''}, ${data.numero ?? ''} ${data.complemento ? '- ' + data.complemento : ''}<br/>
      ${data.bairro ?? ''} - ${data.cidade ?? ''}/${data.uf ?? ''}<br/>
      CEP: ${data.cep ?? ''}</p>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Imob Lucro <noreply@donarseguros.com.br>',
        to: ['donarseguros@donarseguros.com.br', 'vepel1999@gmail.com'],
        subject: `Nova Solicitação de Seguro - ${data.nome ?? 'Cliente'}`,
        html: htmlBody,
      }),
    });

    const result = await res.json();
    
    return new Response(JSON.stringify({ success: res.ok, result }), {
      status: res.ok ? 200 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
