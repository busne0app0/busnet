export interface City {
  id: string;
  names: {
    uk: string;
    en: string;
    it: string;
  };
  countryCode: string;
  popular?: boolean;
}

export const cities: City[] = [
  {
    id: "kyiv",
    names: { uk: "Київ", en: "Kyiv", it: "Kiev" },
    countryCode: "UA",
    popular: true
  },
  {
    id: "warsaw",
    names: { uk: "Варшава", en: "Warsaw", it: "Varsavia" },
    countryCode: "PL",
    popular: true
  },
  {
    id: "rome",
    names: { uk: "Рим", en: "Rome", it: "Roma" },
    countryCode: "IT",
    popular: true
  },
  {
    id: "milan",
    names: { uk: "Мілан", en: "Milan", it: "Milano" },
    countryCode: "IT",
    popular: true
  },
  {
    id: "berlin",
    names: { uk: "Берлін", en: "Berlin", it: "Berlino" },
    countryCode: "DE",
    popular: true
  },
  {
    id: "paris",
    names: { uk: "Париж", en: "Paris", it: "Parigi" },
    countryCode: "FR",
    popular: true
  },
  {
    id: "prague",
    names: { uk: "Прага", en: "Prague", it: "Praga" },
    countryCode: "CZ",
    popular: true
  },
  {
    id: "vienna",
    names: { uk: "Відень", en: "Vienna", it: "Vienna" },
    countryCode: "AT",
    popular: true
  },
  {
    id: "lviv",
    names: { uk: "Львів", en: "Lviv", it: "Leopoli" },
    countryCode: "UA",
    popular: true
  },
  {
    id: "odesa",
    names: { uk: "Одеса", en: "Odesa", it: "Odessa" },
    countryCode: "UA",
    popular: true
  },
  {
    id: "naples",
    names: { uk: "Неаполь", en: "Naples", it: "Napoli" },
    countryCode: "IT"
  },
  {
    id: "venice",
    names: { uk: "Венеція", en: "Venice", it: "Venezia" },
    countryCode: "IT"
  },
  {
    id: "krakow",
    names: { uk: "Краків", en: "Krakow", it: "Cracovia" },
    countryCode: "PL"
  },
  {
    id: "wroclaw",
    names: { uk: "Вроцлав", en: "Wroclaw", it: "Breslavia" },
    countryCode: "PL"
  },
  {
    id: "barcelona",
    names: { uk: "Барселона", en: "Barcelona", it: "Barcellona" },
    countryCode: "ES"
  },
  {
    id: "madrid",
    names: { uk: "Мадрид", en: "Madrid", it: "Madrid" },
    countryCode: "ES"
  }
];
