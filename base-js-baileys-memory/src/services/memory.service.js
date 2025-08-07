import mysql from 'mysql2/promise';

// Configuración de la conexión a la base de datos usando variables de entorno
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
};

// Crear un "pool" de conexiones. Es más eficiente que crear una conexión por cada consulta.
const pool = mysql.createPool(dbConfig);

/**
 * Obtiene el historial de chat de un usuario desde la base de datos.
 * @param {string} userId - El ID del usuario (número de teléfono).
 * @returns {Promise<Array<{role: string, content: string}>>} - Una promesa que resuelve a un array de mensajes.
 */
async function getMemory(userId) {
    const query = `
        SELECT role, content FROM chat_history
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 6;
    `;
    try {
        const [rows] = await pool.query(query, [userId]);
        // La consulta devuelve los mensajes del más nuevo al más viejo.
        // Los modelos de IA esperan del más viejo al más nuevo, así que lo invertimos.
        return rows.reverse();
    } catch (error) {
        console.error('Error al obtener la memoria desde la base de datos:', error);
        return []; // Devuelve un array vacío si hay un error
    }
}

/**
 * Guarda un nuevo mensaje en la base de datos.
 * @param {string} userId - El ID del usuario.
 * @param {'user' | 'assistant'} role - El rol del que envía el mensaje.
 * @param {string} content - El contenido del mensaje.
 */
async function appendToMemory(userId, role, content) {
    const query = `
        INSERT INTO chat_history (user_id, role, content)
        VALUES (?, ?, ?);
    `;
    try {
        await pool.query(query, [userId, role, content]);
    } catch (error) {
        console.error('Error al guardar el mensaje en la base de datos:', error);
    }
}

export { getMemory, appendToMemory };
