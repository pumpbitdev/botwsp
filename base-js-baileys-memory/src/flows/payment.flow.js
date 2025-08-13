import { addKeyword } from '@builderbot/bot';
import { processPaymentImage } from '../services/image.service.js';

const paymentFlow = addKeyword(['confirmo', 'confirmar'], { sensitive: true })
    // --- BLOQUE 1: Bienvenida y Primera Pregunta (se ejecuta 1 sola vez) ---
    .addAnswer(
        '¡Perfecto! Vamos a confirmar tu pago.\nPor favor, dime qué tipo de recarga estás pagando:\n\n1. 👉 Recarga de *Juegos*\n2. 👉 Recarga de *Divisas* (Zinli)',
        { capture: true },
        async (ctx, { state, fallBack }) => {
            const userChoice = ctx.body.toLowerCase();
            let paymentType = null;

            if (userChoice.includes('juego')) {
                paymentType = 'game';
            } else if (userChoice.includes('divisa') || userChoice.includes('zinli')) {
                paymentType = 'exchange';
            } else {
                // Si la respuesta no es válida, nos quedamos en este bloque.
                return fallBack('No entendí esa opción. Por favor, responde "juegos" o "divisas".');
            }
            
            // Guardamos la elección y el siguiente paso en el state.
            // Este es el único dato que se guarda en este bloque.
            await state.update({ paymentType, step: 'awaiting_data_1' });
        }
    )
    // --- BLOQUE 2: El Motor de Recolección de Datos (se ejecuta en bucle) ---
    .addAnswer(
        // No tiene mensaje inicial. Es solo un listener.
        null,
        { capture: true },
        async (ctx, { state, flowDynamic, fallBack, endFlow, provider }) => {
            
            const currentStep = state.get('step');
            const paymentType = state.get('paymentType');

            switch (currentStep) {
                // El usuario envía el primer dato (ID o Nombre)
                case 'awaiting_data_1':
                    const data1 = ctx.body;
                    if (paymentType === 'game') {
                        await state.update({ gameId: data1, step: 'awaiting_data_2' });
                        await flowDynamic('¡Perfecto! Ahora, por favor, dime tu nombre de usuario en el juego.');
                    } else { // exchange
                        await state.update({ fullName: data1, step: 'awaiting_data_2' });
                        await flowDynamic('¡Entendido! Ahora, por favor, dime tu correo electrónico.');
                    }
                    // Nos quedamos en este bloque para esperar el siguiente dato.
                    return fallBack();

                // El usuario envía el segundo dato (Username o Email)
                case 'awaiting_data_2':
                    const data2 = ctx.body;
                    await state.update(
                        paymentType === 'game' 
                            ? { playerName: data2, step: 'awaiting_image' }
                            : { email: data2, step: 'awaiting_image' }
                    );
                    await flowDynamic('¡Gracias! Ya tengo todos tus datos. Por favor, envía ahora la captura de tu pago para verificarla.');
                    return fallBack();

                // El usuario envía la imagen
                case 'awaiting_image':
                    if (!ctx.message?.imageMessage) {
                        return fallBack('Eso no parece una imagen. Por favor, envía la captura para continuar.');
                    }
                    await flowDynamic('¡Recibí tu comprobante! 📄 Analizando...');
                    try {
                        const imagePath = await provider.saveFile(ctx, { path: './media' });
                        const result = await processPaymentImage(imagePath);

                        if (result.success) {
                            let finalMessage = '¡Verificación exitosa! ✨\n\n';
                            if (paymentType === 'game') {
                                finalMessage += `*Recarga de Juego:*\n*Jugador:* ${state.get('playerName')}\n*ID de Juego:* ${state.get('gameId')}\n*Referencia:* ${result.referenceId}`;
                            } else {
                                finalMessage += `*Recarga de Divisa:*\n*Nombre:* ${state.get('fullName')}\n*Correo:* ${state.get('email')}\n*Referencia:* ${result.referenceId}`;
                            }
                            await flowDynamic(finalMessage + '\n\nEn breve procesaremos tu recarga.');
                            // El flujo termina exitosamente.
                            return endFlow(); 
                        } else {
                            await flowDynamic('No pude confirmar la referencia en la imagen. Por favor, envíala de nuevo.');
                            // Se queda en este paso para que reintente.
                            return fallBack(); 
                        }
                    } catch (error) {
                        console.error("Error en paymentFlow:", error);
                        await flowDynamic("Uups, algo salió mal. Contacta a soporte.");
                        return endFlow();
                    }
            }
        }
    );

export default paymentFlow;
