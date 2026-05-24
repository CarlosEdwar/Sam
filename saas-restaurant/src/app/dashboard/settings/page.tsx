'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { useUser } from '@clerk/nextjs';
import { UserProfile } from '@clerk/nextjs';
import { 
  Globe, 
  Moon, 
  Printer, 
  Cpu, 
  Save,
  ShieldCheck,
  ChevronRight,
  Check,
  Loader2,
  AlertCircle,
  Sun,
  Monitor,
  Wifi,
  WifiOff,
  X,
  LucideIcon
} from 'lucide-react';
import { fetchSettings, saveSystemPrefs, ApiError } from '@/lib/api';
import { toast } from 'sonner';

// ───────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────

interface SettingItem {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  status: string;
  action?: string;
  variant: 'default' | 'danger' | 'success';
}

interface SystemState {
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  printerName: string | null;
  printerStatus: 'connected' | 'disconnected' | 'searching';
  driverVersion: string;
  serverStatus: 'online' | 'offline';
}

// ───────────────────────────────────────────────
// Constants
// ───────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const DEFAULT_STATE: SystemState = {
  language: 'pt-BR',
  timezone: 'America/Sao_Paulo',
  theme: 'system',
  printerName: null,
  printerStatus: 'disconnected',
  driverVersion: '2.4.1',
  serverStatus: 'offline',
};

// ───────────────────────────────────────────────
// Sub-components
// ───────────────────────────────────────────────

function SettingCard({
  icon: Icon,
  title,
  description,
  status,
  action,
  variant = 'default',
  onClick,
}: SettingItem & { onClick?: () => void }) {
  const variants = {
    default: {
      iconBg: 'bg-slate-100 dark:bg-slate-800',
      iconText: 'text-slate-500 dark:text-slate-400',
      hoverIconBg: 'group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30',
      hoverIconText: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
    },
    danger: {
      iconBg: 'bg-slate-100 dark:bg-slate-800',
      iconText: 'text-slate-500 dark:text-slate-400',
      hoverIconBg: 'group-hover:bg-red-50 dark:group-hover:bg-red-900/30',
      hoverIconText: 'group-hover:text-red-600 dark:group-hover:text-red-400',
    },
    success: {
      iconBg: 'bg-slate-100 dark:bg-slate-800',
      iconText: 'text-slate-500 dark:text-slate-400',
      hoverIconBg: 'group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30',
      hoverIconText: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
    },
  };

  const v = variants[variant];

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${v.iconBg} ${v.iconText} ${v.hoverIconBg} ${v.hoverIconText} rounded-lg flex items-center justify-center transition-colors shrink-0`}>
          <Icon size={20} />
        </div>
        <div>
          <span className="block font-semibold text-slate-900 dark:text-white text-base">
            {title}
          </span>
          <span className="block text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {description}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-slate-400 hidden sm:block">
          {status}
        </span>
        {action ? (
          <span className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:border-slate-300 transition-colors">
            {action}
          </span>
        ) : (
          <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
        )}
      </div>
    </button>
  );
}

// ───────────────────────────────────────────────
// Main Page
// ───────────────────────────────────────────────

export default function SettingsPage() {
  const t = useTranslations('Settings');
  const { theme, setTheme } = useTheme();
  const { user } = useUser();

  const [state, setState] = useState<SystemState>(DEFAULT_STATE);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Load from backend on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    fetchSettings(user.id)
      .then((data) => {
        const prefs = data.system_prefs;
        setState(prev => ({
          ...prev,
          language:    prefs.language    ?? prev.language,
          timezone:    prefs.timezone    ?? prev.timezone,
          theme:       prefs.theme       ?? prev.theme,
          printerName: prefs.printerName ?? prev.printerName,
        }));
        if (prefs.theme) setTheme(prefs.theme);
      })
      .catch((err) => {
        if (!(err instanceof ApiError && err.status === 401)) {
          console.error('Erro ao carregar configurações:', err);
        }
      })
      .finally(() => setIsLoading(false));
  }, [user?.id, setTheme]);

  // ── Server health check ────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    const checkServer = async () => {
      try {
        const res = await fetch(`${API_URL}/labels`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });
        if (mounted) setState(prev => ({ ...prev, serverStatus: res.ok ? 'online' : 'offline' }));
      } catch {
        if (mounted) setState(prev => ({ ...prev, serverStatus: 'offline' }));
      }
    };
    checkServer();
    const interval = setInterval(checkServer, 10000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const updateState = useCallback(<K extends keyof SystemState>(
    key: K,
    value: SystemState[K]
  ) => {
    setState(prev => ({ ...prev, [key]: value }));
    setSaveStatus('idle');
  }, []);

  // ── Save system prefs to backend ────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!user) return;
    setSaveStatus('saving');
    try {
      await saveSystemPrefs(user.id, {
        language:    state.language,
        timezone:    state.timezone,
        theme:       state.theme,
        printerName: state.printerName,
      });
      setSaveStatus('success');
      toast.success('Configurações do sistema salvas!');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Erro ao salvar preferências:', err);
      setSaveStatus('error');
      toast.error('Erro ao salvar no banco de dados.');
    }
  }, [user, state]);

  // ── WebUSB printer search ───────────────────────────────────────────────
  const handleSearchPrinter = useCallback(async () => {
    updateState('printerStatus', 'searching');
    try {
      if (!navigator.usb) {
         toast.error('Seu navegador não suporta WebUSB.');
         throw new Error('WebUSB não suportado.');
      }
      const device = await navigator.usb.requestDevice({ filters: [] });
      const name = device.productName || 'Impressora Genérica USB';
      updateState('printerName', name);
      updateState('printerStatus', 'connected');
      toast.success(`Impressora ${name} detectada!`);
    } catch (err) {
      console.error(err);
      updateState('printerStatus', 'disconnected');
    }
  }, [updateState]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{t('title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('description')}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {saveStatus === 'saving' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {t('save')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe size={18} className="text-blue-600" />
              Geral
            </h2>
          </div>
          <div className="p-2 space-y-1">
            <SettingCard
              id="language"
              icon={Globe}
              title="Idioma e Região"
              description={state.language === 'pt-BR' ? 'Português (Brasil)' : 'English (US)'}
              status={state.timezone === 'America/Sao_Paulo' ? 'Brasília (GMT-3)' : 'UTC'}
              variant="default"
              onClick={() => setActiveModal('language')}
            />
            <SettingCard
              id="theme"
              icon={state.theme === 'dark' ? Moon : Sun}
              title="Aparência do Painel"
              description={state.theme === 'system' ? 'Automático' : state.theme === 'dark' ? 'Escuro' : 'Claro'}
              status=""
              variant="default"
              onClick={() => setActiveModal('theme')}
            />
          </div>
        </section>

        {/* Hardware Settings */}
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Printer size={18} className="text-slate-600" />
              Hardware e Dispositivos
            </h2>
          </div>
          <div className="p-2 space-y-1">
            <SettingCard
              id="printer"
              icon={Printer}
              title="Impressora"
              description={state.printerName || 'Nenhuma conectada'}
              status={state.printerStatus === 'connected' ? 'Conectado' : 'Offline'}
              variant={state.printerStatus === 'connected' ? 'success' : 'default'}
              onClick={() => setActiveModal('printer')}
            />
            <SettingCard
              id="driver"
              icon={Cpu}
              title="Status do Driver"
              description={`Versão v${state.driverVersion}`}
              status="Online"
              variant="success"
            />
          </div>
        </section>

        {/* Security Section */}
        <section className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white"><ShieldCheck size={20} /></div>
             <div>
                <h2 className="text-lg font-semibold text-white">Segurança e Conta</h2>
                <p className="text-sm text-slate-400">Gerencie sua autenticação e perfil de usuário.</p>
             </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
             <button onClick={() => setActiveModal('clerkProfile')} className="p-5 bg-slate-800/50 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors text-left space-y-2">
                <span className="font-semibold text-white block">Perfil do Usuário</span>
                <p className="text-sm text-slate-400">Altere nome, email e senha da sua conta.</p>
                <div className="flex items-center gap-1 text-sm text-blue-400 font-medium pt-2">Configurar Perfil <ChevronRight size={14} /></div>
             </button>
             <button onClick={() => setActiveModal('clerkProfile')} className="p-5 bg-slate-800/50 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors text-left space-y-2">
                <span className="font-semibold text-white block">2FA / Segurança</span>
                <p className="text-sm text-slate-400">Ative a verificação em duas etapas para maior proteção.</p>
                <div className="flex items-center gap-1 text-sm text-blue-400 font-medium pt-2">Acessar Segurança <ChevronRight size={14} /></div>
             </button>
          </div>
        </section>
      </div>

      {/* ── Language Modal ────────────────────────────────────────────────── */}
      {activeModal === 'language' && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-xl shadow-xl overflow-hidden border dark:border-slate-800">
            <div className="px-6 py-4 border-b dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900 dark:text-white">Idioma e Região</h3>
              <button onClick={() => setActiveModal(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Idioma</label>
                <select value={state.language} onChange={e => updateState('language', e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg outline-none">
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">English (United States)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Fuso Horário</label>
                <select value={state.timezone} onChange={e => updateState('timezone', e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg outline-none">
                  <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                  <option value="UTC">UTC (00:00)</option>
                </select>
              </div>
              <button onClick={() => setActiveModal(null)} className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Appearance Modal ─────────────────────────────────────────────── */}
      {activeModal === 'theme' && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-xl shadow-xl p-6 space-y-4 border dark:border-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Aparência</h3>
            <div className="space-y-2">
              {(['light', 'dark', 'system'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { updateState('theme', t); setTheme(t); setActiveModal(null); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${state.theme === t ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  {t === 'light' && <Sun size={18} className="text-amber-500" />}
                  {t === 'dark' && <Moon size={18} className="text-slate-600 dark:text-slate-400" />}
                  {t === 'system' && <Monitor size={18} className="text-blue-500" />}
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t === 'light' ? 'Claro' : t === 'dark' ? 'Escuro' : 'Automático'}</span>
                  {state.theme === t && <Check size={16} className="ml-auto text-blue-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Printer Modal ────────────────────────────────────────────────── */}
      {activeModal === 'printer' && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-xl shadow-xl overflow-hidden border dark:border-slate-800">
            <div className="px-6 py-4 border-b dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900 dark:text-white">Impressora USB</h3>
              <button onClick={() => setActiveModal(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="p-6 text-center space-y-4">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${state.printerStatus === 'connected' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                <Printer size={32} />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{state.printerName || 'Nenhuma impressora selecionada'}</p>
                <p className="text-sm text-slate-500 mt-1">{state.printerStatus === 'connected' ? 'Dispositivo conectado e pronto.' : 'Conecte sua impressora via USB para configurar.'}</p>
              </div>
              <button
                onClick={handleSearchPrinter}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                {state.printerStatus === 'searching' ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                {state.printerStatus === 'connected' ? 'Trocar Impressora' : 'Buscar Dispositivo'}
              </button>
              {state.printerName && (
                 <button onClick={() => updateState('printerName', null)} className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700">Remover</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Clerk Profile Modal ─────────────────────────────────────────── */}
      {activeModal === 'clerkProfile' && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl flex justify-center bg-white dark:bg-slate-900 py-8">
             <UserProfile routing="hash" />
             <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-white px-3 py-1 rounded-lg text-sm z-50 hover:bg-slate-200">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}