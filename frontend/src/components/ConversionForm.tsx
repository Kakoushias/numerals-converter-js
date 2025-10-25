import { useState } from 'react';
import { useConversion } from '../hooks/useConversion';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { validateArabicNumber, validateRomanNumeral } from '../utils/validation';
import { Conversion } from '../types';
import { clsx } from 'clsx';

type ConversionDirection = 'arabic-to-roman' | 'roman-to-arabic';

export function ConversionForm() {
  const [arabicInput, setArabicInput] = useState('');
  const [romanInput, setRomanInput] = useState('');
  const [arabicError, setArabicError] = useState<string | null>(null);
  const [romanError, setRomanError] = useState<string | null>(null);
  const [direction, setDirection] = useState<ConversionDirection>('arabic-to-roman');
  
  const { loading, error, convertArabicToRoman, convertRomanToArabic, clearError } = useConversion();
  const [, setHistory] = useLocalStorage<Conversion[]>('conversion-history', []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    // Clear all errors at the start of any conversion
    setArabicError(null);
    setRomanError(null);
    
    if (direction === 'arabic-to-roman') {
      const validation = validateArabicNumber(arabicInput);
      if (!validation.isValid) {
        setArabicError(validation.error || null);
        return;
      }

      const arabic = parseInt(arabicInput, 10);
      const roman = await convertArabicToRoman(arabic);
      
      if (roman) {
        setRomanInput(roman);
        addToHistory({ arabic, roman });
      }
    } else {
      const validation = validateRomanNumeral(romanInput);
      if (!validation.isValid) {
        setRomanError(validation.error || null);
        return;
      }

      const arabic = await convertRomanToArabic(romanInput);
      
      if (arabic) {
        setArabicInput(arabic.toString());
        addToHistory({ arabic, roman: romanInput.toUpperCase() });
      }
    }
  };

  const addToHistory = (conversion: Conversion) => {
    setHistory(prev => {
      // Avoid duplicates
      const exists = prev.some(item => 
        item.arabic === conversion.arabic && item.roman === conversion.roman
      );
      
      if (exists) return prev;
      
      // Add to beginning and limit to 50 items
      return [conversion, ...prev].slice(0, 50);
    });
  };

  const handleSwap = () => {
    // Clear inputs when swapping direction (like Google Translate)
    setArabicInput('');
    setRomanInput('');
    
    // Swap the direction
    setDirection(direction === 'arabic-to-roman' ? 'roman-to-arabic' : 'arabic-to-roman');
    
    // Clear all errors when swapping
    setArabicError(null);
    setRomanError(null);
  };

  const handleArabicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Only allow digits (filter out everything else)
    const filtered = value.replace(/[^\d]/g, '');
    setArabicInput(filtered);
    
    // Clear error when user starts typing
    if (arabicError) setArabicError(null);
    
    // Show validation error in real-time if needed
    if (value !== filtered && value.length > 0) {
      setArabicError('Only numbers are allowed');
    }
  };

  const handleRomanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Only allow Roman numeral characters (I, V, X, L, C, D, M)
    const filtered = value.replace(/[^IVXLCDMivxlcdm]/g, '').toUpperCase();
    setRomanInput(filtered);
    
    // Clear error when user starts typing valid characters
    if (romanError && value === filtered) setRomanError(null);
    
    // Show validation error in real-time if invalid characters were typed
    if (value !== filtered && value.length > 0) {
      setRomanError('Only Roman numeral characters (I, V, X, L, C, D, M) are allowed');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main conversion area */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* Left input (source) */}
          <div className="flex-1 w-full">
            <label 
              htmlFor="source-input" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {direction === 'arabic-to-roman' ? 'Arabic Number (1-3999)' : 'Roman Numeral'}
            </label>
            <input
              id="source-input"
              type="text"
              value={direction === 'arabic-to-roman' ? arabicInput : romanInput}
              onChange={direction === 'arabic-to-roman' ? handleArabicChange : handleRomanChange}
              placeholder={
                direction === 'arabic-to-roman' 
                  ? 'Enter a number between 1 and 3999'
                  : 'Enter a Roman numeral (e.g., MMXXIII)'
              }
              className={clsx(
                'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                (direction === 'arabic-to-roman' ? arabicError : romanError) && 'border-red-500 focus:ring-red-500 focus:border-red-500'
              )}
              disabled={loading}
            />
            {(direction === 'arabic-to-roman' ? arabicError : romanError) && (
              <p className="mt-1 text-sm text-red-600">
                {direction === 'arabic-to-roman' ? arabicError : romanError}
              </p>
            )}
          </div>

          {/* Swap button */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={handleSwap}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              disabled={loading}
              aria-label="Swap conversion direction"
            >
              <svg 
                className="w-6 h-6 text-gray-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" 
                />
              </svg>
            </button>
          </div>

          {/* Right input (target) */}
          <div className="flex-1 w-full">
            <label 
              htmlFor="target-input" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {direction === 'arabic-to-roman' ? 'Roman Numeral' : 'Arabic Number'}
            </label>
            <input
              id="target-input"
              type="text"
              value={direction === 'arabic-to-roman' ? romanInput : arabicInput}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-600"
            />
          </div>
        </div>

        {/* Convert button */}
        <div className="flex justify-start">
          <button
            type="submit"
            disabled={loading || !(direction === 'arabic-to-roman' ? arabicInput.trim() : romanInput.trim())}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Converting...' : 'Convert'}
          </button>
        </div>

        {/* Global Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}
      </form>
    </div>
  );
}
