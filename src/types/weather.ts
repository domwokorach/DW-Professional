export type WeatherData = {
  coord: {
    lon: number;
    lat: number;
  };

  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;

  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
  };

  name: string;

  sys: {
    country: string;
  };
};
