import { useState, useEffect } from 'react';
import { categoriasApi } from '@/lib/api-client';

interface UseCategoriaValidationProps {
  nome: string;
  categoriaId?: string; // Para edição
  token: string;
  onValidationChange: (isValid: boolean, message?: string) => void;
}

export const useCategoriaValidation = ({
  nome,
  categoriaId,
  token,
  onValidationChange,
}: UseCategoriaValidationProps) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string>('');

  useEffect(() => {
    const validateCategoria = async () => {
      if (!nome.trim() || nome.length < 2) {
        onValidationChange(false, 'Nome deve ter pelo menos 2 caracteres');
        return;
      }

      setIsValidating(true);
      try {
        // Buscar todas as categorias para verificar duplicatas
        const categorias = await categoriasApi.getAll(token);
        
        // Verificar se já existe uma categoria com o mesmo nome
        const categoriaExistente = categorias.find(
          (c: any) => 
            c.nome.toLowerCase() === nome.toLowerCase() && 
            c.id !== categoriaId // Excluir a própria categoria na edição
        );

        if (categoriaExistente) {
          const message = categoriaId 
            ? `Já existe uma categoria com o nome "${nome}". Use um nome diferente.`
            : `Já existe uma categoria com o nome "${nome}". Use um nome diferente ou edite a categoria existente.`;
          
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
        validateCategoria();
      } else {
        setValidationMessage('');
        onValidationChange(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [nome, categoriaId, token, onValidationChange]);

  return {
    isValidating,
    validationMessage,
    isValid: !validationMessage && nome.trim().length >= 2,
  };
};





