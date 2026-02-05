'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import {
  ChatCircle,
  CheckCircle,
  CheckSquare,
  Code,
  HardDrives,
  House,
  Microphone,
  PlayCircle,
  Plus,
  PuzzlePiece,
  Trophy,
  Wrench,
} from '@phosphor-icons/react/dist/ssr';
import {
  CATEGORY_LABELS,
  TIER_LABELS,
  type ToolCategory,
  type ToolIndexEntry,
} from '@/types/tools';

// Category icon colors (10% opacity bg for cards)
const CATEGORY_ICON_STYLES: Record<ToolCategory, { bg: string; text: string }> = {
  'smart-home': { bg: 'bg-green-500/10', text: 'text-green-400' },
  media: { bg: 'bg-red-500/10', text: 'text-red-400' },
  homelab: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
  productivity: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  developer: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
  utilities: { bg: 'bg-slate-500/10', text: 'text-slate-400' },
  sports: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
  social: { bg: 'bg-pink-500/10', text: 'text-pink-400' },
  other: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
};

// Fallback Phosphor icons per category
const CATEGORY_ICONS: Record<
  ToolCategory,
  React.ComponentType<{ className?: string; weight?: 'fill' | 'regular' | 'bold' }>
> = {
  'smart-home': House,
  media: PlayCircle,
  homelab: HardDrives,
  productivity: CheckSquare,
  developer: Code,
  utilities: Wrench,
  sports: Trophy,
  social: ChatCircle,
  other: PuzzlePiece,
};

interface ToolCardProps {
  tool: ToolIndexEntry;
  isInstalled?: boolean;
  onInstall: (tool: ToolIndexEntry) => void;
  onClick: (tool: ToolIndexEntry) => void;
}

export function ToolCard({ tool, isInstalled, onInstall, onClick }: ToolCardProps) {
  const t = useTranslations('Tools');

  const category = tool.category as ToolCategory;
  const iconStyles = CATEGORY_ICON_STYLES[category] || CATEGORY_ICON_STYLES.other;
  const IconComponent = CATEGORY_ICONS[category] || CATEGORY_ICONS.other;
  const tierLabel = TIER_LABELS[tool.tier] || tool.tier;
  const categoryLabel = CATEGORY_LABELS[category] || tool.category;

  // Registry icon URL (when tool.icon exists)
  const iconUrl = tool.icon
    ? `https://raw.githubusercontent.com/CoreWorxLab/caal-tools/main/icons/${tool.icon}`
    : null;

  return (
    <div
      onClick={() => onClick(tool)}
      className="group bg-surface-2 hover:shadow-primary/5 relative flex min-h-[340px] cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/10 transition-all duration-300 hover:shadow-xl"
    >
      {/* Watermark icon (faded, rotated) */}
      <div
        className={`pointer-events-none absolute -top-4 -right-4 opacity-[0.05] ${iconStyles.text}`}
        style={{ fontSize: '120px', transform: 'rotate(-15deg)' }}
      >
        {iconUrl ? (
          <Image src={iconUrl} alt="" width={120} height={120} unoptimized />
        ) : (
          <IconComponent className="h-[120px] w-[120px]" />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col p-6">
        {/* Header: Icon + Tier badge */}
        <div className="mb-4 flex items-start justify-between">
          {/* Icon - custom icons are larger with no bg, fallbacks get colored bg */}
          {iconUrl ? (
            <div className="flex h-12 w-12 items-center justify-center">
              <Image
                src={iconUrl}
                alt=""
                width={48}
                height={48}
                className="max-h-12 w-auto"
                unoptimized
              />
            </div>
          ) : (
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconStyles.bg}`}
            >
              <IconComponent className={`h-6 w-6 ${iconStyles.text}`} weight="fill" />
            </div>
          )}

          {/* Tier badge */}
          <span className="text-muted-foreground rounded border border-white/5 bg-white/5 px-2 py-1 text-[10px] font-bold tracking-wider uppercase">
            {tierLabel}
          </span>
        </div>

        {/* Category label */}
        <span className="text-muted-foreground mb-1 text-[10px] font-bold tracking-wider uppercase">
          {categoryLabel}
        </span>

        {/* Title */}
        <h3 className="group-hover:text-primary mb-2 text-lg font-bold transition-colors">
          {tool.friendlyName || tool.name.replace(/-/g, ' ')}
        </h3>

        {/* Description */}
        <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">{tool.description}</p>

        {/* Voice triggers */}
        {tool.voice_triggers.length > 0 && (
          <div className="mb-4 space-y-2">
            <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
              <Microphone className="h-3.5 w-3.5" />
              <span>{t('card.voiceTriggerLabel')}</span>
            </div>
            <div className="border-primary/20 bg-primary/10 text-primary rounded-lg border p-3 text-sm italic">
              &ldquo;{tool.voice_triggers[0]}&rdquo;
              {tool.voice_triggers.length > 1 && (
                <span className="text-muted-foreground ml-1 text-xs not-italic">
                  +{tool.voice_triggers.length - 1} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {tool.tags.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
            {tool.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-muted-foreground rounded-md border border-white/5 bg-white/5 px-2 py-0.5 text-[10px] font-semibold tracking-tight uppercase"
              >
                {tag}
              </span>
            ))}
            {tool.tags.length > 3 && (
              <span className="text-muted-foreground text-[10px]">+{tool.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Install button (full-width, outside content padding) */}
      {isInstalled ? (
        <div className="flex w-full items-center justify-center gap-2 bg-green-500/10 py-4 font-bold text-green-400">
          <CheckCircle className="h-5 w-5" weight="fill" />
          {t('card.installedBadge')}
        </div>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onInstall(tool);
          }}
          className="bg-primary-bg hover:bg-primary-bg/90 flex w-full items-center justify-center gap-2 py-4 font-bold text-white transition-colors"
        >
          <Plus className="h-5 w-5" weight="bold" />
          {t('card.installButton')}
        </button>
      )}
    </div>
  );
}
