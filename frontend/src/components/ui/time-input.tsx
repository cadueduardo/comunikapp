'use client';

import React from 'react';
import { Input } from '@/components/ui/input';

interface TimeInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// Função para aplicar máscara HH:MM no campo
const applyTimeMask = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length === 0) return '';
  
  // Permite digitação livre de números, só formata quando parar de digitar
  if (numbers.length === 1) {
    return numbers; // 1 -> 1
  } else if (numbers.length === 2) {
    return `00:${numbers}`; // 15 -> 00:15
  } else if (numbers.length === 3) {
    const h = numbers.slice(0, 1);
    const m = numbers.slice(1, 3);
    return `0${h}:${m}`; // 150 -> 01:50
  } else if (numbers.length >= 4) {
    const h = numbers.slice(0, 2);
    const m = numbers.slice(2, 4); // Pega apenas os primeiros 2 dígitos dos minutos
    return `${h}:${m}`; // 1530 -> 15:30
  }
  
  return value;
};

// Função para converter valor mascarado de volta para horas decimais
export const parseTimeValue = (maskedValue: string): number => {
  if (!maskedValue) return 0;
  
  // Se contém ":", é formato HH:MM
  if (maskedValue.includes(':')) {
    const parts = maskedValue.split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours + (minutes / 60);
  }
  
  // Se é só um número (incluindo zeros), considera como minutos
  const num = parseInt(maskedValue, 10);
  if (isNaN(num)) return 0;
  return num / 60; // converte minutos para horas
};

// Função para formatar horas como HH:MM para display
export const formatTimeDisplay = (hours: number): string => {
  if (!hours || hours === 0) return '';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0 && m > 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m.toString().padStart(2, '0')}min`;
};

export function TimeInput({ 
  value = '', 
  onChange, 
  onBlur, 
  placeholder = "Digite: 10, 150, 1230...", 
  disabled = false,
  className = '',
  ...props 
}: TimeInputProps) {
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Permite apenas números e ":"
    const cleanInput = inputValue.replace(/[^\d:]/g, '');
    // Salva o valor limpo sem máscara durante a digitação
    onChange?.(cleanInput);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Aplica a máscara apenas quando sair do campo
    const maskedValue = applyTimeMask(e.target.value);
    onChange?.(maskedValue);
    onBlur?.(e);
  };

  return (
    <Input
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      {...props}
    />
  );
}
