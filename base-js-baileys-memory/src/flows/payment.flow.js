import { addKeyword, EVENTS } from '@builderbot/bot';
import { processPaymentImage } from '../services/image.service.js';
import fs from 'fs';
import path from 'path';

const MEDIA_PATH = path.join(process.cwd(), 'media');

if (!fs.existsSync(MEDIA_PATH)) {
    fs.mkdirSync(MEDIA_PATH, { recursive: true });
}

const paymentFlow = addKeyword(['confirmo', 'confirmar'], { sensitive: true })
    .addAnswer(
        '¡Excelente! 👍 Para comenzar, por favor, envíame el ID de tu cuenta de juego.',
        { capture: true },
        async (ctx, { state }) => {
            await state.update({ gameId: ctx.body });
        }
    )
    .addAnswer(
        '¡Perfecto! Ahora, por favor, dime tu nombre de usuario en el juego (tal cual como aparece).',
        { capture: true },
        async (ctx, { state }) => {
            await state.update({ playerName: ctx.body });
        }
    )
    .addAnswer(
        '¡Gracias! Ya tengo todos tus datos. Por favor, envía ahora la captura de pantalla de tu pago para verificarla.',
        { capture: true },
        async (ctx, { state, provider, flowDynamic, fallBack, endFlow }) => {
            
            if (!ctx.message?.imageMessage) {
                await flowDynamic('Eso no parece una imagen. Por favor, envía la captura de tu pago para continuar.');
                return fallBack();
            }

            await flowDynamic('¡Recibí tu comprobante! 📄 Lo estoy analizando, por favor espera...');
            
            try {
                const imagePath = await provider.saveFile(ctx, { path: './media' });
                const result = await processPaymentImage(imagePath);

                if (result.success) {
                    // --- INICIO DE LA CORRECCIÓN ---
                    // En lugar de state.get(), obtenemos cada valor por su clave.
                    const playerName = state.get('playerName');
                    const gameId = state.get('gameId');
                    // --- FIN DE LA CORRECCIÓN ---

                    const finalMessage = `¡Verificación exitosa! ✨

` +
                                       `*Jugador:* ${playerName}
` +
                                       `*ID de Juego:* ${gameId}
` +
                                       `*Referencia de Pago:* ${result.referenceId}

` +
                                       `En breve procesaremos tu recarga. ¡Gracias por tu compra!`;

                    await flowDynamic(finalMessage);
                    return endFlow();
                } else {
                    await flowDynamic('Lo siento, no pude confirmar el número de referencia en la imagen. Por favor, asegúrate de que sea legible y envíala de nuevo.');
                    return fallBack();
                }
            } catch (error) {
                console.error("Error en el flujo de pago:", error);
                await flowDynamic("Uups, algo salió mal al procesar tu comprobante. Por favor, contacta a soporte.");
                return endFlow();
            }
        }
    );

export default paymentFlow;
