// Page Object Model - OrangeHRMRecruitmentPage
// Encapsula selectores y acciones del modulo Recruitment > Candidates de
// OrangeHRM: alta de candidato ("Add") y busqueda en el listado.

class OrangeHRMRecruitmentPage {

    // ─── Selectores - Navegacion ─────────────────────────────────────────────

    get recruitmentMenuLink() {
        return cy.get('.oxd-main-menu-item--name').contains('Recruitment')
    }

    get addCandidateButton() {
        return cy.contains('button', 'Add')
    }

    // ─── Selectores - Formulario Add Candidate ────────────────────────────────

    get fullNameGroupInputs() {
        return cy.contains('label', 'Full Name')
            .parents('.oxd-input-group')
            .find('input')
    }

    get firstNameInput() {
        return this.fullNameGroupInputs.eq(0)
    }

    get lastNameInput() {
        return this.fullNameGroupInputs.eq(2)
    }

    get emailInput() {
        return cy.contains('label', 'Email')
            .parents('.oxd-input-group')
            .find('input')
    }

    get saveButton() {
        return cy.get('button[type="submit"]').contains('Save')
    }

    get cancelButton() {
        return cy.contains('button', 'Cancel')
    }

    get successToast() {
        return cy.get('.oxd-toast')
    }

    // ─── Selectores - Listado de Candidates ───────────────────────────────────

    get candidateNameFilterInput() {
        return cy.contains('label', 'Candidate Name')
            .parents('.oxd-input-group')
            .find('input')
    }

    get searchButton() {
        return cy.get('button[type="submit"]').contains('Search')
    }

    get candidateRows() {
        return cy.get('.oxd-table-body .oxd-table-row')
    }

    // ─── Acciones - Navegacion ────────────────────────────────────────────────

    navigateToAddCandidate() {
        this.recruitmentMenuLink.should('be.visible').click()
        cy.location('pathname', { timeout: 15000 }).should('contain', 'recruitment')
        this.addCandidateButton.should('be.visible').click()
        cy.location('pathname', { timeout: 15000 }).should('contain', '/recruitment/addCandidate')
    }

    navigateToCandidatesList() {
        this.recruitmentMenuLink.should('be.visible').click()
        cy.location('pathname', { timeout: 15000 }).should('contain', 'recruitment')
    }

    // ─── Acciones - Formulario Add Candidate ──────────────────────────────────

    fillRequiredFields(firstName, lastName, email) {
        this.firstNameInput.should('be.visible').clear().type(firstName)
        this.lastNameInput.should('be.visible').clear().type(lastName)
        this.emailInput.should('be.visible').clear().type(email)
    }

    save() {
        this.saveButton.click()
    }

    cancel() {
        this.cancelButton.click()
    }

    verifySaveConfirmationVisible() {
        this.successToast.should('be.visible')
    }

    // Verifica que se muestren errores de campo obligatorio y que el alta
    // no se haya confirmado (sigue en el formulario, no crea el candidato).
    // No cuenta ocurrencias exactas de "Required" (cy.contains() solo
    // devuelve una coincidencia, no sirve para verificar cantidad) sino que
    // valida el efecto funcional: al menos un error visible y ningun avance.
    verifyRequiredFieldErrorsVisible() {
        cy.contains('Required').should('be.visible')
        cy.location('pathname').should('contain', '/recruitment/addCandidate')
    }

    // Verifica que se muestre el error de formato esperado bajo Email
    verifyEmailFormatErrorVisible() {
        cy.contains('label', 'Email')
            .parents('.oxd-input-group')
            .contains('Expected format')
            .should('be.visible')
    }

    verifyBackOnCandidatesList() {
        cy.location('pathname', { timeout: 15000 }).should('contain', '/recruitment/viewCandidates')
    }

    // ─── Acciones - Listado de Candidates ─────────────────────────────────────

    searchCandidateByName(name) {
        this.candidateNameFilterInput.should('be.visible').clear().type(name)
        this.searchButton.click()
    }

    verifyCandidateInList(name) {
        this.candidateRows.should('have.length.greaterThan', 0)
        cy.contains('.oxd-table-body .oxd-table-row', name).should('be.visible')
    }

    // La busqueda por nombre no es de coincidencia exacta (devuelve otros
    // candidatos con el mismo prefijo, ej. de corridas anteriores propias),
    // por eso se verifica la ausencia de la fila con el nombre completo
    // exacto en vez de esperar "No Records Found".
    verifyCandidateNotInList(name) {
        cy.contains('.oxd-table-body .oxd-table-row', name).should('not.exist')
    }
}

export default OrangeHRMRecruitmentPage
