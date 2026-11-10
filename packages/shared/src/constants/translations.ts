export type Language = 'UK' | 'EN' | 'IT';

export interface TranslationSchema {
  header: {
    routes: string;
    partners: string;
    forum: string;
    bookingBadge: string;
    login: string;
    langLabel: string;
    logout: string;
    logoutFull: string;
    openMenu: string;
    closeMenu: string;
    changeLanguage: string;
    cabinet: string;
    cabinetCarrier: (company: string) => string;
    cabinetAdmin: string;
    cabinetAgent: string;
    cabinetDriver: string;
    profileOf: (name: string) => string;
    cabinetUnavailable: string;
  };
  hero: {
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    subtitleItems: string[];
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
    citiesFound: (count: number) => string;
    loadingCities: string;
    popularCities: string;
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
  results: {
    notFound: string;
    leadIntro: string;
    name: string;
    phone: string;
    send: string;
    sending: string;
    leadSent: string;
    leadError: string;
    found: (count: number) => string;
    perPassenger: string;
    inTransit: string;
    inRoad: string;
    seatsLeft: (count: number) => string;
    availableSeatsCount: (count: number) => string;
    soldOut: string;
    select: string;
    noTripsTitle: string;
    noTripsSubtitle: string;
    namePlaceholder: string;
    phonePlaceholder: string;
    sendRequest: string;
    sentTitle: string;
    sentDesc: string;
    privacyNotice: string;
    privacyLink: string;
    retry: string;
    loadError: string;
    dayPlus: (days: number) => string;
    priceOnRequest: string;
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
    navLabel: string;
    privacy: string;
    cookies: string;
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
    inAppTitle: string;
    inAppText: string;
    manualTitle: string;
    manualText: string;
  };
  confidence: {
    title: string;
    titleAccent: string;
    items: Array<{ title: string; desc: string; icon: string }>;
  };
  faq: {
    title: string;
    titleAccent: string;
    items: Array<{
      id: string;
      category: string;
      question: string;
      answer: string;
    }>;
  };
  booking: {
    back: string;
    toHome: string;
    step1Title: string;
    step1TitleAccent: string;
    step1Desc: string;
    step1Number: string;
    directTrip: string;
    inTransit: string;
    dayPlus: (days: number) => string;
    singleTicket: string;
    continue: string;
    step2Title: string;
    step2AuthHeader: string;
    step2AuthSub: string;
    loginTab: string;
    registerTab: string;
    authorizedAs: string;
    contactsHeader: string;
    emailLabel: string;
    phoneLabel: string;
    passengerNum: (num: number) => string;
    firstNameLabel: string;
    lastNameLabel: string;
    discountLabel: string;
    birthDateLabel: string;
    addPassenger: string;
    totalLabel: (count: number) => string;
    confirmButton: string;
    discounts: {
      none: string;
      child: string;
      child_50: string;
      child_30: string;
      student_10: string;
      senior_10: string;
    };
    step3Welcome: string;
    step3WelcomeSub: string;
    step3BookingNumber: string;
    step3CopyNumber: string;
    step3TotalToPay: string;
    step3EmailContact: string;
    step3GoToDashboard: string;
  };
  dashboard: {
    welcome: (name: string) => string;
    subtitle: string;
    activeTickets: string;
    totalTrips: string;
    bonusPoints: string;
    passengers: string;
    nearestTrip: string;
    ticketConfirmed: string;
    from: string;
    to: string;
    date: string;
    departure: string;
    seats: string;
    boardingPass: string;
    allTickets: string;
    noActiveTrips: string;
    noActiveTripsSub: string;
    findTicket: string;
    offerBadge: string;
    offerTitle: string;
    offerDesc: string;
    bookNow: string;
    tabs: {
      overview: string;
      tickets: string;
      passengers: string;
      bonuses: string;
      search: string;
      notifications: string;
      support: string;
      forum: string;
      profile: string;
      settings: string;
      history: string;
    };
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
      bookingBadge: 'Бронювання 24/7',
      login: 'Увійти',
      langLabel: 'Мова',
      logout: 'Вихід',
      logoutFull: 'Вийти з акаунта',
      openMenu: 'Відкрити меню',
      closeMenu: 'Закрити меню',
      changeLanguage: 'Змінити мову',
      cabinet: 'Особистий кабінет',
      cabinetCarrier: (c) => `Кабінет: ${c}`,
      cabinetAdmin: 'Панель адміністратора',
      cabinetAgent: 'Кабінет агента',
      cabinetDriver: 'Кабінет водія',
      profileOf: (n) => `Профіль: ${n}`,
      cabinetUnavailable: 'Кабінет тимчасово недоступний',
    },
    hero: {
      titleLine1: 'Європа ближче',
      titleLine2: 'ніж здається',
      subtitle: 'Знайди рейс • Бронюй онлайн • Оплачуй при посадці',
      subtitleItems: ['Знайди рейс', 'Бронюй онлайн', 'Оплачуй при посадці'],
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
      search: 'Пошук',
      placeholderFrom: 'Місто відправлення...',
      placeholderTo: 'Куди прямуєте?',
      today: 'Сьогодні',
      swap: 'Поміняти місцями',
      clear: 'Очистити поле',
      cityNotFound: 'Місто не знайдено',
      citiesFound: (n) => `Знайдено міст: ${n}`,
      loadingCities: 'Завантаження міст...',
      popularCities: 'Популярні міста',
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
    results: {
      notFound: 'Рейсів не знайдено',
      leadIntro: 'Введіть ваші дані, і оператор підбере найкращий варіант перевезення.',
      name: "Ваше ім'я",
      phone: 'Номер телефону',
      send: 'ВІДПРАВИТИ ЗАПИТ',
      sending: 'Відправка...',
      leadSent: "Запит надіслано! Оператор зв'яжеться з вами найближчим часом.",
      leadError: 'Не вдалося надіслати запит. Перевірте зʼєднання або зателефонуйте нам.',
      found: (c) => `Знайдено результатів: ${c}`,
      perPassenger: 'Ціни вказані за 1 пасажира',
      inTransit: 'в дорозі',
      inRoad: 'в дорозі',
      seatsLeft: (c) => `Залишилось місць: ${c}`,
      availableSeatsCount: (c) => `Вільних місць: ${c}`,
      soldOut: 'Місць немає',
      select: 'ВИБРАТИ',
      noTripsTitle: 'Рейсів не знайдено',
      noTripsSubtitle: 'Введіть ваші дані, і оператор підбере найкращий варіант перевезення.',
      namePlaceholder: "Ваше ім'я",
      phonePlaceholder: '+380 або міжнародний номер',
      sendRequest: 'ВІДПРАВИТИ ЗАПИТ',
      sentTitle: 'Запит надіслано!',
      sentDesc: "Наш оператор зв'яжеться з вами найближчим часом для підбору рейсу.",
      privacyNotice: 'Натискаючи кнопку, ви погоджуєтеся на обробку персональних даних згідно з',
      privacyLink: 'Політикою конфіденційності',
      retry: 'Спробувати знову',
      loadError: 'Не вдалося завантажити рейси. Виникла помилка зʼєднання.',
      dayPlus: (d) => `+${d} д.`,
      priceOnRequest: 'Уточнюйте',
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
      rights: `© ${new Date().getFullYear()} BUSNET UA. Всі права захищені.`,
      about: 'Про нас',
      contacts: 'Контакти',
      terms: 'Умови сервісу',
      navLabel: 'Навігація сайтом',
      privacy: 'Політика конфіденційності',
      cookies: 'Файли cookie',
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
      iosHintStep1: 'Натисніть кнопку "Поділитися" на панелі Safari',
      iosHintStep2: 'Оберіть "На початковий екран" зі списку дій',
      iosHintGotIt: 'Зрозуміло',
      modulesModalTitle: 'Модулі екосистеми',
      modulesModalText: 'BUSNET — це єдина платформа мікросервісів. Відкрийте потрібне посилання на телефоні для встановлення PWA:',
      inAppTitle: 'Відкрийте у браузері',
      inAppText: 'Щоб встановити додаток, відкрийте цю сторінку в Safari (iOS) або Chrome (Android).',
      manualTitle: 'Встановлення додатка',
      manualText: 'Для встановлення на комп’ютері натисніть значок встановлення в адресному рядку браузера.',
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
    faq: {
      title: 'Часті запитання',
      titleAccent: '(FAQ)',
      items: [
        {
          id: 'baggage-allowance',
          category: 'Багаж',
          question: 'Скільки багажу включено у вартість квитка на автобус Україна — Італія?',
          answer: 'У стандартний квиток BUSNET включено:\n• 1 місце ручної поклажі (до 5 кг, розмір до 40×30×20 см) у салон автобуса.\n• 1 або 2 основні валізи в багажне відділення (загальною вагою до 30-40 кг залежно від перевізника, зазвичай сума вимірів до 160 см).\n\nДодатковий багаж або негабаритні речі узгоджуються з диспетчером перед поїздкою.'
        },
        {
          id: 'pay-to-driver',
          category: 'Оплата',
          question: 'Чи можна забронювати квиток без передоплати та оплатити водієві при посадці?',
          answer: 'Так, у сервісі BUSNET діє зручна послуга безкоштовного онлайн-бронювання місця без введення банківської картки.\n\nВи бронюєте місце на сайті, отримуєте квиток із номером місця, а оплачуєте готівкою екіпажу при посадці в автобус (євро € або гривні ₴).'
        },
        {
          id: 'departure-stations',
          category: 'Маршрути та вокзали',
          question: 'Звідки саме відправляються та куди прибувають автобуси у Римі, Мілані, Києві, Львові?',
          answer: 'Регулярні точки посадки:\n• Київ: Центральний автовокзал (Деміївська площа, 3) та АС «Київ» (вул. С. Петлюри, 32).\n• Львів: Центральний автовокзал (вул. Стрийська, 109).\n• Рим (Roma): Autostazione Tiburtina.\n• Мілан (Milano): Автостанція Lampugnano.\n• Болонья: Autostazione di Bologna.'
        },
        {
          id: 'travel-with-pets',
          category: 'Тварини',
          question: 'Чи дозволено перевезення домашніх тварин (котів, собак) до Італії?',
          answer: 'Так, перевезення котів та невеликих собак (до 8-10 кг) можливе за попереднім погодженням з перевізником у переносці з твердим водонепроникним дном та з міжнародним ветпаспортом і чіпом.'
        },
        {
          id: 'bus-amenities',
          category: 'Комфорт у дорозі',
          question: 'Які зручності є в автобусах на рейсах між Україною та Італією?',
          answer: 'Усі міжнародні рейси BUSNET обслуговуються сучасними туристичними автобусами (Van Hool, Setra, Mercedes-Benz).\n\nНа борту є: Wi-Fi, розетки 220V та USB, клімат-контроль, сидіння зі збільшеним простором для ніг, біотуалет та гарячі напої.'
        }
      ]
    },
    booking: {
      back: 'Назад',
      toHome: 'На головну',
      step1Title: 'Підтвердження',
      step1TitleAccent: 'вибору',
      step1Desc: 'Перевірте маршрут і час перед введенням даних',
      step1Number: 'Крок 1 із 3',
      directTrip: 'Прямий рейс',
      inTransit: 'в дорозі',
      dayPlus: (days: number) => `+${days} д.`,
      singleTicket: '1 квиток',
      continue: 'Продовжити',
      step2Title: 'Пасажири та контакти',
      step2AuthHeader: 'Авторизація',
      step2AuthSub: 'Для підтвердження збереження квитків',
      loginTab: 'Вхід',
      registerTab: 'Реєстрація',
      authorizedAs: 'Ви авторизовані',
      contactsHeader: 'Контактна інформація',
      emailLabel: 'Email (для квитка)',
      phoneLabel: 'Номер телефону',
      passengerNum: (num: number) => `ПАСАЖИР 0${num}`,
      firstNameLabel: "Ім'я",
      lastNameLabel: 'Прізвище',
      discountLabel: 'Знижка',
      birthDateLabel: 'Дата народження (для підтвердження знижки)',
      addPassenger: 'Додати пасажира',
      totalLabel: (count: number) => `Загальна вартість (${count} пас.)`,
      confirmButton: 'Підтвердити квитки',
      discounts: {
        none: 'Без знижки (Повний)',
        child: 'Дитячий',
        child_50: 'Діти до 4 років (-50%)',
        child_30: 'Діти від 4 до 12 років (-30%)',
        student_10: 'Студенти (-10%)',
        senior_10: 'Пенсіонери 60+ (-10%)'
      },
      step3Welcome: 'Вітаємо в Busnet!',
      step3WelcomeSub: 'Ваше бронювання успішно оформлено та збережено в кабінеті.',
      step3BookingNumber: 'Номер бронювання',
      step3CopyNumber: 'Скопіювати номер',
      step3TotalToPay: 'Сума до сплати / сплачено',
      step3EmailContact: 'Контактний Email',
      step3GoToDashboard: 'Перейти до кабінету'
    },
    dashboard: {
      welcome: (name: string) => `Привіт, ${name}! 👋`,
      subtitle: 'Ваш персональний кабінет рейсів Україна — Італія (BUSNET)',
      activeTickets: 'Активні квитки',
      totalTrips: 'Всього поїздок',
      bonusPoints: 'Бонусні бали',
      passengers: 'Пасажири',
      nearestTrip: 'Найближчий запланований рейс',
      ticketConfirmed: 'Квиток підтверджено',
      from: 'Звідки',
      to: 'Куди',
      date: 'Дата',
      departure: 'Відправлення',
      seats: 'Місця',
      boardingPass: 'Посадковий талон',
      allTickets: 'Всі квитки',
      noActiveTrips: 'Активних поїздок не заплановано',
      noActiveTripsSub: 'Оберіть потрібний рейс онлайн — розрахунок готівкою з водієм перед виїздом.',
      findTicket: 'Знайти квиток',
      offerBadge: 'Спеціальна пропозиція',
      offerTitle: 'Прямі рейси до Риму, Мілана та Болоньї',
      offerDesc: 'Бронюйте місця заздалегідь без передоплати. Оплата готівкою водієві при посадці в автобус.',
      bookNow: 'Забронювати квиток',
      tabs: {
        overview: 'Огляд',
        tickets: 'Мої квитки',
        passengers: 'Пасажири',
        bonuses: 'Бонуси',
        search: 'Пошук',
        notifications: 'Сповіщення',
        support: 'Підтримка',
        forum: 'Форум',
        profile: 'Профіль',
        settings: 'Налаштування',
        history: 'Історія'
      }
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
      bookingBadge: 'Booking 24/7',
      login: 'Log in',
      langLabel: 'Language',
      logout: 'Log out',
      logoutFull: 'Log out of account',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      changeLanguage: 'Change language',
      cabinet: 'Personal Cabinet',
      cabinetCarrier: (c) => `Carrier: ${c}`,
      cabinetAdmin: 'Admin Panel',
      cabinetAgent: 'Agent Cabinet',
      cabinetDriver: 'Driver Cabinet',
      profileOf: (n) => `Profile: ${n}`,
      cabinetUnavailable: 'Cabinet is temporarily unavailable',
    },
    hero: {
      titleLine1: 'Europe is closer',
      titleLine2: 'than you think',
      subtitle: 'Find a trip • Book online • Pay on boarding',
      subtitleItems: ['Find a trip', 'Book online', 'Pay on boarding'],
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
      search: 'Search',
      placeholderFrom: 'Departure city...',
      placeholderTo: 'Where are you going?',
      today: 'Today',
      swap: 'Swap cities',
      clear: 'Clear field',
      cityNotFound: 'City not found',
      citiesFound: (n) => `Cities found: ${n}`,
      loadingCities: 'Loading cities...',
      popularCities: 'Popular cities',
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
    results: {
      notFound: 'No routes found',
      leadIntro: 'Enter your details and our operator will find the best option for you.',
      name: 'Your name',
      phone: 'Phone number',
      send: 'Send request',
      sending: 'Sending...',
      leadSent: 'Request sent! Our operator will contact you shortly.',
      leadError: 'Failed to send request. Please check your connection or call us.',
      found: (c) => `Results found: ${c}`,
      perPassenger: 'Prices are per 1 passenger',
      inTransit: 'in travel',
      inRoad: 'in travel',
      seatsLeft: (c) => `Only ${c} seats left`,
      availableSeatsCount: (c) => `Available seats: ${c}`,
      soldOut: 'Sold out',
      select: 'Select',
      noTripsTitle: 'No routes found',
      noTripsSubtitle: 'Enter your details and our operator will find the best option for you.',
      namePlaceholder: 'Your name',
      phonePlaceholder: '+380 or international number',
      sendRequest: 'Send request',
      sentTitle: 'Request sent!',
      sentDesc: 'Our operator will contact you shortly to select the best route.',
      privacyNotice: 'By submitting, you agree to the processing of personal data under our',
      privacyLink: 'Privacy Policy',
      retry: 'Try again',
      loadError: 'Failed to load routes. Connection error.',
      dayPlus: (d) => `+${d} d.`,
      priceOnRequest: 'On request',
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
      rights: `© ${new Date().getFullYear()} BUSNET UA. All rights reserved.`,
      about: 'About Us',
      contacts: 'Contacts',
      terms: 'Terms of Service',
      navLabel: 'Site navigation',
      privacy: 'Privacy Policy',
      cookies: 'Cookie Policy',
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
      iosHintStep1: 'Tap the "Share" button at the bottom of Safari',
      iosHintStep2: 'Choose "Add to Home Screen" from the menu',
      iosHintGotIt: 'Got it',
      modulesModalTitle: 'Ecosystem Modules',
      modulesModalText: 'BUSNET is a unified microservice platform. Open this page on your phone to install:',
      inAppTitle: 'Open in browser',
      inAppText: 'To install the app, open this page in Safari (iOS) or Chrome (Android).',
      manualTitle: 'Install app',
      manualText: 'To install on desktop, click the install icon in your browser address bar.',
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
    faq: {
      title: 'Frequently Asked',
      titleAccent: 'Questions (FAQ)',
      items: [
        {
          id: 'baggage-allowance',
          category: 'Luggage',
          question: 'How much baggage is included in the bus ticket price Ukraine — Italy?',
          answer: 'The standard BUSNET ticket includes:\n• 1 carry-on piece (up to 5 kg, dimensions up to 40×30×20 cm) in the bus cabin.\n• 1 or 2 main suitcases in the luggage compartment (total weight up to 30-40 kg depending on the carrier).\n\nAdditional luggage must be agreed with the dispatcher prior to travel.'
        },
        {
          id: 'pay-to-driver',
          category: 'Payment',
          question: 'Can I book a ticket without prepayment and pay the driver upon boarding?',
          answer: 'Yes! BUSNET provides convenient free online seat booking without entering bank card details.\n\nYou book your seat online and pay in cash directly to the bus crew when boarding (accepted in EUR € or UAH ₴).'
        },
        {
          id: 'departure-stations',
          category: 'Routes & Stations',
          question: 'Where exactly do buses depart and arrive in Rome, Milan, Kyiv, and Lviv?',
          answer: 'Regular stations:\n• Kyiv: Central Bus Station (Demiivska Sq., 3) and Bus Station Kyiv (32 S. Petliury St.).\n• Lviv: Central Bus Station (109 Stryiska St.).\n• Rome (Roma): Autostazione Tiburtina.\n• Milan (Milano): Lampugnano Bus Station.\n• Bologna: Autostazione di Bologna.'
        },
        {
          id: 'travel-with-pets',
          category: 'Pets',
          question: 'Is it allowed to travel with pets (cats, dogs) to Italy?',
          answer: 'Yes, transporting cats and small dogs (up to 8-10 kg) is permitted with prior carrier consent in a secure carrier box with an international veterinary passport and microchip.'
        },
        {
          id: 'bus-amenities',
          category: 'Comfort',
          question: 'What amenities are available on buses between Ukraine and Italy?',
          answer: 'All international BUSNET trips are serviced by modern coaches (Van Hool, Setra, Mercedes-Benz).\n\nOnboard features: Free Wi-Fi, 220V and USB outlets, climate control, ergonomic reclining seats with extra legroom, restroom, and hot drinks.'
        }
      ]
    },
    booking: {
      back: 'Back',
      toHome: 'To Home',
      step1Title: 'Selection',
      step1TitleAccent: 'Confirmation',
      step1Desc: 'Review the route and departure time before entering details',
      step1Number: 'Step 1 of 3',
      directTrip: 'Direct Trip',
      inTransit: 'in transit',
      dayPlus: (days: number) => `+${days} d.`,
      singleTicket: '1 ticket',
      continue: 'Continue',
      step2Title: 'Passengers & Contacts',
      step2AuthHeader: 'Authentication',
      step2AuthSub: 'To ensure your tickets are securely saved',
      loginTab: 'Sign In',
      registerTab: 'Register',
      authorizedAs: 'Signed In',
      contactsHeader: 'Contact Information',
      emailLabel: 'Email (for ticket delivery)',
      phoneLabel: 'Phone number',
      passengerNum: (num: number) => `PASSENGER 0${num}`,
      firstNameLabel: 'First Name',
      lastNameLabel: 'Last Name',
      discountLabel: 'Discount',
      birthDateLabel: 'Date of Birth (to verify discount eligibility)',
      addPassenger: 'Add Passenger',
      totalLabel: (count: number) => `Total Price (${count} pax)`,
      confirmButton: 'Confirm Booking',
      discounts: {
        none: 'Standard (Full Fare)',
        child: 'Child Fare',
        child_50: 'Children under 4 yrs (-50%)',
        child_30: 'Children 4 to 12 yrs (-30%)',
        student_10: 'Students (-10%)',
        senior_10: 'Seniors 60+ (-10%)'
      },
      step3Welcome: 'Welcome to Busnet!',
      step3WelcomeSub: 'Your booking has been successfully issued and saved to your dashboard.',
      step3BookingNumber: 'Booking Number',
      step3CopyNumber: 'Copy Number',
      step3TotalToPay: 'Amount Due / Paid',
      step3EmailContact: 'Contact Email',
      step3GoToDashboard: 'Go to Dashboard'
    },
    dashboard: {
      welcome: (name: string) => `Hello, ${name}! 👋`,
      subtitle: 'Your personal Ukraine — Italy travel dashboard (BUSNET)',
      activeTickets: 'Active Tickets',
      totalTrips: 'Total Trips',
      bonusPoints: 'Bonus Points',
      passengers: 'Saved Passengers',
      nearestTrip: 'Next Scheduled Trip',
      ticketConfirmed: 'Ticket Confirmed',
      from: 'From',
      to: 'To',
      date: 'Date',
      departure: 'Departure',
      seats: 'Seats',
      boardingPass: 'Boarding Pass',
      allTickets: 'All Tickets',
      noActiveTrips: 'No active trips scheduled',
      noActiveTripsSub: 'Choose your route online — pay cash to driver before departure.',
      findTicket: 'Search Tickets',
      offerBadge: 'Special Offer',
      offerTitle: 'Direct routes to Rome, Milan & Bologna',
      offerDesc: 'Book seats in advance without prepayment. Pay cash to driver upon boarding.',
      bookNow: 'Book a Ticket',
      tabs: {
        overview: 'Overview',
        tickets: 'My Tickets',
        passengers: 'Passengers',
        bonuses: 'Bonus Points',
        search: 'Search Trips',
        notifications: 'Notifications',
        support: 'Support 24/7',
        forum: 'Travelers Forum',
        profile: 'Profile',
        settings: 'Settings',
        history: 'Trip History'
      }
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
      bookingBadge: 'Prenotazioni 24/7',
      login: 'Accedi',
      langLabel: 'Lingua',
      logout: 'Esci',
      logoutFull: "Esci dall'account",
      openMenu: 'Apri menu',
      closeMenu: 'Chiudi menu',
      changeLanguage: 'Cambia lingua',
      cabinet: 'Area personale',
      cabinetCarrier: (c) => `Vettore: ${c}`,
      cabinetAdmin: 'Pannello di controllo',
      cabinetAgent: 'Area Agente',
      cabinetDriver: 'Area Autista',
      profileOf: (n) => `Profilo: ${n}`,
      cabinetUnavailable: 'Area personale temporaneamente non disponibile',
    },
    hero: {
      titleLine1: "L'Europa è più vicina",
      titleLine2: 'di quanto pensi',
      subtitle: 'Trova il viaggio • Prenota online • Paga a bordo',
      subtitleItems: ['Trova il viaggio', 'Prenota online', 'Paga a bordo'],
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
      search: 'Cerca',
      placeholderFrom: 'Città di partenza...',
      placeholderTo: 'Dove vuoi andare?',
      today: 'Oggi',
      swap: 'Inverti città',
      clear: 'Cancella campo',
      cityNotFound: 'Città non trovata',
      citiesFound: (n) => `Città trovate: ${n}`,
      loadingCities: 'Caricamento città...',
      popularCities: 'Città popolari',
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
    results: {
      notFound: 'Nessun viaggio trovato',
      leadIntro: "Inserisci i tuoi dati e il nostro operatore troverà l'opzione migliore per te.",
      name: 'Il tuo nome',
      phone: 'Numero di telefono',
      send: 'Invia richiesta',
      sending: 'Invio in corso...',
      leadSent: 'Richiesta inviata! Il nostro operatore ti contatterà al più presto.',
      leadError: 'Impossibile inviare la richiesta. Verifica la connessione o contattaci.',
      found: (c) => `Risultati trovati: ${c}`,
      perPassenger: 'Prezzi per 1 passeggero',
      inTransit: 'durata',
      inRoad: 'durata',
      seatsLeft: (c) => `Solo ${c} posti rimasti`,
      availableSeatsCount: (c) => `Posti liberi: ${c}`,
      soldOut: 'Esaurito',
      select: 'Seleziona',
      noTripsTitle: 'Nessun viaggio trovato',
      noTripsSubtitle: "Inserisci i tuoi dati e il nostro operatore troverà l'opzione migliore per te.",
      namePlaceholder: 'Il tuo nome',
      phonePlaceholder: '+39 o numero internazionale',
      sendRequest: 'Invia richiesta',
      sentTitle: 'Richiesta inviata!',
      sentDesc: 'Il nostro operatore ti contatterà al più presto per trovare il percorso ideale.',
      privacyNotice: 'Inviando la richiesta accetti il trattamento dei dati personali secondo la',
      privacyLink: 'Privacy Policy',
      retry: 'Riprova',
      loadError: 'Impossibile caricare i viaggi. Errore di connessione.',
      dayPlus: (d) => `+${d} g.`,
      priceOnRequest: 'Su richiesta',
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
      rights: `© ${new Date().getFullYear()} BUSNET UA. Tutti i diritti riservati.`,
      about: 'Chi siamo',
      contacts: 'Contatti',
      terms: 'Termini di servizio',
      navLabel: 'Navigazione sito',
      privacy: 'Informativa sulla privacy',
      cookies: 'Politica sui cookie',
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
      iosHintStep1: 'Tocca l\'icona "Condividi" in basso su Safari',
      iosHintStep2: 'Seleziona "Aggiungi a schermata Home"',
      iosHintGotIt: 'Ho capito',
      modulesModalTitle: 'Moduli dell\'ecosistema',
      modulesModalText: 'BUSNET è una piattaforma unica. Apri questo indirizzo sul telefono per installare la PWA:',
      inAppTitle: 'Apri nel browser',
      inAppText: 'Per installare l\'app, apri questa pagina in Safari (iOS) o Chrome (Android).',
      manualTitle: 'Installazione dell\'app',
      manualText: 'Per installare sul computer, fai clic sull\'icona di installazione nella barra degli indirizzi.',
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
    faq: {
      title: 'Domande',
      titleAccent: 'Frequenti (FAQ)',
      items: [
        {
          id: 'baggage-allowance',
          category: 'Bagagli',
          question: 'Quanti bagagli sono inclusi nel prezzo del biglietto Ucraina — Italia?',
          answer: 'Il biglietto standard BUSNET include:\n• 1 bagaglio a mano (fino a 5 kg, dimensioni max 40×30×20 cm) a bordo.\n• 1 o 2 valigie nel vano bagagli (peso totale fino a 30-40 kg a seconda del vettore).\n\nBagagli extra vanno concordati con l\'assistenza prima della partenza.'
        },
        {
          id: 'pay-to-driver',
          category: 'Pagamento',
          question: 'È possibile prenotare il biglietto senza anticipo e pagare all\'autista alla salita?',
          answer: 'Sì! BUSNET offre la prenotazione online gratuita del posto senza carta di credito.\n\nPrenoti online e paghi l\'intero importo in contanti all\'equipaggio durante la salita a bordo (in Euro € o Hryvnia ₴).'
        },
        {
          id: 'departure-stations',
          category: 'Tratte & Autostazioni',
          question: 'Da dove partono e dove arrivano esattamente i pullman a Roma, Milano, Kiev e Leopoli?',
          answer: 'Fermate regolari:\n• Kiev: Autostazione Centrale (Demiivska 3) e AS Kyiv (via S. Petliury 32).\n• Leopoli (Lviv): Autostazione Centrale (via Stryiska 109).\n• Roma: Autostazione Tiburtina.\n• Milano: Autostazione Lampugnano.\n• Bologna: Autostazione di Bologna.'
        },
        {
          id: 'travel-with-pets',
          category: 'Animali',
          question: 'È consentito il trasporto di animali domestici (cani, gatti) verso l\'Italia?',
          answer: 'Sì, il trasporto di gatti e cani di piccola taglia (fino a 8-10 kg) è consentito previo accordo in trasportino rigido con passaporto veterinario internazionale e microchip.'
        },
        {
          id: 'bus-amenities',
          category: 'Comfort a bordo',
          question: 'Quali comfort sono presenti sui pullman tra l\'Ucraina e l\'Italia?',
          answer: 'Tutte le linee internazionali BUSNET sono operate da moderni autobus granturismo (Van Hool, Setra, Mercedes-Benz).\n\nA bordo: Wi-Fi gratuito, prese 220V e USB, aria condizionata, sedili reclinabili, bagno chimico e bevande calde.'
        }
      ]
    },
    booking: {
      back: 'Indietro',
      toHome: 'Alla Home',
      step1Title: 'Conferma',
      step1TitleAccent: 'della scelta',
      step1Desc: 'Controlla tratta e orario prima di inserire i tuoi dati',
      step1Number: 'Passo 1 di 3',
      directTrip: 'Viaggio Diretto',
      inTransit: 'di viaggio',
      dayPlus: (days: number) => `+${days} g.`,
      singleTicket: '1 biglietto',
      continue: 'Continua',
      step2Title: 'Passeggeri e Contatti',
      step2AuthHeader: 'Autenticazione',
      step2AuthSub: 'Per salvare i tuoi biglietti in modo sicuro',
      loginTab: 'Accedi',
      registerTab: 'Registrati',
      authorizedAs: 'Autenticato come',
      contactsHeader: 'Informazioni di Contatto',
      emailLabel: 'Email (per il biglietto)',
      phoneLabel: 'Numero di telefono',
      passengerNum: (num: number) => `PASSEGGERO 0${num}`,
      firstNameLabel: 'Nome',
      lastNameLabel: 'Cognome',
      discountLabel: 'Sconto',
      birthDateLabel: 'Data di nascita (per confermare lo sconto)',
      addPassenger: 'Aggiungi Passeggero',
      totalLabel: (count: number) => `Prezzo totale (${count} pass.)`,
      confirmButton: 'Conferma Prenotazione',
      discounts: {
        none: 'Senza sconto (Intero)',
        child: 'Tariffa Bambini',
        child_50: 'Bambini fino a 4 anni (-50%)',
        child_30: 'Bambini da 4 a 12 anni (-30%)',
        student_10: 'Studenti (-10%)',
        senior_10: 'Over 60 (-10%)'
      },
      step3Welcome: 'Benvenuto in Busnet!',
      step3WelcomeSub: 'La tua prenotazione è stata emessa e salvata nella tua area personale.',
      step3BookingNumber: 'Numero di prenotazione',
      step3CopyNumber: 'Copia numero',
      step3TotalToPay: 'Totale da pagare / pagato',
      step3EmailContact: 'Email di contatto',
      step3GoToDashboard: 'Vai all\'Area Personale'
    },
    dashboard: {
      welcome: (name: string) => `Ciao, ${name}! 👋`,
      subtitle: 'La tua area personale per i viaggi Ucraina — Italia (BUSNET)',
      activeTickets: 'Biglietti Attivi',
      totalTrips: 'Viaggi Totali',
      bonusPoints: 'Punti Fedeltà',
      passengers: 'Passeggeri Salvati',
      nearestTrip: 'Prossimo Viaggio in Programma',
      ticketConfirmed: 'Biglietto Confermato',
      from: 'Da',
      to: 'A',
      date: 'Data',
      departure: 'Partenza',
      seats: 'Posti',
      boardingPass: 'Carta d\'Imbarco',
      allTickets: 'Tutti i Biglietti',
      noActiveTrips: 'Nessun viaggio attivo programmato',
      noActiveTripsSub: 'Scegli la tua tratta online — paga in contanti all\'autista prima della partenza.',
      findTicket: 'Cerca Biglietti',
      offerBadge: 'Offerta Speciale',
      offerTitle: 'Linee dirette per Roma, Milano e Bologna',
      offerDesc: 'Prenota i posti in anticipo senza anticipo. Pagamento in contanti alla salita.',
      bookNow: 'Prenota Biglietto',
      tabs: {
        overview: 'Panoramica',
        tickets: 'I Miei Biglietti',
        passengers: 'Passeggeri',
        bonuses: 'Programma Fedeltà',
        search: 'Cerca Corse',
        notifications: 'Notifiche',
        support: 'Assistenza 24/7',
        forum: 'Forum Viaggiatori',
        profile: 'Profilo',
        settings: 'Impostazioni',
        history: 'Storico Viaggi'
      }
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
