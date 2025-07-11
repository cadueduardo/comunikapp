'use client';

import React, { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';

const unmask = (value: string) => {
  return value.replace(/\D/g, '');
}

const mask = (value: string) => {
    if (!value) return '';
    const onlyDigits = value.split("").filter(s => /\d/.test(s)).join("").padStart(3, "0");
    const digitsFloat = onlyDigits.slice(0, -2) + "." + onlyDigits.slice(-2);
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(digitsFloat));
}

interface CustomCurrencyInputProps extends React.ComponentProps<typeof Input> {
    onValueChange?: (value: string) => void;
}

const CustomCurrencyInput = React.forwardRef<
  HTMLInputElement,
  CustomCurrencyInputProps
>(({ onValueChange, value, ...props }, ref) => {
  const handleKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    event.currentTarget.value = mask(unmask(value));
    
    if (onValueChange) {
      const onlyDigits = unmask(value);
      const digitsFloat = onlyDigits.slice(0, -2) + '.' + onlyDigits.slice(-2);
      onValueChange(digitsFloat);
    }
  };

  return (
    <Input
      ref={ref}
      onKeyUp={handleKeyUp}
      defaultValue={value ? mask(String(value)) : ''}
      {...props}
    />
  );
});

CustomCurrencyInput.displayName = 'CurrencyInput';

export { CustomCurrencyInput }; 