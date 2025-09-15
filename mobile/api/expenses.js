import axios from 'axios';
import { API_BASE_URL, getHeaders } from './config';

const expensesAPI = axios.create({
  baseURL: `${API_BASE_URL}/expenses`,
});

// Request interceptor to add auth token
expensesAPI.interceptors.request.use(
  async (config) => {
    const headers = await getHeaders();
    config.headers = { ...config.headers, ...headers };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const expensesService = {
  // Get expenses for a trip
  getExpensesByTrip: async (tripId, params = {}) => {
    try {
      const response = await expensesAPI.get(`/trip/${tripId}`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch expenses' };
    }
  },

  // Get single expense
  getExpense: async (expenseId) => {
    try {
      const response = await expensesAPI.get(`/${expenseId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch expense' };
    }
  },

  // Add expense to trip
  addExpense: async (expenseData) => {
    try {
      const response = await expensesAPI.post('/', expenseData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add expense' };
    }
  },

  // Update expense
  updateExpense: async (expenseId, expenseData) => {
    try {
      const response = await expensesAPI.put(`/${expenseId}`, expenseData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update expense' };
    }
  },

  // Delete expense
  deleteExpense: async (expenseId) => {
    try {
      const response = await expensesAPI.delete(`/${expenseId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete expense' };
    }
  },

  // Get expense summary for trip
  getExpenseSummary: async (tripId) => {
    try {
      const response = await expensesAPI.get(`/trip/${tripId}/summary`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch expense summary' };
    }
  }
};
