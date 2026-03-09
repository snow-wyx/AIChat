export function uid(): string {
  return `id_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`
}