import { chromium } from 'playwright';

async function debugBostadsportal() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      locale: 'sv-SE',
    });
    const page = await context.newPage();

    // Don't block images - we need to see them
    await page.route('**/analytics**', r => r.abort());

    console.log('📍 Navigating to Bostadsportal Lund search...');

    try {
      await page.goto('https://www.bostadsportal.se/search?municipality=lund&type=apartment&for_sale=false', {
        waitUntil: 'load',
        timeout: 20000,
      });
    } catch (e) {
      console.log('⚠️  Load timeout (page may have loaded anyway), continuing...');
    }

    // Wait for potential redirects to settle
    await page.waitForTimeout(2000);

    const finalUrl = page.url();
    console.log(`✓ Final URL: ${finalUrl}\n`);

    // Get page info
    const info = await page.evaluate(() => {
      return {
        title: document.title,
        bodyText: document.body.innerText.substring(0, 500),
        html: document.body.innerHTML.substring(0, 1000),
      };
    });

    console.log('📄 Page Info:');
    console.log(`Title: ${info.title}`);
    console.log(`Sample text: ${info.bodyText.substring(0, 200)}...\n`);

    // Try many selectors
    console.log('\n🔍 Testing selectors:\n');

    const selectors = [
      { name: 'article', sel: 'article' },
      { name: 'listing divs', sel: 'div[class*="listing"]' },
      { name: 'apartment cards', sel: 'div[class*="apartment"]' },
      { name: 'property items', sel: 'div[class*="property"]' },
      { name: 'item links', sel: 'a[href*="/bostad"]' },
      { name: 'generic links', sel: 'a[href]' },
      { name: 'list items', sel: 'li' },
      { name: 'all divs', sel: 'div' },
      { name: 'cards/items', sel: '[class*="card"], [class*="item"]' },
      { name: 'images', sel: 'img[src]' },
    ];

    const results = await page.evaluate((selectorList) => {
      const results: any[] = [];
      for (const {name, sel} of selectorList) {
        const els = document.querySelectorAll(sel);
        if (els.length > 0) {
          const sample = els[0];
          results.push({
            name,
            selector: sel,
            count: els.length,
            classes: (sample as HTMLElement).className,
            innerText: (sample as HTMLElement).innerText?.substring(0, 100),
            html: (sample as HTMLElement).outerHTML.substring(0, 300),
          });
        }
      }
      return results;
    }, selectors);

    results.forEach(r => {
      console.log(`✅ ${r.name} (${r.count} found)`);
      console.log(`   Selector: ${r.selector}`);
      console.log(`   Classes: ${r.classes}`);
      console.log(`   Sample: ${r.innerText?.substring(0, 60) || 'N/A'}`);
      console.log();
    });

    // Try to extract actual listing data
    console.log('\n🎯 Attempting extraction with promising selectors:\n');

    const extractedData = await page.evaluate(() => {
      const listings: any[] = [];

      // Try the selectors that found elements
      const possibleSelectors = [
        'a[href*="/bostad"]',
        'article',
        'div[class*="listing"]',
        'div[class*="property"]',
      ];

      for (const sel of possibleSelectors) {
        const elements = document.querySelectorAll(sel);
        if (elements.length > 0) {
          console.log(`\nTrying selector: ${sel} (${elements.length} elements)`);

          elements.forEach((el, idx) => {
            if (idx > 2) return; // Only first 3

            const text = (el as HTMLElement).innerText || '';
            const link = el.querySelector('a[href]') as HTMLAnchorElement || el as any;
            const img = el.querySelector('img') as HTMLImageElement;

            // Try to extract price
            const priceMatch = text.match(/(\d+\s*\d{3})\s*kr/);
            const price = priceMatch ? parseInt(priceMatch[1].replace(/\s/g, ''), 10) : null;

            // Try to extract rooms
            const roomsMatch = text.match(/(\d+)\s*rum/i);
            const rooms = roomsMatch ? parseInt(roomsMatch[1], 10) : null;

            listings.push({
              selector: sel,
              text: text.substring(0, 150),
              link: link?.href || 'no link',
              image: img?.src || 'no image',
              price,
              rooms,
            });
          });
        }
      }

      return listings;
    });

    console.log('Extracted Data:');
    extractedData.forEach((item, i) => {
      console.log(`\n[${i}] Selector: ${item.selector}`);
      console.log(`    Text: ${item.text}`);
      console.log(`    Link: ${item.link}`);
      console.log(`    Price: ${item.price}, Rooms: ${item.rooms}`);
    });

  } catch (err) {
    console.error('❌ Error:', err instanceof Error ? err.message : err);
  } finally {
    await browser.close();
  }
}

debugBostadsportal();
