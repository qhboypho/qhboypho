type InitDbDeps = {
  resolveSelectedColorImage: (productColors: any, selectedColor: any, fallbackImage?: string) => string
}

export function createInitDB(_deps: InitDbDeps) {
  return async function initDB(db: D1Database) {
    // Runtime init is intentionally a no-op.
    // Schema/data setup is migrated to D1 migrations.
    void db
  }
}
