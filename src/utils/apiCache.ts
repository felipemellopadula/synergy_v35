// ✅ Sistema de cache LRU para otimizar chamadas de API
// Evita chamadas duplicadas e melhora a velocidade de resposta
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 100; // Limite de entradas no cache
  
  /**
   * Armazena um valor no cache
   * @param key Chave única para identificar o cache
   * @param data Dados a serem cacheados
   * @param expiresInMs Tempo de expiração em milissegundos (padrão: 5 minutos)
   */
  set<T>(key: string, data: T, expiresInMs = 5 * 60 * 1000) {
    // Implementa LRU: remove entrada mais antiga se atingir limite
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, { 
      data, 
      timestamp: Date.now(), 
      expiresIn: expiresInMs 
    });
  }
  
  /**
   * Recupera um valor do cache
   * @param key Chave do cache
   * @returns Dados cacheados ou null se expirado/não encontrado
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Verifica se expirou
    if (Date.now() - entry.timestamp > entry.expiresIn) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  /**
   * Verifica se existe cache válido para uma chave
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }
  
  /**
   * Limpa todo o cache
   */
  clear() { 
    this.cache.clear(); 
  }
  
  /**
   * Invalida caches que correspondem a um padrão regex
   * Útil para invalidar múltiplos caches relacionados
   */
  invalidatePattern(pattern: RegExp) {
    Array.from(this.cache.keys())
      .filter(key => pattern.test(key))
      .forEach(key => this.cache.delete(key));
  }
}

// ✅ Instância singleton do cache
export const apiCache = new APICache();
