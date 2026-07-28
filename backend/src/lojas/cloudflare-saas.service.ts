/**
 * Cliente mínimo da API Cloudflare Custom Hostnames (SaaS).
 * Docs: POST/GET/DELETE /zones/{zone_id}/custom_hostnames
 */
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

export type CfSslValidationRecord = {
  txt_name?: string;
  txt_value?: string;
  http_url?: string;
  http_body?: string;
};

export type CfCustomHostname = {
  id: string;
  hostname: string;
  status: string;
  ssl?: {
    status?: string;
    method?: string;
    type?: string;
    validation_records?: CfSslValidationRecord[];
  };
  ownership_verification?: {
    type?: string;
    name?: string;
    value?: string;
  };
  ownership_verification_http?: {
    http_url?: string;
    http_body?: string;
  };
};

@Injectable()
export class CloudflareSaaSService {
  private readonly logger = new Logger(CloudflareSaaSService.name);
  private readonly apiBase = 'https://api.cloudflare.com/client/v4';

  isConfigured(): boolean {
    return Boolean(this.zoneId() && this.apiToken());
  }

  cnameTarget(): string {
    return (
      process.env.CF_SAAS_CNAME_TARGET?.trim() ||
      'customers.comunikapp.com.br'
    );
  }

  requireConfigured() {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'Domínio próprio indisponível: configure CF_ZONE_ID e CF_API_TOKEN (Cloudflare for SaaS).',
      );
    }
  }

  async createHostname(hostname: string): Promise<CfCustomHostname> {
    this.requireConfigured();
    const body = {
      hostname,
      ssl: {
        method: 'txt',
        type: 'dv',
      },
    };
    const data = await this.request<{ result: CfCustomHostname }>(
      'POST',
      `/zones/${this.zoneId()}/custom_hostnames`,
      body,
    );
    return data.result;
  }

  async getHostname(id: string): Promise<CfCustomHostname> {
    this.requireConfigured();
    const data = await this.request<{ result: CfCustomHostname }>(
      'GET',
      `/zones/${this.zoneId()}/custom_hostnames/${id}`,
    );
    return data.result;
  }

  async findByHostname(hostname: string): Promise<CfCustomHostname | null> {
    this.requireConfigured();
    const q = encodeURIComponent(hostname);
    const data = await this.request<{ result: CfCustomHostname[] }>(
      'GET',
      `/zones/${this.zoneId()}/custom_hostnames?hostname=${q}`,
    );
    return data.result?.[0] ?? null;
  }

  async deleteHostname(id: string): Promise<void> {
    this.requireConfigured();
    await this.request(
      'DELETE',
      `/zones/${this.zoneId()}/custom_hostnames/${id}`,
    );
  }

  isFullyActive(ch: CfCustomHostname): boolean {
    const hostOk = (ch.status || '').toLowerCase() === 'active';
    const sslOk = (ch.ssl?.status || '').toLowerCase() === 'active';
    return hostOk && sslOk;
  }

  private zoneId(): string {
    return process.env.CF_ZONE_ID?.trim() || '';
  }

  private apiToken(): string {
    return process.env.CF_API_TOKEN?.trim() || '';
  }

  private async request<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.apiBase}${path}`;
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiToken()}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const json = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      errors?: Array<{ message?: string; code?: number }>;
      result?: unknown;
    };

    if (!res.ok || json.success === false) {
      const msg =
        json.errors?.map((e) => e.message).filter(Boolean).join('; ') ||
        `Cloudflare API HTTP ${res.status}`;
      this.logger.warn(`cf_saas ${method} ${path} failed: ${msg}`);
      throw new ServiceUnavailableException(
        `Falha na Cloudflare Custom Hostname: ${msg}`,
      );
    }

    return json as T;
  }
}
