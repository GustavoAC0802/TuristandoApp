import { Request, Response } from 'express';
import axios from 'axios';

const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

function getApiKey() {
  return process.env.OPENWEATHER_API_KEY;
}

function normalizeWeatherLang(lang?: unknown) {
  if (typeof lang !== 'string') return 'pt_br';

  if (lang.startsWith('en')) return 'en';
  if (lang.startsWith('es')) return 'es';
  if (lang.startsWith('pt')) return 'pt_br';

  return 'pt_br';
}

export async function getWeatherByCity(req: Request, res: Response) {
  try {
    const { city, lang } = req.query;

    if (!city || typeof city !== 'string') {
      return res.status(400).json({
        message: 'Cidade é obrigatória',
      });
    }

    const apiKey = getApiKey();

    if (!apiKey) {
      return res.status(500).json({
        message: 'Chave da API de clima não configurada',
      });
    }

    const weatherLang = normalizeWeatherLang(lang);

    const response = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
      params: {
        q: city,
        appid: apiKey,
        units: 'metric',
        lang: weatherLang,
      },
    });

    const data = response.data;

    return res.status(200).json({
      city: data.name,
      country: data.sys?.country,
      temperature: Math.round(data.main?.temp),
      feelsLike: Math.round(data.main?.feels_like),
      humidity: data.main?.humidity,
      description: data.weather?.[0]?.description,
      icon: data.weather?.[0]?.icon,
      iconUrl: `https://openweathermap.org/img/wn/${data.weather?.[0]?.icon}@2x.png`,
      windSpeed: data.wind?.speed,
    });
  } catch (error: any) {
    console.log(
      'Erro ao buscar clima atual:',
      error.response?.data || error.message
    );

    return res.status(500).json({
      message: 'Erro ao buscar clima atual',
    });
  }
}

export async function getWeatherForecastByCity(req: Request, res: Response) {
  try {
    const { city, lang } = req.query;

    if (!city || typeof city !== 'string') {
      return res.status(400).json({
        message: 'Cidade é obrigatória',
      });
    }

    const apiKey = getApiKey();

    if (!apiKey) {
      return res.status(500).json({
        message: 'Chave da API de clima não configurada',
      });
    }

    const weatherLang = normalizeWeatherLang(lang);

    const response = await axios.get(`${OPENWEATHER_BASE_URL}/forecast`, {
      params: {
        q: city,
        appid: apiKey,
        units: 'metric',
        lang: weatherLang,
      },
    });

    const data = response.data;

    const groupedByDay: Record<string, any[]> = {};

    data.list.forEach((item: any) => {
      const date = item.dt_txt.split(' ')[0];

      if (!groupedByDay[date]) {
        groupedByDay[date] = [];
      }

      groupedByDay[date].push(item);
    });

    const forecast = Object.entries(groupedByDay)
      .slice(0, 5)
      .map(([date, items]) => {
        const temps = items.map((item: any) => item.main.temp);

        const middleItem =
          items.find((item: any) => item.dt_txt.includes('12:00:00')) ||
          items[Math.floor(items.length / 2)];

        return {
          date,
          min: Math.round(Math.min(...temps)),
          max: Math.round(Math.max(...temps)),
          description: middleItem.weather?.[0]?.description,
          icon: middleItem.weather?.[0]?.icon,
          iconUrl: `https://openweathermap.org/img/wn/${middleItem.weather?.[0]?.icon}@2x.png`,
        };
      });

    return res.status(200).json({
      city: data.city?.name,
      country: data.city?.country,
      forecast,
    });
  } catch (error: any) {
    console.log(
      'Erro ao buscar previsão:',
      error.response?.data || error.message
    );

    return res.status(500).json({
      message: 'Erro ao buscar previsão do clima',
    });
  }
}