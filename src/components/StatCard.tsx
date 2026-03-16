import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/insurance';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  highlight?: boolean;
}

export default function StatCard({ title, value, icon, highlight }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      className="rounded-xl p-6 bg-card card-shadow border border-border"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${highlight ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>
          {icon}
        </div>
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
      </div>
      <p className={`text-3xl font-bold tabular-nums ${highlight ? 'text-accent' : 'text-foreground'}`}>
        {formatCurrency(value)}
      </p>
    </motion.div>
  );
}
