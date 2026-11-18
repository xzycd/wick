import type { Category } from '../types'

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'streaming', label: 'Streaming' },
  { value: 'music', label: 'Music' },
  { value: 'software', label: 'Software' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'news', label: 'News' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'storage', label: 'Storage' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'other', label: 'Other' },
]

export const categoryLabel: Record<Category, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label]),
) as Record<Category, string>
