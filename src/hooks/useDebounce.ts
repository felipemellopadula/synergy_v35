import { useState, useEffect } from 'react';

/**
 * Hook para debounce (atraso) de valores
 * Útil para evitar chamadas excessivas de API durante digitação
 * 
 * @param value Valor a ser debounced
 * @param delay Tempo de atraso em milissegundos
 * @returns Valor debounced (atualizado após o delay)
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 500);
 * 
 * useEffect(() => {
 *   // Esta chamada só acontece 500ms após o usuário parar de digitar
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    // Define um timer para atualizar o valor após o delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    // Limpa o timer anterior se o valor mudar antes do delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}
