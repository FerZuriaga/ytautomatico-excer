// Page Object Model - OrangeHRMMyInfoContactDetailsPage
// Encapsula selectores y acciones de la pestana "Contact Details" dentro de
// "My Info", donde el usuario logueado (Admin, en el entorno demo publico y
// compartido) edita su propia cuenta. Es una pantalla distinta de
// OrangeHRMContactDetailsPage.js (esa es especifica de PIM > Employee, donde
// un admin edita la ficha de OTRO empleado). No se extiende ese Page Object
// para no mezclar ambos contextos de negocio bajo un mismo componente.

class OrangeHRMMyInfoContactDetailsPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    // Pestana "Contact Details" dentro de My Info. Se usa un selector dual
    // (misma estrategia que employeeListTabLink en OrangeHRMEmployeeListPage)
    // ya que My Info reutiliza el mismo componente Angular de tabs que PIM.
    // Verificado en vivo contra la demo (SCRUM-53): la clase real aplicada es
    // "orangehrm-tabs-item".
    get contactDetailsTabLink() {
        return cy.get('a.oxd-tabs-item, a.orangehrm-tabs-item').contains('Contact Details')
    }

    // Campos del formulario, localizados por su label (mismo patron ya usado
    // en OrangeHRMContactDetailsPage/OrangeHRMEmployeeListPage: label +
    // .oxd-input-group + input).
    get mobileInput() {
        return cy.contains('label', 'Mobile')
            .parents('.oxd-input-group')
            .find('input')
    }

    get street1Input() {
        return cy.contains('label', 'Street 1')
            .parents('.oxd-input-group')
            .find('input')
    }

    // Verificado en vivo contra la demo (SCRUM-53): en My Info > Contact
    // Details, a diferencia de lo asumido inicialmente, el campo de telefono
    // fijo se etiqueta unicamente "Home" (bajo la seccion "Telephone", junto
    // a "Mobile" y "Work"), no "Home Telephone".
    get homeTelephoneInput() {
        return cy.contains('label', 'Home')
            .parents('.oxd-input-group')
            .find('input')
    }

    // Verificado en vivo contra la demo (SCRUM-53): en My Info > Contact
    // Details no existe un unico campo "Email"; la seccion "Email" expone dos
    // campos separados, "Work Email" y "Other Email". Se automatiza "Work
    // Email" por ser el campo principal de contacto, cubriendo la misma
    // intencion funcional de validacion de formato del Test Case Model.
    get emailInput() {
        return cy.contains('label', 'Work Email')
            .parents('.oxd-input-group')
            .find('input')
    }

    get saveButton() {
        return cy.get('button[type="submit"]').contains('Save')
    }

    // Mensaje de confirmacion (toast) que muestra OrangeHRM tras un guardado
    // exitoso (mismo texto y clase que en PIM Contact Details).
    get saveConfirmationToast() {
        return cy.get('.oxd-toast-content--success').contains('Successfully Updated')
    }

    // Mensaje de error de validacion de formato bajo el campo Work Email.
    // Verificado en vivo contra la demo (SCRUM-53): la validacion es
    // client-side (no dispara la peticion PUT) y el error se muestra con la
    // clase generica de OXD ".oxd-input-field-error-message".
    get emailErrorMessage() {
        return cy.contains('label', 'Work Email')
            .parents('.oxd-input-group')
            .find('.oxd-input-field-error-message')
    }

    // ─── Acciones - Navegacion ────────────────────────────────────────────────

    // Navega a la pestana "Contact Details" dentro de My Info
    navigateToContactDetailsTab() {
        this.contactDetailsTabLink.should('be.visible').click()
    }

    // Verifica que la seccion Contact Details este visible, con los campos
    // editables por esta suite cargados
    verifyContactDetailsVisible() {
        cy.location('pathname', { timeout: 30000 }).should('contain', '/pim/contactDetails')
        this.mobileInput.should('be.visible')
        this.street1Input.should('be.visible')
        this.homeTelephoneInput.should('be.visible')
        this.emailInput.should('be.visible')
    }

    // ─── Acciones - Lectura de valores actuales ───────────────────────────────

    getCurrentMobile() {
        return this.mobileInput.should('be.visible').invoke('val')
    }

    getCurrentStreet1() {
        return this.street1Input.should('be.visible').invoke('val')
    }

    getCurrentHomeTelephone() {
        return this.homeTelephoneInput.should('be.visible').invoke('val')
    }

    getCurrentEmail() {
        return this.emailInput.should('be.visible').invoke('val')
    }

    // Captura los 4 valores actuales del formulario en un unico objeto, para
    // poder restaurarlos luego de que un test los modifique. Necesario porque
    // My Info edita la cuenta Admin compartida del entorno demo publico (a
    // diferencia de PIM, donde se opera sobre empleados propios de la suite).
    captureOriginalContactValues() {
        return this.mobileInput.should('be.visible').invoke('val').then((mobile) => {
            return this.street1Input.invoke('val').then((street1) => {
                return this.homeTelephoneInput.invoke('val').then((homeTelephone) => {
                    return this.emailInput.invoke('val').then((email) => {
                        return { mobile, street1, homeTelephone, email }
                    })
                })
            })
        })
    }

    // Restaura los 4 campos a los valores originales capturados y guarda,
    // dejando el formulario tal como estaba antes de que el test lo modificara.
    // Verificado en vivo contra la demo (SCRUM-53): varios de estos campos
    // (Mobile, Street 1, Home) estan vacios originalmente en la cuenta
    // compartida, y cy.type('') lanza un error de Cypress ("cannot accept an
    // empty string"), por lo que solo se escribe el valor cuando es no vacio;
    // .clear() alcanza para restaurar el estado "vacio" en ese caso.
    restoreOriginalContactValues(original) {
        this._restoreField(this.mobileInput, original.mobile)
        this._restoreField(this.street1Input, original.street1)
        this._restoreField(this.homeTelephoneInput, original.homeTelephone)
        this._restoreField(this.emailInput, original.email)
        this.saveContactDetails()
        this.verifySaveConfirmationVisible()
    }

    // Limpia un campo y solo vuelve a escribir el valor original si no esta
    // vacio (ver comentario de restoreOriginalContactValues).
    _restoreField(inputGetter, originalValue) {
        inputGetter.should('be.visible').clear()
        if (originalValue) {
            inputGetter.type(originalValue)
        }
    }

    // ─── Acciones - Edicion ───────────────────────────────────────────────────

    updateMobile(newMobile) {
        this.mobileInput.should('be.visible').clear().type(newMobile)
    }

    updateStreet1(newStreet1) {
        this.street1Input.should('be.visible').clear().type(newStreet1)
    }

    updateHomeTelephone(newHomeTelephone) {
        this.homeTelephoneInput.should('be.visible').clear().type(newHomeTelephone)
    }

    updateEmail(newEmail) {
        this.emailInput.should('be.visible').clear().type(newEmail)
    }

    // Genera un numero unico por ejecucion (basado en timestamp), mismo patron
    // que OrangeHRMContactDetailsPage#generateUniqueMobileNumber, para poder
    // verificar sin ambiguedad que el valor especifico de esta ejecucion
    // persiste.
    generateUniqueDigits(prefix = '555') {
        const digits = `${prefix}${Date.now()}`
        return digits.slice(0, 10)
    }

    // ─── Acciones - Guardado ──────────────────────────────────────────────────

    // Confirma el guardado de Contact Details. El parametro expectRequest
    // permite a los tests de email invalido indicar que no se espera que el
    // formulario dispare la peticion PUT. Verificado en vivo contra la demo
    // (SCRUM-53): la validacion de formato de email es client-side (bloquea
    // el envio antes de llegar al backend), por lo que los tests negativos
    // usan expectRequest: false.
    saveContactDetails({ expectRequest = true } = {}) {
        cy.intercept('PUT', '**/contact-details**').as('updateContactDetails')

        this.saveButton.should('be.visible').click()

        if (expectRequest) {
            cy.wait('@updateContactDetails', { timeout: 30000 })
        }
    }

    verifySaveConfirmationVisible() {
        this.saveConfirmationToast.should('be.visible')
    }

    // ─── Acciones - Verificacion de persistencia ───────────────────────────────

    verifyMobileValue(expectedMobile) {
        this.mobileInput.should('be.visible').and('have.value', expectedMobile)
    }

    verifyStreet1Value(expectedStreet1) {
        this.street1Input.should('be.visible').and('have.value', expectedStreet1)
    }

    verifyHomeTelephoneValue(expectedHomeTelephone) {
        this.homeTelephoneInput.should('be.visible').and('have.value', expectedHomeTelephone)
    }

    verifyEmailValue(expectedEmail) {
        this.emailInput.should('be.visible').and('have.value', expectedEmail)
    }

    // ─── Acciones - Validacion de formato de Email ────────────────────────────

    verifyEmailErrorVisible() {
        this.emailErrorMessage.should('be.visible').and('not.be.empty')
    }
}

export default OrangeHRMMyInfoContactDetailsPage
