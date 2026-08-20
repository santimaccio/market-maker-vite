// ====================== STORAGE LAYER ======================
// Adaptado del script.js original, ahora con soporte para módulos ES.

import { STORAGE_KEY } from '../data.js';

export const storage = {
  read() {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  },

  write(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('No se pudo guardar el estado:', error);
    }
  },

  remove() {
    localStorage.removeItem(STORAGE_KEY);
  }
};
