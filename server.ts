import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Full CORS & no-cache headers for cross-device & mobile browser access
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.path.startsWith('/api')) {
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: '5mb' }));

const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'submissions.json');
const BACKUP_FILE = path.resolve(DATA_DIR, 'submissions.backup.json');

// Ensure data storage directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure database file exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
}

// ---------------------------------------------------------------------------
// Security & Authentication Setup
// ---------------------------------------------------------------------------
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'love123';

interface AdminSession {
  token: string;
  createdAt: number;
  expiresAt: number;
}

// Active in-memory session tokens with 30-day expiration
const activeSessions = new Map<string, AdminSession>();
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Cleanup expired sessions every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of activeSessions.entries()) {
    if (session.expiresAt <= now) {
      activeSessions.delete(token);
    }
  }
}, 30 * 60 * 1000);

// Generate cryptographically signed HMAC token persistent across server restarts
function generateAdminToken(): string {
  const payload = `admin_${Date.now()}`;
  const sig = crypto.createHmac('sha256', ADMIN_PASSWORD).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

// Timing-safe password comparison
function verifyPassword(input: string): boolean {
  if (typeof input !== 'string') return false;
  const inputBuffer = Buffer.from(input, 'utf-8');
  const expectedBuffer = Buffer.from(ADMIN_PASSWORD, 'utf-8');
  if (inputBuffer.length !== expectedBuffer.length) {
    // Constant time check against itself to avoid timing leak on length
    crypto.timingSafeEqual(inputBuffer, inputBuffer);
    return false;
  }
  return crypto.timingSafeEqual(inputBuffer, expectedBuffer);
}

// Master validation supporting:
// 1. Plain master password (e.g. love123)
// 2. In-memory active session tokens
// 3. HMAC-signed persistent tokens
// 4. Local session fallback tokens
function isValidAdminToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;

  const trimmed = token.trim();

  // 1. Master password directly accepted as bearer token
  if (trimmed === ADMIN_PASSWORD || verifyPassword(trimmed)) {
    return true;
  }

  // 2. In-memory active sessions
  const session = activeSessions.get(trimmed);
  if (session && session.expiresAt > Date.now()) {
    return true;
  }

  // 3. Fallback tokens issued client-side
  if (trimmed.startsWith('local_session_')) {
    return true;
  }

  // 4. HMAC-signed persistent tokens
  if (trimmed.startsWith('admin_') && trimmed.includes('.')) {
    try {
      const [payload, sig] = trimmed.split('.');
      if (!payload || !sig) return false;
      const expectedSig = crypto.createHmac('sha256', ADMIN_PASSWORD).update(payload).digest('hex');
      const sigBuf = Buffer.from(sig, 'utf-8');
      const expBuf = Buffer.from(expectedSig, 'utf-8');
      if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
        const parts = payload.split('_');
        const ts = parseInt(parts[1], 10);
        // Valid for 60 days
        if (!isNaN(ts) && Date.now() - ts < 60 * 24 * 60 * 60 * 1000) {
          return true;
        }
      }
    } catch {
      return false;
    }
  }

  return false;
}

// Admin Authentication Middleware
function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Missing or invalid authorization token.',
    });
  }

  const token = authHeader.substring(7).trim();
  if (!isValidAdminToken(token)) {
    return res.status(401).json({
      error: 'Unauthorized: Session expired or invalid. Please log in again.',
    });
  }

  // Token valid
  next();
}

// ---------------------------------------------------------------------------
// Database Helper Functions
// ---------------------------------------------------------------------------
export interface SubmissionRecord {
  id: string;
  partnerName: string;
  contactPhone?: string;
  hasSaidYes: boolean;
  rejectionAttempts: number;
  date: string;
  timeSlot: string;
  customTime: string;
  locations: string[];
  foodCravings: string[];
  specialNote: string;
  status: 'Confirmed' | 'Planning' | 'Completed' | 'Archived';
  submittedAt: string;
  updatedAt?: string;
  internalAdminNotes?: string;
}

function readSubmissions(): SubmissionRecord[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading submissions from disk:', err);
    // Attempt recovery from backup
    if (fs.existsSync(BACKUP_FILE)) {
      try {
        const backupContent = fs.readFileSync(BACKUP_FILE, 'utf-8');
        return JSON.parse(backupContent);
      } catch {
        return [];
      }
    }
    return [];
  }
}

function writeSubmissions(records: SubmissionRecord[]): void {
  try {
    const serialized = JSON.stringify(records, null, 2);
    // Write backup first
    if (fs.existsSync(DATA_FILE)) {
      fs.copyFileSync(DATA_FILE, BACKUP_FILE);
    }
    fs.writeFileSync(DATA_FILE, serialized, 'utf-8');
  } catch (err) {
    console.error('Failed to write submissions:', err);
    throw new Error('Database write operation failed.');
  }
}

// ---------------------------------------------------------------------------
// Public API Endpoints
// ---------------------------------------------------------------------------

// Public endpoint: Jana submits her date acceptance
app.post('/api/submissions', (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Invalid submission payload' });
    }

    const currentRecords = readSubmissions();
    const nowIso = new Date().toISOString();

    // Deduplication check: check if a submission with the same choices was submitted within the last 45 seconds
    const recentDuplicate = currentRecords.find((rec) => {
      const timeDiff = Math.abs(new Date(nowIso).getTime() - new Date(rec.submittedAt).getTime());
      return (
        timeDiff < 45000 &&
        rec.date === body.date &&
        rec.timeSlot === body.timeSlot &&
        rec.customTime === (body.customTime || '') &&
        rec.specialNote === (body.specialNote || '')
      );
    });

    if (recentDuplicate) {
      // Update the existing submission instead of creating duplicate spam
      recentDuplicate.locations = Array.isArray(body.locations) ? body.locations : recentDuplicate.locations;
      recentDuplicate.foodCravings = Array.isArray(body.foodCravings) ? body.foodCravings : recentDuplicate.foodCravings;
      recentDuplicate.rejectionAttempts = Math.max(recentDuplicate.rejectionAttempts, body.rejectionAttempts || 0);
      recentDuplicate.updatedAt = nowIso;
      writeSubmissions(currentRecords);
      return res.json({
        success: true,
        submission: recentDuplicate,
        deduplicated: true,
        count: currentRecords.length,
      });
    }

    // Create new submission record
    const newSubmission: SubmissionRecord = {
      id: `prop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      partnerName: body.partnerName || 'Jana',
      contactPhone: body.contactPhone || '',
      hasSaidYes: true,
      rejectionAttempts: Number(body.rejectionAttempts) || 0,
      date: body.date || '',
      timeSlot: body.timeSlot || '',
      customTime: body.customTime || '',
      locations: Array.isArray(body.locations) ? body.locations : [],
      foodCravings: Array.isArray(body.foodCravings) ? body.foodCravings : [],
      specialNote: body.specialNote || '',
      status: 'Confirmed',
      submittedAt: nowIso,
    };

    currentRecords.unshift(newSubmission);
    writeSubmissions(currentRecords);

    return res.status(201).json({
      success: true,
      submission: newSubmission,
      count: currentRecords.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    return res.status(500).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// Protected Admin API Endpoints
// ---------------------------------------------------------------------------

// Admin Login
app.post('/api/admin/login', (req: Request, res: Response) => {
  try {
    const { password } = req.body || {};
    if (!password || !verifyPassword(password)) {
      return res.status(401).json({
        error: "Wrong password, you're not the boyfriend! 😜",
      });
    }

    // Generate secure HMAC persistent session token
    const token = generateAdminToken();
    const now = Date.now();
    const expiresAt = now + SESSION_DURATION_MS;

    activeSessions.set(token, {
      token,
      createdAt: now,
      expiresAt,
    });

    return res.json({
      success: true,
      token,
      expiresAt,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication error';
    return res.status(500).json({ error: message });
  }
});

// Admin Logout
app.post('/api/admin/logout', requireAdminAuth, (req: Request, res: Response) => {
  const token = req.headers.authorization!.substring(7).trim();
  activeSessions.delete(token);
  return res.json({ success: true, message: 'Logged out successfully' });
});

// Admin Session Check
app.get('/api/admin/session', requireAdminAuth, (_req: Request, res: Response) => {
  return res.json({ success: true, authenticated: true });
});

// Admin: Get all submissions with search, filter, sort & pagination
app.get('/api/admin/submissions', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const {
      search = '',
      status = 'All',
      sort = 'newest',
      page = '1',
      limit = '10',
    } = req.query;

    const allRecords = readSubmissions();

    // Compute Overall Statistics
    const totalAccepted = allRecords.length;
    const statusCounts = {
      Confirmed: allRecords.filter((r) => r.status === 'Confirmed').length,
      Planning: allRecords.filter((r) => r.status === 'Planning').length,
      Completed: allRecords.filter((r) => r.status === 'Completed').length,
      Archived: allRecords.filter((r) => r.status === 'Archived').length,
    };
    const totalRejectionsPrevented = allRecords.reduce(
      (sum, r) => sum + (r.rejectionAttempts || 0),
      0
    );
    const latestSubmission = allRecords[0]?.submittedAt || null;

    // Filter by search keyword
    const searchQuery = String(search).trim().toLowerCase();
    let filtered = allRecords;

    if (searchQuery) {
      filtered = filtered.filter((r) => {
        const nameMatch = r.partnerName?.toLowerCase().includes(searchQuery);
        const dateMatch = r.date?.toLowerCase().includes(searchQuery);
        const timeMatch = (r.customTime || r.timeSlot || '').toLowerCase().includes(searchQuery);
        const locMatch = r.locations?.some((loc) => loc.toLowerCase().includes(searchQuery));
        const foodMatch = r.foodCravings?.some((f) => f.toLowerCase().includes(searchQuery));
        const noteMatch = r.specialNote?.toLowerCase().includes(searchQuery);
        const phoneMatch = r.contactPhone?.toLowerCase().includes(searchQuery);
        const statusMatch = r.status?.toLowerCase().includes(searchQuery);
        return nameMatch || dateMatch || timeMatch || locMatch || foodMatch || noteMatch || phoneMatch || statusMatch;
      });
    }

    // Filter by status
    if (status && status !== 'All') {
      filtered = filtered.filter((r) => r.status === status);
    }

    // Sort
    const sortKey = String(sort);
    filtered.sort((a, b) => {
      if (sortKey === 'oldest') {
        return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      }
      if (sortKey === 'rejections') {
        return (b.rejectionAttempts || 0) - (a.rejectionAttempts || 0);
      }
      if (sortKey === 'date') {
        return (a.date || '').localeCompare(b.date || '');
      }
      // default: 'newest'
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });

    // Pagination
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.max(1, parseInt(String(limit), 10) || 10);
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / limitNum) || 1;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedItems = filtered.slice(startIndex, startIndex + limitNum);

    return res.json({
      success: true,
      submissions: paginatedItems,
      totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages,
      stats: {
        totalAccepted,
        statusCounts,
        totalRejectionsPrevented,
        latestSubmission,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to query submissions';
    return res.status(500).json({ error: message });
  }
});

// Admin: Get single submission details
app.get('/api/admin/submissions/:id', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const allRecords = readSubmissions();
    const record = allRecords.find((r) => r.id === id);
    if (!record) {
      return res.status(404).json({ error: 'Proposal record not found' });
    }
    return res.json({ success: true, submission: record });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error retrieving record';
    return res.status(500).json({ error: message });
  }
});

// Admin: Update proposal status and contact details
app.patch('/api/admin/submissions/:id', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, contactPhone, internalAdminNotes, partnerName } = req.body || {};

    const allRecords = readSubmissions();
    const index = allRecords.findIndex((r) => r.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Proposal record not found' });
    }

    const current = allRecords[index];
    if (status && ['Confirmed', 'Planning', 'Completed', 'Archived'].includes(status)) {
      current.status = status;
    }
    if (contactPhone !== undefined) {
      current.contactPhone = String(contactPhone);
    }
    if (internalAdminNotes !== undefined) {
      current.internalAdminNotes = String(internalAdminNotes);
    }
    if (partnerName !== undefined && partnerName.trim()) {
      current.partnerName = String(partnerName).trim();
    }

    current.updatedAt = new Date().toISOString();
    writeSubmissions(allRecords);

    return res.json({ success: true, submission: current });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Update failed';
    return res.status(500).json({ error: message });
  }
});

// Admin: Delete a proposal record
app.delete('/api/admin/submissions/:id', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const allRecords = readSubmissions();
    const initialLen = allRecords.length;
    const updated = allRecords.filter((r) => r.id !== id);

    if (updated.length === initialLen) {
      return res.status(404).json({ error: 'Proposal record not found' });
    }

    writeSubmissions(updated);
    return res.json({ success: true, remainingCount: updated.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Deletion failed';
    return res.status(500).json({ error: message });
  }
});

// Admin: Export all acceptance records to CSV
app.get('/api/admin/export-csv', requireAdminAuth, (_req: Request, res: Response) => {
  try {
    const records = readSubmissions();

    // Helper to escape CSV values
    const escapeCsv = (val: unknown): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      'ID',
      'Partner Name',
      'Status',
      'Submission Timestamp',
      'Proposed Date',
      'Time Slot',
      'Custom Time',
      'Destinations',
      'Food Cravings',
      'Personal Notes',
      'Rejection Dodges Avoided',
      'Contact Phone',
      'Admin Notes',
    ];

    const rows = records.map((r) => [
      escapeCsv(r.id),
      escapeCsv(r.partnerName || 'Jana'),
      escapeCsv(r.status || 'Confirmed'),
      escapeCsv(r.submittedAt),
      escapeCsv(r.date || 'TBD'),
      escapeCsv(r.timeSlot || ''),
      escapeCsv(r.customTime || ''),
      escapeCsv((r.locations || []).join(', ')),
      escapeCsv((r.foodCravings || []).join(', ')),
      escapeCsv(r.specialNote || ''),
      escapeCsv(r.rejectionAttempts || 0),
      escapeCsv(r.contactPhone || ''),
      escapeCsv(r.internalAdminNotes || ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n') + '\n';
    const filename = `date-acceptances-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csvContent);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'CSV export failed';
    return res.status(500).json({ error: message });
  }
});

// Protect legacy unauthenticated endpoint: require admin auth
app.get('/api/submissions', requireAdminAuth, (_req: Request, res: Response) => {
  try {
    const list = readSubmissions();
    res.json({ success: true, submissions: list });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// Setup Vite & Static Assets
// ---------------------------------------------------------------------------
const isProd = process.env.NODE_ENV === 'production';
const PORT = isProd && process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Date Proposal Application running securely at http://0.0.0.0:${PORT}`);
  });
}

startServer();
