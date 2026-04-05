import assert from 'node:assert/strict'
import { getFlashSaleStatus, isFlashSaleActive } from '../src/lib/flashSaleHelpers.ts'

const now = new Date('2026-04-05T09:00:00')
const campaign = {
  is_active: 1,
  start_at: '2026-04-05T08:30',
  end_at: '2026-04-05T10:30'
}

const status = getFlashSaleStatus(campaign, now)
assert.equal(status.key, 'active', 'Naive datetime-local values should be treated as local time and resolve active status')
assert.equal(isFlashSaleActive(campaign, now), true, 'Naive datetime-local values should resolve active state when now falls inside the local range')

console.log('flash sale local time status ok')
