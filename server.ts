import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  getOffers,
  getOfferById,
  recordOfferClick,
  recordOfferView,
  createOffer,
  updateOffer,
  deleteOffer,
  getStats,
} from './src/db/offers.ts';
import {
  getPlatforms,
  updatePlatformCredentials,
  syncPlatform,
} from './src/db/platforms.ts';
import { getOrCreateUser } from './src/db/users.ts';
import { requireAuth, optionalAuth, signAdminToken, AUTHORIZED_ADMIN_EMAIL, AUTHORIZED_ADMIN_PASSWORD } from './src/middleware/auth.ts';
import type { AuthRequest } from './src/middleware/auth.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Public API - Get Offers (filtered by query)
app.get('/api/offers', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const isAdmin = !!req.user;
    const {
      platform,
      category,
      search,
      flashDealsOnly,
      featuredOnly,
      status,
      sortBy,
    } = req.query;

    const offers = await getOffers(
      {
        platform: platform ? String(platform) : undefined,
        category: category ? String(category) : undefined,
        search: search ? String(search) : undefined,
        flashDealsOnly: flashDealsOnly === 'true',
        featuredOnly: featuredOnly === 'true',
        status: status ? String(status) : undefined,
        sortBy: sortBy as any,
      },
      isAdmin
    );

    res.json({ success: true, count: offers.length, data: offers });
  } catch (error: any) {
    console.error('Error fetching offers:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch offers' });
  }
});

// Public API - Get Offer by ID with View Increment
app.get('/api/offers/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const offer = await getOfferById(id);
    if (!offer) {
      return res.status(404).json({ error: 'Oferta não encontrada' });
    }

    // Increment view asynchronously
    recordOfferView(id).catch((err) => console.error('Error recording view:', err));

    res.json({ success: true, data: offer });
  } catch (error: any) {
    console.error('Error fetching offer:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch offer' });
  }
});

// Public API - Record Affiliate Link Click
app.post('/api/offers/:id/click', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const offer = await getOfferById(id);
    if (!offer) {
      return res.status(404).json({ error: 'Oferta não encontrada' });
    }

    const updated = await recordOfferClick(id);
    res.json({
      success: true,
      affiliateUrl: offer.affiliateUrl,
      clicksCount: updated?.clicksCount || (offer.clicksCount || 0) + 1,
    });
  } catch (error: any) {
    console.error('Error recording click:', error);
    res.status(500).json({ error: error.message || 'Failed to record click' });
  }
});

// Auth API - Admin Login with exclusive credentials
app.post('/api/auth/admin-login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (
      normalizedEmail !== AUTHORIZED_ADMIN_EMAIL.toLowerCase() ||
      String(password) !== AUTHORIZED_ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        error: 'Credenciais inválidas. Apenas o usuário lagarelli@gmail.com possui acesso administrativo.',
      });
    }

    const token = signAdminToken(AUTHORIZED_ADMIN_EMAIL, 'Luiz Ricardo Agarelli');
    res.json({
      success: true,
      token,
      user: {
        uid: 'admin-lagarelli',
        email: AUTHORIZED_ADMIN_EMAIL,
        displayName: 'Luiz Ricardo Agarelli',
        role: 'admin',
      },
    });
  } catch (error: any) {
    console.error('Error during admin login:', error);
    res.status(500).json({ error: 'Falha interna ao autenticar administrador.' });
  }
});

// Auth API - Get current user profile
app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// Auth API - Sync Firebase User to Postgres
app.post('/api/auth/sync-user', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await getOrCreateUser(
      req.user.uid,
      req.user.email || 'anon@webstore360.com',
      req.user.name || undefined
    );
    res.json({ success: true, data: user });
  } catch (error: any) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: error.message || 'Failed to sync user' });
  }
});

// Admin API - Create Offer
app.post('/api/admin/offers', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const offerData = req.body;
    if (!offerData.title || !offerData.imageUrl || !offerData.originalPrice || !offerData.discountPrice || !offerData.affiliateUrl || !offerData.platform || !offerData.category) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
    }

    const created = await createOffer(offerData);
    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    console.error('Error creating offer:', error);
    res.status(500).json({ error: error.message || 'Failed to create offer' });
  }
});

// Admin API - Update Offer
app.put('/api/admin/offers/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await updateOffer(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Oferta não encontrada para atualização' });
    }
    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating offer:', error);
    res.status(500).json({ error: error.message || 'Failed to update offer' });
  }
});

// Admin API - Delete Offer
app.delete('/api/admin/offers/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await deleteOffer(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Oferta não encontrada para exclusão' });
    }
    res.json({ success: true, data: deleted });
  } catch (error: any) {
    console.error('Error deleting offer:', error);
    res.status(500).json({ error: error.message || 'Failed to delete offer' });
  }
});

// Admin API - Get Platform Credentials
app.get('/api/admin/platforms', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const platforms = await getPlatforms();
    res.json({ success: true, data: platforms });
  } catch (error: any) {
    console.error('Error fetching platforms:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch platforms' });
  }
});

// Admin API - Update Platform Credentials
app.put('/api/admin/platforms/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await updatePlatformCredentials(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Plataforma não encontrada' });
    }
    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating platform:', error);
    res.status(500).json({ error: error.message || 'Failed to update platform' });
  }
});

// Admin API - Sync Platform Catalog / API
app.post('/api/admin/platforms/:id/sync', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await syncPlatform(id);
    if (!updated) {
      return res.status(404).json({ error: 'Plataforma não encontrada' });
    }
    res.json({
      success: true,
      message: `Sincronização concluída com sucesso para ${updated.displayName}!`,
      data: updated,
    });
  } catch (error: any) {
    console.error('Error syncing platform:', error);
    res.status(500).json({ error: error.message || 'Failed to sync platform' });
  }
});

// Admin API - Dashboard Stats
app.get('/api/admin/stats', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const stats = await getStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch stats' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'WebStore360 API', timestamp: new Date().toISOString() });
});

// Frontend Vite Integration
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`WebStore360 server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
