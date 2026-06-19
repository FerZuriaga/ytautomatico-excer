// Test: Verificar suscripción desde la página del carrito con Page Object Model
// Sitio bajo prueba: https://automationexercise.com
// Ticket: SCRUM-32 | TC11 - Verify Subscription in Cart page

import HomePage from '../pages/HomePage'

describe('[SCRUM-32] TC11 - Verify Subscription in Cart page', () => {

    const homePage = new HomePage()

    beforeEach(() => {
        cy.gotoAEUrl('/')
    })

    it('Debe verificar la suscripción exitosa desde el footer de la página del carrito', () => {

        // Paso 1: Verificar que la home page cargó correctamente
        homePage.verifyHomePageVisible()

        // Paso 2: Click en el botón "Cart" del menú de navegación
        homePage.clickCartButton()

        // Paso 3: Verificar que estamos en la página del carrito
        homePage.verifyCartPageVisible()

        // Paso 4: Scroll al footer
        homePage.scrollToFooter()

        // Paso 5: Verificar que el título "SUBSCRIPTION" es visible
        homePage.verifySubscriptionTitle()

        // Paso 6: Ingresar email y hacer click en el botón de suscripción
        homePage.subscribeWithEmail('testuser@example.com')

        // Paso 7: Verificar mensaje de éxito
        homePage.verifySubscriptionSuccess()
    })
})
