import { type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MetricCardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  accentColor?: 'emerald' | 'blue' | 'amber' | 'rose' | 'violet';
  delay?: number;
}

const colorMap = {
  emerald: {
    icon: 'from-emerald-500 to-emerald-400',
    bg: 'bg-emerald-500/[0.06]',
    border: 'border-emerald-500/10',
    glow: 'shadow-[0_0_30px_rgba(16,185,129,0.08)]',
  },
  blue: {
    icon: 'from-blue-500 to-blue-400',
    bg: 'bg-blue-500/[0.06]',
    border: 'border-blue-500/10',
    glow: 'shadow-[0_0_30px_rgba(59,130,246,0.08)]',
  },
  amber: {
    icon: 'from-amber-500 to-amber-400',
    bg: 'bg-amber-500/[0.06]',
    border: 'border-amber-500/10',
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.08)]',
  },
  rose: {
    icon: 'from-rose-500 to-rose-400',
    bg: 'bg-rose-500/[0.06]',
    border: 'border-rose-500/10',
    glow: 'shadow-[0_0_30px_rgba(244,63,94,0.08)]',
  },
  violet: {
    icon: 'from-violet-500 to-violet-400',
    bg: 'bg-violet-500/[0.06]',
    border: 'border-violet-500/10',
    glow: 'shadow-[0_0_30px_rgba(139,92,246,0.08)]',
  },
};

export function MetricCard({
  label,
  value,
  subtitle,
  icon: Icon,
  accentColor = 'emerald',
  delay = 0,
}: MetricCardProps) {
  const colors = colorMap[accentColor];

  return (
    <div
      className={cn(
        'glass-card p-5 sm:p-6 animate-slide-up',
        colors.glow
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs sm:text-sm font-medium text-slate-400 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-500">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center',
          colors.bg,
          'border',
          colors.border
        )}>
          <Icon className={cn(
            'w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br bg-clip-text',
            colors.icon
          )} style={{ color: 'currentColor' }} />
        </div>
      </div>
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="glass-card-static p-5 sm:p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-8 w-32 rounded" />
          <div className="skeleton h-3 w-16 rounded" />
        </div>
        <div className="skeleton w-12 h-12 rounded-xl" />
      </div>
    </div>
  );
}
