export function resolveSelectedColorImage(productColors: any, selectedColor: any, fallbackImage = ''): string {
  const selected = String(selectedColor || '').trim().toLowerCase()
  if (!selected) return String(fallbackImage || '').trim()
  const colors = Array.isArray(productColors)
    ? productColors
    : (() => {
        try {
          const parsed = JSON.parse(String(productColors || '[]'))
          return Array.isArray(parsed) ? parsed : []
        } catch {
          return []
        }
      })()
  if (!colors.length) return String(fallbackImage || '').trim()
  const matched =
    colors.find((item: any) => String(item?.name || '').trim().toLowerCase() === selected) ||
    colors.find((item: any) => {
      const name = String(item?.name || '').trim().toLowerCase()
      return name.includes(selected) || selected.includes(name)
    })
  if (matched && String(matched.image || '').trim()) return String(matched.image).trim()
  return String(fallbackImage || '').trim()
}
