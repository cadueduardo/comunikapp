'use client';

import React from 'react';
import { Input } from '@/components/ui/input';

const unmask = (value: string) => {
  return value.replace(/\D/g, '');
}

const mask = (value: string) => {
    if (!value) return '';
    // Converte o valor para string e remove caracteres não numéricos
    const cleanValue = value.toString().replace(/\D/g, '');
    if (cleanValue === '') return '';
    
    // Converte para número considerando centavos
    const numericValue = parseFloat(cleanValue) / 100;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numericValue);
}

interface CustomCurrencyInputProps extends React.ComponentProps<typeof Input> {
    onValueChange?: (value: string) => void;
}

const CustomCurrencyInput = React.forwardRef<
  HTMLInputElement,
  CustomCurrencyInputProps
>(({ onValueChange, value, ...props }, ref) => {
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
    
    if (isNaN(numericValue)) return '';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numericValue);
  };

  const handleKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    const maskedValue = mask(value);
    event.currentTarget.value = maskedValue;
    
    if (onValueChange) {
      // Extrai apenas os dígitos
      const onlyDigits = unmask(value);
      if (onlyDigits === '') {
        onValueChange('');
        return;
      }
      
      // Converte para número considerando centavos
      const numericValue = parseFloat(onlyDigits) / 100;
      onValueChange(numericValue.toString());
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    const maskedValue = mask(value);
    event.currentTarget.value = maskedValue;
    
    if (onValueChange) {
      const onlyDigits = unmask(value);
      if (onlyDigits === '') {
        onValueChange('');
        return;
      }
      
      const numericValue = parseFloat(onlyDigits) / 100;
      onValueChange(numericValue.toString());
    }
  };

  return (
    <Input
      ref={ref}
      onKeyUp={handleKeyUp}
      onChange={handleChange}
      value={formatInitialValue(value)}
      {...props}
    />
  );
});

CustomCurrencyInput.displayName = 'CurrencyInput';

export { CustomCurrencyInput }; 