import assert from 'node:assert/strict';
import test from 'node:test';
import { localizeCatalogText } from '../src/features/catalog/catalog-localization.mjs';

test('catalog product names translate the full title instead of leaving Russian fragments', () => {
  assert.equal(
    localizeCatalogText('Стакан прозрачный для холодных напитков 400мл', 'en'),
    'Clear cold drink cup 400 ml'
  );
  assert.equal(
    localizeCatalogText('Упаковка для творога Чакка высокий', 'uz'),
    'Chakka tvorog qadoqi baland'
  );
  assert.equal(localizeCatalogText('Qatiq stakani 200 ml', 'uz'), 'Smetana stakani 200 ml');
  assert.equal(
    localizeCatalogText('Контейнер для торта — тёмное дно', 'kk'),
    'Торт контейнері — қою түсті түбі'
  );
});

test('catalog specifications translate labels, values, colors, and units', () => {
  assert.equal(
    localizeCatalogText('Материал: PET (крышка и дно); Цвет дна: Тёмный; Количество в коробке: 100 шт.', 'en'),
    'Material: PET (lid and base); Base color: Dark; Quantity per box: 100 pcs.'
  );
  assert.equal(
    localizeCatalogText('Материал: PP; Цвет: желтый; Размер коробки: 60 × 40 × 43,5см; Количество в коробке: 400шт.', 'uz'),
    'Material: PP; Rangi: sariq; Quti o‘lchami: 60 × 40 × 43,5 sm; Qutidagi soni: 400 dona'
  );
  assert.equal(
    localizeCatalogText('Количество в пачке: 500 шт.; Толщина: 25 мкм', 'kk'),
    'Пакеттегі саны: 500 дана; Қалыңдығы: 25 мкм'
  );
});
