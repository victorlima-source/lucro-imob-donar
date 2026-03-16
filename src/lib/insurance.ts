export const RATES: Record<string, number> = {
  apto: 0.0025,
  casa: 0.0035,
  comercial: 0.0065,
};

export const IOF = 1.0738;
export const COMISSAO_PERCENT = 0.30;

export const CATEGORY_LABELS: Record<string, string> = {
  apto: 'Apartamento',
  casa: 'Casa',
  comercial: 'Comercial',
};

export function calculateInsurance(valorImovel: number, categoria: string) {
  const rate = RATES[categoria] ?? 0;
  const premioTotal = valorImovel * rate;
  const valorLiquido = premioTotal / IOF;
  const comissaoImob = valorLiquido * COMISSAO_PERCENT;

  const coberturas = {
    incendioPredio: valorImovel,
    incendioConteudo: valorImovel * 0.1,
    perdaAluguel: valorImovel * 0.06,
    vendaval: 5000,
    rcCivil: 20000,
    danosEletricos: 5000,
  };

  return { premioTotal, valorLiquido, comissaoImob, coberturas };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
