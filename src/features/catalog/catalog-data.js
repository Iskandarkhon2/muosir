const PRODUCT_OVERRIDES = {
  'Полимерная-лента-PET_Ширина-400-860мм_Толщина-15-150мкм.png': {
    title: 'Полимерная лента PET (ПЭТ)',
    categoryId: 'polymer-tape',
    details: [
      { label: 'Материал', value: 'PET (ПЭТ)' },
      { label: 'Ширина', value: '400–860 мм' },
      { label: 'Толщина', value: '15–150 мкм' }
    ],
    specificationText: 'Материал: PET (ПЭТ); Ширина: 400–860 мм; Толщина: 15–150 мкм'
  },
  'Полимерная-лента-PP(ПП)_Ширина-400-800мм_Толщина-25-280мкм.png': {
    title: 'Полимерная лента PP (ПП)',
    categoryId: 'polymer-tape',
    details: [
      { label: 'Материал', value: 'PP (ПП)' },
      { label: 'Ширина', value: '400–800 мм' },
      { label: 'Толщина', value: '25–280 мкм' }
    ],
    specificationText: 'Материал: PP (ПП); Ширина: 400–800 мм; Толщина: 25–280 мкм'
  },
  'Контейнер-для-торта_Диаметр-28см_Высота-12см_Материал-PET(крышка-и-дно)_Размер-коробки-65x32x40см_В-коробке-100шт.png': {
    title: 'Контейнер для торта Ø 28 см — тёмное дно',
    categoryId: 'confectionery',
    details: [
      { label: 'Диаметр', value: 'Ø 28,00 см' },
      { label: 'Высота', value: 'h 12,00 см' },
      { label: 'Материал', value: 'PET (крышка и дно)' },
      { label: 'Цвет дна', value: 'Тёмный' },
      { label: 'Размер коробки', value: '65 × 32 × 40 см' },
      { label: 'Количество в коробке', value: '100 шт.' }
    ],
    specificationText: 'Диаметр: Ø 28,00 см; Высота: h 12,00 см; Материал: PET (крышка и дно); Цвет дна: тёмный; Размер коробки: 65 × 32 × 40 см; Количество в коробке: 100 шт.'
  },
  'Контейнер-для-торта_Диаметр-32см_Высота-12см_Материал-PET(крышка-и-дно)_Размер-коробки-60x32x35см_В-коробке-100шт.jpg': {
    title: 'Контейнер для Торта Ø 32',
    categoryId: 'confectionery',
    details: [
      { label: 'Диаметр', value: 'Ø 32,00 см' },
      { label: 'Высота', value: 'h 12,00 см' },
      { label: 'Материал', value: 'PET (крышка и дно)' },
      { label: 'Размер коробки', value: '60 × 32 × 35 см' },
      { label: 'Количество в коробке', value: '100 шт.' }
    ],
    specificationText: 'Диаметр: Ø 32,00 см; Высота: h 12,00 см; Материал: PET (крышка и дно); Размер коробки: 60 × 32 × 35 см; Количество в коробке: 100 шт.'
  }
};

const ADDITIONAL_PRODUCTS = [
  {
    id: 'deli-big',
    image: 'assets/images/deli-big-catalog.png',
    title: 'Дели Большой',
    categoryId: 'containers',
    details: [
      { label: 'Материал', value: 'PET' },
      { label: 'Размер коробки', value: '55 × 41 × 34 см' },
      { label: 'Количество в коробке', value: '400 шт.' }
    ]
  },
  {
    id: 'deli-small',
    image: 'assets/images/deli-small-catalog.png',
    title: 'Дели Маленький',
    categoryId: 'containers',
    details: [
      { label: 'Материал', value: 'PET' },
      { label: 'Размер коробки', value: '55 × 41 × 34 см' },
      { label: 'Количество в коробке', value: '400 шт.' }
    ]
  },
  {
    id: 'correx-confectionery',
    image: 'assets/images/product-correx.jpg',
    title: 'Коррекс Кондитерский',
    categoryId: 'confectionery',
    details: [
      { label: 'Материал', value: 'PET' },
      { label: 'Размер коробки', value: '49 × 35 × 45 см' },
      { label: 'Количество в коробке', value: '300 шт.' }
    ]
  },
  {
    id: 'cake-container-32cm-10cm-dark-base',
    image: 'assets/images/cake-container-32cm-10cm-dark-base.png',
    title: 'Контейнер для торта Ø 32 см, h 10 см — тёмное дно',
    categoryId: 'confectionery',
    details: [
      { label: 'Диаметр', value: 'Ø 32 см' },
      { label: 'Высота', value: 'h 10 см' },
      { label: 'Материал', value: 'PET (крышка и дно)' },
      { label: 'Цвет дна', value: 'Тёмный' },
      { label: 'Размер коробки', value: '65 × 32 × 40 см' },
      { label: 'Количество в коробке', value: '100 шт.' }
    ]
  },
  {
    id: 'cake-container-32cm-12cm-dark-base',
    image: 'assets/images/cake-container-32cm-12cm-dark-base.png',
    title: 'Контейнер для торта Ø 32 см, h 12 см — тёмное дно',
    categoryId: 'confectionery',
    details: [
      { label: 'Диаметр', value: 'Ø 32 см' },
      { label: 'Высота', value: 'h 12 см' },
      { label: 'Материал', value: 'PET (крышка и дно)' },
      { label: 'Цвет дна', value: 'Тёмный' },
      { label: 'Размер коробки', value: '60 × 32 × 35 см' },
      { label: 'Количество в коробке', value: '100 шт.' }
    ]
  },
  {
    id: 'baking-low-lid',
    image: 'assets/images/baking-low-lid-cutout.png',
    title: 'Упаковка для выпечки с низкой крышкой',
    categoryId: 'confectionery',
    details: [
      { label: 'Материал', value: 'PET' },
      { label: 'Размер коробки', value: '65 × 48 × 39 см' },
      { label: 'Количество в коробке', value: '800 шт.' }
    ]
  },
  {
    id: 'baking-high-lid',
    image: 'assets/images/baking-high-lid-cutout.png',
    title: 'Упаковка для выпечки с высокой крышкой',
    categoryId: 'confectionery',
    details: [
      { label: 'Материал', value: 'PET' },
      { label: 'Размер коробки', value: '65 × 48 × 39 см' },
      { label: 'Количество в коробке', value: '800 шт.' }
    ]
  }
];

const SEARCH_SYNONYMS = new Map([
  ['яйца', 'яиц'],
  ['яйцо', 'яиц'],
  ['яйцами', 'яиц'],
  ['яйцам', 'яиц'],
  ['яйцах', 'яиц'],
  ['яйцом', 'яиц']
]);

export function matchesCatalogSearch(product, query) {
  const queryTerms = normalizeCatalogSearchText(query)
    .split(' ')
    .filter(Boolean)
    .map(term => SEARCH_SYNONYMS.get(term) || term);
  if (!queryTerms.length) return true;

  const searchableText = [
    product.title,
    product.specificationText,
    product.material,
    product.volume,
    ...(product.details || []).map(detail => detail.value)
  ].join(' ');
  const productTerms = normalizeCatalogSearchText(searchableText).split(' ');

  return queryTerms.every(term => productTerms.some(productTerm => productTerm.includes(term)));
}

function normalizeCatalogSearchText(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/ё/g, 'е')
    .replace(/([a-zа-я])(?=\d)/gi, '$1 ')
    .replace(/(\d)(?=[a-zа-я])/gi, '$1 ')
    .replace(/[-_]+/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export async function loadCatalogProducts() {
  const response = await fetch('src/features/catalog/catalog-products.json');
  if (!response.ok) throw new Error(`Catalog manifest request failed: ${response.status}`);

  const filenames = await response.json();
  if (!Array.isArray(filenames) || filenames.some(filename => typeof filename !== 'string' || /[\\/]/.test(filename))) {
    throw new TypeError('Catalog manifest must contain image filenames only.');
  }

  const products = [...new Set(filenames)].map(createCatalogProduct);
  return products.concat(ADDITIONAL_PRODUCTS.map(createAdditionalProduct));
}

function createCatalogProduct(filename) {
  const fileStem = filename.replace(/\.[^.]+$/, '');
  const [name, ...specifications] = fileStem.split('_');
  const override = PRODUCT_OVERRIDES[filename];
  const details = override?.details || specifications.map(parseSpecification).filter(Boolean);

  return {
    id: filename,
    filename,
    image: override?.image || `assets/images/${filename}`,
    title: override?.title || formatProductName(name),
    categoryId: override?.categoryId || getCategoryId(name),
    material: details.find(detail => detail.label === 'Материал')?.value || '',
    specifications,
    details,
    specificationText: override?.specificationText || fileStem,
    desc: details.map(detail => `${detail.label}: ${detail.value}`).join(' · ')
  };
}

function createAdditionalProduct(product) {
  const material = product.details.find(detail => detail.label === 'Материал')?.value || '';
  const specificationText = product.details.map(detail => `${detail.label}: ${detail.value}`).join('; ');

  return {
    ...product,
    material,
    specifications: [],
    specificationText,
    desc: product.details.map(detail => `${detail.label}: ${detail.value}`).join(' · ')
  };
}

function getCategoryId(name) {
  return name.startsWith('Полимерная-лента')
    ? 'polymer-tape'
    : name.startsWith('Упаковка-для-творога')
      ? 'dairy'
      : name.startsWith('Контейнер-для-яиц')
        ? 'eggs'
        : name.startsWith('Контейнер-для-торта') || name.startsWith('Контейнер-для-пончиков')
          ? 'confectionery'
          : name.startsWith('Стакан-для-сметаны')
            ? 'dairy'
            : name.startsWith('Стакан-')
              ? 'cups'
              : 'containers';
}

function formatProductName(value) {
  const name = value.replace(/-/g, ' ');
  return name.charAt(0).toLocaleUpperCase('ru') + name.slice(1);
}

function formatSpecificationValue(value) {
  return value
    .replace(/крышка-и-дно/g, 'крышка и дно')
    .replace(/(\d)x(?=\d)/gi, '$1 × ')
    .replace(/(\d)(см|мл|шт|мм|мкм)/gi, '$1 $2')
    .replace(/(PET|PP|PS)\(/gi, '$1 (')
    .replace(/(\d)-(?=\d)/g, '$1–')
    .replace(/-/g, ' ');
}

function parseSpecification(specification) {
  if (specification === 'Брендированный') {
    return { label: 'Брендирование', value: 'С нанесением логотипа' };
  }

  if (specification.startsWith('Размеры-коробок-')) {
    const boxSizes = specification.slice('Размеры-коробок-'.length);
    const match = boxSizes.match(/^дно-(.+?)-крышка-(.+)$/);
    const value = match
      ? `Дно: ${formatSpecificationValue(match[1])} · Крышка: ${formatSpecificationValue(match[2])}`
      : formatSpecificationValue(boxSizes.replace(/-/g, ' '));
    return { label: 'Размеры коробок', value };
  }

  const fields = [
    ['Диаметр-', 'Диаметр'],
    ['Высота-', 'Высота'],
    ['Объем-', 'Объём'],
    ['Материал-', 'Материал'],
    ['Ширина-', 'Ширина'],
    ['Толщина-', 'Толщина'],
    ['Количество-', 'Количество в изделии'],
    ['Цвет-', 'Цвет'],
    ['Размеры-коробки-', 'Размер коробки'],
    ['Размер-коробки-', 'Размер коробки'],
    ['Коробка-', 'Размер коробки'],
    ['Размер-', 'Размер изделия'],
    ['В-коробке-', 'Количество в коробке'],
    ['В-пачке-', 'Количество в пачке']
  ];
  const field = fields.find(([prefix]) => specification.startsWith(prefix));
  if (!field) return null;

  return {
    label: field[1],
    value: formatSpecificationValue(specification.slice(field[0].length))
  };
}
