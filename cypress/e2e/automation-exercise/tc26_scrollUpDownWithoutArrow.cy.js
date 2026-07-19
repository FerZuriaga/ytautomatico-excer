// Test Case 26 - Verify Scroll Up without Arrow button and Scroll Down functionality
// Sitio bajo prueba: https://automationexercise.com
// SCRUM-10

import HomePage from '../../pages/automation-exercise/HomePage'

describe('TC26 - Verify Scroll Up without Arrow button and Scroll Down functionality', () => {

    // Instancia del Page Object
    const homePage = new HomePage()

    beforeEach(() => {
        // Interceptar recursos innecesarios para mejorar performance
        cy.intercept({ resourceType: /fetch/ }, { log: false })
        // Navegar a la home antes de cada test
        cy.gotoAEUrl('/')
    })

    it('Debe hacer scroll hasta el footer y volver al inicio sin usar el botón de flecha', () => {

        // Paso 1: Verificar que la home page es visible al inicio
        homePage.verifyHomePageVisible()

        // Paso 2: Hacer scroll hacia abajo hasta el footer
        homePage.scrollToBottom()

        // Paso 3: Verificar que el footer es visible
        homePage.verifyFooterVisible()

        // Paso 4: Verificar que el título de suscripción del footer es visible
        homePage.verifySubscriptionTitle()

        // Paso 5: Hacer scroll hacia arriba sin usar el botón de flecha
        homePage.scrollToTop()

        // Paso 6: Verificar que el header/logo es visible nuevamente en la parte superior
        homePage.verifyHeaderVisible()

        // Paso 7: Verificar que el slider de la home es visible (confirma que está en el top)
        homePage.verifyHomePageVisible()
    })
})
