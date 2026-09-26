// Modulo: Carrito - Quitar productos
// Sitio bajo prueba: https://practicesoftwaretesting.com (Toolshop v5)
// Ticket Jira: SCRUM-469 (CA-01/CA-02, Test Cycle SCRUM-470)
//
// Precondicion por API (cy.pstSeedCart). El carrito vacio sin cart_id se
// abre por URL directa (TC SCRUM-474 en skip por el Bug SCRUM-483).

import PSTCartPage from '../../pages/practicesoftwaretesting/PSTCartPage'

const cart = new PSTCartPage()

const openCartWith = (items) => cart.openWithItems(items)

describe('Carrito: quitar productos [SCRUM-469]', () => {

    it('[CA-01][TC-01.1][SCRUM-471] Quitar un producto debe recalcular el total y el contador', () => {
        openCartWith([{ name: 'Hammer', quantity: 2 }, { name: 'Pliers', quantity: 1 }])
        cart.verifyTotal('$37.17')

        cart.removeProduct('Pliers')

        cart.verifyToast('productDeleted')
        cart.verifyProducts(['Hammer'])
        cart.verifyTotal('$25.16')
        cart.verifyCartBadge(2)
    })

    it('[CA-01][TC-01.2][SCRUM-472] Quitar productos de a uno debe dejar solo el restante', () => {
        openCartWith([{ name: 'Hammer', quantity: 2 }, { name: 'Pliers', quantity: 1 }, { name: 'Combination Pliers', quantity: 1 }])
        cart.verifyTotal('$51.32')

        cart.removeProduct('Pliers')
        cart.verifyProducts(['Hammer', 'Combination Pliers'])
        cart.verifyTotal('$39.31')

        cart.removeProduct('Combination Pliers')

        cart.verifyProducts(['Hammer'])
        cart.verifyTotal('$25.16')
    })

    it('[CA-02][TC-02.1][SCRUM-473] Quitar el ultimo producto debe dejar el carrito vacio', () => {
        openCartWith([{ name: 'Hammer', quantity: 1 }])
        cart.verifyTotal('$12.58')

        cart.removeProduct('Hammer')

        cart.verifyEmpty()
    })

    // Bug SCRUM-483: sin productos el carrito queda en blanco (sin el
    // mensaje de vacio). Al cerrar SCRUM-483, quitar el .skip y el sufijo.
    it.skip('[CA-02][TC-02.2][SCRUM-474] Entrar al carrito sin productos debe informar que esta vacio (bug conocido: SCRUM-483)', () => {
        cy.gotoPSTUrl('/checkout')

        cart.verifyEmpty()
    })
})
