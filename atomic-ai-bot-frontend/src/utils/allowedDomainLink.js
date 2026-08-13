const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

function getHostPart(domain) {
  const raw = domain.trim().toLowerCase();
  if (raw.startsWith('[')) {
    const end = raw.indexOf(']');
    return end === -1 ? raw : raw.slice(1, end);
  }
  return raw.split(':')[0];
}

function getPortPart(domain) {
  const raw = domain.trim();
  if (raw.startsWith('[')) {
    const bracketEnd = raw.indexOf(']');
    if (bracketEnd === -1) return '';
    const rest = raw.slice(bracketEnd + 1);
    return rest.startsWith(':') ? rest.slice(1) : '';
  }
  const parts = raw.split(':');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

function shouldUseHttp(domain) {
  const host = getHostPart(domain);
  if (LOCAL_HOSTS.has(host) || host.endsWith('.localhost')) {
    return true;
  }

  if (/^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)) {
    return true;
  }

  const port = getPortPart(domain);
  if (port && port !== '80' && port !== '443') {
    return true;
  }

  return false;
}

export function allowedDomainToHref(domain) {
  const raw = String(domain ?? '').trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;

  const protocol = shouldUseHttp(raw) ? 'http' : 'https';
  return `${protocol}://${raw}`;
}
