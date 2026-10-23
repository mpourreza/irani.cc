export function href(path = "") {
  const base = import.meta.env.BASE_URL || "/";
  const clean = String(path).replace(/^\/+|\/+$/g, "");
  if (!clean) return base;
  return `${base}${clean}/`;
}

export function asset(path) {
  const base = import.meta.env.BASE_URL || "/";
  return `${base}${String(path).replace(/^\/+/, "")}`;
}
