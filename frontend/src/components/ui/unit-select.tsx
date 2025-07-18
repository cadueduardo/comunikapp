'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface UnitOption {
  value: string;
  label: string;
}

interface UnitSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  units: UnitOption[];
}

export function UnitSelect({ value, onValueChange, placeholder = "Selecione uma unidade...", units }: UnitSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedUnit = units.find((unit) => unit.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedUnit ? selectedUnit.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar unidade..." />
          <CommandList>
            <CommandEmpty>Nenhuma unidade encontrada.</CommandEmpty>
            <CommandGroup>
              {units.map((unit) => (
                <CommandItem
                  key={unit.value}
                  value={`${unit.value} ${unit.label}`}
                  onSelect={() => {
                    onValueChange(unit.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === unit.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{unit.label}</span>
                    <span className="text-xs text-muted-foreground">{unit.value}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 