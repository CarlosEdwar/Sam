'use client';

import { ReactNode, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Tag,
  Printer,
  History,
  Settings,
  LogOut,
  Search,
  Bell,
  Package,
  Calendar,
  LucideIcon
} from 'lucide-react';

// ───────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────

interface MenuItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

interface SidebarProps {
  items: MenuItem[];
  currentPath: string;
  onSignOut: () => void;
}

interface HeaderProps {
  onSearch?: (query: string) => void;
}

// ───────────────────────────────────────────────
// Constants
// ───────────────────────────────────────────────

const MENU_ITEMS: MenuItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Estoque', path: '/dashboard/estoque', icon: Package },
  { name: 'Etiquetas', path: '/dashboard/etiquetas', icon: Tag },
  { name: 'Escalas', path: '/dashboard/escalas', icon: Calendar },
  { name: 'Imprimir', path: '/dashboard/print', icon: Printer },
  { name: 'Histórico', path: '/dashboard/history', icon: History },
  { name: 'Configurações', path: '/dashboard/settings', icon: Settings },
];

// ───────────────────────────────────────────────
// Sub-components
// ───────────────────────────────────────────────

function Sidebar({ items, currentPath, onSignOut }: SidebarProps) {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col sticky top-0 h-screen shadow-xl z-20">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="bg-white rounded-lg p-1.5 shadow-sm">
          <Image 
            src="/Person.png" 
            alt="Logo Sam" 
            width={32} 
            height={32} 
            priority 
            className="rounded-md"
          />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">
          Sam
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1" aria-label="Navegação principal">
        {items.map((item) => {
          const isActive = currentPath === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${isActive ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon 
                size={18} 
                className={`shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}
                aria-hidden="true"
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        {/* System Status */}
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
          <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wide mb-1">
            Status do Sistema
          </p>
          <p className="text-xs text-slate-400">
            Ambiente de produção pronto
          </p>
        </div>

        {/* Logout */}
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <LogOut size={18} aria-hidden="true" />
          <span>Encerrar Sessão</span>
        </button>
      </div>
    </aside>
  );
}

function Header({ onSearch }: HeaderProps) {
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearch?.(e.target.value);
    },
    [onSearch]
  );

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm flex-shrink-0">
      {/* Search */}
      <div className="relative max-w-md w-full">
        <Search 
          size={16} 
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" 
          aria-hidden="true"
        />
        <input
          type="text"
          placeholder="Pesquisar por SKU ou Lote..."
          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 pl-10 pr-4 py-2.5 rounded-lg text-sm transition-all outline-none"
          onChange={handleSearchChange}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button
          className="relative p-2.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Notificações"
        >
          <Bell size={18} aria-hidden="true" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>

        <div className="h-6 w-px bg-slate-200" />

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="block text-sm font-semibold text-slate-900">
              Painel Admin
            </span>
            <span className="block text-xs text-blue-600 font-medium">
              Gerenciamento
            </span>
          </div>
          <div className="hover:scale-105 transition-transform cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-medium">
              U
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// ───────────────────────────────────────────────
// Main Layout
// ───────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const memoizedMenuItems = useMemo(() => MENU_ITEMS, []);

  const handleSignOut = useCallback(async () => {
    console.log('Sign out requested');
    router.push('/login');
  }, [router]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar items={memoizedMenuItems} currentPath={pathname} onSignOut={handleSignOut} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        
        <main className="p-8 overflow-y-auto overflow-x-hidden flex-1">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}