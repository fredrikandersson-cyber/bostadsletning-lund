import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';
import type { ScrapedListing } from './blocket.js';

const LKF_URL = 'https://www.lkf.se/ledigt/lagenhet';

export async function scrapeLKF(browser?: Browser): Promise<ScrapedListing[]> {
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

    await page.goto(LKF_URL, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for Vue/Vitec Arena to fully render
    await page.waitForTimeout(3000);

    // Wait for the main object preview container
    await page.waitForSelector('.object-preview-headline-cc', { timeout: 15000 }).catch(() => {
      console.warn('[lkf] .object-preview-headline-cc not found, trying to continue');
    });

    const allListings: ScrapedListing[] = [];
    let pageNum = 1;
    const maxPages = 5; // Limit pagination to avoid infinite loops

    while (pageNum <= maxPages) {
      console.log(`[lkf] Scraping page ${pageNum}...`);

      // Extract all listings from current page
      const pageListings = await extractListings(page);
      allListings.push(...pageListings);
      console.log(`[lkf] Page ${pageNum}: found ${pageListings.length} listings (total: ${allListings.length})`);

      if (pageListings.length === 0) break;

      // Try to load more via pagination button
      const hasMore = await clickLoadMoreButton(page);
      if (!hasMore) break;

      pageNum++;
    }

    await context.close();

    console.log(`[lkf] Total listings found: ${allListings.length}`);
    return allListings;
  } catch (err) {
    console.error('[lkf] Scraper error:', err);
    return [];
  } finally {
    if (ownBrowser) await b.close();
  }
}

async function extractListings(page: Page): Promise<ScrapedListing[]> {
  const rawListings = await page.evaluate(() => {
    const results: any[] = [];

    // Main selector from investigation: .object-preview-headline-cc
    const headlineElements = document.querySelectorAll('.object-preview-headline-cc');
    console.log(`Found ${headlineElements.length} headline elements`);

    headlineElements.forEach((headlineEl) => {
      try {
        // Get the card parent (usually one level up or more)
        let card = headlineEl.closest('[class*="object-preview"], article, div[class*="card"]');
        if (!card) card = headlineEl.parentElement?.parentElement || headlineEl.parentElement;
        if (!card) return;

        // Address from h2 inside headline
        const h2 = headlineEl.querySelector('h2');
        const address = h2?.textContent?.trim() || '';
        if (!address) return;

        // Link to details page
        const link = card.querySelector('a[href*="/objekt/"], a[href*="/lagenhet/"]') as HTMLAnchorElement;
        const href = link?.href || '';

        // Full card text contains price, area, rooms in format:
        // "Allégatan 29 B\n7 225 kr\n•\n66 m2\n\n3 Rum och kök"
        const cardText = card.textContent || '';

        // Price: look for "7 225 kr" or "7225 kr" pattern
        const priceMatch = cardText.match(/(\d{1,2}\s?\d{3}|\d+)\s*kr\b/);
        const price = priceMatch ? parseInt(priceMatch[1].replace(/\s/g, ''), 10) : 0;

        // Rooms: "3 Rum och kök" → 3
        const roomsMatch = cardText.match(/(\d+)\s*(?:rum|r)\b/i);
        const rooms = roomsMatch ? parseInt(roomsMatch[1], 10) : undefined;

        // Area: "66 m2" or "66 m²"
        const areaMatch = cardText.match(/([\d]+)\s*m[²2]/i);
        const area = areaMatch ? parseFloat(areaMatch[1]) : undefined;

        // Image from figure or img
        const img = card.querySelector('figure img, img[src*="lkf"]') as HTMLImageElement;
        const imageUrl = img?.src || undefined;

        // Extract unique ID from URL
        const id = href.split('/').filter(Boolean).pop() ||
                   address.replace(/[^a-zA-Z0-9åäö]/g, '-').toLowerCase();

        if (price > 0) {
          results.push({
            id,
            address,
            href,
            price,
            rooms,
            area,
            imageUrl,
          });
        }
      } catch (e) {
        console.error('Error parsing card:', e);
      }
    });

    return results;
  });

  // Map to ScrapedListing format
  return rawListings.map((l): ScrapedListing => ({
    externalId: `lkf-${l.id}`,
    source: 'lkf',
    title: `LKF – ${l.address}`,
    price: l.price,
    rooms: l.rooms,
    area: l.area,
    address: `${l.address}, Lund`,
    imageUrl: l.imageUrl,
    url: l.href.startsWith('http') ? l.href : `https://www.lkf.se${l.href}`,
    landlordType: 'company',
    petFriendly: false,
    hasFurnished: false,
    hasBalcony: false,
    listedAt: new Date(),
  })).filter(l => l.price >= 3000 && l.price <= 30000); // Reasonable price range for Lund
}

async function clickLoadMoreButton(page: Page): Promise<boolean> {
  try {
    // Look for "Hämta fler" or "get-more-objects" button
    const moreButton = await page.$('[class*="get-more-objects"], button[class*="more"], button:has-text("Hämta"), a:has-text("Fler")');

    if (!moreButton) {
      console.log('[lkf] No more items button found');
      return false;
    }

    // Check if button is hidden or disabled
    const isVisible = await moreButton.isVisible().catch(() => false);
    if (!isVisible) {
      console.log('[lkf] Load more button not visible');
      return false;
    }

    console.log('[lkf] Clicking load more button...');
    await moreButton.click();
    await page.waitForTimeout(2000); // Wait for new items to load
    return true;
  } catch (err) {
    console.log('[lkf] Error clicking load more button:', err);
    return false;
  }
}
