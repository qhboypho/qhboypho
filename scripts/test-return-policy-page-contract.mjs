import { readFileSync } from 'node:fs';

const pageRoutesSource = readFileSync('src/routes/pageRoutes.ts', 'utf8');
const policyPageSource = readFileSync('src/pages/returnPolicyPage.ts', 'utf8');
const storefrontPageSource = readFileSync('src/pages/storefrontPage.ts', 'utf8');
const sectionsSource = readFileSync('src/pages/storefront/sections.ts', 'utf8');

const checks = [
  ['return policy route exists', pageRoutesSource.includes('/chinh-sach-doi-tra')],
  ['return policy alias exists', pageRoutesSource.includes('/return-policy')],
  ['policy page renders title', policyPageSource.includes('Chính sách đổi trả')],
  ['policy page includes three day window', policyPageSource.includes('3 ngày')],
  ['policy page includes supported cases section', policyPageSource.includes('Các trường hợp được hỗ trợ đổi trả')],
  ['policy page includes process section', policyPageSource.includes('Quy trình đổi trả')],
  ['storefront uses policy footer', storefrontPageSource.includes('storefrontFooterWithPolicySection')],
  ['footer policy link points to page', sectionsSource.includes('/chinh-sach-doi-tra')],
];

const failed = checks.filter(([, passed]) => !passed);

if (failed.length) {
  console.error('Return policy page contract failed:');
  for (const [name] of failed) console.error(`- ${name}`);
  process.exit(1);
}

console.log('Return policy page contract passed.');
