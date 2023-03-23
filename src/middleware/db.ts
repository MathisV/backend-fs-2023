import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Charge les variables d'environnement du fichier .env
dotenv.config();

// Configuration de la base de données MariaDB
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };

  // Connexion à la base de données MariaDB
export async function connectToDatabase() {
    try {
      const connection = await mysql.createConnection(dbConfig);
      //console.log('Connected to MariaDB');
      return connection;
    } catch (error) {
      console.error('Error connecting to MariaDB:', error);
      return null;
    }
  }