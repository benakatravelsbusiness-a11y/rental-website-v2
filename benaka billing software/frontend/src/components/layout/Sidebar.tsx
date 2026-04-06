import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Car,
  Users,
  FileText,
  PlusCircle,
  ChevronLeft,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/fleet', icon: Car, label: 'Fleet Manager' },
  { to: '/clients', icon: Users, label: 'Clients CRM' },
  { to: '/billing', icon: PlusCircle, label: 'New Invoice' },
  { to: '/invoices', icon: FileText, label: 'All Invoices' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 ease-in-out',
          'bg-surface-50/80 backdrop-blur-2xl border-r border-white/[0.06]',
          collapsed ? 'w-[72px]' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex items-center gap-3 px-5 h-16 border-b border-white/[0.06]',
          collapsed && 'justify-center px-0'
        )}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-emerald-400 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-sm font-bold text-white tracking-tight">Benaka Rentals</h1>
              <p className="text-[10px] text-slate-500 font-medium">Billing System</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'nav-link',
                  isActive && 'active',
                  collapsed && 'justify-center px-0'
                )
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              {!collapsed && (
                <span className="animate-fade-in">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className="px-3 py-3 border-t border-white/[0.06]">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'nav-link w-full',
              collapsed && 'justify-center px-0'
            )}
          >
            <ChevronLeft className={cn(
              'w-[18px] h-[18px] transition-transform duration-300',
              collapsed && 'rotate-180'
            )} />
            {!collapsed && <span className="animate-fade-in">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Spacer for main content */}
      <div className={cn(
        'transition-all duration-300 flex-shrink-0',
        collapsed ? 'w-[72px]' : 'w-64'
      )} />
    </>
  );
}
