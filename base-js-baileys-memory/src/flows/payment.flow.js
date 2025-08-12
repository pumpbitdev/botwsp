import { addKeyword } from '@builderbot/bot';
import { processPaymentImage } from '../services/image.service.js';

const paymentFlow = addKeyword(['confirmo', 'confirmar'], { sensitive: true })
    .addAnswer(
        // LA CORRECCIÓN: El mensaje inicial se elimina de aquí.
        // Ahora este bloque solo sirve para capturar y procesar.
        null,
        { capture: true },
        async (ctx, { state, flowDynamic, fallBack, endFlow, provider }) => {
            
            const currentStep = state.get('step');

            // --- Si es la primera vez en el flujo, enviamos el mensaje de bienvenida ---
            if (!currentStep) {
                await flowDynamic('¡Perfecto! Vamos a confirmar tu pago.\nPor favor, dime qué tipo de recarga estás pagando:\n\n1. 👉 Recarga de *Juegos*\n2. 👉 Recarga de *Divisas* (Zinli)');
                await state.update({ step: 'awaiting_choice' });
                // Usamos return para esperar la respuesta del usuario sin hacer nada más.
                return;
            }

            // --- A partir de aquí, manejamos los diferentes pasos de la conversación ---
            switch (currentStep) {
                case 'awaiting_choice':
                    const userChoice = ctx.body.toLowerCase();
                    let paymentType = null;

                    if (userChoice.includes('juego')) {
                        paymentType = 'game';
                    } else if (userChoice.includes('divisa') || userChoice.includes('zinli')) {
                        paymentType = 'exchange';
                    } else {
                        // Si no entendemos, repetimos la pregunta sin cambiar de paso.
                        await flowDynamic('No entendí esa opción. Por favor, responde "juegos" o "divisas".');
                        return fallBack();
                    }
                    
                    await state.update({ paymentType, step: 'awaiting_data_1' });

                    if (paymentType === 'game') {
                        await flowDynamic('¡Entendido! Por favor, envíame el ID de tu cuenta de juego.');
                    } else { // exchange
                        await flowDynamic('¡Entendido! Por favor, envíame tu nombre completo.');
                    }
                    return fallBack();

                case 'awaiting_data_1':
                    const data1 = ctx.body;
                    const pt1 = state.get('paymentType');

                    if (pt1 === 'game') {
                        await state.update({ gameId: data1, step: 'awaiting_data_2' });
                        await flowDynamic('¡Perfecto! Ahora, por favor, dime tu nombre de usuario en el juego.');
                    } else { // exchange
                        await state.update({ fullName: data1, step: 'awaiting_data_2' });
                        await flowDynamic('¡Entendido! Ahora, por favor, dime tu correo electrónico.');
                    }
                    return fallBack();

                case 'awaiting_data_2':
                    const data2 = ctx.body;
                    await state.update(
                        state.get('paymentType') === 'game' 
                            ? { playerName: data2, step: 'awaiting_image' }
                            : { email: data2, step: 'awaiting_image' }
                    );
                    await flowDynamic('¡Gracias! Ya tengo todos tus datos. Por favor, envía ahora la captura de tu pago para verificarla.');
                    return fallBack();

                case 'awaiting_image':
                    if (!ctx.message?.imageMessage) {
                        return fallBack('Eso no parece una imagen. Por favor, envía la captura para continuar.');
                    }
                    await flowDynamic('¡Recibí tu comprobante! 📄 Analizando...');
                    try {
                        const imagePath = await provider.saveFile(ctx, { path: './media' });
                        const result = await processPaymentImage(imagePath);

                        if (result.success) {
                            const pt3 = state.get('paymentType');
                            let finalMessage = '¡Verificación exitosa! ✨\n\n';
                            if (pt3 === 'game') {
                                finalMessage += `*Recarga de Juego:*\n*Jugador:* ${state.get('playerName')}\n*ID de Juego:* ${state.get('gameId')}\n*Referencia:* ${result.referenceId}`;
                            } else {
                                finalMessage += `*Recarga de Divisa:*\n*Nombre:* ${state.get('fullName')}\n*Correo:* ${state.get('email')}\n*Referencia:* ${result.referenceId}`;
                            }
                            await flowDynamic(finalMessage + '\n\nEn breve procesaremos tu recarga.');
                            return endFlow(); // El flujo termina exitosamente.
                        } else {
                            await flowDynamic('No pude confirmar la referencia en la imagen. Por favor, envíala de nuevo.');
                            return fallBack(); // Se queda en este paso para que reintente.
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
