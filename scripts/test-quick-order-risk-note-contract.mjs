import { readFileSync } from 'node:fs';

const modalSource = readFileSync('src/pages/storefront/modals.ts', 'utf8');
const stylesSource = readFileSync('src/pages/storefront/styles.ts', 'utf8');

const checks = [
  ['quick order warning block', modalSource.includes('order-risk-note')],
  ['warning title text', modalSource.includes('Chú ý !')],
  ['warning icon', modalSource.includes('fa-triangle-exclamation')],
  ['bomb-order history copy', modalSource.includes('vượt quá 2 lần')],
  ['warning base styles', stylesSource.includes('.order-risk-note {')],
  ['warning dark theme styles', stylesSource.includes("body[data-storefront-theme='dark'] .order-risk-note")],
];

const failed = checks.filter(([, passed]) => !passed);

if (failed.length) {
  console.error('Quick order warning contract failed:');
  for (const [name] of failed) console.error(`- ${name}`);
  process.exit(1);
}

console.log('Quick order warning contract passed.');
