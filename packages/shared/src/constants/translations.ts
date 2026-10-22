export type Language = 'UK' | 'EN' | 'IT';

export interface TranslationSchema {
  header: {
    routes: string;
    partners: string;
    forum: string;
    bookingBadge: string;
    login: string;
    langLabel: string;
  };
  hero: {
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    suggestCheapest: string;
    suggestToday: string;
    suggestFastest: string;
    aiSlogan: string;
    suggestAiChoice: string;
    cityKyiv: string;
    cityWarsaw: string;
    cityLviv: string;
    cityBerlin: string;
    cityOdesa: string;
    cityPrague: string;
  };
  search: {
    from: string;
    to: string;
    date: string;
    selectDate: string;
    search: string;
    placeholderFrom: string;
    placeholderTo: string;
    today: string;
    swap: string;
    clear: string;
    cityNotFound: string;
  };
  calendar: {
    months: string[];
    monthsGenitive: string[];
    weekdays: string[];
    loading: string;
    tripsFound: string;
    daysWithTrips: (count: number) => string;
    availableTrips: string;
    noTrips: string;
    lowestPrice: string;
    route: string;
    moreRoutes: (count: number) => string;
    ariaLabel: string;
    prevMonth: string;
    nextMonth: string;
    selectToday: string;
    pastDate: string;
    active: string;
    tripsAria: (count: number) => string;
  };
  popular: {
    badge: string;
    title: string;
    titleAccent: string;
    premium: string;
    priceFrom: string;
    currency: string;
  };
  neuralWorkflow: {
    title: string;
    titleAccent: string;
    steps: Array<{
      id: number;
      title: string;
      text: string;
      highlight: string;
    }>;
  };
  validation: {
    header: string;
    close: string;
    fillAll: string;
    sameCities: string;
    unknownCity: string;
    pastDate: string;
    from: string;
    to: string;
    date: string;
  };
  footer: {
    rights: string;
    about: string;
    contacts: string;
    terms: string;
  };
  advantages: {
    badge: string;
    title: string;
    titleAccent: string;
    items: Array<{
      title: string;
      subtitle: string;
      desc: string;
    }>;
  };
  about: {
    title: string;
    titleAccent: string;
    desc: string;
    quote: string;
    stats: Array<{ label: string; value: string }>;
  };
  reviews: {
    title: string;
    titleAccent: string;
    items: Array<{
      name: string;
      text: string;
      route: string;
      img: string;
    }>;
  };
  appEco: {
    title: string;
    titleAccent: string;
    desc: string;
    downloadStore: string;
    downloadStoreSub: string;
    downloadGoogle: string;
    downloadGoogleSub: string;
    scanText: string;
    phoneTitle: string;
    phoneLogo: string;
    ticketName: string;
    ticketBus: string;
    ticketRoute: string;
    ticketTime: string;
    qrTitle: string;
    priceTitle: string;
    price: string;
    btnInstallPwa: string;
    btnInstalled: string;
    btnInstallMain: string;
    btnEcoSys: string;
    btnEcoModules: string;
    iosHintTitle: string;
    iosHintText: string;
    iosHintStep1: string;
    iosHintStep2: string;
    iosHintGotIt: string;
    modulesModalTitle: string;
    modulesModalText: string;
  };
  confidence: {
    title: string;
    titleAccent: string;
    items: Array<{ title: string; desc: string; icon: string }>;
  };
  seo: {
    title: string;
    desc: string;
  };
}

export const translations: Record<Language, TranslationSchema> & { UA?: TranslationSchema } = {
  UK: {
    header: {
      routes: 'Маршрути',
      partners: 'Партнерам',
      forum: 'Форум',
      bookingBadge: 'БРОНЮВАННЯ 24/7',
      login: 'УВІЙТИ',
      langLabel: 'МОВА',
    },
    hero: {
      titleLine1: 'Європа ближче',
      titleLine2: 'ніж здається',
      subtitle: 'Знайди рейс • Бронюй онлайн • Оплачуй при посадці',
      suggestCheapest: 'Найдешевше',
      suggestToday: 'Сьогодні',
      suggestFastest: 'Найшвидше',
      aiSlogan: 'Бронювання 24/7',
      suggestAiChoice: 'AI вибір',
      cityKyiv: 'Київ',
      cityWarsaw: 'Варшава',
      cityLviv: 'Львів',
      cityBerlin: 'Берлін',
      cityOdesa: 'Одеса',
      cityPrague: 'Прага',
    },
    search: {
      from: 'Звідки',
      to: 'Куди',
      date: 'Дата відправлення',
      selectDate: 'Оберіть дату',
      search: 'ПОШУК',
      placeholderFrom: 'Місто відправлення...',
      placeholderTo: 'Куди прямуєте?',
      today: 'СЬОГОДНІ',
      swap: 'Поміняти місцями',
      clear: 'Очистити поле',
      cityNotFound: 'Місто не знайдено',
    },
    calendar: {
      months: ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'],
      monthsGenitive: ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'],
      weekdays: ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'НД'],
      loading: 'Завантаження...',
      tripsFound: 'Рейсів знайдено',
      daysWithTrips: (c) => {
        const mod10 = c % 10;
        const mod100 = c % 100;
        if (mod10 === 1 && mod100 !== 11) return `${c} день з рейсами`;
        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${c} дні з рейсами`;
        return `${c} днів з рейсами`;
      },
      availableTrips: 'Рейси доступні',
      noTrips: 'Немає рейсів',
      lowestPrice: 'Найнижча ціна',
      route: 'Маршрут',
      moreRoutes: (c) => `+${c} ще`,
      ariaLabel: 'Календар вибору дати',
      prevMonth: 'Попередній місяць',
      nextMonth: 'Наступний місяць',
      selectToday: 'Обрати сьогоднішню дату',
      pastDate: 'минула дата',
      active: 'Активний',
      tripsAria: (c) => `знайдено рейсів: ${c}`,
    },
    popular: {
      badge: 'Напрямки 2026',
      title: 'Популярні',
      titleAccent: 'рейси',
      premium: 'Преміум маршрут',
      priceFrom: 'Вартість від',
      currency: '₴',
    },
    neuralWorkflow: {
      title: 'ЯК ЦЕ',
      titleAccent: 'ПРАЦЮЄ',
      steps: [
        {
          id: 1,
          title: 'Знайдіть рейс',
          text: 'Говоріть або пишіть — {highlight} 15 країн Європи за 0.3 секунди.',
          highlight: 'AI аналізує'
        },
        {
          id: 2,
          title: 'Оберіть квиток',
          text: '{highlight} підкаже найкращий час, ціну та комфорт.',
          highlight: 'AI Smart Suggest'
        },
        {
          id: 3,
          title: 'Подорожуйте',
          text: 'Цифровий квиток та Passkey-авторизація. {highlight} або криптою.',
          highlight: 'Оплата при посадці'
        }
      ]
    },
    validation: {
      header: 'Увага!',
      close: 'Закрити сповіщення',
      fillAll: 'Будь ласка, заповніть місто відправлення, прибуття та дату.',
      sameCities: 'Місто відправлення та прибуття не можуть збігатися.',
      unknownCity: 'Оберіть місто зі списку.',
      pastDate: 'Дата відправлення не може бути в минулому.',
      from: 'Звідки їдемо?',
      to: 'Куди прямуєте?',
      date: 'Коли в дорогу?'
    },
    footer: {
      rights: '© 2026 Всі права захищені',
      about: 'Про нас',
      contacts: 'Контакти',
      terms: 'Угода користувача',
    },
    advantages: {
      badge: 'Переваги платформи',
      title: 'Чому обирають',
      titleAccent: 'BUSNET?',
      items: [
        {
          title: "60 секунд",
          subtitle: "на бронювання",
          desc: "Оберіть маршрут, місце і вкажіть ім'я. Жодних зайвих форм завдяки AI-автозаповненню."
        },
        {
          title: "0% передоплата",
          subtitle: "оплата при посадці",
          desc: "Ніякого ризику. Оплачуйте водієві або карткою прямо в автобусі."
        },
        {
          title: "Перевірені",
          subtitle: "перевізники",
          desc: "Усі партнери проходять багаторівневу верифікацію та рейтинг у реальному часі."
        },
        {
          title: "Цифровий",
          subtitle: "квиток",
          desc: "Ваш посадковий завжди у смартфоні. Ніякого паперу, тільки QR або NFC."
        },
        {
          title: "Смарт-знижки",
          subtitle: "для пільгових категорій",
          desc: "Діти -50%, студенти -20%, пасажири 60+ -30%. Розраховуються автоматично."
        },
        {
          title: "Підтримка",
          subtitle: "24/7 онлайн",
          desc: "Живі оператори та AI-асистенти завжди на зв'язку. Миттєве вирішення питань."
        }
      ]
    },
    about: {
      title: 'БІЛЬШЕ, НІЖ ПРОСТО',
      titleAccent: 'ПЕРЕВЕЗЕННЯ.',
      desc: 'Busnet UA — це інтелектуальна екосистема, що об’єднує міста за допомогою нейронних мереж та AI-аналітики. Ми відібрали найкращих перевізників Європи, щоб ваша подорож починалася не з вокзалу, а з першого кліку.',
      quote: '"Технології — це лише інструмент. Наша мета — ваш комфорт та безпека в кожному кілометрі."',
      stats: [
        { label: 'Пасажирів', value: '100k+' },
        { label: 'Країн Європи', value: '15+' },
        { label: 'Надійність', value: '99.8%' },
        { label: 'Швидкість AI', value: '0.3s' },
      ]
    },
    reviews: {
      title: 'ВІДГУКИ',
      titleAccent: 'МАНДРІВНИКІВ',
      items: [
        {
          name: "Ірина С., Одеса",
          text: "Чудово! Все швидко та комфортно. Рекомендую! Обов’язково поїду з вами ще раз. Сервіс на найвищому рівні!",
          route: "Київ → Варшава",
          img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&h=200&auto=format&fit=crop"
        },
        {
          name: "Дмитро П., Кропивницький",
          text: "Автобуси преміум-класу, чисто, Wi-Fi працював стабільно всю дорогу. Водії ввічливі та пунктуальні.",
          route: "Львів → Прага",
          img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&h=200&auto=format&fit=crop"
        },
        {
          name: "Олена В., Дніпро",
          text: "Завжди на зв'язку підтримка 24/7. Допомогли швидко вирішити питання з бронюванням. Комфортно і спокійно!",
          route: "Одеса → Берлін",
          img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&h=200&auto=format&fit=crop"
        },
        {
          name: "Олег Н., Харків",
          text: "Цифровий квиток. Показав QR-код зі смартфона і поїхав. Оплата при посадці — це саме те, що я шукав.",
          route: "Львів → Відень",
          img: "https://images.unsplash.com/photo-1552058544-f2b08422138a?q=80&w=200&h=200&auto=format&fit=crop"
        }
      ]
    },
    appEco: {
      title: 'ТВІЙ КВИТОК ЗАВЖДИ З',
      titleAccent: 'BUSNET',
      desc: 'Мобільний додаток — це фінальний крок нашої екосистеми. Квиток у смартфоні, 24/7 AI-підтримка, живий трекінг автобуса та верифікована безпека. Серйозна IT-платформа для вашої наступної поїздки.',
      downloadStore: 'App Store',
      downloadStoreSub: 'Завантажте в',
      downloadGoogle: 'Google Play',
      downloadGoogleSub: 'ДОСТУПНО В',
      scanText: 'Скануйте для завантаження',
      phoneTitle: 'ЕКОСИСТЕМА',
      phoneLogo: 'BUSNET',
      ticketName: "Ім’я: Ірина Сидоренко",
      ticketBus: "Автобус: BusNet Express",
      ticketRoute: "Маршрут: Київ → Варшава",
      ticketTime: "AI Відправлення: 16.04.2026, 08:00",
      qrTitle: 'AI QR-КОД ДЛЯ ПОСАДКИ',
      priceTitle: 'Вартість (Верифіковано AI)',
      price: '1200 UAH',
      btnInstallPwa: 'PWA Інсталяція',
      btnInstalled: 'ВЖЕ ВСТАНОВЛЕНО',
      btnInstallMain: 'ВСТАНОВИТИ ДОДАТОК',
      btnEcoSys: 'ЕКОСИСТЕМА',
      btnEcoModules: 'ІНШІ МОДУЛІ',
      iosHintTitle: 'Встановити на iPhone',
      iosHintText: 'Щоб додати BUSNET на "Початковий екран", виконайте 2 прості кроки:',
      iosHintStep1: '1. Натисніть кнопку "Поділитися" на панелі Safari',
      iosHintStep2: '2. Оберіть "На початковий екран" зі списку дій',
      iosHintGotIt: 'Зрозуміло',
      modulesModalTitle: 'Модулі екосистеми',
      modulesModalText: 'BUSNET — це єдина платформа мікросервісів. Відкрийте потрібне посилання на телефоні для встановлення PWA:',
    },
    confidence: {
      title: 'БЕЗПЕКА ТА',
      titleAccent: 'ДОВІРА',
      items: [
        { title: 'Страхування', desc: 'Кожен пасажир застрахований на €30,000 протягом усієї поїздки.', icon: 'shield' },
        { title: 'Підтримка 24/7', desc: 'Наші AI-агенти та живі оператори готові допомогти в будь-яку хвилину.', icon: 'support' },
        { title: 'Повернення', desc: 'Гарантоване 100% повернення коштів при скасуванні за 24 години до відправлення.', icon: 'refund' }
      ]
    },
    seo: {
      title: 'Популярні автобусні маршрути по Європі',
      desc: 'Busnet UA пропонує найшвидші та найдешевші автобусні квитки з України в Польщу, Італію, Німеччину та інші країни ЄС. Завдяки нашій унікальній AI-технології пошуку, ви можете знайти оптимальний маршрут з Києва, Львова, Одеси та Дніпра до Варшави, Берліна, Риму та Мілана за лічені секунди. Бронюйте квитки онлайн без передоплати та насолоджуйтесь комфортною подорожжю з перевіреними перевізниками.'
    }
  },

  EN: {
    header: {
      routes: 'Routes',
      partners: 'Partners',
      forum: 'Forum',
      bookingBadge: '24/7 BOOKING',
      login: 'LOGIN',
      langLabel: 'LANG',
    },
    hero: {
      titleLine1: 'Europe is closer',
      titleLine2: 'than you think',
      subtitle: 'Find a trip • Book online • Pay on boarding',
      suggestCheapest: 'Cheapest',
      suggestToday: 'Today',
      suggestFastest: 'Fastest',
      aiSlogan: '24/7 booking',
      suggestAiChoice: 'AI Choice',
      cityKyiv: 'Kyiv',
      cityWarsaw: 'Warsaw',
      cityLviv: 'Lviv',
      cityBerlin: 'Berlin',
      cityOdesa: 'Odesa',
      cityPrague: 'Prague',
    },
    search: {
      from: 'From',
      to: 'To',
      date: 'Departure Date',
      selectDate: 'Select date',
      search: 'SEARCH',
      placeholderFrom: 'Departure city...',
      placeholderTo: 'Where are you going?',
      today: 'TODAY',
      swap: 'Swap cities',
      clear: 'Clear field',
      cityNotFound: 'City not found',
    },
    calendar: {
      months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      monthsGenitive: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      weekdays: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'],
      loading: 'Loading...',
      tripsFound: 'Trips found',
      daysWithTrips: (c) => `${c} ${c === 1 ? 'day' : 'days'} with trips`,
      availableTrips: 'Trips available',
      noTrips: 'No trips',
      lowestPrice: 'Lowest price',
      route: 'Route',
      moreRoutes: (c) => `+${c} more`,
      ariaLabel: 'Date selection calendar',
      prevMonth: 'Previous month',
      nextMonth: 'Next month',
      selectToday: 'Select today',
      pastDate: 'past date',
      active: 'Active',
      tripsAria: (c) => `${c} trips found`,
    },
    popular: {
      badge: '2026 Destinations',
      title: 'Popular',
      titleAccent: 'trips',
      premium: 'Premium Route',
      priceFrom: 'Price from',
      currency: '€',
    },
    neuralWorkflow: {
      title: 'HOW IT',
      titleAccent: 'WORKS',
      steps: [
        {
          id: 1,
          title: 'Find a trip',
          text: 'Speak or type — {highlight} 15 European countries in 0.3 seconds.',
          highlight: 'AI analyzes'
        },
        {
          id: 2,
          title: 'Choose a ticket',
          text: '{highlight} will suggest the best time, price, and comfort.',
          highlight: 'AI Smart Suggest'
        },
        {
          id: 3,
          title: 'Travel',
          text: 'Digital ticket and Passkey authorization. {highlight} or with crypto.',
          highlight: 'Pay on boarding'
        }
      ]
    },
    validation: {
      header: 'Attention!',
      close: 'Close notification',
      fillAll: 'Please fill in the departure city, destination, and date.',
      sameCities: 'Departure and arrival cities cannot be the same.',
      unknownCity: 'Please select a city from the list.',
      pastDate: 'Departure date cannot be in the past.',
      from: 'Where from?',
      to: 'Where to?',
      date: 'When to go?'
    },
    footer: {
      rights: '© 2026 All rights reserved',
      about: 'About Us',
      contacts: 'Contacts',
      terms: 'Terms of Service',
    },
    advantages: {
      badge: 'Platform Advantages',
      title: 'Why Choose',
      titleAccent: 'BUSNET?',
      items: [
        {
          title: "60 Seconds",
          subtitle: "to Book",
          desc: "Select a route, seat, and enter your name. No lengthy forms thanks to AI autofill."
        },
        {
          title: "0% Prepayment",
          subtitle: "Pay on Boarding",
          desc: "Zero risk. Pay the driver in cash or with card directly on the bus."
        },
        {
          title: "Verified",
          subtitle: "Carriers",
          desc: "All partners undergo multi-level verification and real-time ratings."
        },
        {
          title: "Digital",
          subtitle: "Ticket",
          desc: "Your boarding pass is always in your smartphone. Paperless QR or NFC."
        },
        {
          title: "Smart Discounts",
          subtitle: "for Concessions",
          desc: "Children -50%, Students -20%, Seniors 60+ -30%. Applied automatically."
        },
        {
          title: "Support",
          subtitle: "24/7 Online",
          desc: "Live agents and neuro-assistants always available for instant solutions."
        }
      ]
    },
    about: {
      title: 'MORE THAN JUST',
      titleAccent: 'TRANSPORT.',
      desc: 'Busnet UA is an intelligent ecosystem connecting cities through neural networks and AI analytics. We partner with Europe\'s top carriers so your trip begins with ease from the very first click.',
      quote: '"Technology is just a tool. Our mission is your comfort and security in every single mile."',
      stats: [
        { label: 'Passengers', value: '100k+' },
        { label: 'EU Countries', value: '15+' },
        { label: 'Reliability', value: '99.8%' },
        { label: 'AI Speed', value: '0.3s' },
      ]
    },
    reviews: {
      title: 'TRAVELER',
      titleAccent: 'REVIEWS',
      items: [
        {
          name: "Iryna S., Odesa",
          text: "Wonderful experience! Fast, comfortable, and punctual. Definitely traveling with you again!",
          route: "Kyiv → Warsaw",
          img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&h=200&auto=format&fit=crop"
        },
        {
          name: "Dmytro P., Kropyvnytskyi",
          text: "Premium buses, clean interiors, and rock-solid Wi-Fi throughout the ride. Polite and professional drivers.",
          route: "Lviv → Prague",
          img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&h=200&auto=format&fit=crop"
        },
        {
          name: "Olena V., Dnipro",
          text: "Support was responsive 24/7. They sorted out my booking question within minutes. Stress-free trip!",
          route: "Odesa → Berlin",
          img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&h=200&auto=format&fit=crop"
        },
        {
          name: "Oleh N., Kharkiv",
          text: "Instant digital ticket. Just scanned the QR code from my phone and boarded. Exactly what I needed.",
          route: "Lviv → Vienna",
          img: "https://images.unsplash.com/photo-1552058544-f2b08422138a?q=80&w=200&h=200&auto=format&fit=crop"
        }
      ]
    },
    appEco: {
      title: 'YOUR TICKET ALWAYS WITH',
      titleAccent: 'BUSNET',
      desc: 'Our mobile app completes the ecosystem: digital tickets, 24/7 AI assistance, live bus telemetry, and certified safety.',
      downloadStore: 'App Store',
      downloadStoreSub: 'Download on the',
      downloadGoogle: 'Google Play',
      downloadGoogleSub: 'GET IT ON',
      scanText: 'Scan to Download',
      phoneTitle: 'ECOSYSTEM',
      phoneLogo: 'BUSNET',
      ticketName: "Name: Iryna Sydorenko",
      ticketBus: "Bus: BusNet Express",
      ticketRoute: "Route: Kyiv → Warsaw",
      ticketTime: "AI Departure: 16.04.2026, 08:00",
      qrTitle: 'AI QR CODE FOR BOARDING',
      priceTitle: 'Price (AI Verified)',
      price: '€29',
      btnInstallPwa: 'PWA Installation',
      btnInstalled: 'ALREADY INSTALLED',
      btnInstallMain: 'INSTALL APP',
      btnEcoSys: 'ECOSYSTEM',
      btnEcoModules: 'OTHER MODULES',
      iosHintTitle: 'Install on iPhone',
      iosHintText: 'To add BUSNET to your Home Screen, complete 2 quick steps:',
      iosHintStep1: '1. Tap the "Share" button at the bottom of Safari',
      iosHintStep2: '2. Choose "Add to Home Screen" from the menu',
      iosHintGotIt: 'Got it',
      modulesModalTitle: 'Ecosystem Modules',
      modulesModalText: 'BUSNET is a unified microservice platform. Open this page on your phone to install:',
    },
    confidence: {
      title: 'SAFETY AND',
      titleAccent: 'TRUST',
      items: [
        { title: 'Insurance', desc: 'Every passenger is insured for up to €30,000 for the entire route.', icon: 'shield' },
        { title: '24/7 Support', desc: 'Our AI assistants and human agents are ready around the clock.', icon: 'support' },
        { title: 'Refunds', desc: 'Guaranteed 100% refund for cancellations made 24 hours prior.', icon: 'refund' }
      ]
    },
    seo: {
      title: 'Popular Bus Routes Across Europe',
      desc: 'Busnet UA offers reliable and affordable bus tickets connecting Ukraine with Poland, Italy, Germany, and the EU. Our neural routing engine helps you pick optimal schedules in seconds.'
    }
  },

  IT: {
    header: {
      routes: 'Tratte',
      partners: 'Partner',
      forum: 'Forum',
      bookingBadge: 'PRENOTAZIONI 24/7',
      login: 'ACCEDI',
      langLabel: 'LINGUA',
    },
    hero: {
      titleLine1: "L'Europa è più vicina",
      titleLine2: 'di quanto pensi',
      subtitle: 'Trova il viaggio • Prenota online • Paga a bordo',
      suggestCheapest: 'Più economico',
      suggestToday: 'Oggi',
      suggestFastest: 'Più veloce',
      aiSlogan: 'Prenotazioni 24/7',
      suggestAiChoice: 'Scelta AI',
      cityKyiv: 'Kiev',
      cityWarsaw: 'Varsavia',
      cityLviv: 'Leopoli',
      cityBerlin: 'Berlino',
      cityOdesa: 'Odessa',
      cityPrague: 'Praga',
    },
    search: {
      from: 'Da',
      to: 'A',
      date: 'Data di partenza',
      selectDate: 'Seleziona data',
      search: 'CERCA',
      placeholderFrom: 'Città di partenza...',
      placeholderTo: 'Dove vuoi andare?',
      today: 'OGGI',
      swap: 'Inverti città',
      clear: 'Cancella campo',
      cityNotFound: 'Città non trovata',
    },
    calendar: {
      months: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'],
      monthsGenitive: ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'],
      weekdays: ['LU', 'MA', 'ME', 'GI', 'VE', 'SA', 'DO'],
      loading: 'Caricamento...',
      tripsFound: 'Corse trovate',
      daysWithTrips: (c) => `${c} ${c === 1 ? 'giorno' : 'giorni'} con corse`,
      availableTrips: 'Corse disponibili',
      noTrips: 'Nessuna corsa',
      lowestPrice: 'Prezzo più basso',
      route: 'Percorso',
      moreRoutes: (c) => `+${c} altri`,
      ariaLabel: 'Calendario selezione data',
      prevMonth: 'Mese precedente',
      nextMonth: 'Mese successivo',
      selectToday: 'Seleziona data odierna',
      pastDate: 'data passata',
      active: 'Attivo',
      tripsAria: (c) => `${c} corse trovate`,
    },
    popular: {
      badge: 'Destinazioni 2026',
      title: 'Viaggi',
      titleAccent: 'popolari',
      premium: 'Tratta Premium',
      priceFrom: 'Prezzo da',
      currency: '€',
    },
    neuralWorkflow: {
      title: 'COME',
      titleAccent: 'FUNZIONA',
      steps: [
        {
          id: 1,
          title: 'Trova una corsa',
          text: 'Digita o usa la voce — {highlight} 15 paesi europei in 0.3 secondi.',
          highlight: "l'AI analizza"
        },
        {
          id: 2,
          title: 'Scegli il biglietto',
          text: "{highlight} suggerirà l'orario, il prezzo e il comfort migliori.",
          highlight: 'AI Smart Suggest'
        },
        {
          id: 3,
          title: 'Viaggia sereno',
          text: 'Biglietto digitale e accesso Passkey. {highlight} o con criptovalute.',
          highlight: 'Paga a bordo'
        }
      ]
    },
    validation: {
      header: 'Attenzione!',
      close: 'Chiudi notifica',
      fillAll: 'Inserisci la città di partenza, la destinazione e la data.',
      sameCities: 'La città di partenza e di arrivo non possono essere uguali.',
      unknownCity: 'Seleziona una città dalla lista.',
      pastDate: 'La data di partenza non può essere nel passato.',
      from: 'Da dove parti?',
      to: 'Dove sei diretto?',
      date: 'Quando parti?'
    },
    footer: {
      rights: '© 2026 Tutti i diritti riservati',
      about: 'Chi siamo',
      contacts: 'Contatti',
      terms: 'Termini di servizio',
    },
    advantages: {
      badge: 'Vantaggi della Piattaforma',
      title: 'Perché scegliere',
      titleAccent: 'BUSNET?',
      items: [
        {
          title: "60 Secondi",
          subtitle: "per prenotare",
          desc: "Scegli posto e inserisci il nominativo. Nessun modulo superfluo grazie all'AI."
        },
        {
          title: "0% Anticipo",
          subtitle: "Paga a bordo",
          desc: "Zero rischi. Paga l'autista in contanti o con carta direttamente a bordo."
        },
        {
          title: "Vettori",
          subtitle: "verificati",
          desc: "Tutti i partner superano controlli rigorosi e monitoraggio dei rating in tempo reale."
        },
        {
          title: "Biglietto",
          subtitle: "digitale",
          desc: "La carta d'imbarco è sempre nello smartphone. Niente carta: solo QR o NFC."
        },
        {
          title: "Sconti Smart",
          subtitle: "agevolazioni",
          desc: "Bambini -50%, Studenti -20%, Senior 60+ -30%. Calcolati automaticamente."
        },
        {
          title: "Assistenza",
          subtitle: "24/7 online",
          desc: "Operatori reali e assistenti neurali pronti a risolvere ogni dubbio all'istante."
        }
      ]
    },
    about: {
      title: 'MOLTO PIÙ DI UN',
      titleAccent: 'SEMPLICE VIAGGIO.',
      desc: 'Busnet UA è un ecosistema intelligente che collega città europee attraverso reti neurali. Selezioniamo i vettori più affidabili affinché il viaggio cominci al meglio dal primo clic.',
      quote: '"La tecnologia è uno strumento. Il nostro scopo è la vostra serenità ad ogni chilometro."',
      stats: [
        { label: 'Passeggeri', value: '100k+' },
        { label: 'Paesi UE', value: '15+' },
        { label: 'Affidabilità', value: '99.8%' },
        { label: 'Velocità AI', value: '0.3s' },
      ]
    },
    reviews: {
      title: 'RECENSIONI DEI',
      titleAccent: 'VIAGGIATORI',
      items: [
        {
          name: "Iryna S., Odessa",
          text: "Esperienza splendida! Puntuali, autobus pulitissimi. Viaggerò sicuramente di nuovo con voi!",
          route: "Kiev → Varsavia",
          img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&h=200&auto=format&fit=crop"
        },
        {
          name: "Dmytro P., Kropyvnytskyi",
          text: "Autobus moderni con Wi-Fi stabile lungo tutto il tragitto. Autisti gentili e scrupolosi.",
          route: "Leopoli → Praga",
          img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&h=200&auto=format&fit=crop"
        },
        {
          name: "Olena V., Dnipro",
          text: "Assistenza attiva 24 ore su 24. Mi hanno aiutato all'istante con una modifica di orario.",
          route: "Odessa → Berlino",
          img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&h=200&auto=format&fit=crop"
        },
        {
          name: "Oleh N., Kharkiv",
          text: "Biglietto digitale comodissimo: mostrato il QR dal telefono e salito subito a bordo. Ottimo!",
          route: "Leopoli → Vienna",
          img: "https://images.unsplash.com/photo-1552058544-f2b08422138a?q=80&w=200&h=200&auto=format&fit=crop"
        }
      ]
    },
    appEco: {
      title: 'IL TUO BIGLIETTO SEMPRE CON',
      titleAccent: 'BUSNET',
      desc: 'L\'app mobile completa il servizio: pass digitale, supporto AI 24/7, tracking del pullman e massima sicurezza.',
      downloadStore: 'App Store',
      downloadStoreSub: 'Scarica su',
      downloadGoogle: 'Google Play',
      downloadGoogleSub: 'DISPONIBILE SU',
      scanText: 'Inquadra per scaricare',
      phoneTitle: 'ECOSISTEMA',
      phoneLogo: 'BUSNET',
      ticketName: "Nome: Iryna Sydorenko",
      ticketBus: "Bus: BusNet Express",
      ticketRoute: "Tratta: Kiev → Varsavia",
      ticketTime: "Partenza AI: 16.04.2026, 08:00",
      qrTitle: 'QR CODE AI PER SALITA A BORDO',
      priceTitle: 'Prezzo (Verificato AI)',
      price: '€29',
      btnInstallPwa: 'Installazione PWA',
      btnInstalled: 'GIÀ INSTALLATO',
      btnInstallMain: 'INSTALLA APP',
      btnEcoSys: 'ECOSISTEMA',
      btnEcoModules: 'ALTRI MODULI',
      iosHintTitle: 'Installa su iPhone',
      iosHintText: 'Per aggiungere BUSNET alla schermata Home bastano 2 passaggi:',
      iosHintStep1: '1. Tocca l\'icona "Condividi" in basso su Safari',
      iosHintStep2: '2. Seleziona "Aggiungi a schermata Home"',
      iosHintGotIt: 'Ho capito',
      modulesModalTitle: 'Moduli dell\'ecosistema',
      modulesModalText: 'BUSNET è una piattaforma unica. Apri questo indirizzo sul telefono per installare la PWA:',
    },
    confidence: {
      title: 'SICUREZZA E',
      titleAccent: 'AFFIDABILITÀ',
      items: [
        { title: 'Assicurazione', desc: 'Ogni passeggero è assicurato fino a €30.000 per tutta la tratta.', icon: 'shield' },
        { title: 'Supporto 24/7', desc: 'Agenti AI e operatori umani pronti ad aiutarti in qualsiasi momento.', icon: 'support' },
        { title: 'Rimborsi', desc: 'Rimborso garantito al 100% per cancellazioni effettuate con 24h di anticipo.', icon: 'refund' }
      ]
    },
    seo: {
      title: 'Autobus per l\'Europa | Biglietti Online',
      desc: 'Busnet UA offre collegamenti in pullman veloci ed economici tra Ucraina, Polonia, Italia, Germania e il resto d\'Europa. Algoritmi intelligenti per pianificare il viaggio perfetto in pochi secondi.'
    }
  }
};

// Backward-compatibility non-enumerable alias for UA (does not pollute Object.keys)
Object.defineProperty(translations, 'UA', {
  value: translations.UK,
  enumerable: false,
  writable: true,
  configurable: true,
});
