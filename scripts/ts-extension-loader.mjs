import { access } from 'node:fs/promises'
import { constants } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'

export async function resolve(specifier, context, defaultResolve) {
  if (specifier.startsWith('.') && !specifier.endsWith('.ts') && !specifier.endsWith('.js')) {
    try {
      const parentPath = fileURLToPath(context.parentURL)
      const candidate = new URL(specifier + '.ts', pathToFileURL(parentPath))
      await access(fileURLToPath(candidate), constants.F_OK)
      return { url: candidate.href, shortCircuit: true }
    } catch {
      // Let Node report the original resolution error when there is no TS file.
    }
  }
  return defaultResolve(specifier, context, defaultResolve)
}
