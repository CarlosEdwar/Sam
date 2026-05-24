'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical,
  ArrowUpRight,
  AlertTriangle,
  Archive,
  Loader2,
  Upload,
  X,
  Save,
  LucideIcon
} from 'lucide-react';
import { apiFetch, API_URL } from '@/lib/api';

// ───────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────

export interface EstoqueItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  min_stock: number;
  status: 'normal' | 'low' | 'out';
  created_at: string;
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant: 'default' | 'success' | 'danger';
  isLoading: boolean;
}

interface StatusBadgeProps {
  status: EstoqueItem['status'];
}

// ───────────────────────────────────────────────
// Sub-components
// ───────────────────────────────────────────────

function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    normal: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Adequado',
    },
    low: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
      label: 'Baixo',
    },
    out: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      dot: 'bg-red-500',
      label: 'Esgotado',
    },
  };

  const c = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${status === 'out' ? 'animate-pulse' : ''}`} />
      {c.label}
    </span>
  );
}

function SummaryCard({ title, value, icon: Icon, variant, isLoading }: SummaryCardProps) {
  const variants = {
    default: {
      iconBg: 'bg-blue-50',
      iconText: 'text-blue-600',
    },
    success: {
      iconBg: 'bg-emerald-50',
      iconText: 'text-emerald-600',
    },
    danger: {
      iconBg: 'bg-red-50',
      iconText: 'text-red-600',
    },
  };

  const v = variants[variant];

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 ${v.iconBg} ${v.iconText} rounded-lg flex items-center justify-center shrink-0`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">
          {title}
        </p>
        <p className="text-2xl font-bold text-slate-900 leading-none">
          {isLoading ? '-' : value}
        </p>
      </div>
    </div>
  );
}

function EmptyState({ onImport }: { onImport: () => void }) {
  return (
    <div className="py-16 text-center">
      <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Package size={24} className="text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">
        Nenhum item cadastrado
      </h3>
      <p className="text-sm text-slate-500 mb-6">
        O seu estoque está vazio no momento.
      </p>
      <button
        onClick={onImport}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        aria-label="Importar arquivo de estoque"
      >
        <Upload size={16} />
        Importar Dados
      </button>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="py-16 text-center">
      <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle size={24} className="text-red-500" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">
        Erro de Conexão
      </h3>
      <p className="text-sm text-slate-500 mb-4">
        Não foi possível carregar os dados do estoque.
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
      >
        Tentar Novamente
      </button>
    </div>
  );
}

// ───────────────────────────────────────────────
// Excel Import Logic
// ───────────────────────────────────────────────

interface ExcelRow {
  [key: string]: string | number | undefined;
}

function findValue(row: ExcelRow, keywords: string[]): string {
  const key = Object.keys(row).find(k =>
    keywords.some(keyword => k.toLowerCase().includes(keyword))
  );
  const val = key ? row[key] : '';
  return val !== undefined && val !== null ? String(val) : '';
}

function parseExcelFile(file: File): Promise<Partial<EstoqueItem>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result as ArrayBuffer;
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as ExcelRow[];

        const items: Partial<EstoqueItem>[] = jsonData.map((row, index) => {
          const name = findValue(row, ['produto', 'nome', 'descri', 'item']) || `Produto Importado ${index + 1}`;
          const sku = findValue(row, ['código', 'codigo', 'sku', 'ref']) || `SKU-${Date.now()}-${index}`;
          const category = findValue(row, ['categoria', 'grupo', 'tipo', 'família', 'familia']) || 'Geral';
          const rawStock = findValue(row, ['estoque', 'quantidade', 'qtd', 'saldo']);
          const stock = parseInt(rawStock, 10) || 0;

          return {
            name,
            sku,
            category,
            stock,
            min_stock: 10,
            status: stock === 0 ? 'out' : stock < 10 ? 'low' : 'normal',
          };
        });

        resolve(items);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });
}

// ───────────────────────────────────────────────
// Main Page
// ───────────────────────────────────────────────

export default function EstoquePage() {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [inventory, setInventory] = useState<EstoqueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Item State
  const [newItem, setNewItem] = useState({
    name: '',
    sku: '',
    category: 'Geral',
    stock: 0,
    min_stock: 10
  });

  const fetchEstoque = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch<EstoqueItem[]>('/inventory', user.id);
      setInventory(Array.isArray(data) ? data : (data as any).data || []);
    } catch (err) {
      console.error('Erro ao buscar estoque:', err);
      setError('Não foi possível carregar os dados do estoque.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEstoque();
  }, [fetchEstoque]);

  const filteredInventory = useMemo(() => {
    if (!searchTerm.trim()) return inventory;
    const q = searchTerm.toLowerCase();
    return inventory.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  }, [inventory, searchTerm]);

  const summaryStats = useMemo(() => ({
    total: inventory.length,
    lowStock: inventory.filter(i => i.status !== 'normal').length,
    entries: 0,
  }), [inventory]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsImporting(true);
    setError(null);

    try {
      const items = await parseExcelFile(file);

      const responseData = await apiFetch<any>('/inventory/import', user.id, {
        method: 'POST',
        json: { items },
      });

      const newItems = Array.isArray(responseData) ? responseData : responseData.data || [];
      setInventory(prev => [...newItems, ...prev]);
      toast.success(`${items.length} itens importados com sucesso!`);
    } catch (err) {
      console.error('Erro ao importar Excel:', err);
      toast.error('Erro na importação do arquivo.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [user]);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsImporting(true);
    try {
      const created = await apiFetch<EstoqueItem>('/inventory', user.id, {
        method: 'POST',
        json: newItem,
      });
      setInventory(prev => [created, ...prev]);
      setIsModalOpen(false);
      setNewItem({ name: '', sku: '', category: 'Geral', stock: 0, min_stock: 10 });
      toast.success('Item cadastrado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao cadastrar item.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            Controle de Estoque
          </h1>
          <p className="text-sm text-slate-500">
            Gerencie os níveis de suprimentos e produtos da sua operação.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-blue-500 hover:text-blue-600 transition-colors disabled:opacity-50"
          >
            {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {isImporting ? 'Importando...' : 'Importar'}
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Novo Item
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SummaryCard title="Total de Itens" value={summaryStats.total} icon={Package} variant="default" isLoading={isLoading} />
        <SummaryCard title="Entradas (Mês)" value={summaryStats.entries} icon={ArrowUpRight} variant="success" isLoading={isLoading} />
        <SummaryCard title="Baixo Estoque" value={summaryStats.lowStock} icon={AlertTriangle} variant="danger" isLoading={isLoading} />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative w-full md:w-96">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-sm"
            />
          </div>
          <p className="text-sm text-slate-500">
            Mostrando <span className="font-medium text-slate-900">{filteredInventory.length}</span> resultados
          </p>
        </div>

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Loader2 size={24} className="text-slate-400 animate-spin mb-3" />
            <p className="text-sm text-slate-500">Carregando dados do estoque...</p>
          </div>
        ) : error ? (
          <ErrorState onRetry={fetchEstoque} />
        ) : filteredInventory.length === 0 ? (
          <EmptyState onImport={() => fileInputRef.current?.click()} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Produto</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Categoria</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estoque</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Atualização</th>
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500"><Archive size={16} /></div>
                        <div>
                          <p className="font-medium text-sm text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-500">{item.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4"><span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-md">{item.category}</span></td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-sm ${item.stock === 0 ? 'text-red-600' : 'text-slate-900'}`}>{item.stock}</span>
                        <span className="text-xs text-slate-400">/ min: {item.min_stock}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4"><StatusBadge status={item.status} /></td>
                    <td className="px-4 py-4"><span className="text-sm text-slate-500">{item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : 'N/A'}</span></td>
                    <td className="px-4 py-4 text-right">
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><MoreVertical size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Novo Item de Estoque</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateItem} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Nome do Produto</label>
                <input required value={newItem.name} onChange={e => setNewItem(prev => ({...prev, name: e.target.value}))} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Ex: Rótulo 50x25mm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">SKU / Referência</label>
                  <input value={newItem.sku} onChange={e => setNewItem(prev => ({...prev, sku: e.target.value}))} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Ex: ROT-001" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Categoria</label>
                  <input value={newItem.category} onChange={e => setNewItem(prev => ({...prev, category: e.target.value}))} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Estoque Atual</label>
                  <input type="number" required value={newItem.stock} onChange={e => setNewItem(prev => ({...prev, stock: parseInt(e.target.value) || 0}))} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Mínimo (Alerta)</label>
                  <input type="number" value={newItem.min_stock} onChange={e => setNewItem(prev => ({...prev, min_stock: parseInt(e.target.value) || 0}))} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors">Cancelar</button>
                <button type="submit" disabled={isImporting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}