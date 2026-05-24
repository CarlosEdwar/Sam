'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
  BarChart3, 
  Clock, 
  Printer, 
  Zap, 
  Package, 
  FileText, 
  Plus,
  ArrowUpRight,
  History,
  LucideIcon,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Calendar,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { fetchPrintJobs, PrintJob, API_URL } from '@/lib/api';

// ───────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────

interface StatItem {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  status: 'neutral' | 'warning' | 'success' | 'info';
}

interface QuickAction {
  label: string;
  href?: string;
  icon: LucideIcon;
  variant: 'primary' | 'secondary' | 'disabled';
  description?: string;
}

// ───────────────────────────────────────────────
// Constants & Helpers
// ───────────────────────────────────────────────

const STATUS_STYLES = {
  neutral:  { text: 'text-slate-600',  bg: 'bg-slate-100',  border: 'border-slate-200' },
  warning:  { text: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-200' },
  success:  { text: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
  info:     { text: 'text-violet-600',  bg: 'bg-violet-50',   border: 'border-violet-200' },
} as const;

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMin < 1) return 'Agora mesmo';
  if (diffMin < 60) return `${diffMin}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays === 1) return 'Ontem';
  return `${diffDays} dias atrás`;
}

// ───────────────────────────────────────────────
// Sub-components
// ───────────────────────────────────────────────

function StatCard({ stat }: { stat: StatItem }) {
  const style = STATUS_STYLES[stat.status];
  const Icon = stat.icon;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <div className={`inline-flex p-2.5 rounded-lg ${style.bg} ${style.text}`}>
            <Icon size={20} aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">
              {stat.title}
            </p>
            <p className="text-2xl font-bold text-slate-900">
              {stat.value}
            </p>
            {stat.trend && (
              <p className="text-xs font-medium text-slate-400 mt-1">
                {stat.trend}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityRow({ job }: { job: PrintJob }) {
  const isSuccess = job.status === 'success';
  const isPending = job.status === 'pending';

  return (
    <div className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        isSuccess ? 'bg-emerald-50 text-emerald-600' :
        isPending ? 'bg-amber-50 text-amber-600' :
        'bg-red-50 text-red-600'
      }`}>
        {isSuccess ? <CheckCircle2 size={16} /> : isPending ? <Clock size={16} /> : <XCircle size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">
          {job.productName}
        </p>
        <p className="text-xs text-slate-400 truncate">
          {job.sku} · {job.printer} · {job.quantity} unidade(s)
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-medium text-slate-500">
          {formatRelativeTime(job.created_at)}
        </p>
        <p className={`text-xs font-semibold mt-0.5 ${
          isSuccess ? 'text-emerald-600' : isPending ? 'text-amber-600' : 'text-red-600'
        }`}>
          {isSuccess ? 'Concluído' : isPending ? 'Pendente' : 'Falhou'}
        </p>
      </div>
    </div>
  );
}

function EmptyActivity() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
        <History size={24} aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">
        Nenhuma Atividade Recente
      </h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">
        As impressões realizadas aparecerão aqui para acompanhamento em tempo real.
      </p>
      <Link
        href="/dashboard/print"
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus size={16} />
        Realizar primeira impressão
      </Link>
    </div>
  );
}

function QuickActionCard({ action }: { action: QuickAction }) {
  const Icon = action.icon;

  const variants = {
    primary: {
      card: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200',
      icon: 'text-white',
      arrow: 'text-blue-200 group-hover:text-white',
    },
    secondary: {
      card: 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50',
      icon: 'text-slate-500',
      arrow: 'text-slate-300 group-hover:text-slate-500',
    },
    disabled: {
      card: 'bg-slate-100 text-slate-400 cursor-not-allowed',
      icon: 'text-slate-400',
      arrow: 'text-slate-300',
    },
  } as const;

  const v = variants[action.variant];

  const content = (
    <div className={`
      flex items-center justify-between p-5 rounded-xl font-medium text-sm
      transition-all duration-200 group ${v.card}
      ${action.variant !== 'disabled' ? 'hover:-translate-y-0.5' : ''}
    `}>
      <div className="flex items-center gap-3">
        <Icon size={18} className={v.icon} aria-hidden="true" />
        <span>{action.label}</span>
      </div>
      {action.variant !== 'disabled' && (
        <ArrowUpRight 
          size={16} 
          className={`transition-opacity ${action.variant === 'secondary' ? 'opacity-0 group-hover:opacity-100' : 'opacity-60 group-hover:opacity-100'} ${v.arrow}`} 
        />
      )}
    </div>
  );

  if (action.variant === 'disabled') {
    return (
      <div className="relative">
        {content}
        {action.description && (
          <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-slate-200 text-slate-600 text-[10px] font-semibold rounded-full uppercase tracking-wide">
            Em breve
          </span>
        )}
      </div>
    );
  }

  return (
    <Link href={action.href!} className="block">
      {content}
    </Link>
  );
}

function HelpCard() {
  return (
    <div className="p-6 bg-slate-900 rounded-xl text-white space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
          <FileText size={18} className="text-blue-400" aria-hidden="true" />
        </div>
        <span className="font-semibold text-sm">Manual de Início</span>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">
        Comece importando seu arquivo Excel no menu de Etiquetas ou realize uma impressão avulsa no menu lateral.
      </p>
    </div>
  );
}

// ───────────────────────────────────────────────
// Main Page
// ───────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useUser();

  const [statsData, setStatsData] = useState({
    totalImpressions: 0,
    pendingLabels: 0,
    activePrinters: '-',
    performance: '-',
  });

  const [recentJobs, setRecentJobs] = useState<PrintJob[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);

  // ── Fetch dashboard stats ─────────────────────────────────────────────
  useEffect(() => {
    async function fetchStats() {
      if (!user) return;
      try {
        const res = await fetch(`${API_URL}/dashboard/stats`, {
          headers: {
            'X-Clerk-User-Id': user.id,
            Accept: 'application/json',
          },
        });
        if (res.ok) {
          const data = await res.json();
          setStatsData(data);
        }
      } catch (err) {
        console.error('Erro ao buscar stats:', err);
      }
    }
    fetchStats();
  }, [user]);

  // ── Fetch recent print jobs ───────────────────────────────────────────
  const loadJobs = useCallback(async () => {
    if (!user) return;
    setIsLoadingJobs(true);
    try {
      const jobs = await fetchPrintJobs(user.id);
      // Show only the 5 most recent
      setRecentJobs(
        [...jobs]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
      );
    } catch (err) {
      console.error('Erro ao buscar jobs recentes:', err);
    } finally {
      setIsLoadingJobs(false);
    }
  }, [user]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const stats = useMemo<StatItem[]>(() => [
    { title: 'Total de Impressões', value: String(statsData.totalImpressions), icon: BarChart3, status: 'info', trend: 'Este mês' },
    { title: 'Etiquetas Pendentes', value: String(statsData.pendingLabels), icon: Clock, status: 'warning' },
    { title: 'Impressoras Ativas', value: statsData.activePrinters, icon: Printer, status: 'success', trend: 'Online' },
    { title: 'Performance', value: statsData.performance, icon: Zap, status: 'neutral' },
  ], [statsData]);

  const quickActions = useMemo<QuickAction[]>(() => [
    { label: 'Nova Impressão', href: '/dashboard/print', icon: Plus, variant: 'primary' },
    { label: 'Gerenciar Etiquetas', href: '/dashboard/etiquetas', icon: Package, variant: 'secondary' },
    { label: 'Gerenciar Escalas', href: '/dashboard/escalas', icon: Calendar, variant: 'secondary' },
    { label: 'Colaboradores', href: '/dashboard/employees', icon: Users, variant: 'secondary' },
    { label: 'Configurar Turnos', href: '/dashboard/shifts', icon: Clock, variant: 'secondary' },
    { label: 'Modelos', icon: FileText, variant: 'disabled', description: 'Em breve' },
  ], []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          Painel de Controle
        </h1>
        <p className="text-sm text-slate-500">
          Acompanhe suas operações de impressão em tempo real.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} stat={stat} />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Section */}
        <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm min-h-[400px]">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Atividade Recente
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={loadJobs}
                disabled={isLoadingJobs}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-40"
                aria-label="Atualizar"
              >
                <RefreshCw size={15} className={isLoadingJobs ? 'animate-spin' : ''} />
              </button>
              <Link 
                href="/dashboard/history" 
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Ver histórico
              </Link>
            </div>
          </div>

          {isLoadingJobs ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={24} className="text-slate-400 animate-spin" />
              <p className="text-sm text-slate-500">Carregando atividade...</p>
            </div>
          ) : recentJobs.length === 0 ? (
            <EmptyActivity />
          ) : (
            <div className="divide-y divide-slate-100">
              {recentJobs.map((job) => (
                <ActivityRow key={job.id} job={job} />
              ))}
              <div className="px-6 py-3">
                <Link
                  href="/dashboard/history"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Ver todas as {statsData.totalImpressions} impressões →
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="space-y-6">
          <h2 className="text-base font-semibold text-slate-900">
            Ações Rápidas
          </h2>
          
          <div className="space-y-3">
            {quickActions.map((action) => (
              <QuickActionCard key={action.label} action={action} />
            ))}
          </div>

          <HelpCard />
        </section>
      </div>
    </div>
  );
}