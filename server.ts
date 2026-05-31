import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import cron from 'node-cron';
import { scrapeBlocket } from './api/scrapers/blocket.js';
import { scrapeLKF } from './api/scrapers/lkf.js';
import { scrapeQasa } from './api/scrapers/qasa.js';
import { scrapeAFBostader } from './api/scrapers/afbostader.js';

dotenv.config();

const app: Express = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
}));
app.use(express.json());

// Types
interface AuthRequest extends Request {
  user?: { id: string; email: string; familyId: string };
}

// Auth middleware
const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Auth routes
app.post('/api/routes/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create family
    const family = await prisma.family.create({
      data: {
        name: `${fullName}'s Family`,
        adminId: 'temp', // Will be updated
      },
    });

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password, // In production: hash with bcrypt
        fullName,
        familyId: family.id,
        role: 'parent',
      },
    });

    // Update family adminId
    await prisma.family.update({
      where: { id: family.id },
      data: { adminId: user.id },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, familyId: user.familyId },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, fullName: user.fullName, familyId: user.familyId },
      family: { id: family.id, name: family.name },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/routes/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const family = await prisma.family.findUnique({ where: { id: user.familyId } });

    const token = jwt.sign(
      { id: user.id, email: user.email, familyId: user.familyId },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, fullName: user.fullName, familyId: user.familyId, role: user.role },
      family: family ? { id: family.id, name: family.name } : null,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/routes/auth/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user?.id } });
    const family = await prisma.family.findUnique({ where: { id: req.user?.familyId } });

    res.json({
      user: { id: user?.id, email: user?.email, fullName: user?.fullName, familyId: user?.familyId },
      family,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Listings routes (placeholder)
app.get('/api/routes/listings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ listings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// Applications routes (placeholder)
app.get('/api/routes/applications', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const applications = await prisma.application.findMany({
      where: { family: { users: { some: { id: req.user?.id } } } },
      include: { listing: true },
    });

    res.json({ applications });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

app.post('/api/routes/applications', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { listingId, status } = req.body;

    const application = await prisma.application.create({
      data: {
        familyId: req.user?.familyId || '',
        listingId,
        userWhoApplied: req.user?.id || '',
        status,
      },
      include: { listing: true },
    });

    res.json({ application });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create application' });
  }
});

app.patch('/api/routes/applications/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const application = await prisma.application.update({
      where: { id },
      data: { status, notes },
      include: { listing: true },
    });

    res.json({ application });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update application' });
  }
});

app.delete('/api/routes/applications/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.application.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

// Family routes
app.post('/api/routes/family', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;

    // Update existing family
    const family = await prisma.family.update({
      where: { id: req.user?.familyId },
      data: { name },
    });

    res.json({ family });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update family' });
  }
});

app.post('/api/routes/family/invite', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;

    // TODO: Send invite email via SendGrid
    // For now, just create user with family
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // In production: send email invite and create temp pending user
    res.json({ success: true, message: 'Invite sent (TODO: email not yet implemented)' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send invite' });
  }
});

// ── Email helpers ──────────────────────────────────────────────────────────────

function createTransport() {
  // Supports both Gmail/SMTP and SendGrid
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: { user: 'apikey', pass: process.env.SENDGRID_API_KEY },
    });
  }
  // Fallback: generic SMTP (e.g. Gmail app-password)
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function buildDigestHtml(listings: any[], isRealtime = false): string {
  const listingRows = listings.map((l) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f0">
        <a href="${l.url}" style="font-weight:600;color:#2563eb;text-decoration:none">${l.title}</a><br>
        <span style="color:#6b7280;font-size:13px">${l.address}</span><br>
        <strong style="color:#1d4ed8">${l.price.toLocaleString('sv-SE')} kr/mån</strong>
        ${l.rooms ? ` · ${l.rooms} rum` : ''}
        ${l.area ? ` · ${l.area} m²` : ''}
        <span style="display:inline-block;margin-left:8px;background:#dbeafe;color:#1e40af;padding:2px 8px;border-radius:999px;font-size:11px">${l.source}</span>
      </td>
    </tr>
  `).join('');

  const heading = isRealtime
    ? '🏠 Ny bostad i Lund!'
    : `🏠 Daglig sammanfattning – ${listings.length} nya bostäder`;

  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111">
      <h1 style="font-size:22px;margin-bottom:4px">${heading}</h1>
      <p style="color:#6b7280;margin-bottom:24px">Hitta boende i Lund för I&F</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${listingRows}
      </table>
      <p style="margin-top:24px;font-size:12px;color:#9ca3af">
        Du får det här mailet för att du prenumererar på bostadsnotiser.<br>
        <a href="${process.env.APP_URL || 'http://localhost:5173'}" style="color:#2563eb">Öppna dashboarden →</a>
      </p>
    </body>
    </html>
  `;
}

// ── Scraper helpers ────────────────────────────────────────────────────────────

async function upsertListings(scraped: Awaited<ReturnType<typeof scrapeBlocket>>) {
  let newCount = 0;
  for (const item of scraped) {
    try {
      const existing = await prisma.listing.findUnique({
        where: { externalId_source: { externalId: item.externalId, source: item.source } },
      });

      if (!existing) {
        await prisma.listing.create({
          data: {
            externalId: item.externalId,
            source: item.source,
            title: item.title,
            description: item.description,
            price: item.price,
            rooms: item.rooms,
            area: item.area,
            address: item.address,
            imageUrl: item.imageUrl,
            url: item.url,
            type: 'apartment',
            landlordType: item.landlordType,
            petFriendly: item.petFriendly,
            hasFurnished: item.hasFurnished,
            hasBalcony: item.hasBalcony,
            listedAt: item.listedAt,
            leaseType: 'long_term',
            isActive: true,
          },
        });
        newCount++;
      }
    } catch (err) {
      // Skip individual failures (e.g. duplicate URL constraint)
      console.warn(`[scraper] skip ${item.externalId}:`, (err as Error).message);
    }
  }
  return newCount;
}

async function runScrapers() {
  // Share one browser instance across scrapers to save memory
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });

  try {
    const results = await Promise.allSettled([
      scrapeBlocket(browser as any).then(async (items) => {
        const n = await upsertListings(items);
        await prisma.apiPoll.create({
          data: { source: 'blocket', status: 'success', listingsFound: items.length, newListings: n, nextPollAt: new Date(Date.now() + 15 * 60_000) },
        });
        console.log(`[blocket] ${items.length} fetched, ${n} new`);
      }).catch(async (err) => {
        await prisma.apiPoll.create({
          data: { source: 'blocket', status: 'error', listingsFound: 0, newListings: 0, errorMessage: err.message, nextPollAt: new Date(Date.now() + 15 * 60_000) },
        });
        throw err;
      }),
      scrapeLKF(browser as any).then(async (items) => {
        const n = await upsertListings(items);
        await prisma.apiPoll.create({
          data: { source: 'lkf', status: 'success', listingsFound: items.length, newListings: n, nextPollAt: new Date(Date.now() + 60 * 60_000) },
        });
        console.log(`[lkf] ${items.length} fetched, ${n} new`);
      }).catch(async (err) => {
        await prisma.apiPoll.create({
          data: { source: 'lkf', status: 'error', listingsFound: 0, newListings: 0, errorMessage: err.message, nextPollAt: new Date(Date.now() + 60 * 60_000) },
        });
        throw err;
      }),
      scrapeAFBostader().then(async (items) => {
        const n = await upsertListings(items);
        await prisma.apiPoll.create({
          data: { source: 'afbostader', status: 'success', listingsFound: items.length, newListings: n, nextPollAt: new Date(Date.now() + 60 * 60_000) },
        });
        console.log(`[afbostader] ${items.length} fetched, ${n} new`);
      }).catch(async (err) => {
        await prisma.apiPoll.create({
          data: { source: 'afbostader', status: 'error', listingsFound: 0, newListings: 0, errorMessage: err.message, nextPollAt: new Date(Date.now() + 60 * 60_000) },
        });
        console.error('[afbostader]', err.message);
      }),
      // Qasa uses direct GraphQL API - no browser needed
      scrapeQasa().then(async (items) => {
        const n = await upsertListings(items);
        await prisma.apiPoll.create({
          data: { source: 'qasa', status: 'success', listingsFound: items.length, newListings: n, nextPollAt: new Date(Date.now() + 15 * 60_000) },
        });
        console.log(`[qasa] ${items.length} fetched, ${n} new`);
      }).catch(async (err) => {
        await prisma.apiPoll.create({
          data: { source: 'qasa', status: 'error', listingsFound: 0, newListings: 0, errorMessage: err.message, nextPollAt: new Date(Date.now() + 15 * 60_000) },
        });
        throw err;
      }),
    ]);

    for (const r of results) {
      if (r.status === 'rejected') console.error('[scraper] error:', r.reason);
    }
  } finally {
    await browser.close();
  }
}

async function sendDigestToSubscribers(isRealtime = false) {
  const subscribers = await prisma.notificationPreferences.findMany({
    where: {
      emailFrequency: isRealtime ? 'realtime' : 'daily',
      notifyNewListings: true,
    },
  });

  if (subscribers.length === 0) return;

  const since = new Date(Date.now() - (isRealtime ? 15 * 60 * 1000 : 24 * 60 * 60 * 1000));
  const newListings = await prisma.listing.findMany({
    where: { isActive: true, createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  if (newListings.length === 0) {
    console.log('[email] No new listings, skipping digest');
    return;
  }

  const transport = createTransport();
  const html = buildDigestHtml(newListings, isRealtime);
  const subject = isRealtime
    ? `🏠 Ny bostad: ${newListings[0].title}`
    : `🏠 ${newListings.length} nya bostäder i Lund idag`;

  const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_USER || 'noreply@example.com';

  for (const sub of subscribers) {
    const user = await prisma.user.findUnique({ where: { id: sub.userId } });
    if (!user?.email) continue;
    try {
      await transport.sendMail({
        from: `"Hitta boende Lund" <${fromEmail}>`,
        to: user.email,
        subject,
        html,
      });
      console.log(`[email] Sent digest to ${user.email}`);
    } catch (err) {
      console.error(`[email] Failed to send to ${user.email}:`, err);
    }
  }
}

// ── Email subscription endpoint ────────────────────────────────────────────────

app.post('/api/email/subscribe', async (req: Request, res: Response) => {
  try {
    const { email, frequency } = req.body as { email: string; frequency: 'daily' | 'realtime' };

    if (!email || !frequency) {
      return res.status(400).json({ error: 'Email och frekvens krävs' });
    }

    // Find or create user by email (unauthenticated signup)
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Create a guest family + user
      const family = await prisma.family.create({
        data: { name: 'Gäst', adminId: 'pending' },
      });
      user = await prisma.user.create({
        data: {
          email,
          password: '',
          fullName: email,
          familyId: family.id,
          role: 'family_member',
        },
      });
      await prisma.family.update({
        where: { id: family.id },
        data: { adminId: user.id },
      });
    }

    // Upsert notification preferences
    await prisma.notificationPreferences.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        emailFrequency: frequency,
        notifyNewListings: true,
      },
      update: {
        emailFrequency: frequency,
        notifyNewListings: true,
      },
    });

    // Send a welcome confirmation
    try {
      const transport = createTransport();
      const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_USER || 'noreply@example.com';
      await transport.sendMail({
        from: `"Hitta boende Lund" <${fromEmail}>`,
        to: email,
        subject: '✅ Prenumeration aktiverad – Hitta boende i Lund',
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:500px;margin:0 auto;padding:24px">
            <h2>Prenumeration aktiverad!</h2>
            <p>Du prenumererar nu på ${frequency === 'daily' ? 'daglig sammanfattning kl 08:00' : 'direktnotiser'} från <strong>Hitta boende i Lund för I&F</strong>.</p>
            <p><a href="${process.env.APP_URL || 'http://localhost:5173'}" style="color:#2563eb">Öppna dashboarden →</a></p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.warn('[email] Welcome mail failed (check SMTP config):', emailErr);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Kunde inte spara prenumeration' });
  }
});

// ── Manual scrape trigger (for testing) ───────────────────────────────────────

app.post('/api/admin/scrape', async (req: Request, res: Response) => {
  const secret = req.headers['x-admin-secret'];
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    console.log('[admin] Manual scrape triggered');
    runScrapers().catch(console.error);
    res.json({ message: 'Scraping started in background' });
  } catch (err) {
    res.status(500).json({ error: 'Scrape failed' });
  }
});

// Poll status endpoint
app.get('/api/admin/poll-status', async (req: Request, res: Response) => {
  try {
    const polls = await prisma.apiPoll.findMany({
      orderBy: { polledAt: 'desc' },
      take: 20,
    });
    res.json({ polls });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch poll status' });
  }
});

// ── Cron jobs ──────────────────────────────────────────────────────────────────

// Scrape listings every 15 minutes
cron.schedule('*/15 * * * *', () => {
  console.log('[cron] Running scrapers...');
  runScrapers().catch(console.error);
});

// Daily digest: every day at 08:00
cron.schedule('0 8 * * *', () => {
  console.log('[cron] Running daily digest...');
  sendDigestToSubscribers(false).catch(console.error);
}, { timezone: 'Europe/Stockholm' });

// Realtime notifications: every 15 minutes after scrape
cron.schedule('*/15 * * * *', () => {
  sendDigestToSubscribers(true).catch(console.error);
});

// ── Error handling ─────────────────────────────────────────────────────────────

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log('[cron] Scrapers scheduled every 15 min');
  console.log('[cron] Daily digest scheduled at 08:00 Europe/Stockholm');
  // Run scrapers immediately on startup to populate initial data
  console.log('[startup] Running initial scrape...');
  runScrapers().catch(console.error);
});

export default app;
