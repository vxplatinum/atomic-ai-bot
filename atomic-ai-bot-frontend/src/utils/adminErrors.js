export function formatAdminError(err) {
  if (!err) return 'Something went wrong';
  const d = err.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d) && d[0]?.msg) return d.map((x) => x.msg).join('; ');
  if (d && typeof d === 'object') return JSON.stringify(d);
  return 'Request failed';
}
