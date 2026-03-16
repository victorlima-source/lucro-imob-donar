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
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      className={`rounded-xl p-8 gold-border-top ${
        highlight ? 'bg-card' : 'bg-card'
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="text-primary">{icon}</div>
        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{title}</p>
      </div>
      <p className={`text-4xl font-bold tabular-nums ${highlight ? 'text-primary' : 'text-foreground'}`}>
        {formatCurrency(value)}
      </p>
    </motion.div>
  );
}
