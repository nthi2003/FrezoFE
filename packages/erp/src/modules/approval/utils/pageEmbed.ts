export interface EmbeddedPageProps {
  embedded?: boolean
}

export function pageRootClass(embedded: boolean | undefined, extra = ''): string {
  const base = embedded ? 'space-y-4' : 'p-6 space-y-4 animate-fade-in'
  return extra ? `${base} ${extra}`.trim() : base
}
