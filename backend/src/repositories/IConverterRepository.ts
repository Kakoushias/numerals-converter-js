import { Conversion, PaginatedResult } from '../types';

export interface IConverterRepository {
  save(arabic: number, roman: string): Promise<void>;
  findByArabic(arabic: number): Promise<string | null>;
  findByRoman(roman: string): Promise<number | null>;
  getAll(limit: number, offset: number): Promise<PaginatedResult<Conversion>>;
  deleteAll(): Promise<number>;
  isHealthy(): Promise<boolean>;
}
