import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
// You'll need to set OPENAI_API_KEY in your environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { text, targetLanguage } = await request.json();

    // Validate input
    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Text and target language are required' },
        { status: 400 }
      );
    }

    // First detect the language
    const detectionResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are a language detection specialist. Your task is to identify the language of the provided text. Only respond with the language name in English, nothing else."
        },
        { 
          role: "user", 
          content: `What language is this text written in: "${text}"`
        }
      ],
      temperature: 0.1,
      max_tokens: 50
    });

    const detectedLanguage = detectionResponse.choices[0]?.message?.content?.trim() || 'Unknown';

    // Then perform the translation
    const translationResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: `You are a professional translator. Translate the following text from ${detectedLanguage} to ${targetLanguage}. Only respond with the translated text, no explanations or additional comments.`
        },
        { 
          role: "user", 
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    const translatedText = translationResponse.choices[0]?.message?.content?.trim() || '';

    // Return both the detected language and the translation
    return NextResponse.json({ 
      sourceLanguage: detectedLanguage,
      translatedText
    });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'An error occurred during translation' },
      { status: 500 }
    );
  }
}
