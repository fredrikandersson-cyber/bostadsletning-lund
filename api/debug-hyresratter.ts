import { chromium } from 'playwright';

async function debugHyresratter() {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-web-resources',
      '--disable-sync',
    ],
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    locale: 'sv-SE',
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  await page.route('**/*.{png,jpg,jpeg,gif,webp,woff,woff2,ttf}', r => r.abort());

  try {
    console.log('📍 Navigating to Hyresrätter...');

    // Try with networkidle timeout first
    try {
      await page.goto('https://www.hyresratter.se/lediga-lagenheter/lund', {
        waitUntil: 'load',
        timeout: 15000,
      });
    } catch (e) {
      console.warn('⚠️  Timeout on networkidle, continuing with current DOM...');
    }

    await page.waitForTimeout(2000);

    console.log('\n🔍 Inspecting page structure...\n');

    const pageInfo = await page.evaluate(() => {
      const info: any = {
        title: document.title,
        url: window.location.href,
        selectors: {},
      };

      // Try various selectors
      const selectors = [
        'article',
        'div[class*="listing"]',
        'div[class*="object"]',
        'div[class*="item"]',
        'div[role="link"]',
        'a[href*="/objekt"]',
        'a[href*="/bostad"]',
        '.property',
        '.listing-item',
        '[data-test*="listing"]',
      ];

      for (const sel of selectors) {
        const els = document.querySelectorAll(sel);
        info.selectors[sel] = {
          count: els.length,
          sample: els.length > 0 ? els[0].outerHTML.substring(0, 200) : 'No elements',
        };
      }

      return info;
    });

    console.log('Page Title:', pageInfo.title);
    console.log('URL:', pageInfo.url);
    console.log('\nSelector Results:');
    Object.entries(pageInfo.selectors).forEach(([sel, data]: any) => {
      if (data.count > 0) {
        console.log(`✅ ${sel}: ${data.count} elements`);
        console.log(`   Sample: ${data.sample}...\n`);
      }
    });

    // Try to extract listings
    console.log('\n🎯 Attempting to extract listing data...\n');
    const listings = await page.evaluate(() => {
      const results: any[] = [];

      // Try all possible listing selectors
      const possibleCards = [
        ...document.querySelectorAll('article'),
        ...document.querySelectorAll('div[class*="listing"]'),
        ...document.querySelectorAll('div[class*="object"]'),
        ...document.querySelectorAll('[role="link"]'),
      ];

      console.log(`Found ${possibleCards.length} potential cards`);

      possibleCards.slice(0, 3).forEach((card, idx) => {
        const result: any = {
          index: idx,
          classes: (card as HTMLElement).className,
          text: (card as HTMLElement).innerText?.substring(0, 150),
          html: (card as HTMLElement).outerHTML.substring(0, 300),
        };

        // Try to find link
        const link = card.querySelector('a[href]');
        if (link) {
          result.link = (link as HTMLAnchorElement).href;
        }

        // Try to find price
        const text = (card as HTMLElement).innerText || '';
        const priceMatch = text.match(/(\d+\s*\d*)\s*kr/);
        if (priceMatch) {
          result.price = priceMatch[1];
        }

        results.push(result);
      });

      return results;
    });

    console.log('Sample Listings:');
    console.log(JSON.stringify(listings, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await context.close();
    await browser.close();
  }
}

debugHyresratter();
