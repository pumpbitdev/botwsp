import OpenAI from 'openai';
import ProductService from './perfume.service.js'; // El nombre del archivo aún es perfume.service.js
import { getMemory, appendToMemory } from './memory.service.js';

const openai = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
});

// Instanciamos nuestro nuevo servicio de productos
const productService = new ProductService();

/**
 * Formatea la lista de productos para que sea legible por la IA.
 * @param {Object} products - El objeto de productos obtenido del servicio.
 * @returns {string} - Un string formateado para el prompt.
 */
function formatProductsForPrompt(products) {
    let formattedString = '';
    for (const game in products) {
        formattedString += `**${game}**:`; // Título del juego en negrita
        const packages = products[game].map(pkg => `- ${pkg.name}: $${pkg.price.toFixed(2)} USD`).join('');
        formattedString += packages + '';
    }
    return formattedString;
}

/**
 * Obtiene una respuesta de la IA.
 * @param {string} promptTemplate - La plantilla del prompt (personalidad) que la IA debe adoptar.
 * @param {string} userId - El ID del usuario para recuperar el historial de chat.
 * @param {string} userMessage - El mensaje actual del usuario.
 * @returns {Promise<string>} - La respuesta generada por la IA.
 */
async function getResponse(promptTemplate, userId, userMessage) {
    if (userMessage.trim().toLowerCase() === "confirmo" || userMessage.trim().toLowerCase() === "confirmar") {
        console.log("[AI Service] Mensaje exacto 'recargas', redirigiendo al menú");
        return "confirmo";
    }

    try {
        let finalPrompt = promptTemplate;

        // Si el prompt necesita la lista de productos, la buscamos y la inyectamos.
        if (promptTemplate.includes('{product_list}')) {
            const allProducts = await productService.getAllProducts();
            const productListForPrompt = formatProductsForPrompt(allProducts);
            finalPrompt = promptTemplate.replace('{product_list}', productListForPrompt);
        }

        const history = await getMemory(userId);

        const messages = [
            { 
                role: 'system', 
                content: finalPrompt
            },
            ...history,
            {
                role: 'user',
                content: userMessage
            }
        ];

        const response = await openai.chat.completions.create({
            model: 'deepseek-chat',
            messages: messages,
        });

        const botReply = response.choices[0].message.content;

        appendToMemory(userId, 'user', userMessage);
        appendToMemory(userId, 'assistant', botReply);

        return botReply;

    } catch (error) {
        console.error('Error en getResponse:', error);
        return 'Lo siento, tuve un problema para procesar tu solicitud.';
    }
}

export { getResponse };
