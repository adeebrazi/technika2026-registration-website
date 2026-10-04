import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';

const API = import.meta.env.VITE_API_URL || '';

interface AnalyticsData {
  totalRegistrations: number;
  instituteWise: { institute: string; count: number }[];
  totalInstitutes: number;
  eventWise: { eventId: string; eventName: string; count: number }[];
  maxEvent: { eventId: string; eventName: string; count: number } | null;
  minEvent: { eventId: string; eventName: string; count: number } | null;
  genderDistribution: Record<string, number>;
  courseDistribution: { course: string; count: number }[];
  dailyTrend: { date: string; count: number }[];
}

const CHART_COLORS = [
  '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316',
  '#84cc16', '#a855f7', '#0ea5e9', '#22c55e', '#eab308',
  '#e11d48', '#d946ef', '#4f46e5', '#2dd4bf', '#fb923c',
];

const GENDER_COLORS: Record<string, string> = {
  Male: '#3b82f6',
  Female: '#ec4899',
  Other: '#8b5cf6'
};

export const AnalyticsView: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`${API}/api/admin/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch analytics');
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  const genderData = Object.entries(data.genderDistribution).map(([name, value]) => ({ name, value }));
  const totalGender = genderData.reduce((s, g) => s + g.value, 0);

  return (
    <div className="ana-shell">
      {/* ── Page Header ── */}
      <div className="ana-header">
        <div className="ana-header-left">
          <h1 className="ana-title">📊 Analytics Dashboard</h1>
          <p className="ana-subtitle">Technika 6.0 — Live Registration Insights</p>
        </div>
        <button className="ana-refresh-btn" onClick={() => window.location.reload()}>
          ↻ Refresh
        </button>
      </div>

      {/* ── Stat Cards Row ── */}
      <div className="ana-stats-row">
        <StatCard icon="📋" label="Total Registrations" value={data.totalRegistrations} accent="#3b82f6" />
        <StatCard icon="🏛️" label="Institutes Participated" value={data.totalInstitutes} accent="#8b5cf6" />
        <StatCard icon="♂️" label="Male Participants" value={data.genderDistribution?.Male || 0} accent="#06b6d4" />
        <StatCard icon="♀️" label="Female Participants" value={data.genderDistribution?.Female || 0} accent="#ec4899" />
      </div>

      {/* ── Event Highlights Row ── */}
      <div className="ana-highlight-row">
        <div className="ana-highlight-card ana-highlight-max">
          <span className="ana-highlight-emoji">🔥</span>
          <div className="ana-highlight-info">
            <span className="ana-highlight-label">Most Popular Event</span>
            <span className="ana-highlight-value">{data.maxEvent?.eventName || 'N/A'}</span>
            <span className="ana-highlight-count">{data.maxEvent?.count || 0} registrations</span>
          </div>
        </div>
        <div className="ana-highlight-card ana-highlight-min">
          <span className="ana-highlight-emoji">💎</span>
          <div className="ana-highlight-info">
            <span className="ana-highlight-label">Least Registered Event</span>
            <span className="ana-highlight-value">{data.minEvent?.eventName || 'N/A'}</span>
            <span className="ana-highlight-count">{data.minEvent?.count || 0} registrations</span>
          </div>
        </div>
      </div>

      {/* ── Charts Grid ── */}
      <div className="ana-charts-grid">
        {/* Event-wise Bar Chart */}
        <div className="ana-chart-card ana-chart-full">
          <h3 className="ana-chart-title">📈 Event-wise Registrations</h3>
          <div className="ana-chart-body" style={{ height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.eventWise} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="eventName" angle={-35} textAnchor="end" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 14, border: '2px solid #e2e8f0', boxShadow: '4px 4px 12px rgba(0,0,0,0.08)', fontSize: 13 }} />
                <Bar dataKey="count" name="Registrations" radius={[8, 8, 0, 0]}>
                  {data.eventWise.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender Pie Chart */}
        <div className="ana-chart-card">
          <h3 className="ana-chart-title">🧬 Gender Distribution</h3>
          <div className="ana-chart-body" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value} (${((value / totalGender) * 100).toFixed(1)}%)`}
                  labelLine={{ stroke: '#94a3b8' }}
                >
                  {genderData.map((entry, i) => (
                    <Cell key={`g-${i}`} fill={GENDER_COLORS[entry.name] || CHART_COLORS[i]} stroke="#fff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 14, border: '2px solid #e2e8f0', fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Trend Area Chart */}
        <div className="ana-chart-card">
          <h3 className="ana-chart-title">📅 Daily Registration Trend</h3>
          <div className="ana-chart-body" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dailyTrend} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 14, border: '2px solid #e2e8f0', fontSize: 13 }} />
                <Area type="monotone" dataKey="count" name="Registrations" stroke="#3b82f6" strokeWidth={2.5} fill="url(#trendGrad)" dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6, strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Course Radar Chart */}
        {data.courseDistribution.length > 0 && data.courseDistribution.length <= 15 && (
          <div className="ana-chart-card">
            <h3 className="ana-chart-title">🎓 Course Distribution (Radar)</h3>
            <div className="ana-chart-body" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={data.courseDistribution.slice(0, 12)} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="course" tick={{ fontSize: 10, fill: '#475569' }} />
                  <PolarRadiusAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                  <Radar name="Participants" dataKey="count" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} strokeWidth={2} />
                  <Tooltip contentStyle={{ borderRadius: 14, fontSize: 13 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Course Bar Chart (fallback for many courses) */}
        {data.courseDistribution.length > 15 && (
          <div className="ana-chart-card ana-chart-full">
            <h3 className="ana-chart-title">🎓 Course-wise Participants</h3>
            <div className="ana-chart-body" style={{ height: 380 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.courseDistribution} layout="vertical" margin={{ top: 10, right: 20, left: 120, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                  <YAxis type="category" dataKey="course" tick={{ fontSize: 11, fill: '#64748b' }} width={110} />
                  <Tooltip contentStyle={{ borderRadius: 14, fontSize: 13 }} />
                  <Bar dataKey="count" name="Participants" radius={[0, 8, 8, 0]}>
                    {data.courseDistribution.map((_, i) => (
                      <Cell key={`cc-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* ── Data Tables ── */}
      <div className="ana-tables-grid">
        {/* Institute Table */}
        <div className="ana-table-card">
          <h3 className="ana-chart-title">🏛️ Institute-wise Participation</h3>
          <div className="ana-table-wrap">
            <table className="ana-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Institute</th>
                  <th>Participants</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {data.instituteWise.map((inst, i) => (
                  <tr key={i}>
                    <td className="ana-table-rank">{i + 1}</td>
                    <td className="ana-table-name">{inst.institute}</td>
                    <td className="ana-table-count">{inst.count}</td>
                    <td className="ana-table-share">
                      <div className="ana-share-bar-wrap">
                        <div
                          className="ana-share-bar"
                          style={{
                            width: `${(inst.count / data.totalRegistrations) * 100}%`,
                            background: CHART_COLORS[i % CHART_COLORS.length]
                          }}
                        />
                        <span>{((inst.count / data.totalRegistrations) * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Course Table */}
        <div className="ana-table-card">
          <h3 className="ana-chart-title">🎓 Course-wise Participation</h3>
          <div className="ana-table-wrap">
            <table className="ana-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Course</th>
                  <th>Participants</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {data.courseDistribution.map((c, i) => (
                  <tr key={i}>
                    <td className="ana-table-rank">{i + 1}</td>
                    <td className="ana-table-name">{c.course}</td>
                    <td className="ana-table-count">{c.count}</td>
                    <td className="ana-table-share">
                      <div className="ana-share-bar-wrap">
                        <div
                          className="ana-share-bar"
                          style={{
                            width: `${(c.count / data.totalRegistrations) * 100}%`,
                            background: CHART_COLORS[i % CHART_COLORS.length]
                          }}
                        />
                        <span>{((c.count / data.totalRegistrations) * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Inline Styles ── */}
      <style>{`
        .ana-shell {
          padding: 0;
        }

        /* ── Header ── */
        .ana-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.8rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .ana-title {
          font-size: 1.65rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .ana-subtitle {
          font-size: 0.82rem;
          color: #64748b;
          margin: 4px 0 0;
          font-weight: 500;
        }
        .ana-refresh-btn {
          padding: 0.55rem 1.2rem;
          border-radius: 14px;
          border: 2px solid rgba(255,255,255,0.9);
          background: #f4f8fd;
          color: #2563eb;
          font-weight: 800;
          font-size: 0.8rem;
          cursor: pointer;
          box-shadow:
            4px 5px 12px rgba(162,178,201,0.2),
            -3px -3px 8px rgba(255,255,255,0.7),
            inset 2px 2px 4px rgba(255,255,255,0.8),
            inset -2px -2px 4px rgba(162,178,201,0.12);
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .ana-refresh-btn:hover {
          background: #dbeafe;
          transform: translateY(-2px);
          box-shadow:
            6px 8px 18px rgba(162,178,201,0.25),
            -5px -5px 14px rgba(255,255,255,0.8),
            inset 2px 2px 4px rgba(255,255,255,0.8),
            inset -2px -2px 4px rgba(37,99,235,0.12);
        }

        /* ── Stat Cards ── */
        .ana-stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .ana-stat-card {
          background: #f4f8fd;
          border-radius: 20px;
          border: 2.5px solid rgba(255,255,255,0.9);
          padding: 1.3rem 1.2rem;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow:
            6px 8px 18px rgba(162,178,201,0.22),
            -5px -5px 14px rgba(255,255,255,0.8),
            inset 2px 2px 4px rgba(255,255,255,0.8),
            inset -2px -2px 4px rgba(162,178,201,0.18);
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .ana-stat-card:hover {
          transform: translateY(-3px);
        }
        .ana-stat-icon {
          width: 50px;
          height: 50px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          flex-shrink: 0;
          border: 2px solid rgba(255,255,255,0.8);
          box-shadow:
            inset 3px 3px 6px rgba(255,255,255,0.6),
            inset -3px -3px 6px rgba(0,0,0,0.08),
            3px 4px 10px rgba(0,0,0,0.06);
        }
        .ana-stat-info {
          display: flex;
          flex-direction: column;
        }
        .ana-stat-value {
          font-size: 1.7rem;
          font-weight: 900;
          color: #0f172a;
          line-height: 1.15;
        }
        .ana-stat-label {
          font-size: 0.72rem;
          color: #64748b;
          font-weight: 600;
          letter-spacing: 0.01em;
          margin-top: 2px;
        }

        /* ── Highlight Cards ── */
        .ana-highlight-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .ana-highlight-card {
          background: #f4f8fd;
          border-radius: 20px;
          border: 2.5px solid rgba(255,255,255,0.9);
          padding: 1.2rem 1.4rem;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow:
            6px 8px 18px rgba(162,178,201,0.22),
            -5px -5px 14px rgba(255,255,255,0.8),
            inset 2px 2px 4px rgba(255,255,255,0.8),
            inset -2px -2px 4px rgba(162,178,201,0.18);
        }
        .ana-highlight-max {
          border-left: 4px solid #10b981;
        }
        .ana-highlight-min {
          border-left: 4px solid #f59e0b;
        }
        .ana-highlight-emoji {
          font-size: 2rem;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }
        .ana-highlight-info {
          display: flex;
          flex-direction: column;
        }
        .ana-highlight-label {
          font-size: 0.68rem;
          color: #94a3b8;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .ana-highlight-value {
          font-size: 1.15rem;
          font-weight: 900;
          color: #0f172a;
          margin-top: 2px;
        }
        .ana-highlight-count {
          font-size: 0.78rem;
          color: #64748b;
          font-weight: 600;
          margin-top: 1px;
        }

        /* ── Charts Grid ── */
        .ana-charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.2rem;
          margin-bottom: 1.5rem;
        }
        .ana-chart-full {
          grid-column: 1 / -1;
        }
        .ana-chart-card {
          background: #f4f8fd;
          border-radius: 20px;
          border: 2.5px solid rgba(255,255,255,0.9);
          padding: 1.2rem;
          box-shadow:
            6px 8px 18px rgba(162,178,201,0.22),
            -5px -5px 14px rgba(255,255,255,0.8),
            inset 2px 2px 4px rgba(255,255,255,0.8),
            inset -2px -2px 4px rgba(162,178,201,0.18);
        }
        .ana-chart-title {
          font-size: 0.95rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 0.8rem;
          padding-bottom: 0.6rem;
          border-bottom: 2px solid rgba(255,255,255,0.8);
        }
        .ana-chart-body {
          width: 100%;
        }

        /* ── Tables Grid ── */
        .ana-tables-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.2rem;
          margin-bottom: 2rem;
        }
        .ana-table-card {
          background: #f4f8fd;
          border-radius: 20px;
          border: 2.5px solid rgba(255,255,255,0.9);
          padding: 1.2rem;
          box-shadow:
            6px 8px 18px rgba(162,178,201,0.22),
            -5px -5px 14px rgba(255,255,255,0.8),
            inset 2px 2px 4px rgba(255,255,255,0.8),
            inset -2px -2px 4px rgba(162,178,201,0.18);
        }
        .ana-table-wrap {
          max-height: 420px;
          overflow-y: auto;
          border-radius: 12px;
        }
        .ana-table-wrap::-webkit-scrollbar { width: 6px; }
        .ana-table-wrap::-webkit-scrollbar-track { background: #eef3f9; border-radius: 6px; }
        .ana-table-wrap::-webkit-scrollbar-thumb { background: #c8d5e3; border-radius: 6px; }
        .ana-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.82rem;
        }
        .ana-table thead {
          position: sticky;
          top: 0;
          z-index: 2;
        }
        .ana-table th {
          background: #e6ecf5;
          color: #475569;
          font-weight: 800;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 0.65rem 0.8rem;
          text-align: left;
          border-bottom: 2px solid rgba(255,255,255,0.7);
        }
        .ana-table td {
          padding: 0.55rem 0.8rem;
          border-bottom: 1px solid #e2e8f0;
          color: #334155;
        }
        .ana-table tr:last-child td {
          border-bottom: none;
        }
        .ana-table tr:hover td {
          background: rgba(59,130,246,0.04);
        }
        .ana-table-rank {
          font-weight: 900;
          color: #94a3b8;
          font-size: 0.75rem;
          width: 30px;
        }
        .ana-table-name {
          font-weight: 700;
          color: #0f172a;
        }
        .ana-table-count {
          font-weight: 800;
          color: #2563eb;
          text-align: center;
        }
        .ana-table-share {
          width: 140px;
        }
        .ana-share-bar-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .ana-share-bar {
          height: 6px;
          border-radius: 4px;
          min-width: 4px;
          transition: width 0.5s ease;
        }
        .ana-share-bar-wrap span {
          font-size: 0.68rem;
          color: #94a3b8;
          font-weight: 700;
          white-space: nowrap;
        }

        /* ── Loading & Error States ── */
        .ana-loading-shell {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 1.2rem;
        }
        .ana-loading-spinner {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: 4px solid #e2e8f0;
          border-top-color: #3b82f6;
          animation: anaSpin 0.8s linear infinite;
        }
        @keyframes anaSpin {
          to { transform: rotate(360deg); }
        }
        .ana-loading-text {
          font-size: 0.9rem;
          color: #64748b;
          font-weight: 600;
        }
        .ana-error-shell {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
          gap: 0.8rem;
        }
        .ana-error-icon { font-size: 2.5rem; }
        .ana-error-msg {
          font-size: 0.9rem;
          color: #dc2626;
          font-weight: 700;
        }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .ana-stats-row { grid-template-columns: repeat(2, 1fr); }
          .ana-charts-grid { grid-template-columns: 1fr; }
          .ana-tables-grid { grid-template-columns: 1fr; }
          .ana-highlight-row { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .ana-stats-row { grid-template-columns: 1fr; }
          .ana-title { font-size: 1.3rem; }
          .ana-stat-value { font-size: 1.4rem; }
        }
      `}</style>
    </div>
  );
};

/* ── Sub-Components ── */
const StatCard: React.FC<{ icon: string; label: string; value: number; accent: string }> = ({ icon, label, value, accent }) => (
  <div className="ana-stat-card">
    <div className="ana-stat-icon" style={{ background: `${accent}15` }}>
      {icon}
    </div>
    <div className="ana-stat-info">
      <span className="ana-stat-value" style={{ color: accent }}>{value.toLocaleString()}</span>
      <span className="ana-stat-label">{label}</span>
    </div>
  </div>
);

const LoadingState = () => (
  <div className="ana-loading-shell">
    <div className="ana-loading-spinner" />
    <span className="ana-loading-text">Loading analytics...</span>
    <style>{`
      .ana-loading-shell {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        min-height: 400px; gap: 1.2rem;
      }
      .ana-loading-spinner {
        width: 52px; height: 52px; border-radius: 50%;
        border: 4px solid #e2e8f0; border-top-color: #3b82f6;
        animation: anaSpin 0.8s linear infinite;
      }
      @keyframes anaSpin { to { transform: rotate(360deg); } }
      .ana-loading-text { font-size: 0.9rem; color: #64748b; font-weight: 600; }
    `}</style>
  </div>
);

const ErrorState: React.FC<{ message: string }> = ({ message }) => (
  <div className="ana-error-shell">
    <span className="ana-error-icon">⚠️</span>
    <span className="ana-error-msg">{message}</span>
    <style>{`
      .ana-error-shell {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        min-height: 300px; gap: 0.8rem;
      }
      .ana-error-icon { font-size: 2.5rem; }
      .ana-error-msg { font-size: 0.9rem; color: #dc2626; font-weight: 700; }
    `}</style>
  </div>
);
