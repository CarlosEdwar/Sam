'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  History as HistoryIcon,
  Search,
  Filter,
  Calendar,
  Download,
  AlertCircle,
  Printer,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  LucideIcon
} from 'lucide-react';
import { fetchPrintJobs, createPrintJob } from '@/lib/services/print-service';

// ───────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface HistoryItem {
  id: string;
  jobId: string;
  timestamp: string;
  productName: string;
  sku: string;
  quantity: number;
  status: 'success' | 'failed' | 'pending';
  operator: string;
  printer: string;
  method: string;
}

interface StatusConfig {
  icon: LucideIcon;
  label: string;
  bg: string;
  text: string;
  border: string;
}

// ───────────────────────────────────────────────
// Constants
// ───────────────────────────────────────────────

const STATUS_CONFIG: Record<HistoryItem['status'], StatusConfig> = {
  success: {
    icon: CheckCircle2,
    label: 'Concluído',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  failed: {
    icon: XCircle,
    label: 'Falhou',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  pending: {
    icon: Clock,
    label: 'Pendente',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
};

// MOCK_HISTORY removed, now fetched from backend

const ITEMS_PER_PAGE = 10;

// ───────────────────────────────────────────────
// Sub-components
// ───────────────────────────────────────────────

function StatusBadge({ status }: { status: HistoryItem['status'] }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
      <Icon size={14} />
      {config.label}
    </span>
  );
}

function EmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <div className="py-16 text-center">
      <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <HistoryIcon size={24} className="text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">
        Nenhum registro encontrado
      </h3>
      <p className="text-sm text-slate-500 mb-4 max-w-sm mx-auto">
        As operações de impressão aparecerão aqui automaticamente após o envio.
      </p>
      <button
        onClick={onClearFilters}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        <Filter size={16} />
        Limpar filtros
      </button>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  const getVisiblePages = () => {
    const delta = 1;
    const range: (number | string)[] = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) range.unshift('...');
    if (currentPage + delta < totalPages - 1) range.push('...');

    if (totalPages > 1) {
      range.unshift(1);
      if (totalPages > 1) range.push(totalPages);
    }

    return range;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
      <p className="text-sm text-slate-500">
        Mostrando <span className="font-medium text-slate-900">{startItem}</span> a{' '}
        <span className="font-medium text-slate-900">{endItem}</span> de{' '}
        <span className="font-medium text-slate-900">{totalItems}</span> registros
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Página anterior"
        >
          <ChevronLeft size={18} />
        </button>

        {getVisiblePages().map((page, i) => (
          page === '...' ? (
            <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-sm text-slate-400">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              aria-current={currentPage === page ? "page" : undefined}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                currentPage === page
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white hover:shadow-sm'
              }`}
            >
              {page}
            </button>
          )
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Próxima página"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'Agora';
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays === 1) return 'Ontem';
  return `${diffDays} dias atrás`;
}

// ───────────────────────────────────────────────
// Main Page
// ───────────────────────────────────────────────

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [reprintingId, setReprintingId] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchPrintJobs();
      const mappedHistory: HistoryItem[] = data.map((job: any) => ({
        id: String(job.id),
        jobId: job.jobId,
        timestamp: job.created_at,
        productName: job.productName,
        sku: job.sku,
        quantity: job.quantity,
        status: job.status,
        operator: job.operator,
        printer: job.printer,
        method: job.method,
      }));
      setHistory(mappedHistory);
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // ── Reimprimir ─────────────────────────────────────────────────────────
  const handleReprint = useCallback(async (item: HistoryItem) => {
    if (reprintingId) return;
    setReprintingId(item.id);
    try {
      await createPrintJob({
        jobId: `${item.jobId}-R${Date.now().toString(36).toUpperCase()}`,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        status: 'pending',
        operator: item.operator,
        printer: item.printer,
        method: item.method,
      });
      // Refresh the list to include the new job
      await fetchHistory();
    } catch (err) {
      console.error('Erro ao reimprimir:', err);
    } finally {
      setReprintingId(null);
    }
  }, [reprintingId, fetchHistory]);

  const filteredHistory = useMemo(() => {
    let filtered = [...history];

    // Filtro de busca
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(item =>
        item.jobId.toLowerCase().includes(q) ||
        item.productName.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.operator.toLowerCase().includes(q)
      );
    }

    // Filtro de data
    const now = new Date();
    switch (dateFilter) {
      case 'today': {
        const today = now.toDateString();
        filtered = filtered.filter(item => new Date(item.timestamp).toDateString() === today);
        break;
      }
      case 'week': {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(item => new Date(item.timestamp) >= weekAgo);
        break;
      }
      case 'month': {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(item => new Date(item.timestamp) >= monthAgo);
        break;
      }
    }

    // Ordenar por data decrescente
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [history, search, dateFilter]);

  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);

  const paginatedData = useMemo(() => {
    return filteredHistory.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredHistory, currentPage]);

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setDateFilter('all');
    setCurrentPage(1);
  }, []);

  const handleExport = useCallback(() => {
    // TODO: Implementar exportação CSV/Excel
    const csv = [
      ['Job ID', 'Data/Hora', 'Produto', 'SKU', 'Qtd', 'Status', 'Operador', 'Impressora', 'Método'],
      ...filteredHistory.map(item => [
        item.jobId,
        formatDateTime(item.timestamp),
        item.productName,
        item.sku,
        item.quantity,
        item.status,
        item.operator,
        item.printer,
        item.method,
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historico-impressao-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }, [filteredHistory]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            Histórico de Operações
          </h1>
          <p className="text-sm text-slate-500">
            Rastreabilidade completa das impressões realizadas.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Printer size={16} className="text-slate-400" />
          <span>{history.length} jobs no total</span>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center gap-4 bg-slate-50/50">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por job ID, produto ou operador..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value as typeof dateFilter);
                setCurrentPage(1);
              }}
              aria-label="Filtrar por data"
              className="px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <option value="all">Todo período</option>
              <option value="today">Hoje</option>
              <option value="week">Últimos 7 dias</option>
              <option value="month">Últimos 30 dias</option>
            </select>

            <button
              onClick={handleExport}
              aria-label="Exportar CSV"
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <Download size={16} />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Loader2 size={24} className="text-slate-400 animate-spin mb-3" />
            <p className="text-sm text-slate-500">Carregando histórico...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <EmptyState onClearFilters={handleClearFilters} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th scope="col" className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Job ID
                    </th>
                    <th scope="col" className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Data/Hora
                    </th>
                    <th scope="col" className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Produto
                    </th>
                    <th scope="col" className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                      Qtd
                    </th>
                    <th scope="col" className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Impressora
                    </th>
                    <th scope="col" className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedData.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-sm font-semibold text-slate-900">
                            {item.jobId}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatRelativeTime(item.timestamp)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-slate-700">
                          {formatDateTime(item.timestamp)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-900">
                            {item.productName}
                          </span>
                          <span className="text-xs text-slate-500">
                            {item.sku}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm font-semibold text-slate-900">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-700">
                            {item.printer}
                          </span>
                          <span className="text-xs text-slate-400">
                            {item.method}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                          <button
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={reprintingId === item.id}
                            onClick={() => handleReprint(item)}
                          >
                            {reprintingId === item.id ? (
                              <><Loader2 size={13} className="animate-spin" /> Enviando...</>
                            ) : (
                              'Reimprimir'
                            )}
                          </button>
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredHistory.length}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </div>
  );
}