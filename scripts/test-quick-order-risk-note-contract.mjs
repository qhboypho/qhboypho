import { readFileSync } from 'node:fs';

const modalSource = readFileSync('src/pages/storefront/modals.ts', 'utf8');
const stylesSource = readFileSync('src/pages/storefront/styles.ts', 'utf8');
const textUiSource = readFileSync('src/lib/textUiSettings.ts', 'utf8');
const pageRoutesSource = readFileSync('src/routes/pageRoutes.ts', 'utf8');
const adminRoutesSource = readFileSync('src/routes/adminUtilityRoutes.ts', 'utf8');
const adminSectionsSource = readFileSync('src/pages/admin/sections.ts', 'utf8');
const adminScriptSource = readFileSync('src/pages/admin/script.ts', 'utf8');
const adminSettingsScriptSource = readFileSync('src/pages/admin/script-featured-settings.ts', 'utf8');

const checks = [
  ['quick order warning block', modalSource.includes('order-risk-note')],
  ['warning title text', modalSource.includes('Chú ý !')],
  ['warning icon', modalSource.includes('fa-triangle-exclamation')],
  ['warning uses dynamic text', modalSource.includes('quickOrderRiskNoteText')],
  ['default copy is centralized', textUiSource.includes('vượt quá 2 lần')],
  ['storefront route reads text ui settings', pageRoutesSource.includes('readTextUiSettings')],
  ['admin text ui endpoint', adminRoutesSource.includes('/api/admin/settings/text-ui')],
  ['admin text ui page', adminSectionsSource.includes('page-settings-text-ui')],
  ['admin text ui nav', adminScriptSource.includes('settings-text-ui')],
  ['admin text ui loader', adminSettingsScriptSource.includes('loadTextUiSettings')],
  ['hero text ui defaults', textUiSource.includes('hero_title_text')],
  ['hero uses text ui settings', adminSectionsSource.includes('heroTitleText') && pageRoutesSource.includes('readTextUiSettings')],
  ['product list tags transparent', stylesSource.includes('#products .product-card span.text-xs.bg-gray-100') && stylesSource.includes('background: transparent !important')],
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
