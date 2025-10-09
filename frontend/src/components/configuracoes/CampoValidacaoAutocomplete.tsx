'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface CampoValidacao {
  campo: string;
  descricao: string;
  tipo: string;
  modulo: string;
  exemplo?: string;
}

interface CampoValidacaoAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function CampoValidacaoAutocomplete({
  value,
  onChange,
  disabled = false,
}: CampoValidacaoAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [campos, setCampos] = useState<CampoValidacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadCampos = async () => {
      try {
        const response = await fetch('/api/configuracoes/campos-validacao');
        const data = await response.json();
        setCampos(data);
      } catch (error) {
        console.error('Erro ao carregar campos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCampos();
  }, []);

  // Agrupar campos por módulo
  const camposPorModulo = campos.reduce((acc, campo) => {
    if (!acc[campo.modulo]) {
      acc[campo.modulo] = [];
    }
    acc[campo.modulo].push(campo);
    return acc;
  }, {} as Record<string, CampoValidacao[]>);

  // Filtrar campos com base na busca
  const filteredCampos = search
    ? campos.filter(
        (campo) =>
          campo.campo.toLowerCase().includes(search.toLowerCase()) ||
          campo.descricao.toLowerCase().includes(search.toLowerCase()) ||
          campo.modulo.toLowerCase().includes(search.toLowerCase())
      )
    : campos;

  // Agrupar campos filtrados por módulo
  const filteredCamposPorModulo = filteredCampos.reduce((acc, campo) => {
    if (!acc[campo.modulo]) {
      acc[campo.modulo] = [];
    }
    acc[campo.modulo].push(campo);
    return acc;
  }, {} as Record<string, CampoValidacao[]>);

  const selectedCampo = campos.find((c) => c.campo === value);
  
  // Se o campo não for encontrado na lista, criar um objeto temporário
  const displayCampo = selectedCampo || (value ? {
    campo: value,
    descricao: `Campo personalizado: ${value}`,
    tipo: 'unknown',
    modulo: 'Personalizado',
    exemplo: ''
  } : null);

  console.log('CampoValidacaoAutocomplete:', {
    value,
    selectedCampo,
    displayCampo,
    camposLength: campos.length
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {displayCampo ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <Badge variant={selectedCampo ? "secondary" : "destructive"} className="shrink-0">
                {displayCampo.modulo}
              </Badge>
              <span className="truncate">
                {displayCampo.campo} - {displayCampo.descricao}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">
              Selecione um campo para validar...
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Buscar campo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Carregando campos...
            </div>
          ) : filteredCampos.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhum campo encontrado.
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              {Object.entries(filteredCamposPorModulo).map(([modulo, camposDoModulo]) => (
                <CommandGroup key={modulo} heading={`${modulo} (${camposDoModulo.length})`}>
                  {camposDoModulo.map((campo) => (
                    <CommandItem
                      key={campo.campo}
                      value={campo.campo}
                      onSelect={(currentValue) => {
                        onChange(currentValue === value ? '' : currentValue);
                        setOpen(false);
                        setSearch('');
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === campo.campo ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {campo.campo}
                          </code>
                          <Badge variant="outline" className="text-xs">
                            {campo.tipo}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground truncate">
                          {campo.descricao}
                        </span>
                        {campo.exemplo && (
                          <span className="text-xs text-muted-foreground italic">
                            Ex: {campo.exemplo}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}

