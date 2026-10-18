import type { RoleProfile } from '../types/index.js';

export const CASE_STUDY_PROFILE: RoleProfile = {
  id: 'case-study',
  label: 'Case study',
  roles: [
    { id: 'goal', label: 'The goal', prompt: 'What were you trying to achieve, and why?' },
    { id: 'approach', label: 'What I did', prompt: 'What did you actually do?' },
    { id: 'friction', label: 'What got in the way', prompt: 'What went wrong, got hard, or surprised you?' },
    { id: 'decision', label: 'The decision', prompt: 'What did you choose, and what did you rule out?', claim_bearing: true },
    { id: 'outcome', label: 'What happened', prompt: 'What was the result?', claim_bearing: true, structured: 'outcome_status' },
    { id: 'lesson', label: "What I'd tell someone else", prompt: 'What would you tell someone facing this, and when would it not apply?', claim_bearing: true },
  ],
  evidence: 'attachments',
  context: 'facets',
  minimum_for_L2: [
    ['friction', 'goal'],
    ['decision', 'lesson', 'outcome'],
  ],
};

export const DECISION_RECORD_PROFILE: RoleProfile = {
  id: 'decision-record',
  label: 'Decision record',
  roles: [
    { id: 'context', label: 'Context', prompt: 'What was the situation and context?' },
    { id: 'options', label: 'Options considered', prompt: 'What options and alternatives did you evaluate?' },
    { id: 'decision', label: 'Decision', prompt: 'What choice was made?', claim_bearing: true },
    { id: 'consequences', label: 'Consequences', prompt: 'What are the pros, cons, and side effects?', claim_bearing: true, structured: 'outcome_status' },
    { id: 'lesson', label: 'Key takeaway', prompt: 'What was learned from this decision?', claim_bearing: true },
  ],
  evidence: 'attachments',
  context: 'facets',
  minimum_for_L2: [
    ['context', 'options'],
    ['decision', 'consequences'],
  ],
};

export const DESIGN_PROJECT_PROFILE: RoleProfile = {
  id: 'design-project',
  label: 'Design project',
  roles: [
    { id: 'brief', label: 'The brief', prompt: 'What was the design problem or user need?' },
    { id: 'exploration', label: 'Exploration', prompt: 'What concepts and directions were explored?' },
    { id: 'critique', label: 'Critique & feedback', prompt: 'What critique shaped the direction?' },
    { id: 'iteration', label: 'Iteration', prompt: 'How did the designs evolve?' },
    { id: 'final', label: 'Final design', prompt: 'What was the shipped solution?' },
    { id: 'impact', label: 'Impact', prompt: 'How did users react or metrics change?', claim_bearing: true, structured: 'outcome_status' },
    { id: 'lesson', label: 'Design principle', prompt: 'What principle emerged from this work?', claim_bearing: true },
  ],
  evidence: 'attachments',
  context: 'facets',
  minimum_for_L2: [
    ['brief', 'exploration'],
    ['final', 'impact'],
  ],
};

export const RESEARCH_NOTE_PROFILE: RoleProfile = {
  id: 'research-note',
  label: 'Research note',
  roles: [
    { id: 'question', label: 'Research question', prompt: 'What question were you investigating?' },
    { id: 'method', label: 'Methodology', prompt: 'How did you collect and analyze information?' },
    { id: 'finding', label: 'Finding', prompt: 'What did the evidence show?', claim_bearing: true },
    { id: 'limitation', label: 'Limitations', prompt: 'What were the boundary conditions or caveats?' },
    { id: 'lesson', label: 'Open questions & implications', prompt: 'What does this mean for future work?', claim_bearing: true },
  ],
  evidence: 'attachments',
  context: 'facets',
  minimum_for_L2: [
    ['question', 'method'],
    ['finding', 'lesson'],
  ],
};

export const HOW_TO_PROFILE: RoleProfile = {
  id: 'how-to',
  label: 'How-to',
  roles: [
    { id: 'goal', label: 'Goal', prompt: 'What will this guide help someone accomplish?' },
    { id: 'steps', label: 'Steps', prompt: 'What sequence of actions is required?' },
    { id: 'pitfall', label: 'Common pitfalls', prompt: 'What traps or gotchas should they avoid?' },
    { id: 'result', label: 'Expected result', prompt: 'How do you verify it worked?', claim_bearing: true, structured: 'outcome_status' },
  ],
  evidence: 'attachments',
  context: 'facets',
  minimum_for_L2: [
    ['goal'],
    ['steps', 'result'],
  ],
};

export const FREEFORM_PROFILE: RoleProfile = {
  id: 'freeform',
  label: 'Freeform',
  roles: [],
  minimum_for_L2: [],
};

export const BUILTIN_PROFILES: Record<string, RoleProfile> = {
  'case-study': CASE_STUDY_PROFILE,
  'decision-record': DECISION_RECORD_PROFILE,
  'design-project': DESIGN_PROJECT_PROFILE,
  'research-note': RESEARCH_NOTE_PROFILE,
  'how-to': HOW_TO_PROFILE,
  'freeform': FREEFORM_PROFILE,
};

export function getProfile(id: string): RoleProfile {
  return BUILTIN_PROFILES[id] || BUILTIN_PROFILES['case-study'];
}
