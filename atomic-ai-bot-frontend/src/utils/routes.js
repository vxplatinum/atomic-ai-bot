const KNOWN_ROUTE_PATTERNS = [
  /^\/$/,
  /^\/login$/,
  /^\/register$/,
  /^\/verify-email$/,
  /^\/auth\/verify-email$/,
  /^\/forgot-password$/,
  /^\/auth\/reset-password-confirm$/,
  /^\/reset-password-confirm$/,
  /^\/dashboard$/,
  /^\/bot\/create$/,
  /^\/bot\/[^/]+\/edit$/,
  /^\/bot\/[^/]+$/,
  /^\/admin(\/.*)?$/,
];

export function isKnownAppRoute(pathname) {
  return KNOWN_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
}
