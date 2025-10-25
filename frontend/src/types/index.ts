export interface Conversion {
  arabic: number;
  roman: string;
}

export interface ConversionResponse {
  inputValue: string | number;
  convertedValue: string | number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface DeleteResponse {
  deleted: number;
}

export interface ApiError {
  error: string;
}

export type ConversionType = 'arabic-to-roman' | 'roman-to-arabic';
