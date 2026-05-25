'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Save,
  Check,
  Loader2,
  Printer,
  Ruler,
  Settings2,
  AlertCircle
} from 'lucide-react';
import { fetchSettings, saveAppConfig } from '@/lib/services/settings-service';

// ───────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────

interface AppConfig {
  labelFormat: string;
  defaultPrinter: string;
  autoPrint: boolean;
  copies: number;
}

interface FormFieldProps {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

// ───────────────────────────────────────────────
// Constants
// ───────────────────────────────────────────────

const LABEL_FORMATS = [
  { value: '50x25', label: '50mm × 25mm', description: 'Etiqueta pequena, ideal para preços' },
  { value: '70x30', label: '70mm × 30mm', description: 'Etiqueta padrão de gôndola' },
  { value: '100x50', label: '100mm × 50mm', description: 'Etiqueta grande, ideal para códigos de barras' },
  { value: 'a4', label: 'A4 (múltiplos)', description: 'Folha A4 com múltiplas etiquetas' },
] as const;

const DEFAULT_CONFIG: AppConfig = {
  labelFormat: '50x25',
  defaultPrinter: '',
  autoPrint: false,
  copies: 1,
};

// ───────────────────────────────────────────────
// Sub-components
// ───────────────────────────────────────────────

function FormField({ id, label, description, icon, children }: FormFieldProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-slate-400">{icon}</span>
        <label htmlFor={id} className="text-sm font-semibold text-slate-900">
          {label}
        </label>
      </div>
      {description && (
        <p className="text-xs text-slate-500 ml-6">{description}</p>
      )}
      <div className="ml-6">{children}</div>
    </div>
  );
}

function SaveStatus({ status }: { status: 'idle' | 'saving' | 'success' | 'error' }) {
  const config = {
    idle: null,
    saving: {
      icon: <Loader2 size={16} className="animate-spin text-blue-600" />,
      text: 'Salvando...',
      className: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    success: {
      icon: <Check size={16} className="text-emerald-600" />,
      text: 'Configurações salvas com sucesso!',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    error: {
      icon: <AlertCircle size={16} className="text-red-600" />,
      text: 'Erro ao salvar. Tente novamente.',
      className: 'bg-red-50 text-red-700 border-red-200',
    },
  };

  const current = config[status];
  if (!current) return null;

  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium ${current.className} animate-in fade-in slide-in-from-top-2 duration-200`}>
      {current.icon}
      {current.text}
    </div>
  );
}

// ───────────────────────────────────────────────
// Main Page
// ───────────────────────────────────────────────

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [isLoaded, setIsLoaded] = useState(false);

  // ── Load app_config from backend on mount ───────────────────────────────
  useEffect(() => {
    fetchSettings()
      .then((data) => {
        const cfg = data.app_config;
        setConfig(prev => ({ ...prev, ...cfg }));
      })
      .catch((err) => {
        console.error('Erro ao carregar configurações de app:', err);
      })
      .finally(() => setIsLoaded(true));
  }, []);

  const updateConfig = useCallback(<K extends keyof AppConfig>(
    key: K,
    value: AppConfig[K]
  ) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setSaveStatus('idle');
  }, []);

  // ── Save to backend ─────────────────────────────────────────────────────
  const handleSalvar = useCallback(async () => {
    if (!config.defaultPrinter.trim()) {
      setSaveStatus('error');
      return;
    }

    setSaveStatus('saving');
    try {
      await saveAppConfig(config);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Erro ao salvar configurações de app:', err);
      setSaveStatus('error');
    }
  }, [config]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          Configurações
        </h1>
        <p className="text-sm text-slate-500">
          Ajuste as preferências do sistema de impressão e estoque.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
        {/* Section: Impressão */}
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Printer size={18} className="text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Configurações de Impressão
            </h2>
          </div>

          <FormField
            id="formato"
            label="Formato da Etiqueta"
            description="Escolha o tamanho padrão para suas etiquetas."
            icon={<Ruler size={16} />}
          >
            <select
              id="formato"
              value={config.labelFormat}
              onChange={(e) => updateConfig('labelFormat', e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
            >
              {LABEL_FORMATS.map((format) => (
                <option key={format.value} value={format.value}>
                  {format.label} — {format.description}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            id="impressora"
            label="Impressora Padrão"
            description="Nome exato da impressora configurada no sistema."
            icon={<Printer size={16} />}
          >
            <input
              id="impressora"
              type="text"
              value={config.defaultPrinter}
              onChange={(e) => updateConfig('defaultPrinter', e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
              placeholder="Ex: ZDesigner GC420t"
            />
          </FormField>

          <FormField
            id="copies"
            label="Cópias por Padrão"
            description="Quantidade de etiquetas a imprimir automaticamente."
            icon={<Settings2 size={16} />}
          >
            <div className="flex items-center gap-3">
              <input
                id="copies"
                type="number"
                min={1}
                max={10}
                value={config.copies}
                onChange={(e) => updateConfig('copies', Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                className="w-20 px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-center"
              />
              <span className="text-sm text-slate-500">cópia(s)</span>
            </div>
          </FormField>

          <div className="ml-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoPrint}
                onChange={(e) => updateConfig('autoPrint', e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-slate-900">
                  Impressão automática
                </span>
                <p className="text-xs text-slate-500">
                  Enviar diretamente para a impressora sem pré-visualização
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Section: Preview */}
        <div className="p-6 bg-slate-50/50">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Pré-visualização do Formato
          </h3>
          <div className="flex items-center justify-center">
            <div 
              className="bg-white border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 text-xs font-medium shadow-sm transition-all duration-300"
              style={{
                width: config.labelFormat === '50x25' ? '200px' : 
                       config.labelFormat === '70x30' ? '280px' : 
                       config.labelFormat === '100x50' ? '400px' : '320px',
                height: config.labelFormat === '50x25' ? '100px' : 
                        config.labelFormat === '70x30' ? '120px' : 
                        config.labelFormat === '100x50' ? '200px' : '180px',
              }}
            >
              {config.labelFormat === 'a4' ? 'Folha A4' : `${config.labelFormat}mm`}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <SaveStatus status={saveStatus} />
        
        <button
          onClick={handleSalvar}
          disabled={saveStatus === 'saving'}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {saveStatus === 'saving' ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {saveStatus === 'saving' ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  );
}