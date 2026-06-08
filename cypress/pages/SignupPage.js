// Page Object Model - SignupPage
// Encapsula selectores y acciones del formulario de registro de automationexercise.com

class SignupPage {

    // ─── Selectores - Sección Signup (nombre + email) ─────────────────────────

    get signupNameInput() {
        return cy.get('[data-qa="signup-name"]')
    }

    get signupEmailInput() {
        return cy.get('[data-qa="signup-email"]')
    }

    get signupButton() {
        return cy.get('[data-qa="signup-button"]')
    }

    // ─── Selectores - Formulario de registro completo ─────────────────────────

    get accountInfoTitle() {
        return cy.contains('Enter Account Information')
    }

    get genderMrRadio() {
        return cy.get('#id_gender1')
    }

    get passwordInput() {
        return cy.get('[data-qa="password"]')
    }

    get daysSelect() {
        return cy.get('[data-qa="days"]')
    }

    get monthsSelect() {
        return cy.get('[data-qa="months"]')
    }

    get yearsSelect() {
        return cy.get('[data-qa="years"]')
    }

    get firstNameInput() {
        return cy.get('[data-qa="first_name"]')
    }

    get lastNameInput() {
        return cy.get('[data-qa="last_name"]')
    }

    get addressInput() {
        return cy.get('[data-qa="address"]')
    }

    get countrySelect() {
        return cy.get('[data-qa="country"]')
    }

    get stateInput() {
        return cy.get('[data-qa="state"]')
    }

    get cityInput() {
        return cy.get('[data-qa="city"]')
    }

    get zipcodeInput() {
        return cy.get('[data-qa="zipcode"]')
    }

    get mobileNumberInput() {
        return cy.get('[data-qa="mobile_number"]')
    }

    get createAccountButton() {
        return cy.get('[data-qa="create-account"]')
    }

    // ─── Selectores - Confirmaciones ──────────────────────────────────────────

    get accountCreatedTitle() {
        return cy.get('[data-qa="account-created"]')
    }

    get continueButton() {
        return cy.get('[data-qa="continue-button"]')
    }

    get accountDeletedTitle() {
        return cy.get('[data-qa="account-deleted"]')
    }

    get deleteAccountLink() {
        return cy.get('a[href="/delete_account"]')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    enterSignupDetails(name, email) {
        this.signupNameInput.should('be.visible').type(name)
        this.signupEmailInput.should('be.visible').type(email)
    }

    clickSignupButton() {
        this.signupButton.click()
    }

    fillAccountInformation(password) {
        this.accountInfoTitle.should('be.visible')
        this.genderMrRadio.check()
        this.passwordInput.type(password)
        this.daysSelect.select('1')
        this.monthsSelect.select('January')
        this.yearsSelect.select('1990')
    }

    fillAddressDetails(firstName, lastName, address, state, city, zipcode, mobile) {
        this.firstNameInput.type(firstName)
        this.lastNameInput.type(lastName)
        this.addressInput.type(address)
        this.countrySelect.select('United States')
        this.stateInput.type(state)
        this.cityInput.type(city)
        this.zipcodeInput.type(zipcode)
        this.mobileNumberInput.type(mobile)
    }

    clickCreateAccount() {
        this.createAccountButton.click()
    }

    verifyAccountCreated() {
        this.accountCreatedTitle
            .should('be.visible')
            .and('contain.text', 'Account Created!')
    }

    clickContinue() {
        this.continueButton.click()
    }

    clickDeleteAccount() {
        this.deleteAccountLink.click()
    }

    verifyAccountDeleted() {
        this.accountDeletedTitle
            .should('be.visible')
            .and('contain.text', 'Account Deleted!')
    }
}

export default SignupPage
