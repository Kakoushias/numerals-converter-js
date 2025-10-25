import { useState, useCallback } from 'react';
import { api, ApiError } from '../services/api';

export function useConversion() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const convertArabicToRoman = useCallback(async (arabic: number): Promise<string | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.convertArabicToRoman(arabic);
      return result.convertedValue as string;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Conversion failed';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const convertRomanToArabic = useCallback(async (roman: string): Promise<number | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.convertRomanToArabic(roman);
      return result.convertedValue as number;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Conversion failed';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    convertArabicToRoman,
    convertRomanToArabic,
    clearError,
  };
}
