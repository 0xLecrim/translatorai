import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory storage for demonstration
// In production, this would be replaced with a proper database
let translationHistory: Array<{
  id: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  timestamp: string;
  userId?: string;
}> = [];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // Filter by userId if provided (for authenticated users)
    const filteredHistory = userId 
      ? translationHistory.filter(item => item.userId === userId)
      : translationHistory.slice(-10); // Return last 10 for anonymous users
    
    return NextResponse.json({ 
      history: filteredHistory.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    });
  } catch (error) {
    console.error('Error fetching translation history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch translation history' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      originalText, 
      translatedText, 
      sourceLanguage, 
      targetLanguage, 
      userId 
    } = await request.json();

    // Validate input
    if (!originalText || !translatedText || !sourceLanguage || !targetLanguage) {
      return NextResponse.json(
        { error: 'All translation fields are required' },
        { status: 400 }
      );
    }

    const newTranslation = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      originalText,
      translatedText,
      sourceLanguage,
      targetLanguage,
      timestamp: new Date().toISOString(),
      userId: userId || undefined
    };

    translationHistory.push(newTranslation);

    // Keep only last 100 translations to prevent memory issues
    if (translationHistory.length > 100) {
      translationHistory = translationHistory.slice(-100);
    }

    return NextResponse.json({ 
      success: true, 
      translation: newTranslation 
    });
  } catch (error) {
    console.error('Error saving translation:', error);
    return NextResponse.json(
      { error: 'Failed to save translation' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const translationId = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!translationId) {
      return NextResponse.json(
        { error: 'Translation ID is required' },
        { status: 400 }
      );
    }

    // Find and remove the translation
    const initialLength = translationHistory.length;
    translationHistory = translationHistory.filter(item => {
      if (item.id === translationId) {
        // If userId is provided, only delete if it matches
        return userId ? item.userId !== userId : false;
      }
      return true;
    });

    if (translationHistory.length === initialLength) {
      return NextResponse.json(
        { error: 'Translation not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting translation:', error);
    return NextResponse.json(
      { error: 'Failed to delete translation' },
      { status: 500 }
    );
  }
}
