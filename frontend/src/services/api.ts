import { CivicIssue, DashboardStats } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = {
  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/health`, { cache: 'no-store' });
      return res.ok;
    } catch {
      return false;
    }
  },

  async uploadAndTriage(formData: FormData): Promise<CivicIssue> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/triage`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to triage image');
      }

      return await res.json();
    } catch (err: any) {
      if (err.message.includes('fetch')) {
        throw new Error('Cannot connect to backend server at http://localhost:8000. Please ensure FastAPI is running.');
      }
      throw err;
    }
  },

  async getIssues(params?: {
    category?: string;
    status?: string;
    min_urgency?: number;
    limit?: number;
    offset?: number;
  }): Promise<CivicIssue[]> {
    try {
      const query = new URLSearchParams();
      if (params?.category) query.append('category', params.category);
      if (params?.status) query.append('status', params.status);
      if (params?.min_urgency) query.append('min_urgency', params.min_urgency.toString());
      if (params?.limit) query.append('limit', params.limit.toString());
      if (params?.offset) query.append('offset', params.offset.toString());

      const res = await fetch(`${API_BASE_URL}/api/issues?${query.toString()}`, {
        cache: 'no-store',
      });

      if (!res.ok) {
        return [];
      }

      return await res.json();
    } catch (err) {
      console.warn('Backend offline or unreachable, returning empty issues list:', err);
      return [];
    }
  },

  async updateIssueStatus(issueId: string, status: string): Promise<CivicIssue | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/issues/${issueId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        throw new Error('Failed to update issue');
      }

      return await res.json();
    } catch (err) {
      console.error('Failed to update issue status:', err);
      return null;
    }
  },

  async upvoteIssue(issueId: string, newUpvotes: number): Promise<CivicIssue | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/issues/${issueId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ upvotes: newUpvotes }),
      });

      if (!res.ok) {
        throw new Error('Failed to upvote issue');
      }

      return await res.json();
    } catch (err) {
      console.error('Failed to upvote issue:', err);
      return null;
    }
  },

  async getStats(): Promise<DashboardStats | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/stats`, {
        cache: 'no-store',
      });

      if (!res.ok) {
        return null;
      }

      return await res.json();
    } catch (err) {
      console.warn('Backend stats unreachable:', err);
      return null;
    }
  },

  getExportUrl(): string {
    return `${API_BASE_URL}/api/export`;
  },

  getImageUrl(path: string | null): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}${path}`;
  }
};
