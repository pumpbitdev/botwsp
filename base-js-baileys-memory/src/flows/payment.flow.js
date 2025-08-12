import { addKeyword } from '@builderbot/bot';
import { processPaymentImage } from '../services/image.service.js';

const paymentFlow = addKeyword(['confirmo', 'confirmar'], { sensitive: true })
    // --- PASO 1: Elegir el tipo de recarga ---
    .addAnswer(
        [
            '¡Perfecto! Vamos a confirmar tu pago.',
            'Por favor, dime qué tipo de recarga estás pagando:',
            '1. 👉 Recarga de *Juegos*',
            '2. 👉 Recarga de *Divisas* (Zinli)'
        ],
        { capture: true },
        async (ctx, { state, fallBack }) => {
            const userChoice = ctx.body.toLowerCase();
            let paymentType = null;

            if (userChoice.includes('juego')) {
                paymentType = 'game';
            } else if (userChoice.includes('divisa') || userChoice.includes('zinli')) {
                paymentType = 'exchange';
            } else {
                return fallBack('No entendí esa opción. Por favor, responde "juegos" o "divisas".');
            }

            // Guardamos el tipo de pago en el "carrito" del flujo.
            // Esta es la clave para la lógica condicional.
            await state.update({ paymentType });
        }
    )
    // --- PASO 2: Pedir el primer dato (condicional) ---
    .addAnswer(
        '¡Entendido!',
        null,
        async (ctx, { state, flowDynamic }) => {
            const paymentType = state.get('paymentType');
            // Dependiendo del tipo de pago, hacemos una pregunta diferente.
            if (paymentType === 'game') {
                await flowDynamic('Por favor, envíame el ID de tu cuenta de juego.');
            } else if (paymentType === 'exchange') {
                await flowDynamic('Por favor, envíame tu nombre completo.');
            }
        }
    )
    // --- PASO 3: Capturar el primer dato y pedir el segundo ---
    .addAnswer(
        { capture: true }, // Este addAnswer está "vacío" de texto, solo captura.
        async (ctx, { state, flowDynamic }) => {
            const paymentType = state.get('paymentType');
            const data1 = ctx.body;

            if (paymentType === 'game') {
                await state.update({ gameId: data1 });
                await flowDynamic('¡Perfecto! Ahora, por favor, dime tu nombre de usuario en el juego.');
            } else if (paymentType === 'exchange') {
                await state.update({ fullName: data1 });
                await flowDynamic('¡Entendido! Ahora, por favor, dime tu correo electrónico.');
            }
        }
    )
    // --- PASO 4: Capturar el segundo dato y pedir la imagen ---
    .addAnswer(
        { capture: true },
        async (ctx, { state, flowDynamic }) => {
            const paymentType = state.get('paymentType');
            const data2 = ctx.body;

            if (paymentType === 'game') {
                await state.update({ playerName: data2 });
            } else if (paymentType === 'exchange') {
                await state.update({ email: data2 });
            }
            await flowDynamic('¡Gracias! Ya tengo todos tus datos. Por favor, envía ahora la captura de tu pago para verificarla.');
        }
    )
    // --- PASO 5: Capturar y procesar la imagen ---
    .addAnswer(
        { capture: true },
        async (ctx, { state, provider, flowDynamic, fallBack, endFlow }) => {
            if (!ctx.message?.imageMessage) {
                return fallBack('Eso no parece una imagen. Por favor, envía la captura para continuar.');
            }
            await flowDynamic('¡Recibí tu comprobante! 📄 Analizando...');
            try {
                const imagePath = await provider.saveFile(ctx, { path: './media' });
                const result = await processPaymentImage(imagePath);
                if (result.success) {
                    const paymentType = state.get('paymentType');
                    let finalMessage = '¡Verificación exitosa! ✨\n\n';

                    if (paymentType === 'game') {
                        const playerName = state.get('playerName');
                        const gameId = state.get('gameId');
                        finalMessage += `*Recarga de Juego:*\n*Jugador:* ${playerName}\n*ID de Juego:* ${gameId}\n*Referencia:* ${result.referenceId}\n\nEn breve procesaremos tu recarga.`;
                    } else { // paymentType === 'exchange'
                        const fullName = state.get('fullName');
                        const email = state.get('email');
                        finalMessage += `*Recarga de Divisa:*\n*Nombre:* ${fullName}\n*Correo:* ${email}\n*Referencia:* ${result.referenceId}\n\nEn breve procesaremos tu recarga.`;
                    }
                    await flowDynamic(finalMessage);
                    return endFlow();
                } else {
                    return fallBack('No pude confirmar la referencia en la imagen. Por favor, envíala de nuevo.');
                }
            } catch (error) {
                console.error("Error en paymentFlow:", error);
                await flowDynamic("Uups, algo salió mal. Contacta a soporte.");
                return endFlow();
            }
        }
    );

export default paymentFlow;
