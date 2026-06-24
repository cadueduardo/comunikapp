'use client';

import React from 'react';
import { Input } from '@/components/ui/input';

const unmask = (value: string) => value.replace(/\D/g, '');

const mask = (value: string) => {
  const cleanValue = value.replace(/\D/g, '');
  if (cleanValue === '') return '';
  const numericValue = parseFloat(cleanValue) / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericValue);
};

const formatInitialValue = (
  val: string | number | readonly string[] | undefined,
) => {
  if (val === '' || val === null || val === undefined) return '';

  let numericValue: number;
  if (typeof val === 'string') {
    const normalized = val.trim().replace(',', '.');
    numericValue = parseFloat(normalized);
  } else if (Array.isArray(val)) {
    numericValue = parseFloat(String(val[0] || '0').replace(',', '.'));
  } else {
    numericValue = val;
  }

  if (!Number.isFinite(numericValue)) return '';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericValue);
};

interface CustomCurrencyInputProps
  extends Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'> {
  value?: string | number;
  onValueChange?: (value: string) => void;
}

const CustomCurrencyInput = React.forwardRef<
  HTMLInputElement,
  CustomCurrencyInputProps
>(({ onValueChange, value, onChange, onBlur, name, ...props }, ref) => {
  const emitValue = (nextValue: string) => {
    onValueChange?.(nextValue);
    onChange?.({
      target: { value: nextValue, name: name ?? '' },
      type: 'change',
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const onlyDigits = unmask(event.target.value);
    if (onlyDigits === '') {
      emitValue('');
      return;
    }

    const numericValue = parseFloat(onlyDigits) / 100;
    emitValue(numericValue.toString());
  };

  return (
    <Input
      ref={ref}
      name={name}
      onBlur={onBlur}
      onChange={handleChange}
      value={mask(unmask(formatInitialValue(value)))}
      inputMode="numeric"
      {...props}
    />
  );
});

CustomCurrencyInput.displayName = 'CurrencyInput';

export { CustomCurrencyInput };
