'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { ArrowsClockwise, ShareNetwork } from '@phosphor-icons/react/dist/ssr';
import { CATEGORY_LABELS, type ToolCategory, type ToolIndexEntry } from '@/types/tools';

const ICON_BASE_URL = 'https://raw.githubusercontent.com/CoreWorxLab/caal-tools/main/icons';

interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  caal_registry_id?: string | null;
  caal_registry_version?: string | null;
}

type WorkflowStatus =
  | { type: 'custom' }
  | { type: 'registry'; upToDate: true }
  | { type: 'registry'; upToDate: false; currentVersion: string; latestVersion: string };

interface InstalledToolRowProps {
  workflow: N8nWorkflow;
  registryTool: ToolIndexEntry | null;
  status: WorkflowStatus;
  onShare: (workflow: N8nWorkflow) => void;
  onClick: (workflow: N8nWorkflow) => void;
  onUpdate?: (workflow: N8nWorkflow) => void;
}

export function InstalledToolRow({
  workflow,
  registryTool,
  status,
  onShare,
  onClick,
  onUpdate,
}: InstalledToolRowProps) {
  const t = useTranslations('Tools');
  const isCustom = status.type === 'custom';
  const hasUpdate = status.type === 'registry' && !status.upToDate;

  // Icon URL: registry tool icon or n8n.svg for custom
  const iconUrl = registryTool?.icon
    ? `${ICON_BASE_URL}/${registryTool.icon}`
    : `${ICON_BASE_URL}/n8n.svg`;

  // Display name: friendly name for registry, workflow name for custom
  const displayName = registryTool?.friendlyName || registryTool?.name || workflow.name;

  // Category label for registry tools, "Custom" for custom
  const categoryLabel = registryTool
    ? CATEGORY_LABELS[registryTool.category as ToolCategory] || registryTool.category
    : t('card.customBadge');

  return (
    <div
      onClick={() => onClick(workflow)}
      className="bg-surface-2 hover:bg-surface-3 group flex cursor-pointer items-center gap-4 rounded-xl border border-white/10 p-4 transition-colors"
    >
      {/* Icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center">
        <Image
          src={iconUrl}
          alt=""
          width={40}
          height={40}
          className="max-h-10 w-auto"
          unoptimized
        />
      </div>

      {/* Name + metadata */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="group-hover:text-primary truncate font-semibold transition-colors">
            {displayName}
          </h3>
          {/* Status dot - uses primary color */}
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${workflow.active ? 'bg-primary' : 'bg-gray-500'}`}
            title={workflow.active ? t('card.activeLabel') : t('card.inactiveLabel')}
          />
        </div>
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <span>{categoryLabel}</span>
          {hasUpdate && (
            <>
              <span>·</span>
              <span className="text-orange-400">
                v{status.currentVersion} → v{status.latestVersion}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {isCustom ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShare(workflow);
          }}
          className="text-primary hover:bg-primary/10 flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
        >
          <ShareNetwork className="h-4 w-4" weight="bold" />
          {t('card.shareButtonShort')}
        </button>
      ) : hasUpdate && onUpdate ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUpdate(workflow);
          }}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-orange-500/20 px-3 py-1.5 text-sm font-medium text-orange-400 transition-colors hover:bg-orange-500/30"
        >
          <ArrowsClockwise className="h-4 w-4" weight="bold" />
          {t('card.updateButton')}
        </button>
      ) : null}
    </div>
  );
}
