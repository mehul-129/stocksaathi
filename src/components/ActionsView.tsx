import React from 'react';
import { CheckCircle2, ClipboardCheck, Info } from 'lucide-react';
import type {
  ActionDecision,
  ActionUserState,
  GeneratedAction,
  PreviousMonthAction,
} from '../types/inventory';
import { formatRs } from '../utils/formatters';

interface ActionsViewProps {
  actions: GeneratedAction[];
  actionOverrides: Record<string, ActionUserState>;
  onUpdateActionOverride: (actionId: string, patch: Partial<ActionUserState>) => void;
  previousActions: PreviousMonthAction[];
  onTogglePreviousAction: (prevId: string) => void;
}

const DECISIONS: { value: ActionDecision; label: string }[] = [
  { value: 'accepted', label: 'Accepted' },
  { value: 'changed', label: 'Changed' },
  { value: 'rejected', label: 'Rejected' },
];

export function ActionsView({
  actions,
  actionOverrides,
  onUpdateActionOverride,
  previousActions,
  onTogglePreviousAction,
}: ActionsViewProps) {
  const completedCount = previousActions.filter((a) => a.done).length;

  return (
    <div className="space-y-6">
      {/* Intro & Honesty Notice */}
      <div className="bg-white border border-[#DFE4DC] rounded-xl p-4 sm:p-5 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <h2 className="font-display text-xl font-semibold text-[#17211B]">
            Three actions for this month
          </h2>
          <p className="text-sm text-[#526057]">
            Ranked by cash tied up (not profit lost) across slow stock, high-margin stock gaps, and near-expiry perishables. Discuss and agree on the owner action during the 30-minute shop visit.
          </p>
        </div>

        <div className="bg-[#EEF4EE] border border-[#C6D8C8] rounded-lg px-4 py-2.5 text-sm">
          <div className="text-xs text-[#344C3B]">Actions completed last month</div>
          <div className="font-mono tabular-nums text-lg font-bold text-[#14532D]">
            {completedCount} of {previousActions.length}
          </div>
          <div className="text-[11px] font-medium text-[#526057] mt-0.5">
            Demo value, no history yet
          </div>
        </div>
      </div>

      {/* Top 3 Actions */}
      <div className="space-y-4">
        {actions.map((action, index) => {
          const userState: ActionUserState = actionOverrides[action.id] ?? {
            ownerAction: '',
            decision: 'pending',
            note: '',
          };

          return (
            <section
              key={action.id}
              aria-labelledby={`action-heading-${action.id}`}
              className="bg-white border border-[#DFE4DC] rounded-xl p-5 space-y-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#EDF1EB] pb-3.5">
                <div className="space-y-1 max-w-2xl">
                  <div className="text-xs font-semibold text-[#14532D]">
                    Priority {index + 1} · {action.label}
                  </div>
                  <h3
                    id={`action-heading-${action.id}`}
                    className="font-display text-lg font-semibold text-[#17211B]"
                  >
                    {action.description}
                  </h3>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <div className="text-xs text-[#526057]">Cash tied up (not profit lost)</div>
                  <div className="font-mono tabular-nums text-xl font-bold text-[#B45309]">
                    {formatRs(action.rupeesAtStake)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-6">
                  <label
                    htmlFor={`owner-action-${action.id}`}
                    className="block text-xs font-semibold text-[#313D35] mb-1.5"
                  >
                    Owner action (filled with shopkeeper)
                  </label>
                  <input
                    id={`owner-action-${action.id}`}
                    type="text"
                    value={userState.ownerAction}
                    onChange={(e) =>
                      onUpdateActionOverride(action.id, { ownerAction: e.target.value })
                    }
                    placeholder="e.g. I will reduce biscuit order to half next week"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#CFD7CC] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#14532D]"
                  />
                </div>

                <div className="lg:col-span-6">
                  <div className="text-xs font-semibold text-[#313D35] mb-1.5">
                    Shopkeeper decision
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {DECISIONS.map((opt) => {
                      const isChecked = userState.decision === opt.value;
                      return (
                        <label
                          key={opt.value}
                          className={`min-h-[44px] px-3.5 py-2 rounded-lg border text-sm font-medium inline-flex items-center gap-2 cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-[#14532D] border-[#14532D] text-white'
                              : 'bg-white border-[#CFD7CC] text-[#313D35] hover:bg-[#F3F6F1]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              onUpdateActionOverride(action.id, {
                                decision: isChecked ? 'pending' : opt.value,
                              })
                            }
                            className="sr-only"
                          />
                          <span>{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:col-span-12">
                  <label
                    htmlFor={`action-note-${action.id}`}
                    className="block text-xs font-medium text-[#526057] mb-1"
                  >
                    Short note
                  </label>
                  <input
                    id={`action-note-${action.id}`}
                    type="text"
                    value={userState.note}
                    onChange={(e) =>
                      onUpdateActionOverride(action.id, { note: e.target.value })
                    }
                    placeholder="Optional note from the 30-minute meeting..."
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#E2E7DF] bg-[#FAFBF9] text-[15px]"
                  />
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Advisory Guardrail */}
      <div className="bg-[#FAFBF9] border border-[#DFE4DC] rounded-xl p-4 flex items-start gap-3 text-sm text-[#425046]">
        <Info className="w-4 h-4 text-[#14532D] shrink-0 mt-0.5" aria-hidden="true" />
        <p>
          These actions use simple stock-speed and margin rules, not certainty. Keep regular daily fast-moving stock flowing and verify distributor terms before returning goods.
        </p>
      </div>

      {/* Previous Month's Actions Tracker */}
      <section
        aria-labelledby="prev-actions-heading"
        className="bg-white border border-[#DFE4DC] rounded-xl p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDF1EB] pb-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-[#14532D]" aria-hidden="true" />
            <h3 id="prev-actions-heading" className="font-display text-lg font-semibold text-[#17211B]">
              Previous month’s actions
            </h3>
          </div>
          <span className="text-sm font-medium text-[#14532D] tabular-nums">
            {completedCount} of {previousActions.length} marked done · Demo value, no history yet
          </span>
        </div>

        {previousActions.length === 0 ? (
          <p className="text-sm text-[#526057]">No previous month actions logged yet.</p>
        ) : (
          <div className="divide-y divide-[#EDF1EB]">
            {previousActions.map((prev) => (
              <label
                key={prev.id}
                className="py-3.5 flex items-start gap-3.5 cursor-pointer min-h-[44px]"
              >
                <input
                  type="checkbox"
                  checked={prev.done}
                  onChange={() => onTogglePreviousAction(prev.id)}
                  className="mt-1 w-5 h-5 accent-[#14532D] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`text-[15px] font-medium ${
                        prev.done ? 'line-through text-[#6B776F]' : 'text-[#17211B]'
                      }`}
                    >
                      {prev.description}
                    </span>
                    <span className="font-mono tabular-nums text-sm font-semibold text-[#425046]">
                      {formatRs(prev.rupeesAtStake)}
                    </span>
                  </div>
                  <div className="text-xs text-[#526057] mt-1 flex items-center gap-2">
                    <span>{prev.monthLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span>Owner plan: {prev.ownerAction}</span>
                    {prev.done && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 text-[#15803D] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          Done
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
