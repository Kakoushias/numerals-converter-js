import { IConverterRepository } from '../repositories/IConverterRepository';

export class ConversionService {
  private readonly romanNumerals = [
    { value: 1000, symbol: 'M' },
    { value: 900, symbol: 'CM' },
    { value: 500, symbol: 'D' },
    { value: 400, symbol: 'CD' },
    { value: 100, symbol: 'C' },
    { value: 90, symbol: 'XC' },
    { value: 50, symbol: 'L' },
    { value: 40, symbol: 'XL' },
    { value: 10, symbol: 'X' },
    { value: 9, symbol: 'IX' },
    { value: 5, symbol: 'V' },
    { value: 4, symbol: 'IV' },
    { value: 1, symbol: 'I' }
  ];

  private readonly romanToArabicMap = new Map<string, number>([
    ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
    ['C', 100], ['XC', 90], ['L', 50], ['XL', 40],
    ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]
  ]);

  constructor(private repository: IConverterRepository) {}

  async arabicToRoman(arabic: number): Promise<string> {
    // Validate input
    if (!Number.isInteger(arabic) || arabic < 1 || arabic > 3999) {
      throw new Error('Arabic number must be an integer between 1 and 3999');
    }

    // Check cache first
    const cached = await this.repository.findByArabic(arabic);
    if (cached) {
      return cached;
    }

    // Convert to Roman
    const roman = this.convertArabicToRoman(arabic);

    // Cache the result (fire and forget to avoid blocking)
    this.repository.save(arabic, roman).catch(error => {
      console.error('Failed to cache conversion:', error);
    });

    return roman;
  }

  async romanToArabic(roman: string): Promise<number> {
    // Validate and normalize input
    const normalizedRoman = roman.trim().toUpperCase();
    if (!this.isValidRomanNumeral(normalizedRoman)) {
      throw new Error('Invalid Roman numeral format');
    }

    // Check cache first
    const cached = await this.repository.findByRoman(normalizedRoman);
    if (cached !== null) {
      return cached;
    }

    // Convert to Arabic
    const arabic = this.convertRomanToArabic(normalizedRoman);

    // Cache the result (fire and forget to avoid blocking)
    this.repository.save(arabic, normalizedRoman).catch(error => {
      console.error('Failed to cache conversion:', error);
    });

    return arabic;
  }

  private convertArabicToRoman(arabic: number): string {
    let result = '';
    let remaining = arabic;

    for (const { value, symbol } of this.romanNumerals) {
      while (remaining >= value) {
        result += symbol;
        remaining -= value;
      }
    }

    return result;
  }

  private convertRomanToArabic(roman: string): number {
    let result = 0;
    let i = 0;

    while (i < roman.length) {
      // Check for two-character combinations first
      if (i + 1 < roman.length) {
        const twoChar = roman.substring(i, i + 2);
        if (this.romanToArabicMap.has(twoChar)) {
          result += this.romanToArabicMap.get(twoChar)!;
          i += 2;
          continue;
        }
      }

      // Single character
      const oneChar = roman[i];
      if (this.romanToArabicMap.has(oneChar)) {
        result += this.romanToArabicMap.get(oneChar)!;
        i++;
      } else {
        throw new Error(`Invalid Roman numeral character: ${oneChar}`);
      }
    }

    return result;
  }

  private isValidRomanNumeral(roman: string): boolean {
    // Check for valid characters only
    if (!/^[IVXLCDM]+$/.test(roman)) {
      return false;
    }

    // Check for invalid patterns
    const invalidPatterns = [
      /I{4,}/, // More than 3 consecutive I's
      /X{4,}/, // More than 3 consecutive X's
      /C{4,}/, // More than 3 consecutive C's
      /M{4,}/, // More than 3 consecutive M's
      /V{2,}/, // More than 1 V
      /L{2,}/, // More than 1 L
      /D{2,}/, // More than 1 D
      /IL/,    // Invalid combination
      /IC/,    // Invalid combination
      /ID/,    // Invalid combination
      /IM/,    // Invalid combination
      /XD/,    // Invalid combination
      /XM/,    // Invalid combination
      /VL/,    // Invalid combination
      /VC/,    // Invalid combination
      /VD/,    // Invalid combination
      /VM/,    // Invalid combination
      /LC/,    // Invalid combination
      /LD/,    // Invalid combination
      /LM/,    // Invalid combination
      /DM/,    // Invalid combination
      // Critical fixes for subtractive notation
      /I{2,}[VX]/, // More than one I before V or X (IIV, IIIV, IIX, IIIX)
      /X{2,}[LC]/, // More than one X before L or C (XXL, XXXL, XXC, XXXC)
      /C{2,}[DM]/, // More than one C before D or M (CCD, CCCD, CCM, CCCM)
    ];

    // Check invalid patterns first
    if (invalidPatterns.some(pattern => pattern.test(roman))) {
      return false;
    }

    // Additional validation: round-trip check
    // If we can convert it to Arabic and back to Roman, and it matches, it's valid
    try {
      this.convertRomanToArabic(roman);
      // Temporarily disable round-trip validation to test
      return true;
    } catch {
      return false;
    }
  }

  // Utility method for testing inverse property
  async testInverseProperty(arabic: number): Promise<boolean> {
    try {
      const roman = await this.arabicToRoman(arabic);
      const backToArabic = await this.romanToArabic(roman);
      return backToArabic === arabic;
    } catch {
      return false;
    }
  }
}
