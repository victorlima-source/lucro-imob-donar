import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PersonalData } from '@/components/Calculator';

interface Props {
  onSubmit: (data: PersonalData) => void;
  submitting: boolean;
}

const UF_OPTIONS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
  'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

export default function PersonalDataForm({ onSubmit, submitting }: Props) {
  const [data, setData] = useState<PersonalData>({
    nome: '', cpf_cnpj: '', email_contato: '', telefone: '', telefone2: '',
    cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '',
  });

  function set(field: keyof PersonalData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setData(prev => ({ ...prev, [field]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(data);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Dados Pessoais</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label className="text-sm">Nome Completo *</Label>
            <Input value={data.nome} onChange={set('nome')} required className="mt-1" />
          </div>
          <div>
            <Label className="text-sm">CPF/CNPJ *</Label>
            <Input value={data.cpf_cnpj} onChange={set('cpf_cnpj')} required className="mt-1" />
          </div>
          <div>
            <Label className="text-sm">E-mail *</Label>
            <Input type="email" value={data.email_contato} onChange={set('email_contato')} required className="mt-1" />
          </div>
          <div>
            <Label className="text-sm">Telefone *</Label>
            <Input value={data.telefone} onChange={set('telefone')} required className="mt-1" placeholder="(00) 00000-0000" />
          </div>
          <div>
            <Label className="text-sm">Telefone 2</Label>
            <Input value={data.telefone2} onChange={set('telefone2')} className="mt-1" placeholder="(00) 00000-0000" />
          </div>
        </div>
      </div>

      <div className="h-px bg-border" />

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Endereço do Imóvel</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm">CEP *</Label>
            <Input value={data.cep} onChange={set('cep')} required className="mt-1" placeholder="00000-000" />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-sm">Rua *</Label>
            <Input value={data.rua} onChange={set('rua')} required className="mt-1" />
          </div>
          <div>
            <Label className="text-sm">Número *</Label>
            <Input value={data.numero} onChange={set('numero')} required className="mt-1" />
          </div>
          <div>
            <Label className="text-sm">Complemento</Label>
            <Input value={data.complemento} onChange={set('complemento')} className="mt-1" />
          </div>
          <div>
            <Label className="text-sm">Bairro *</Label>
            <Input value={data.bairro} onChange={set('bairro')} required className="mt-1" />
          </div>
          <div>
            <Label className="text-sm">Cidade *</Label>
            <Input value={data.cidade} onChange={set('cidade')} required className="mt-1" />
          </div>
          <div>
            <Label className="text-sm">UF *</Label>
            <select
              value={data.uf}
              onChange={set('uf')}
              required
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Selecione</option>
              {UF_OPTIONS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full h-12 text-base font-semibold navy-shadow" disabled={submitting}>
        {submitting ? 'Enviando...' : 'Confirmar e Enviar Solicitação'}
      </Button>
    </form>
  );
}
