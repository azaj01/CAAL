'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowClockwise, Warning } from '@phosphor-icons/react/dist/ssr';
import { type SanitizationResult, sanitizeWorkflow } from '@/lib/workflow-sanitizer';
import type { ToolIndexEntry } from '@/types/tools';
import { InstalledToolRow } from './installed-tool-row';
import { ToolDetailModal } from './tool-detail-modal';
import { WorkflowDetailModal } from './workflow-detail-modal';
import { WorkflowSubmissionDialog } from './workflow-submission-dialog';

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

interface InstalledToolsViewProps {
  registryTools: ToolIndexEntry[];
  n8nEnabled: boolean;
  searchQuery?: string;
}

export function InstalledToolsView({
  registryTools,
  n8nEnabled,
  searchQuery = '',
}: InstalledToolsViewProps) {
  const t = useTranslations('Tools');
  const tCommon = useTranslations('Common');
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([]);
  const [n8nBaseUrl, setN8nBaseUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittingWorkflow, setSubmittingWorkflow] = useState<N8nWorkflow | null>(null);
  const [sanitizationResult, setSanitizationResult] = useState<SanitizationResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formUrl, setFormUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolIndexEntry | null>(null);
  const [selectedToolStatus, setSelectedToolStatus] = useState<WorkflowStatus | null>(null);
  const [selectedToolWorkflowId, setSelectedToolWorkflowId] = useState<string | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<N8nWorkflow | null>(null);

  const fetchWorkflows = useCallback(async () => {
    if (!n8nEnabled) {
      setError(t('installed.n8nDisabled'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/tools/n8n-workflows');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch workflows');
      }

      const data = await res.json();
      setWorkflows(data.workflows || []);
      setN8nBaseUrl(data.n8n_base_url || '');
    } catch (err) {
      console.error('Failed to fetch n8n workflows:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch workflows');
    } finally {
      setLoading(false);
    }
  }, [n8nEnabled]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const getWorkflowStatus = useCallback(
    (workflow: N8nWorkflow): WorkflowStatus => {
      const registryId = workflow.caal_registry_id;
      const registryVersion = workflow.caal_registry_version;

      if (!registryId) {
        // No registry ID = custom workflow
        return { type: 'custom' };
      }

      const registryTool = registryTools.find((t) => t.id === registryId);

      if (!registryTool) {
        // ID not found in registry (tool removed?) - treat as custom
        return { type: 'custom' };
      }

      if (registryVersion === registryTool.version) {
        return { type: 'registry', upToDate: true };
      }

      // Version mismatch = update available
      return {
        type: 'registry',
        upToDate: false,
        currentVersion: registryVersion || 'unknown',
        latestVersion: registryTool.version,
      };
    },
    [registryTools]
  );

  const handleShare = useCallback(async (workflow: N8nWorkflow) => {
    setSubmitError(null);

    try {
      // Fetch full workflow JSON (includes credentials)
      const res = await fetch(`/api/tools/n8n-workflow/${workflow.id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch workflow');
      }

      const { workflow: fullWorkflow } = await res.json();

      // Sanitize workflow locally
      const result = sanitizeWorkflow(fullWorkflow);

      console.log('Sanitization result:', result);
      console.log('Detected credentials:', result.detected.credentials);
      console.log('Detected variables:', result.detected.variables);

      // Show confirmation dialog
      setSubmittingWorkflow(workflow);
      setSanitizationResult(result);
    } catch (err) {
      console.error('Share error:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to prepare workflow');
    }
  }, []);

  const handleConfirmSubmission = useCallback(async () => {
    if (!submittingWorkflow || !sanitizationResult) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Strip private data before sending to VPS (privacy)
      const detectedForApi = {
        ...sanitizationResult.detected,
        // Strip displayHint from variables
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        variables: sanitizationResult.detected.variables.map(({ displayHint, ...rest }) => rest),
        // Replace original credential names with variable names (privacy + consistency)
        credentials: sanitizationResult.detected.credentials.map((c) => ({
          credential_type: c.credential_type,
          name: c.credential_type.toUpperCase() + '_CREDENTIAL',
        })),
      };

      // POST to VPS
      const response = await fetch('https://registry.caal.io/api/submit/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow: sanitizationResult.sanitized,
          detected: detectedForApi,
          metadata: {
            installed_name: submittingWorkflow.name,
            n8n_workflow_id: submittingWorkflow.id,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Submission failed' }));
        throw new Error(errorData.detail || errorData.error || 'Submission failed');
      }

      const { form_url } = await response.json();

      // Try to open submission form in new tab
      const popup = window.open(form_url, '_blank');

      // Show success state with link (in case popup was blocked)
      setSubmitError(null);
      setFormUrl(form_url);
      setIsSubmitting(false);

      // If popup opened successfully, close dialog after short delay
      if (popup && !popup.closed) {
        setTimeout(() => {
          setSubmittingWorkflow(null);
          setSanitizationResult(null);
          setFormUrl(null);
        }, 1500);
      }
      // If popup blocked, dialog stays open showing the link
    } catch (err) {
      console.error('Submission error:', err);
      setSubmitError(err instanceof Error ? err.message : 'Submission failed');
      setIsSubmitting(false);
    }
  }, [submittingWorkflow, sanitizationResult]);

  const handleCancelSubmission = useCallback(() => {
    setSubmittingWorkflow(null);
    setSanitizationResult(null);
    setSubmitError(null);
    setFormUrl(null);
  }, []);

  const handleRowClick = useCallback(
    (workflow: N8nWorkflow) => {
      // Use registry ID to find matching registry tool
      const registryId = workflow.caal_registry_id;
      const matchingTool = registryId ? registryTools.find((tool) => tool.id === registryId) : null;

      if (matchingTool) {
        // Show registry tool detail modal with installed status
        setSelectedTool(matchingTool);
        setSelectedToolStatus(getWorkflowStatus(workflow));
        setSelectedToolWorkflowId(workflow.id);
      } else {
        // Show custom workflow detail modal
        setSelectedWorkflow(workflow);
      }
    },
    [registryTools, getWorkflowStatus]
  );

  // Filter and sort workflows
  const filteredWorkflows = useMemo(() => {
    let result = [...workflows];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((workflow) => workflow.name.toLowerCase().includes(query));
    }

    // Sort alphabetically by name (A-Z)
    result.sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }, [workflows, searchQuery]);

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <ArrowClockwise className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-muted-foreground mt-4">{t('installed.loading')}</p>
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
          onClick={fetchWorkflows}
          className="bg-muted hover:bg-muted/80 mt-4 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          {tCommon('retry')}
        </button>
      </div>
    );
  }

  // Empty state (no workflows at all)
  if (workflows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">{t('installed.emptyState')}</p>
      </div>
    );
  }

  // No results from search
  if (filteredWorkflows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">
          {t('installed.noSearchResults', { query: searchQuery })}
        </p>
      </div>
    );
  }

  // Workflow list
  return (
    <>
      <div className="flex flex-col gap-2">
        {filteredWorkflows.map((workflow) => {
          const registryId = workflow.caal_registry_id;
          const matchingTool = registryId
            ? registryTools.find((tool) => tool.id === registryId)
            : null;

          return (
            <InstalledToolRow
              key={workflow.id}
              workflow={workflow}
              registryTool={matchingTool ?? null}
              status={getWorkflowStatus(workflow)}
              onShare={handleShare}
              onClick={handleRowClick}
            />
          );
        })}
      </div>

      {/* Tool detail modal (for registry tools) */}
      {selectedTool && (
        <ToolDetailModal
          tool={selectedTool}
          onClose={() => {
            setSelectedTool(null);
            setSelectedToolStatus(null);
            setSelectedToolWorkflowId(null);
          }}
          onInstall={() => {}}
          n8nEnabled={n8nEnabled}
          installedStatus={
            selectedToolStatus?.type === 'registry'
              ? {
                  version: selectedToolStatus.upToDate
                    ? selectedTool.version
                    : selectedToolStatus.currentVersion,
                  upToDate: selectedToolStatus.upToDate,
                  workflowId: selectedToolWorkflowId ?? undefined,
                  n8nBaseUrl: n8nBaseUrl || undefined,
                }
              : undefined
          }
        />
      )}

      {/* Workflow detail modal (for custom workflows) */}
      {selectedWorkflow && (
        <WorkflowDetailModal
          workflow={selectedWorkflow}
          n8nBaseUrl={n8nBaseUrl}
          onClose={() => setSelectedWorkflow(null)}
          onShare={(workflow) => {
            setSelectedWorkflow(null);
            handleShare(workflow);
          }}
        />
      )}

      {/* Submission dialog */}
      {submittingWorkflow && sanitizationResult && (
        <WorkflowSubmissionDialog
          workflow={submittingWorkflow}
          result={sanitizationResult}
          error={submitError}
          isSubmitting={isSubmitting}
          formUrl={formUrl}
          onConfirm={handleConfirmSubmission}
          onCancel={handleCancelSubmission}
        />
      )}
    </>
  );
}
