const appName = import.meta.env.APP_NAME.trim()

export const APP_NAME = appName.length > 0 ? appName : 'app'

export function getAppStorageKey(key: string): string {
  return `${APP_NAME}.${key}`
}
