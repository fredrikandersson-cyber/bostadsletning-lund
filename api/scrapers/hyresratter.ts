import { chromium } from 'playwright';
import type { Browser } from 'playwright';
import type { ScrapedListing } from './blocket.js';

const HYRESRATTER_URL = 'https://www.hyresratter.se/lediga-lagenheter/lund';

export async function scrapeHyresratter(browser?: Browser): Promise<ScrapedListing[]> {
  const ownBrowser = !browser;
  const b = browser ?? await chromium.launch({
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
    ]
  });

  try {
    console.log('[hyresratter] Starting Playwright scrape...');

    const context = await b.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      locale: 'sv-SE',
      ignoreHTTPSErrors: true,
    });

    const page = await context.newPage();

    // Block media but allow text
    await page.route('**/*.{png,jpg,jpeg,gif,webp}', r => r.abort());
    await page.route('**/analytics**', r => r.abort());

    console.log('[hyresratter] Navigating to ' + HYRESRATTER_URL);

    try {
      await page.goto(HYRESRATTER_URL, {
        waitUntil: 'load',
        timeout: 20000,
      });
    } catch (e) {
      console.warn('[hyresratter] Load timeout, continuing with current DOM...');
    }

    // Wait a bit for JS to settle
    await page.waitForTimeout(2000);

    const finalUrl = page.url();
    console.log('[hyresratter] Final URL: ' + finalUrl);

    // Extract listings via page.evaluate
    const rawListings = await page.evaluate(() => {
      const results: any[] = [];

      // Try multiple selectors
      const selectors = [
        '[class*="PropertyCard"]',
        '[class*="listing"]',
        'article',
        '[role="link"]',
        'a[href*="/objekt/"]',
      ];

      const processedHrefs = new Set<string>();

      for (const sel of selectors) {
        const elements = document.querySelectorAll(sel);

        for (const el of elements) {
          // Try to find link
          let link = el as any;
          if (el.tagName !== 'A') {
            link = el.querySelector('a[href*="/objekt/"]') || el.querySelector('a[href]');
          }

          if (!link?.href) continue;

          // Avoid duplicates
          if (processedHrefs.has(link.href)) continue;
          processedHrefs.add(link.href);

          const text = el.textContent || '';

          // Extract price
          const priceMatch = text.match(/(\d{1,2}\s?\d{3})\s*kr|(\d{4,5})\s*kr/);
          const price = priceMatch
            ? parseInt((priceMatch[1] || priceMatch[2]).replace(/\s/g, ''), 10)
            : 0;

          if (price < 3000 || price > 30000) continue;

          // Extract rooms
          const roomsMatch = text.match(/(\d+)\s*(?:rum|r)\b/i);
          const rooms = roomsMatch ? parseInt(roomsMatch[1], 10) : undefined;

          // Extract area
          const areaMatch = text.match(/([\d]+)\s*m[²2]/);
          const area = areaMatch ? parseFloat(areaMatch[1]) : undefined;

          // Get title (usually from h2/h3 or link text)
          const titleEl = el.querySelector('h2, h3') || link;
          const title = (titleEl as HTMLElement).textContent?.trim() || 'Hyresrätt i Lund';

          results.push({
            href: link.href,
            title,
            price,
            rooms,
            area,
            text: text.substring(0, 200),
          });
        }
      }

      return results;
    });

    console.log(`[hyresratter] Found ${rawListings.length} listings`);

    await context.close();

    // Map to ScrapedListing format
    const listings = rawListings
      .filter((l: any) => l.price > 0)
      .map((l: any, idx: number): ScrapedListing => ({
        externalId: `hyresratter-${idx}-${Math.random().toString(36).substr(2, 9)}`,
        source: 'hyresratter',
        title: l.title || 'Hyresrätt i Lund',
        price: l.price,
        rooms: l.rooms,
        area: l.area,
        address: l.title?.includes(',') ? l.title : `${l.title}, Lund`,
        imageUrl: undefined,
        url: l.href.startsWith('http') ? l.href : `https://www.hyresratter.se${l.href}`,
        landlordType: 'company',
        petFriendly: false,
        hasFurnished: false,
        hasBalcony: false,
        listedAt: new Date(),
      }));

    console.log(`[hyresratter] Returning ${listings.length} valid listings`);
    return listings;

  } catch (err) {
    console.error('[hyresratter] Scraper error:', err instanceof Error ? err.message : err);
    return [];
  } finally {
    if (ownBrowser) await b.close();
  }
}
