"use client";

import { useState, useEffect } from 'react';

interface Translation {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  timestamp: string;
  userId?: string;
}

export function useTranslationHistory(userId?: string) {
  const [history, setHistory] = useState<Translation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load history from server
  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = userId ? `/api/history?userId=${userId}` : '/api/history';
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      } else {
        setError('Nie udało się załadować historii tłumaczeń');
      }
    } catch (err) {
      setError('Błąd połączenia z serwerem');
      console.error('Error loading history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Save translation to history
  const saveTranslation = async (translation: Omit<Translation, 'id' | 'timestamp'>) => {
    try {
      const response = await fetch('/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...translation,
          userId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(prev => [data.translation, ...prev]);
        return true;
      } else {
        console.error('Failed to save translation');
        return false;
      }
    } catch (err) {
      console.error('Error saving translation:', err);
      return false;
    }
  };

  // Delete translation from history
  const deleteTranslation = async (translationId: string) => {
    try {
      const url = userId 
        ? `/api/history?id=${translationId}&userId=${userId}`
        : `/api/history?id=${translationId}`;
        
      const response = await fetch(url, {
        method: 'DELETE',
      });

      if (response.ok) {
        setHistory(prev => prev.filter(t => t.id !== translationId));
        return true;
      } else {
        setError('Nie udało się usunąć tłumaczenia');
        return false;
      }
    } catch (err) {
      setError('Błąd podczas usuwania tłumaczenia');
      console.error('Error deleting translation:', err);
      return false;
    }
  };

  // Clear all history (for current user or anonymous)
  const clearHistory = () => {
    setHistory([]);
  };

  // Load history on mount and when userId changes
  useEffect(() => {
    loadHistory();
  }, [userId]);

  return {
    history,
    isLoading,
    error,
    loadHistory,
    saveTranslation,
    deleteTranslation,
    clearHistory
  };
}
