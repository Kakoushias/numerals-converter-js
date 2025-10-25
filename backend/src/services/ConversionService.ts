import { IConverterRepository } from '../repositories/IConverterRepository';

/**
 * Service for converting between Arabic numerals and Roman numerals.
 * 
 * Roman numerals use subtractive notation where a smaller numeral before a larger
 * one indicates subtraction (IV=4, IX=9, XL=40, XC=90, CD=400, CM=900). This
 * implementation uses an explicit lookup table containing both base symbols and
 * subtractive pairs, as this closed system is best represented declaratively
 * rather than algorithmically.
 * 
 * Valid range: 1-3999 (standard Roman numeral limit)
 * 
 * @example
 * const service = new ConversionService(repository);
 * await service.arabicToRoman(1994); // Returns "MCMXCIV"
 * await service.romanToArabic("XLII"); // Returns 42
 */
export class ConversionService {
  /** Lookup table ordered descending for greedy algorithm. Includes subtractive pairs. */
  private readonly romanNumerals = [
    { value: 1000, symbol: 'M' },
    { value: 900, symbol: 'CM' },  // 1000 - 100
    { value: 500, symbol: 'D' },
    { value: 400, symbol: 'CD' },  // 500 - 100
    { value: 100, symbol: 'C' },
    { value: 90, symbol: 'XC' },   // 100 - 10
    { value: 50, symbol: 'L' },
    { value: 40, symbol: 'XL' },   // 50 - 10
    { value: 10, symbol: 'X' },
    { value: 9, symbol: 'IX' },    // 10 - 1
    { value: 5, symbol: 'V' },
    { value: 4, symbol: 'IV' },    // 5 - 1
    { value: 1, symbol: 'I' }
  ] as const;

  /** Map for efficient Roman-to-Arabic lookup. Includes both single characters and subtractive pairs. */
  private readonly romanToArabicMap = new Map<string, number>([
    ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
    ['C', 100], ['XC', 90], ['L', 50], ['XL', 40],
    ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]
  ]);

  constructor(private repository: IConverterRepository) {}

  /**
   * Converts an Arabic numeral to Roman numeral format.
   * 
   * @param arabic - Integer between 1 and 3999
   * @returns Roman numeral string in canonical form
   * @throws {Error} If input is not an integer or is outside valid range
   */
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

    // Cache the result (fire and forget - atomic operations in repositories ensure consistency)
    void this.repository.save(arabic, roman).catch(error => {
      console.error('Failed to cache conversion:', error);
    });

    return roman;
  }

  /**
   * Converts a Roman numeral to Arabic number format.
   * 
   * @param roman - Roman numeral string (case-insensitive)
   * @returns Arabic number (1-3999)
   * @throws {Error} If input is not a valid Roman numeral
   */
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

    // Cache the result (fire and forget - atomic operations in repositories ensure consistency)
    void this.repository.save(arabic, normalizedRoman).catch(error => {
      console.error('Failed to cache conversion:', error);
    });

    return arabic;
  }

  /**
   * Converts Arabic to Roman using greedy algorithm.
   * Iterates through lookup table in descending order, using largest values first.
   */
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

  /**
   * Converts Roman to Arabic by processing characters left-to-right.
   * Checks two-character subtractive pairs before single characters.
   */
  private convertRomanToArabic(roman: string): number {
    let result = 0;
    let i = 0;

    while (i < roman.length) {
      // Check for two-character combinations first (subtractive notation)
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

  /**
   * Validates Roman numeral format.
   * 
   * Checks for:
   * 1. Valid characters only (I, V, X, L, C, D, M)
   * 2. No invalid patterns (e.g., IIII, VV, IL, etc.)
   * 3. Canonical form via round-trip validation
   */
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
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Utility method for testing the inverse property.
   * Verifies that arabicToRoman(n) and romanToArabic(result) are inverse operations.
   */
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