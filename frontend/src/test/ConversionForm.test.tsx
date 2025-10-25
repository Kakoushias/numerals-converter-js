import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConversionForm } from '../components/ConversionForm';
import { api } from '../services/api';

// Mock the API
jest.mock('../services/api');
const mockApi = api as jest.Mocked<typeof api>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('ConversionForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('[]');
  });

  it('renders both conversion forms', () => {
    render(<ConversionForm />);
    
    expect(screen.getByText('Arabic to Roman')).toBeInTheDocument();
    expect(screen.getByText('Roman to Arabic')).toBeInTheDocument();
  });

  it('validates Arabic input correctly', async () => {
    const user = userEvent.setup();
    render(<ConversionForm />);
    
    const arabicInput = screen.getByLabelText(/Arabic Number/);
    const submitButton = screen.getByText('Convert to Roman');
    
    // Test invalid input
    await user.type(arabicInput, '0');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Number must be greater than 0')).toBeInTheDocument();
    });
    
    // Test valid input
    await user.clear(arabicInput);
    await user.type(arabicInput, '2023');
    
    mockApi.convertArabicToRoman.mockResolvedValue({
      inputValue: 2023,
      convertedValue: 'MMXXIII'
    });
    
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockApi.convertArabicToRoman).toHaveBeenCalledWith(2023);
    });
  });

  it('validates Roman input correctly', async () => {
    const user = userEvent.setup();
    render(<ConversionForm />);
    
    const romanInput = screen.getByLabelText(/Roman Numeral/);
    const submitButton = screen.getByText('Convert to Arabic');
    
    // Test invalid input
    await user.type(romanInput, 'IIII');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Cannot have more than 3 consecutive I\'s')).toBeInTheDocument();
    });
    
    // Test valid input
    await user.clear(romanInput);
    await user.type(romanInput, 'MMXXIII');
    
    mockApi.convertRomanToArabic.mockResolvedValue({
      inputValue: 'MMXXIII',
      convertedValue: 2023
    });
    
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockApi.convertRomanToArabic).toHaveBeenCalledWith('MMXXIII');
    });
  });

  it('shows loading state during conversion', async () => {
    const user = userEvent.setup();
    render(<ConversionForm />);
    
    const arabicInput = screen.getByLabelText(/Arabic Number/);
    const submitButton = screen.getByText('Convert to Roman');
    
    await user.type(arabicInput, '2023');
    
    // Mock a delayed response
    mockApi.convertArabicToRoman.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        inputValue: 2023,
        convertedValue: 'MMXXIII'
      }), 100))
    );
    
    await user.click(submitButton);
    
    expect(screen.getByText('Converting...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Converting...')).not.toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup();
    render(<ConversionForm />);
    
    const arabicInput = screen.getByLabelText(/Arabic Number/);
    const submitButton = screen.getByText('Convert to Roman');
    
    await user.type(arabicInput, '2023');
    
    mockApi.convertArabicToRoman.mockRejectedValue(new Error('API Error'));
    
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });
});
