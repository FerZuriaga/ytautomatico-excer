class AutomationTestStoreContentPage {

    // ─── Navegación de páginas institucionales ─────────────────────────────────

    get pageTitle() { return cy.get('h1.heading1 .maintext') }

    // CA-01 de SCRUM-261 exige navegar DESDE EL FOOTER: el link se busca
    // dentro de <footer> (unico en la home, verificado con curl) con los
    // selectores relevados en cypress/fixtures/selectors/contenido-estatico.json.
    clickFooterLink(linkName) {
        cy.fixture('selectors/contenido-estatico.json').then(sel => {
            cy.get('footer').find(sel.footerLinks[linkName]).click()
        })
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
