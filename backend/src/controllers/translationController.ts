import { Request, Response } from 'express';

const SUPPORTED_LANGUAGES = ['pt', 'en', 'es'];

function normalizeLanguage(language?: string) {
  if (!language || typeof language !== 'string') {
    return null;
  }

  const normalized = language.trim().toLowerCase();

  if (!SUPPORTED_LANGUAGES.includes(normalized)) {
    return null;
  }

  return normalized;
}

export async function translateText(req: Request, res: Response) {
  try {
    const { text, source = 'pt', target = 'en' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        message: 'Texto para tradução é obrigatório.',
      });
    }

    const trimmedText = text.trim();

    if (!trimmedText) {
      return res.status(400).json({
        message: 'Texto para tradução é obrigatório.',
      });
    }

    if (trimmedText.length > 1000) {
      return res.status(400).json({
        message: 'O texto deve ter no máximo 1000 caracteres.',
      });
    }

    const sourceLanguage = normalizeLanguage(source);
    const targetLanguage = normalizeLanguage(target);

    if (!sourceLanguage || !targetLanguage) {
      return res.status(400).json({
        message: 'Idioma inválido.',
        supportedLanguages: SUPPORTED_LANGUAGES,
      });
    }

    if (sourceLanguage === targetLanguage) {
      return res.json({
        originalText: trimmedText,
        translatedText: trimmedText,
        source: sourceLanguage,
        target: targetLanguage,
        provider: 'LibreTranslate',
      });
    }

    const baseUrl = process.env.LIBRETRANSLATE_URL || 'http://localhost:5000';
    const apiKey = process.env.LIBRETRANSLATE_API_KEY;

    const body: Record<string, string> = {
      q: trimmedText,
      source: sourceLanguage,
      target: targetLanguage,
      format: 'text',
    };

    if (apiKey) {
      body.api_key = apiKey;
    }

    const response = await fetch(`${baseUrl}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return res.status(502).json({
        message: 'Erro ao consultar o LibreTranslate.',
        details: data,
      });
    }

    if (!data?.translatedText) {
      return res.status(502).json({
        message: 'A API de tradução não retornou uma tradução válida.',
      });
    }

    return res.json({
      originalText: trimmedText,
      translatedText: data.translatedText,
      source: sourceLanguage,
      target: targetLanguage,
      provider: 'LibreTranslate',
    });
  } catch (error) {
    console.error('Erro ao traduzir texto:', error);

    return res.status(500).json({
      message: 'Erro interno ao traduzir texto.',
    });
  }
}