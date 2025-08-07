import { addKeyword } from '@builderbot/bot';
// --- INICIO DE LA CORRECCIÓN ---
// 1. Importamos la función getResponse directamente (con llaves).
import { getResponse } from '../services/ai.service.js';
// 2. Importamos los prompts que podríamos necesitar.
import { PROMPT_SALES } from '../prompts/prompts.js';
// --- FIN DE LA CORRECCIÓN ---


const gamesFlow = addKeyword(['recargas', 'recargar', 'catalogo'])
    .addAnswer(
        '¡Hola! Estás en el flujo de catálogo. ¿Sobre qué te gustaría preguntar?', 
        { capture: true }, 
        async (ctx, { fallBack }) => {
            const userId = ctx.from;
            const userQuery = ctx.body;
            
            // 3. Usamos la función getResponse con el prompt deseado.
            // Para este flujo, usaremos el mismo prompt de ventas.
            const response = await getResponse(PROMPT_SALES, userId, userQuery);
            console.log(response);
            await fallBack(response);
        }
    );

export default gamesFlow;
