export function toClient(row: unknown): unknown {
  if (Array.isArray(row)) return row.map(toClient)
  if (!row || typeof row !== 'object') return row
  const record = row as Record<string, unknown>
  if (!('id' in record)) return row
  const { id, ...rest } = record
  return { id, _id: id, ...rest }
}
