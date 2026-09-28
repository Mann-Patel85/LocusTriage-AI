export interface CivicIssue {
  id: number;
  issue_id: string;
  category: string;
  urgency_score: number;
  description: string;
  latitude: number | null;
  longitude: number | null;
  status: 'Pending' | 'In Progress' | 'Resolved';
  image_url: string | null;
  upvotes: number;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardStats {
  total_issues: number;
  avg_urgency: number;
  pending_count: number;
  in_progress_count: number;
  resolved_count: number;
  category_counts: Record<string, number>;
  urgency_distribution: Record<string, number>;
}

export interface TriageResponse extends CivicIssue {}
