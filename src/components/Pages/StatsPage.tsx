import { useEffect, useState } from 'react';
import {
  ChartBarIcon,
  UserGroupIcon,
  EnvelopeIcon,
  SparklesIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

type Stats = {
  siteInfo?: { name?: string; description?: string; version?: string };
  counts?: {
    totalUsers?: number;
    uniqueEmails?: number;
    activeUsers?: number;
    premiumUsers?: number;
    subscriptionsActive?: number;
    roles?: Array<{ role: string; count: number }>;
    firstSignupAt?: string | null;
    lastSignupAt?: string | null;
  };
  timestamp?: string;
};

const StatsPage = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await fetch(import.meta.env.PROD
          ? "https://queen-de-q-platform-backend.vercel.app/api/stats"
          : "/api/stats");
        if (!res.ok) throw new Error("Failed to load stats");
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Unknown error");
        setStats(json);
      } catch (err: any) {
        setError(err.message || "Error");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-6">Loading statistics…</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  const fmt = (n?: number) => (n ?? 0).toLocaleString();
  const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleString() : "—";

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-serif text-royal-pearl">
            Statistiques du site
          </h2>
          <p className="text-sm text-royal-champagne mt-1">
            {stats?.siteInfo?.name} — {stats?.siteInfo?.description}
          </p>
        </div>
        <div className="text-right text-xs text-royal-champagne">
          <div>Version {stats?.siteInfo?.version}</div>
          <div className="mt-1">
            Mis à jour:{" "}
            {stats?.timestamp
              ? new Date(stats.timestamp).toLocaleString()
              : "—"}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-royal-purple/60 border border-royal-gold/10 rounded-lg flex items-center gap-4">
          <div className="p-3 rounded-md bg-royal-gold/10 text-royal-gold">
            <UserGroupIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-royal-champagne">Utilisateurs</div>
            <div className="text-xl font-semibold text-royal-pearl">
              {fmt(stats?.counts?.totalUsers)}
            </div>
          </div>
        </div>

        <div className="p-4 bg-royal-purple/60 border border-royal-gold/10 rounded-lg flex items-center gap-4">
          <div className="p-3 rounded-md bg-royal-gold/10 text-royal-gold">
            <EnvelopeIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-royal-champagne">Emails uniques</div>
            <div className="text-xl font-semibold text-royal-pearl">
              {fmt(stats?.counts?.uniqueEmails ?? stats?.counts?.totalUsers)}
            </div>
          </div>
        </div>

        <div className="p-4 bg-royal-purple/60 border border-royal-gold/10 rounded-lg flex items-center gap-4">
          <div className="p-3 rounded-md bg-royal-gold/10 text-royal-gold">
            <SparklesIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-royal-champagne">Premium</div>
            <div className="text-xl font-semibold text-royal-pearl">
              {fmt(stats?.counts?.premiumUsers)}
            </div>
          </div>
        </div>

        <div className="p-4 bg-royal-purple/60 border border-royal-gold/10 rounded-lg flex items-center gap-4">
          <div className="p-3 rounded-md bg-royal-gold/10 text-royal-gold">
            <ChartBarIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-royal-champagne">
              Abonnements actifs
            </div>
            <div className="text-xl font-semibold text-royal-pearl">
              {fmt(stats?.counts?.subscriptionsActive)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 p-4 bg-royal-purple/50 border border-royal-gold/10 rounded-lg">
          <h3 className="font-medium text-royal-pearl mb-3">
            Répartition des rôles
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats?.counts?.roles?.filter(r => r.role !== 'admin').length ? (
              stats.counts.roles.filter(r => r.role !== 'admin').map((r) => (
                <div
                  key={r.role}
                  className="px-3 py-1 rounded-full bg-royal-gold/10 text-royal-champagne text-sm"
                >
                  {r.role} — {r.count}
                </div>
              ))
            ) : (
              <div className="text-sm text-royal-champagne">
                Aucune donnée de rôle
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-royal-purple/50 border border-royal-gold/10 rounded-lg">
          <h3 className="font-medium text-royal-pearl mb-3">Signups</h3>
          <div className="text-sm text-royal-champagne space-y-2">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-royal-gold" />{" "}
              <span>
                Premier signup: {fmtDate(stats?.counts?.firstSignupAt)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-royal-gold" />{" "}
              <span>
                Dernier signup: {fmtDate(stats?.counts?.lastSignupAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
