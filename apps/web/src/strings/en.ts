/**
 * Setup Wizard & Area-Structured String Catalogue (§6.8, §6.10, §12.9, D-CONTRACT-1, D-HELP).
 */

import { EDITOR_STRINGS } from './admin/editor.js';
import { EDITOR_HELP } from './help/editor.js';
import {
  formatActionableError,
  formatCount,
  formatPlural,
  formatTitleWithCount,
} from './formatters.js';

export {
  EDITOR_STRINGS,
  EDITOR_HELP,
  formatActionableError,
  formatCount,
  formatPlural,
  formatTitleWithCount,
};

export const WIZARD_STRINGS = {
  header: {
    chip: 'Step {step} of 6 · First-Run Wizard',
    productName: 'The Living Portfolio',
    stepLabels: [
      '1. Account',
      '2. Hosting',
      '3. Providers',
      '4. Alerts',
      '5. Backups',
      '6. Walkthrough',
    ],
  },
  step1: {
    title: 'Owner Account Setup',
    subtitle: 'Initialize your private administrative account. The first-run wizard walks you through account creation, hosting presets, model providers, alerts, backups, and initial site authoring. You can change your username and password later in Settings › Account.',
    fields: {
      username: {
        label: 'Owner Username',
        help: 'The administrative username for logging into your portfolio. Used to authenticate to the admin workspace.',
      },
      password: {
        label: 'Master Password (min 12 chars)',
        help: 'Your master passphrase. Required alongside your authenticator code at sign in. Stored using argon2id.',
      },
      totpSecret: {
        label: 'Two-Factor Authenticator Seed (optional, generated if blank)',
        help: 'Optional base32 seed for your authenticator app. Leave blank to generate a secure random key automatically.',
      },
    },
    submitButton: 'Create Owner Account & Show Authenticator QR',
    enrolment: {
      title: 'Enrol Authenticator App',
      instructions: 'Scan this QR code with Google Authenticator, 1Password, or any standard authenticator app. Or enter the manual key below.',
      manualKeyLabel: 'Manual Key (Base32):',
      codeLabel: 'Enter 6-digit code to verify enrolment',
      verifyButton: 'Verify Code & Complete Setup',
    },
    credentials: {
      title: 'Emergency Recovery Credentials',
      instructions: 'Keep these emergency credentials in a safe place. If you lose access to your primary authenticator device, each recovery code can be used once to sign in.',
      totpKeyLabel: 'Authenticator Key (Base32)',
      totpKeyHelp: 'Use this key to set up a secondary authenticator app if your main device is replaced.',
      recoveryCodesLabel: 'Single-Use Recovery Codes',
      recoveryCodesHelp: 'Each code can only be used once. Once used, the server burns the hash and it cannot be reused.',
      gateLabel: 'I have safely downloaded or copied these recovery codes',
      continueButton: 'Continue to Step 2: Hosting Option & Presets',
    },
  },
  step2: {
    title: 'Step 2: Hosting Option & Presets',
    subtitle: 'Choose a hosting option matching your server infrastructure.',
    hostingPresets: [
      {
        value: 'hobbyist-docker',
        title: 'Home server or small VPS (Recommended)',
        sentence: 'Everything runs in one Docker stack you control. The simplest setup.',
        tradeoff: 'Best for single-server hobbyist deployments with bundled PostgreSQL.',
      },
      {
        value: 'private-local',
        title: 'Fully private',
        sentence: 'AI runs on your own machine and nothing is sent to outside services.',
        tradeoff: 'Best when privacy matters more than speed. Needs more local RAM and compute.',
      },
      {
        value: 'reliable-low-cost',
        title: 'Small server plus paid AI',
        sentence: 'Needs less hardware and gives better written answers.',
        tradeoff: 'Your text goes to the AI providers you choose, under their terms.',
      },
    ],
    originUrl: {
      label: 'Public Web Address',
      placeholder: 'https://portfolio.example.org',
      help: 'The address people will visit, for example https://yourname.com. Skip to try it on this computer. Sets your canonical URLs and security origin checks.',
    },
    backButton: 'Back',
    nextButton: 'Next: Model Providers',
  },
  step3: {
    title: 'Step 3: Model Providers & Privacy Boundary',
    subtitle: 'Configure model providers. The privacy boundary ensures confidential records never reach external services.',
    boundaryNotice: 'Privacy Boundary: When no external provider is configured, Ask gracefully degrades to honest extractive quotes.',
    keysNotice: 'Keys are added later in Settings > Providers; until then Ask shows direct quotes from entries.',
    providersTable: {
      headers: ['Provider', 'Data Classes Allowed', 'Default Model', 'Status'],
      rows: [
        {
          name: 'Local ONNX',
          classes: ['public', 'confidential'],
          model: 'bge-small-en-v1.5',
          status: '✓ Active (Local)',
          statusId: 'status-local',
          isLocal: true,
        },
        {
          name: 'OpenAI Compatible',
          classes: ['public only'],
          model: 'gpt-4o-mini',
          status: 'Optional',
          statusId: 'status-openai',
          isLocal: false,
        },
        {
          name: 'Anthropic',
          classes: ['public only'],
          model: 'claude-3-5-sonnet',
          status: 'Optional',
          statusId: 'status-anthropic',
          isLocal: false,
        },
        {
          name: 'Ollama',
          classes: ['public', 'internal'],
          model: 'llama3.3',
          status: 'Optional',
          statusId: 'status-ollama',
          isLocal: false,
        },
      ],
    },
    backButton: 'Back',
    nextButton: 'Next: Alerts & Notifications',
  },
  step4: {
    title: 'Step 4: Notifications & Alerts',
    subtitle: 'Configure alert delivery for visitor questions that need your personal review and daily budget updates.',
    channel: {
      label: 'Notification Channel',
      options: [
        { value: 'ntfy', label: 'ntfy (Push notifications)', help: 'A push notification on your phone through the free ntfy app. Best for instant alerts. Needs a topic name you choose.' },
        { value: 'email', label: 'Email (SMTP relay)', help: 'A message to an inbox you name, sent through your mail relay. Best if you check mail more than apps.' },
        { value: 'webhook', label: 'Webhook (HTTPS endpoint)', help: 'The site posts to a web address you control. Best for connecting your own tools.' },
        { value: 'telegram', label: 'Telegram Bot', help: 'A message from a bot you create. Best if you already live in Telegram.' },
      ],
    },
    target: {
      label: 'Topic or Target Address',
      placeholder: 'living-portfolio-alerts',
      help: 'Topic name for ntfy, destination email address, or webhook endpoint URL.',
    },
    testButton: 'Test Delivery Notification',
    testDisabledReason: "Test alerts aren't available in this version yet.",
    backButton: 'Back',
    nextButton: 'Next: Encrypted Backups',
  },
  step5: {
    title: 'Step 5: Encrypted Backup Destination',
    subtitle: 'Set up automated database dumps with age asymmetric encryption. Runs the first backup and a test restore.',
    destination: {
      label: 'Backup Destination',
      options: [
        { value: 'local', label: 'Local Storage (./data/backups)' },
        { value: 's3', label: 'S3 / MinIO Compatible Bucket' },
        { value: 'git', label: 'Private Git Repository Archive' },
      ],
    },
    folder: {
      label: 'Backup Directory / Folder',
      placeholder: './data/backups',
      help: 'Directory path for storing backup archives.',
    },
    ageKey: {
      label: 'age Recipient Public Key (optional)',
      placeholder: 'age1...',
      help: 'Recipient public key to encrypt backup archives before writing to storage.',
    },
    drillButton: 'Run Restore Verification Drill',
    drillDisabledReason: 'Not available until a backup folder is set',
    backButton: 'Back',
    nextButton: 'Next: Theme & Walkthrough',
  },
  step6: {
    title: 'Step 6: Theme & First-Run Walkthrough',
    subtitle: 'Select your typographic theme and review the entry structure model.',
    themeAppliedNotice: "Your choice is saved. It isn't applied to your public site yet. You'll be able to apply it in Theme.",
    themePresets: [
      {
        value: 'editorial-classic',
        title: 'Editorial Classic',
        description: 'Warm serif, high contrast, literary reading cadence.',
      },
      {
        value: 'modern-monospace',
        title: 'Modern Monospace',
        description: 'Technical grid, tabular numbers, precise terminal rhythm.',
      },
      {
        value: 'minimalist-sans',
        title: 'Minimalist Sans',
        description: 'Clean grotesque, monochrome balance, high density.',
      },
    ],
    workedExample: {
      title: 'Worked Example: Case Study',
      lead: 'In The Living Portfolio, writing is structured into actionable claims:',
      claims: [
        { label: 'Problem / Context', text: 'Scaling payment reconciliation under traffic spikes.' },
        { label: 'Intervention', text: 'Implemented idempotent bisimulation engine.' },
        { label: 'Outcome (Worked)', text: 'Reduced data inconsistencies by 99.4%.' },
        { label: 'Lesson', text: 'Never decouple transaction time from event time.' },
      ],
      closing: 'Now try one of yours — create your first case study or launch the Import Planner to stage twenty existing documents.',
    },
    deployNotice: 'The static reading site is automatically compiled and deployed on completion.',
    finishButton: 'Go to your dashboard',
    importButton: 'Import writing you already have',
    backButton: 'Back to Backups',
  },
} as const;

export const STRINGS = {
  admin: {
    editor: EDITOR_STRINGS,
    setup: WIZARD_STRINGS,
  },
  help: {
    editor: EDITOR_HELP,
  },
} as const;
