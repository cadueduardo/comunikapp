"use client"

import * as React from "react"
import { Building2, Check, ChevronsUpDown, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
  options: { label: string; value: string }[];
  value?: string;
  onChange: (value: string) => void;
  onCreate?: (inputValue: string) => void;
  onCreateDetailed?: (inputValue: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyPlaceholder?: string;
  createPlaceholder?: string;
  detailedCreatePlaceholder?: string;
  detailedCreateBadge?: string;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  onChange,
  onCreate,
  onCreateDetailed,
  placeholder = "Selecione uma opção",
  searchPlaceholder = "Buscar...",
  emptyPlaceholder = "Nenhum item encontrado.",
  createPlaceholder = "Criar",
  detailedCreatePlaceholder = "Cadastrar com detalhes",
  detailedCreateBadge = "Completo",
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const selectedOption = options.find((option) => option.value === value);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue === value ? "" : selectedValue)
    setInputValue("")
    setOpen(false)
  }

  const handleCreate = (detailed = false) => {
    const normalizedInput = inputValue.trim()
    const createHandler = detailed ? onCreateDetailed : onCreate

    if (createHandler && normalizedInput) {
      createHandler(normalizedInput)
      setInputValue("")
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full min-w-0 justify-between"
          disabled={disabled}
        >
          <span className="truncate text-left">
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            onValueChange={setInputValue}
            value={inputValue}
          />
          <CommandList>
            <CommandEmpty>
              {(onCreate || onCreateDetailed) && inputValue.trim() ? (
                <div className="space-y-1 px-1 text-left">
                  {onCreate && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-auto w-full justify-start px-2 py-2 font-normal"
                      onClick={() => handleCreate(false)}
                    >
                      <PlusCircle className="h-4 w-4" />
                      <span className="truncate">
                        {createPlaceholder} &quot;{inputValue.trim()}&quot;
                      </span>
                    </Button>
                  )}
                  {onCreateDetailed && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-auto w-full justify-start px-2 py-2 font-normal"
                      onClick={() => handleCreate(true)}
                    >
                      <Building2 className="h-4 w-4" />
                      <span className="truncate">
                        {detailedCreatePlaceholder}
                      </span>
                      <Badge variant="secondary" className="ml-auto">
                        {detailedCreateBadge}
                      </Badge>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="py-6 text-center text-sm">{emptyPlaceholder}</div>
              )}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
