// Page Object Model - OrangeHRMDirectoryPage
// Encapsula selectores y acciones de la pantalla Directory de OrangeHRM:
// busqueda de empleados por nombre y por puesto (solo lectura).

class OrangeHRMDirectoryPage {

    // ─── Selectores - Navegacion ─────────────────────────────────────────────

    get directoryMenuLink() {
        return cy.get('.oxd-main-menu-item--name').contains('Directory')
    }

    // ─── Selectores - Filtros ──────────────────────────────────────────────────

    get employeeNameInput() {
        return cy.contains('label', 'Employee Name')
            .parents('.oxd-input-group')
            .find('input')
    }

    get employeeNameAutocompleteOptions() {
        return cy.get('.oxd-autocomplete-option')
    }

    get jobTitleDropdown() {
        return cy.contains('label', 'Job Title')
            .parents('.oxd-input-group')
            .find('.oxd-select-text')
    }

    get searchButton() {
        return cy.get('button[type="submit"]').contains('Search')
    }

    get resetButton() {
        return cy.contains('button', 'Reset')
    }

    get noRecordsMessage() {
        return cy.contains('No Records Found')
    }

    // ─── Acciones - Navegacion ────────────────────────────────────────────────

    navigateToDirectory() {
        this.directoryMenuLink.should('be.visible').click()
        cy.location('pathname', { timeout: 15000 }).should('contain', 'directory')
    }

    // ─── Acciones - Filtros ─────────────────────────────────────────────────

    // Escribe una letra comun en Employee Name para obtener sugerencias reales
    // del entorno demo compartido, y devuelve (via .then) el nombre completo
    // de la primera sugerencia. Evita depender de un nombre de empleado
    // hardcodeado, que puede dejar de existir o cambiar en el demo publico.
    getRealEmployeeName() {
        this.employeeNameInput.should('be.visible').clear().type('a')
        return this.employeeNameAutocompleteOptions
            .should('have.length.greaterThan', 0)
            .and('not.contain.text', 'Searching')
            .first()
            .invoke('text')
            .then((text) => text.trim())
    }

    searchByEmployeeName(name) {
        this.employeeNameInput.should('be.visible').clear().type(name).type('{esc}')
        this.searchButton.click()
    }

    // Selecciona la primera opcion no vacia del dropdown Job Title y
    // devuelve (via .then) el texto seleccionado.
    selectFirstJobTitle() {
        this.jobTitleDropdown.should('be.visible').click()
        return cy.get('.oxd-select-dropdown .oxd-select-option', { timeout: 10000 })
            .should('have.length.greaterThan', 1)
            .then(($options) => {
                const validOption = Array.from($options)
                    .slice(1)
                    .map((el) => Cypress.$(el).text().trim())
                    .find((text) => text.length > 0)

                expect(validOption, 'Existe al menos un puesto valido en el dropdown').to.exist
                cy.contains('.oxd-select-dropdown .oxd-select-option', validOption).click()
                return cy.wrap(validOption)
            })
    }

    search() {
        this.searchButton.click()
    }

    reset() {
        this.resetButton.click()
    }

    // ─── Verificaciones ───────────────────────────────────────────────────────

    verifyEmployeeVisible(name) {
        cy.contains(name, { timeout: 15000 }).should('be.visible')
    }

    verifyNoRecordsFound() {
        this.noRecordsMessage.should('be.visible')
    }

    verifyResultsListVisible() {
        this.noRecordsMessage.should('not.exist')
    }
}

export default OrangeHRMDirectoryPage
