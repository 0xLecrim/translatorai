"use client";

import { useState } from 'react';
import { useTranslationHistory } from '../hooks/useTranslationHistory';

interface Translation {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  timestamp: string;
  userId?: string;
}

interface TranslationHistoryProps {
  userId?: string;
  onSelectTranslation?: (translation: Translation) => void;
}

export default function TranslationHistory({ userId, onSelectTranslation }: TranslationHistoryProps) {
  const { history, isLoading, error, deleteTranslation, clearHistory } = useTranslationHistory(userId);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć to tłumaczenie?')) {
      await deleteTranslation(id);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Czy na pewno chcesz usunąć całą historię tłumaczeń?')) {
      clearHistory();
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Ładowanie historii...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Historia tłumaczeń
        </h2>
        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
          >
            Wyczyść wszystko
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {history.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">
            Brak historii tłumaczeń
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Twoje tłumaczenia będą się tutaj pojawiać
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {history.map((translation) => (
            <div
              key={translation.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">
                      {translation.sourceLanguage}
                    </span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded">
                      {translation.targetLanguage}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(translation.timestamp)}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Oryginalny tekst:</p>
                      <p className="text-gray-900 dark:text-white text-sm">
                        {expandedItems.has(translation.id) 
                          ? translation.originalText 
                          : truncateText(translation.originalText)
                        }
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tłumaczenie:</p>
                      <p className="text-gray-900 dark:text-white text-sm">
                        {expandedItems.has(translation.id) 
                          ? translation.translatedText 
                          : truncateText(translation.translatedText)
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {(translation.originalText.length > 100 || translation.translatedText.length > 100) && (
                    <button
                      onClick={() => toggleExpanded(translation.id)}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs"
                    >
                      {expandedItems.has(translation.id) ? 'Zwiń' : 'Rozwiń'}
                    </button>
                  )}
                  
                  {onSelectTranslation && (
                    <button
                      onClick={() => onSelectTranslation(translation)}
                      className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                      title="Użyj ponownie"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDelete(translation.id)}
                    className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                    title="Usuń"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
