import { addAnswer } from '@builderbot/bot';
import { processPaymentImage } from '../../services/image.service.js';

const gamePaymentFlow = addAnswer(
    '¡Excelente! 👍 Para continuar, por favor, envíame el ID de tu cuenta de juego.',
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
    '¡Gracias! Ya tengo tus datos. Por favor, envía ahora la captura de pantalla de tu pago para verificarla.',
    { capture: true },
    async (ctx, { state, provider, flowDynamic, fallBack, endFlow }) => {
        if (!ctx.message?.imageMessage) {
            await flowDynamic('Eso no parece una imagen. Por favor, envía la captura para continuar.');
            return fallBack();
        }
        await flowDynamic('¡Recibí tu comprobante! 📄 Analizando...');
        try {
            const imagePath = await provider.saveFile(ctx, { path: './media' });
            const result = await processPaymentImage(imagePath);
            if (result.success) {
                const playerName = state.get('playerName');
                const gameId = state.get('gameId');
                const finalMessage = `¡Verificación exitosa! ✨\n\n*Recarga de Juego:*\n*Jugador:* ${playerName}\n*ID de Juego:* ${gameId}\n*Referencia:* ${result.referenceId}\n\nEn breve procesaremos tu recarga.`;
                await flowDynamic(finalMessage);
                return endFlow();
            } else {
                await flowDynamic('No pude confirmar la referencia en la imagen. Por favor, envíala de nuevo.');
                return fallBack();
            }
        } catch (error) {
            console.error("Error en gamePaymentFlow:", error);
            await flowDynamic("Uups, algo salió mal. Contacta a soporte.");
            return endFlow();
        }
    }
);

export default gamePaymentFlow;
