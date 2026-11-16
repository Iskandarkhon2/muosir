const PRODUCT_OVERRIDES = {
  'Контейнер-для-торта_Диаметр-28см_Высота-12см_Материал-PET(крышка-и-дно)_Размер-коробки-65x32x40см_В-коробке-100шт.png': {
    title: 'Контейнер для Торта Ø 28',
    categoryId: 'confectionery',
    details: [
      { label: 'Диаметр', value: 'Ø 28,00 см' },
      { label: 'Высота', value: 'h 12,00 см' },
      { label: 'Материал', value: 'PET (крышка и дно)' },
      { label: 'Размер коробки', value: '65 × 32 × 40 см' },
      { label: 'Количество в коробке', value: '100 шт.' }
    ],
    specificationText: 'Диаметр: Ø 28,00 см; Высота: h 12,00 см; Материал: PET (крышка и дно); Размер коробки: 65 × 32 × 40 см; Количество в коробке: 100 шт.'
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
    image: 'assets/images/контейнер-пищевой-прямоугольный-прозрачный-с-крышкой-изображение-037.jpg',
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
    image: 'assets/images/контейнер-пищевой-прямоугольный-прозрачный-с-защелкивающейся-крышкой-изображение-033.jpg',
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
    id: 'baking-low-lid',
    image: 'assets/images/контейнер-кондитерский-прямоугольный-прозрачный-с-откидной-крышкой-изображение-036.jpg',
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
    image: 'assets/images/контейнер-для-пончиков-и-выпечки-прозрачный-с-откидной-крышкой-изображение-048.jpg',
    title: 'Упаковка для выпечки с высокой крышкой',
    categoryId: 'confectionery',
    details: [
      { label: 'Материал', value: 'PET' },
      { label: 'Размер коробки', value: '65 × 48 × 39 см' },
      { label: 'Количество в коробке', value: '800 шт.' }
    ]
  }
];

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
