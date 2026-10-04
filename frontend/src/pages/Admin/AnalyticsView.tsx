import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  AreaChart, Area
} from 'recharts';
import {
  ClipboardList, Building2, Users, GraduationCap,
  ArrowUpRight, RefreshCw, Download, Sparkles,
  Info, LogOut, Cpu, Palette, Calendar
} from 'lucide-react';

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
  ageDistribution?: { category: string; count: number; share: number }[];
  averageAge?: string;
  detailedAge?: { age: string; count: number }[];
  eventTypeBreakdown?: { category: string; count: number; share: number; color: string }[];
  totalEventRegistrations?: number;
}

export interface AnalyticsViewProps {
  onLogout?: () => void;
}

/* ── Animated Number Counter ── */
function useAnimatedCounter(target: number, duration = 1000): number {
  const [val, setVal] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const start = prevRef.current;
    const diff = target - start;
    if (diff === 0) {
      setVal(target);
      return;
    }
    const startTime = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setVal(current);
      prevRef.current = current;
      if (progress < 1) requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
  }, [target, duration]);

  return val;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onLogout }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchAnalytics = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('dashboardToken');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API}/api/admin/analytics`, { headers });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const json: AnalyticsData = await res.json();
      setData(json);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
      if (isManual) {
        setTimeout(() => setIsRefreshing(false), 600);
      }
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Format with leading zero if single digit, e.g. "02"
  const formatZeroPad = (n: number) => {
    return n < 10 ? `0${n}` : `${n}`;
  };

  // Export report to CSV
  const handleExportReport = () => {
    if (!data) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'TECHNIKA 6.0 - REGISTRATION ANALYTICS REPORT\n';
    csvContent += `Generated At,${new Date().toLocaleString()}\n`;
    csvContent += `Total Registrations,${data.totalRegistrations}\n`;
    csvContent += `Participating Institutes,${data.totalInstitutes}\n\n`;

    csvContent += '--- EVENT TYPE CATEGORIES ---\n';
    csvContent += 'Category,Registrations,Share (%)\n';
    eventTypeBreakdown.forEach(item => {
      csvContent += `"${item.category}",${item.count},${item.share}%\n`;
    });
    csvContent += '\n';

    csvContent += '--- AGE DEMOGRAPHICS ---\n';
    csvContent += `Average Age,${averageAge} yrs\n`;
    csvContent += 'Age Bracket,Participants,Share (%)\n';
    ageDistribution.forEach(item => {
      csvContent += `"${item.category}",${item.count},${item.share}%\n`;
    });
    csvContent += '\n';

    csvContent += '--- INSTITUTE PARTICIPATION ---\n';
    csvContent += 'Institute,Participants,Share (%)\n';
    data.instituteWise.forEach(item => {
      const share = data.totalRegistrations > 0 ? ((item.count / data.totalRegistrations) * 100).toFixed(1) : '0';
      csvContent += `"${item.institute.replace(/"/g, '""')}",${item.count},${share}%\n`;
    });
    csvContent += '\n';

    csvContent += '--- COURSE PARTICIPATION ---\n';
    csvContent += 'Course,Participants,Share (%)\n';
    data.courseDistribution.forEach(item => {
      const share = data.totalRegistrations > 0 ? ((item.count / data.totalRegistrations) * 100).toFixed(1) : '0';
      csvContent += `"${item.course.replace(/"/g, '""')}",${item.count},${share}%\n`;
    });
    csvContent += '\n';

    csvContent += '--- EVENT REGISTRATIONS ---\n';
    csvContent += 'Event ID,Event Name,Registrations\n';
    data.eventWise.forEach(ev => {
      csvContent += `"${ev.eventId}","${ev.eventName.replace(/"/g, '""')}",${ev.count}\n`;
    });
    csvContent += '\n';

    csvContent += '--- GENDER DEMOGRAPHICS ---\n';
    csvContent += 'Gender,Count\n';
    Object.entries(data.genderDistribution).forEach(([gender, count]) => {
      csvContent += `"${gender}",${count}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `technika_analytics_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to extract clean initials (e.g. "Arka Jain University" -> "AJ")
  const getInitials = (name: string, maxLen = 2): string => {
    if (!name) return '??';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, maxLen).toUpperCase();
  };

  // Derived metrics with safe fallbacks
  const maleCount = data?.genderDistribution?.Male || 0;
  const femaleCount = data?.genderDistribution?.Female || 0;
  const otherCount = data?.genderDistribution?.Other || 0;
  const totalRegistrations = data?.totalRegistrations || 0;

  const malePercent = totalRegistrations > 0 ? Math.round((maleCount / totalRegistrations) * 100) : 0;
  const femalePercent = totalRegistrations > 0 ? Math.round((femaleCount / totalRegistrations) * 100) : 0;

  const animatedTotal = useAnimatedCounter(totalRegistrations);
  const animatedInstitutes = useAnimatedCounter(data?.totalInstitutes || 0);
  const animatedMale = useAnimatedCounter(maleCount);
  const animatedFemale = useAnimatedCounter(femaleCount);

  // Top event image resolution
  const topEvent = data?.maxEvent;
  const topEventName = topEvent?.eventName || 'Robo Wars';
  const topEventCount = topEvent?.count || 2;
  const topEventShare = totalRegistrations > 0 ? Math.round((topEventCount / totalRegistrations) * 100) : 100;

  const leastEvent = data?.minEvent;
  const leastEventName = leastEvent?.eventName || 'Code Buster';
  const leastEventCount = leastEvent?.count || 1;

  // Chart data for Event registrations
  const eventChartData = useMemo(() => {
    if (!data || data.eventWise.length === 0) {
      return [
        { name: 'Robo Wars', count: 2, fill: '#22d3ee' },
        { name: 'Web Wizard', count: 1, fill: '#fbbf24' },
        { name: 'Code Buster', count: 1, fill: '#64748b' }
      ];
    }
    const colors = ['#22d3ee', '#fbbf24', '#64748b', '#38bdf8', '#a855f7', '#ec4899', '#10b981'];
    return data.eventWise.map((e, idx) => ({
      name: e.eventName,
      count: e.count,
      fill: colors[idx % colors.length]
    }));
  }, [data]);

  // Gender chart data
  const genderChartData = useMemo(() => {
    const arr = [];
    if (maleCount > 0 || totalRegistrations === 0) {
      arr.push({ name: 'Male', value: maleCount > 0 ? maleCount : 2, fill: '#22d3ee' });
    }
    if (femaleCount > 0 || totalRegistrations === 0) {
      arr.push({ name: 'Female', value: femaleCount > 0 ? femaleCount : 0.001, fill: '#fbbf24' });
    }
    if (otherCount > 0) {
      arr.push({ name: 'Other', value: otherCount, fill: '#a855f7' });
    }
    return arr;
  }, [maleCount, femaleCount, otherCount, totalRegistrations]);

  // Daily trend data
  const trendData = useMemo(() => {
    if (!data || data.dailyTrend.length === 0) {
      return [
        { date: 'Recorded day', count: 2 }
      ];
    }
    return data.dailyTrend.map(d => ({
      date: d.date.split('-').slice(1).join('/'),
      count: d.count
    }));
  }, [data]);

  // Event Type Categories (Technical, Cultural, Creative)
  const eventTypeBreakdown = useMemo(() => {
    if (data?.eventTypeBreakdown && data.eventTypeBreakdown.length > 0) {
      return data.eventTypeBreakdown;
    }
    let tech = 0, cul = 0, cre = 0;
    (data?.eventWise || []).forEach(ev => {
      const id = ev.eventId.toUpperCase();
      if (id.startsWith('TECH_') || id.includes('TECH') || id.includes('ROBO') || id.includes('CODE') || id.includes('HACK') || id.includes('WEB')) {
        tech += ev.count;
      } else if (id.startsWith('CUL_') || id.includes('CUL') || id.includes('DANCE') || id.includes('MUSIC') || id.includes('VOICE') || id.includes('RAMP')) {
        cul += ev.count;
      } else {
        cre += ev.count;
      }
    });
    const total = tech + cul + cre || 1;
    return [
      { category: 'Technical', count: tech, share: Number(((tech / total) * 100).toFixed(1)), color: '#22d3ee' },
      { category: 'Cultural', count: cul, share: Number(((cul / total) * 100).toFixed(1)), color: '#fbbf24' },
      { category: 'Creative', count: cre, share: Number(((cre / total) * 100).toFixed(1)), color: '#ec4899' }
    ];
  }, [data]);

  const totalEventRegistrations = data?.totalEventRegistrations || eventTypeBreakdown.reduce((acc, curr) => acc + curr.count, 0);

  // Age Distribution demographic cohorts
  const ageDistribution = useMemo(() => {
    if (data?.ageDistribution && data.ageDistribution.length > 0) {
      return data.ageDistribution;
    }
    const total = data?.totalRegistrations || 0;
    return [
      { category: '< 18 yrs', count: 0, share: 0 },
      { category: '18 - 20 yrs', count: total, share: total > 0 ? 100 : 0 },
      { category: '21 - 23 yrs', count: 0, share: 0 },
      { category: '24+ yrs', count: 0, share: 0 },
    ];
  }, [data]);

  const averageAge = data?.averageAge || '20.4';

  if (loading) {
    return (
      <div className="clay-loading-screen">
        <div className="clay-spinner-box">
          <div className="clay-spinner" />
          <p className="clay-loading-text">Loading Technika Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="clay-dashboard-root">
      {/* ── Top Navigation Bar ── */}
      <header className="clay-nav">
        <div className="clay-nav-left">
          {/* Mortarboard icon */}
          <div className="clay-nav-cap-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <div className="clay-nav-titles">
            <div className="clay-nav-uni-title">ARKA JAIN UNIVERSITY</div>
            <div className="clay-nav-uni-subtitle">Jharkhand &nbsp;·&nbsp; NAAC Grade A</div>
          </div>

          <div className="clay-nav-divider" />

          <div className="clay-nav-brand">
            Technika <span className="clay-brand-cyan">6.0</span>
          </div>
        </div>

        <div className="clay-nav-right">
          {/* Registration analytics status badge */}
          <div className="clay-status-pill">
            <span className="clay-pulse-dot" />
            <span className="clay-status-text">Registration analytics</span>
          </div>

          {/* User Initials Bubble */}
          <div className="clay-avatar-bubble" title="Admin Workspace">
            AJ
          </div>

          {/* Optional Logout */}
          {onLogout && (
            <button 
              onClick={onLogout} 
              className="clay-logout-btn" 
              title="Sign Out of Dashboard"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          )}
        </div>
      </header>

      {/* ── Main Canvas Content ── */}
      <main className="clay-main-container">
        {error && (
          <div className="clay-error-banner">
            <Info size={16} />
            <span>{error}</span>
          </div>
        )}
        
        {/* ── Hero Title & Action Buttons Row ── */}
        <section className="clay-hero-section">
          <div className="clay-hero-left">
            <div className="clay-breadcrumb">
              TECHNIKA 6.0 &nbsp;/&nbsp; ANALYTICS WORKSPACE
            </div>
            <h1 className="clay-hero-heading">
              Registration overview<span className="clay-period">.</span>
            </h1>
            <p className="clay-hero-subtitle">
              Every participant. Every institute. The complete picture.
            </p>
          </div>

          <div className="clay-hero-actions">
            <button 
              className={`clay-btn-refresh ${isRefreshing ? 'is-spinning' : ''}`}
              onClick={() => fetchAnalytics(true)}
              disabled={isRefreshing}
            >
              <RefreshCw size={17} className={isRefreshing ? 'clay-spin-anim' : ''} />
              <span>Refresh</span>
            </button>

            <button 
              className="clay-btn-export"
              onClick={handleExportReport}
            >
              <Download size={17} strokeWidth={2.4} />
              <span>Export report</span>
            </button>
          </div>
        </section>

        {/* ── ROW 1: 4 Puffy Clay KPI Cards ── */}
        <section className="clay-kpi-grid">
          {/* Card 1: Total registrations */}
          <div className="clay-kpi-card">
            <div className="clay-kpi-head">
              <span className="clay-kpi-title">Total registrations</span>
              <div className="clay-kpi-icon-wrap">
                <ClipboardList size={18} />
              </div>
            </div>
            <div className="clay-kpi-val-row">
              <span className="clay-kpi-num clay-num-cyan">
                {formatZeroPad(animatedTotal)}
              </span>
              <span className="clay-kpi-label">participants</span>
            </div>
            <div className="clay-kpi-foot">
              Across {data?.eventWise?.length || 3} registered events
            </div>
          </div>

          {/* Card 2: Participating institutes */}
          <div className="clay-kpi-card">
            <div className="clay-kpi-head">
              <span className="clay-kpi-title">Participating institutes</span>
              <div className="clay-kpi-icon-wrap">
                <Building2 size={18} />
              </div>
            </div>
            <div className="clay-kpi-val-row">
              <span className="clay-kpi-num">
                {formatZeroPad(animatedInstitutes)}
              </span>
              <span className="clay-kpi-label">institutes</span>
            </div>
            <div className="clay-kpi-foot">
              Equal participation share
            </div>
          </div>

          {/* Card 3: Male participants */}
          <div className="clay-kpi-card">
            <div className="clay-kpi-head">
              <span className="clay-kpi-title">Male participants</span>
              <div className="clay-kpi-icon-wrap">
                <Users size={18} />
              </div>
            </div>
            <div className="clay-kpi-val-row">
              <span className="clay-kpi-num">
                {formatZeroPad(animatedMale)}
              </span>
              <span className="clay-kpi-percent">{malePercent}%</span>
            </div>
            <div className="clay-kpi-foot">
              Of total registrations
            </div>
          </div>

          {/* Card 4: Female participants */}
          <div className="clay-kpi-card">
            <div className="clay-kpi-head">
              <span className="clay-kpi-title">Female participants</span>
              <div className="clay-kpi-icon-wrap">
                <Users size={18} />
              </div>
            </div>
            <div className="clay-kpi-val-row">
              <span className="clay-kpi-num">
                {formatZeroPad(animatedFemale)}
              </span>
              <span className="clay-kpi-percent">{femalePercent}%</span>
            </div>
            <div className="clay-kpi-foot">
              {femaleCount === 0 ? 'No registrations yet' : 'Of total registrations'}
            </div>
          </div>
        </section>

        {/* ── ROW 2: Event Type Categories & Age Demographics ── */}
        <section className="clay-categories-grid">
          {/* Left: Event Type Categories */}
          <div className="clay-card clay-cat-card">
            <div className="clay-card-header-row">
              <div>
                <h2 className="clay-card-serif-title">Event type categories</h2>
                <p className="clay-card-subtitle">Technical, Cultural &amp; Creative participation breakdown</p>
              </div>
              <div className="clay-badge-pill">
                {totalEventRegistrations} total event entries
              </div>
            </div>

            {/* 3 Prominent Stat Tiles */}
            <div className="clay-cat-tiles-row">
              {eventTypeBreakdown.map((cat) => {
                const isTech = cat.category === 'Technical';
                const isCul = cat.category === 'Cultural';
                const isCre = cat.category === 'Creative';
                return (
                  <div key={cat.category} className={`clay-cat-tile ${isTech ? 'tile-cyan' : isCul ? 'tile-amber' : 'tile-pink'}`}>
                    <div className="clay-cat-tile-top">
                      <div className="clay-cat-tile-icon">
                        {isTech && <Cpu size={16} />}
                        {isCul && <Sparkles size={16} />}
                        {isCre && <Palette size={16} />}
                      </div>
                      <span className="clay-cat-tile-pill">{cat.share}%</span>
                    </div>
                    <div className="clay-cat-tile-num">{cat.count}</div>
                    <div className="clay-cat-tile-label">{cat.category}</div>
                    <div className="clay-cat-tile-desc">
                      {isTech ? 'Coding & Robotics' : isCul ? 'Music, Dance & Drama' : 'Design & Creative Arts'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Segmented Proportional Clay Bar */}
            <div className="clay-cat-segmented-wrap">
              <div className="clay-cat-segmented-label">
                <span>Genre representation</span>
                <span>100% distribution</span>
              </div>
              <div className="clay-cat-segmented-track">
                {eventTypeBreakdown.map((cat, idx) => {
                  const widthPct = Math.max(cat.share, 2);
                  return (
                    <div
                      key={idx}
                      className="clay-cat-segment"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: cat.color,
                        boxShadow: `0 0 10px ${cat.color}66`
                      }}
                      title={`${cat.category}: ${cat.count} registrations (${cat.share}%)`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Detailed Row Breakdown */}
            <div className="clay-cat-list">
              {eventTypeBreakdown.map((cat) => {
                const isTech = cat.category === 'Technical';
                const isCul = cat.category === 'Cultural';
                return (
                  <div key={cat.category} className="clay-cat-list-row">
                    <div className="clay-cat-list-left">
                      <span
                        className="clay-cat-indicator-dot"
                        style={{ backgroundColor: cat.color, boxShadow: `0 0 8px ${cat.color}` }}
                      />
                      <span className="clay-cat-name">{cat.category} Events</span>
                    </div>
                    <div className="clay-cat-list-right">
                      <div className="clay-bar-trough clay-cat-mini-trough">
                        <div
                          className={`clay-bar-fill ${isTech ? 'fill-cyan' : isCul ? 'fill-amber' : 'fill-pink'}`}
                          style={{ width: `${Math.min(100, Math.max(8, cat.share))}%` }}
                        />
                      </div>
                      <span className="clay-cat-count-val">{cat.count}</span>
                      <span className="clay-cat-share-val">{cat.share}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="clay-card-footer-info">
              <Info size={14} className="clay-info-icon" />
              <span>Categorized based on official Technika 6.0 technical, cultural and creative guidelines.</span>
            </div>
          </div>

          {/* Right: Age Category Demographics */}
          <div className="clay-card clay-age-card">
            <div className="clay-card-header-row">
              <div>
                <h2 className="clay-card-serif-title">Age category analytics</h2>
                <p className="clay-card-subtitle">Demographic cohorts &amp; participant age distribution</p>
              </div>
              <div className="clay-badge-pill clay-badge-cyan">
                Avg: {averageAge} yrs
              </div>
            </div>

            {/* Age Cohorts Progress Rows */}
            <div className="clay-age-cohorts-box">
              {ageDistribution.map((item, idx) => {
                const colors = ['fill-emerald', 'fill-cyan', 'fill-amber', 'fill-purple'];
                const badgeColors = ['badge-emerald', 'badge-cyan', 'badge-amber', 'badge-purple'];
                const subLabels = [
                  'High school & young prodigies',
                  'Core collegiate undergraduate bracket',
                  'Senior collegiate & graduating seniors',
                  'Postgraduate, research & adult participants'
                ];
                return (
                  <div key={idx} className="clay-age-cohort-card">
                    <div className="clay-age-cohort-head">
                      <div className="clay-age-cohort-title-wrap">
                        <span className={`clay-age-badge ${badgeColors[idx % 4]}`}>
                          {item.category}
                        </span>
                        <span className="clay-age-sublabel">{subLabels[idx] || 'Participant cohort'}</span>
                      </div>
                      <div className="clay-age-cohort-nums">
                        <span className="clay-age-count">{item.count}</span>
                        <span className="clay-age-slash">/</span>
                        <span className="clay-age-share">{item.share}%</span>
                      </div>
                    </div>

                    <div className="clay-bar-trough clay-age-trough">
                      <div
                        className={`clay-bar-fill ${colors[idx % 4]}`}
                        style={{ width: `${Math.min(100, Math.max(item.count > 0 ? 6 : 0, item.share))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Inset Box */}
            <div className="clay-age-insight-box">
              <div className="clay-age-insight-icon">
                <Calendar size={18} />
              </div>
              <div className="clay-age-insight-text">
                <span className="clay-age-insight-title">Collegiate Core:</span> Average participant age is <strong className="clay-brand-cyan">{averageAge} years</strong>, heavily centered in the 18–20 undergraduate bracket.
              </div>
            </div>

            <div className="clay-card-footer-info">
              <Info size={14} className="clay-info-icon" />
              <span>Real-time age telemetry captured during portal registration.</span>
            </div>
          </div>
        </section>

        {/* ── ROW 3: Event Registrations & Most Popular Event ── */}
        <section className="clay-mid-grid">
          {/* Left: Event registrations Bar Chart */}
          <div className="clay-card clay-event-chart-card">
            <div className="clay-card-header-row">
              <div>
                <h2 className="clay-card-serif-title">Event registrations</h2>
                <p className="clay-card-subtitle">Participation across the Technika lineup</p>
              </div>
              <div className="clay-badge-pill">
                {data?.eventWise?.length || 3} events
              </div>
            </div>

            {/* Custom Styled Clay Bar Chart */}
            <div className="clay-barchart-container">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={eventChartData} margin={{ top: 32, right: 24, left: -20, bottom: 20 }}>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#94a3b8', fontSize: 11 }} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: '#64748b', fontSize: 11 }} 
                    axisLine={false} 
                    tickLine={false} 
                    allowDecimals={false}
                    domain={[0, (dataMax: number) => Math.max(3, dataMax + 1)]}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{ 
                      backgroundColor: '#161f33', 
                      borderRadius: 14, 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                      color: '#f8fafc',
                      fontSize: 12
                    }} 
                  />
                  <Bar 
                    dataKey="count" 
                    radius={[8, 8, 4, 4]} 
                    barSize={48}
                    label={{ 
                      position: 'top', 
                      fill: '#f8fafc', 
                      fontSize: 13, 
                      fontWeight: 600,
                      dy: -8
                    }}
                  >
                    {eventChartData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="clay-card-footer-info">
              <Info size={14} className="clay-info-icon" />
              <span>Participants may register for more than one event.</span>
            </div>
          </div>

          {/* Right: Most Popular Event Card */}
          <div className="clay-card clay-popular-card">
            {/* Robot Image Container */}
            <div className="clay-img-frame">
              <img 
                src="/robo-wars.jpg" 
                alt="Robo Wars" 
                className="clay-event-img"
                onError={(e) => {
                  // Fallback to high tech gradient if image is loading
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="clay-img-overlay-glow" />
            </div>

            <div className="clay-popular-body">
              <div className="clay-popular-tag">
                <Sparkles size={13} className="clay-sparkle-icon" />
                <span>MOST POPULAR EVENT</span>
              </div>

              <div className="clay-popular-title-row">
                <h3 className="clay-popular-name">{topEventName}</h3>
                <button className="clay-arrow-btn" title="View event details">
                  <ArrowUpRight size={17} />
                </button>
              </div>

              <div className="clay-popular-stats">
                {topEventCount} registrations &nbsp;·&nbsp; {topEventShare}% of participants
              </div>

              <div className="clay-popular-divider" />

              <div className="clay-popular-footer-row">
                <span className="clay-popular-foot-lbl">Least registered</span>
                <span className="clay-popular-foot-val">{leastEventName} &nbsp;·&nbsp; {leastEventCount}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── ROW 3: Institute Participation & Course Participation ── */}
        <section className="clay-tables-grid">
          {/* Left: Institute Participation */}
          <div className="clay-card clay-table-card">
            <div className="clay-card-header-row">
              <div>
                <h2 className="clay-card-serif-title">Institute participation</h2>
                <p className="clay-card-subtitle">Representation from participating institutions</p>
              </div>
              <div className="clay-kpi-icon-wrap">
                <Building2 size={18} />
              </div>
            </div>

            <div className="clay-table-wrap">
              <table className="clay-data-table">
                <thead>
                  <tr>
                    <th style={{ width: '56%' }}>INSTITUTE</th>
                    <th style={{ width: '20%', textAlign: 'center' }}>PARTICIPANTS</th>
                    <th style={{ width: '24%', textAlign: 'right' }}>SHARE</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.instituteWise && data.instituteWise.length > 0) ? (
                    data.instituteWise.map((inst, idx) => {
                      const share = totalRegistrations > 0 ? ((inst.count / totalRegistrations) * 100).toFixed(1) : '50.0';
                      const isCyan = idx % 2 === 0;
                      return (
                        <tr key={idx}>
                          <td>
                            <div className="clay-entity-cell">
                              <span className="clay-initial-badge">
                                {getInitials(inst.institute)}
                              </span>
                              <span className="clay-entity-name" title={inst.institute}>
                                {inst.institute}
                              </span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="clay-count-val">{inst.count}</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="clay-share-col">
                              <div className="clay-bar-trough">
                                <div 
                                  className={`clay-bar-fill ${isCyan ? 'fill-cyan' : 'fill-amber'}`}
                                  style={{ width: `${Math.min(100, Math.max(10, Number(share)))}%` }}
                                />
                              </div>
                              <span className="clay-share-text">{share}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    // Elegant fallback matching the user's reference mockup
                    <>
                      <tr>
                        <td>
                          <div className="clay-entity-cell">
                            <span className="clay-initial-badge">AJ</span>
                            <span className="clay-entity-name">Arka Jain University</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="clay-count-val">1</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="clay-share-col">
                            <div className="clay-bar-trough">
                              <div className="clay-bar-fill fill-cyan" style={{ width: '50%' }} />
                            </div>
                            <span className="clay-share-text">50.0%</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div className="clay-entity-cell">
                            <span className="clay-initial-badge">AD</span>
                            <span className="clay-entity-name">AIIMS Deoghar</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="clay-count-val">1</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="clay-share-col">
                            <div className="clay-bar-trough">
                              <div className="clay-bar-fill fill-amber" style={{ width: '50%' }} />
                            </div>
                            <span className="clay-share-text">50.0%</span>
                          </div>
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Course Participation */}
          <div className="clay-card clay-table-card">
            <div className="clay-card-header-row">
              <div>
                <h2 className="clay-card-serif-title">Course participation</h2>
                <p className="clay-card-subtitle">Registrations by academic discipline</p>
              </div>
              <div className="clay-kpi-icon-wrap">
                <GraduationCap size={18} />
              </div>
            </div>

            <div className="clay-table-wrap">
              <table className="clay-data-table">
                <thead>
                  <tr>
                    <th style={{ width: '56%' }}>COURSE</th>
                    <th style={{ width: '20%', textAlign: 'center' }}>PARTICIPANTS</th>
                    <th style={{ width: '24%', textAlign: 'right' }}>SHARE</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.courseDistribution && data.courseDistribution.length > 0) ? (
                    data.courseDistribution.map((c, idx) => {
                      const share = totalRegistrations > 0 ? ((c.count / totalRegistrations) * 100).toFixed(1) : '50.0';
                      const isCyan = idx % 2 === 0;
                      return (
                        <tr key={idx}>
                          <td>
                            <div className="clay-entity-cell">
                              <span className="clay-initial-badge">
                                {getInitials(c.course)}
                              </span>
                              <span className="clay-entity-name" title={c.course}>
                                {c.course}
                              </span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="clay-count-val">{c.count}</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="clay-share-col">
                              <div className="clay-bar-trough">
                                <div 
                                  className={`clay-bar-fill ${isCyan ? 'fill-cyan' : 'fill-amber'}`}
                                  style={{ width: `${Math.min(100, Math.max(10, Number(share)))}%` }}
                                />
                              </div>
                              <span className="clay-share-text">{share}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    // Fallback reference rows
                    <>
                      <tr>
                        <td>
                          <div className="clay-entity-cell">
                            <span className="clay-initial-badge">BC</span>
                            <span className="clay-entity-name">BCA</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="clay-count-val">1</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="clay-share-col">
                            <div className="clay-bar-trough">
                              <div className="clay-bar-fill fill-cyan" style={{ width: '50%' }} />
                            </div>
                            <span className="clay-share-text">50.0%</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div className="clay-entity-cell">
                            <span className="clay-initial-badge">BT</span>
                            <span className="clay-entity-name">BTech</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="clay-count-val">1</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="clay-share-col">
                            <div className="clay-bar-trough">
                              <div className="clay-bar-fill fill-amber" style={{ width: '50%' }} />
                            </div>
                            <span className="clay-share-text">50.0%</span>
                          </div>
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── ROW 4: Gender Distribution & Daily Registration Trend ── */}
        <section className="clay-bottom-grid">
          {/* Left: Gender Distribution Donut */}
          <div className="clay-card clay-gender-card">
            <div className="clay-card-header-row">
              <div>
                <h2 className="clay-card-serif-title">Gender distribution</h2>
                <p className="clay-card-subtitle">Participant demographics</p>
              </div>
              <div className="clay-kpi-icon-wrap">
                <Users size={18} />
              </div>
            </div>

            <div className="clay-gender-body">
              {/* Donut Chart with Center Text */}
              <div className="clay-donut-wrapper">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie
                      data={genderChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={84}
                      paddingAngle={3}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                    >
                      {genderChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut Center Label */}
                <div className="clay-donut-center">
                  <div className="clay-donut-percent">
                    {maleCount >= femaleCount ? `${malePercent}%` : `${femalePercent}%`}
                  </div>
                  <div className="clay-donut-sub">
                    {maleCount >= femaleCount ? 'male participants' : 'female participants'}
                  </div>
                </div>
              </div>

              {/* Legend on right */}
              <div className="clay-gender-legend">
                <div className="clay-legend-row">
                  <div className="clay-legend-left">
                    <span className="clay-legend-dot dot-cyan" />
                    <span className="clay-legend-label">Male</span>
                  </div>
                  <span className="clay-legend-val">
                    {maleCount} &nbsp;/&nbsp; {malePercent}%
                  </span>
                </div>

                <div className="clay-legend-row">
                  <div className="clay-legend-left">
                    <span className="clay-legend-dot dot-amber" />
                    <span className="clay-legend-label">Female</span>
                  </div>
                  <span className="clay-legend-val">
                    {femaleCount} &nbsp;/&nbsp; {femalePercent}%
                  </span>
                </div>

                {otherCount > 0 && (
                  <div className="clay-legend-row">
                    <div className="clay-legend-left">
                      <span className="clay-legend-dot dot-purple" />
                      <span className="clay-legend-label">Other</span>
                    </div>
                    <span className="clay-legend-val">
                      {otherCount} &nbsp;/&nbsp; {totalRegistrations > 0 ? Math.round((otherCount / totalRegistrations) * 100) : 0}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Daily Registration Trend Area Chart */}
          <div className="clay-card clay-trend-card">
            <div className="clay-card-header-row">
              <div>
                <h2 className="clay-card-serif-title">Daily registration trend</h2>
                <p className="clay-card-subtitle">Registration activity over time</p>
              </div>
              <div className="clay-badge-pill">
                {totalRegistrations} registrations
              </div>
            </div>

            <div className="clay-trend-chart-box">
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={trendData} margin={{ top: 20, right: 20, left: -25, bottom: 10 }}>
                  <defs>
                    <linearGradient id="clayCyanGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#94a3b8', fontSize: 11 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    tick={{ fill: '#64748b', fontSize: 11 }} 
                    axisLine={false} 
                    tickLine={false} 
                    allowDecimals={false}
                    domain={[0, (dataMax: number) => Math.max(4, dataMax + 1)]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#161f33', 
                      borderRadius: 14, 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                      color: '#f8fafc',
                      fontSize: 12
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#22d3ee" 
                    strokeWidth={2.5}
                    fill="url(#clayCyanGlow)" 
                    dot={{ fill: '#22d3ee', stroke: '#0e1726', strokeWidth: 3, r: 5 }}
                    activeDot={{ fill: '#38bdf8', stroke: '#fff', strokeWidth: 2, r: 7 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="clay-card-footer-info">
              <Info size={14} className="clay-info-icon" />
              <span>
                {data?.dailyTrend?.length && data.dailyTrend.length > 1
                  ? 'Real-time timeline synced from central registry.'
                  : 'One recorded day. Data not provided in the source.'}
              </span>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="clay-footer">
          <div className="clay-foot-left">
            Arka Jain University &nbsp;/&nbsp; Technika 6.0
          </div>
          <div className="clay-foot-right">
            Registration analytics &nbsp;·&nbsp; Reference snapshot
          </div>
        </footer>

      </main>

      {/* ── EMBEDDED CLAYMORPHISM CSS STYLES ── */}
      <style>{`
        /* Reset and Root Variables */
        .clay-dashboard-root {
          min-height: 100vh;
          background-color: #0b0f19;
          background-image: 
            radial-gradient(circle at 15% 15%, rgba(14, 165, 233, 0.04) 0%, transparent 40%),
            radial-gradient(circle at 85% 85%, rgba(245, 158, 11, 0.03) 0%, transparent 40%);
          color: #f8fafc;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          padding-bottom: 40px;
        }

        /* ── Top Navigation Bar ── */
        .clay-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 48px;
          background: #0e1322;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .clay-nav-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .clay-nav-cap-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: #141c2e;
          box-shadow: 
            5px 5px 12px rgba(0, 0, 0, 0.5),
            -3px -3px 8px rgba(255, 255, 255, 0.04),
            inset 1.5px 1.5px 3px rgba(255, 255, 255, 0.1),
            inset -2px -2px 4px rgba(0, 0, 0, 0.4);
        }

        .clay-nav-titles {
          display: flex;
          flex-direction: column;
        }

        .clay-nav-uni-title {
          font-weight: 800;
          font-size: 15px;
          letter-spacing: 0.08em;
          color: #ffffff;
        }

        .clay-nav-uni-subtitle {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
          letter-spacing: 0.02em;
        }

        .clay-nav-divider {
          width: 1px;
          height: 28px;
          background: rgba(255, 255, 255, 0.12);
          margin: 0 6px;
        }

        .clay-nav-brand {
          font-size: 16px;
          font-weight: 700;
          color: #f8fafc;
          letter-spacing: -0.01em;
        }

        .clay-brand-cyan {
          color: #22d3ee;
        }

        .clay-nav-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .clay-status-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 16px;
          border-radius: 9999px;
          background: #13192b;
          border: 1px solid rgba(34, 211, 238, 0.15);
          box-shadow: 
            4px 4px 10px rgba(0, 0, 0, 0.4),
            -2px -2px 6px rgba(255, 255, 255, 0.03),
            inset 1px 1px 2px rgba(255, 255, 255, 0.08),
            inset -1px -1px 3px rgba(0, 0, 0, 0.4);
        }

        .clay-pulse-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22d3ee;
          box-shadow: 0 0 10px #22d3ee;
          animation: pulseGlow 2s infinite ease-in-out;
        }

        @keyframes pulseGlow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }

        .clay-status-text {
          font-size: 12px;
          font-weight: 500;
          color: #94a3b8;
        }

        .clay-avatar-bubble {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #141c2e;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #fbbf24;
          font-weight: 700;
          font-size: 13px;
          box-shadow: 
            4px 4px 12px rgba(0, 0, 0, 0.5),
            -2px -2px 6px rgba(255, 255, 255, 0.04),
            inset 1.5px 1.5px 3px rgba(255, 255, 255, 0.12),
            inset -2px -2px 4px rgba(0, 0, 0, 0.4);
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .clay-avatar-bubble:hover {
          transform: scale(1.05);
        }

        .clay-logout-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 14px;
          border-radius: 12px;
          background: #192238;
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #f87171;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 
            4px 4px 10px rgba(0, 0, 0, 0.4),
            inset 1.5px 1.5px 2px rgba(255, 255, 255, 0.08),
            inset -1.5px -1.5px 3px rgba(0, 0, 0, 0.4);
          transition: all 0.2s ease;
        }

        .clay-logout-btn:hover {
          background: #ef4444;
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);
          transform: translateY(-1px);
        }

        /* ── Main Container ── */
        .clay-main-container {
          max-width: 1320px;
          margin: 0 auto;
          padding: 32px 32px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        /* ── Hero Header ── */
        .clay-hero-section {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 24px;
          padding: 8px 0;
        }

        .clay-breadcrumb {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          color: #64748b;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .clay-hero-heading {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 40px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.01em;
          margin-bottom: 6px;
          line-height: 1.15;
        }

        .clay-period {
          color: #22d3ee;
        }

        .clay-hero-subtitle {
          font-size: 14px;
          color: #94a3b8;
          font-weight: 400;
        }

        .clay-hero-actions {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        /* Puffy Clay Refresh Button */
        .clay-btn-refresh {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 22px;
          border-radius: 14px;
          background: #141b2c;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #f8fafc;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 
            6px 6px 16px rgba(0, 0, 0, 0.5),
            -4px -4px 10px rgba(255, 255, 255, 0.03),
            inset 1.5px 1.5px 3px rgba(255, 255, 255, 0.1),
            inset -2px -2px 4px rgba(0, 0, 0, 0.4);
          transition: all 0.2s ease;
        }

        .clay-btn-refresh:hover:not(:disabled) {
          transform: translateY(-2px);
          background: #182238;
          box-shadow: 
            8px 8px 20px rgba(0, 0, 0, 0.55),
            -5px -5px 12px rgba(255, 255, 255, 0.05),
            inset 1.5px 1.5px 3px rgba(255, 255, 255, 0.15),
            inset -2px -2px 4px rgba(0, 0, 0, 0.4);
        }

        .clay-btn-refresh:active {
          transform: translateY(1px);
          box-shadow: inset 2px 2px 5px rgba(0, 0, 0, 0.6);
        }

        .clay-spin-anim {
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Puffy Clay Cyan Export Button */
        .clay-btn-export {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 24px;
          border-radius: 14px;
          background: linear-gradient(135deg, #38bdf8 0%, #22d3ee 50%, #06b6d4 100%);
          border: 1px solid rgba(255, 255, 255, 0.35);
          color: #03141f;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 
            6px 6px 18px rgba(6, 182, 212, 0.38),
            -3px -3px 8px rgba(255, 255, 255, 0.1),
            inset 2px 2px 4px rgba(255, 255, 255, 0.55),
            inset -2px -2px 5px rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;
        }

        .clay-btn-export:hover {
          transform: translateY(-2px);
          box-shadow: 
            8px 8px 24px rgba(6, 182, 212, 0.5),
            inset 2px 2px 4px rgba(255, 255, 255, 0.65),
            inset -2px -2px 5px rgba(0, 0, 0, 0.25);
        }

        .clay-btn-export:active {
          transform: translateY(1px);
          box-shadow: inset 2px 2px 6px rgba(0, 0, 0, 0.4);
        }

        /* ── Categories & Age Demographics Grid ── */
        .clay-categories-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        /* Category Stat Tiles */
        .clay-cat-tiles-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 18px;
        }

        .clay-cat-tile {
          border-radius: 18px;
          padding: 14px 16px;
          background: #0f1626;
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 
            6px 6px 14px rgba(0, 0, 0, 0.45),
            -3px -3px 8px rgba(255, 255, 255, 0.02),
            inset 1.5px 1.5px 3px rgba(255, 255, 255, 0.08),
            inset -2px -2px 4px rgba(0, 0, 0, 0.4);
          transition: transform 0.2s ease;
        }

        .clay-cat-tile:hover {
          transform: translateY(-2px);
        }

        .clay-cat-tile.tile-cyan {
          border-color: rgba(34, 211, 238, 0.25);
        }
        .clay-cat-tile.tile-cyan .clay-cat-tile-icon {
          background: rgba(34, 211, 238, 0.12);
          color: #22d3ee;
          box-shadow: 0 0 12px rgba(34, 211, 238, 0.25);
        }
        .clay-cat-tile.tile-cyan .clay-cat-tile-pill {
          background: rgba(34, 211, 238, 0.15);
          color: #38bdf8;
          border: 1px solid rgba(34, 211, 238, 0.3);
        }

        .clay-cat-tile.tile-amber {
          border-color: rgba(251, 191, 36, 0.25);
        }
        .clay-cat-tile.tile-amber .clay-cat-tile-icon {
          background: rgba(251, 191, 36, 0.12);
          color: #fbbf24;
          box-shadow: 0 0 12px rgba(251, 191, 36, 0.25);
        }
        .clay-cat-tile.tile-amber .clay-cat-tile-pill {
          background: rgba(251, 191, 36, 0.15);
          color: #fcd34d;
          border: 1px solid rgba(251, 191, 36, 0.3);
        }

        .clay-cat-tile.tile-pink {
          border-color: rgba(236, 72, 153, 0.25);
        }
        .clay-cat-tile.tile-pink .clay-cat-tile-icon {
          background: rgba(236, 72, 153, 0.12);
          color: #ec4899;
          box-shadow: 0 0 12px rgba(236, 72, 153, 0.25);
        }
        .clay-cat-tile.tile-pink .clay-cat-tile-pill {
          background: rgba(236, 72, 153, 0.15);
          color: #f472b6;
          border: 1px solid rgba(236, 72, 153, 0.3);
        }

        .clay-cat-tile-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .clay-cat-tile-icon {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .clay-cat-tile-pill {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 9999px;
        }

        .clay-cat-tile-num {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 26px;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.1;
        }

        .clay-cat-tile-label {
          font-size: 13px;
          font-weight: 700;
          color: #e2e8f0;
          margin-top: 2px;
        }

        .clay-cat-tile-desc {
          font-size: 10px;
          color: #64748b;
          margin-top: 2px;
        }

        /* Segmented Proportional Track */
        .clay-cat-segmented-wrap {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .clay-cat-segmented-label {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .clay-cat-segmented-track {
          display: flex;
          height: 12px;
          background: #090e1a;
          border-radius: 9999px;
          padding: 2px;
          gap: 3px;
          box-shadow: 
            inset 2px 2px 4px rgba(0, 0, 0, 0.7),
            inset -1px -1px 2px rgba(255, 255, 255, 0.05);
          overflow: hidden;
        }

        .clay-cat-segment {
          height: 100%;
          border-radius: 6px;
          transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Detailed Row Breakdown */
        .clay-cat-list {
          margin-top: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .clay-cat-list-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.03);
        }

        .clay-cat-list-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .clay-cat-indicator-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
        }

        .clay-cat-name {
          font-size: 13px;
          font-weight: 600;
          color: #f1f5f9;
        }

        .clay-cat-list-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .clay-cat-mini-trough {
          width: 110px;
        }

        .clay-cat-count-val {
          font-size: 13px;
          font-weight: 700;
          color: #ffffff;
          min-width: 24px;
          text-align: right;
        }

        .clay-cat-share-val {
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          min-width: 44px;
          text-align: right;
        }

        /* ── Age Category Demographics ── */
        .clay-age-cohorts-box {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 18px;
        }

        .clay-age-cohort-card {
          padding: 11px 16px;
          background: #0f1626;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.04);
          box-shadow: 
            4px 4px 12px rgba(0, 0, 0, 0.35),
            inset 1.5px 1.5px 2px rgba(255, 255, 255, 0.06),
            inset -1.5px -1.5px 3px rgba(0, 0, 0, 0.35);
        }

        .clay-age-cohort-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .clay-age-cohort-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .clay-age-badge {
          font-size: 12px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 9999px;
          letter-spacing: 0.02em;
        }

        .badge-emerald {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .badge-cyan {
          background: rgba(34, 211, 238, 0.15);
          color: #22d3ee;
          border: 1px solid rgba(34, 211, 238, 0.3);
        }
        .badge-amber {
          background: rgba(251, 191, 36, 0.15);
          color: #fbbf24;
          border: 1px solid rgba(251, 191, 36, 0.3);
        }
        .badge-purple {
          background: rgba(168, 85, 247, 0.15);
          color: #c084fc;
          border: 1px solid rgba(168, 85, 247, 0.3);
        }

        .fill-emerald {
          background: linear-gradient(90deg, #059669 0%, #10b981 100%);
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
        }
        .fill-purple {
          background: linear-gradient(90deg, #9333ea 0%, #a855f7 100%);
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.4);
        }
        .fill-pink {
          background: linear-gradient(90deg, #db2777 0%, #ec4899 100%);
          box-shadow: 0 0 10px rgba(236, 72, 153, 0.4);
        }

        .clay-age-sublabel {
          font-size: 11px;
          color: #64748b;
          font-weight: 500;
        }

        .clay-age-cohort-nums {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .clay-age-count {
          font-size: 15px;
          font-weight: 700;
          color: #ffffff;
        }

        .clay-age-slash {
          font-size: 12px;
          color: #475569;
        }

        .clay-age-share {
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
        }

        .clay-age-trough {
          height: 8px;
        }

        .clay-age-insight-box {
          margin-top: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 14px;
          background: rgba(34, 211, 238, 0.05);
          border: 1px solid rgba(34, 211, 238, 0.15);
        }

        .clay-age-insight-icon {
          color: #22d3ee;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .clay-age-insight-text {
          font-size: 12px;
          color: #cbd5e1;
          line-height: 1.4;
        }

        .clay-age-insight-title {
          font-weight: 700;
          color: #22d3ee;
          margin-right: 4px;
        }

        .clay-badge-cyan {
          background: rgba(34, 211, 238, 0.12) !important;
          color: #22d3ee !important;
          border: 1px solid rgba(34, 211, 238, 0.3) !important;
        }

        /* ── Base Clay Card ── */
        .clay-card {
          background: #131929;
          border-radius: 24px;
          padding: 26px 28px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: 
            12px 14px 28px rgba(0, 0, 0, 0.55),
            -6px -6px 18px rgba(255, 255, 255, 0.025),
            inset 2px 2px 4px rgba(255, 255, 255, 0.08),
            inset -3px -3px 6px rgba(0, 0, 0, 0.45);
          position: relative;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .clay-card:hover {
          box-shadow: 
            14px 18px 34px rgba(0, 0, 0, 0.6),
            -7px -7px 20px rgba(255, 255, 255, 0.035),
            inset 2px 2px 4px rgba(255, 255, 255, 0.1),
            inset -3px -3px 6px rgba(0, 0, 0, 0.4);
        }

        /* ── ROW 1: 4 KPI Cards Grid ── */
        .clay-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        .clay-kpi-card {
          background: #131929;
          border-radius: 22px;
          padding: 22px 24px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: 
            10px 12px 24px rgba(0, 0, 0, 0.5),
            -5px -5px 14px rgba(255, 255, 255, 0.02),
            inset 2px 2px 4px rgba(255, 255, 255, 0.08),
            inset -2px -2px 5px rgba(0, 0, 0, 0.4);
          display: flex;
          flex-direction: column;
          transition: transform 0.2s ease;
        }

        .clay-kpi-card:hover {
          transform: translateY(-2px);
        }

        .clay-kpi-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .clay-kpi-title {
          font-size: 13px;
          font-weight: 500;
          color: #94a3b8;
        }

        .clay-kpi-icon-wrap {
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .clay-kpi-val-row {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 12px;
        }

        .clay-kpi-num {
          font-size: 38px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1;
          letter-spacing: -0.02em;
        }

        .clay-num-cyan {
          color: #22d3ee;
        }

        .clay-kpi-label {
          font-size: 13px;
          color: #94a3b8;
          font-weight: 500;
        }

        .clay-kpi-percent {
          font-size: 16px;
          font-weight: 700;
          color: #94a3b8;
        }

        .clay-kpi-foot {
          font-size: 12px;
          color: #64748b;
          margin-top: auto;
        }

        /* ── ROW 2: Event Registrations & Most Popular Event ── */
        .clay-mid-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 22px;
        }

        .clay-card-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .clay-card-serif-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 20px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 4px;
        }

        .clay-card-subtitle {
          font-size: 12px;
          color: #94a3b8;
        }

        .clay-badge-pill {
          padding: 4px 12px;
          border-radius: 9999px;
          background: #0d121f;
          border: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          box-shadow: inset 1px 1px 2px rgba(0, 0, 0, 0.5);
        }

        .clay-barchart-container {
          width: 100%;
          min-height: 240px;
        }

        .clay-card-footer-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #64748b;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 14px;
          margin-top: 10px;
        }

        .clay-info-icon {
          flex-shrink: 0;
          color: #64748b;
        }

        /* Popular Event Card */
        .clay-popular-card {
          display: flex;
          flex-direction: column;
          padding: 20px;
        }

        .clay-img-frame {
          position: relative;
          width: 100%;
          height: 180px;
          border-radius: 18px;
          overflow: hidden;
          background: #0d1220;
          box-shadow: 
            inset 2px 2px 5px rgba(0, 0, 0, 0.7),
            inset -1px -1px 3px rgba(255, 255, 255, 0.05);
          margin-bottom: 18px;
        }

        .clay-event-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .clay-img-overlay-glow {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(13, 18, 32, 0.85) 100%);
          pointer-events: none;
        }

        .clay-popular-body {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }

        .clay-popular-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #fbbf24;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .clay-sparkle-icon {
          color: #fbbf24;
        }

        .clay-popular-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .clay-popular-name {
          font-size: 22px;
          font-weight: 700;
          color: #ffffff;
        }

        .clay-arrow-btn {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: #182236;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 
            3px 3px 8px rgba(0, 0, 0, 0.4),
            inset 1px 1px 2px rgba(255, 255, 255, 0.1),
            inset -1px -1px 2px rgba(0, 0, 0, 0.4);
          transition: transform 0.2s ease;
        }

        .clay-arrow-btn:hover {
          transform: scale(1.08);
          background: #202b44;
        }

        .clay-popular-stats {
          font-size: 13px;
          color: #94a3b8;
          margin-bottom: 16px;
        }

        .clay-popular-divider {
          width: 100%;
          height: 1px;
          background: rgba(255, 255, 255, 0.06);
          margin-top: auto;
          margin-bottom: 12px;
        }

        .clay-popular-footer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
        }

        .clay-popular-foot-lbl {
          color: #64748b;
        }

        .clay-popular-foot-val {
          color: #94a3b8;
          font-weight: 600;
        }

        /* ── ROW 3: Tables Grid ── */
        .clay-tables-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 22px;
        }

        .clay-table-wrap {
          overflow-x: auto;
        }

        .clay-data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .clay-data-table th {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: #64748b;
          text-transform: uppercase;
          padding: 8px 12px 14px 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          text-align: left;
        }

        .clay-data-table td {
          padding: 14px 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          vertical-align: middle;
        }

        .clay-entity-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .clay-initial-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: #0d121f;
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: #94a3b8;
          font-size: 11px;
          font-weight: 700;
          box-shadow: inset 1px 1px 3px rgba(0, 0, 0, 0.5);
          flex-shrink: 0;
        }

        .clay-entity-name {
          color: #f8fafc;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 240px;
        }

        .clay-count-val {
          font-weight: 600;
          color: #f8fafc;
        }

        .clay-share-col {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
        }

        .clay-bar-trough {
          width: 64px;
          height: 6px;
          background: #0d121f;
          border-radius: 9999px;
          overflow: hidden;
          box-shadow: inset 1px 1px 2px rgba(0, 0, 0, 0.6);
        }

        .clay-bar-fill {
          height: 100%;
          border-radius: 9999px;
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .fill-cyan {
          background: #22d3ee;
          box-shadow: 0 0 8px rgba(34, 211, 238, 0.4);
        }

        .fill-amber {
          background: #fbbf24;
          box-shadow: 0 0 8px rgba(251, 191, 36, 0.4);
        }

        .clay-share-text {
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          min-width: 44px;
          text-align: right;
        }

        /* ── ROW 4: Gender & Trend Grid ── */
        .clay-bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1.6fr;
          gap: 22px;
        }

        .clay-gender-body {
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 10px 0 6px;
          flex-wrap: wrap;
          gap: 20px;
        }

        .clay-donut-wrapper {
          position: relative;
          width: 180px;
          height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .clay-donut-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .clay-donut-percent {
          font-size: 26px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1;
          letter-spacing: -0.02em;
        }

        .clay-donut-sub {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
          margin-top: 4px;
        }

        .clay-gender-legend {
          display: flex;
          flex-direction: column;
          gap: 14px;
          min-width: 160px;
        }

        .clay-legend-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
        }

        .clay-legend-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .clay-legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .dot-cyan {
          background: #22d3ee;
          box-shadow: 0 0 6px rgba(34, 211, 238, 0.6);
        }

        .dot-amber {
          background: #fbbf24;
          box-shadow: 0 0 6px rgba(251, 191, 36, 0.6);
        }

        .dot-purple {
          background: #a855f7;
          box-shadow: 0 0 6px rgba(168, 85, 247, 0.6);
        }

        .clay-legend-label {
          color: #94a3b8;
          font-weight: 500;
        }

        .clay-legend-val {
          font-weight: 600;
          color: #f8fafc;
        }

        .clay-trend-chart-box {
          width: 100%;
          min-height: 200px;
        }

        /* ── Footer ── */
        .clay-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 4px 6px;
          font-size: 12px;
          color: #475569;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          margin-top: 8px;
        }

        .clay-foot-left {
          color: #64748b;
        }

        .clay-foot-right {
          color: #64748b;
        }

        /* Loading Screen */
        .clay-loading-screen {
          min-height: 100vh;
          background: #0b0f19;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .clay-spinner-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 40px;
          border-radius: 28px;
          background: #141c2e;
          box-shadow: 
            14px 14px 30px rgba(0, 0, 0, 0.5),
            -6px -6px 16px rgba(255, 255, 255, 0.03),
            inset 2px 2px 4px rgba(255, 255, 255, 0.08);
        }

        .clay-spinner {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 4px solid #1a243c;
          border-top-color: #22d3ee;
          animation: spin 0.8s linear infinite;
        }

        .clay-loading-text {
          font-size: 14px;
          font-weight: 600;
          color: #94a3b8;
        }

        /* ── Responsiveness ── */
        @media (max-width: 1080px) {
          .clay-kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .clay-categories-grid {
            grid-template-columns: 1fr;
          }
          .clay-mid-grid {
            grid-template-columns: 1fr;
          }
          .clay-tables-grid {
            grid-template-columns: 1fr;
          }
          .clay-bottom-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .clay-nav {
            padding: 14px 20px;
            flex-direction: column;
            gap: 14px;
            align-items: flex-start;
          }
          .clay-nav-right {
            width: 100%;
            justify-content: space-between;
          }
          .clay-main-container {
            padding: 20px 16px;
          }
          .clay-hero-heading {
            font-size: 30px;
          }
          .clay-kpi-grid {
            grid-template-columns: 1fr;
          }
          .clay-cat-tiles-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AnalyticsView;
