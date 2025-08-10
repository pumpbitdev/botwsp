import { addKeyword } from '@builderbot/bot';
// --- INICIO DE LA CORRECCIÓN ---
// Importamos 'salesFlow' usando llaves porque ahora es una exportación con nombre.
import { salesFlow } from './sales.flow.js';
// --- FIN DE LA CORRECCIÓN ---


const mainFlow = addKeyword(['hola', 'buenas', 'hi', 'hello'])
    .addAnswer(["Hola, bienvenido a Bityete tu sitio de recargas! 💸"])
    .addAnswer([
        "Como puedes iniciar a recargar tus Juegos?",
        '1. 👉 Puedes escribir "taza" para saber la taza con la que trabajamos!',
        '2. 👉 Puedes escribir "recargas" para recargar tu juego favorito!',
        '3. 👉 Puedes escribir "pagos" para solicitar informacion de los metodos de pagos.'], 
        null, // Se añade 'null' aquí porque la función de 'addAnswer' espera un objeto de opciones o null si no hay
        async (ctx, { gotoFlow, fallBack }) => {
            const lowerCaseBody = ctx.body.toLowerCase();
            if (lowerCaseBody.includes('comprar') || lowerCaseBody.includes('precio') || lowerCaseBody.includes('catalogo')) {
                return gotoFlow(salesFlow);
            }
            // Eliminamos el fallBack innecesario para que no interfiera si no hay match
        }
    );

export default mainFlow;
