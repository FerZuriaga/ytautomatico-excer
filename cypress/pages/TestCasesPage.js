// Page Object Model - TestCasesPage
// Encapsula selectores y acciones de la página de test cases de automationexercise.com

class TestCasesPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    // Botón "Test Cases" en la barra de navegación superior
    get testCasesNavBtn() {
        return cy.get('.navbar-nav a[href="/test_cases"]')
    }

    // Título principal de la página de test cases
    get pageTitle() {
        return cy.get('h2.title')
    }

    // Listado de paneles de test cases (accordion/panel)
    get testCasePanels() {
        return cy.get('.panel-title')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    // Hace click en el enlace "Test Cases" del menú de navegación
    clickTestCasesButton() {
        this.testCasesNavBtn.should('be.visible').click()
    }

    // Verifica que la URL contiene /test_cases y que hay contenido visible
    verifyTestCasesPage() {
        cy.url().should('include', '/test_cases')
        this.pageTitle.should('be.visible').and('contain.text', 'Test Cases')
        this.testCasePanels.its('length').should('be.gt', 0)
    }
}

export default TestCasesPage
