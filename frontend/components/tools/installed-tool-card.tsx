'use client';

import { useTranslations } from 'next-intl';
import { ArrowsClockwise, CheckCircle, ShareNetwork } from '@phosphor-icons/react/dist/ssr';

interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  settings?: {
    caal_registry_id?: string;
    caal_registry_version?: string;
  };
}

type WorkflowStatus =
  | { type: 'custom' }
  | { type: 'registry'; upToDate: true }
  | { type: 'registry'; upToDate: false; currentVersion: string; latestVersion: string };

interface InstalledToolCardProps {
  workflow: N8nWorkflow;
  status: WorkflowStatus;
  onShare: (workflow: N8nWorkflow) => void;
  onClick: (workflow: N8nWorkflow) => void;
  onUpdate?: (workflow: N8nWorkflow) => void;
}

export function InstalledToolCard({
  workflow,
  status,
  onShare,
  onClick,
  onUpdate,
}: InstalledToolCardProps) {
  const t = useTranslations('Tools');
  return (
    <div
      onClick={() => onClick(workflow)}
      className="bg-surface-2 hover:shadow-primary/5 group relative flex min-h-[340px] cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/10 transition-all duration-300 hover:shadow-xl"
    >
      {/* Content */}
      <div className="flex flex-1 flex-col p-6">
        {/* Header: Badge + Active indicator */}
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-green-500/20 px-2.5 py-1 text-xs font-medium text-green-400">
            {t('card.customBadge')}
          </span>
          {workflow.active && (
            <CheckCircle
              className="h-5 w-5 text-green-400"
              weight="fill"
              aria-label={t('card.activeLabel')}
            />
          )}
        </div>

        {/* Title */}
        <h3 className="group-hover:text-primary mb-2 truncate text-lg font-bold transition-colors">
          {workflow.name}
        </h3>

        {/* Version info (for registry tools with updates) */}
        {status.type === 'registry' && !status.upToDate && (
          <p className="text-muted-foreground mb-2 text-xs">
            v{status.currentVersion} → v{status.latestVersion}
          </p>
        )}

        {/* Updated date */}
        <p className="text-muted-foreground text-sm">
          Updated {new Date(workflow.updatedAt).toLocaleDateString()}
        </p>
      </div>

      {/* Share button - full width, outside content padding (matches ToolCard Install button) */}
      {status.type === 'custom' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShare(workflow);
          }}
          className="bg-primary-bg hover:bg-primary-bg/90 flex w-full items-center justify-center gap-2 py-4 font-bold text-white transition-colors"
        >
          <ShareNetwork className="h-5 w-5" weight="bold" />
          {t('card.shareButton')}
        </button>
      )}

      {/* Update button (only for registry tools with updates) */}
      {status.type === 'registry' && !status.upToDate && onUpdate && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUpdate(workflow);
          }}
          className="flex w-full items-center justify-center gap-2 bg-orange-500/20 py-4 font-bold text-orange-400 transition-colors hover:bg-orange-500/30"
        >
          <ArrowsClockwise className="h-5 w-5" weight="bold" />
          {t('card.updateButton')}
        </button>
      )}
    </div>
  );
}
