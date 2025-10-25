import { ConversionResponse, PaginatedResult, Conversion, DeleteResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: { error: string } = await response.json();
    throw new ApiError(response.status, error.error || 'An error occurred');
  }
  return response.json();
}

export const api = {
  async convertArabicToRoman(arabic: number): Promise<ConversionResponse> {
    const response = await fetch(`${API_BASE_URL}/roman/${arabic}`);
    return handleResponse<ConversionResponse>(response);
  },

  async convertRomanToArabic(roman: string): Promise<ConversionResponse> {
    const response = await fetch(`${API_BASE_URL}/arabic/${roman}`);
    return handleResponse<ConversionResponse>(response);
  },

  async getAllConversions(limit = 100, offset = 0): Promise<PaginatedResult<Conversion>> {
    const response = await fetch(`${API_BASE_URL}/all?limit=${limit}&offset=${offset}`);
    return handleResponse<PaginatedResult<Conversion>>(response);
  },

  async deleteAllConversions(): Promise<DeleteResponse> {
    const response = await fetch(`${API_BASE_URL}/remove`, {
      method: 'DELETE',
    });
    return handleResponse<DeleteResponse>(response);
  },

  async healthCheck(): Promise<{ status: string; database: string; timestamp: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    return handleResponse(response);
  },
};

export { ApiError };
