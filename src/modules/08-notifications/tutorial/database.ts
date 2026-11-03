
import { Database } from 'bun:sqlite'

const db = new Database(':memory:')

export async function initializeDatabase() {
    const schemaFile = Bun.file(`${import.meta.dir}/schema.sql`)
    const schema = await schemaFile.text()
    
    db.exec(schema)
}

export { db }