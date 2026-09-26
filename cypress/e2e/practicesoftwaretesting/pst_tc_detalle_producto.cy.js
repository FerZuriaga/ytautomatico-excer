// Modulo: Catalogo - Detalle de producto y cantidad a comprar
// Sitio bajo prueba: https://practicesoftwaretesting.com (Toolshop v5)
// Ticket Jira: SCRUM-427 (CA-01/CA-02/CA-03, Test Cycle SCRUM-428)
//
// A la ficha se entra desde la tarjeta del catalogo por nombre: los ids
// cambian en cada re-siembra de la demo. Cada test arranca con el carrito
// vacio (Cypress limpia el almacenamiento entre tests).

import PSTCatalogPage from '../../pages/practicesoftwaretesting/PSTCatalogPage'
import PSTProductDetailPage from '../../pages/practicesoftwaretesting/PSTProductDetailPage'

const catalog = new PSTCatalogPage()
const detail = new PSTProductDetailPage()

const openThorHammer = () => {
    catalog.openProduct('Thor Hammer')
    detail.verifyProductName('Thor Hammer')
}

describe('Catalogo: detalle de producto y cantidad a comprar [SCRUM-427]', () => {

    beforeEach(() => {
        catalog.visit()
        catalog.verifyInitialCatalog()
    })

    it('[CA-01][TC-01.1][SCRUM-429] La ficha debe mostrar los datos principales del producto', () => {
        catalog.openProduct('Thor Hammer')

        detail.verifyMainData({ name: 'Thor Hammer', price: '11.14', category: 'Hammer', brand: 'ForgeFlex Tools' })
    })

    it('[CA-01][TC-01.2][SCRUM-430] La ficha debe mostrar las especificaciones del producto', () => {
        openThorHammer()

        detail.verifySpec({ slug: 'head-weight', value: '4500', unit: 'g' })
        detail.verifySpec({ slug: 'handle-material', value: 'Leather Wrapped' })
        detail.verifySpec({ slug: 'warranty', value: 'Lifetime' })
    })

    it('[CA-01][TC-01.3][SCRUM-431] La ficha debe mostrar productos relacionados de la misma categoria', () => {
        openThorHammer()

        detail.verifyRelatedProducts({ include: ['Hammer', 'Claw Hammer', 'Court Hammer'], exclude: 'Thor Hammer' })
    })

    it('[CA-02][TC-02.1][SCRUM-432] Debe aumentar y disminuir la cantidad', () => {
        openThorHammer()
        detail.verifyQuantity(1)

        detail.increaseQuantity()
        detail.verifyQuantity(2)

        detail.decreaseQuantity()
        detail.verifyQuantity(1)
    })

    it('[CA-02][TC-02.2][SCRUM-433] La cantidad no debe bajar de 1', () => {
        openThorHammer()
        detail.verifyQuantity(1)

        detail.decreaseQuantity()

        detail.verifyQuantity(1)
    })

    it('[CA-02][TC-02.3][SCRUM-434] Una cantidad mayor a 99 debe corregirse a 99 con aviso', () => {
        openThorHammer()
        detail.verifyQuantity(1)

        detail.enterQuantity('150')

        detail.verifyQuantity(99)
        detail.verifyToast('maxQuantity')
    })

    it('[CA-02][TC-02.4][SCRUM-435] Una cantidad de 0 debe corregirse a 1', () => {
        openThorHammer()
        detail.verifyQuantity(1)

        detail.enterQuantity('0')

        detail.verifyQuantity(1)
    })

    // Hammer y no Thor Hammer: la tienda permite un solo Thor Hammer por
    // carrito ("You can only have one Thor Hammer in the cart.").
    it('[CA-03][TC-03.1][SCRUM-436] Debe agregar al carrito un producto con stock', () => {
        catalog.openProduct('Hammer')
        detail.verifyProductName('Hammer')
        detail.verifyQuantity(1)
        detail.verifyAddToCartEnabled()
        detail.increaseQuantity()
        detail.verifyQuantity(2)

        detail.addToCart()

        detail.verifyToast('addedToCart')
        detail.verifyCartQuantity(2)
    })

    it('[CA-03][TC-03.2][SCRUM-437] Un producto sin stock no debe poder agregarse al carrito', () => {
        catalog.openProduct('Long Nose Pliers')

        detail.verifyProductName('Long Nose Pliers')
        detail.verifyOutOfStock()
        detail.verifyAddToCartDisabled()
    })
})
