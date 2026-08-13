import { prisma } from "@/lib/db";

export interface SSOConfigData {
  id: string;
  organizationId: string;
  provider: string;
  clientId: string | null;
  issuerUrl: string | null;
  domain: string | null;
  isEnabled: boolean;
  settings: Record<string, unknown>;
}

const SUPPORTED_PROVIDERS = ["saml", "oidc", "google", "azure", "okta"] as const;
export type SSOProvider = (typeof SUPPORTED_PROVIDERS)[number];

export function getSupportedProviders(): readonly string[] {
  return SUPPORTED_PROVIDERS;
}

export async function configureSSO(
  organizationId: string,
  data: {
    provider: string;
    clientId?: string;
    clientSecret?: string;
    issuerUrl?: string;
    domain?: string;
    settings?: Record<string, unknown>;
  }
): Promise<SSOConfigData> {
  const existing = await prisma.sSOConfig.findUnique({
    where: {
      organizationId_provider: {
        organizationId,
        provider: data.provider,
      },
    },
  });

  if (existing) {
    const updated = await prisma.sSOConfig.update({
      where: { id: existing.id },
      data: {
        clientId: data.clientId ?? existing.clientId,
        clientSecret: data.clientSecret ?? existing.clientSecret,
        issuerUrl: data.issuerUrl ?? existing.issuerUrl,
        domain: data.domain ?? existing.domain,
        isEnabled: true,
        settings: data.settings ? JSON.stringify(data.settings) : existing.settings,
      },
    });
    return formatSSO(updated);
  }

  const config = await prisma.sSOConfig.create({
    data: {
      organizationId,
      provider: data.provider,
      clientId: data.clientId || null,
      clientSecret: data.clientSecret || null,
      issuerUrl: data.issuerUrl || null,
      domain: data.domain || null,
      isEnabled: true,
      settings: data.settings ? JSON.stringify(data.settings) : "{}",
    },
  });
  return formatSSO(config);
}

export async function getSSOConfigs(
  organizationId: string
): Promise<SSOConfigData[]> {
  const configs = await prisma.sSOConfig.findMany({
    where: { organizationId },
  });
  return configs.map(formatSSO);
}

export async function disableSSO(
  organizationId: string,
  provider: string
): Promise<void> {
  await prisma.sSOConfig.updateMany({
    where: { organizationId, provider },
    data: { isEnabled: false },
  });
}

export async function deleteSSO(
  organizationId: string,
  provider: string
): Promise<void> {
  await prisma.sSOConfig.deleteMany({
    where: { organizationId, provider },
  });
}

function formatSSO(config: {
  id: string;
  organizationId: string;
  provider: string;
  clientId: string | null;
  issuerUrl: string | null;
  domain: string | null;
  isEnabled: boolean;
  settings: string;
}): SSOConfigData {
  return {
    id: config.id,
    organizationId: config.organizationId,
    provider: config.provider,
    clientId: config.clientId,
    issuerUrl: config.issuerUrl,
    domain: config.domain,
    isEnabled: config.isEnabled,
    settings: JSON.parse(config.settings),
  };
}