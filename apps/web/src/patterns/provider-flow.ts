import {
  renderActionBar,
  renderChoiceGroup,
  renderField,
  renderStack,
  renderStepper,
  type ChoiceOption,
} from '../primitives/index.js';

export type ProviderId = 'local' | 'openai' | 'anthropic' | 'ollama';

export interface ProviderMeta {
  id: ProviderId;
  label: string;
  description: string;
  dataNote: string;
  models: string[];
  requiresKey: boolean;
}

export const PROVIDERS_CATALOG: readonly ProviderMeta[] = [
  {
    id: 'local',
    label: 'Local only',
    description: 'Quotes directly from your entries with no external AI calls.',
    dataNote: 'Data handling: stays on this server.',
    models: [],
    requiresKey: false,
  },
  {
    id: 'openai',
    label: 'OpenAI Compatible',
    description: 'Uses OpenAI or any compatible chat completions endpoint.',
    dataNote: 'Data handling: sends retrieved excerpts to your configured endpoint.',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini'],
    requiresKey: true,
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    description: 'Uses Anthropic Claude models for grounded synthesis.',
    dataNote: 'Data handling: sends retrieved excerpts to Anthropic.',
    models: ['claude-3-5-haiku-latest', 'claude-3-7-sonnet-latest'],
    requiresKey: true,
  },
  {
    id: 'ollama',
    label: 'Ollama',
    description: 'Connects to a self-hosted Ollama server.',
    dataNote: 'Data handling: stays on your Ollama host.',
    models: ['llama3.2', 'qwen2.5', 'mistral'],
    requiresKey: false,
  },
];

export interface ProviderFlowProps {
  step: 1 | 2 | 3;
  selectedProvider: ProviderId;
  selectedModel?: string;
  errorMessage?: string;
  stepPrefix?: string;
  hideStepper?: boolean;
  hidePrimaryWhenLocal?: boolean;
}

/**
 * Shared 3-step Wizard flow for Providers (D-FINAL #19, D-PROV) and Setup Step 3.
 */
export function renderProviderFlow(props: ProviderFlowProps): string {
  const provider = PROVIDERS_CATALOG.find((p) => p.id === props.selectedProvider) ?? PROVIDERS_CATALOG[0];
  const totalSteps = provider.requiresKey ? 3 : 2;
  const stepNames: Record<number, string> = {
    1: 'Provider',
    2: 'Model',
    3: 'Key',
  };

  const stepperHtml = props.hideStepper
    ? ''
    : renderStepper({
        id: 'lp-provider-stepper',
        currentStep: Math.min(props.step, totalSteps),
        totalSteps,
        stepTitle: stepNames[props.step],
      });

  if (props.step === 1) {
    const options: ChoiceOption[] = PROVIDERS_CATALOG.map((p) => ({
      id: `provider-opt-${p.id}`,
      value: p.id,
      label: p.label,
      description: `${p.description} ${p.dataNote}`,
      checked: p.id === props.selectedProvider,
    }));
    const choiceHtml = renderChoiceGroup({
      id: 'lp-provider-choice',
      name: 'provider',
      mode: 'single',
      variant: 'card',
      options,
    });
    const actionsHtml =
      props.hidePrimaryWhenLocal && props.selectedProvider === 'local'
        ? ''
        : renderActionBar({
            primary: { id: 'lp-provider-next', label: 'Next', variant: 'primary', type: 'button' },
          });
    return renderStack({ gap: 'group', childrenHtml: `${stepperHtml}${choiceHtml}${actionsHtml}` });
  }

  if (props.step === 2) {
    const modelField =
      provider.models.length > 0
        ? renderField({
            kind: 'select',
            id: 'lp-provider-model',
            name: 'model',
            label: 'Model',
            value: props.selectedModel ?? provider.models[0],
            options: provider.models.map((m) => ({ value: m, label: m })),
            help: 'Choose the model used for answering.',
          })
        : renderField({
            kind: 'input',
            id: 'lp-provider-model',
            name: 'model',
            label: 'Model',
            value: props.selectedModel ?? '',
            placeholder: 'Enter model name',
            help: 'Leave blank for extractive local quotes only.',
          });

    const actionsHtml = renderActionBar({
      primary: {
        id: provider.requiresKey ? 'lp-provider-next' : 'lp-provider-save',
        label: provider.requiresKey ? 'Next' : 'Save',
        variant: 'primary',
        type: 'button',
      },
    });
    return renderStack({ gap: 'group', childrenHtml: `${stepperHtml}${modelField}${actionsHtml}` });
  }

  const keyField = renderField({
    kind: 'input',
    inputType: 'password',
    id: 'lp-provider-key',
    name: 'apiKey',
    label: 'API key',
    placeholder: 'Paste key',
    help: 'Write-only: stored encrypted and never shown again.',
    error: props.errorMessage,
    attributes: 'autocomplete="off"',
  });
  const actionsHtml = renderActionBar({
    primary: { id: 'lp-provider-test-save', label: 'Test and save', variant: 'primary', type: 'button' },
  });
  return renderStack({ gap: 'group', childrenHtml: `${stepperHtml}${keyField}${actionsHtml}` });
}
