// SPDX-License-Identifier: GPL-3.0-or-later
// Port of PSBox GssvClient::listTitles and hydrateTitles in src/xcloud/gssv.cpp.
// No invented catalog: only the authorized GSSV results and Microsoft product metadata.
export class PsboxGameLibrary {
  #fetch; #gssv;
  constructor({ gssv, fetchImpl = fetch } = {}) {
    if (!gssv) throw new Error('GSSV_CLIENT_REQUIRED');
    this.#gssv = gssv; this.#fetch = fetchImpl;
  }
  async #get(url, headers = {}, signal) {
    let response;
    try { response = await this.#fetch(url, { headers, signal }); }
    catch (error) { throw new Error('CATALOG_NETWORK_OR_CORS_ERROR', { cause: error }); }
    if (!response.ok) throw new Error('CATALOG_HTTP_' + response.status);
    return response.json();
  }
  async #titlePage(path, signal) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try { return await this.#gssv.catalogRequest(path, { signal }); }
      catch (error) {
        const retryable = /(?:GSSV_HTTP_(?:408|429|5\\d\\d)|GSSV_NETWORK_OR_CORS_ERROR)/.test(error.message);
        if (!retryable || attempt === 2 || signal?.aborted) throw error;
        await new Promise((resolve, reject) => {
          const timer = setTimeout(() => { signal?.removeEventListener('abort', cancel); resolve(); }, 1000 * (2 ** attempt));
          const cancel = () => { clearTimeout(timer); reject(new Error('CATALOG_CANCELLED')); };
          if (signal?.aborted) cancel();
          else signal?.addEventListener('abort', cancel, { once: true });
        });
      }
    }
  }
  async list({ recentOnly = false, market = 'BR', language = 'pt-BR', signal, hydrate = true } = {}) {
    const games = [];
    let continuation = '', page = 0;
    const seen = new Set();
    const seenContinuations = new Set();
    do {
      if (signal?.aborted) throw new Error('CATALOG_CANCELLED');
      const path = recentOnly ? '/v2/titles/mru?mr=25' : '/v2/titles?mr=200';
      const query = continuation ? '&ct=' + encodeURIComponent(continuation) : '';
      const data = await this.#titlePage(path + query, signal);
      const results = Array.isArray(data?.results) ? data.results : [];
      for (const item of results) {
        const d = item?.details ?? {}, titleId = String(item?.titleId ?? '');
        if (!titleId || seen.has(titleId)) continue;
        seen.add(titleId);
        const productId = d.productId || d.alternateProductIds?.find(x => typeof x === 'string') || '';
        games.push({
          titleId, productId, name: '', imageUrl: '',
          hasEntitlement: Boolean(d.hasEntitlement),
          freeTier: d.userPrograms?.includes('FERDINAND') ?? false,
          viaSubscription: d.userPrograms?.some(x => x !== 'F2P' && x !== 'FERDINAND') ?? false,
          mouseKeyboard: d.supportedInputTypes?.includes('MKB') ?? false
        });
      }
      const next = recentOnly ? '' : String(data?.continuationToken ?? '');
      page++;
      if (!next || seenContinuations.has(next) || !results.length || page >= 50 || games.length >= 10000) break;
      seenContinuations.add(next);
      continuation = next;
    } while (true);
    if (hydrate) await this.hydrate(games, { market, language, signal });
    return games;
  }
  async hydrate(games, { market = 'BR', language = 'pt-BR', signal } = {}) {
    const byProduct = new Map();
    for (const game of games) {
      if (!game.productId) continue;
      if (!byProduct.has(game.productId)) byProduct.set(game.productId, []);
      byProduct.get(game.productId).push(game);
    }
    const ids = [...byProduct.keys()];
    for (let i = 0; i < ids.length; i += 20) {
      const batch = ids.slice(i, i + 20);
      const url = 'https://displaycatalog.mp.microsoft.com/v7.0/products?bigIds=' +
        encodeURIComponent(batch.join(',')) + '&market=' + encodeURIComponent(market) +
        '&languages=' + encodeURIComponent(language);
      const data = await this.#get(url, {}, signal);
      for (const product of data?.Products ?? []) {
        const entries = byProduct.get(product.ProductId) ?? [];
        const localized = product.LocalizedProperties?.[0] ?? {};
        const images = localized.Images ?? [];
        let image = '';
        for (const purpose of ['Poster', 'BoxArt', 'Tile']) {
          image = images.find(x => x.ImagePurpose === purpose)?.Uri ?? '';
          if (image) break;
        }
        if (image.startsWith('//')) image = 'https:' + image;
        if (image && (!image.startsWith('https://') || !/^https:\/\/[^/]+/.test(image))) image = '';
        for (const entry of entries) {
          entry.name = localized.ProductTitle ?? entry.titleId;
          entry.imageUrl = image;
        }
      }
    }
    return games;
  }
}
