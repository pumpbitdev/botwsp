/**
 * Lista de productos de recarga.
 * La estructura es un objeto donde cada clave es el nombre del juego
 * y su valor es una lista de los paquetes de recarga disponibles para ese juego.
 */
const PRODUCTS = {
    "Free Fire": [
        { id: "ff_100", name: "100 Diamantes", price: 1.00 },
        { id: "ff_310", name: "310 Diamantes", price: 3.00 },
        { id: "ff_520", name: "520 Diamantes", price: 5.00 },
        { id: "ff_1060", name: "1060 Diamantes", price: 10.00 },
    ],
    "Call of Duty": [
        { id: "cod_80", name: "80 CP", price: 1.00 },
        { id: "cod_420", name: "420 CP", price: 5.00 },
        { id: "cod_880", name: "880 CP", price: 10.00 },
        { id: "cod_2400", name: "2400 CP", price: 25.00 },
    ],
    "Blood Strike": [
         { id: "bs_100", name: "100 Monedas de Oro", price: 1.00 },
         { id: "bs_500", name: "500 Monedas de Oro", price: 5.00 },
         { id: "bs_1000", name: "1000 Monedas de Oro", price: 10.00 },
    ]
};

/**
 * Servicio para gestionar la información de los productos de recarga.
 */
class ProductService {
    constructor() {
        // En el futuro, aquí podrías inicializar una conexión a una base de datos
        // para obtener estos productos de forma dinámica.
    }

    /**
     * Devuelve todos los productos, agrupados por juego.
     * @returns {Promise<Object>}
     */
    async getAllProducts() {
        // En el futuro, esto podría ser una consulta a la base de datos: SELECT * FROM products.
        return Promise.resolve(PRODUCTS);
    }
}

export default ProductService;
