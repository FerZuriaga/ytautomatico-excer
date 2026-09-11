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

    get directoryCards() {
        return cy.get('.orangehrm-directory-card')
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

    // Recorre el listado por defecto de Directory (sin filtros) y devuelve
    // (via .then) el nombre y el puesto de la primera tarjeta que tiene un
    // Job Title visible. El entorno demo publico y compartido acumula muchos
    // registros sin puesto asignado (la tarjeta oculta el subtitulo via
    // display:none cuando no tiene dato) — no alcanza con tomar la primera
    // tarjeta a secas, hace falta encontrar una con ambos datos poblados.
    getEmployeeWithJobTitle() {
        return this.directoryCards
            .should('have.length.greaterThan', 0)
            .then(($cards) => {
                const match = Array.from($cards).find((card) => {
                    const subtitle = card.querySelector('.orangehrm-directory-card-subtitle')
                    return subtitle && subtitle.style.display !== 'none' && subtitle.textContent.trim().length > 0
                })

                expect(match, 'Existe al menos un empleado con Job Title visible en el listado por defecto').to.exist

                const name = match.querySelector('.orangehrm-directory-card-header').textContent.trim()
                const jobTitle = match.querySelector('.orangehrm-directory-card-subtitle').textContent.trim()

                return cy.wrap({ name, jobTitle })
            })
    }

    // Selecciona en el dropdown Job Title la opcion cuyo texto coincide
    // exactamente con el puesto indicado (a diferencia de selectFirstJobTitle,
    // que toma cualquier opcion disponible).
    selectJobTitle(jobTitle) {
        this.jobTitleDropdown.should('be.visible').click()
        cy.contains('.oxd-select-dropdown .oxd-select-option', jobTitle, { timeout: 10000 }).click()
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
