import { Database } from 'bun:sqlite'
import { mkdirSync} from 'node:fs'
import { dirname } from 'node:path'


// Where the database lives (git ignored)
const DEFAULT_PATH = `${import.meta.dir}/../data/notifications.db`

// read the blueprint into a string
const schema = await Bun.file(`${import.meta.dir}/schema.sql`).text()


// Opens (or creates) a database
export function createDatabase(path: string = DEFAULT_PATH): Database{
    if (path !== ':memory:') { // :memory: is good for testing
        mkdirSync(dirname(path), {recursive: true})
    }

    // Open the database file 
    const db = new Database(path, {create: true})
    db.exec('PRAGMA foreign_keys = ON') // sqlite may ignore foreign key unless on
    db.exec(schema)
    return db;
}

// The one shared connection the rest of the module uses.
// `bun test` sets NODE_ENV to 'test', so tests never touch the real file.
export const db = createDatabase(
    process.env.NODE_ENV === 'test' ? ':memory:' : (process.env.NOTIF_DB_PATH ?? DEFAULT_PATH),
)
