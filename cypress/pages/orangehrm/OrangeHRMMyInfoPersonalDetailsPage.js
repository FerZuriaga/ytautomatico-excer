// Page Object Model - OrangeHRMMyInfoPersonalDetailsPage
// Encapsula selectores y acciones de la pestana "Personal Details" (pestana
// por defecto) dentro de "My Info", donde el usuario logueado (Admin, en el
// entorno demo publico y compartido) edita su propia cuenta. Es una pantalla
// distinta de la de PIM (donde un admin edita la ficha de OTRO empleado, ya
// cubierta por otras suites). No se reutiliza ningun Page Object de PIM para
// no mezclar ambos contextos de negocio bajo un mismo componente — mismo
// criterio ya aplicado en OrangeHRMMyInfoContactDetailsPage.js.

class OrangeHRMMyInfoPersonalDetailsPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get nationalityDropdown() {
        return cy.contains('label', 'Nationality')
            .parents('.oxd-input-group')
            .find('.oxd-select-text')
    }

    get maritalStatusDropdown() {
        return cy.contains('label', 'Marital Status')
            .parents('.oxd-input-group')
            .find('.oxd-select-text')
    }

    get dateOfBirthInput() {
        return cy.contains('label', 'Date of Birth')
            .parents('.oxd-input-group')
            .find('input')
    }

    get saveButton() {
        return cy.get('button[type="submit"]').contains('Save')
    }

    get saveConfirmationToast() {
        return cy.get('.oxd-toast-content--success')
    }

    get dateOfBirthErrorMessage() {
        return cy.contains('label', 'Date of Birth')
            .parents('.oxd-input-group')
            .find('.oxd-input-field-error-message')
    }

    // ─── Acciones - Navegacion ────────────────────────────────────────────────

    // Personal Details es la pestana por defecto de My Info (no requiere
    // click en un tab adicional, a diferencia de Contact Details).
    verifyPersonalDetailsVisible() {
        cy.location('pathname', { timeout: 30000 }).should('contain', '/pim/viewPersonalDetails')
        this.nationalityDropdown.should('be.visible')
        this.maritalStatusDropdown.should('be.visible')
        this.dateOfBirthInput.should('be.visible')
    }

    // ─── Acciones - Lectura de valores actuales ───────────────────────────────

    getCurrentNationality() {
        return this.nationalityDropdown.invoke('text')
    }

    getCurrentMaritalStatus() {
        return this.maritalStatusDropdown.invoke('text')
    }

    getCurrentDateOfBirth() {
        return this.dateOfBirthInput.should('be.visible').invoke('val')
    }

    captureOriginalPersonalValues() {
        return this.getCurrentNationality().then((nationality) => {
            return this.getCurrentMaritalStatus().then((maritalStatus) => {
                return this.getCurrentDateOfBirth().then((dateOfBirth) => {
                    return { nationality, maritalStatus, dateOfBirth }
                })
            })
        })
    }

    restoreOriginalPersonalValues(original) {
        if (original.nationality) {
            this.selectNationality(original.nationality)
        }
        if (original.maritalStatus) {
            this.selectMaritalStatus(original.maritalStatus)
        }
        this.savePersonalDetails()
        this.verifySaveConfirmationVisible()
    }

    // ─── Acciones - Edicion ───────────────────────────────────────────────────

    // Dropdown de OXD: abrir y clickear la opcion por texto exacto, mismo
    // patron ya usado en OrangeHRMEmployeeListPage/OrangeHRMLeavePage.
    selectNationality(optionText) {
        this.nationalityDropdown.should('be.visible').click()
        cy.get('.oxd-select-dropdown .oxd-select-option', { timeout: 10000 })
            .contains(optionText)
            .click()
    }

    selectMaritalStatus(optionText) {
        this.maritalStatusDropdown.should('be.visible').click()
        cy.get('.oxd-select-dropdown .oxd-select-option', { timeout: 10000 })
            .contains(optionText)
            .click()
    }

    updateDateOfBirth(newDate) {
        this.dateOfBirthInput.should('be.visible').clear().type(newDate)
    }

    // ─── Acciones - Guardado ──────────────────────────────────────────────────

    savePersonalDetails({ expectRequest = true } = {}) {
        cy.intercept('PUT', '**/pim/employees/**').as('updatePersonalDetails')

        this.saveButton.should('be.visible').click()

        if (expectRequest) {
            cy.wait('@updatePersonalDetails', { timeout: 30000 })
        }
    }

    verifySaveConfirmationVisible() {
        this.saveConfirmationToast.should('be.visible')
    }

    // ─── Acciones - Verificacion de persistencia ───────────────────────────────

    verifyNationalityValue(expectedText) {
        this.nationalityDropdown.should('be.visible').and('contain.text', expectedText)
    }

    verifyMaritalStatusValue(expectedText) {
        this.maritalStatusDropdown.should('be.visible').and('contain.text', expectedText)
    }

    verifyDateOfBirthValue(expectedDate) {
        this.dateOfBirthInput.should('be.visible').and('have.value', expectedDate)
    }

    // ─── Acciones - Validacion de formato ─────────────────────────────────────

    verifyDateOfBirthErrorVisible() {
        this.dateOfBirthErrorMessage.should('be.visible').and('not.be.empty')
    }
}

export default OrangeHRMMyInfoPersonalDetailsPage
