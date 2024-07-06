import pkg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const { Pool } = pkg;

// Obtenemos el nombre del archivo y el directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Conexión inicial a la base de datos postgres para crear la base de datos softjobs si no existe
const initialPool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: 'postgres',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const setupDatabase = async () => {
  try {
    const client = await initialPool.connect();

    // Verificar si la base de datos existe
    const dbCheckQuery = `SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_NAME}'`;
    const dbCheckResult = await client.query(dbCheckQuery);

    if (dbCheckResult.rowCount === 0) {
      // Crear la base de datos si no existe
      await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log(`Base de datos ${process.env.DB_NAME} creada correctamente`);
    } else {
      console.log(`Base de datos ${process.env.DB_NAME} ya existe`);
    }

    client.release();

    // Conexión a la base de datos softjobs para crear las tablas y datos iniciales
    const softjobsPool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });

    const softjobsClient = await softjobsPool.connect();

    // Leer el script SQL
    const initSql = fs.readFileSync(path.join(__dirname, 'init.sql')).toString();

    // Ejecutar el script SQL
    await softjobsClient.query(initSql);

    console.log('Tablas y datos iniciales configurados correctamente');
    softjobsClient.release();
  } catch (error) {
    console.error('Error al configurar la base de datos:', error);
  } finally {
    await initialPool.end();
  }
};

setupDatabase();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

export default pool;
