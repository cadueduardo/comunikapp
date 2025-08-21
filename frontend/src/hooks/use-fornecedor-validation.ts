import { useState, useEffect } from 'react';
import { fornecedoresApi } from '@/lib/api-client';

interface UseFornecedorValidationProps {
  nome: string;
  fornecedorId?: string; // Para edição
  token: string;
  onValidationChange: (isValid: boolean, message?: string) => void;
}

export const useFornecedorValidation = ({
  nome,
  fornecedorId,
  token,
  onValidationChange,
}: UseFornecedorValidationProps) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string>('');

  useEffect(() => {
    const validateFornecedor = async () => {
      if (!nome.trim() || nome.length < 2) {
        onValidationChange(false, 'Nome deve ter pelo menos 2 caracteres');
        return;
      }

      setIsValidating(true);
      try {
        // Buscar todos os fornecedores para verificar duplicatas
        const fornecedores = await fornecedoresApi.getAll(token);
        
        // Verificar se já existe um fornecedor com o mesmo nome
        const fornecedorExistente = fornecedores.find(
          (f: any) => 
            f.nome.toLowerCase() === nome.toLowerCase() && 
            f.id !== fornecedorId // Excluir o próprio fornecedor na edição
        );

        if (fornecedorExistente) {
          const message = fornecedorId 
            ? `Já existe um fornecedor com o nome "${nome}". Use um nome diferente.`
            : `Já existe um fornecedor com o nome "${nome}". Use um nome diferente ou edite o fornecedor existente.`;
          
          setValidationMessage(message);
          onValidationChange(false, message);
        } else {
          setValidationMessage('');
          onValidationChange(true);
        }
      } catch (error) {
        console.error('Erro na validação:', error);
        // Em caso de erro, permitir o envio (fallback)
        onValidationChange(true);
      } finally {
        setIsValidating(false);
      }
    };

    // Debounce para não validar a cada tecla
    const timeoutId = setTimeout(() => {
      if (nome.trim()) {
        validateFornecedor();
      } else {
        setValidationMessage('');
        onValidationChange(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [nome, fornecedorId, token, onValidationChange]);

  return {
    isValidating,
    validationMessage,
    isValid: !validationMessage && nome.trim().length >= 2,
  };
};





