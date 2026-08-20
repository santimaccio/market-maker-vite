import { STORAGE_KEY } from '../data.js';

// Storage abstraction layer for game state persistence
export const storage = {
  // Read entire game state from localStorage
  read() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },

  // Write entire game state to localStorage
  write(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },

  // Clear all game state from localStorage
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};
