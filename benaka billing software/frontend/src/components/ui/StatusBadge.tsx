import { getStatusClass } from '../../lib/utils';
import { Circle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  pulse?: boolean;
}

export function StatusBadge({ status, pulse = false }: StatusBadgeProps) {
  return (
    <span className={`badge ${getStatusClass(status)}`}>
      {pulse && (
        <Circle className="w-1.5 h-1.5 fill-current animate-pulse-soft" />
      )}
      {status}
    </span>
  );
}
