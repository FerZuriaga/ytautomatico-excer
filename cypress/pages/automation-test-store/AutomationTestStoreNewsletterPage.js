class AutomationTestStoreNewsletterPage {

    // ─── Formulario rápido del footer ──────────────────────────────────────────

    get quickEmailInput() { return cy.get('#appendedInputButton') }
    get quickSubmitButton() { return cy.get('#subscribeFrm button[type=submit]') }

    subscribeFromFooter(email) {
        this.quickEmailInput.clear().type(email)
        this.quickSubmitButton.click()
    }

    // ─── Formulario completo ────────────────────────────────────────────────────

    get firstNameInput() { return cy.get('#SubscriberFrm_firstname') }
    get lastNameInput() { return cy.get('#SubscriberFrm_lastname') }
    get emailInput() { return cy.get('#SubscriberFrm_email') }
    get captchaInput() { return cy.get('#SubscriberFrm_captcha') }
    get captchaImage() { return cy.get('.captcha-addon img') }
    get continueButton() { return cy.contains('button', 'Continue') }
    get helpBlocks() { return cy.get('.help-block') }

    visitFullForm() {
        cy.gotoATSUrl('/index.php?rt=account/subscriber')
    }

    fillFullForm({ firstName, lastName, email, captcha }) {
        if (firstName !== undefined) this.firstNameInput.clear().type(firstName)
        if (lastName !== undefined) this.lastNameInput.clear().type(lastName)
        if (email !== undefined) this.emailInput.clear().type(email)
        if (captcha !== undefined) this.captchaInput.clear()
        if (captcha) this.captchaInput.type(captcha)
    }

    submitFullForm() {
        this.continueButton.click()
    }
}

export default AutomationTestStoreNewsletterPage
