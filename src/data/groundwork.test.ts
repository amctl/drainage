import assert from 'node:assert/strict'
import test from 'node:test'

import { buildRestUrl, getAccessToken, setAccessTokenProvider } from './groundwork.ts'

test('buildRestUrl encodes an equality filter so user text cannot alter the query', () => {
  const url = buildRestUrl('https://example.supabase.co', 'source_links', {
    zone: 'West Zone & South',
  })

  assert.equal(url, 'https://example.supabase.co/rest/v1/source_links?zone=eq.West%20Zone%20%26%20South')
})

test('uses the configured identity-token provider for protected mutations', async () => {
  setAccessTokenProvider(async () => 'firebase-id-token')
  assert.equal(await getAccessToken(), 'firebase-id-token')
})
