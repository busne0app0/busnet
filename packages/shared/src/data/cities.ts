export interface City {
  id: string;
  names: {
    uk: string;
    en: string;
    it: string;
  };
  countryCode: string;
  popular?: boolean;
  fromDb?: boolean;
}

export const cities: City[] = [
  // ── Ukraine ─────────────────────────────────────────────────────────────────
  { id: 'kyiv',          names: { uk: 'Київ',            en: 'Kyiv',           it: 'Kiev'             }, countryCode: 'UA', popular: true  },
  { id: 'lviv',          names: { uk: 'Львів',           en: 'Lviv',           it: 'Leopoli'          }, countryCode: 'UA', popular: true  },
  { id: 'odesa',         names: { uk: 'Одеса',           en: 'Odesa',          it: 'Odessa'           }, countryCode: 'UA', popular: true  },
  { id: 'kharkiv',       names: { uk: 'Харків',          en: 'Kharkiv',        it: 'Kharkiv'          }, countryCode: 'UA' },
  { id: 'dnipro',        names: { uk: 'Дніпро',          en: 'Dnipro',         it: 'Dnipro'           }, countryCode: 'UA' },
  { id: 'zaporizhzhia',  names: { uk: 'Запоріжжя',       en: 'Zaporizhzhia',   it: 'Zaporizhzhia'     }, countryCode: 'UA' },
  { id: 'vinnytsia',     names: { uk: 'Вінниця',         en: 'Vinnytsia',      it: 'Vinnytsia'        }, countryCode: 'UA' },
  { id: 'cherkasy',      names: { uk: 'Черкаси',         en: 'Cherkasy',       it: 'Cherkasy'         }, countryCode: 'UA' },
  { id: 'kherson',       names: { uk: 'Херсон',          en: 'Kherson',        it: 'Kherson'          }, countryCode: 'UA' },
  { id: 'rivne',         names: { uk: 'Рівне',           en: 'Rivne',          it: 'Rivne'            }, countryCode: 'UA' },
  { id: 'lutsk',         names: { uk: 'Луцьк',           en: 'Lutsk',          it: 'Lutsk'            }, countryCode: 'UA' },
  { id: 'ternopil',      names: { uk: 'Тернопіль',       en: 'Ternopil',       it: 'Ternopil'         }, countryCode: 'UA' },
  { id: 'khmelnytskyi',  names: { uk: 'Хмельницький',    en: 'Khmelnytskyi',   it: 'Khmelnytskyi'     }, countryCode: 'UA' },
  { id: 'zhytomyr',      names: { uk: 'Житомир',         en: 'Zhytomyr',       it: 'Zhytomyr'         }, countryCode: 'UA' },
  { id: 'ivano-frankivsk', names: { uk: 'Івано-Франківськ', en: 'Ivano-Frankivsk', it: 'Ivano-Frankivsk' }, countryCode: 'UA' },
  { id: 'chernivtsi',    names: { uk: 'Чернівці',        en: 'Chernivtsi',     it: 'Chernivtsi'       }, countryCode: 'UA' },
  { id: 'uzhhorod',      names: { uk: 'Ужгород',         en: 'Uzhhorod',       it: 'Uzhhorod'         }, countryCode: 'UA' },
  { id: 'mukachevo',     names: { uk: 'Мукачево',        en: 'Mukachevo',      it: 'Mukachevo'        }, countryCode: 'UA' },
  { id: 'stryi',         names: { uk: 'Стрий',           en: 'Stryi',          it: 'Stryi'            }, countryCode: 'UA' },
  { id: 'drohobych',     names: { uk: 'Дрогобич',        en: 'Drohobych',      it: 'Drohobych'        }, countryCode: 'UA' },
  { id: 'kolomyia',      names: { uk: 'Коломия',         en: 'Kolomyia',       it: 'Kolomyia'         }, countryCode: 'UA' },
  { id: 'kalush',        names: { uk: 'Калуш',           en: 'Kalush',         it: 'Kalush'           }, countryCode: 'UA' },
  { id: 'dolyna',        names: { uk: 'Долина',          en: 'Dolyna',         it: 'Dolyna'           }, countryCode: 'UA' },
  { id: 'zolochiv',      names: { uk: 'Золочів',         en: 'Zolochiv',       it: 'Zolochiv'         }, countryCode: 'UA' },
  { id: 'uman',          names: { uk: 'Умань',           en: 'Uman',           it: 'Uman'             }, countryCode: 'UA' },
  { id: 'haisyn',        names: { uk: 'Гайсин',          en: 'Haisyn',         it: 'Haisyn'           }, countryCode: 'UA' },
  { id: 'nemyriv',       names: { uk: 'Немирів',         en: 'Nemyriv',        it: 'Nemyriv'          }, countryCode: 'UA' },
  { id: 'zvyahel',       names: { uk: 'Звягель',         en: 'Zvyahel',        it: 'Zvyahel'          }, countryCode: 'UA' },

  // ── Italy ────────────────────────────────────────────────────────────────────
  { id: 'rome',          names: { uk: 'Рим',             en: 'Rome',           it: 'Roma'             }, countryCode: 'IT', popular: true  },
  { id: 'milan',         names: { uk: 'Мілан',           en: 'Milan',          it: 'Milano'           }, countryCode: 'IT', popular: true  },
  { id: 'naples',        names: { uk: 'Неаполь',         en: 'Naples',         it: 'Napoli'           }, countryCode: 'IT', popular: true  },
  { id: 'venice',        names: { uk: 'Венеція',         en: 'Venice',         it: 'Venezia'          }, countryCode: 'IT' },
  { id: 'venice-mestre', names: { uk: 'Венеція Местре',  en: 'Venice Mestre',  it: 'Venezia Mestre'   }, countryCode: 'IT' },
  { id: 'florence',      names: { uk: 'Флоренція',       en: 'Florence',       it: 'Firenze'          }, countryCode: 'IT' },
  { id: 'turin',         names: { uk: 'Турин',           en: 'Turin',          it: 'Torino'           }, countryCode: 'IT' },
  { id: 'bologna',       names: { uk: 'Болонья',         en: 'Bologna',        it: 'Bologna'          }, countryCode: 'IT' },
  { id: 'genoa',         names: { uk: 'Генуя',           en: 'Genoa',          it: 'Genova'           }, countryCode: 'IT' },
  { id: 'verona',        names: { uk: 'Верона',          en: 'Verona',         it: 'Verona'           }, countryCode: 'IT' },
  { id: 'padua',         names: { uk: 'Падуя',           en: 'Padua',          it: 'Padova'           }, countryCode: 'IT' },
  { id: 'vicenza',       names: { uk: 'Віченца',         en: 'Vicenza',        it: 'Vicenza'          }, countryCode: 'IT' },
  { id: 'brescia',       names: { uk: 'Брешія',          en: 'Brescia',        it: 'Brescia'          }, countryCode: 'IT' },
  { id: 'bergamo',       names: { uk: 'Бергамо',         en: 'Bergamo',        it: 'Bergamo'          }, countryCode: 'IT' },
  { id: 'como',          names: { uk: 'Комо',            en: 'Como',           it: 'Como'             }, countryCode: 'IT' },
  { id: 'trieste',       names: { uk: 'Трієст',          en: 'Trieste',        it: 'Trieste'          }, countryCode: 'IT' },
  { id: 'udine',         names: { uk: 'Удіне',           en: 'Udine',          it: 'Udine'            }, countryCode: 'IT' },
  { id: 'bari',          names: { uk: 'Барі',            en: 'Bari',           it: 'Bari'             }, countryCode: 'IT' },
  { id: 'salerno',       names: { uk: 'Салерно',         en: 'Salerno',        it: 'Salerno'          }, countryCode: 'IT' },
  { id: 'lecce',         names: { uk: 'Лечче',           en: 'Lecce',          it: 'Lecce'            }, countryCode: 'IT' },
  { id: 'foggia',        names: { uk: 'Фоджа',           en: 'Foggia',         it: 'Foggia'           }, countryCode: 'IT' },
  { id: 'pescara',       names: { uk: 'Пескара',         en: 'Pescara',        it: 'Pescara'          }, countryCode: 'IT' },
  { id: 'ancona',        names: { uk: 'Анкона',          en: 'Ancona',         it: 'Ancona'           }, countryCode: 'IT' },
  { id: 'rimini',        names: { uk: 'Ріміні',          en: 'Rimini',         it: 'Rimini'           }, countryCode: 'IT' },
  { id: 'modena',        names: { uk: 'Модена',          en: 'Modena',         it: 'Modena'           }, countryCode: 'IT' },
  { id: 'parma',         names: { uk: 'Парма',           en: 'Parma',          it: 'Parma'            }, countryCode: 'IT' },
  { id: 'reggio-emilia', names: { uk: 'Реджо-Емілія',    en: 'Reggio Emilia',  it: 'Reggio Emilia'    }, countryCode: 'IT' },
  { id: 'ferrara',       names: { uk: 'Феррара',         en: 'Ferrara',        it: 'Ferrara'          }, countryCode: 'IT' },
  { id: 'ravenna',       names: { uk: 'Равенна',         en: 'Ravenna',        it: 'Ravenna'          }, countryCode: 'IT' },
  { id: 'faenza',        names: { uk: 'Фаенца',          en: 'Faenza',         it: 'Faenza'           }, countryCode: 'IT' },
  { id: 'cesena',        names: { uk: 'Чезена',          en: 'Cesena',         it: 'Cesena'           }, countryCode: 'IT' },
  { id: 'piacenza',      names: { uk: "П'яченца",        en: 'Piacenza',       it: 'Piacenza'         }, countryCode: 'IT' },
  { id: 'mantua',        names: { uk: 'Мантуя',          en: 'Mantua',         it: 'Mantova'          }, countryCode: 'IT' },
  { id: 'rovigo',        names: { uk: 'Ровіго',          en: 'Rovigo',         it: 'Rovigo'           }, countryCode: 'IT' },
  { id: 'carpi',         names: { uk: 'Карпі',           en: 'Carpi',          it: 'Carpi'            }, countryCode: 'IT' },
  { id: 'tortona',       names: { uk: 'Тортона',         en: 'Tortona',        it: 'Tortona'          }, countryCode: 'IT' },
  { id: 'alessandria',   names: { uk: 'Алессандрія',     en: 'Alessandria',    it: 'Alessandria'      }, countryCode: 'IT' },
  { id: 'asti',          names: { uk: 'Асті',            en: 'Asti',           it: 'Asti'             }, countryCode: 'IT' },
  { id: 'savona',        names: { uk: 'Савона',          en: 'Savona',         it: 'Savona'           }, countryCode: 'IT' },
  { id: 'caserta',       names: { uk: 'Казерта',         en: 'Caserta',        it: 'Caserta'          }, countryCode: 'IT' },
  { id: 'cassino',       names: { uk: 'Кассіно',         en: 'Cassino',        it: 'Cassino'          }, countryCode: 'IT' },
  { id: 'capua',         names: { uk: 'Капуа',           en: 'Capua',          it: 'Capua'            }, countryCode: 'IT' },
  { id: 'caianello',     names: { uk: 'Каянелло',        en: 'Caianello',      it: 'Caianello'        }, countryCode: 'IT' },
  { id: 'andria',        names: { uk: 'Андрія',          en: 'Andria',         it: 'Andria'           }, countryCode: 'IT' },
  { id: 'trani',         names: { uk: 'Трані',           en: 'Trani',          it: 'Trani'            }, countryCode: 'IT' },
  { id: 'cerignola',     names: { uk: 'Черіньола',       en: 'Cerignola',      it: 'Cerignola'        }, countryCode: 'IT' },
  { id: 'civitanova-marche', names: { uk: 'Чивітанова-Марке', en: 'Civitanova Marche', it: 'Civitanova Marche' }, countryCode: 'IT' },
  { id: 'san-benedetto',  names: { uk: 'Сан-Бенедетто-дель-Тронто', en: 'San Benedetto del Tronto', it: 'San Benedetto del Tronto' }, countryCode: 'IT' },
  { id: 'pesaro',        names: { uk: 'Пезаро',          en: 'Pesaro',         it: 'Pesaro'           }, countryCode: 'IT' },

  // ── Poland ───────────────────────────────────────────────────────────────────
  { id: 'warsaw',        names: { uk: 'Варшава',         en: 'Warsaw',         it: 'Varsavia'         }, countryCode: 'PL', popular: true  },
  { id: 'krakow',        names: { uk: 'Краків',          en: 'Krakow',         it: 'Cracovia'         }, countryCode: 'PL' },
  { id: 'wroclaw',       names: { uk: 'Вроцлав',         en: 'Wroclaw',        it: 'Breslavia'        }, countryCode: 'PL' },

  // ── Germany ──────────────────────────────────────────────────────────────────
  { id: 'berlin',        names: { uk: 'Берлін',          en: 'Berlin',         it: 'Berlino'          }, countryCode: 'DE', popular: true  },
  { id: 'munich',        names: { uk: 'Мюнхен',          en: 'Munich',         it: 'Monaco di Baviera' }, countryCode: 'DE' },

  // ── France ───────────────────────────────────────────────────────────────────
  { id: 'paris',         names: { uk: 'Париж',           en: 'Paris',          it: 'Parigi'           }, countryCode: 'FR', popular: true  },

  // ── Czech Republic ────────────────────────────────────────────────────────────
  { id: 'prague',        names: { uk: 'Прага',           en: 'Prague',         it: 'Praga'            }, countryCode: 'CZ', popular: true  },

  // ── Austria ───────────────────────────────────────────────────────────────────
  { id: 'vienna',        names: { uk: 'Відень',          en: 'Vienna',         it: 'Vienna'           }, countryCode: 'AT', popular: true  },

  // ── Spain ─────────────────────────────────────────────────────────────────────
  { id: 'barcelona',     names: { uk: 'Барселона',       en: 'Barcelona',      it: 'Barcellona'       }, countryCode: 'ES' },
  { id: 'madrid',        names: { uk: 'Мадрид',          en: 'Madrid',         it: 'Madrid'           }, countryCode: 'ES' },
];
