import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

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

// Error handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
