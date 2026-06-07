import { Request, Response } from 'express';

const SUPPORTED_LANGUAGES = ['pt', 'en', 'es'] as const;

type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

function normalizeLanguage(language?: string): SupportedLanguage | null {
  if (!language || typeof language !== 'string') {
    return null;
  }

  const normalized = language.trim().toLowerCase();

  if (!SUPPORTED_LANGUAGES.includes(normalized as SupportedLanguage)) {
    return null;
  }

  return normalized as SupportedLanguage;
}

function getLibreTranslateBaseUrl() {
  return (process.env.LIBRETRANSLATE_URL || 'http://localhost:5000').replace(
    /\/+$/,
    ''
  );
}

const FALLBACK_TRANSLATIONS: Record<
  string,
  Partial<Record<SupportedLanguage, string>>
> = {
  'onde fica o banheiro?': {
    pt: 'Onde fica o banheiro?',
    en: 'Where is the bathroom?',
    es: '¿Dónde está el baño?',
  },
  'quanto custa?': {
    pt: 'Quanto custa?',
    en: 'How much does it cost?',
    es: '¿Cuánto cuesta?',
  },
  'preciso de ajuda.': {
    pt: 'Preciso de ajuda.',
    en: 'I need help.',
    es: 'Necesito ayuda.',
  },
  'você fala inglês?': {
    pt: 'Você fala inglês?',
    en: 'Do you speak English?',
    es: '¿Hablas inglés?',
  },
  'onde fica a estação mais próxima?': {
    pt: 'Onde fica a estação mais próxima?',
    en: 'Where is the nearest station?',
    es: '¿Dónde está la estación más cercana?',
  },
  'pode me ajudar?': {
    pt: 'Pode me ajudar?',
    en: 'Can you help me?',
    es: '¿Puedes ayudarme?',
  },
  'estou perdido.': {
    pt: 'Estou perdido.',
    en: 'I am lost.',
    es: 'Estoy perdido.',
  },
  'chame a polícia.': {
    pt: 'Chame a polícia.',
    en: 'Call the police.',
    es: 'Llame a la policía.',
  },
  'chame uma ambulância.': {
    pt: 'Chame uma ambulância.',
    en: 'Call an ambulance.',
    es: 'Llame a una ambulancia.',
  },
  'obrigado.': {
    pt: 'Obrigado.',
    en: 'Thank you.',
    es: 'Gracias.',
  },
};

function normalizeFallbackKey(text: string) {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function findFallbackTranslation(text: string, target: SupportedLanguage) {
  const normalizedText = normalizeFallbackKey(text);

  const entry = Object.entries(FALLBACK_TRANSLATIONS).find(([key]) => {
    return normalizeFallbackKey(key) === normalizedText;
  });

  return entry?.[1]?.[target] || null;
}

async function readResponseBody(response: globalThis.Response) {
  const raw = await response.text();

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return {
      raw,
    };
  }
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
        provider: 'same-language',
      });
    }

    const baseUrl = getLibreTranslateBaseUrl();
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

    const data = await readResponseBody(response);

    if (!response.ok) {
      const fallback = findFallbackTranslation(trimmedText, targetLanguage);

      if (fallback) {
        return res.json({
          originalText: trimmedText,
          translatedText: fallback,
          source: sourceLanguage,
          target: targetLanguage,
          provider: 'fallback',
          warning: 'LibreTranslate indisponível. Tradução local utilizada.',
        });
      }

      return res.status(502).json({
        message: 'Erro ao consultar o LibreTranslate.',
        details: data,
      });
    }

    if (!data?.translatedText) {
      const fallback = findFallbackTranslation(trimmedText, targetLanguage);

      if (fallback) {
        return res.json({
          originalText: trimmedText,
          translatedText: fallback,
          source: sourceLanguage,
          target: targetLanguage,
          provider: 'fallback',
          warning: 'LibreTranslate não retornou tradução válida.',
        });
      }

      return res.status(502).json({
        message: 'A API de tradução não retornou uma tradução válida.',
        details: data,
      });
    }

    return res.json({
      originalText: trimmedText,
      translatedText: data.translatedText,
      source: sourceLanguage,
      target: targetLanguage,
      provider: 'LibreTranslate',
    });
  } catch (error: any) {
    console.error('Erro ao traduzir texto:', error?.message || error);

    const { text, target = 'en', source = 'pt' } = req.body || {};
    const targetLanguage = normalizeLanguage(target);
    const sourceLanguage = normalizeLanguage(source);

    if (typeof text === 'string' && targetLanguage && sourceLanguage) {
      const fallback = findFallbackTranslation(text, targetLanguage);

      if (fallback) {
        return res.json({
          originalText: text.trim(),
          translatedText: fallback,
          source: sourceLanguage,
          target: targetLanguage,
          provider: 'fallback',
          warning: 'Erro no provedor externo. Tradução local utilizada.',
        });
      }
    }

    return res.status(500).json({
      message: 'Erro interno ao traduzir texto.',
      detail: error?.message || 'Erro desconhecido',
    });
  }
}