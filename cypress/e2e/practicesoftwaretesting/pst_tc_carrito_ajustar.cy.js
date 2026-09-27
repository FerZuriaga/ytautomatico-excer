// Modulo: Carrito - Revisar y ajustar las cantidades
// Sitio bajo prueba: https://practicesoftwaretesting.com (Toolshop v5)
// Ticket Jira: SCRUM-460 (CA-01/CA-02/CA-03, Test Cycle SCRUM-461)
//
// Precondicion por API (cy.pstSeedCart): el carrito se arma con la API y
// se abre desde el menu. Ver docs/discovery/practicesoftwaretesting.md,
// seccion Lote 3.

import PSTCatalogPage from '../../pages/practicesoftwaretesting/PSTCatalogPage'
import PSTCartPage from '../../pages/practicesoftwaretesting/PSTCartPage'

const catalog = new PSTCatalogPage()
const cart = new PSTCartPage()

const openCartWith = (items) => cart.openWithItems(items)

const HAMMER_2_PLIERS_1 = [{ name: 'Hammer', quantity: 2 }, { name: 'Pliers', quantity: 1 }]

describe('Carrito: revisar y ajustar las cantidades [SCRUM-460]', () => {

    it('[CA-01][TC-01.1][SCRUM-462] Debe mostrar productos, cantidades y totales', () => {
        openCartWith(HAMMER_2_PLIERS_1)

        cart.verifyLine('Hammer', { quantity: 2, unitPrice: '$12.58', lineTotal: '$25.16' })
        cart.verifyLine('Pliers', { quantity: 1, unitPrice: '$12.01', lineTotal: '$12.01' })
        cart.verifyTotal('$37.17')
        cart.verifyNoDiscountRows()
    })

    it('[CA-01][TC-01.2][SCRUM-463] Continue Shopping debe volver al catalogo sin perder el carrito', () => {
        openCartWith(HAMMER_2_PLIERS_1)
        cart.verifyTotal('$37.17')

        cart.continueShopping()

        catalog.verifyProductCount(9)
        cart.verifyCartBadge(3)
    })

    it('[CA-02][TC-02.1][SCRUM-464] Cambiar la cantidad debe actualizar los totales y el contador', () => {
        openCartWith(HAMMER_2_PLIERS_1)
        cart.verifyLine('Hammer', { quantity: 2 })
        cart.verifyTotal('$37.17')

        cart.changeQuantity('Hammer', '3')

        cart.verifyToast('quantityUpdated')
        cart.verifyLine('Hammer', { quantity: 3, lineTotal: '$37.74' })
        cart.verifyTotal('$49.75')
        cart.verifyCartBadge(4)
    })

    it('[CA-02][TC-02.2][SCRUM-465] Una cantidad mayor a 99 debe corregirse a 99 con aviso', () => {
        openCartWith([{ name: 'Hammer', quantity: 1 }])
        cart.verifyTotal('$12.58')

        cart.changeQuantity('Hammer', '150')

        cart.verifyToast('maxQuantity')
        cart.verifyLine('Hammer', { quantity: 99 })
        cart.verifyTotal('$1,245.42')
    })

    it('[CA-02][TC-02.3][SCRUM-466] Una cantidad de 0 debe corregirse a 1', () => {
        openCartWith([{ name: 'Hammer', quantity: 2 }])
        cart.verifyTotal('$25.16')

        cart.changeQuantity('Hammer', '0')

        cart.verifyLine('Hammer', { quantity: 1 })
        cart.verifyTotal('$12.58')
    })

    // La regla (rechazo con aviso, el carrito conserva 1 unidad en el total
    // y el contador) se cumple. La fila que sigue mostrando 2 unidades y
    // $22.28 es el Bug SCRUM-484 (resultado secundario, fuera de este TC).
    it('[CA-03][TC-03.1][SCRUM-467] No debe permitir llevar mas de un Thor Hammer', () => {
        openCartWith([{ name: 'Thor Hammer', quantity: 1 }])
        cart.verifyTotal('$11.14')

        cart.changeQuantity('Thor Hammer', '2')

        cart.verifyToast('thorLimit')
        cart.verifyTotal('$11.14')
        cart.verifyCartBadge(1)
    })

    it('[CA-03][TC-03.2][SCRUM-468] El limite de Thor Hammer no debe afectar a los demas productos', () => {
        openCartWith([{ name: 'Thor Hammer', quantity: 1 }, { name: 'Hammer', quantity: 1 }])
        cart.verifyTotal('$23.72')

        cart.changeQuantity('Hammer', '2')

        cart.verifyToast('quantityUpdated')
        cart.verifyLine('Hammer', { quantity: 2 })
        cart.verifyTotal('$36.30')
    })
})
