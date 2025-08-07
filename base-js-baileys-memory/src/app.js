import { createBot, createProvider, createFlow, MemoryDB } from '@builderbot/bot'
import { BaileysProvider } from '@builderbot/provider-baileys'
import 'dotenv/config'

import mainFlow from './flows/main.flow.js'
import { salesFlow, pricesFlow } from './flows/sales.flow.js'
import paymentFlow from './flows/payment.flow.js'
import gamesFlow from './flows/catalogo.flow.js'

const PORT = process.env.PORT ?? 3002

const main = async () => {
    const adapterDB = new MemoryDB()
    // Aseguramos que 'paymentFlow' esté en la lista de flujos.
    const adapterFlow = createFlow([mainFlow, salesFlow, pricesFlow, gamesFlow, paymentFlow]) 
    const adapterProvider = createProvider(BaileysProvider)

    const { httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    httpServer(PORT, () => console.log(`Servidor escuchando en el puerto ${PORT}`))
}

main()
