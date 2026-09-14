class AutomationTestStoreRegisterPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get firstNameInput() { return cy.get('#AccountFrm_firstname') }
    get lastNameInput() { return cy.get('#AccountFrm_lastname') }
    get emailInput() { return cy.get('#AccountFrm_email') }
    get telephoneInput() { return cy.get('#AccountFrm_telephone') }
    get faxInput() { return cy.get('#AccountFrm_fax') }
    get companyInput() { return cy.get('#AccountFrm_company') }
    get address1Input() { return cy.get('#AccountFrm_address_1') }
    get address2Input() { return cy.get('#AccountFrm_address_2') }
    get cityInput() { return cy.get('#AccountFrm_city') }
    get countrySelect() { return cy.get('#AccountFrm_country_id') }
    get zoneSelect() { return cy.get('#AccountFrm_zone_id') }
    get postcodeInput() { return cy.get('#AccountFrm_postcode') }
    get loginNameInput() { return cy.get('#AccountFrm_loginname') }
    get passwordInput() { return cy.get('#AccountFrm_password') }
    get confirmPasswordInput() { return cy.get('#AccountFrm_confirm') }
    get agreeCheckbox() { return cy.get('#AccountFrm_agree') }
    get continueButton() { return cy.get('#AccountFrm button[type="submit"]') }
    get errorAlert() { return cy.get('.alert-danger') }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    visit() {
        cy.gotoATSUrl('/index.php?rt=account/create')
    }

    selectCountry(country) {
        cy.intercept('GET', /rt=common\/zone/).as('zoneUpdate')
        this.countrySelect.select(country)
        cy.wait('@zoneUpdate')
    }

    getZoneOptionsText() {
        return this.zoneSelect.find('option').then($options => (
            [...$options].map(o => o.text.trim())
        ))
    }

    // Completa el formulario a partir de un objeto de datos. Solo escribe los
    // campos presentes en `data` (permite dejar un campo sin completar para
    // los escenarios negativos de validacion), y maneja el select de
    // Region/Estado por separado porque depende de que el pais ya este
    // seleccionado (AJAX).
    fillFields(data) {
        if (data.firstName !== undefined) this.firstNameInput.clear().type(data.firstName)
        if (data.lastName !== undefined) this.lastNameInput.clear().type(data.lastName)
        if (data.email !== undefined) this.emailInput.clear().type(data.email, { parseSpecialCharSequences: false })
        if (data.telephone !== undefined) this.telephoneInput.clear().type(data.telephone)
        if (data.fax !== undefined) this.faxInput.clear().type(data.fax)
        if (data.company !== undefined) this.companyInput.clear().type(data.company)
        if (data.address1 !== undefined) this.address1Input.clear().type(data.address1)
        if (data.address2 !== undefined) this.address2Input.clear().type(data.address2)
        if (data.city !== undefined) this.cityInput.clear().type(data.city)
        if (data.country !== undefined) this.selectCountry(data.country)
        if (data.zone !== undefined) this.zoneSelect.select(data.zone)
        if (data.postcode !== undefined) this.postcodeInput.clear().type(data.postcode)
        if (data.loginName !== undefined) this.loginNameInput.clear().type(data.loginName, { parseSpecialCharSequences: false })
        if (data.password !== undefined) this.passwordInput.clear().type(data.password)
        if (data.confirmPassword !== undefined) this.confirmPasswordInput.clear().type(data.confirmPassword)
        if (data.agreePrivacy) this.agreeCheckbox.check()
    }

    fillMandatoryFields({ firstName, lastName, email, address, city, postcode, loginName, password }) {
        this.fillFields({
            firstName, lastName, email,
            address1: address, city,
            country: 'Argentina', zone: 'Buenos Aires',
            postcode, loginName, password, confirmPassword: password,
            agreePrivacy: true
        })
    }

    submit() {
        this.continueButton.click()
    }

    verifyAccountCreated() {
        cy.url().should('include', 'rt=account/success')
        cy.contains('Congratulations! Your new account has been successfully created!').should('be.visible')
    }

    verifyRegistrationRejected() {
        cy.url().should('include', 'rt=account/create')
        this.errorAlert.should('be.visible')
    }

    verifyErrorMessage(expectedText) {
        this.errorAlert.should('be.visible').and('contain.text', expectedText)
    }
}

export default AutomationTestStoreRegisterPage
