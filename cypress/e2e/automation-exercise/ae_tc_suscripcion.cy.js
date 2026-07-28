// Modulo: Suscripcion (Newsletter) - AutomationExercise
// Sitio bajo prueba: https://automationexercise.com
// Agrupa: TC10 [SCRUM-5] (Home page), TC11 [SCRUM-32] (Cart page)
// Mismo criterio de negocio (suscripcion exitosa) validado desde dos puntos
// de entrada distintos (footer de Home y footer de Cart).

import HomePage from '../../pages/automation-exercise/HomePage'

const homePage = new HomePage()

describe('Test Case 10 - Verify Subscription in home page', () => {

    const SUBSCRIBER_EMAIL = 'testuser@example.com'

    beforeEach(() => {
        // Step 1-3: Navigate to home page and verify it is visible
        cy.gotoAEUrl('/')
        homePage.verifyHomePageVisible()
    })

    it('Should subscribe successfully via the footer newsletter form', () => {

        // Step 4: Scroll down to footer
        homePage.scrollToFooter()

        // Step 5: Verify text 'SUBSCRIPTION' is visible
        homePage.verifySubscriptionTitle()

        // Step 6: Enter email address in input and click arrow button
        homePage.subscribeWithEmail(SUBSCRIBER_EMAIL)

        // Step 7: Verify success message is visible
        homePage.verifySubscriptionSuccess()
    })
})

describe('[SCRUM-32] TC11 - Verify Subscription in Cart page', () => {

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
