import { useState } from 'react';
import { useConversion } from '../hooks/useConversion';
import { validateArabicNumber, validateRomanNumeral } from '../utils/validation';
import { clsx } from 'clsx';

type ConversionDirection = 'arabic-to-roman' | 'roman-to-arabic';

export function ConversionForm() {
  const [inputValue, setInputValue] = useState('');
  const [convertedValue, setConvertedValue] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [direction, setDirection] = useState<ConversionDirection>('arabic-to-roman');
  const [hasConverted, setHasConverted] = useState(false);

  const { loading, error, convertArabicToRoman, convertRomanToArabic, clearError } = useConversion();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setInputError(null);

    if (direction === 'arabic-to-roman') {
      const validation = validateArabicNumber(inputValue);
      if (!validation.isValid) {
        setInputError(validation.error || null);
        return;
      }

      const arabic = parseInt(inputValue, 10);
      const roman = await convertArabicToRoman(arabic);

      if (roman) {
        setConvertedValue(roman);
        setHasConverted(true);
      }
    } else {
      const validation = validateRomanNumeral(inputValue);
      if (!validation.isValid) {
        setInputError(validation.error || null);
        return;
      }

      const arabic = await convertRomanToArabic(inputValue);

      if (arabic) {
        setConvertedValue(arabic.toString());
        setHasConverted(true);
      }
    }
  };

  const handleSwap = () => {
    // Clear inputs and results when swapping direction
    setInputValue('');
    setConvertedValue('');
    setHasConverted(false);

    // Swap the direction
    setDirection(direction === 'arabic-to-roman' ? 'roman-to-arabic' : 'arabic-to-roman');

    // Clear all errors when swapping
    setInputError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (direction === 'arabic-to-roman') {
      // Only allow digits (filter out everything else)
      const filtered = value.replace(/[^\d]/g, '');
      setInputValue(filtered);

      // Clear error when user starts typing
      if (inputError) setInputError(null);

      // Show validation error in real-time if needed
      if (value !== filtered && value.length > 0) {
        setInputError('Only numbers are allowed');
      }
    } else {
      // Only allow Roman numeral characters (I, V, X, L, C, D, M)
      const filtered = value.replace(/[^IVXLCDMivxlcdm]/g, '').toUpperCase();
      setInputValue(filtered);

      // Clear error when user starts typing valid characters
      if (inputError && value === filtered) setInputError(null);

      // Show validation error in real-time if invalid characters were typed
      if (value !== filtered && value.length > 0) {
        setInputError('Only Roman numeral characters (I, V, X, L, C, D, M) are allowed');
      }
    }

    // Clear converted value when input changes
    if (hasConverted) {
      setConvertedValue('');
      setHasConverted(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-4 border-amber-400 w-full md:w-[600px] xl:w-full mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Desktop: Amount (33%) + From/To (67%) in ONE ROW */}
        <div className="grid grid-cols-1 xl:grid-cols-[33%_1fr] gap-2 md:gap-4">
          {/* Amount Input - Left side on desktop */}
          <div className="relative">
            <div className="h-24 rounded-lg border border-gray-300 bg-white px-4 py-2 text-2xl font-semibold text-gray-900 hover:bg-gray-50 focus-within:outline focus-within:outline-2 focus-within:outline-blue-500  flex flex-col w-full">
                <label
                    htmlFor="amount-input"
                    className="text-sm font-normal text-gray-500"
                >
                    Amount
                </label>
              <div className="flex items-center justify-between h-full">
                <div className="flex items-center w-full">
                  {direction === 'arabic-to-roman' && (
                    <span className="text-gray-500 mr-2" aria-hidden="true">#</span>
                  )}
                  <input
                    id="amount-input"
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={
                      direction === 'arabic-to-roman'
                        ? 'Number between 1 and 3999'
                        : 'Roman numeral (e.g., MMXXIII)'
                    }
                    className="flex-1 border-none bg-transparent p-0 text-2xl font-semibold text-gray-900 focus:outline-none focus:shadow-none"
                    disabled={loading}
                    aria-label={
                      direction === 'arabic-to-roman'
                        ? 'Enter Arabic number to convert to Roman numeral'
                        : 'Enter Roman numeral to convert to Arabic number'
                    }
                    aria-invalid={!!inputError}
                    aria-describedby={inputError ? 'input-error' : undefined}
                  />
                </div>
              </div>
            </div>
            {inputError && (
              <p id="input-error" className="mt-1 text-sm text-red-600" role="alert">{inputError}</p>
            )}
          </div>

          {/* From/To Selectors - Right side on desktop */}
          <div className="relative grid grid-cols-1 xl:grid-cols-[1fr_auto_1fr] gap-2">
            {/* From Card */}
            <div 
              className={clsx(
                "relative flex h-24 w-full flex-col justify-center rounded-lg border border-gray-300 bg-white px-4 hover:bg-gray-50 transition-colors",
                direction === 'arabic-to-roman' && "border-blue-500 bg-blue-50"
              )}
              role="status"
              aria-label={`Converting from ${direction === 'arabic-to-roman' ? 'Arabic Number' : 'Roman Numeral'}`}
            >
              <label className="text-xs text-gray-500 mb-1">From</label>
              <div>
                <span className="text-lg font-semibold text-gray-900">Arabic Number</span>
                <span className="text-sm text-gray-500 ml-2">(1-3999)</span>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex items-center justify-center md:relative md:z-20">
              <button
                type="button"
                onClick={handleSwap}
                className="inline-flex rounded-full border border-gray-300 bg-white p-3 hover:bg-gray-50 shadow-sm transition-colors"
                disabled={loading}
                aria-label="Swap conversion direction"
              >
                <svg
                  className="h-4 w-4 text-gray-600 rotate-90 md:rotate-0"
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

            {/* To Card */}
            <div 
              className={clsx(
                "relative flex h-24 w-full flex-col justify-center rounded-lg border border-gray-300 bg-white px-4 hover:bg-gray-50 transition-colors",
                direction === 'roman-to-arabic' && "border-blue-500 bg-blue-50"
              )}
              role="status"
              aria-label={`Converting to ${direction === 'arabic-to-roman' ? 'Roman Numeral' : 'Arabic Number'}`}
            >
              <label className="text-xs text-gray-500 mb-1">To</label>
              <div>
                <span className="text-lg font-semibold text-gray-900">Roman Numeral</span>
                <span className="text-sm text-gray-500 ml-2">(I, V, X, L, C, D, M)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Convert Button - Full Width Below */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {loading ? 'Converting...' : 'Convert →'}
          </button>
        </div>

        {/* Result Display */}
        {hasConverted && convertedValue && (
          <div className="bg-gray-50 rounded-lg p-6" role="region" aria-live="polite" aria-label="Conversion result">
            <p className="text-base text-gray-700 mb-2">
              {inputValue} {direction === 'arabic-to-roman' ? 'Arabic Number' : 'Roman Numeral'} =
            </p>
            <p className="text-5xl font-bold text-gray-900 mb-3">
              {convertedValue}
            </p>
            <p className="text-sm text-gray-500">
              {direction === 'arabic-to-roman' ? 'Roman' : 'Arabic'}
            </p>
          </div>
        )}

        {/* Global Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert" aria-live="assertive">
            <p className="text-red-800">{error}</p>
          </div>
        )}
      </form>
    </div>
  );
}
