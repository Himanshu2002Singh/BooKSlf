import mysql from 'mysql2/promise';
import { HttpError } from '../utils/HttpError.js';
import { SCHEMA } from './schema.js';

let pool;
let tablesReady; // settles once SCHEMA has run in this process

function databaseUrl() {
  if (!process.env.DATABASE_URL) throw new HttpError(503, 'Accounts aren’t set up on this server yet.');
  return process.env.DATABASE_URL;
}

// One shared MySQL pool, from DATABASE_URL (mysql://user:password@host:3306/bookshelf).
export function db() {
  pool ??= mysql.createPool({ uri: databaseUrl(), connectionLimit: 5, timezone: 'Z' });
  return pool;
}

// Creates any missing tables the first time this process touches the database (after a start,
// restart or deploy). SCHEMA only adds what's missing, so running it again changes nothing.
// If it fails, the next query tries again.
export function ensureTables() {
  tablesReady ??= (async () => {
    const connection = await mysql.createConnection({ uri: databaseUrl(), multipleStatements: true });
    try {
      await connection.query(SCHEMA);
    } finally {
      await connection.end();
    }
  })().catch(error => {
    tablesReady = undefined;
    throw error;
  });
  return tablesReady;
}

export async function query(sql, params = []) {
  await ensureTables();
  const [rows] = await db().execute(sql, params);
  return rows;
}

// For tests and graceful shutdown: lets the process exit.
export async function closeDb() {
  await pool?.end();
  pool = undefined;
}
