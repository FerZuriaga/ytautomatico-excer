// Modulo: Checkout - Paso 2 (Sign in): identificarse para comprar
// Sitio bajo prueba: https://practicesoftwaretesting.com (Toolshop v5)
// Ticket Jira: SCRUM-502 (CA-01/CA-02, Test Cycle SCRUM-503)
//
// Carrito con un Wood Saw preparado por API; el cliente con sesion es una
// cuenta propia registrada en cada test.

import PSTCheckoutPage from '../../pages/practicesoftwaretesting/PSTCheckoutPage'

const checkout = new PSTCheckoutPage()

const ITEMS = [{ name: 'Wood Saw', quantity: 1 }]
const GUEST = { email: 'invitado.qa@example.com', firstName: 'Invi', lastName: 'Tado' }

describe('Checkout: identificarse para comprar [SCRUM-502]', () => {

    it('[CA-01][TC-01.1][SCRUM-504] Debe continuar la compra con la sesion iniciada', () => {
        checkout.startAsCustomer(ITEMS).then(customer => {
            checkout.proceedFromCart()
            checkout.verifyGreeting(customer)

            checkout.proceedFromSignIn()
        })
    })

    it('[CA-01][TC-01.2][SCRUM-505] Debe pedir identificacion sin sesion iniciada', () => {
        checkout.startAsGuest(ITEMS)

        checkout.proceedFromCart()
        checkout.verifySignInRequired()

        checkout.openGuestTab()
    })

    it('[CA-02][TC-02.1][SCRUM-506] Debe continuar la compra como invitado', () => {
        checkout.startAsGuest(ITEMS)
        checkout.proceedFromCart()
        checkout.openGuestTab()

        checkout.typeGuest('guestEmail', GUEST.email)
        checkout.typeGuest('guestFirstName', GUEST.firstName)
        checkout.typeGuest('guestLastName', GUEST.lastName)
        checkout.submitGuest()
        checkout.verifyGuestAccepted(GUEST)

        checkout.proceedFromSignIn({ guest: true })
        checkout.verifyAddressEmpty()
    })

    it('[CA-02][TC-02.2][SCRUM-507] No debe continuar como invitado sin datos', () => {
        checkout.startAsGuest(ITEMS)
        checkout.proceedFromCart()
        checkout.openGuestTab()

        checkout.submitGuest()

        checkout.verifyGuestErrors()
    })
})
