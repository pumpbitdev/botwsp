// LA CORRECCIÓN: Importamos 'addKeyword' en lugar de 'addAnswer'
import { addKeyword } from '@builderbot/bot';
import { processPaymentImage } from '../../services/image.service.js';

// LA CORRECCIÓN: Iniciamos el flujo con addKeyword([]) para hacerlo encadenable
const zinliPaymentFlow = addKeyword([], { sensitive: true })
    .addAnswer(
        '¡Excelente! 👍 Para continuar, por favor, envíame tu nombre completo.',
        { capture: true },
        async (ctx, { state }) => {
            await state.update({ fullName: ctx.body });
        }
    )
    .addAnswer(
        '¡Perfecto! Ahora, por favor, dime tu correo electrónico asociado a Zinli.',
        { capture: true },
        async (ctx, { state }) => {
            await state.update({ email: ctx.body });
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
                    const fullName = state.get('fullName');
                    const email = state.get('email');
                    const finalMessage = `¡Verificación exitosa! ✨\n\n*Recarga de Divisa:*\n*Nombre:* ${fullName}\n*Correo:* ${email}\n*Referencia:* ${result.referenceId}\n\nEn breve procesaremos tu recarga.`;
                    await flowDynamic(finalMessage);
                    return endFlow();
                } else {
                    await flowDynamic('No pude confirmar la referencia en la imagen. Por favor, envíala de nuevo.');
                    return fallBack();
                }
            } catch (error) {
                console.error("Error en zinliPaymentFlow:", error);
                await flowDynamic("Uups, algo salió mal. Contacta a soporte.");
                return endFlow();
            }
        }
    );

export default zinliPaymentFlow;
