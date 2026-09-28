import { CivicIssue, DashboardStats } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = {
  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/health`);
      return res.ok;
    } catch {
      return false;
    }
  },

  async uploadAndTriage(formData: FormData): Promise<CivicIssue> {
    const res = await fetch(`${API_BASE_URL}/api/triage`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to triage image');
    }

    return res.json();
  },

  async getIssues(params?: {
    category?: string;
    status?: string;
    min_urgency?: number;
    limit?: number;
    offset?: number;
  }): Promise<CivicIssue[]> {
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
      throw new Error('Failed to fetch issues');
    }

    return res.json();
  },

  async updateIssueStatus(issueId: string, status: string): Promise<CivicIssue> {
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

    return res.json();
  },

  async upvoteIssue(issueId: string, newUpvotes: number): Promise<CivicIssue> {
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

    return res.json();
  },

  async getStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE_URL}/api/stats`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error('Failed to fetch stats');
    }

    return res.json();
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
