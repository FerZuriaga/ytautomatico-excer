// Page Object Model - ContactPage
// Encapsula selectores y acciones de la página Contact Us de automationexercise.com

class ContactPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    // Enlace "Contact us" en la barra de navegación
    get contactUsLink() {
        return cy.get('a[href="/contact_us"]')
    }

    // Encabezado "GET IN TOUCH" en la página de contacto
    get getInTouchHeader() {
        return cy.get('h2.title.text-center').contains('Get In Touch')
    }

    // Campo nombre
    get nameInput() {
        return cy.get('[data-qa="name"]')
    }

    // Campo email
    get emailInput() {
        return cy.get('[data-qa="email"]')
    }

    // Campo asunto
    get subjectInput() {
        return cy.get('[data-qa="subject"]')
    }

    // Campo mensaje
    get messageInput() {
        return cy.get('[data-qa="message"]')
    }

    // Botón Submit
    get submitButton() {
        return cy.get('[data-qa="submit-button"]')
    }

    // Mensaje de éxito tras enviar el formulario
    get successMessage() {
        return cy.get('.status.alert.alert-success')
    }

    // Botón Home en la página de contacto
    get homeButton() {
        return cy.get('a.btn.btn-success[href="/"]')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    // Navega a la home page
    navigate() {
        cy.gotoAEUrl('/')
    }

    // Click en el enlace "Contact us" del menú de navegación
    clickContactUs() {
        this.contactUsLink.should('be.visible').click()
    }

    // Verifica que el encabezado "GET IN TOUCH" es visible
    verifyGetInTouch() {
        this.getInTouchHeader.should('be.visible')
    }

    // Llena los 4 campos del formulario
    fillForm(name, email, subject, message) {
        this.nameInput.should('be.visible').type(name)
        this.emailInput.should('be.visible').type(email)
        this.subjectInput.should('be.visible').type(subject)
        this.messageInput.should('be.visible').type(message)
    }

    // Registra el handler del confirm y hace click en Submit
    submitForm() {
        cy.on('window:confirm', () => true)
        this.submitButton.click()
    }

    // Verifica que el mensaje de éxito es visible
    verifySuccessMessage() {
        this.successMessage
            .should('be.visible')
            .and('contain.text', 'Success! Your details have been submitted successfully.')
    }

    // Click en el botón Home de la página de contacto
    clickHomeButton() {
        this.homeButton.should('be.visible').click()
    }
}

export default ContactPage
