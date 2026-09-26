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

const openAddress = () => checkout.startAsCustomer(ITEMS).then(customer => {
    checkout.proceedFromCart()
    checkout.proceedFromSignIn()
    checkout.waitForAddressLookup()
    return cy.wrap(customer)
})

describe('Checkout: direccion de facturacion [SCRUM-508]', () => {

    it('[CA-03][TC-03.1][SCRUM-510] Debe precargar pais, codigo postal y numero del perfil', () => {
        openAddress().then(({ address }) => {
            checkout.verifyAddressFields({ country: address.country, postalCode: address.postal_code, houseNumber: address.house_number })

            checkout.proceedFromAddress()
        })
    })

    // Bug SCRUM-526: la busqueda por codigo postal pisa calle, ciudad y
    // estado del perfil con datos ficticios. Al cerrarlo, quitar el .skip y el sufijo.
    it.skip('[CA-03][TC-03.2][SCRUM-511] Debe precargar calle, ciudad y estado del perfil (bug conocido: SCRUM-526)', () => {
        openAddress().then(({ address }) => {
            checkout.verifyAddressFields({ street: address.street, city: address.city, state: address.state })

            checkout.proceedFromAddress()
        })
    })

    // Bug SCRUM-528: el campo vacio nunca se marca como invalido (el boton
    // si se deshabilita, eso lo cubre TC-04.2). Al cerrarlo, quitar el .skip y el sufijo.
    it.skip('[CA-04][TC-04.1][SCRUM-512] No debe avanzar al pago con la calle vacia (bug conocido: SCRUM-528)', () => {
        openAddress().then(() => {
            checkout.verifyAddressProceed(true)

            checkout.clearStreet()

            checkout.verifyStreetInvalid(true)
            checkout.verifyAddressProceed(false)
        })
    })

    it('[CA-04][TC-04.2][SCRUM-513] Debe avanzar al pago al completar el dato faltante', () => {
        openAddress().then(({ address }) => {
            checkout.clearStreet()
            checkout.verifyAddressProceed(false)

            checkout.typeStreet(address.street)
            // "Deja de estar marcado" no se afirma mientras siga abierto el
            // Bug SCRUM-528: nunca se marca, pasaria siempre (falso positivo).
            // Al cerrarlo, agregar checkout.verifyStreetInvalid(false).
            checkout.verifyAddressProceed(true)

            checkout.proceedFromAddress()
        })
    })
})
