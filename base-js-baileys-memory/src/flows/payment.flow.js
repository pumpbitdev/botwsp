import { addKeyword } from '@builderbot/bot';
import { processPaymentImage } from '../services/image.service.js';

const paymentFlow = addKeyword(['confirmo', 'confirmar'], { sensitive: true })
    .addAnswer(
        '¡Perfecto! Vamos a confirmar tu pago.\nPor favor, dime qué tipo de recarga estás pagando:\n\n1. 👉 Recarga de *Juegos*\n2. 👉 Recarga de *Divisas* (Zinli)',
        { capture: true },
        async (ctx, { state, flowDynamic, fallBack, endFlow, provider }) => {
            
            // Obtenemos el paso actual del state, si no existe, es el 'paso_inicial'.
            const currentStep = state.get('step') || 'paso_inicial';

            switch (currentStep) {
                // --- Caso 1: El usuario elige el tipo de pago ---
                case 'paso_inicial':
                    const userChoice = ctx.body.toLowerCase();
                    let paymentType = null;

                    if (userChoice.includes('juego')) {
                        paymentType = 'game';
                    } else if (userChoice.includes('divisa') || userChoice.includes('zinli')) {
                        paymentType = 'exchange';
                    } else {
                        return fallBack('No entendí esa opción. Por favor, responde "juegos" o "divisas".');
                    }
                    
                    // Actualizamos el state con la elección y el siguiente paso.
                    await state.update({ paymentType, step: 'obtener_dato_1' });

                    // Hacemos la siguiente pregunta.
                    if (paymentType === 'game') {
                        await flowDynamic('¡Entendido! Por favor, envíame el ID de tu cuenta de juego.');
                    } else { // exchange
                        await flowDynamic('¡Entendido! Por favor, envíame tu nombre completo.');
                    }
                    // Usamos fallBack() para quedarnos en este mismo bloque .addAnswer y esperar la respuesta.
                    return fallBack();

                // --- Caso 2: El usuario envía el primer dato (ID o Nombre) ---
                case 'obtener_dato_1':
                    const data1 = ctx.body;
                    const pt1 = state.get('paymentType');

                    if (pt1 === 'game') {
                        await state.update({ gameId: data1, step: 'obtener_dato_2' });
                        await flowDynamic('¡Perfecto! Ahora, por favor, dime tu nombre de usuario en el juego.');
                    } else { // exchange
                        await state.update({ fullName: data1, step: 'obtener_dato_2' });
                        await flowDynamic('¡Entendido! Ahora, por favor, dime tu correo electrónico.');
                    }
                    return fallBack();

                // --- Caso 3: El usuario envía el segundo dato (Username o Email) ---
                case 'obtener_dato_2':
                    const data2 = ctx.body;
                    await state.update(
                        state.get('paymentType') === 'game' 
                            ? { playerName: data2, step: 'obtener_imagen' }
                            : { email: data2, step: 'obtener_imagen' }
                    );
                    await flowDynamic('¡Gracias! Ya tengo todos tus datos. Por favor, envía ahora la captura de tu pago para verificarla.');
                    return fallBack();

                // --- Caso 4: El usuario envía la imagen ---
                case 'obtener_imagen':
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
