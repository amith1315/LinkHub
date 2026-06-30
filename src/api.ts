// API Client for LinkHub

const API_BASE = ''; // proxied to http://localhost:3001 via vite proxy

function getHeaders() {
  const userId = localStorage.getItem('linkhub_user_id') || '';
  return {
    'Content-Type': 'application/json',
    'x-user-id': userId
  };
}

export interface User {
  user_id: string;
  name: string;
  recovery_code: string;
  theme_preference: 'light' | 'dark';
}

export interface Project {
  project_id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  archived_at: string | null;
  created_at: string;
}

export interface Link {
  link_id: string;
  project_id: string;
  alias: string;
  url: string;
  type: 'doc' | 'sheet' | 'slide' | 'drive' | 'figma' | 'repo' | 'notion' | 'other';
  created_at: string;
}

export const api = {
  // Users
  async createUser(name: string): Promise<User> {
    const response = await fetch(`${API_BASE}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create user');
    }
    return response.json();
  },

  async recoverUser(recoveryCode: string): Promise<User> {
    const response = await fetch(`${API_BASE}/api/users/recover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recovery_code: recoveryCode })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to recover user');
    }
    return response.json();
  },

  async regenerateRecoveryCode(): Promise<string> {
    const response = await fetch(`${API_BASE}/api/users/regenerate-code`, {
      method: 'PUT',
      headers: getHeaders()
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to regenerate recovery code');
    }
    const data = await response.json();
    return data.recovery_code;
  },

  async updateTheme(theme: 'light' | 'dark'): Promise<void> {
    const response = await fetch(`${API_BASE}/api/users/theme`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ theme })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to update theme');
    }
  },

  // Projects
  async getProjects(includeArchived = false): Promise<Project[]> {
    const response = await fetch(`${API_BASE}/api/projects?include_archived=${includeArchived}`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }
    return response.json();
  },

  async createProject(name: string, color: string, description?: string): Promise<Project> {
    const response = await fetch(`${API_BASE}/api/projects`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, color, description })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create project');
    }
    return response.json();
  },

  async updateProject(id: string, name?: string, color?: string, description?: string | null): Promise<Project> {
    const response = await fetch(`${API_BASE}/api/projects/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ name, color, description })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to update project');
    }
    return response.json();
  },

  async archiveProject(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/projects/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to archive project');
    }
  },

  async restoreProject(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/projects/${id}/restore`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to restore project');
    }
  },

  async deleteProjectPermanently(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/projects/${id}/permanent`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to permanently delete project');
    }
  },

  async importSharedProject(projectId: string): Promise<Project> {
    const response = await fetch(`${API_BASE}/api/projects/share/${projectId}`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to import shared project');
    }
    return response.json();
  },

  // Links
  async getLinks(): Promise<Link[]> {
    const response = await fetch(`${API_BASE}/api/links`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to fetch links');
    }
    return response.json();
  },

  async createLink(projectId: string, alias: string, url: string): Promise<Link> {
    const response = await fetch(`${API_BASE}/api/links`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ project_id: projectId, alias, url })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create link');
    }
    return response.json();
  },

  async updateLink(id: string, alias?: string, url?: string): Promise<Link> {
    const response = await fetch(`${API_BASE}/api/links/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ alias, url })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to update link');
    }
    return response.json();
  },

  async deleteLink(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/links/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to delete link');
    }
  }
};
