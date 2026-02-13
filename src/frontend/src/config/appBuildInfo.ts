// Build metadata helper for version and environment display
export interface BuildInfo {
  version: string;
  environment: string;
  buildTime: string;
}

export function getBuildInfo(): BuildInfo {
  // Read from Vite environment variables
  // Use 'unknown' instead of hardcoded version when metadata is missing
  const version = import.meta.env.VITE_APP_VERSION || 'unknown';
  const environment = import.meta.env.VITE_APP_ENV || 
    (window.location.hostname.includes('localhost') ? 'development' : 'production');
  const buildTime = import.meta.env.VITE_BUILD_TIME || new Date().toISOString();

  return {
    version,
    environment,
    buildTime,
  };
}

export function formatBuildInfo(info: BuildInfo): string {
  // In production, include environment label in version string
  if (info.environment === 'production') {
    return `v${info.version} (production)`;
  }
  // In other environments, just show version
  return `v${info.version}`;
}

export function isDraftEnvironment(): boolean {
  const hostname = window.location.hostname;
  return hostname.includes('draft') || hostname.includes('staging') || hostname.includes('localhost');
}
