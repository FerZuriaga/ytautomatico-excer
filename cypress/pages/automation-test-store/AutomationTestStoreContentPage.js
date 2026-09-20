class AutomationTestStoreContentPage {

    // ─── Navegación de páginas institucionales ─────────────────────────────────

    get pageTitle() { return cy.get('h1.heading1 .maintext') }

    visitContent(contentId) {
        cy.gotoATSUrl(`/index.php?rt=content/content&content_id=${contentId}`)
    }

    // ─── Formulario de Contacto ─────────────────────────────────────────────────

    get firstNameInput() { return cy.get('#ContactUsFrm_first_name') }
    get emailInput() { return cy.get('#ContactUsFrm_email') }
    get enquiryTextArea() { return cy.get('#ContactUsFrm_enquiry') }
    get submitButton() { return cy.get('#ContactUsFrm button[type=submit]') }
    get fieldErrors() { return cy.get('#ContactUsFrm .element_error') }
    get successMessage() { return cy.contains('Your enquiry has been successfully sent to the store owner!') }

    visitContact() {
        cy.gotoATSUrl('/index.php?rt=content/contact')
    }

    fillContactForm({ firstName, email, enquiry }) {
        if (firstName !== undefined) this.firstNameInput.clear().type(firstName)
        if (email !== undefined) this.emailInput.clear().type(email)
        if (enquiry !== undefined) this.enquiryTextArea.clear().type(enquiry)
    }

    submitContactForm() {
        this.submitButton.click()
    }
}

export default AutomationTestStoreContentPage
