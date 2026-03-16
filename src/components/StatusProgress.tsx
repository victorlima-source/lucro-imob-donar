import { STATUS_STEPS, getStatusIndex } from '@/lib/insurance';
import { cn } from '@/lib/utils';

interface Props {
  status: string;
}

export default function StatusProgress({ status }: Props) {
  const isCancelled = status === 'Cancelado';
  const currentIdx = isCancelled ? -1 : getStatusIndex(status);

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-destructive" />
        <span className="text-xs font-medium text-destructive">Cancelado</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 min-w-[200px]">
      {STATUS_STEPS.map((step, i) => {
        const isActive = i <= currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={step} className="flex items-center flex-1">
            <div
              className={cn(
                'w-3 h-3 rounded-full border-2 transition-all flex-shrink-0',
                isActive
                  ? 'bg-primary border-primary'
                  : 'bg-background border-border',
                isCurrent && 'ring-2 ring-primary/30'
              )}
            />
            {i < STATUS_STEPS.length - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1 mx-0.5 transition-all',
                  i < currentIdx ? 'bg-primary' : 'bg-border'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
