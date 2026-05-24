'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Printer, 
  Settings2, 
  Package, 
  ChevronDown, 
  Hash, 
  Monitor, 
  Info,
  CheckCircle,
  Usb,
  AlertTriangle,
  RefreshCcw,
  Barcode,
  Loader2,
  LucideIcon
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { apiFetch, API_URL } from '@/lib/api';
import { toast } from 'sonner';

// ───────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  sku: string;
  fornecedor: string;
  lote: string;
  validade: string;
  sif: string;
}

interface USBDevice {
  productName: string;
  vendorId: number;
  productId: number;
}

interface PrintJob {
  productId: string;
  quantity: number;
  method: 'USB' | 'SPOOL' | 'NETWORK';
}

// ───────────────────────────────────────────────
// Constants
// ───────────────────────────────────────────────

const PRINT_METHODS = [
  { value: 'USB', label: 'Direct USB', description: 'Linguagem nativa do equipamento' },
  { value: 'SPOOL', label: 'Windows Spooler', description: 'Via driver do sistema' },
  { value: 'NETWORK', label: 'TCP/IP Network', description: 'Conexão em rede' },
] as const;

// ───────────────────────────────────────────────
// Sub-components
// ───────────────────────────────────────────────

function FormField({ 
  label, 
  icon: Icon, 
  children 
}: { 
  label: string; 
  icon: LucideIcon; 
  children: React.ReactNode 
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
        <Icon size={14} />
        {label}
      </label>
      {children}
    </div>
  );
}

function StatusBadge({ 
  connected, 
  deviceName, 
  onConnect, 
  onDisconnect 
}: { 
  connected: boolean; 
  deviceName?: string; 
  onConnect: () => void; 
  onDisconnect: () => void; 
}) {
  if (connected) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
        <Usb size={16} className="text-emerald-600" />
        <div className="flex flex-col">
          <span className="text-xs font-medium text-emerald-700">
            {deviceName || 'USB Conectado'}
          </span>
        </div>
        <button
          onClick={onDisconnect}
          className="p-1 text-emerald-600 hover:bg-emerald-100 rounded-md transition-colors"
          aria-label="Desconectar impressora"
        >
          <RefreshCcw size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
        <Usb size={16} className="text-amber-600" />
        <span className="text-xs font-medium text-amber-700">
          Nenhuma impressora USB
        </span>
      </div>
      <button
        onClick={onConnect}
        className="px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors"
      >
        Conectar
      </button>
    </div>
  );
}

function LabelPreview({ product }: { product: Product | null }) {
  if (!product) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300">
          <Printer size={32} />
        </div>
        <p className="text-sm font-medium text-slate-400">
          Selecione um produto para visualizar
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 shadow-lg rounded-lg overflow-hidden max-w-sm mx-auto">
      {/* Header */}
      <div className="bg-slate-900 text-white px-4 py-2 flex justify-between items-center">
        <span className="text-[10px] font-semibold uppercase tracking-wider">Sam Pro</span>
        <span className="text-[10px] text-slate-400">v2.4</span>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <div>
          <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-1">
            Identificação
          </p>
          <h4 className="text-lg font-bold text-slate-900 leading-tight">
            {product.name}
          </h4>
        </div>

        <div className="py-4 border-y border-dashed border-slate-200 space-y-3">
          <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-lg border border-emerald-100">
            <div>
              <p className="text-[10px] font-semibold text-emerald-700 uppercase">Validade</p>
              <p className="text-lg font-bold text-emerald-900">{product.validade}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold text-emerald-700 uppercase">Lote</p>
              <p className="text-sm font-bold text-emerald-900">{product.lote}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 px-1">
            <div>
              <p className="text-[9px] font-semibold text-slate-400 uppercase mb-0.5">Fornecedor</p>
              <p className="text-xs font-medium text-slate-700">{product.fornecedor}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-semibold text-slate-400 uppercase mb-0.5">S.I.F</p>
              <p className="text-xs font-bold text-slate-700">{product.sif}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 pt-2">
          <Barcode className="w-full h-12 text-slate-900" />
          <span className="text-xs font-mono font-bold tracking-widest text-slate-600">
            {product.sku}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-4 flex justify-center">
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[9px] font-semibold text-slate-600 uppercase tracking-wider">
            Padrão Térmico
          </span>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────
// USB Helpers
// ───────────────────────────────────────────────

async function requestUSBDevice(): Promise<USBDevice | null> {
  if (typeof window === 'undefined' || !navigator.usb) {
    throw new Error('WebUSB não suportado neste navegador');
  }

  try {
    const device = await navigator.usb.requestDevice({ filters: [] });
    return {
      productName: device.productName || 'Impressora USB',
      vendorId: device.vendorId,
      productId: device.productId,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'NotFoundError') {
      return null;
    }
    throw err;
  }
}

async function getConnectedUSBDevices(): Promise<USBDevice[]> {
  if (typeof window === 'undefined' || !navigator.usb) return [];
  
  const devices = await navigator.usb.getDevices();
  return devices.map(d => ({
    productName: d.productName || 'Impressora USB',
    vendorId: d.vendorId,
    productId: d.productId,
  }));
}

// ───────────────────────────────────────────────
// Main Page
// ───────────────────────────────────────────────

export default function PrintPage() {
  const { user } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [printMethod, setPrintMethod] = useState<PrintJob['method']>('USB');
  const [isPrinting, setIsPrinting] = useState(false);
  const [usbDevice, setUsbDevice] = useState<USBDevice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [printStatus, setPrintStatus] = useState<'idle' | 'success'>('idle');
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const fetchLabels = useCallback(async () => {
    if (!user) return;
    setIsLoadingProducts(true);
    try {
      const data = await apiFetch<any[]>('/labels', user.id);
      const fetchedLabels = Array.isArray(data) ? data : (data as any).data || [];
      
      const mapped: Product[] = fetchedLabels.map((label: any) => ({
        id: String(label.id),
        name: label.produto,
        sku: label.codigo,
        fornecedor: label.fornecedor || '-',
        lote: label.lote || '-',
        validade: label.validade_dias ? `${label.validade_dias} dias` : (label.validade_horas ? `${label.validade_horas} horas` : '-'),
        sif: label.sif || '-',
      }));
      setProducts(mapped);
    } catch (err) {
      console.error('Erro ao buscar etiquetas:', err);
      toast.error('Erro ao carregar lista de etiquetas.');
    } finally {
      setIsLoadingProducts(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  const selectedProduct = useMemo(
    () => products.find(p => p.id === selectedProductId) || null,
    [products, selectedProductId]
  );

  // Detectar dispositivos USB já conectados
  useEffect(() => {
    const checkDevices = async () => {
      try {
        const devices = await getConnectedUSBDevices();
        if (devices.length > 0) {
          setUsbDevice(devices[0]);
        }
      } catch (err) {
        console.error('Erro ao detectar USB:', err);
      }
    };
    checkDevices();
  }, []);

  const handleConnectUSB = useCallback(async () => {
    setError(null);
    try {
      const device = await requestUSBDevice();
      if (device) {
        setUsbDevice(device);
        toast.success(`Impressora ${device.productName} conectada!`);
      }
    } catch (err) {
      console.error('Erro USB:', err);
      setError(err instanceof Error ? err.message : 'Erro ao conectar USB');
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    setUsbDevice(null);
    setError(null);
    toast.info('Impressora desconectada.');
  }, []);

  const handlePrint = useCallback(async () => {
    if (!selectedProduct || !user) return;
    
    setIsPrinting(true);
    setError(null);
    setPrintStatus('idle');

    try {
      // Simulação de envio para impressora
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await apiFetch('/print-jobs', user.id, {
        method: 'POST',
        json: {
          jobId: `JOB-${Date.now()}`,
          productName: selectedProduct.name,
          sku: selectedProduct.sku,
          quantity: quantity,
          status: 'success',
          operator: user.primaryEmailAddress?.emailAddress || 'admin@sam.com',
          printer: usbDevice?.productName || 'ZDesigner GC420t',
          method: printMethod,
        },
      });

      setPrintStatus('success');
      toast.success('Impressão enviada com sucesso!');
      setTimeout(() => setPrintStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setError('Falha ao enviar para impressora');
      toast.error('Erro ao registrar job de impressão.');
    } finally {
      setIsPrinting(false);
    }
  }, [selectedProduct, quantity, printMethod, user, usbDevice]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            Terminal de Impressão
          </h1>
          <p className="text-sm text-slate-500">
            Gerencie sua fila de impressão e hardware conectado.
          </p>
        </div>

        <StatusBadge
          connected={!!usbDevice}
          deviceName={usbDevice?.productName}
          onConnect={handleConnectUSB}
          onDisconnect={handleDisconnect}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <Settings2 size={18} className="text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Configuração do Job
            </h2>
          </div>

          <div className="space-y-5">
            <FormField label="Etiqueta / Produto" icon={Package}>
              <div className="relative">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  disabled={isLoadingProducts}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none appearance-none disabled:opacity-50"
                >
                  <option value="">
                    {isLoadingProducts ? 'Carregando produtos...' : 'Selecione um produto...'}
                  </option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="Cópias" icon={Hash}>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField label="Método de Comunicação" icon={Monitor}>
                  <div className="relative">
                    <select
                      value={printMethod}
                      onChange={(e) => setPrintMethod(e.target.value as PrintJob['method'])}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none appearance-none"
                    >
                      {PRINT_METHODS.map(m => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                  <p className="text-xs text-slate-400 mt-1 ml-0">
                    {PRINT_METHODS.find(m => m.value === printMethod)?.description}
                  </p>
                </FormField>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertTriangle size={16} className="shrink-0" />
                <p className="font-medium">{error}</p>
              </div>
            )}

            {printStatus === 'success' && (
              <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 animate-in fade-in slide-in-from-top-2">
                <CheckCircle size={16} className="shrink-0" />
                <p className="font-medium">Impressão enviada com sucesso!</p>
              </div>
            )}

            <button
              onClick={handlePrint}
              disabled={!selectedProduct || isPrinting}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white text-base font-semibold rounded-lg hover:bg-blue-700 disabled:bg-slate-200 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {isPrinting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Printer size={20} />
              )}
              {isPrinting ? 'Enviando...' : 'Enviar para Impressora'}
            </button>
          </div>
        </section>

        {/* Preview Panel */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <Printer size={18} className="text-slate-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Pré-visualização
            </h2>
          </div>

          <div className="bg-slate-50 rounded-xl p-6 border border-dashed border-slate-200">
            <LabelPreview product={selectedProduct} />
          </div>

          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              O layout acima é uma representação térmica. Para melhores resultados em impressoras{' '}
              <span className="font-semibold">Zebra</span> ou{' '}
              <span className="font-semibold">Argox</span>, utilize a linguagem nativa do equipamento.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}