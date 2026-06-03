import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';
import type { ScrapedListing } from './blocket.js';

const BOSTADSPORTAL_URL = 'https://www.bostadsportal.se/search?municipality=lund&type=apartment&for_sale=false';

export async function scrapeBostadsportal(browser?: Browser): Promise<ScrapedListing[]> {
  const ownBrowser = !browser;
  const b = browser ?? await chromium.launch({ headless: true });

  try {
    const context = await b.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      locale: 'sv-SE',
    });
    const page = await context.newPage();

    // Block unnecessary resources
    await page.route('**/*.{png,jpg,jpeg,gif,webp,woff,woff2,ttf}', r => r.abort());
    await page.route('**/analytics**', r => r.abort());

    // Handle redirects
    page.on('response', (resp) => {
      if (resp.status() === 301 || resp.status() === 302) {
        console.log(`[bostadsportal] Redirect: ${resp.url()} -> ${resp.headers()['location']}`);
      }
    });

    try {
      await page.goto(BOSTADSPORTAL_URL, { waitUntil: 'networkidle', timeout: 30000 });
    } catch (err) {
      console.warn('[bostadsportal] Initial goto failed, trying alternate URL');
      // Try alternate URLs
      try {
        await page.goto('https://www.bostadsportal.se/', { waitUntil: 'domcontentloaded', timeout: 20000 });
        // Try to navigate to Lund search
        await page.click('input[placeholder*="kommun"], input[placeholder*="Sök"], input[type="text"]').catch(() => null);
        await page.type('input[placeholder*="kommun"], input[type="text"]', 'Lund', { delay: 50 });
        await page.waitForTimeout(1000);
        await page.press('input', 'Enter');
        await page.waitForTimeout(3000);
      } catch (e) {
        console.warn('[bostadsportal] Alternate navigation failed:', e);
      }
    }

    await page.waitForTimeout(2000);

    // Try to find listing container
    const listings = await extractListings(page);
    console.log(`[bostadsportal] Found ${listings.length} listings`);

    await context.close();
    return listings;
  } catch (err) {
    console.error('[bostadsportal] Scraper error:', err);
    return [];
  } finally {
    if (ownBrowser) await b.close();
  }
}

async function extractListings(page: Page): Promise<ScrapedListing[]> {
  const rawListings = await page.evaluate(() => {
    const results: any[] = [];

    // Bostadsportal uses various listing card selectors
    const selectors = [
      '[class*="ListItem"]',
      '[class*="listing-card"]',
      '[class*="property-card"]',
      'article[class*="item"]',
      'div[role="link"][class*="listing"]',
      'a[href*="/objekt/"]',
    ];

    let cards: NodeListOf<Element> | null = null;
    for (const sel of selectors) {
      const found = document.querySelectorAll(sel);
      if (found.length > 5) {
        // Found a good match with multiple items
        cards = found;
        break;
      }
    }

    if (!cards || cards.length === 0) {
      console.log('[bostadsportal] No listing cards found');
      return results;
    }

    console.log(`[bostadsportal] Found ${cards.length} potential listing cards`);

    cards.forEach((card) => {
      try {
        // Try to extract link
        let link = card.querySelector('a[href*="/objekt/"], a[href*="/bostad"], a[role="link"]') as HTMLAnchorElement;
        if (!link && (card as HTMLAnchorElement).href) {
          link = card as any;
        }
        if (!link || !link.href) return;

        // Extract title/address
        const title = card.querySelector('h2, h3, [class*="title"], [class*="address"]')?.textContent?.trim() ||
                      card.querySelector('a')?.textContent?.trim() || '';
        if (!title || title.length < 3) return;

        // Price
        const priceText = card.textContent || '';
        const priceMatch = priceText.match(/(\d{1,2}\s?\d{3}|\d+)\s*kr(?:\s*\/\s*mån|\/mån)?/i);
        const price = priceMatch ? parseInt(priceMatch[1].replace(/\s/g, ''), 10) : 0;

        // Rooms
        const roomsMatch = priceText.match(/(\d+)\s*(?:rum|r)(?:\s|,|\.)/i);
        const rooms = roomsMatch ? parseInt(roomsMatch[1], 10) : undefined;

        // Area
        const areaMatch = priceText.match(/([\d]+)\s*m[²2]/i);
        const area = areaMatch ? parseFloat(areaMatch[1]) : undefined;

        // Image
        const img = card.querySelector('img[src*="bostadsportal"], img[alt]') as HTMLImageElement;
        const imageUrl = img?.src || undefined;

        // Extract ID from URL or title
        const id = link.href.split('/').filter(Boolean).pop() ||
                   title.replace(/[^a-zA-Z0-9åäö]/g, '-').toLowerCase();

        if (price > 0 && title.length >= 3) {
          results.push({
            id,
            title,
            href: link.href,
            price,
            rooms,
            area,
            imageUrl,
          });
        }
      } catch (e) {
        // Skip problematic cards
      }
    });

    return results;
  });

  // Map to ScrapedListing format
  return rawListings.map((l): ScrapedListing => ({
    externalId: `bostadsportal-${l.id}`,
    source: 'bostadsportal',
    title: `Bostadsportal – ${l.title}`,
    price: l.price,
    rooms: l.rooms,
    area: l.area,
    address: `${l.title}, Lund`,
    imageUrl: l.imageUrl,
    url: l.href.startsWith('http') ? l.href : `https://www.bostadsportal.se${l.href}`,
    landlordType: 'private',
    petFriendly: false,
    hasFurnished: false,
    hasBalcony: false,
    listedAt: new Date(),
  })).filter(l => l.price >= 3000 && l.price <= 30000);
}
