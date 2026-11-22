import { escapeHtml } from '../lib/html.js';

export type StructureStage = 'Captured' | 'Tagged' | 'Claimed' | 'Grounded';

export const STRUCTURE_STAGES: readonly StructureStage[] = [
  'Captured',
  'Tagged',
  'Claimed',
  'Grounded',
];

export interface LevelProps {
  id?: string;
  current: StructureStage;
  nextStep?: string;
  className?: string;
}

/**
 * Read-only 4-segment Level progress bar (D-FINAL #18):
 * Captured, Tagged, Claimed, Grounded (12px caption). Done segments filled,
 * current label in 600, upcoming muted. Not clickable, not focusable.
 */
export function renderLevel(props: LevelProps): string {
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const classes = ['lp-level', props.className].filter(Boolean).join(' ');
  const currentIndex = Math.max(0, STRUCTURE_STAGES.indexOf(props.current));

  const segmentsHtml = STRUCTURE_STAGES.map((stage, idx) => {
    const isDone = idx <= currentIndex;
    const isCurrent = idx === currentIndex;
    const segClass = [
      'lp-level-segment',
      isDone ? 'is-done' : 'is-upcoming',
      isCurrent ? 'is-current' : '',
    ]
      .filter(Boolean)
      .join(' ');
    return `<div class="${segClass}"><div class="lp-level-bar-fill"></div><span class="lp-level-label">${escapeHtml(stage)}</span></div>`;
  }).join('');

  const nextHtml = props.nextStep
    ? `<p class="lp-level-next lp-description">${escapeHtml(props.nextStep)}</p>`
    : '';

  return `<div${idAttr} data-c="Stepper" class="${escapeHtml(classes)}" data-current-level="${escapeHtml(props.current)}">
  <div class="lp-level-bar" role="img" aria-readonly="true" aria-label="Structure level: ${escapeHtml(props.current)} (${currentIndex + 1} of 4)">${segmentsHtml}</div>
  ${nextHtml}
</div>`;
}
