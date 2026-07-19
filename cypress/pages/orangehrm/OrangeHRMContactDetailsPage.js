// Page Object Model - OrangeHRMContactDetailsPage
// Encapsula selectores y acciones de la pestana "Contact Details" dentro de la
// ficha de un empleado en el modulo PIM de OrangeHRM.

class OrangeHRMContactDetailsPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    // Pestana "Contact Details" dentro de la ficha del empleado. Vive dentro del
    // mismo grupo de tabs que "Personal Details" (.orangehrm-tabs-item).
    get contactDetailsTabLink() {
        return cy.get('a.orangehrm-tabs-item').contains('Contact Details')
    }

    // Campo "Mobile" dentro de la seccion "Telephone" de Contact Details. No expone
    // un label individual distinto de "Home"/"Mobile"/"Work" bajo un mismo titulo de
    // seccion, por lo que se ubica por su label propio siguiendo el mismo patron ya
    // usado para Employee Id/Employee Name (label + .oxd-input-group + input).
    get mobileInput() {
        return cy.contains('label', 'Mobile')
            .parents('.oxd-input-group')
            .find('input')
    }

    get saveButton() {
        return cy.get('button[type="submit"]').contains('Save')
    }

    // Mensaje de confirmacion (toast) que muestra OrangeHRM tras un guardado exitoso.
    get saveConfirmationToast() {
        return cy.get('.oxd-toast-content--success').contains('Successfully Updated')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    // Navega a la pestana "Contact Details" dentro de la ficha del empleado
    navigateToContactDetailsTab() {
        this.contactDetailsTabLink.should('be.visible').click()
    }

    // Verifica que la seccion Contact Details este visible, con el campo Mobile
    // (dato personal simple elegido para esta automatizacion) cargado
    verifyContactDetailsVisible() {
        cy.location('pathname', { timeout: 30000 }).should('contain', '/pim/contactDetails')
        this.mobileInput.should('be.visible')
    }

    // Lee (sin modificar) el valor actual del campo Mobile
    getCurrentMobileNumber() {
        return this.mobileInput.should('be.visible').invoke('val')
    }

    // Genera un numero de telefono movil unico por ejecucion (basado en timestamp),
    // siguiendo el mismo patron que OrangeHRMAddEmployeePage#generateUniqueEmployeeName,
    // para evitar depender de un valor fijo y poder verificar sin ambiguedad que el
    // nuevo valor especifico de esta ejecucion persiste.
    generateUniqueMobileNumber() {
        const digits = `555${Date.now()}`
        return digits.slice(0, 10)
    }

    // Reemplaza el valor del campo Mobile por uno nuevo
    updateMobileNumber(newMobile) {
        this.mobileInput.should('be.visible').clear().type(newMobile)
    }

    // Confirma el guardado de Contact Details, sincronizando con la respuesta del
    // backend antes de continuar con las validaciones posteriores.
    saveContactDetails() {
        cy.intercept('PUT', '**/contact-details**').as('updateContactDetails')

        this.saveButton.should('be.visible').click()

        cy.wait('@updateContactDetails', { timeout: 30000 })
    }

    // Verifica que el sistema muestre la confirmacion de guardado exitoso (toast)
    verifySaveConfirmationVisible() {
        this.saveConfirmationToast.should('be.visible')
    }

    // Verifica que el campo Mobile muestre el valor esperado. Reutilizable tanto
    // para comprobar la persistencia tras recargar la pagina como tras salir de la
    // ficha y volver a ingresar mas adelante.
    verifyMobileNumberValue(expectedMobile) {
        this.mobileInput.should('be.visible').and('have.value', expectedMobile)
    }
}

export default OrangeHRMContactDetailsPage
