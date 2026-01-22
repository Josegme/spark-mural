/**
 * PICKEVENT - Testing Checklist Section Component
 * Reusable section for testing checklists with persistent state
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  critical?: boolean;
}

interface TestingChecklistSectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: ChecklistItem[];
  defaultExpanded?: boolean;
}

export function TestingChecklistSection({
  id,
  title,
  icon,
  items,
  defaultExpanded = false,
}: TestingChecklistSectionProps) {
  const storageKey = `testing-checklist-${id}`;
  
  const [checkedItems, setCheckedItems] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  
  const [expanded, setExpanded] = useState(defaultExpanded);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify([...checkedItems]));
  }, [checkedItems, storageKey]);

  const toggleItem = (itemId: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const completedCount = checkedItems.size;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isComplete = completedCount === totalCount;

  return (
    <Card className={cn(
      "transition-all",
      isComplete && "border-green-500/50 bg-green-500/5"
    )}>
      <CardHeader 
        className="cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={isComplete ? "default" : "secondary"}>
              {completedCount}/{totalCount}
            </Badge>
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>
        <Progress value={progress} className="h-2 mt-2" />
      </CardHeader>
      
      {expanded && (
        <CardContent className="space-y-3">
          {items.map(item => (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                checkedItems.has(item.id) 
                  ? "bg-green-500/10 border-green-500/30" 
                  : "bg-muted/30 border-border hover:bg-muted/50"
              )}
            >
              <Checkbox
                id={item.id}
                checked={checkedItems.has(item.id)}
                onCheckedChange={() => toggleItem(item.id)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <label
                  htmlFor={item.id}
                  className={cn(
                    "text-sm font-medium cursor-pointer",
                    checkedItems.has(item.id) && "line-through text-muted-foreground"
                  )}
                >
                  {item.label}
                  {item.critical && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      Crítico
                    </Badge>
                  )}
                </label>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
