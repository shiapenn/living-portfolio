import type { NotificationChannel, AlertPayload } from './index.js';

/**
 * Concrete Notification Channels (§13.9, §14: ntfy, Telegram, Webhook, Email)
 */

export interface NtfyConfig {
  topicUrl?: string;
  topic?: string;
  serverUrl?: string;
  token?: string;
  fetchFn?: typeof fetch;
}

export class NtfyNotificationChannel implements NotificationChannel {
  public readonly id = 'ntfy';
  public readonly name = 'ntfy Push Notifications';

  private endpoint: string;
  private token?: string;
  private fetchFn: typeof fetch;

  constructor(config: NtfyConfig) {
    this.endpoint = config.topicUrl || `${config.serverUrl || 'https://ntfy.sh'}/${config.topic || 'living-portfolio-alerts'}`;
    this.token = config.token;
    this.fetchFn = config.fetchFn || (globalThis.fetch ? globalThis.fetch.bind(globalThis) : async () => ({} as any));
  }

  async send(alert: AlertPayload): Promise<{ delivered: boolean; timestamp: string }> {
    const timestamp = new Date().toISOString();
    const priority = alert.severity === 'critical' ? 'urgent' : alert.severity === 'warning' ? 'high' : 'default';

    const headers: Record<string, string> = {
      Title: alert.title,
      Priority: priority,
      Tags: alert.severity === 'critical' ? 'rotating_light' : alert.severity === 'warning' ? 'warning' : 'information_source',
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const res = await this.fetchFn(this.endpoint, {
        method: 'POST',
        headers,
        body: alert.message,
      });
      return { delivered: res.ok !== false, timestamp };
    } catch {
      return { delivered: false, timestamp };
    }
  }

  async test(): Promise<{ ok: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      const res = await this.send({
        title: 'Portfolio Test Alert',
        message: 'Notification channel test verification.',
        severity: 'info',
      });
      return { ok: res.delivered, latencyMs: Date.now() - start };
    } catch {
      return { ok: false, latencyMs: Date.now() - start };
    }
  }
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  fetchFn?: typeof fetch;
}

export class TelegramNotificationChannel implements NotificationChannel {
  public readonly id = 'telegram';
  public readonly name = 'Telegram Bot Notifications';

  private botToken: string;
  private chatId: string;
  private fetchFn: typeof fetch;

  constructor(config: TelegramConfig) {
    this.botToken = config.botToken;
    this.chatId = config.chatId;
    this.fetchFn = config.fetchFn || (globalThis.fetch ? globalThis.fetch.bind(globalThis) : async () => ({} as any));
  }

  async send(alert: AlertPayload): Promise<{ delivered: boolean; timestamp: string }> {
    const timestamp = new Date().toISOString();
    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
    const text = `*${alert.title}* [${alert.severity.toUpperCase()}]\n\n${alert.message}${alert.link ? `\n\nLink: ${alert.link}` : ''}`;

    try {
      const res = await this.fetchFn(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text,
          parse_mode: 'Markdown',
        }),
      });
      return { delivered: res.ok !== false, timestamp };
    } catch {
      return { delivered: false, timestamp };
    }
  }

  async test(): Promise<{ ok: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      const url = `https://api.telegram.org/bot${this.botToken}/getMe`;
      const res = await this.fetchFn(url);
      return { ok: res.ok !== false, latencyMs: Date.now() - start };
    } catch {
      return { ok: false, latencyMs: Date.now() - start };
    }
  }
}

export interface WebhookConfig {
  url: string;
  secret?: string;
  fetchFn?: typeof fetch;
}

export class WebhookNotificationChannel implements NotificationChannel {
  public readonly id = 'webhook';
  public readonly name = 'Generic Webhook Channel';

  private url: string;
  private secret?: string;
  private fetchFn: typeof fetch;

  constructor(config: WebhookConfig) {
    this.url = config.url;
    this.secret = config.secret;
    this.fetchFn = config.fetchFn || (globalThis.fetch ? globalThis.fetch.bind(globalThis) : async () => ({} as any));
  }

  async send(alert: AlertPayload): Promise<{ delivered: boolean; timestamp: string }> {
    const timestamp = new Date().toISOString();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.secret) {
      headers['X-Portfolio-Secret'] = this.secret;
    }

    try {
      const res = await this.fetchFn(this.url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          event: 'portfolio_alert',
          alert,
          timestamp,
        }),
      });
      return { delivered: res.ok !== false, timestamp };
    } catch {
      return { delivered: false, timestamp };
    }
  }

  async test(): Promise<{ ok: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      const res = await this.send({
        title: 'Webhook Ping Test',
        message: 'Ping verification test event',
        severity: 'info',
      });
      return { ok: res.delivered, latencyMs: Date.now() - start };
    } catch {
      return { ok: false, latencyMs: Date.now() - start };
    }
  }
}

export interface EmailConfig {
  to: string;
  from?: string;
  sendFn?: (msg: { to: string; from: string; subject: string; body: string }) => Promise<boolean>;
}

export class EmailNotificationChannel implements NotificationChannel {
  public readonly id = 'email';
  public readonly name = 'Email Notification Channel';

  private to: string;
  private from: string;
  private sendFn: (msg: { to: string; from: string; subject: string; body: string }) => Promise<boolean>;

  constructor(config: EmailConfig) {
    this.to = config.to;
    this.from = config.from || 'portfolio@localhost';
    this.sendFn = config.sendFn || (async () => true);
  }

  async send(alert: AlertPayload): Promise<{ delivered: boolean; timestamp: string }> {
    const timestamp = new Date().toISOString();
    try {
      const delivered = await this.sendFn({
        to: this.to,
        from: this.from,
        subject: `[Portfolio Alert] ${alert.title}`,
        body: `${alert.message}\n\nSeverity: ${alert.severity}\nTime: ${timestamp}`,
      });
      return { delivered, timestamp };
    } catch {
      return { delivered: false, timestamp };
    }
  }

  async test(): Promise<{ ok: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      const delivered = await this.sendFn({
        to: this.to,
        from: this.from,
        subject: '[Portfolio Test] Ping',
        body: 'Email notification test ping.',
      });
      return { ok: delivered, latencyMs: Date.now() - start };
    } catch {
      return { ok: false, latencyMs: Date.now() - start };
    }
  }
}
