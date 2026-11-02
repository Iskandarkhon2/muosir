/**
 * store.js - Central Data Store for Muosir Plast
 * Manages reactive data state, persistence (localStorage), and sync between Admin & Landing.
 * Fully aligned with all 27 points of the Technical Specification (ТЗ).
 */

const STORAGE_KEY = 'muosir_plast_data_v2';
const LEADS_KEY = 'muosir_plast_leads_v2';

// Default initial state
const DEFAULT_DATA = {
  company: {
    name: "Муосир пласт",
    nameEn: "Muosir Plast",
    tagline: "Пластиковая упаковка напрямую от производителя из Таджикистана",
    taglineEn: "Plastic packaging directly from manufacturer in Tajikistan",
    taglineUz: "Tojikistondan to'g'ridan-to'g'ri ishlab chiqaruvchi plastik qadoqlar",
    taglineKk: "Тәжікстаннан тікелей өндірушіден пластикалық қаптама",
    subtagline: "Производство и поставка пластиковой упаковки для производителей продуктов питания, молочной, кондитерской и другой продукции. Оптовые и экспортные поставки.",
    subtaglineEn: "Mass production and wholesale export supply of plastic packaging for food, dairy, confectionery and other manufacturing industries.",
    subtaglineUz: "Oziq-ovqat, sut va qandolatchilik mahsulotlari uchun qattiq polimer qadoqlash vositalarini seriyali ishlab chiqarish va eksport qilish.",
    subtaglineKk: "Азық-түлік, сүт және кондитерлік өнімдер өндірушілеріне арналған сапалы полимерлі қаптамаларды сериялық өндіру және экспорттау.",
    phone: "+992 92 299 2000",
    phoneClean: "992922992000",
    whatsapp: "+992 92 299 2000",
    email: "export@muosirplast.tj",
    address: "Республика Таджикистан, Согдийская область, г. Худжанд, промышленная зона",
    addressEn: "Republic of Tajikistan, Sughd Region, Khujand city, Industrial Zone",
    addressUz: "Tojikiston Respublikasi, Sug'd viloyati, Xo'jand shahri, sanoat zonasi",
    addressKk: "Тәжікстан Республикасы, Соғды облысы, Худжанд қаласы, өндірістік аймақ",
    website: "https://muosirplast.tj",
    instagram: "https://instagram.com/muosirplast",
    facebook: "https://facebook.com/muosirplast",
    catalogPdfUrl: "assets/docs/muosir-plast-export-catalog.pdf",
    metaPixelId: "",
    ga4MeasurementId: "",
    telegramWebhookUrl: "",
    crmWebhookUrl: ""
  },
  stats: [
    { id: "years", number: "12+", label: "лет на рынке", labelEn: "years in manufacturing", labelUz: "yil bozorda", labelKk: "жыл нарықта" },
    { id: "products", number: "65+", label: "видов продукции", labelEn: "product SKUs", labelUz: "tur mahsulot", labelKk: "түрлі өнім" },
    { id: "lines", number: "14", label: "производственных линий", labelEn: "production lines", labelUz: "ishlab chiqarish liniyasi", labelKk: "өндірістік желі" },
    { id: "capacity", number: "18+ млн", label: "мощность (шт/мес)", labelEn: "monthly capacity (units)", labelUz: "oylik quvvat (dona)", labelKk: "қуаттылық (дана/ай)" },
    { id: "clients", number: "320+", label: "B2B клиентов", labelEn: "B2B clients", labelUz: "B2B mijozlar", labelKk: "B2B клиенттер" },
    { id: "countries", number: "5+", label: "стран экспорта", labelEn: "export destinations", labelUz: "eksport mamlakatlari", labelKk: "экспорт елдері" }
  ],
  categories: [
    { id: "all", name: "Вся продукция", nameEn: "All Products", nameUz: "Barcha mahsulotlar", nameKk: "Барлық өнімдер" },
    { id: "dairy", name: "Упаковка для молочной продукции", nameEn: "Dairy Packaging", nameUz: "Sut mahsulotlari uchun", nameKk: "Сүт өнімдеріне арналған" },
    { id: "eggs", name: "Упаковка для яиц", nameEn: "Egg Packaging", nameUz: "Tuxum qutilari", nameKk: "Жұмыртқа қаптамасы" },
    { id: "confectionery", name: "Упаковка для кондитерских изделий", nameEn: "Confectionery Packaging", nameUz: "Qandolatchilik idishlari", nameKk: "Кондитерлік қаптама" },
    { id: "containers", name: "Контейнеры для пищевых продуктов", nameEn: "Food Containers", nameUz: "Oziq-ovqat konteynerlari", nameKk: "Тағамдық контейнерлер" },
    { id: "cups", name: "Стаканы и крышки", nameEn: "Cups & Lids", nameUz: "Stakanlar va qopqoqlar", nameKk: "Стақандар мен қақпақтар" }
  ],
  products: [
    {
      id: "prod-1",
      categoryId: "dairy",
      title: "Стакан для сметаны и йогурта 400 мл (Ø 95 мм)",
      titleEn: "Sour cream & yogurt cup 400 ml (Ø 95 mm)",
      titleUz: "Smetana va yogurt uchun stakan 400 ml (Ø 95 mm)",
      titleKk: "Қаймақ пен йогуртқа арналған стақан 400 мл (Ø 95 мм)",
      volume: "400 мл",
      diameter: "Ø 95 мм, H 115 мм",
      material: "PP (Полипропилен)",
      color: "Белый / Прозрачный / С печатью",
      boxQty: "1 000 шт.",
      minOrder: "50 000 шт.",
      image: "assets/images/product-dairy-cup.svg",
      desc: "Герметичный стакан под запайку платинкой из фольги или нахлобучку. Подходит для автоматических линий фасовки.",
      descEn: "Sealed cup suitable for aluminum foil sealing or snap-on lid. Designed for automated filling lines.",
      descUz: "Folga bilan payvandlanadigan va qopqoqli germetik stakan. Avtomatlashtirilgan quyish liniyalariga mos.",
      descKk: "Фольгамен дәнекерленетін немесе қақпақты герметикалық стақан. Автоматты желілерге арналған."
    },
    {
      id: "prod-2",
      categoryId: "dairy",
      title: "Стакан под творог и десерты 250 мл (Ø 95 мм)",
      titleEn: "Cottage cheese & dessert cup 250 ml (Ø 95 mm)",
      titleUz: "Tvorog va shirinliklar uchun stakan 250 ml (Ø 95 mm)",
      titleKk: "Сүзбе мен десертке арналған стақан 250 мл (Ø 95 мм)",
      volume: "250 мл",
      diameter: "Ø 95 мм, H 68 мм",
      material: "PP (Первичное сырье)",
      color: "Белый / Индивидуальный цвет",
      boxQty: "1 200 шт.",
      minOrder: "50 000 шт.",
      image: "assets/images/product-dairy-250.svg",
      desc: "Устойчив к глубокой заморозке и температурным перепадам. Прочный ободок под стандартную запайку.",
      descEn: "Resistant to deep freezing. Rigid rim for standard heat sealing.",
      descUz: "Muzlatishga chidamli. Standart payvandlash uchun mustahkam gardish.",
      descKk: "Мұздатуға төзімді. Фольгамен бекітуге арналған берік жиек."
    },
    {
      id: "prod-3",
      categoryId: "dairy",
      title: "Крышка-нахлобучка прозрачная Ø 95 мм",
      titleEn: "Transparent snap-on lid Ø 95 mm",
      titleUz: "Shaffof qopqoq Ø 95 mm",
      titleKk: "Мөлдір кигізілмелі қақпақ Ø 95 мм",
      volume: "Ø 95 мм",
      diameter: "Ø 95 мм, H 10 мм",
      material: "PET / PS",
      color: "Кристально прозрачный",
      boxQty: "2 000 шт.",
      minOrder: "50 000 шт.",
      image: "assets/images/product-lid-95.svg",
      desc: "Идеальная фиксация на стаканах 95 мм. Защищает продукт после снятия фольги.",
      descEn: "Perfect snap-fit on 95mm cups. Protects the product after foil seal is removed.",
      descUz: "95 mm stakanlarga aniq o'tiradi. Folga ochilgandan so'ng mahsulotni toza saqlaydi.",
      descKk: "95 мм стақандарға тығыз киіледі. Фольга алынғаннан кейін өнімді қорғайды."
    },
    {
      id: "prod-4",
      categoryId: "eggs",
      title: "Контейнер для яиц на 10 шт. (C0 / C1 / C2)",
      titleEn: "Egg container for 10 pcs (C0 / C1 / C2)",
      titleUz: "10 talik tuxum qutisi (C0 / C1 / C2)",
      titleKk: "10 жұмыртқаға арналған контейнер (C0 / C1 / C2)",
      volume: "10 яиц",
      diameter: "248 x 105 x 70 мм",
      material: "PET (Высокая прозрачность)",
      color: "Прозрачный",
      boxQty: "600 шт.",
      minOrder: "30 000 шт.",
      image: "assets/images/product-egg-10.svg",
      desc: "Усиленные ребра жесткости, надежный двойной замок. Безопасное штабелирование при транспортировке.",
      descEn: "Reinforced stiffening ribs, reliable dual snap locks. Safe stacking during transport.",
      descUz: "Qovurg'alari kuchaytirilgan, mustahkam ikkitalik qulf. Tashishda ustma-ust xavfsiz taxlanadi.",
      descKk: "Күшейтілген қаттылық қабырғалары, қос құлып. Тасымалдау кезінде қауіпсіз қабатталады."
    },
    {
      id: "prod-5",
      categoryId: "eggs",
      title: "Контейнер для яиц на 15 шт. с вентиляцией",
      titleEn: "Egg container for 15 pcs with ventilation",
      titleUz: "15 talik shamollatiladigan tuxum qutisi",
      titleKk: "Желдеткіші бар 15 жұмыртқалық контейнер",
      volume: "15 яиц",
      diameter: "295 x 150 x 70 мм",
      material: "PET пищевой",
      color: "Прозрачный глянцевый",
      boxQty: "450 шт.",
      minOrder: "30 000 шт.",
      image: "assets/images/product-egg-15.svg",
      desc: "Эргономичная форма с вентиляционными отверстиями для продления свежести продукции на полке ритейла.",
      descEn: "Ergonomic shape with ventilation holes to prolong shelf life in retail stores.",
      descUz: "Do'kon peshtaxtalarida tuxum uzoq vaqt yangi turishi uchun shamollatish teshiklariga ega.",
      descKk: "Сауда сөрелерінде жұмыртқаның балғындығын сақтау үшін желдеткіш тесіктері бар."
    },
    {
      id: "prod-6",
      categoryId: "confectionery",
      title: "Тортовница круглая премиум Ø 210 мм с замком",
      titleEn: "Round cake container premium Ø 210 mm",
      titleUz: "Dumaloq tort qutisi Ø 210 mm qulflar bilan",
      titleKk: "Дөңгелек торт ыдысы премиум Ø 210 мм",
      volume: "до 1.5 кг",
      diameter: "Ø 210 мм, H 110 мм",
      material: "PET купол + PS дно",
      color: "Черное дно + прозрачный купол",
      boxQty: "200 шт.",
      minOrder: "20 000 шт.",
      image: "assets/images/product-cake-round.svg",
      desc: "Премиальная презентация кондитерских изделий. Надежная круговая фиксация купола исключает случайное открытие.",
      descEn: "Premium presentation of confectionery. Secure perimeter locking prevents accidental opening.",
      descUz: "Tortlar va pishiriqlar uchun yuqori sifatli ko'rinish. Aylanma mustahkam qulflar tasodifiy ochilib ketishni oldini oladi.",
      descKk: "Кондитерлік өнімдерге арналған премиум ыдыс. Шеңберлі мықты бекіткіш өздігінен ашылып кетуге жол бермейді."
    },
    {
      id: "prod-7",
      categoryId: "confectionery",
      title: "Коррекс для печенья и зефира (3 секции)",
      titleEn: "Cookie & marshmallow tray (3 sections)",
      titleUz: "Pechenye va shirinliklar uchun korreks (3 bo'limli)",
      titleKk: "Печеньеге арналған коррекс (3 бөлімді)",
      volume: "350-500 г",
      diameter: "215 x 115 x 45 мм",
      material: "PS (Полистирол) / PET",
      color: "Коричневый / Прозрачный / Золотой",
      boxQty: "1 500 шт.",
      minOrder: "40 000 шт.",
      image: "assets/images/product-correx.svg",
      desc: "Защищает хрупкую выпечку от ломки при транспортировке. Подходит для автоматических флоу-пак линий.",
      descEn: "Protects delicate bakery items from breaking during transport. Suitable for automated flow-pack lines.",
      descUz: "Tashish paytida mo'rt pishiriqlarni sinishdan saqlaydi. Avtomatik flow-pack qadoqlashga mos.",
      descKk: "Нәзік кондитерлік өнімдерді сынудан сақтайды. Автоматты флоу-пак желілеріне үйлесімді."
    },
    {
      id: "prod-8",
      categoryId: "containers",
      title: "Прямоугольный контейнер с крышкой 500 мл",
      titleEn: "Rectangular container with hinged lid 500 ml",
      titleUz: "Qopqoqli to'g'ri burchakli idish 500 ml",
      titleKk: "Қақпағы бар тікбұрышты контейнер 500 мл",
      volume: "500 мл",
      diameter: "140 x 115 x 52 мм",
      material: "PP пищевой термостойкий",
      color: "Прозрачный / Черный",
      boxQty: "500 шт.",
      minOrder: "30 000 шт.",
      image: "assets/images/product-container-500.svg",
      desc: "Подходит для горячих и холодных блюд, разогрева в СВЧ. Герметичный замок по всему периметру.",
      descEn: "Suitable for hot and cold dishes, microwave-safe. Leak-proof perimeter seal.",
      descUz: "Issiq va sovuq taomlar uchun, mikroto'lqinli pechga chidamli. Butun perimetr bo'ylab germetik yopiladi.",
      descKk: "Ыстық және суық тағамдарға, қысқа толқынды пеште жылытуға жарамды. Шеңбер бойы герметикалық құлып."
    },
    {
      id: "prod-9",
      categoryId: "containers",
      title: "Контейнер салатный круглый 750 мл с крышкой",
      titleEn: "Round salad bowl 750 ml with lid",
      titleUz: "Dumaloq salat idishi 750 ml qopqoq bilan",
      titleKk: "Дөңгелек салат ыдысы 750 мл қақпағымен",
      volume: "750 мл",
      diameter: "Ø 150 мм, H 65 мм",
      material: "PET сверхпрозрачный",
      color: "Прозрачный",
      boxQty: "400 шт.",
      minOrder: "30 000 шт.",
      image: "assets/images/product-salad-750.svg",
      desc: "Идеален для готовых салатов, полуфабрикатов и кулинарии. Отличный глянец и жесткость стенок.",
      descEn: "Ideal for ready-to-eat salads, deli and food service. Superb clarity and wall stiffness.",
      descUz: "Tayyor salatlar va yarim tayyor taomlar uchun ideal. Ajoyib shaffoflik va qattiq devorlar.",
      descKk: "Дайын салаттар мен жартылай фабрикаттар үшін өте қолайлы. Жоғары мөлдірлік пен қабырға қаттылығы."
    },
    {
      id: "prod-10",
      categoryId: "cups",
      title: "Одноразовый стакан для напитков 500 мл",
      titleEn: "Disposable beverage cup 500 ml",
      titleUz: "Ichimliklar uchun bir martalik stakan 500 ml",
      titleKk: "Сусындарға арналған бір реттік стақан 500 мл",
      volume: "500 мл",
      diameter: "Ø 95 мм, H 135 мм",
      material: "PP первичный",
      color: "Прозрачный",
      boxQty: "1 000 шт.",
      minOrder: "50 000 шт.",
      image: "assets/images/product-cup-500.svg",
      desc: "Эластичный, не трескается при сжатии. Возможность нанесения многоцветного логотипа бренда.",
      descEn: "Elastic and shatter-proof. Multi-color custom printing available.",
      descUz: "Elastik, siqilganda sinmaydi. Buyurtma asosida ko'p rangli logotip tushirish mumkin.",
      descKk: "Серпімді, қысқанда жарылмайды. Түрлі-түсті бренд логотипін басып шығару мүмкіндігі."
    },
    {
      id: "prod-11",
      categoryId: "cups",
      title: "Купольная крышка с отверстием Ø 95 мм",
      titleEn: "Dome lid with hole Ø 95 mm",
      titleUz: "Naycha teshikli gumbazsimon qopqoq Ø 95 mm",
      titleKk: "Түтікше тесігі бар күмбезді қақпақ Ø 95 мм",
      volume: "Ø 95 мм",
      diameter: "Ø 95 мм, H 45 мм",
      material: "PET кристальный",
      color: "Прозрачный",
      boxQty: "1 000 шт.",
      minOrder: "50 000 шт.",
      image: "assets/images/product-dome-lid.svg",
      desc: "Купол под коктейльные трубочки, десерты со взбитыми сливками и смузи. Плотно защелкивается.",
      descEn: "Dome for cocktail straws and whipped desserts. Snaps on tightly.",
      descUz: "Kokteyl naychalari, smuzi va desertlar uchun gumbaz qopqoq. Qattiq qisiladi.",
      descKk: "Көктейль түтікшелері мен смузи десерттеріне арналған күмбез қақпақ. Тығыз бекітіледі."
    },
    {
      id: "prod-12",
      categoryId: "containers",
      title: "Ланч-бокс двухсекционный 1000 мл (PP)",
      titleEn: "2-compartment lunch box 1000 ml (PP)",
      titleUz: "Ikki bo'limli lanch-boks 1000 ml (PP)",
      titleKk: "Екі бөлімді ланч-бокс 1000 мл (PP)",
      volume: "1000 мл (650+350)",
      diameter: "220 x 175 x 48 мм",
      material: "PP термостойкий (-20°C до +120°C)",
      color: "Черный корпус + прозрачная крышка",
      boxQty: "300 шт.",
      minOrder: "25 000 шт.",
      image: "assets/images/product-lunch-box.svg",
      desc: "Раздельное хранение основного блюда и гарнира. Прочный замок, выдерживает доставку горячих обедов.",
      descEn: "Separate compartments for main dish and side. Sturdy lock, ideal for hot meal delivery.",
      descUz: "Asosiy taom va garnirni alohida saqlash. Mustahkam qulf, issiq ovqat yetkazib berishga mos.",
      descKk: "Негізгі тағам мен гарнирді бөлек сақтау. Ыстық түскі асты жеткізуге арналған сенімді құлып."
    }
  ],
  // All 7 Advantages explicitly required by Section 7 of ТЗ:
  advantages: [
    {
      id: "adv-1",
      icon: "factory",
      title: "Собственное производство",
      titleEn: "Direct Manufacturing",
      titleUz: "O'z ishlab chiqarishimiz",
      titleKk: "Өз өндірісіміз",
      desc: "Работа напрямую с заводом в Таджикистане без посредников и торговых наценок. Полный контроль технологий и сырья.",
      descEn: "Direct cooperation with the factory in Tajikistan without distributors. Complete control of raw materials and technology.",
      descUz: "Tojikistondagi zavod bilan vositachilarsiz to'g'ridan-to'g'ri ishlash. Texnologiya va xomashyoni to'liq nazorat qilish.",
      descKk: "Тәжікстандағы зауытпен делдалсыз тікелей жұмыс істеу. Технология мен шикізатты толық бақылау."
    },
    {
      id: "adv-2",
      icon: "truck",
      title: "Оптовые объёмы",
      titleEn: "Wholesale Volumes",
      titleUz: "Katta ulgurji hajmlar",
      titleKk: "Ірі көтерме көлемдер",
      desc: "Возможность выполнения крупных экспортных заказов. Производственная мощность свыше 18 млн единиц в месяц.",
      descEn: "Capable of handling massive international contracts. Monthly capacity exceeding 18 million units.",
      descUz: "Katta eksport buyurtmalarini tezkor bajarish. Oyiga 18 million donadan ortiq ishlab chiqarish quvvati.",
      descKk: "Ірі экспорттық тапсырыстарды орындау мүмкіндігі. Айына 18 миллионнан астам өнім қуаттылығы."
    },
    {
      id: "adv-3",
      icon: "percent",
      title: "Конкурентная стоимость",
      titleEn: "Competitive Pricing",
      titleUz: "Raqobatbardosh narxlar",
      titleKk: "Бәсекеге қабілетті баға",
      desc: "Выгодные условия для B2B-клиентов и импортёров за счет низких тарифов на энергоносители и оптимизированной логистики.",
      descEn: "Attractive price advantages for B2B buyers and importers due to optimized energy and local production cost.",
      descUz: "Qulay energiya tariflari va optimallashtirilgan tannarx hisobiga B2B importchilar uchun eng arzon narxlar.",
      descKk: "Төмен энергия тарифтері мен оңтайландырылған өзіндік құн арқасында B2B импорттаушыларға тиімді баға."
    },
    {
      id: "adv-4",
      icon: "layers",
      title: "Широкий ассортимент",
      titleEn: "Wide Product Range",
      titleUz: "Keng mahsulot assortimenti",
      titleKk: "Кең өнім ассортименті",
      desc: "Различные виды жесткой пластиковой упаковки для бизнеса: стаканы, контейнеры для яиц, тортовницы, салатники, крышки.",
      descEn: "Diverse portfolio of rigid plastic packaging: cups, egg containers, cake boxes, food containers, and lids.",
      descUz: "Biznes uchun turli xil qattiq plastik qadoqlar: stakanlar, tuxum qutilari, tort idishlari, salatniklar va qopqoqlar.",
      descKk: "Бизнеске арналған қатты қаптаманың алуан түрі: стақандар, жұмыртқа ыдыстары, торт қораптары, қақпақтар."
    },
    {
      id: "adv-5",
      icon: "settings",
      title: "Индивидуальный подход",
      titleEn: "Custom Engineering",
      titleUz: "Yakka yondashuv",
      titleKk: "Жеке көзқарас",
      desc: "Обсуждение параметров продукции, толщины, цвета по Pantone, изготовление индивидуальных пресс-форм и брендирование.",
      descEn: "Consultation on packaging geometry, Pantone coloring, wall thickness, tooling molds, and branded foil printing.",
      descUz: "Mahsulot qalinligi, rangi, maxsus press-qoliplar yasash va brending bo'yicha individual shartlar.",
      descKk: "Қаптама қалыңдығы, түсі, жеке пресс-қалыптар жасау және брендтеу параметрлерін бейімдеу."
    },
    {
      id: "adv-6",
      icon: "shield",
      title: "Контроль качества",
      titleEn: "Rigorous Quality Control",
      titleUz: "Qat'iy sifat nazorati",
      titleKk: "Сапаны қатаң бақылау",
      desc: "Контроль продукции на всех этапах производства: 100% первичное сырье, испытания на герметичность, прочность и геометрию.",
      descEn: "Inspection at all production stages: 100% virgin food-grade resin, burst seal testing, and dimensional compliance.",
      descUz: "Ishlab chiqarishning barcha bosqichlarida nazorat: 100% birlamchi xomashyo, germetiklik va qattiqlik sinovlari.",
      descKk: "Өндірістің барлық кезеңдерінде бақылау: 100% таза шикізат, герметикалық пен беріктік сынақтары."
    },
    {
      id: "adv-7",
      icon: "globe",
      title: "Экспортная логистика и СТ-1",
      titleEn: "Export Logistics & CT-1",
      titleUz: "Eksport logistikasi va ST-1",
      titleKk: "Экспорттық логистика және СТ-1",
      desc: "Помощь в организации доставки покупателю (авто и ж/д). Оформление сертификата СТ-1 для беспошлинного ввоза в страны СНГ.",
      descEn: "Complete logistics assistance (truck and rail dispatch). CT-1 Certificate of Origin for 0% duty import into CIS.",
      descUz: "Xaridor manziliga yetkazib berish (avto va temir yo'l). MDH mamlakatlariga 0% boj bilan kiritish uchun ST-1 sertifikati.",
      descKk: "Сатып алушыға дейін жеткізуді ұйымдастыру (авто және т/ж). ТМД елдеріне 0% баж салығымен СТ-1 сертификаты."
    }
  ],
  // Production departments / galleries matching Section 12 of ТЗ:
  productionShowcase: [
    {
      id: "lines",
      category: "lines",
      title: "Автоматические линии термоформования",
      titleEn: "Automated Thermoforming Lines",
      titleUz: "Avtomatlashtirilgan termoformirovka liniyalari",
      titleKk: "Автоматтандырылған термоформалау желілері",
      desc: "Высокоскоростные немецкие и европейские сервоформовочные станки с точностью вырубки ±0.05 мм.",
      descEn: "High-speed servo thermoforming machinery with precision cutting tolerance of ±0.05 mm.",
      image: "assets/images/production-lines.svg"
    },
    {
      id: "process",
      category: "process",
      title: "Техпроцесс и экструзия листа",
      titleEn: "Sheet Extrusion & Forming Process",
      titleUz: "Plastmassa listi ekstruziyasi va qoliplash",
      titleKk: "Парақ экструзиясы және қалыптау процесі",
      desc: "Многослойные экструдеры для PP, PET, PS обеспечивают идеальный глянец, калибр и отсутствие микротрещин.",
      descEn: "Multi-layer PP, PET, and PS extruders deliver uniform sheet gauge, mirror gloss, and structural integrity.",
      image: "assets/images/production-process.svg"
    },
    {
      id: "warehouse",
      category: "warehouse",
      title: "Складской комплекс и сырьевые силосы",
      titleEn: "Warehouse & Raw Material Storage",
      titleUz: "Zamonaviy omborxona va xomashyo zaxirasi",
      titleKk: "Қойма кешені және шикізат қоры",
      desc: "Более 3 000 м² крытых площадей хранения. Постоянный резерв готовой серийной упаковки для срочных отгрузок.",
      descEn: "Over 3,000 m² of covered warehouse space with buffered inventory of popular items for 48h dispatch.",
      image: "assets/images/production-warehouse.svg"
    },
    {
      id: "qc",
      category: "qc",
      title: "Лаборатория контроля качества (ОТК)",
      titleEn: "Quality Assurance Laboratory (QA)",
      titleUz: "Sifat nazorati laboratoriyasi (OTK)",
      titleKk: "Сапаны бақылау зертханасы (ОТК)",
      desc: "Оптические микрометры, вакуумные камеры проверки запайки фольгой и стенды вертикальной нагрузки.",
      descEn: "Optical micrometers, vacuum burst seal chambers, and top-load compression testers.",
      image: "assets/images/production-qc.svg"
    },
    {
      id: "shipping",
      category: "shipping",
      title: "Зона отгрузки в еврофуры и таможня",
      titleEn: "Export Dispatch & Euro-Truck Loading",
      titleUz: "Eksport yuklash va bojxona rasmiylashtiruvi",
      titleKk: "Еурофураларға тиеу және кедендік ресімдеу",
      desc: "Формирование паллетных партий, стретч-обмотка и опломбирование для безопасной доставки на 1500+ км.",
      descEn: "Pallet batch preparation, heavy stretch-wrapping, and customs sealing for safe transit up to 1,500+ km.",
      image: "assets/images/production-shipping.svg"
    }
  ],
  documents: [
    {
      id: "doc-1",
      title: "Сертификат соответствия на пищевую полимерную упаковку",
      titleEn: "Certificate of Conformity for Food-Grade Packaging",
      titleUz: "Oziq-ovqat polimer qadoqlari muvofiqlik sertifikati",
      titleKk: "Тағамдық қаптамаға сәйкестік сертификаты",
      type: "ГОСТ / ТР ТС",
      number: "№ ТД-2026-0814",
      file: "assets/docs/certificate-conformity.pdf"
    },
    {
      id: "doc-2",
      title: "Санитарно-эпидемиологическое заключение (прямой контакт с пищей)",
      titleEn: "Sanitary & Epidemiological Certificate (Direct Food Contact)",
      titleUz: "Sanitariya-epidemiologiya xulosasi (oziq-ovqat bilan aloqa)",
      titleKk: "Санитарлық-эпидемиологиялық қорытынды (тағаммен байланыс)",
      type: "СЭЗ",
      number: "№ СЭЗ-992-0412",
      file: "assets/docs/sanitary-conclusion.pdf"
    },
    {
      id: "doc-3",
      title: "Паспорт качества и безопасности на первичное гранулированное сырье",
      titleEn: "Quality & Safety Passport for Virgin Polymer Pellets",
      titleUz: "Birlamchi polimer xomashyosi sifat pasporti",
      titleKk: "Бастапқы полимерлі шикізаттың сапа паспорты",
      type: "Паспорт сырья",
      number: "№ RAW-PP-2026",
      file: "assets/docs/raw-material-spec.pdf"
    },
    {
      id: "doc-4",
      title: "Сертификат происхождения товара (Форма СТ-1 для беспошлинного ввоза в СНГ)",
      titleEn: "Certificate of Origin (Form CT-1 for 0% Duty in CIS)",
      titleUz: "Tovarning kelib chiqishi to'g'risida sertifikat (ST-1)",
      titleKk: "Тауардың шығу тегі туралы сертификат (СТ-1 нөлдік баж)",
      type: "СТ-1",
      number: "№ TJ-СТ1-8841",
      file: "assets/docs/ct1-certificate.pdf"
    }
  ]
};

class Store {
  constructor() {
    this.data = this.loadData();
    this.leads = this.loadLeads();
  }

  loadData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_DATA,
          ...parsed,
          company: { ...DEFAULT_DATA.company, ...(parsed.company || {}) }
        };
      }
    } catch (e) {
      console.warn("Error loading stored data:", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }

  saveData(newData) {
    this.data = newData || this.data;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      window.dispatchEvent(new CustomEvent('muosir_store_updated', { detail: this.data }));
      return true;
    } catch (e) {
      console.error("Error saving data:", e);
      return false;
    }
  }

  resetData() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('muosir_store_updated', { detail: this.data }));
  }

  getData() {
    return this.data;
  }

  // --- Product Management ---
  getProducts(categoryId = 'all') {
    if (!categoryId || categoryId === 'all') {
      return this.data.products;
    }
    return this.data.products.filter(p => p.categoryId === categoryId);
  }

  getProductById(id) {
    return this.data.products.find(p => p.id === id);
  }

  addProduct(product) {
    if (!product.id) {
      product.id = 'prod-' + Date.now();
    }
    this.data.products.unshift(product);
    this.saveData();
    return product;
  }

  updateProduct(id, updatedFields) {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.data.products[idx] = { ...this.data.products[idx], ...updatedFields };
      this.saveData();
      return true;
    }
    return false;
  }

  deleteProduct(id) {
    this.data.products = this.data.products.filter(p => p.id !== id);
    this.saveData();
  }

  // --- Leads Management ---
  loadLeads() {
    try {
      const stored = localStorage.getItem(LEADS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  saveLead(leadData) {
    const lead = {
      id: 'lead-' + Date.now(),
      createdAt: new Date().toISOString(),
      formattedDate: new Date().toLocaleString('ru-RU'),
      ...leadData
    };
    this.leads.unshift(lead);
    try {
      localStorage.setItem(LEADS_KEY, JSON.stringify(this.leads));
      window.dispatchEvent(new CustomEvent('muosir_lead_created', { detail: lead }));

      // Dispatch Webhooks if configured in admin
      this.dispatchWebhooks(lead);
    } catch (e) {
      console.error("Error saving lead:", e);
    }
    return lead;
  }

  dispatchWebhooks(lead) {
    const company = this.data.company;
    
    // Telegram Webhook
    if (company.telegramWebhookUrl) {
      try {
        const text = `🔔 *Новая B2B заявка Муосир пласт*\n\n` +
          `👤 *Имя:* ${lead.name}\n` +
          `🏢 *Компания:* ${lead.company}\n` +
          `🌍 *Страна:* ${lead.country}\n` +
          `📞 *Телефон:* ${lead.phone}\n` +
          `✉️ *Email:* ${lead.email || '—'}\n` +
          `📦 *Товар:* ${lead.product}\n` +
          `📊 *Объем:* ${lead.volume || '—'}\n` +
          `💬 *Комментарий:* ${lead.comment || '—'}\n` +
          `🎯 *UTM:* ${lead.utmSource || 'direct'} / ${lead.utmCampaign || '—'}`;

        fetch(company.telegramWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, parse_mode: 'Markdown' })
        }).catch(err => console.warn("Telegram webhook error:", err));
      } catch (err) {}
    }

    // CRM Webhook (Bitrix24 / amoCRM webhook)
    if (company.crmWebhookUrl) {
      try {
        fetch(company.crmWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lead)
        }).catch(err => console.warn("CRM webhook error:", err));
      } catch (err) {}
    }
  }

  getLeads() {
    return this.leads;
  }

  deleteLead(id) {
    this.leads = this.leads.filter(l => l.id !== id);
    try {
      localStorage.setItem(LEADS_KEY, JSON.stringify(this.leads));
      return true;
    } catch (e) {
      return false;
    }
  }

  clearLeads() {
    this.leads = [];
    localStorage.removeItem(LEADS_KEY);
  }

  // --- Export / Import Config ---
  exportToJson() {
    const payload = {
      data: this.data,
      leads: this.leads,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `muosir-plast-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importFromJson(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.data) {
        this.saveData(parsed.data);
      }
      if (parsed.leads && Array.isArray(parsed.leads)) {
        this.leads = parsed.leads;
        localStorage.setItem(LEADS_KEY, JSON.stringify(this.leads));
      }
      return true;
    } catch (e) {
      console.error("Import error:", e);
      return false;
    }
  }
}

// Global singleton instance
window.muosirStore = new Store();
