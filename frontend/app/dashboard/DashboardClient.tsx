'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import type { ApiApplication, UsageStats } from '@/lib/api';

type Filter = 'all' | 'matched' | 'ready' | 'applied' | 'failed';

const STATUS_ORDER = ['FOUND', 'MATCHED', 'TAILORED', 'READY', 'APPLYING', 'APPLIED', 'RETRYING', 'FAILED'];

function statusBadge(status: string) {
  return <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>;
}

function scoreRing(score: number | null) {
  if (score === null) return null;
  const cls = score >= 80 ? 'score-high' : score >= 60 ? 'score-mid' : 'score-low';
  return <div className={`score-ring ${cls}`}>{Math.round(score)}</div>;
}

function UsageMeter({ usage }: { usage: UsageStats }) {
  const pct = Math.min(100, (usage.used / usage.limit) * 100);
  const isFull = usage.used >= usage.limit;
  return (
    <div className="card-sm" style={{ minWidth: 220 }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted">Daily Applications</span>
        <span className={`badge ${isFull ? 'badge-failed' : 'badge-matched'}`}>{usage.plan}</span>
      </div>
      <div className="usage-bar-track">
        <div
          className={`usage-bar-fill ${isFull ? 'full' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted mt-1">
        <span>{usage.used} used</span>
        <span>{usage.remaining} left today</span>
      </div>
    </div>
  );
}

interface Props {
  applications: ApiApplication[];
  usage: UsageStats;
  userName: string;
  plan: string;
  hasResume: boolean;
  hasSearchProfile: boolean;
}

export default function DashboardClient({ applications, usage, userName, hasResume, hasSearchProfile }: Props) {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id as string | undefined;
  const [filter, setFilter] = useState<Filter>('all');
  const [approving, setApproving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'ok' | 'err' } | null>(null);
  const [searching, setSearching] = useState(false);

  const canSearch = hasResume && hasSearchProfile;

  const filtered = applications.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'matched') return ['MATCHED', 'TAILORED'].includes(a.status);
    if (filter === 'ready') return a.status === 'READY';
    if (filter === 'applied') return a.status === 'APPLIED';
    if (filter === 'failed') return a.status === 'FAILED';
    return true;
  });

  // Stat counts
  const counts = {
    matched: applications.filter(a => ['MATCHED', 'TAILORED'].includes(a.status)).length,
    ready: applications.filter(a => a.status === 'READY').length,
    applied: applications.filter(a => a.status === 'APPLIED').length,
    linkedin: applications.filter(a => a.status === 'READY' && a.job.isLinkedIn).length,
  };

  async function handleStartSearch() {
    if (!userId || !canSearch) return;
    setSearching(true);
    setMessage(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_AUTOMATION_API ?? 'http://localhost:3001'}/api/me/search/start`,
        { method: 'POST', headers: { 'X-User-Id': userId } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ text: `✓ ${data.message}`, type: 'ok' });
    } catch (err: any) {
      setMessage({ text: err.message, type: 'err' });
    } finally {
      setSearching(false);
    }
  }

  async function handleApprove(app: ApiApplication) {
    if (!userId) return;
    setApproving(app.job.id);
    setMessage(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_AUTOMATION_API ?? 'http://localhost:3001'}/api/me/applications/approve/${app.job.id}`,
        { method: 'POST', headers: { 'X-User-Id': userId } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.queued) {
        setMessage({ text: `✓ ${app.job.title} queued for auto-apply.`, type: 'ok' });
      } else {
        setMessage({
          text: `LinkedIn job: please submit manually at ${app.job.url}`,
          type: 'ok',
        });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: 'err' });
    } finally {
      setApproving(null);
    }
  }

  return (
    <div className="page">
      {/* Navigation */}
      <nav className="nav">
        <div className="container nav-inner">
          <Link href="/dashboard" className="nav-brand">
            🤖 AI Job <span>Agent</span>
          </Link>
          <div className="nav-links">
            <Link href="/dashboard" className="nav-link active">Dashboard</Link>
            <Link href="/onboarding" className="nav-link">Onboarding</Link>
            <Link href="/settings" className="nav-link">Settings</Link>
          </div>
          <div className="nav-actions">
            <UsageMeter usage={usage} />
            <button className="btn btn-ghost btn-sm" onClick={() => signOut({ callbackUrl: '/login' })}>
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="container" style={{ paddingBottom: 60, flex: 1 }}>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="page-title">Good {getTimeGreeting()}, {userName.split(' ')[0]} 👋</h1>
            <p className="page-subtitle">Here&apos;s the status of your application pipeline.</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <button
              id="start-search-btn"
              className="btn btn-primary btn-lg"
              onClick={handleStartSearch}
              disabled={!canSearch || searching}
              title={!canSearch ? 'Upload a resume and set a search profile first.' : undefined}
            >
              {searching ? 'Starting search…' : '🔍 Start Job Search'}
            </button>
            {!canSearch && (
              <p className="text-sm text-muted" style={{ marginTop: 6 }}>
                {!hasResume && !hasSearchProfile
                  ? <>Upload a resume and set your search profile in <Link href="/onboarding">Onboarding</Link> to enable this.</>
                  : !hasResume
                  ? <>Upload a resume in <Link href="/onboarding">Onboarding</Link> to enable this.</>
                  : <>Add at least one job title in <Link href="/settings">Settings</Link> to enable this.</>}
              </p>
            )}
          </div>
        </div>

        {/* Stat grid */}
        <div className="stat-grid">
          <div className="stat-card accent">
            <div className="stat-label">Total Tracked</div>
            <div className="stat-value">{applications.length}</div>
          </div>
          <div className="stat-card green">
            <div className="stat-label">Matched</div>
            <div className="stat-value">{counts.matched}</div>
          </div>
          <div className="stat-card yellow">
            <div className="stat-label">Ready to Apply</div>
            <div className="stat-value">{counts.ready}</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-label">Applied</div>
            <div className="stat-value">{counts.applied}</div>
          </div>
        </div>

        {/* LinkedIn notice */}
        {counts.linkedin > 0 && (
          <div style={{
            background: 'rgba(246,224,94,0.08)', border: '1px solid rgba(246,224,94,0.25)',
            borderRadius: 'var(--radius)', padding: '14px 20px', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <strong style={{ color: 'var(--yellow)' }}>{counts.linkedin} LinkedIn job{counts.linkedin !== 1 ? 's' : ''} require manual submission.</strong>
              <span className="text-muted" style={{ marginLeft: 8, fontSize: 13 }}>
                Auto-submit is disabled for LinkedIn. Use the &ldquo;Review & Submit&rdquo; button below.
              </span>
            </div>
          </div>
        )}

        {message && (
          <div style={{
            background: message.type === 'ok' ? 'var(--green-glow)' : 'var(--red-glow)',
            border: `1px solid ${message.type === 'ok' ? 'rgba(104,211,145,0.3)' : 'rgba(252,129,129,0.3)'}`,
            borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 20,
            fontSize: 14, color: message.type === 'ok' ? 'var(--green)' : 'var(--red)',
          }}>
            {message.text}
          </div>
        )}

        {/* Filter tabs */}
        <div className="filter-tabs">
          {(['all', 'matched', 'ready', 'applied', 'failed'] as Filter[]).map(f => (
            <button
              key={f}
              id={`filter-${f}`}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && (
                <span style={{ marginLeft: 6, opacity: 0.6 }}>
                  ({f === 'matched' ? counts.matched : f === 'ready' ? counts.ready : f === 'applied' ? counts.applied : applications.filter(a => a.status === 'FAILED').length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Job list */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🔍</span>
            <h3>No applications in this category</h3>
            <p>Jobs appear here as they progress through the pipeline.</p>
          </div>
        ) : (
          <div className="job-list">
            {filtered.map(app => (
              <div key={app.id} className={`job-card fade-in ${app.job.isLinkedIn && app.status === 'READY' ? 'linkedin-card' : ''}`}>
                <div className="job-info">
                  <div className="job-title">{app.job.title}</div>
                  <div className="job-meta">
                    <span>{app.job.company.name}</span>
                    {app.job.location && <span>📍 {app.job.location}</span>}
                    {app.job.salary && <span>💰 {app.job.salary}</span>}
                    {app.job.isLinkedIn && (
                      <span style={{ color: 'var(--yellow)', fontWeight: 600 }}>LinkedIn</span>
                    )}
                  </div>
                  {app.job.fitExplanation && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, maxWidth: 600 }}>
                      {app.job.fitExplanation.slice(0, 120)}{app.job.fitExplanation.length > 120 ? '…' : ''}
                    </p>
                  )}
                </div>

                <div className="job-score">
                  {scoreRing(app.job.score)}
                </div>

                {statusBadge(app.status)}

                {/* Action buttons for READY status */}
                {app.status === 'READY' && (
                  app.job.isLinkedIn ? (
                    <a
                      href={app.job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      id={`linkedin-submit-${app.job.id}`}
                      className="btn btn-linkedin btn-sm"
                    >
                      Review &amp; Submit →
                    </a>
                  ) : (
                    <button
                      id={`approve-${app.job.id}`}
                      className="btn btn-primary btn-sm"
                      disabled={approving === app.job.id}
                      onClick={() => handleApprove(app)}
                    >
                      {approving === app.job.id ? '…' : 'Auto Apply'}
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
