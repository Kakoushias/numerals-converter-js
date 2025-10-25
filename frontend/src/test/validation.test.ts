import { validateArabicNumber, validateRomanNumeral } from '../utils/validation';

describe('validateArabicNumber', () => {
  it('should accept valid numbers', () => {
    expect(validateArabicNumber('1')).toEqual({ isValid: true });
    expect(validateArabicNumber('1213')).toEqual({ isValid: true });
    expect(validateArabicNumber('3999')).toEqual({ isValid: true });
  });

  it('should reject empty input', () => {
    expect(validateArabicNumber('')).toEqual({
      isValid: false,
      error: 'Please enter a number'
    });
    expect(validateArabicNumber('   ')).toEqual({
      isValid: false,
      error: 'Please enter a number'
    });
  });

  it('should reject numbers with letters', () => {
    expect(validateArabicNumber('1213asdv')).toEqual({
      isValid: false,
      error: 'Please enter only digits (no letters, spaces, or decimals)'
    });
    expect(validateArabicNumber('abc123')).toEqual({
      isValid: false,
      error: 'Please enter only digits (no letters, spaces, or decimals)'
    });
    expect(validateArabicNumber('12a34')).toEqual({
      isValid: false,
      error: 'Please enter only digits (no letters, spaces, or decimals)'
    });
  });

  it('should reject decimals', () => {
    expect(validateArabicNumber('123.456')).toEqual({
      isValid: false,
      error: 'Please enter only digits (no letters, spaces, or decimals)'
    });
    expect(validateArabicNumber('12.34')).toEqual({
      isValid: false,
      error: 'Please enter only digits (no letters, spaces, or decimals)'
    });
  });

  it('should reject numbers with spaces', () => {
    expect(validateArabicNumber('12 34')).toEqual({
      isValid: false,
      error: 'Please enter only digits (no letters, spaces, or decimals)'
    });
    expect(validateArabicNumber(' 123 ')).toEqual({
      isValid: false,
      error: 'Please enter only digits (no letters, spaces, or decimals)'
    });
  });

  it('should reject numbers outside valid range', () => {
    expect(validateArabicNumber('0')).toEqual({
      isValid: false,
      error: 'Number must be greater than 0'
    });
    expect(validateArabicNumber('-1')).toEqual({
      isValid: false,
      error: 'Please enter only digits (no letters, spaces, or decimals)'
    });
    expect(validateArabicNumber('4000')).toEqual({
      isValid: false,
      error: 'Number must be less than or equal to 3999'
    });
  });

  it('should reject special characters', () => {
    expect(validateArabicNumber('123!')).toEqual({
      isValid: false,
      error: 'Please enter only digits (no letters, spaces, or decimals)'
    });
    expect(validateArabicNumber('12@34')).toEqual({
      isValid: false,
      error: 'Please enter only digits (no letters, spaces, or decimals)'
    });
  });
});

describe('validateRomanNumeral', () => {
  it('should accept valid Roman numerals', () => {
    expect(validateRomanNumeral('I')).toEqual({ isValid: true });
    expect(validateRomanNumeral('IV')).toEqual({ isValid: true });
    expect(validateRomanNumeral('IX')).toEqual({ isValid: true });
    expect(validateRomanNumeral('MMXXIII')).toEqual({ isValid: true });
    expect(validateRomanNumeral('MMMCMXCIX')).toEqual({ isValid: true });
  });

  it('should accept lowercase Roman numerals', () => {
    expect(validateRomanNumeral('i')).toEqual({ isValid: true });
    expect(validateRomanNumeral('iv')).toEqual({ isValid: true });
    expect(validateRomanNumeral('mmxxiii')).toEqual({ isValid: true });
  });

  it('should reject empty input', () => {
    expect(validateRomanNumeral('')).toEqual({
      isValid: false,
      error: 'Please enter a Roman numeral'
    });
    expect(validateRomanNumeral('   ')).toEqual({
      isValid: false,
      error: 'Please enter a Roman numeral'
    });
  });

  it('should reject invalid characters', () => {
    expect(validateRomanNumeral('ABC')).toEqual({
      isValid: false,
      error: 'Roman numeral can only contain I, V, X, L, C, D, M'
    });
    expect(validateRomanNumeral('IVX123')).toEqual({
      isValid: false,
      error: 'Roman numeral can only contain I, V, X, L, C, D, M'
    });
    expect(validateRomanNumeral('IV@X')).toEqual({
      isValid: false,
      error: 'Roman numeral can only contain I, V, X, L, C, D, M'
    });
  });

  it('should reject too many consecutive characters', () => {
    expect(validateRomanNumeral('IIII')).toEqual({
      isValid: false,
      error: "Cannot have more than 3 consecutive I's"
    });
    expect(validateRomanNumeral('XXXX')).toEqual({
      isValid: false,
      error: "Cannot have more than 3 consecutive X's"
    });
    expect(validateRomanNumeral('CCCC')).toEqual({
      isValid: false,
      error: "Cannot have more than 3 consecutive C's"
    });
    expect(validateRomanNumeral('MMMM')).toEqual({
      isValid: false,
      error: "Cannot have more than 3 consecutive M's"
    });
  });

  it('should reject multiple V, L, or D', () => {
    expect(validateRomanNumeral('VV')).toEqual({
      isValid: false,
      error: 'Cannot have more than 1 V'
    });
    expect(validateRomanNumeral('LL')).toEqual({
      isValid: false,
      error: 'Cannot have more than 1 L'
    });
    expect(validateRomanNumeral('DD')).toEqual({
      isValid: false,
      error: 'Cannot have more than 1 D'
    });
  });

  it('should reject invalid combinations', () => {
    expect(validateRomanNumeral('IL')).toEqual({
      isValid: false,
      error: 'Invalid combination: IL'
    });
    expect(validateRomanNumeral('IC')).toEqual({
      isValid: false,
      error: 'Invalid combination: IC'
    });
    expect(validateRomanNumeral('ID')).toEqual({
      isValid: false,
      error: 'Invalid combination: ID'
    });
    expect(validateRomanNumeral('IM')).toEqual({
      isValid: false,
      error: 'Invalid combination: IM'
    });
    expect(validateRomanNumeral('XD')).toEqual({
      isValid: false,
      error: 'Invalid combination: XD'
    });
    expect(validateRomanNumeral('XM')).toEqual({
      isValid: false,
      error: 'Invalid combination: XM'
    });
    expect(validateRomanNumeral('VL')).toEqual({
      isValid: false,
      error: 'Invalid combination: VL'
    });
    expect(validateRomanNumeral('VC')).toEqual({
      isValid: false,
      error: 'Invalid combination: VC'
    });
    expect(validateRomanNumeral('VD')).toEqual({
      isValid: false,
      error: 'Invalid combination: VD'
    });
    expect(validateRomanNumeral('VM')).toEqual({
      isValid: false,
      error: 'Invalid combination: VM'
    });
    expect(validateRomanNumeral('LC')).toEqual({
      isValid: false,
      error: 'Invalid combination: LC'
    });
    expect(validateRomanNumeral('LD')).toEqual({
      isValid: false,
      error: 'Invalid combination: LD'
    });
    expect(validateRomanNumeral('LM')).toEqual({
      isValid: false,
      error: 'Invalid combination: LM'
    });
    expect(validateRomanNumeral('DM')).toEqual({
      isValid: false,
      error: 'Invalid combination: DM'
    });
  });
});
