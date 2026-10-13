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
import { getPlatforms, updatePlatformCredentials, syncPlatform } from './src/db/platforms.ts';
import { getOrCreateUser } from './src/db/users.ts';
import { syncAllVitrines, syncShopeeStorefront } from './src/services/vitrineSync.ts';
import { requireAuth, optionalAuth, signAdminToken, AUTHORIZED_ADMIN_EMAIL, AUTHORIZED_ADMIN_PASSWORD } from './src/middleware/auth.ts';
import type { AuthRequest } from './src/middleware/auth.ts';

import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '100mb' }));

// Static files from public directory (images, static html, videos)
app.use(express.static(path.resolve(__dirname, 'public'), {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.mp4')) {
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Accept-Ranges', 'bytes');
    }
  }
}));

// Rota de streaming de vídeo com suporte completo a Range (HTTP 206 Partial Content) para navegadores
app.get(['/sem-telinha/videos/:filename', '/assets/videos/:filename'], (req: Request, res: Response) => {
  const filename = decodeURIComponent(req.params.filename);
  const possiblePaths = [
    path.resolve(__dirname, 'public', 'sem-telinha', 'videos', filename),
    path.resolve(__dirname, 'public', 'sem-telinha', 'videos', 'criativo.mp4'),
    path.resolve(__dirname, 'public', 'sem-telinha', 'videos', 'criativo 000.mp4'),
    path.resolve(__dirname, 'public', 'assets', 'videos', filename),
    path.resolve(__dirname, 'dist', 'sem-telinha', 'videos', filename),
    path.resolve(__dirname, 'dist', 'sem-telinha', 'videos', 'criativo.mp4'),
  ];

  const videoPath = possiblePaths.find((p) => fs.existsSync(p));
  if (!videoPath) {
    return res.status(404).send('Vídeo não encontrado');
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      res.status(416).send(`Requested range not satisfiable: ${start} >= ${fileSize}`);
      return;
    }

    const chunksize = end - start + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Accept-Ranges': 'bytes',
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

// Endpoint para upload / atualização do vídeo da página Sem Telinha
app.post('/api/sem-telinha/video', async (req: Request, res: Response) => {
  try {
    const { videoBase64, filename = 'criativo.mp4' } = req.body;
    if (!videoBase64) {
      return res.status(400).json({ success: false, error: 'Dados do vídeo (base64) são obrigatórios' });
    }

    const cleanBase64 = videoBase64.replace(/^data:video\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const destDirs = [
      path.resolve(__dirname, 'public', 'sem-telinha', 'videos'),
      path.resolve(__dirname, 'dist', 'sem-telinha', 'videos'),
      path.resolve(__dirname, 'public', 'assets', 'videos'),
    ];

    for (const dir of destDirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(path.resolve(dir, 'criativo.mp4'), buffer);
      fs.writeFileSync(path.resolve(dir, 'criativo 000.mp4'), buffer);
      if (filename && filename !== 'criativo.mp4') {
        fs.writeFileSync(path.resolve(dir, filename), buffer);
      }
    }

    return res.json({
      success: true,
      message: 'Vídeo atualizado com sucesso!',
      videoUrl: '/sem-telinha/videos/criativo.mp4',
      sizeBytes: buffer.length,
    });
  } catch (error: any) {
    console.error('Erro ao salvar vídeo:', error);
    return res.status(500).json({ success: false, error: error.message || 'Falha ao salvar vídeo' });
  }
});

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

// Public/Admin API - Sincronização em tempo real das Vitrines de Afiliados (Shopee, etc.)
app.all('/api/sync/vitrine', async (req: Request, res: Response) => {
  try {
    const results = await syncAllVitrines();
    const totalFound = results.reduce((acc, r) => acc + r.totalFound, 0);
    const newlyAdded = results.reduce((acc, r) => acc + r.newlyAdded, 0);
    const updated = results.reduce((acc, r) => acc + r.updated, 0);

    res.json({
      success: true,
      message: `Vitrines sincronizadas! ${newlyAdded} novos produtos adicionados, ${updated} atualizados.`,
      data: {
        results,
        totalFound,
        newlyAdded,
        updated,
        syncedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Erro ao sincronizar vitrines:', error);
    res.status(500).json({ success: false, error: error.message || 'Falha ao sincronizar vitrines' });
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

// 404 Fallback for any API routes - Garante que rotas /api/* NUNCA retornem HTML
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Rota de API não encontrada: ${req.method} ${req.path}`,
  });
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

    // Auto-sync das vitrines na inicialização (após 3s para liberar inicialização do servidor)
    setTimeout(() => {
      console.log('Iniciando sincronização automática das vitrines de afiliados...');
      syncAllVitrines()
        .then((res) => console.log('Sincronização inicial de vitrines concluída:', res))
        .catch((err) => console.error('Erro na sincronização de vitrines:', err));
    }, 3000);

    // Repetir sincronização das vitrines a cada 10 minutos
    setInterval(() => {
      syncAllVitrines().catch((err) => console.error('Erro na sincronização periódica:', err));
    }, 10 * 60 * 1000);
  });
}

startServer();
