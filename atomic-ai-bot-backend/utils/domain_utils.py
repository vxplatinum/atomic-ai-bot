import ipaddress
from urllib.parse import urlparse

LOCAL_HOST_ALIASES = frozenset({"localhost", "127.0.0.1", "::1"})


def _is_ip(host: str) -> bool:
    try:
        ipaddress.ip_address(host)
        return True
    except ValueError:
        return False


def _parse_host_port(value: str) -> tuple[str, int | None]:
    value = value.strip().lower()
    if not value:
        return "", None

    if "://" in value:
        parsed = urlparse(value)
        host = (parsed.hostname or "").lower()
        return host, parsed.port

    chunk = value.split("/")[0].split("?")[0]
    if chunk.startswith("[") and "]" in chunk:
        host_part, _, rest = chunk.partition("]")
        host = host_part[1:].lower()
        if rest.startswith(":") and rest[1:].isdigit():
            return host, int(rest[1:])
        return host, None

    if chunk.count(":") == 1:
        host, port_str = chunk.rsplit(":", 1)
        if port_str.isdigit():
            return host.lower(), int(port_str)

    return chunk.split(":")[0].lower(), None


def _is_local_host(host: str) -> bool:
    return host in LOCAL_HOST_ALIASES


def normalize_domain(value: str) -> str:
    # Drop www. Keep port on loopback so :5500 and :5173 stay distinct.
    host, port = _parse_host_port(value)
    if not host:
        return value.strip().lower()

    if host.startswith("www.") and not _is_ip(host[4:]):
        host = host[4:]

    if _is_local_host(host) and port:
        return f"{host}:{port}"
    return host


def domain_identity(value: str) -> str:
    # Collapse localhost / 127.0.0.1 / ::1 to one identity (port kept).
    host, port = _parse_host_port(value)
    if not host:
        return value.strip().lower()

    if host.startswith("www.") and not _is_ip(host[4:]):
        host = host[4:]

    if _is_local_host(host):
        if port:
            return f"localhost:{port}"
        return "localhost"

    return host


def _origin_host_port(origin: str) -> tuple[str, int | None] | None:
    if not origin:
        return None
    if not origin.startswith(("http://", "https://")):
        origin = f"https://{origin}"
    parsed = urlparse(origin)
    if not parsed.hostname:
        return None
    return parsed.hostname.lower(), parsed.port


def domains_match(allowed_domain: str, origin: str) -> bool:
    # Exact identity, or request is a subdomain of allowed. Loopback never subdomain-matches.
    origin_parts = _origin_host_port(origin)
    if not origin_parts:
        return False

    request_host, request_port = origin_parts
    if _is_local_host(request_host):
        request_value = f"{request_host}:{request_port}" if request_port else request_host
    else:
        request_value = request_host

    if domain_identity(allowed_domain) == domain_identity(request_value):
        return True

    allowed = normalize_domain(allowed_domain)
    request = normalize_domain(request_value)
    if _is_local_host(request_host) or _is_local_host(_parse_host_port(allowed_domain)[0]):
        return False
    return request.endswith(f".{allowed}")
