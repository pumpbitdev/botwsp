import { addKeyword } from '@builderbot/bot';
import gamePaymentFlow from './gamePayment.flow.js';
import zinliPaymentFlow from './ExchangePayment.flow.js';

const paymentFlow = addKeyword(['confirmo', 'confirmar'], { sensitive: true })
    .addAnswer(
        [
            '¡Perfecto! Vamos a confirmar tu pago.',
            'Por favor, dime qué tipo de recarga estás pagando:',
            '1. 👉 Recarga de *Juegos*',
            '2. 👉 Recarga de *Zinli*'
        ],
        { capture: true },
        async (ctx, { gotoFlow, fallBack }) => {
            const userChoice = ctx.body.toLowerCase();

            if (userChoice.includes('juego')) {
                // Si elige "juegos", lo mandamos al flujo especializado.
                return gotoFlow(gamePaymentFlow);
            }
            
            if (userChoice.includes('zinli')) {
                // Si elige "zinli", lo mandamos al otro flujo especializado.
                return gotoFlow(zinliPaymentFlow);
            }

            // Si no entendemos la respuesta, le pedimos que lo intente de nuevo.
            return fallBack('No entendí esa opción. Por favor, responde "juegos" o "zinli".');
        }
    );

export default paymentFlow;
