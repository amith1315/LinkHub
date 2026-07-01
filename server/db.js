import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import crypto from 'crypto';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'data', 'db.json');

// Initialize pg Connection Pool if connection string is provided
const connectionString = process.env.DATABASE_URL;
let pool = null;

if (connectionString) {
  console.log('[LinkHub DB] Initializing PostgreSQL Connection Pool...');
  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });
  // Verify/add sort_order columns dynamically on startup
  pool.query('ALTER TABLE projects ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0')
    .then(() => pool.query('ALTER TABLE links ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0'))
    .then(() => console.log('[LinkHub DB] sort_order column checking completed.'))
    .catch(err => console.error('[LinkHub DB] Migration check error:', err));
} else {
  console.log('[LinkHub DB] DATABASE_URL not found. Using local JSON DB fallback.');
}

// --- LOCAL JSON FALLBACK HELPERS ---
function initJSONDB() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], projects: [], links: [] }, null, 2));
  }
}

function readJSONDB() {
  initJSONDB();
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (err) {
    console.error('Error reading JSON DB:', err);
    return { users: [], projects: [], links: [] };
  }
}

function writeJSONDB(data) {
  initJSONDB();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing JSON DB:', err);
    return false;
  }
}

// --- DATABASE REPOSITORY ---

export const db = {
  // --- USERS ---
  async createUser({ user_id, name, recovery_code, theme_preference, created_at }) {
    if (pool) {
      const query = `
        INSERT INTO users (user_id, name, recovery_code, theme_preference, created_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const res = await pool.query(query, [user_id, name, recovery_code, theme_preference || 'light', created_at]);
      return res.rows[0];
    } else {
      const state = readJSONDB();
      const user = { user_id, name, recovery_code, theme_preference: theme_preference || 'light', created_at };
      state.users.push(user);
      writeJSONDB(state);
      return user;
    }
  },

  async getUser(userId) {
    if (pool) {
      const res = await pool.query('SELECT * FROM users WHERE user_id = $1', [userId]);
      return res.rows[0] || null;
    } else {
      const state = readJSONDB();
      return state.users.find(u => u.user_id === userId) || null;
    }
  },

  async getUserByRecoveryCode(code) {
    if (pool) {
      const res = await pool.query('SELECT * FROM users WHERE recovery_code = $1', [code]);
      return res.rows[0] || null;
    } else {
      const state = readJSONDB();
      return state.users.find(u => u.recovery_code === code) || null;
    }
  },

  async updateTheme(userId, theme) {
    if (pool) {
      await pool.query('UPDATE users SET theme_preference = $1 WHERE user_id = $2', [theme, userId]);
      return { theme };
    } else {
      const state = readJSONDB();
      const idx = state.users.findIndex(u => u.user_id === userId);
      if (idx !== -1) {
        state.users[idx].theme_preference = theme;
        writeJSONDB(state);
      }
      return { theme };
    }
  },

  async regenerateRecoveryCode(userId, newCode) {
    if (pool) {
      await pool.query('UPDATE users SET recovery_code = $1 WHERE user_id = $2', [newCode, userId]);
      return newCode;
    } else {
      const state = readJSONDB();
      const idx = state.users.findIndex(u => u.user_id === userId);
      if (idx !== -1) {
        state.users[idx].recovery_code = newCode;
        writeJSONDB(state);
      }
      return newCode;
    }
  },

  async getAllRecoveryCodes() {
    if (pool) {
      const res = await pool.query('SELECT recovery_code FROM users');
      return res.rows.map(r => r.recovery_code);
    } else {
      const state = readJSONDB();
      return state.users.map(u => u.recovery_code);
    }
  },

  // --- PROJECTS ---
  async getProjects(userId, includeArchived = false) {
    if (pool) {
      const query = includeArchived
        ? 'SELECT * FROM projects WHERE user_id = $1 ORDER BY sort_order ASC, created_at DESC'
        : 'SELECT * FROM projects WHERE user_id = $1 AND archived_at IS NULL ORDER BY sort_order ASC, created_at DESC';
      const res = await pool.query(query, [userId]);
      return res.rows;
    } else {
      const state = readJSONDB();
      return state.projects
        .filter(p => p.user_id === userId && (includeArchived ? true : p.archived_at === null))
        .sort((a, b) => {
          const orderA = a.sort_order || 0;
          const orderB = b.sort_order || 0;
          if (orderA !== orderB) return orderA - orderB;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    }
  },

  async createProject({ project_id, user_id, name, description, color, archived_at, created_at }) {
    if (pool) {
      const maxRes = await pool.query('SELECT COALESCE(MAX(sort_order), 0) as max_val FROM projects WHERE user_id = $1', [user_id]);
      const sortOrder = (maxRes.rows[0]?.max_val || 0) + 1;
      const query = `
        INSERT INTO projects (project_id, user_id, name, description, color, archived_at, sort_order, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      const res = await pool.query(query, [project_id, user_id, name, description || null, color || 'indigo', archived_at || null, sortOrder, created_at]);
      return res.rows[0];
    } else {
      const state = readJSONDB();
      const userProjects = state.projects.filter(p => p.user_id === user_id);
      const maxOrder = userProjects.reduce((max, p) => Math.max(max, p.sort_order || 0), 0);
      const project = { project_id, user_id, name, description: description || null, color: color || 'indigo', archived_at: archived_at || null, sort_order: maxOrder + 1, created_at };
      state.projects.push(project);
      writeJSONDB(state);
      return project;
    }
  },

  async getProject(projectId) {
    if (pool) {
      const res = await pool.query('SELECT * FROM projects WHERE project_id = $1', [projectId]);
      return res.rows[0] || null;
    } else {
      const state = readJSONDB();
      return state.projects.find(p => p.project_id === projectId) || null;
    }
  },

  async updateProject(projectId, userId, name, color, description) {
    if (pool) {
      let query = 'UPDATE projects SET ';
      const params = [];
      const parts = [];
      if (name !== undefined) {
        params.push(name);
        parts.push(`name = $${params.length}`);
      }
      if (color !== undefined) {
        params.push(color);
        parts.push(`color = $${params.length}`);
      }
      if (description !== undefined) {
        params.push(description || null);
        parts.push(`description = $${params.length}`);
      }
      params.push(projectId);
      params.push(userId);
      query += parts.join(', ') + ` WHERE project_id = $${params.length - 1} AND user_id = $${params.length} RETURNING *`;
      const res = await pool.query(query, params);
      return res.rows[0] || null;
    } else {
      const state = readJSONDB();
      const idx = state.projects.findIndex(p => p.project_id === projectId && p.user_id === userId);
      if (idx !== -1) {
        if (name !== undefined) state.projects[idx].name = name;
        if (color !== undefined) state.projects[idx].color = color;
        if (description !== undefined) state.projects[idx].description = description || null;
        writeJSONDB(state);
        return state.projects[idx];
      }
      return null;
    }
  },

  async archiveProject(projectId, userId, archivedAt) {
    if (pool) {
      const res = await pool.query(
        'UPDATE projects SET archived_at = $1 WHERE project_id = $2 AND user_id = $3 RETURNING *',
        [archivedAt, projectId, userId]
      );
      return res.rows[0] || null;
    } else {
      const state = readJSONDB();
      const idx = state.projects.findIndex(p => p.project_id === projectId && p.user_id === userId);
      if (idx !== -1) {
        state.projects[idx].archived_at = archivedAt;
        writeJSONDB(state);
        return state.projects[idx];
      }
      return null;
    }
  },

  async restoreProject(projectId, userId) {
    if (pool) {
      const res = await pool.query(
        'UPDATE projects SET archived_at = NULL WHERE project_id = $1 AND user_id = $2 RETURNING *',
        [projectId, userId]
      );
      return res.rows[0] || null;
    } else {
      const state = readJSONDB();
      const idx = state.projects.findIndex(p => p.project_id === projectId && p.user_id === userId);
      if (idx !== -1) {
        state.projects[idx].archived_at = null;
        writeJSONDB(state);
        return state.projects[idx];
      }
      return null;
    }
  },

  async deleteProjectPermanently(projectId, userId) {
    if (pool) {
      // With ON DELETE CASCADE in PostgreSQL schema, deleting project deletes its links
      await pool.query('DELETE FROM projects WHERE project_id = $1 AND user_id = $2', [projectId, userId]);
      return true;
    } else {
      const state = readJSONDB();
      const idx = state.projects.findIndex(p => p.project_id === projectId && p.user_id === userId);
      if (idx !== -1) {
        state.projects.splice(idx, 1);
        state.links = state.links.filter(l => l.project_id !== projectId);
        writeJSONDB(state);
        return true;
      }
      return false;
    }
  },

  // --- LINKS ---
  async getLinks(userId) {
    if (pool) {
      const query = `
        SELECT l.* FROM links l
        JOIN projects p ON l.project_id = p.project_id
        WHERE p.user_id = $1
        ORDER BY l.sort_order ASC, l.created_at ASC
      `;
      const res = await pool.query(query, [userId]);
      return res.rows;
    } else {
      const state = readJSONDB();
      const userProjectIds = state.projects
        .filter(p => p.user_id === userId)
        .map(p => p.project_id);
      return state.links
        .filter(l => userProjectIds.includes(l.project_id))
        .sort((a, b) => {
          const orderA = a.sort_order || 0;
          const orderB = b.sort_order || 0;
          if (orderA !== orderB) return orderA - orderB;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
    }
  },

  async getProjectLinks(projectId) {
    if (pool) {
      const res = await pool.query('SELECT * FROM links WHERE project_id = $1 ORDER BY sort_order ASC, created_at ASC', [projectId]);
      return res.rows;
    } else {
      const state = readJSONDB();
      return state.links
        .filter(l => l.project_id === projectId)
        .sort((a, b) => {
          const orderA = a.sort_order || 0;
          const orderB = b.sort_order || 0;
          if (orderA !== orderB) return orderA - orderB;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
    }
  },

  async createLink({ link_id, project_id, alias, url, type, created_at }) {
    if (pool) {
      const maxRes = await pool.query('SELECT COALESCE(MAX(sort_order), 0) as max_val FROM links WHERE project_id = $1', [project_id]);
      const sortOrder = (maxRes.rows[0]?.max_val || 0) + 1;
      const query = `
        INSERT INTO links (link_id, project_id, alias, url, type, sort_order, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const res = await pool.query(query, [link_id, project_id, alias, url, type, sortOrder, created_at]);
      return res.rows[0];
    } else {
      const state = readJSONDB();
      const projectLinks = state.links.filter(l => l.project_id === project_id);
      const maxOrder = projectLinks.reduce((max, l) => Math.max(max, l.sort_order || 0), 0);
      const link = { link_id, project_id, alias, url, type, sort_order: maxOrder + 1, created_at };
      state.links.push(link);
      writeJSONDB(state);
      return link;
    }
  },

  async getLink(linkId) {
    if (pool) {
      const res = await pool.query('SELECT * FROM links WHERE link_id = $1', [linkId]);
      return res.rows[0] || null;
    } else {
      const state = readJSONDB();
      return state.links.find(l => l.link_id === linkId) || null;
    }
  },

  async updateLink(linkId, alias, url, type) {
    if (pool) {
      let query = 'UPDATE links SET ';
      const params = [];
      const parts = [];
      if (alias !== undefined) {
        params.push(alias);
        parts.push(`alias = $${params.length}`);
      }
      if (url !== undefined) {
        params.push(url);
        parts.push(`url = $${params.length}`);
      }
      if (type !== undefined) {
        params.push(type);
        parts.push(`type = $${params.length}`);
      }
      params.push(linkId);
      query += parts.join(', ') + ` WHERE link_id = $${params.length} RETURNING *`;
      const res = await pool.query(query, params);
      return res.rows[0] || null;
    } else {
      const state = readJSONDB();
      const idx = state.links.findIndex(l => l.link_id === linkId);
      if (idx !== -1) {
        if (alias !== undefined) state.links[idx].alias = alias;
        if (url !== undefined) state.links[idx].url = url;
        if (type !== undefined) state.links[idx].type = type;
        writeJSONDB(state);
        return state.links[idx];
      }
      return null;
    }
  },

  async deleteLink(linkId) {
    if (pool) {
      await pool.query('DELETE FROM links WHERE link_id = $1', [linkId]);
      return true;
    } else {
      const state = readJSONDB();
      const idx = state.links.findIndex(l => l.link_id === linkId);
      if (idx !== -1) {
        state.links.splice(idx, 1);
        writeJSONDB(state);
        return true;
      }
      return false;
    }
  },

  // --- SHARE FUNCTION (CLONE PROJECT WITH LINKS) ---
  async cloneProjectWithLinks(originalProjectId, newUserId) {
    const originalProject = await this.getProject(originalProjectId);
    if (!originalProject) throw new Error('Original project not found');

    const originalLinks = await this.getProjectLinks(originalProjectId);

    const newProjectId = crypto.randomUUID();
    const newProjectName = `${originalProject.name}`; // Keep identical name or add suffix

    const createdProject = await this.createProject({
      project_id: newProjectId,
      user_id: newUserId,
      name: newProjectName,
      description: originalProject.description,
      color: originalProject.color,
      archived_at: null,
      created_at: new Date().toISOString()
    });

    for (const link of originalLinks) {
      await this.createLink({
        link_id: crypto.randomUUID(),
        project_id: newProjectId,
        alias: link.alias,
        url: link.url,
        type: link.type,
        created_at: new Date().toISOString()
      });
    }

    return createdProject;
  },

  async reorderProjects(userId, orderedProjectIds) {
    if (pool) {
      for (let i = 0; i < orderedProjectIds.length; i++) {
        await pool.query(
          'UPDATE projects SET sort_order = $1 WHERE project_id = $2 AND user_id = $3',
          [i, orderedProjectIds[i], userId]
        );
      }
      return true;
    } else {
      const state = readJSONDB();
      let modified = false;
      orderedProjectIds.forEach((id, index) => {
        const idx = state.projects.findIndex(p => p.project_id === id && p.user_id === userId);
        if (idx !== -1) {
          state.projects[idx].sort_order = index;
          modified = true;
        }
      });
      if (modified) {
        writeJSONDB(state);
      }
      return true;
    }
  },

  async reorderLinks(userId, orderedLinkIds) {
    if (pool) {
      for (let i = 0; i < orderedLinkIds.length; i++) {
        await pool.query(
          `UPDATE links l SET sort_order = $1 
           FROM projects p 
           WHERE l.project_id = p.project_id 
           AND l.link_id = $2 
           AND p.user_id = $3`,
          [i, orderedLinkIds[i], userId]
        );
      }
      return true;
    } else {
      const state = readJSONDB();
      let modified = false;
      const userProjectIds = state.projects
        .filter(p => p.user_id === userId)
        .map(p => p.project_id);
      
      orderedLinkIds.forEach((id, index) => {
        const idx = state.links.findIndex(l => l.link_id === id && userProjectIds.includes(l.project_id));
        if (idx !== -1) {
          state.links[idx].sort_order = index;
          modified = true;
        }
      });
      if (modified) {
        writeJSONDB(state);
      }
      return true;
    }
  }
};
