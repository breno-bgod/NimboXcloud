// SPDX-License-Identifier: GPL-3.0-or-later
import test from 'node:test';
import assert from 'node:assert/strict';
import { PsboxGameLibrary } from './psbox-game-library.mjs';

test('PSBox GSSV catalog pagination, deduplication and Microsoft hydration', async () => {
  const paths = [];
  const gssv = { async catalogRequest(path) {
    paths.push(path);
    if (paths.length === 1) return { results: [{ titleId: 'GAME1', details: { productId: 'PRODUCT1', hasEntitlement: true, supportedInputTypes: ['MKB'], userPrograms: ['CALLISTO'] } }], continuationToken: 'page2' };
    return { results: [{ titleId: 'GAME1', details: {} }, { titleId: 'GAME2', details: { productId: 'PRODUCT2', userPrograms: ['FERDINAND'] } }] };
  } };
  const fetchImpl = async url => {
    assert.match(url, /displaycatalog\.mp\.microsoft\.com/);
    return { ok: true, async json() { return { Products: [
      { ProductId: 'PRODUCT1', LocalizedProperties: [{ ProductTitle: 'Jogo um', Images: [{ ImagePurpose: 'Poster', Uri: '//example.com/one.jpg' }] }] },
      { ProductId: 'PRODUCT2', LocalizedProperties: [{ ProductTitle: 'Jogo dois', Images: [] }] }
    ] }; } };
  };
  const games = await new PsboxGameLibrary({ gssv, fetchImpl }).list();
  assert.deepEqual(paths, ['/v2/titles?mr=200', '/v2/titles?mr=200&ct=page2']);
  assert.equal(games.length, 2);
  assert.equal(games[0].name, 'Jogo um');
  assert.equal(games[0].imageUrl, 'https://example.com/one.jpg');
  assert.equal(games[0].mouseKeyboard, true);
  assert.equal(games[0].viaSubscription, true);
  assert.equal(games[1].freeTier, true);
});

test('PSBox recent titles use MRU endpoint without pagination', async () => {
  const paths = [];
  const gssv = { async catalogRequest(path) { paths.push(path); return { results: [{ titleId: 'RECENT', details: {} }], continuationToken: 'ignored' }; } };
  const games = await new PsboxGameLibrary({ gssv }).list({ recentOnly: true, hydrate: false });
  assert.deepEqual(paths, ['/v2/titles/mru?mr=25']);
  assert.equal(games[0].titleId, 'RECENT');
});

test('PSBox catalog stops when continuation token repeats', async () => {
  let count = 0;
  const gssv = { async catalogRequest() { count++; return { results: [{ titleId: String(count), details: {} }], continuationToken: 'same' }; } };
  const games = await new PsboxGameLibrary({ gssv }).list({ hydrate: false });
  assert.equal(count, 2);
  assert.equal(games.length, 2);
});
