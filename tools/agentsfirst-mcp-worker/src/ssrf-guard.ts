// SSRF guard for the PUBLIC review endpoint.
//
// probeWebsite() will fetch whatever URL it's given — fine for trusted MCP
// callers, NOT fine for an anonymous public endpoint. Before probing a
// user-supplied URL we require a public http(s) FQDN and reject anything that
// looks internal: raw IP literals, loopback/private/link-local ranges, the
// cloud metadata address, localhost, and *.internal / *.local names.

export interface GuardResult {
  ok: boolean;
  url?: string; // normalized
  hostname?: string;
  reason?: string;
}

const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function isPrivateIpv4(host: string): boolean {
  const m = IPV4_RE.exec(host);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // loopback
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 169 && b === 254) return true; // link-local + cloud metadata 169.254.169.254
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
  return false;
}

export function guardReviewUrl(raw: string): GuardResult {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return { ok: false, reason: 'invalid_url' };
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return { ok: false, reason: 'scheme_not_allowed' };
  }
  const host = u.hostname.toLowerCase();

  // No bare IPs — require a registered domain name. (Blocks every private-range
  // literal and the metadata address in one move; raw IPs aren't a thing we
  // ever want to score anyway.)
  if (IPV4_RE.test(host) || isPrivateIpv4(host)) {
    return { ok: false, reason: 'ip_literal_blocked' };
  }
  if (host.includes(':') || host.startsWith('[')) {
    return { ok: false, reason: 'ipv6_blocked' }; // IPv6 literal
  }
  // Internal / loopback / non-public names.
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.internal') ||
    host.endsWith('.local') ||
    host.endsWith('.lan') ||
    host.endsWith('.home') ||
    host.endsWith('.corp')
  ) {
    return { ok: false, reason: 'internal_host_blocked' };
  }
  // Require a public-looking FQDN: at least one dot and a 2+ char alpha TLD.
  if (!/\.[a-z]{2,}$/.test(host)) {
    return { ok: false, reason: 'not_a_public_domain' };
  }
  return { ok: true, url: u.toString(), hostname: host };
}
