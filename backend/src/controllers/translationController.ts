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
  'where is the bathroom?': {
    pt: 'Onde fica o banheiro?',
    en: 'Where is the bathroom?',
    es: '¿Dónde está el baño?',
  },
  '¿dónde está el baño?': {
    pt: 'Onde fica o banheiro?',
    en: 'Where is the bathroom?',
    es: '¿Dónde está el baño?',
  },

  'você pode me ajudar?': {
    pt: 'Você pode me ajudar?',
    en: 'Can you help me?',
    es: '¿Puedes ayudarme?',
  },
  'can you help me?': {
    pt: 'Você pode me ajudar?',
    en: 'Can you help me?',
    es: '¿Puedes ayudarme?',
  },
  '¿puedes ayudarme?': {
    pt: 'Você pode me ajudar?',
    en: 'Can you help me?',
    es: '¿Puedes ayudarme?',
  },

  'onde fica o hospital mais próximo?': {
    pt: 'Onde fica o hospital mais próximo?',
    en: 'Where is the nearest hospital?',
    es: '¿Dónde está el hospital más cercano?',
  },
  'where is the nearest hospital?': {
    pt: 'Onde fica o hospital mais próximo?',
    en: 'Where is the nearest hospital?',
    es: '¿Dónde está el hospital más cercano?',
  },
  '¿dónde está el hospital más cercano?': {
    pt: 'Onde fica o hospital mais próximo?',
    en: 'Where is the nearest hospital?',
    es: '¿Dónde está el hospital más cercano?',
  },

  'preciso chamar a polícia.': {
    pt: 'Preciso chamar a polícia.',
    en: 'I need to call the police.',
    es: 'Necesito llamar a la policía.',
  },
  'i need to call the police.': {
    pt: 'Preciso chamar a polícia.',
    en: 'I need to call the police.',
    es: 'Necesito llamar a la policía.',
  },
  'necesito llamar a la policía.': {
    pt: 'Preciso chamar a polícia.',
    en: 'I need to call the police.',
    es: 'Necesito llamar a la policía.',
  },

  'estou perdido. pode me ajudar?': {
    pt: 'Estou perdido. Pode me ajudar?',
    en: 'I am lost. Can you help me?',
    es: 'Estoy perdido. ¿Puedes ayudarme?',
  },
  'i am lost. can you help me?': {
    pt: 'Estou perdido. Pode me ajudar?',
    en: 'I am lost. Can you help me?',
    es: 'Estoy perdido. ¿Puedes ayudarme?',
  },
  'estoy perdido. ¿puedes ayudarme?': {
    pt: 'Estou perdido. Pode me ajudar?',
    en: 'I am lost. Can you help me?',
    es: 'Estoy perdido. ¿Puedes ayudarme?',
  },

  'você tem o cardápio?': {
    pt: 'Você tem o cardápio?',
    en: 'Do you have the menu?',
    es: '¿Tienes el menú?',
  },
  'do you have the menu?': {
    pt: 'Você tem o cardápio?',
    en: 'Do you have the menu?',
    es: '¿Tienes el menú?',
  },
  '¿tienes el menú?': {
    pt: 'Você tem o cardápio?',
    en: 'Do you have the menu?',
    es: '¿Tienes el menú?',
  },

  'eu gostaria de uma água, por favor.': {
    pt: 'Eu gostaria de uma água, por favor.',
    en: 'I would like some water, please.',
    es: 'Me gustaría un agua, por favor.',
  },
  'i would like some water, please.': {
    pt: 'Eu gostaria de uma água, por favor.',
    en: 'I would like some water, please.',
    es: 'Me gustaría un agua, por favor.',
  },
  'me gustaría un agua, por favor.': {
    pt: 'Eu gostaria de uma água, por favor.',
    en: 'I would like some water, please.',
    es: 'Me gustaría un agua, por favor.',
  },

  'a conta, por favor.': {
    pt: 'A conta, por favor.',
    en: 'The bill, please.',
    es: 'La cuenta, por favor.',
  },
  'the bill, please.': {
    pt: 'A conta, por favor.',
    en: 'The bill, please.',
    es: 'La cuenta, por favor.',
  },
  'la cuenta, por favor.': {
    pt: 'A conta, por favor.',
    en: 'The bill, please.',
    es: 'La cuenta, por favor.',
  },

  'eu não como carne.': {
    pt: 'Eu não como carne.',
    en: 'I do not eat meat.',
    es: 'No como carne.',
  },
  'i do not eat meat.': {
    pt: 'Eu não como carne.',
    en: 'I do not eat meat.',
    es: 'No como carne.',
  },
  'no como carne.': {
    pt: 'Eu não como carne.',
    en: 'I do not eat meat.',
    es: 'No como carne.',
  },

  'onde pego o ônibus?': {
    pt: 'Onde pego o ônibus?',
    en: 'Where can I take the bus?',
    es: '¿Dónde puedo tomar el autobús?',
  },
  'where can i take the bus?': {
    pt: 'Onde pego o ônibus?',
    en: 'Where can I take the bus?',
    es: '¿Dónde puedo tomar el autobús?',
  },
  '¿dónde puedo tomar el autobús?': {
    pt: 'Onde pego o ônibus?',
    en: 'Where can I take the bus?',
    es: '¿Dónde puedo tomar el autobús?',
  },

  'onde fica a estação mais próxima?': {
    pt: 'Onde fica a estação mais próxima?',
    en: 'Where is the nearest station?',
    es: '¿Dónde está la estación más cercana?',
  },
  'where is the nearest station?': {
    pt: 'Onde fica a estação mais próxima?',
    en: 'Where is the nearest station?',
    es: '¿Dónde está la estación más cercana?',
  },
  '¿dónde está la estación más cercana?': {
    pt: 'Onde fica a estação mais próxima?',
    en: 'Where is the nearest station?',
    es: '¿Dónde está la estación más cercana?',
  },

  'quanto custa uma corrida até o centro?': {
    pt: 'Quanto custa uma corrida até o centro?',
    en: 'How much is a ride to downtown?',
    es: '¿Cuánto cuesta un viaje al centro?',
  },
  'how much is a ride to downtown?': {
    pt: 'Quanto custa uma corrida até o centro?',
    en: 'How much is a ride to downtown?',
    es: '¿Cuánto cuesta un viaje al centro?',
  },
  '¿cuánto cuesta un viaje al centro?': {
    pt: 'Quanto custa uma corrida até o centro?',
    en: 'How much is a ride to downtown?',
    es: '¿Cuánto cuesta un viaje al centro?',
  },

  'tenho uma reserva em meu nome.': {
    pt: 'Tenho uma reserva em meu nome.',
    en: 'I have a reservation under my name.',
    es: 'Tengo una reserva a mi nombre.',
  },
  'i have a reservation under my name.': {
    pt: 'Tenho uma reserva em meu nome.',
    en: 'I have a reservation under my name.',
    es: 'Tengo una reserva a mi nombre.',
  },
  'tengo una reserva a mi nombre.': {
    pt: 'Tenho uma reserva em meu nome.',
    en: 'I have a reservation under my name.',
    es: 'Tengo una reserva a mi nombre.',
  },

  'que horas posso fazer o check-in?': {
    pt: 'Que horas posso fazer o check-in?',
    en: 'What time can I check in?',
    es: '¿A qué hora puedo hacer el check-in?',
  },
  'what time can i check in?': {
    pt: 'Que horas posso fazer o check-in?',
    en: 'What time can I check in?',
    es: '¿A qué hora puedo hacer el check-in?',
  },
  '¿a qué hora puedo hacer el check-in?': {
    pt: 'Que horas posso fazer o check-in?',
    en: 'What time can I check in?',
    es: '¿A qué hora puedo hacer el check-in?',
  },

  'qual é a senha do wi-fi?': {
    pt: 'Qual é a senha do Wi-Fi?',
    en: 'What is the Wi-Fi password?',
    es: '¿Cuál es la contraseña del Wi-Fi?',
  },
  'what is the wi-fi password?': {
    pt: 'Qual é a senha do Wi-Fi?',
    en: 'What is the Wi-Fi password?',
    es: '¿Cuál es la contraseña del Wi-Fi?',
  },
  '¿cuál es la contraseña del wi-fi?': {
    pt: 'Qual é a senha do Wi-Fi?',
    en: 'What is the Wi-Fi password?',
    es: '¿Cuál es la contraseña del Wi-Fi?',
  },

  'quanto custa isso?': {
    pt: 'Quanto custa isso?',
    en: 'How much does this cost?',
    es: '¿Cuánto cuesta esto?',
  },
  'how much does this cost?': {
    pt: 'Quanto custa isso?',
    en: 'How much does this cost?',
    es: '¿Cuánto cuesta esto?',
  },
  '¿cuánto cuesta esto?': {
    pt: 'Quanto custa isso?',
    en: 'How much does this cost?',
    es: '¿Cuánto cuesta esto?',
  },

  'vocês aceitam cartão?': {
    pt: 'Vocês aceitam cartão?',
    en: 'Do you accept card?',
    es: '¿Aceptan tarjeta?',
  },
  'do you accept card?': {
    pt: 'Vocês aceitam cartão?',
    en: 'Do you accept card?',
    es: '¿Aceptan tarjeta?',
  },
  '¿aceptan tarjeta?': {
    pt: 'Vocês aceitam cartão?',
    en: 'Do you accept card?',
    es: '¿Aceptan tarjeta?',
  },

  'você pode fazer um desconto?': {
    pt: 'Você pode fazer um desconto?',
    en: 'Can you give me a discount?',
    es: '¿Puedes hacerme un descuento?',
  },
  'can you give me a discount?': {
    pt: 'Você pode fazer um desconto?',
    en: 'Can you give me a discount?',
    es: '¿Puedes hacerme un descuento?',
  },
  '¿puedes hacerme un descuento?': {
    pt: 'Você pode fazer um desconto?',
    en: 'Can you give me a discount?',
    es: '¿Puedes hacerme un descuento?',
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

function sendFallbackIfPossible({
  res,
  text,
  source,
  target,
  warning,
}: {
  res: Response;
  text: string;
  source: SupportedLanguage;
  target: SupportedLanguage;
  warning: string;
}) {
  const fallback = findFallbackTranslation(text, target);

  if (!fallback) return false;

  res.json({
    originalText: text.trim(),
    translatedText: fallback,
    source,
    target,
    provider: 'fallback',
    warning,
  });

  return true;
}

async function readResponseBody(response: globalThis.Response) {
  const raw = await response.text();

  if (!raw) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('text/html') || raw.trim().startsWith('<!DOCTYPE')) {
    return {
      html: true,
      raw: raw.slice(0, 500),
    };
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

    if (!response.ok || data?.html) {
      const sentFallback = sendFallbackIfPossible({
        res,
        text: trimmedText,
        source: sourceLanguage,
        target: targetLanguage,
        warning:
          'LibreTranslate público indisponível ou bloqueado. Tradução local utilizada.',
      });

      if (sentFallback) return;

      return res.status(502).json({
        message: 'Erro ao consultar o LibreTranslate.',
        details: data,
      });
    }

    if (!data?.translatedText) {
      const sentFallback = sendFallbackIfPossible({
        res,
        text: trimmedText,
        source: sourceLanguage,
        target: targetLanguage,
        warning: 'LibreTranslate não retornou tradução válida.',
      });

      if (sentFallback) return;

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
      const sentFallback = sendFallbackIfPossible({
        res,
        text,
        source: sourceLanguage,
        target: targetLanguage,
        warning: 'Erro no provedor externo. Tradução local utilizada.',
      });

      if (sentFallback) return;
    }

    return res.status(500).json({
      message: 'Erro interno ao traduzir texto.',
      detail: error?.message || 'Erro desconhecido',
    });
  }
}