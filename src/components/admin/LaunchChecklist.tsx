/**
 * PICKEVENT - Launch Checklist Component
 * Compact launch readiness summary for Super Admin dashboard
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Rocket, 
  ExternalLink,
  Shield,
  CreditCard,
  Users,
  Mail,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ChecklistCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  items: string[];
  critical?: boolean;
}

const categories: ChecklistCategory[] = [
  {
    id: 'launch-auth',
    name: 'Autenticación',
    icon: <Shield className="h-4 w-4" />,
    items: ['auth-login', 'auth-roles', 'auth-rls', 'auth-reset'],
    critical: true,
  },
  {
    id: 'launch-payments',
    name: 'Pagos',
    icon: <CreditCard className="h-4 w-4" />,
    items: ['pay-mp-ar', 'pay-stripe', 'pay-webhook-mp', 'pay-webhook-stripe', 'pay-multitenant', 'pay-subscriptions', 'pay-events', 'pay-table', 'pay-encrypted'],
    critical: true,
  },
  {
    id: 'launch-tenants',
    name: 'Tenants',
    icon: <Users className="h-4 w-4" />,
    items: ['tenant-create-asistente', 'tenant-create-salon', 'tenant-toggle', 'tenant-list'],
  },
  {
    id: 'launch-events',
    name: 'Eventos',
    icon: <Calendar className="h-4 w-4" />,
    items: ['event-create', 'event-edit', 'event-delete', 'event-public', 'event-calendar', 'event-filters'],
  },
  {
    id: 'launch-notifications',
    name: 'Emails',
    icon: <Mail className="h-4 w-4" />,
    items: ['notif-confirm', 'notif-reminder', 'notif-expiry', 'notif-resend'],
  },
];

export function LaunchChecklist() {
  const [stats, setStats] = useState({ completed: 0, total: 0, percentage: 0 });
  const [categoryStats, setCategoryStats] = useState<Record<string, { completed: number; total: number }>>({});

  useEffect(() => {
    const calculateStats = () => {
      let totalCompleted = 0;
      let totalItems = 0;
      const catStats: Record<string, { completed: number; total: number }> = {};

      categories.forEach(category => {
        const storageKey = `testing-checklist-${category.id}`;
        const saved = localStorage.getItem(storageKey);
        const checkedItems = saved ? new Set(JSON.parse(saved)) : new Set();
        
        const completed = category.items.filter(item => checkedItems.has(item)).length;
        catStats[category.id] = { completed, total: category.items.length };
        
        totalCompleted += completed;
        totalItems += category.items.length;
      });

      setCategoryStats(catStats);
      setStats({
        completed: totalCompleted,
        total: totalItems,
        percentage: totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0,
      });
    };

    calculateStats();
    
    // Listen for storage changes
    const handleStorage = () => calculateStats();
    window.addEventListener('storage', handleStorage);
    
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const isReady = stats.percentage === 100;
  const criticalComplete = categories
    .filter(c => c.critical)
    .every(c => categoryStats[c.id]?.completed === categoryStats[c.id]?.total);

  return (
    <Card className={cn(
      "transition-all",
      isReady && "border-primary/50 bg-primary/5"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Rocket className="h-5 w-5 text-primary" />
            Estado de Lanzamiento
          </CardTitle>
          <Badge variant={isReady ? "default" : criticalComplete ? "secondary" : "destructive"}>
            {isReady ? 'Listo' : criticalComplete ? 'En progreso' : 'Pendiente'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progreso General</span>
            <span className="font-medium">{stats.completed}/{stats.total} ({stats.percentage}%)</span>
          </div>
          <Progress value={stats.percentage} className="h-2" />
        </div>

        {/* Category Breakdown */}
        <div className="grid gap-2">
          {categories.map(category => {
            const catStat = categoryStats[category.id] || { completed: 0, total: 0 };
            const isComplete = catStat.completed === catStat.total;
            const progress = catStat.total > 0 ? (catStat.completed / catStat.total) * 100 : 0;

            return (
              <div
                key={category.id}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg border",
                  isComplete ? "bg-primary/10 border-primary/30" : "bg-muted/30"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded",
                  isComplete ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  {category.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{category.name}</span>
                    {category.critical && !isComplete && (
                      <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0" />
                    )}
                  </div>
                  <Progress value={progress} className="h-1 mt-1" />
                </div>
                <div className="text-xs text-muted-foreground flex-shrink-0">
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    `${catStat.completed}/${catStat.total}`
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <Link to="/testing-guide">
          <Button variant="outline" className="w-full">
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver Checklist Completo
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
