export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateArabicNumber(value: string): ValidationResult {
  if (!value.trim()) {
    return { isValid: false, error: 'Please enter a number' };
  }

  // Check if the entire string contains only digits (no trimming to catch spaces)
  if (!/^\d+$/.test(value)) {
    return { isValid: false, error: 'Please enter only digits (no letters, spaces, or decimals)' };
  }

  const num = parseInt(value, 10);
  
  if (isNaN(num)) {
    return { isValid: false, error: 'Please enter a valid number' };
  }

  if (num < 1) {
    return { isValid: false, error: 'Number must be greater than 0' };
  }

  if (num > 3999) {
    return { isValid: false, error: 'Number must be less than or equal to 3999' };
  }

  return { isValid: true };
}

export function validateRomanNumeral(value: string): ValidationResult {
  if (!value.trim()) {
    return { isValid: false, error: 'Please enter a Roman numeral' };
  }

  const roman = value.trim().toUpperCase();

  // Check for valid characters only
  if (!/^[IVXLCDM]+$/.test(roman)) {
    return { isValid: false, error: 'Roman numeral can only contain I, V, X, L, C, D, M' };
  }

  // Check for invalid patterns
  const invalidPatterns = [
    { pattern: /I{4,}/, message: 'Cannot have more than 3 consecutive I\'s' },
    { pattern: /X{4,}/, message: 'Cannot have more than 3 consecutive X\'s' },
    { pattern: /C{4,}/, message: 'Cannot have more than 3 consecutive C\'s' },
    { pattern: /M{4,}/, message: 'Cannot have more than 3 consecutive M\'s' },
    { pattern: /V{2,}/, message: 'Cannot have more than 1 V' },
    { pattern: /L{2,}/, message: 'Cannot have more than 1 L' },
    { pattern: /D{2,}/, message: 'Cannot have more than 1 D' },
    { pattern: /IL/, message: 'Invalid combination: IL' },
    { pattern: /IC/, message: 'Invalid combination: IC' },
    { pattern: /ID/, message: 'Invalid combination: ID' },
    { pattern: /IM/, message: 'Invalid combination: IM' },
    { pattern: /XD/, message: 'Invalid combination: XD' },
    { pattern: /XM/, message: 'Invalid combination: XM' },
    { pattern: /VL/, message: 'Invalid combination: VL' },
    { pattern: /VC/, message: 'Invalid combination: VC' },
    { pattern: /VD/, message: 'Invalid combination: VD' },
    { pattern: /VM/, message: 'Invalid combination: VM' },
    { pattern: /LC/, message: 'Invalid combination: LC' },
    { pattern: /LD/, message: 'Invalid combination: LD' },
    { pattern: /LM/, message: 'Invalid combination: LM' },
    { pattern: /DM/, message: 'Invalid combination: DM' }
  ];

  for (const { pattern, message } of invalidPatterns) {
    if (pattern.test(roman)) {
      return { isValid: false, error: message };
    }
  }

  return { isValid: true };
}
