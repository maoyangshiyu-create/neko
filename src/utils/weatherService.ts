import { WeatherData } from '../types/phone';

export function mapWmoCodeToWeather(code: number): string {
  if (code === 0) return '晴';
  if (code >= 1 && code <= 3) return '多云/阴';
  if (code === 45 || code === 48) return '雾';
  if (code >= 51 && code <= 67) return '雨';
  if (code >= 71 && code <= 77) return '雪';
  if (code >= 80 && code <= 82) return '阵雨';
  if (code >= 85 && code <= 86) return '阵雪';
  if (code >= 95 && code <= 99) return '雷雨';
  return '晴';
}

export async function fetchWeatherForCity(cityName: string): Promise<WeatherData> {
  if (!cityName || !cityName.trim()) {
    throw new Error('请输入有效的城市名');
  }

  // 1. Geocoding
  const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName.trim())}&count=1&language=zh`);
  if (!geoRes.ok) {
    throw new Error('获取城市坐标失败');
  }
  const geoData = await geoRes.json();
  if (!geoData.results || geoData.results.length === 0) {
    throw new Error(`未找到城市：${cityName}`);
  }

  const { latitude, longitude, name } = geoData.results[0];

  // 2. Forecast
  const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`);
  if (!weatherRes.ok) {
    throw new Error('获取天气数据失败');
  }
  const weatherData = await weatherRes.json();
  const current = weatherData.current;
  if (!current) {
    throw new Error('未能获取当前天气详情');
  }

  return {
    city: name || cityName,
    temperature: Math.round(current.temperature_2m),
    weather: mapWmoCodeToWeather(current.weather_code),
    windSpeed: Math.round(current.wind_speed_10m || 0)
  };
}

export async function fetchWeatherByCoordinates(lat: number, lon: number): Promise<WeatherData> {
  const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`);
  if (!weatherRes.ok) {
    throw new Error('获取天气数据失败');
  }
  const weatherData = await weatherRes.json();
  const current = weatherData.current;
  if (!current) {
    throw new Error('未能获取当前天气详情');
  }

  // Reverse geocode or default name
  return {
    city: '当前位置',
    temperature: Math.round(current.temperature_2m),
    weather: mapWmoCodeToWeather(current.weather_code),
    windSpeed: Math.round(current.wind_speed_10m || 0)
  };
}
