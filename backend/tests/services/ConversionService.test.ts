import { ConversionService } from '../../src/services/ConversionService';
import { IConverterRepository } from '../../src/repositories/IConverterRepository';

// Mock repository
const mockRepository: jest.Mocked<IConverterRepository> = {
  save: jest.fn().mockResolvedValue(undefined),
  findByArabic: jest.fn(),
  findByRoman: jest.fn(),
  getAll: jest.fn(),
  deleteAll: jest.fn(),
  isHealthy: jest.fn()
};

describe('ConversionService', () => {
  let service: ConversionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ConversionService(mockRepository);
  });

  describe('arabicToRoman', () => {
    it('should convert valid Arabic numbers to Roman numerals', async () => {
      mockRepository.findByArabic.mockResolvedValue(null);

      const testCases = [
        { arabic: 1, roman: 'I' },
        { arabic: 4, roman: 'IV' },
        { arabic: 9, roman: 'IX' },
        { arabic: 40, roman: 'XL' },
        { arabic: 90, roman: 'XC' },
        { arabic: 400, roman: 'CD' },
        { arabic: 900, roman: 'CM' },
        { arabic: 3999, roman: 'MMMCMXCIX' },
        { arabic: 2023, roman: 'MMXXIII' },
        { arabic: 123, roman: 'CXXIII' }
      ];

      for (const testCase of testCases) {
        const result = await service.arabicToRoman(testCase.arabic);
        expect(result).toBe(testCase.roman);
      }
    });

    it('should return cached result if available', async () => {
      const cachedRoman = 'MMXXIII';
      mockRepository.findByArabic.mockResolvedValue(cachedRoman);

      const result = await service.arabicToRoman(2023);
      expect(result).toBe(cachedRoman);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error for invalid Arabic numbers', async () => {
      const invalidNumbers = [0, -1, 4000, 1.5, NaN];

      for (const num of invalidNumbers) {
        await expect(service.arabicToRoman(num)).rejects.toThrow();
      }
    });

    it('should cache the result after conversion', async () => {
      mockRepository.findByArabic.mockResolvedValue(null);

      await service.arabicToRoman(2023);
      
      // Wait for async cache operation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockRepository.save).toHaveBeenCalledWith(2023, 'MMXXIII');
    });
  });

  describe('romanToArabic', () => {
    it('should convert valid Roman numerals to Arabic numbers', async () => {
      mockRepository.findByRoman.mockResolvedValue(null);

      const testCases = [
        { roman: 'I', arabic: 1 },
        { roman: 'IV', arabic: 4 },
        { roman: 'IX', arabic: 9 },
        { roman: 'XL', arabic: 40 },
        { roman: 'XC', arabic: 90 },
        { roman: 'CD', arabic: 400 },
        { roman: 'CM', arabic: 900 },
        { roman: 'MMMCMXCIX', arabic: 3999 },
        { roman: 'MMXXIII', arabic: 2023 },
        { roman: 'CXXIII', arabic: 123 }
      ];

      for (const testCase of testCases) {
        const result = await service.romanToArabic(testCase.roman);
        expect(result).toBe(testCase.arabic);
      }
    });

    it('should handle case insensitive input', async () => {
      mockRepository.findByRoman.mockResolvedValue(null);

      const result = await service.romanToArabic('mmxxiii');
      expect(result).toBe(2023);
    });

    it('should return cached result if available', async () => {
      const cachedArabic = 2023;
      mockRepository.findByRoman.mockResolvedValue(cachedArabic);

      const result = await service.romanToArabic('MMXXIII');
      expect(result).toBe(cachedArabic);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error for invalid Roman numerals', async () => {
      const invalidRomans = [
        'IIII', // More than 3 consecutive I's
        'VV',   // More than 1 V
        'IL',   // Invalid combination
        'IC',   // Invalid combination
        'ABC',  // Invalid characters
        '',     // Empty string
        'IIV'   // Invalid pattern
      ];

      for (const roman of invalidRomans) {
        await expect(service.romanToArabic(roman)).rejects.toThrow();
      }
    });

    it('should cache the result after conversion', async () => {
      mockRepository.findByRoman.mockResolvedValue(null);

      await service.romanToArabic('MMXXIII');
      
      // Wait for async cache operation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockRepository.save).toHaveBeenCalledWith(2023, 'MMXXIII');
    });
  });

  describe('testInverseProperty', () => {
    it('should return true for valid inverse conversions', async () => {
      mockRepository.findByArabic.mockResolvedValue(null);
      mockRepository.findByRoman.mockResolvedValue(null);

      const testNumbers = [1, 4, 9, 40, 90, 400, 900, 3999, 2023, 123];

      for (const num of testNumbers) {
        const result = await service.testInverseProperty(num);
        expect(result).toBe(true);
      }
    });

    it('should return false for invalid conversions', async () => {
      mockRepository.findByArabic.mockRejectedValue(new Error('Invalid'));

      const result = await service.testInverseProperty(0);
      expect(result).toBe(false);
    });
  });
});
