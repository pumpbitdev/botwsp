/**
 * Lista de productos de recarga.
 * La estructura es un objeto donde cada clave es el nombre del juego
 * y su valor es una lista de los paquetes de recarga disponibles para ese juego.
 */
const PRODUCTS = {
    "Free Fire": [
        { id: "ff_100", name: "100 Diamantes", price: 1.36 },
        { id: "ff_310", name: "310 Diamantes", price: 4.08 },
        { id: "ff_520", name: "520 Diamantes", price: 6.84 },
        { id: "ff_1060", name: "1060 Diamantes", price: 13.66 },
        { id: "ff_2180", name: "2180 Diamantes", price: 27.21 },
    ],
    "Call of Duty": [
        { id: "cod_30", name: "30 CP", price: 0.70 },
        { id: "cod_80", name: "80 CP", price: 1.38 },
        { id: "cod_460", name: "460 CP", price: 5.58 },
        { id: "cod_960", name: "960 CP", price: 10.38 },
        { id: "cod_2600", name: "2600 CP", price: 25.98 },
    ],
    "Blood Strike": [
         { id: "bs_50", name: "50 Gold", price: 0.70 },
         { id: "bs_100", name: "100 Gold", price: 1.38 },
         { id: "bs_300", name: "200 Gold", price: 4.18 },
         { id: "bs_500", name: "500 Gold", price: 6.95 },
         { id: "bs_1000", name: "1000 Gold", price: 12.98 },
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
