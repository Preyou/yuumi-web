import themeMap from '@/assets/themes'
import { useTheme } from '@/shared/molecule/theme/useTheme'

export function registerBuiltInThemes() {
  const { registerThemes } = useTheme()
  registerThemes(themeMap.values(), { overwrite: true })
}
