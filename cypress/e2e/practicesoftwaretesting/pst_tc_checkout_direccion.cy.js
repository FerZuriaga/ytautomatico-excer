// Modulo: Checkout - Paso 3 (Billing Address): direccion de facturacion
// Sitio bajo prueba: https://practicesoftwaretesting.com (Toolshop v5)
// Ticket Jira: SCRUM-508 (CA-03/CA-04, Test Cycle SCRUM-509)
//
// Cliente propio con direccion en el perfil (Calle 1 42, Cordoba, AR 5000),
// sesion iniciada y un Wood Saw en el carrito. Al cargar el paso, la app
// busca la direccion por codigo postal: se espera esa respuesta antes de
// afirmar (ver docs/discovery).

import PSTCheckoutPage from '../../pages/practicesoftwaretesting/PSTCheckoutPage'

const checkout = new PSTCheckoutPage()

const ITEMS = [{ name: 'Wood Saw', quantity: 1 }]

// Direccion de otro cliente (TC-03.2): la precarga debe ser la de cada perfil.
const OTHER_ADDRESS = { street: 'Rivadavia', house_number: '5000', city: 'Buenos Aires', state: 'Buenos Aires', country: 'AR', postal_code: '1406' }

const profileFields = address => ({
    street: address.street, houseNumber: address.house_number, city: address.city,
    state: address.state, country: address.country, postalCode: address.postal_code
})

const openAddress = address => checkout.startAsCustomer(ITEMS, address).then(customer => {
    checkout.proceedFromCart()
    checkout.proceedFromSignIn()
    checkout.waitForAddressLookup()
    return cy.wrap(customer)
})

describe('Checkout: direccion de facturacion [SCRUM-508]', () => {

    // Bug SCRUM-526: la busqueda por codigo postal pisa calle, ciudad y
    // estado del perfil con datos ficticios (en los dos codigos postales).
    // Al cerrarlo, quitar el .skip y el sufijo de TC-03.1 y TC-03.2.
    it.skip('[CA-03][TC-03.1][SCRUM-510] Debe precargar la direccion completa del perfil (bug conocido: SCRUM-526)', () => {
        openAddress().then(({ address }) => {
            checkout.verifyAddressFields(profileFields(address))

            checkout.proceedFromAddress()
        })
    })

    it.skip('[CA-03][TC-03.2][SCRUM-511] Debe precargar la direccion del perfil de otro cliente (bug conocido: SCRUM-526)', () => {
        openAddress(OTHER_ADDRESS).then(({ address }) => {
            checkout.verifyAddressFields(profileFields(address))

            checkout.proceedFromAddress()
        })
    })

    it('[CA-04][TC-04.1][SCRUM-512] No debe avanzar al pago con la calle vacia', () => {
        openAddress().then(() => {
            checkout.verifyAddressProceed(true)

            checkout.clearStreet()
            checkout.verifyAddressProceed(false)
        })
    })

    it('[CA-04][TC-04.2][SCRUM-513] Debe avanzar al pago al completar el dato faltante', () => {
        openAddress().then(({ address }) => {
            checkout.clearStreet()
            checkout.verifyAddressProceed(false)

            checkout.typeStreet(address.street)
            checkout.verifyAddressProceed(true)

            checkout.proceedFromAddress()
        })
    })
})
