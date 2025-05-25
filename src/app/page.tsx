"use client";

import { useState } from "react";
import { useAuthState } from "../hooks/useAuth";
import { useTranslationHistory } from "../hooks/useTranslationHistory";
import AuthModal from "../components/AuthModal";
import TranslationHistory from "../components/TranslationHistory";

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Authentication and history hooks
  const { user, logout } = useAuthState();
  const { saveTranslation } = useTranslationHistory(user?.id);

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "pt", name: "Portuguese" },
    { code: "ru", name: "Russian" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "zh", name: "Chinese" },
    { code: "ar", name: "Arabic" },
    { code: "hi", name: "Hindi" },
    { code: "pl", name: "Polish" },
  ];

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      setError("Proszę wprowadzić tekst do tłumaczenia");
      return;
    }

    setIsTranslating(true);
    setError("");
    
    try {
      // Call the OpenAI translation API endpoint
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          targetLanguage: languages.find(l => l.code === targetLanguage)?.name || 'English',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Błąd podczas tłumaczenia');
      }
      
      const data = await response.json();
      setTranslatedText(data.translatedText);
      setDetectedLanguage(data.sourceLanguage);

      // Save translation to history
      if (data.translatedText && data.sourceLanguage) {
        await saveTranslation({
          originalText: inputText,
          translatedText: data.translatedText,
          sourceLanguage: data.sourceLanguage,
          targetLanguage: languages.find(l => l.code === targetLanguage)?.name || 'English'
        });
      }
    } catch (err) {
      console.error('Translation error:', err);
      setError("Wystąpił błąd podczas tłumaczenia. Spróbuj ponownie.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = async () => {
    if (translatedText) {
      try {
        await navigator.clipboard.writeText(translatedText);
        // TODO: Dodać toast notification
        alert("Tekst skopiowany do schowka!");
      } catch (err) {
        setError("Nie udało się skopiować tekstu");
      }
    }
  };

  const handleSave = () => {
    if (translatedText) {
      const blob = new Blob([translatedText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `translation_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const clearAll = () => {
    setInputText("");
    setTranslatedText("");
    setDetectedLanguage("");
    setError("");
  };

  const handleSelectTranslation = (translation: any) => {
    setInputText(translation.originalText);
    setTranslatedText(translation.translatedText);
    setDetectedLanguage(translation.sourceLanguage);
    const targetLang = languages.find(l => l.name === translation.targetLanguage);
    if (targetLang) {
      setTargetLanguage(targetLang.code);
    }
    setShowHistory(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Translator</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden sm:inline">Historia</span>
              </button>
              {user ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Witaj, {user.username}!
                  </span>
                  <button
                    onClick={logout}
                    className="px-3 py-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                  >
                    Wyloguj
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                >
                  Zaloguj się
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* History Section */}
        {showHistory && (
          <div className="mb-8">
            <TranslationHistory 
              userId={user?.id} 
              onSelectTranslation={handleSelectTranslation}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Tekst do tłumaczenia
              </h2>
              <button
                onClick={clearAll}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                Wyczyść
              </button>
            </div>
            
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Wprowadź tekst, który chcesz przetłumaczyć..."
              className="w-full h-48 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              maxLength={5000}
            />
            
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{inputText.length}/5000 znaków</span>
            </div>

            {/* Language Selection */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Język docelowy
              </label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Translate Button */}
            <button
              onClick={handleTranslate}
              disabled={!inputText.trim() || isTranslating}
              className="w-full mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isTranslating ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Tłumaczenie...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 716.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  <span>Przetłumacz</span>
                </>
              )}
            </button>
          </div>

          {/* Output Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Przetłumaczony tekst
              </h2>
              {translatedText && (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCopy}
                    className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                    title="Skopiuj"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={handleSave}
                    className="p-2 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors"
                    title="Zapisz"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div className="h-48 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 overflow-y-auto">
              {translatedText ? (
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                  {translatedText}
                </p>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">
                  Przetłumaczony tekst pojawi się tutaj...
                </p>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Translation Info */}
            {translatedText && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-blue-700 dark:text-blue-400 text-sm mb-1">
                  Wykryty język: {detectedLanguage}
                </p>
                <p className="text-blue-700 dark:text-blue-400 text-sm">
                  Przetłumaczono na: {languages.find(l => l.code === targetLanguage)?.name}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Features Info */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center shadow-sm">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Szybkie tłumaczenie</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Natychmiastowe tłumaczenie tekstu przy użyciu zaawansowanych modeli AI</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center shadow-sm">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 716.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Historia tłumaczeń</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Zapisywanie i przeglądanie wcześniejszych tłumaczeń dla zalogowanych użytkowników</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center shadow-sm">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Konta użytkowników</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Opcjonalna rejestracja i logowanie dla dodatkowych funkcji</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              © 2025 AI Translator. Projekt zespołowy - Bartłomiej Winiarek, Marceli Jaremko, Kuba Płatos
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          // Optionally show a success message
        }}
      />
    </div>
  );
}
