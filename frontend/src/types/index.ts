export type Result = {
  id: number;
  match_key: string;
  classification: string;
  reason: string;
  expected_amount: number;
  actual_amount: number;
  difference: number;
  risk_amount: number;
  currency: string;
  confidence: number;
};

export type DashboardStats = {
  total_orders: number;
  total_payments: number;
  matched_orders: number;
  matched_value: number;
  money_at_risk: number;
  disputed_value: number;
  discrepancy_count: number;
  reconciliation_percent: number;
  breakdown: Record<string, number>;
};

export type AuthContextType = {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
};
