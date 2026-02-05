'use client';

import { useTranslations } from 'next-intl';
import { ArrowClockwise, Warning } from '@phosphor-icons/react/dist/ssr';
import type { ToolIndexEntry } from '@/types/tools';
import { ToolCard } from './tool-card';

interface BrowseToolsViewProps {
  filteredTools: ToolIndexEntry[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  n8nEnabled: boolean;
  installedToolsMap: Map<string, { version: string; workflowId: string }>;
  onInstall: (tool: ToolIndexEntry) => void;
  onCardClick: (tool: ToolIndexEntry) => void;
  onRefresh: () => void;
  onClearSearch: () => void;
}

export function BrowseToolsView({
  filteredTools,
  loading,
  error,
  searchQuery,
  n8nEnabled,
  installedToolsMap,
  onInstall,
  onCardClick,
  onRefresh,
  onClearSearch,
}: BrowseToolsViewProps) {
  const t = useTranslations('Tools');
  const tCommon = useTranslations('Common');

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <ArrowClockwise className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-muted-foreground mt-4">{t('browse.loading')}</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Warning className="h-8 w-8 text-red-500" />
        <p className="text-muted-foreground mt-4">{error}</p>
        <button
          onClick={onRefresh}
          className="bg-muted hover:bg-muted/80 mt-4 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          {tCommon('retry')}
        </button>
      </div>
    );
  }

  // Empty state
  if (filteredTools.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">{t('browse.emptyState')}</p>
        {searchQuery && (
          <button onClick={onClearSearch} className="text-primary mt-2 text-sm hover:underline">
            {t('browse.clearSearch')}
          </button>
        )}
      </div>
    );
  }

  // Tool grid
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filteredTools.map((tool) => (
        <ToolCard
          key={tool.path}
          tool={tool}
          isInstalled={tool.id ? installedToolsMap.has(tool.id) : false}
          onInstall={n8nEnabled ? onInstall : () => {}}
          onClick={onCardClick}
        />
      ))}
    </div>
  );
}
