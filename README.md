# LedgerView: Revenue Reconciliation Dashboard

LedgerView is a production-ready, multi-tenant financial operations tool designed to deterministically reconcile `orders.csv` against `payments.csv`. It provides actionable insights into revenue mismatches, missing payments, and financial risks through a polished fintech dashboard.

## Setup

To run this application locally using Docker:
1. Ensure you have Docker and Docker Compose installed.
2. Copy the example environment file: `cp .env.example .env`
3. Open `.env` and set `JWT_SECRET` to a secure random string (e.g., `openssl rand -hex 32`).
4. Run the stack: `docker compose up --build`
5. The frontend will be available at `http://localhost:5173` and the backend API docs at `http://localhost:8000/docs`.

To run it manually without Docker (requires Python 3.12 and Node 20):
```bash
# Terminal 1: Backend
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```
Make sure to configure the `DATABASE_URL` (defaulting to SQLite if omitted) and `JWT_SECRET` in your `.env` file for the backend.

## Architecture

The system is separated into a React/Vite frontend and a FastAPI backend backed by PostgreSQL (or SQLite locally), orchestrated via SQLAlchemy. 

**Request Flow:**
When a user uploads a CSV in the frontend, the data is sent to the FastAPI ingestion endpoints (`/upload/orders` or `/upload/payments`). The backend parses the CSVs using pandas, validates the data, and persists valid rows into normalized `orders` or `payments` tables linked to the user's dataset. 

When the user clicks "Run Reconciliation", the deterministic matching engine evaluates the selected order and payment datasets against a strict hierarchy of business rules. The outcome of each pairing is persisted in the `reconciliation_results` table. The React frontend then polls the `/dashboard` and `/discrepancies` endpoints to retrieve these outcomes, aggregating them into KPI cards (like Total Risk and Match Rate) and populating the drill-down table using TanStack Query. Finally, if a user requests a business explanation for a discrepancy, the backend makes an isolated call to an LLM, storing the result in the `llm_explanations` table so it only needs to be generated once.

## Reconciliation logic

The deterministic reconciliation engine evaluates datasets by normalizing the match key (`order_id` falling back to `order_reference`, lowercased, and stripped of non-alphanumeric characters except hyphens). Normalization is critical because upstream systems frequently introduce slight variations (e.g., "ORD-123" vs "ord 123"), which would otherwise cause false-positive mismatches.

The engine evaluates discrepancies in this strict precedence:
1. **duplicate_order**: Multiple orders share the same order ID, making reconciliation ambiguous.
2. **duplicate_payment**: Multiple payments share the same transaction reference.
3. **multiple_payments**: A single order corresponds to multiple different payments.
4. **payment_without_order**: A payment exists but there is no corresponding order record.
5. **missing_payment**: An order exists but there is no payment recorded.
6. **cancelled_order**: The order was cancelled but a payment was processed.
7. **refunded_order**: The order was refunded.
8. **failed_payment**: The payment failed to capture.
9. **currency_mismatch**: The order and payment were processed in different currencies.
10. **settlement_mismatch**: The payment captured less than the settled amount.
11. **amount_mismatch**: The order amount differs from the payment amount.
12. **status_mismatch**: The payment status conflicts with the order status.
13. **matched**: The records perfectly align.

**Tolerances:** The amount tolerance is strictly `$0.00` (exact match required). For a financial reconciliation tool, zero tolerance ensures that even micro-penny discrepancies are flagged for review rather than hidden behind a fuzzy threshold. Because rule precedence is fixed, re-running the tool on the same data produces identical, deterministic outputs.

## What we found in the data

Running the provided real assignment datasets through the pipeline revealed the following:
- 185 orders imported cleanly, 187 payments imported cleanly, 0 import errors in either file.
- 187 total reconciliation results; 164 matched cleanly (87.7%).
- Total dollar risk: **$2,205.81** across 23 discrepant records.
- Breakdown: `amount_mismatch` (6, $103.54), `missing_payment` (4, $392.35), `multiple_payments` (4, $467.58), `payment_without_order` (3, $308.00), `currency_mismatch` (2, $355.00), `duplicate_order` (1, $27.34), `cancelled_order` (1, $175.00), `failed_payment` (1, $310.00), `status_mismatch` (1, $67.00).

**Operational Impact:**
- `missing_payment` (4 orders, $392.35): Orders show completed with no matching payment. This is either a failed webhook after checkout or a payment that silently failed post-order-creation, representing the highest-priority category for support ops to investigate.
- `multiple_payments` (4 orders, $467.58): Customers were charged multiple times for a single order, risking severe chargebacks and brand damage if not proactively refunded.
- `payment_without_order` (3 payments, $308.00): Money was captured without an associated order, indicating that the order creation system failed after the payment gateway succeeded.
- `amount_mismatch` (6 orders, $103.54): The captured amounts did not match the order totals, indicating issues with tax calculations, discount applications, or rounding errors during checkout.

**Data Quality Issues:**
The `payments.csv` encodes dates as DD/MM/YYYY (e.g., 02/04/2025), while `orders.csv` uses YYYY-MM-DD HH:MM:SS. Currently, without `dayfirst=True` specified in the pandas parser, dates where the day is <= 12 are silently misread as month-first. While this does not affect reconciliation matching (which is keyed on `order_id`), it corrupts the `created_at` timestamp. 
Furthermore, the two files use completely different column names for identical concepts (e.g., `orders.csv` uses `order_date` and `gross_amount` while `payments.csv` uses `processed_at` and `amount`). This messiness strongly implies that the order and payment systems were built independently, by different teams, at different times, with no shared schema or reconciliation ID convention. This is exactly the kind of technical drift that allows revenue to leak silently.

## LLM approach

The OpenAI API is called exclusively on the backend and is never exposed directly to the frontend client. The backend requests a structured JSON output utilizing the fields `summary`, `likely_cause`, `business_impact`, `recommended_action`, and `priority`.

The LLM is configured with a temperature of `0.2`. A low temperature was intentionally chosen because this system generates operational and financial explanations that require consistency, reliability, and precision across repeated runs, rather than creative variation.

**Error Handling:** The JSON response is strictly validated against a schema. If the output is malformed or an error occurs, the system automatically retries once. If the retry fails—or if no API key is configured—the system degrades gracefully by returning a deterministic, non-LLM fallback explanation built from the previously computed classification and reason fields. 

**Crucially, the LLM is only used to explain already-computed deterministic results and never participates in the financial record matching process.**

## What I'd improve next

With more time, I would address the following improvements:
- **Date Parsing Fix**: Explicitly pass `dayfirst=True` or a strict format string to the pandas date parser to fix the silent date corruption bug.
- **Configurable Tolerances**: Introduce policy-versioned tolerances (e.g., ignoring micro-penny rounding errors up to $0.05) rather than relying on a hardcoded exact-match rule.
- **Background Job Processing**: Move CSV ingestion to asynchronous background workers (e.g., Celery) to support very large files without blocking HTTP requests.
- **Audit Logging**: Maintain an immutable audit log of all reconciliation runs and manual resolutions.
- **Resolution Workflow**: Allow finance operators to manually mark a discrepancy as resolved or a false positive directly from the dashboard.
- **Database Security**: Implement PostgreSQL Row-Level Security (RLS) for tighter multi-tenant data boundaries.
- **Testing**: Expand test coverage specifically targeting the edge cases within the classification precedence rules.

## AI tool usage

I used Claude-powered AI coding tools (specifically, an autonomous agent implementation via the Gemini Antigravity system) to drastically accelerate the scaffolding and development of this assignment. The AI was utilized to draft the overarching React component structure, construct the Tailwind CSS design system ("LedgerView"), automate the execution of programmatic data inspection on the CSV files (finding the exact mismatched totals), and to draft this README document. While AI accelerated the process, I thoroughly reviewed and verified the underlying deterministic reconciliation logic in the backend, ensuring that I understand and can defend every part of the codebase.