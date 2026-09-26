// Modulo: Carrito - Descuento por compra de productos ecologicos
// Sitio bajo prueba: https://practicesoftwaretesting.com (Toolshop v5)
// Ticket Jira: SCRUM-475 (CA-01/CA-02, Test Cycle SCRUM-476)
//
// 5% del total cuando MAS del 50% de las unidades tienen CO2 A o B. Wood
// Saw es B; Hammer es D. Precondicion por API (cy.pstSeedCart).

import PSTCartPage from '../../pages/practicesoftwaretesting/PSTCartPage'

const cart = new PSTCartPage()

const openCartWith = (items) => cart.openWithItems(items)

describe('Carrito: descuento por compra de productos ecologicos [SCRUM-475]', () => {

    it('[CA-01][TC-01.1][SCRUM-477] Debe aplicar el descuento con todo el carrito ecologico', () => {
        openCartWith([{ name: 'Wood Saw', quantity: 1 }])

        cart.verifyEcoDiscount({ subtotal: '$12.18', eco: '- $0.61', total: '$11.57' })
    })

    it('[CA-01][TC-01.2][SCRUM-478] Debe aplicar el descuento con mayoria de unidades ecologicas', () => {
        openCartWith([{ name: 'Wood Saw', quantity: 2 }, { name: 'Hammer', quantity: 1 }])

        cart.verifyEcoDiscount({ subtotal: '$36.94', eco: '- $1.85', total: '$35.09' })
    })

    it('[CA-01][TC-01.3][SCRUM-479] No debe aplicar el descuento con exactamente la mitad de unidades ecologicas', () => {
        openCartWith([{ name: 'Wood Saw', quantity: 1 }, { name: 'Hammer', quantity: 1 }])

        cart.verifyTotal('$24.76')
        cart.verifyNoDiscountRows()
    })

    it('[CA-02][TC-02.1][SCRUM-480] Aumentar unidades ecologicas debe hacer aparecer el descuento', () => {
        openCartWith([{ name: 'Wood Saw', quantity: 1 }, { name: 'Hammer', quantity: 1 }])
        cart.verifyTotal('$24.76')
        cart.verifyNoDiscountRows()

        cart.changeQuantity('Wood Saw', '2')

        cart.verifyEcoDiscount({ subtotal: '$36.94', eco: '- $1.85', total: '$35.09' })
    })

    it('[CA-02][TC-02.2][SCRUM-481] Aumentar unidades no ecologicas debe quitar el descuento', () => {
        openCartWith([{ name: 'Wood Saw', quantity: 2 }, { name: 'Hammer', quantity: 1 }])
        cart.verifyEcoDiscount({ subtotal: '$36.94', eco: '- $1.85', total: '$35.09' })

        cart.changeQuantity('Hammer', '2')

        cart.verifyTotal('$49.52')
        cart.verifyNoDiscountRows()
    })
})
