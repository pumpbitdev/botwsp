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

            // --- INICIO DE LA IMPLEMENTACIÓN ---
            // Verificamos si la entrada del usuario es una imagen.
            if (ctx.message?.imageMessage) {
                // Si es una imagen, redirigimos inmediatamente al flujo de pago.
                console.log('[SalesFlow] Imagen detectada, redirigiendo a PaymentFlow.');
                return gotoFlow(paymentFlow);
            }
            // --- FIN DE LA IMPLEMENTACIÓN ---

            // Si no es una imagen, continuamos con la lógica normal.
            const userId = ctx.from;
            const userQuery = ctx.body;
            const response = await getResponse(PROMPT_SALES, userId, userQuery);

            // Esta lógica para 'confirmo' puede quedarse o quitarse, 
            // ya que el paymentFlow se activa con la palabra.
            // La dejo por si quieres una doble verificación.
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
        async (ctx, { gotoFlow, fallBack }) => {

            // --- INICIO DE LA IMPLEMENTACIÓN (también en pricesFlow) ---
            if (ctx.message?.imageMessage) {
                console.log('[PricesFlow] Imagen detectada, redirigiendo a PaymentFlow.');
                return gotoFlow(paymentFlow);
            }
            // --- FIN DE LA IMPLEMENTACIÓN ---

            const userId = ctx.from;
            const userQuery = ctx.body;
            const response = await getResponse(PROMPT_SALES, userId, userQuery);
            await fallBack(response);
        }
    );

export { salesFlow, pricesFlow };
