'use client';

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  Tag, 
  Search, 
  Filter, 
  Plus, 
  FileUp, 
  Download, 
  MoreVertical, 
  Printer, 
  Check, 
  AlertCircle,
  X,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Save
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import * as XLSX from 'xlsx';
import { apiFetch, API_URL } from '@/lib/api';

// ───────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────

interface Label {
  id: string;
  codigo: string;
  produto: string;
  fornecedor: string | null;
  lote: string | null;
  data_manipulacao: string | null;
  validade_dias: number;
  validade_horas: number;
  armazenamento: string | null;
  descongelado_dias: number;
  sif: string | null;
  rastreabilidade: string | null;
  empresa: string | null;
  observacao: string | null;
  status: 'pendente' | 'impressa';
}

// ───────────────────────────────────────────────
// Status Badge Component
// ───────────────────────────────────────────────

function StatusBadge({ status }: { status: Label['status'] }) {
  const config = {
    pendente: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
      label: 'Pendente',
    },
    impressa: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Impressa',
    },
  };

  const c = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

// ───────────────────────────────────────────────
// Pagination Component
// ───────────────────────────────────────────────

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

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
          className="p-2 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
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
          className="p-2 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Próxima página"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────
// Excel Import Logic
// ───────────────────────────────────────────────

function parseExcelFile(file: File): Promise<Partial<Label>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' }) as Record<string, string | number | undefined>[];

        const getVal = (item: Record<string, string | number | undefined>, keys: string[], fallback = ''): string => {
          const normalized: Record<string, string | number | undefined> = {};
          Object.keys(item).forEach(k => {
            normalized[k.trim().toLowerCase()] = item[k];
          });
          for (const k of keys) {
            const val = normalized[k.toLowerCase().trim()];
            if (val !== undefined && val !== null && val !== '') return String(val);
          }
          return fallback;
        };

        const parsed = data.map((item, index) => ({
          codigo: getVal(item, ['codigo', 'id', 'referência', 'referencia']),
          produto: getVal(item, ['produto', 'nome', 'descrição', 'descricao'], 'Produto Sem Nome'),
          fornecedor: getVal(item, ['fornecedor']),
          lote: getVal(item, ['lote']),
          data_manipulacao: getVal(item, ['data manipulação', 'data manipulacao', 'data']),
          validade_dias: parseInt(getVal(item, ['validade dias', 'validade_dias'], '0'), 10),
          validade_horas: parseInt(getVal(item, ['validade horas', 'validade_horas'], '0'), 10),
          armazenamento: getVal(item, ['armazenamento']),
          descongelado_dias: parseInt(getVal(item, ['descongelado dias', 'descongelado_dias'], '0'), 10),
          sif: getVal(item, ['sif']),
          rastreabilidade: getVal(item, ['rastreabilidade']),
          empresa: getVal(item, ['empresa']),
          observacao: getVal(item, ['observação', 'observacao', 'obs']),
          status: 'pendente' as const,
        }));

        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}

// ───────────────────────────────────────────────
// Main Page
// ───────────────────────────────────────────────

export default function EtiquetasPage() {
  const { user } = useUser();
  const [etiquetas, setEtiquetas] = useState<Label[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // New Label State
  const [newLabel, setNewLabel] = useState<Partial<Label>>({
    produto: '',
    codigo: '',
    fornecedor: '',
    lote: '',
    validade_dias: 0,
    validade_horas: 0,
    empresa: '',
    sif: '',
    status: 'pendente'
  });

  const fetchEtiquetas = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Label[]>('/labels', user.id);
      setEtiquetas(Array.isArray(data) ? data : (data as any).data || []);
    } catch (err) {
      console.error('Erro ao buscar etiquetas:', err);
      setError('Falha ao conectar.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEtiquetas();
  }, [fetchEtiquetas]);

  const filtered = useMemo(() => {
    if (!search.trim()) return etiquetas;
    const q = search.toLowerCase();
    return etiquetas.filter((etq) =>
      etq.produto.toLowerCase().includes(q) ||
      etq.id.toLowerCase().includes(q) ||
      (etq.fornecedor?.toLowerCase().includes(q) ?? false) ||
      (etq.lote?.toLowerCase().includes(q) ?? false) ||
      (etq.empresa?.toLowerCase().includes(q) ?? false)
    );
  }, [etiquetas, search]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = useMemo(() => filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filtered, currentPage]);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsImporting(true);
    try {
      const labels = await parseExcelFile(file);
      const res = await apiFetch<any>('/labels/import', user.id, {
        method: 'POST',
        json: { labels },
      });
      await fetchEtiquetas();
      toast.success(`${labels.length} etiquetas importadas com sucesso!`);
    } catch (err) {
      console.error('Erro ao importar:', err);
      toast.error('Erro ao importar etiquetas.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [user, fetchEtiquetas]);

  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);
    try {
      const created = await apiFetch<Label>('/labels', user.id, {
        method: 'POST',
        json: newLabel,
      });
      setEtiquetas(prev => [created, ...prev]);
      setIsModalOpen(false);
      setNewLabel({ produto: '', codigo: '', fornecedor: '', lote: '', validade_dias: 0, validade_horas: 0, empresa: '', sif: '', status: 'pendente' });
      toast.success('Etiqueta cadastrada!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao cadastrar etiqueta.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Gerenciar Etiquetas</h1>
          <p className="text-sm text-slate-500">Base de dados central de produtos e etiquetas.</p>
        </div>

        <div className="flex items-center gap-3">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx,.xls,.csv" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-blue-500 hover:text-blue-600 transition-colors">
            {isImporting ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
            Importar Excel
          </button>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
            <Plus size={16} />
            Nova Etiqueta
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-center gap-4 bg-slate-50/50">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por produto, código ou lote..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-sm"
            />
          </div>
        </div>

        {isLoading && !isImporting ? (
          <div className="py-16 flex items-center justify-center"><Loader2 size={24} className="text-slate-400 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
             <AlertCircle size={32} className="text-slate-300 mx-auto mb-3" />
             <p className="text-slate-500">Nenhuma etiqueta encontrada.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-4 py-3 w-12" />
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Código / Lote</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Produto / Fornecedor</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Validade</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Empresa / SIF</th>
                    <th className="px-4 py-3 w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedData.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-slate-900">{item.codigo || item.id.slice(0, 8)}</span>
                          {item.lote && <span className="text-xs text-blue-600 font-medium">Lote: {item.lote}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-slate-900">{item.produto}</span>
                          {item.fornecedor && <span className="text-xs text-slate-500">{item.fornecedor}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          {item.validade_dias > 0 && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100">{item.validade_dias}d</span>}
                          {item.validade_horas > 0 && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium border border-amber-100">{item.validade_horas}h</span>}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center"><StatusBadge status={item.status} /></td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-700">{item.empresa || '-'}</span>
                          {item.sif && <span className="text-xs text-slate-400">SIF: {item.sif}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right"><button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"><MoreVertical size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
          </>
        )}
      </div>

      {/* New Label Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Nova Etiqueta</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateLabel} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Produto *</label>
                <input required value={newLabel.produto} onChange={e => setNewLabel(prev => ({...prev, produto: e.target.value}))} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Código / Ref</label>
                  <input value={newLabel.codigo} onChange={e => setNewLabel(prev => ({...prev, codigo: e.target.value}))} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Lote</label>
                  <input value={newLabel.lote} onChange={e => setNewLabel(prev => ({...prev, lote: e.target.value}))} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Validade (Dias)</label>
                  <input type="number" value={newLabel.validade_dias} onChange={e => setNewLabel(prev => ({...prev, validade_dias: parseInt(e.target.value) || 0}))} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Validade (Horas)</label>
                  <input type="number" value={newLabel.validade_horas} onChange={e => setNewLabel(prev => ({...prev, validade_horas: parseInt(e.target.value) || 0}))} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Empresa</label>
                  <input value={newLabel.empresa} onChange={e => setNewLabel(prev => ({...prev, empresa: e.target.value}))} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">SIF</label>
                  <input value={newLabel.sif} onChange={e => setNewLabel(prev => ({...prev, sif: e.target.value}))} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200">Cancelar</button>
                <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2">
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Process Modal */}
      {isImporting && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm p-8 rounded-2xl shadow-xl text-center space-y-4">
            <Loader2 size={48} className="text-blue-600 animate-spin mx-auto" />
            <h3 className="text-lg font-semibold text-slate-900">Importando Etiquetas</h3>
            <p className="text-sm text-slate-500">Estamos processando sua planilha e salvando no banco de dados Turso...</p>
          </div>
        </div>
      )}
    </div>
  );
}