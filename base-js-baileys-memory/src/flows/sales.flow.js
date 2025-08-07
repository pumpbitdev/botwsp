import { addKeyword } from '@builderbot/bot';
import { getResponse } from '../services/ai.service.js';
import { PROMPT_SALES } from '../prompts/prompts.js';
import paymentFlow from './payment.flow.js';

const salesFlow = addKeyword(['recargas', 'recargar'])
    .addAnswer(
        [
            "Estos son nuestros servicios 🚀",
            "1. Call of Duty",
            "2. FreeFire",
            "3. Blood Strike",
            "",
            "Indicanos en el chat, cual juego deseas recargar! ❇️",
        ], 
        { capture: true }, 
        async (ctx, { gotoFlow, fallBack }) => {
            const userId = ctx.from;
            const userQuery = ctx.body;
            const response = await getResponse(PROMPT_SALES, userId, userQuery);
            if (response.trim().toLowerCase() === "confirmo") {
                return gotoFlow(paymentFlow);
            }
            await fallBack(response);
        }
    );

const pricesFlow = addKeyword(['precios'])
    .addAnswer(
        '¡Hola! Estás en el flujo de precios. ¿Sobre qué te gustaría preguntar?', 
        { capture: true }, 
        async (ctx, { fallBack }) => {
            const userId = ctx.from;
            const userQuery = ctx.body;
            const response = await getResponse(PROMPT_SALES, userId, userQuery);
            console.log(response);
            await fallBack(response);
        }
    );

// --- LA CORRECCIÓN ---
// Usamos "named exports" para exportar ambas variables.
export { salesFlow, pricesFlow };
