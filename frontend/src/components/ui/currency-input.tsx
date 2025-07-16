'use client';

import React from 'react';
import { Input } from '@/components/ui/input';

const unmask = (value: string) => {
    // Remove todos os caracteres não numéricos
    const onlyDigits = value
        .split("")
        .filter(s => /\d/.test(s))
        .join("")
        .padStart(3, "0");
    
    // Converte para formato decimal
    const digitsFloat = onlyDigits.slice(0, -2) + "." + onlyDigits.slice(-2);
    return digitsFloat;
}

const mask = (value: string) => {
    if (!value) return '';
    
    // Remove todos os caracteres não numéricos
    const onlyDigits = value
        .split("")
        .filter(s => /\d/.test(s))
        .join("")
        .padStart(3, "0");
    
    // Converte para formato decimal (centavos)
    const digitsFloat = onlyDigits.slice(0, -2) + "." + onlyDigits.slice(-2);
    
    // Formata como moeda
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(parseFloat(digitsFloat));
}

interface CustomCurrencyInputProps extends React.ComponentProps<typeof Input> {
    onValueChange?: (value: string) => void;
}

const CustomCurrencyInput = React.forwardRef<
  HTMLInputElement,
  CustomCurrencyInputProps
>(({ onValueChange, value, ...props }, ref) => {
  const [displayValue, setDisplayValue] = React.useState('');

  // Função para formatar o valor inicial
  const formatInitialValue = (val: string | number | readonly string[] | undefined) => {
    if (!val) return '';
    
    let numericValue: number;
    if (typeof val === 'string') {
      numericValue = parseFloat(val);
    } else if (Array.isArray(val)) {
      numericValue = parseFloat(val[0] || '0');
    } else {
      numericValue = typeof val === 'number' ? val : 0;
    }
    
    if (isNaN(numericValue) || numericValue === 0) return '';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numericValue);
  };

  // Atualiza o display value quando o value prop muda
  React.useEffect(() => {
    const formattedValue = formatInitialValue(value);
    setDisplayValue(formattedValue);
  }, [value]);

  const handleInput = (event: React.FormEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    const maskedValue = mask(value);
    setDisplayValue(maskedValue);
    
    if (onValueChange) {
      const numericValue = unmask(value);
      const numValue = parseFloat(numericValue);
      if (!isNaN(numValue)) {
        onValueChange(numValue.toString());
      } else {
        onValueChange('');
      }
    }
  };

  return (
    <Input
      ref={ref}
      onInput={handleInput}
      value={displayValue}
      {...props}
    />
  );
});

CustomCurrencyInput.displayName = 'CurrencyInput';

export { CustomCurrencyInput }; 