// Modulo: Navegacion y Paginas Informativas - AutomationExercise
// Sitio bajo prueba: https://automationexercise.com
// Agrupa: TC7 [SCRUM-31] (pagina Test Cases), TC26 [SCRUM-10] (scroll de Home)

import HomePage from '../../pages/automation-exercise/HomePage'
import TestCasesPage from '../../pages/automation-exercise/TestCasesPage'

const homePage = new HomePage()
const testCasesPage = new TestCasesPage()

describe('[SCRUM-31] TC7 - Verify Test Cases Page', () => {

    beforeEach(() => {
        // Navegar a la home antes de cada test usando el comando custom del proyecto
        cy.gotoAEUrl('/')
    })

    it('Debe navegar a la página Test Cases y verificar que tiene contenido visible', () => {

        // Paso 1: Verificar que la home cargó correctamente
        cy.url().should('include', 'automationexercise.com')

        // Paso 2: Hacer click en "Test Cases" del menú de navegación
        testCasesPage.clickTestCasesButton()

        // Paso 3: Verificar URL, título y contenido de la página de Test Cases
        testCasesPage.verifyTestCasesPage()
    })
})

describe('TC26 - Verify Scroll Up without Arrow button and Scroll Down functionality', () => {

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
