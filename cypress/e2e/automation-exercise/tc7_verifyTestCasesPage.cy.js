// Test: Verificar página de Test Cases con Page Object Model
// Sitio bajo prueba: https://automationexercise.com
// Ticket: SCRUM-31 | TC7 - Verify Test Cases Page

import TestCasesPage from '../../pages/automation-exercise/TestCasesPage'

describe('[SCRUM-31] TC7 - Verify Test Cases Page', () => {

    // Instancia de la clase Page Object
    const testCasesPage = new TestCasesPage()

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
