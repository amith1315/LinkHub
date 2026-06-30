import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { db } from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory rate limiting map: ip -> { attempts: [timestamps], blockedUntil: Date }
const recoveryAttempts = new Map();

// Helper to clean and check rate limit
function checkRateLimit(ip) {
  const now = Date.now();
  let record = recoveryAttempts.get(ip);
  
  if (!record) {
    record = { attempts: [], blockedUntil: null };
    recoveryAttempts.set(ip, record);
  }

  // If currently blocked, check if block expired
  if (record.blockedUntil && record.blockedUntil > now) {
    return { allowed: false, remainingTime: Math.ceil((record.blockedUntil - now) / 1000 / 60) };
  } else if (record.blockedUntil && record.blockedUntil <= now) {
    // Block expired, reset
    record.blockedUntil = null;
    record.attempts = [];
  }

  // Filter attempts in the last 10 minutes
  record.attempts = record.attempts.filter(t => now - t < 10 * 60 * 1000);

  if (record.attempts.length >= 5) {
    record.blockedUntil = now + 10 * 60 * 1000; // 10 minutes block
    return { allowed: false, remainingTime: 10 };
  }

  return { allowed: true };
}

// Helper to record failed recovery attempt
function recordFailedAttempt(ip) {
  const record = recoveryAttempts.get(ip);
  if (record) {
    record.attempts.push(Date.now());
    if (record.attempts.length >= 5) {
      record.blockedUntil = Date.now() + 10 * 60 * 1000;
    }
  }
}

// Helper to clear rate limit on success
function clearRateLimit(ip) {
  recoveryAttempts.delete(ip);
}

// Helper to detect link type from URL
function detectLinkType(url) {
  try {
    let urlString = url;
    if (!/^https?:\/\//i.test(url)) {
      urlString = 'https://' + url;
    }
    const parsed = new URL(urlString);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();
    
    if (host.includes('github.com') || host.includes('gitlab.com')) {
      return 'repo';
    }
    if (host.includes('docs.google.com')) {
      if (path.includes('/document/')) return 'doc';
      if (path.includes('/spreadsheets/')) return 'sheet';
      if (path.includes('/presentation/')) return 'slide';
      return 'drive';
    }
    if (host.includes('drive.google.com')) {
      return 'drive';
    }
    if (host.includes('figma.com')) {
      return 'figma';
    }
    if (host.includes('notion.so') || host.includes('notion.site')) {
      return 'notion';
    }
    return 'other';
  } catch (e) {
    return 'other';
  }
}

// Helper to generate a unique 6-digit recovery code
async function generateRecoveryCode() {
  const existingCodes = await db.getAllRecoveryCodes();
  let code;
  let isUnique = false;
  while (!isUnique) {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    isUnique = !existingCodes.includes(code);
  }
  return code;
}

// --- API ROUTES ---

// 1. Create a user
app.post('/api/users', async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const userId = crypto.randomUUID();
    const recoveryCode = await generateRecoveryCode();
    
    const newUser = await db.createUser({
      user_id: userId,
      name: name.trim(),
      recovery_code: recoveryCode,
      theme_preference: 'light', // Updated default to 'light' per requirements
      created_at: new Date().toISOString()
    });

    res.status(201).json({
      user_id: newUser.user_id,
      name: newUser.name,
      recovery_code: newUser.recovery_code,
      theme_preference: newUser.theme_preference
    });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Recover user session via recovery code
app.post('/api/users/recover', async (req, res) => {
  const { recovery_code } = req.body;
  const ip = req.ip || req.socket.remoteAddress;

  if (!recovery_code || typeof recovery_code !== 'string') {
    return res.status(400).json({ error: 'Recovery code is required' });
  }

  // Check rate limit
  const limitStatus = checkRateLimit(ip);
  if (!limitStatus.allowed) {
    return res.status(429).json({
      error: `Too many failed attempts. Try again in ${limitStatus.remainingTime} minutes.`
    });
  }

  try {
    const cleanedCode = recovery_code.trim();
    const user = await db.getUserByRecoveryCode(cleanedCode);

    if (!user) {
      recordFailedAttempt(ip);
      return res.status(400).json({ error: 'Code not found or expired' });
    }

    clearRateLimit(ip);
    res.json({
      user_id: user.user_id,
      name: user.name,
      theme_preference: user.theme_preference,
      recovery_code: user.recovery_code
    });
  } catch (err) {
    console.error('Error recovering user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Regenerate recovery code
app.put('/api/users/regenerate-code', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const user = await db.getUser(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const newCode = await generateRecoveryCode();
    await db.regenerateRecoveryCode(userId, newCode);

    res.json({ recovery_code: newCode });
  } catch (err) {
    console.error('Error regenerating code:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Update theme preference
app.put('/api/users/theme', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { theme } = req.body;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (theme !== 'light' && theme !== 'dark') {
    return res.status(400).json({ error: 'Invalid theme' });
  }

  try {
    const user = await db.getUser(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await db.updateTheme(userId, theme);
    res.json({ success: true, theme });
  } catch (err) {
    console.error('Error updating theme:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. Get projects
app.get('/api/projects', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const includeArchived = req.query.include_archived === 'true';

  try {
    const projects = await db.getProjects(userId, includeArchived);
    res.json(projects);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 6. Create project
app.post('/api/projects', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { name, color, description } = req.body;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Project name is required' });
  }

  try {
    const newProject = await db.createProject({
      project_id: crypto.randomUUID(),
      user_id: userId,
      name: name.trim(),
      description: typeof description === 'string' ? description.trim() : null,
      color: color || 'indigo',
      archived_at: null,
      created_at: new Date().toISOString()
    });

    res.status(201).json(newProject);
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 7. Update project (rename or change color)
app.put('/api/projects/:id', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { id } = req.params;
  const { name, color, description } = req.body;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const updated = await db.updateProject(id, userId, name, color, description);
    if (!updated) return res.status(404).json({ error: 'Project not found' });
    res.json(updated);
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 8. Soft delete (Archive) project
app.delete('/api/projects/:id', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { id } = req.params;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const archivedAt = new Date().toISOString();
    const updated = await db.archiveProject(id, userId, archivedAt);
    if (!updated) return res.status(404).json({ error: 'Project not found' });
    res.json({ success: true, archived_at: archivedAt });
  } catch (err) {
    console.error('Error archiving project:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 9. Restore project from archive
app.post('/api/projects/:id/restore', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { id } = req.params;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const updated = await db.restoreProject(id, userId);
    if (!updated) return res.status(404).json({ error: 'Project not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Error restoring project:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 10. Permanently delete project and all its links
app.delete('/api/projects/:id/permanent', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { id } = req.params;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const success = await db.deleteProjectPermanently(id, userId);
    if (!success) return res.status(404).json({ error: 'Project not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 11. Share/Import project
app.post('/api/projects/share/:id', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { id } = req.params; // Original Project ID
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const clonedProject = await db.cloneProjectWithLinks(id, userId);
    res.status(201).json(clonedProject);
  } catch (err) {
    console.error('Error sharing project:', err);
    res.status(404).json({ error: err.message || 'Project not found' });
  }
});

// 12. Get links
app.get('/api/links', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const links = await db.getLinks(userId);
    res.json(links);
  } catch (err) {
    console.error('Error fetching links:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 13. Create link
app.post('/api/links', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { project_id, alias, url } = req.body;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!project_id || !alias || !url) {
    return res.status(400).json({ error: 'Project ID, Alias, and URL are required' });
  }

  try {
    const project = await db.getProject(project_id);
    if (!project || project.user_id !== userId) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const linkType = detectLinkType(url);
    const newLink = await db.createLink({
      link_id: crypto.randomUUID(),
      project_id,
      alias: alias.trim(),
      url: url.trim(),
      type: linkType,
      created_at: new Date().toISOString()
    });

    res.status(201).json(newLink);
  } catch (err) {
    console.error('Error creating link:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 14. Update link
app.put('/api/links/:id', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { id } = req.params;
  const { alias, url } = req.body;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const link = await db.getLink(id);
    if (!link) return res.status(404).json({ error: 'Link not found' });

    const project = await db.getProject(link.project_id);
    if (!project || project.user_id !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    let type = undefined;
    if (url !== undefined) {
      if (typeof url !== 'string' || url.trim() === '') {
        return res.status(400).json({ error: 'Invalid URL' });
      }
      type = detectLinkType(url);
    }

    const updated = await db.updateLink(id, alias, url, type);
    res.json(updated);
  } catch (err) {
    console.error('Error updating link:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 15. Delete link
app.delete('/api/links/:id', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { id } = req.params;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const link = await db.getLink(id);
    if (!link) return res.status(404).json({ error: 'Link not found' });

    const project = await db.getProject(link.project_id);
    if (!project || project.user_id !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db.deleteLink(id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting link:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[LinkHub Server] Running on http://localhost:${PORT}`);
  });
}
export default app;
