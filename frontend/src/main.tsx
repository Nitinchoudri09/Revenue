import React, { createContext, useCallback, useContext, useState, useMemo, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table";
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import axios from "axios";
import { useForm } from "react-hook-form";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import {
  Moon,
  Sun,
  Upload,
  LogOut,
  Download,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import "./index.css";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});
api.interceptors.request.use((c) => {
  const t = localStorage.getItem("token");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

// --- Auth Context ---
type AuthCtx = { token: string | null; login: (t: string) => void; logout: () => void };
const AuthContext = createContext<AuthCtx>({ token: null, login: () => {}, logout: () => {} });
const useAuth = () => useContext(AuthContext);
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const login = useCallback((t: string) => { localStorage.setItem("token", t); setToken(t); }, []);
  const logout = useCallback(() => { localStorage.removeItem("token"); setToken(null); }, []);

  // 401 interceptor — use the logout from context
  React.useEffect(() => {
    const id = api.interceptors.response.use(
      (r) => r,
      (e) => {
        if (e.response?.status === 401) { logout(); }
        return Promise.reject(e);
      },
    );
    return () => api.interceptors.response.eject(id);
  }, [logout]);

  return <AuthContext.Provider value={{ token, login, logout }}>{children}</AuthContext.Provider>;
}
type Result = {
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
type Dash = {
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
function Auth() {
  const { token, login: authLogin } = useAuth();
  const nav = useNavigate();
  const [register, setRegister] = useState(false);
  const {
    register: r,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm();
  // If already logged in, redirect to dashboard
  if (token) return <Navigate to="/" />;
  const submit = async (v: any) => {
    try {
      const { data } = await api.post(
        register ? "/auth/register" : "/auth/login",
        v,
      );
      authLogin(data.access_token);
      nav("/");
    } catch (e: any) {
      if (e.response?.data?.detail) {
        toast.error(e.response.data.detail);
      } else if (e.message) {
        toast.error(e.message);
      } else {
        toast.error("An unknown network error occurred.");
      }
    }
  };
  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      <section className="hidden lg:flex bg-slate-950 text-white p-16 flex-col justify-between">
        <ShieldCheck className="text-teal-300" size={38} />
        <div>
          <p className="text-teal-300 font-bold tracking-widest">
            FINANCIAL CONTROL
          </p>
          <h1 className="text-6xl font-semibold leading-tight">
            Every transaction.
            <br />
            Accounted for.
          </h1>
          <p className="text-slate-400 text-xl max-w-lg mt-6">
            Deterministic revenue reconciliation with clear, auditable outcomes.
          </p>
        </div>
        <p className="text-slate-500">Secure · Traceable · Repeatable</p>
      </section>
      <section className="flex items-center justify-center p-8">
        <form
          className="w-full max-w-md space-y-5"
          onSubmit={handleSubmit(submit)}
        >
          <div>
            <h2 className="text-3xl font-bold">
              {register ? "Create account" : "Welcome back"}
            </h2>
            <p className="text-slate-500 mt-2">
              Access your reconciliation workspace.
            </p>
          </div>
          {register && (
            <input
              className="input"
              placeholder="Full name"
              {...r("name", { required: true })}
            />
          )}
          <input
            className="input"
            type="email"
            placeholder="Email"
            {...r("email", { required: true })}
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            {...r("password", { required: true, minLength: 8 })}
          />
          <button disabled={isSubmitting} className="primary w-full">
            {isSubmitting
              ? "Please wait…"
              : register
                ? "Create account"
                : "Sign in"}
          </button>
          <button
            type="button"
            className="w-full text-sm text-slate-500"
            onClick={() => setRegister(!register)}
          >
            {register
              ? "Already have an account? Sign in"
              : "New here? Create an account"}
          </button>
        </form>
      </section>
    </main>
  );
}
function Shell({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(localStorage.theme === "dark");
  const { logout } = useAuth();
  const toggle = () => {
    document.documentElement.classList.toggle("dark");
    localStorage.theme = !dark ? "dark" : "light";
    setDark(!dark);
  };
  return (
    <div className="min-h-screen dark:bg-slate-950">
      <header className="border-b bg-white/90 dark:bg-slate-950 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/" className="font-black text-lg">
            Ledger<span className="text-teal-500">View</span>
          </Link>
          <div className="flex gap-2">
            <button className="btn" aria-label="Toggle theme" onClick={toggle}>
              {dark ? <Sun /> : <Moon />}
            </button>
            <button
              className="btn"
              onClick={() => logout()}
            >
              <LogOut />
            </button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
function UploadCard({
  kind,
  onDone,
}: {
  kind: string;
  onDone: (id: number) => void;
}) {
  const [file, setFile] = useState<File>();
  const [errors, setErrors] = useState<any[]>([]);
  const mutation = useMutation({
    mutationFn: async () => {
      const f = new FormData();
      f.append("file", file!);
      return (await api.post(`/upload/${kind}`, f)).data;
    },
    onSuccess: async (d) => {
      onDone(d.dataset_id);
      if (d.errors > 0) {
        toast.warning(`${d.rows} ${kind} imported, but ${d.errors} rows failed validation`);
        try {
          const res = await api.get(`/dataset/${d.dataset_id}/errors`);
          setErrors(res.data);
        } catch(e) {}
      } else {
        toast.success(`${d.rows} ${kind} imported`);
        setErrors([]);
      }
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.detail || "Upload failed"),
  });
  return (
    <div className="panel p-5">
      <div className="flex items-center gap-3">
        <span className="p-2 rounded-xl bg-teal-50 text-teal-700">
          <Upload />
        </span>
        <div>
          <h3 className="font-bold capitalize">{kind}.csv</h3>
          <p className="text-sm text-slate-500">Select a validated CSV</p>
        </div>
      </div>
      <input
        className="mt-5 block w-full text-sm"
        type="file"
        accept=".csv,text/csv"
        onChange={(e) => setFile(e.target.files?.[0])}
      />
      <button
        className="primary mt-4 w-full"
        disabled={!file || mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? "Uploading…" : "Upload file"}
      </button>
      {errors.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded text-xs max-h-32 overflow-y-auto">
          <strong>Import Errors:</strong>
          <ul className="list-disc pl-4 mt-2">
            {errors.map((err, i) => (
              <li key={i}>Row {err.row_index}: {err.error_message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const columnHelper = createColumnHelper<Result>();
const columns = [
  columnHelper.accessor("match_key", {
    header: "Reference",
    cell: (info) => (
      <Link to={`/discrepancy/${info.row.original.id}`} className="font-bold text-teal-600 hover:underline">
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor("classification", {
    header: "Classification",
    cell: (info) => (
      <span className="badge">
        {info.getValue().replaceAll("_", " ")}
      </span>
    ),
  }),
  columnHelper.accessor("expected_amount", {
    header: "Expected",
    cell: (info) => `${info.getValue()} ${info.row.original.currency}`,
  }),
  columnHelper.accessor("actual_amount", {
    header: "Actual",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("difference", {
    header: "Difference",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("risk_amount", {
    header: "Risk",
    cell: (info) => <span className="font-bold">{info.getValue()}</span>,
  }),
];
function Dashboard() {
  const [od, setOd] = useState<number>(),
    [pd, setPd] = useState<number>(),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("");
  const qc = useQueryClient();
  const dash = useQuery<Dash>({
    queryKey: ["dashboard"],
    queryFn: () => api.get("/dashboard").then((r) => r.data),
    retry: 1,
  });
  const rows = useQuery<Result[]>({
    queryKey: ["rows"],
    queryFn: () =>
      api
        .get("/discrepancies", {
          params: { limit: 10000 },
        })
        .then((r) => r.data),
  });
  
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const filteredResults = useMemo(() => {
    if (!rows.data) return [];
    const query = debouncedSearch.trim().toLowerCase();
    
    return rows.data.filter((row) => {
      const matchesOutcome = status === "" || row.classification === status;
      const matchesSearch = !query || String(row.match_key ?? "").toLowerCase().includes(query);
      return matchesOutcome && matchesSearch;
    });
  }, [rows.data, status, debouncedSearch]);
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    data: filteredResults,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 25,
      },
    },
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    table.setPageIndex(0);
  }, [status, debouncedSearch, table]);
  const run = useMutation({
    mutationFn: () =>
      api.post("/reconciliation/run", {
        orders_dataset_id: od,
        payments_dataset_id: pd,
      }),
    onSuccess: async () => {
      toast.success("Reconciliation complete");
      setOd(undefined);
      setPd(undefined);
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
      await qc.invalidateQueries({ queryKey: ["rows"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Run failed"),
  });
  const cards = useMemo(() => {
    const d = dash.data;
    return d
      ? [
          ["Total orders", d.total_orders],
          ["Total payments", d.total_payments],
          ["Matched orders", d.matched_orders],
          ["Matched value", `$${d.matched_value.toLocaleString()}`],
          ["Money at risk", `$${d.money_at_risk.toLocaleString()}`],
          ["Disputed value", `$${d.disputed_value.toLocaleString()}`],
          ["Discrepancies", d.discrepancy_count],
          ["Reconciliation", `${d.reconciliation_percent}%`],
        ]
      : [];
  }, [dash.data]);

  const chart = useMemo(() => {
    return Object.entries(dash.data?.breakdown || {}).map(([name, value]) => ({
      name: name.replaceAll("_", " "),
      value,
    }));
  }, [dash.data]);
  return (
    <Shell>
      <main className="max-w-7xl mx-auto p-5 md:p-8 space-y-8">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-teal-600 tracking-widest">
              CONTROL CENTER
            </p>
            <h1 className="text-3xl font-bold">Revenue reconciliation</h1>
          </div>
          <a
            className="btn border flex gap-2"
            href={`${api.defaults.baseURL}/export`}
            onClick={async (e) => {
              e.preventDefault();
              const r = await api.get("/export", { responseType: "blob" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(r.data);
              a.download = "reconciliation.csv";
              a.click();
            }}
          >
            <Download size={18} />
            Export CSV
          </a>
        </div>
        <section className="grid md:grid-cols-2 gap-4">
          <UploadCard kind="orders" onDone={setOd} />
          <UploadCard kind="payments" onDone={setPd} />
        </section>
        <button
          className="primary w-full py-3"
          disabled={!od || !pd || run.isPending}
          onClick={() => run.mutate()}
        >
          {run.isPending ? "Reconciling…" : "Run deterministic reconciliation"}
        </button>
        {dash.isLoading ? (
          <div className="h-40 panel animate-pulse" />
        ) : dash.isError ? (
          <div className="panel p-8">
            Unable to load dashboard.{" "}
            <button onClick={() => dash.refetch()}>Retry</button>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {cards.map(([k, v]) => (
                <div className="panel p-5" key={k}>
                  <p className="text-sm text-slate-500">{k}</p>
                  <p className="text-2xl font-black mt-2">{v}</p>
                </div>
              ))}
            </section>
            <section className="grid lg:grid-cols-2 gap-4">
              <div className="panel p-5 h-80">
                <h3 className="font-bold">Discrepancy mix</h3>
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie
                      data={chart}
                      dataKey="value"
                      innerRadius={60}
                      outerRadius={90}
                      isAnimationActive={false}
                    >
                      {chart.map((_, i) => (
                        <Cell
                          key={i}
                          fill={
                            [
                              "#14b8a6",
                              "#f59e0b",
                              "#ef4444",
                              "#6366f1",
                              "#94a3b8",
                            ][i % 5]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="panel p-5 h-80">
                <h3 className="font-bold">Records by outcome</h3>
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart data={chart}>
                    <XAxis dataKey="name" hide />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#14b8a6" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </>
        )}
        <section className="panel overflow-hidden">
          <div className="p-5 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-52">
              <Search className="absolute left-3 top-2.5" size={18} />
              <input
                className="input pl-10"
                placeholder="Search order reference"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="input w-auto capitalize"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All outcomes</option>
              {Object.keys(dash.data?.breakdown || {}).map((x) => (
                <option value={x} key={x}>
                  {x.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="text-left p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 select-none"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {{
                          asc: " 🔼",
                          desc: " 🔽",
                        }[header.column.getIsSorted() as string] ?? null}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-4">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.isLoading && !rows.data?.length && (
              <div className="p-12 text-center text-slate-500">
                No reconciliation results yet. Upload both files to begin.
              </div>
            )}
          </div>
          {rows.data && rows.data.length > 0 && (
            <div className="p-4 border-t dark:border-slate-800 flex items-center justify-between text-sm">
              <div className="flex gap-2">
                <button
                  className="btn border"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </button>
                <button
                  className="btn border"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </button>
              </div>
              <div className="flex items-center gap-4">
                <select
                  className="input w-auto py-1.5 pl-3 pr-8"
                  value={table.getState().pagination.pageSize}
                  onChange={(e) => table.setPageSize(Number(e.target.value))}
                >
                  {[25, 50, 100].map((pageSize) => (
                    <option key={pageSize} value={pageSize}>
                      Show {pageSize}
                    </option>
                  ))}
                </select>
                <span>
                  Page {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount() || 1}
                </span>
              </div>
            </div>
          )}
        </section>
      </main>
    </Shell>
  );
}
function Detail() {
  const { id } = useParams();
  const q = useQuery<Result>({
    queryKey: ["detail", id],
    queryFn: () => api.get(`/discrepancy/${id}`).then((r) => r.data),
  });
  const ai = useMutation({
    mutationFn: () =>
      api.post("/llm/explain", { result_id: Number(id) }).then((r) => r.data),
    onError: () => toast.error("Explanation unavailable"),
  });
  if (q.isLoading)
    return (
      <Shell>
        <div className="max-w-4xl mx-auto p-8">
          <div className="panel h-72 animate-pulse" />
        </div>
      </Shell>
    );
  if (!q.data)
    return (
      <Shell>
        <div className="p-12 text-center">
          Result not found. <Link to="/">Return</Link>
        </div>
      </Shell>
    );
  const r = q.data;
  return (
    <Shell>
      <main className="max-w-4xl mx-auto p-5 md:p-8 space-y-5">
        <Link to="/" className="text-teal-600">
          ← Back to dashboard
        </Link>
        <div className="panel p-7">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-slate-500">ORDER REFERENCE</p>
              <h1 className="text-3xl font-black">{r.match_key}</h1>
            </div>
            <span className="badge h-fit">
              {r.classification.replaceAll("_", " ")}
            </span>
          </div>
          <p className="mt-6 text-lg">{r.reason}</p>
          <div className="grid sm:grid-cols-3 gap-4 mt-6">
            {[
              ["Expected", r.expected_amount],
              ["Actual", r.actual_amount],
              ["Difference", r.difference],
            ].map(([k, v]) => (
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4">
                <p className="text-sm text-slate-500">{k}</p>
                <p className="text-xl font-bold">
                  {v} {r.currency}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-7 border-l-2 border-teal-400 pl-5">
            <p className="text-sm text-slate-500">Timeline</p>
            <p className="font-semibold">
              Files imported → deterministic rules evaluated → result persisted
            </p>
          </div>
        </div>
        <button
          className="primary"
          disabled={ai.isPending}
          onClick={() => ai.mutate()}
        >
          {ai.isPending ? "Generating…" : "Generate AI explanation"}
        </button>
        {ai.data && (
          <div className="panel p-7 space-y-4">
            <h2 className="text-xl font-bold">Business explanation</h2>
            {Object.entries(ai.data).map(([k, v]) => (
              <div>
                <p className="text-xs font-bold uppercase text-slate-500">
                  {k.replaceAll("_", " ")}
                </p>
                <p>{String(v)}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </Shell>
  );
}
function Guard({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
}
const client = new QueryClient();
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <QueryClientProvider client={client}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Auth />} />
            <Route
              path="/"
              element={
                <Guard>
                  <Dashboard />
                </Guard>
              }
            />
            <Route
              path="/discrepancy/:id"
              element={
                <Guard>
                  <Detail />
                </Guard>
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
        <Toaster richColors />
      </QueryClientProvider>
    </AuthProvider>
  </React.StrictMode>,
);
