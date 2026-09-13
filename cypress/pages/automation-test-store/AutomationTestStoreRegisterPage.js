class AutomationTestStoreRegisterPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get firstNameInput() { return cy.get('#AccountFrm_firstname') }
    get lastNameInput() { return cy.get('#AccountFrm_lastname') }
    get emailInput() { return cy.get('#AccountFrm_email') }
    get address1Input() { return cy.get('#AccountFrm_address_1') }
    get cityInput() { return cy.get('#AccountFrm_city') }
    get countrySelect() { return cy.get('#AccountFrm_country_id') }
    get zoneSelect() { return cy.get('#AccountFrm_zone_id') }
    get postcodeInput() { return cy.get('#AccountFrm_postcode') }
    get loginNameInput() { return cy.get('#AccountFrm_loginname') }
    get passwordInput() { return cy.get('#AccountFrm_password') }
    get confirmPasswordInput() { return cy.get('#AccountFrm_confirm') }
    get agreeCheckbox() { return cy.get('#AccountFrm_agree') }
    get continueButton() { return cy.get('#AccountFrm button[type="submit"]') }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    fillMandatoryFields({ firstName, lastName, email, address, city, postcode, loginName, password }) {
        this.firstNameInput.type(firstName)
        this.lastNameInput.type(lastName)
        this.emailInput.type(email)
        this.address1Input.type(address)
        this.cityInput.type(city)

        // El select de Region/State se puebla via AJAX al cambiar el pais.
        this.countrySelect.select('Argentina')
        this.zoneSelect.find('option').its('length').should('be.gt', 1)
        this.zoneSelect.select('Buenos Aires')

        this.postcodeInput.type(postcode)
        this.loginNameInput.type(loginName)
        this.passwordInput.type(password)
        this.confirmPasswordInput.type(password)
        this.agreeCheckbox.check()
    }

    submit() {
        this.continueButton.click()
    }

    verifyAccountCreated() {
        cy.url().should('include', 'rt=account/success')
        cy.contains('Congratulations! Your new account has been successfully created!').should('be.visible')
    }
}

export default AutomationTestStoreRegisterPage
