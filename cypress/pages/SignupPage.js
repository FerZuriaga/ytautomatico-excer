// Page Object Model - SignupPage
// Encapsula selectores y acciones del formulario de registro de automationexercise.com

class SignupPage {

    // ─── Selectores - Signup inicial ─────────────────────────────────────────

    get signupNameInput() {
        return cy.get('[data-qa="signup-name"]')
    }

    get signupEmailInput() {
        return cy.get('[data-qa="signup-email"]')
    }

    get signupButton() {
        return cy.get('[data-qa="signup-button"]')
    }

    // ─── Selectores - Formulario de detalle de cuenta ────────────────────────

    get titleMr() {
        return cy.get('#id_gender1')
    }

    get passwordInput() {
        return cy.get('[data-qa="password"]')
    }

    get firstNameInput() {
        return cy.get('[data-qa="first_name"]')
    }

    get lastNameInput() {
        return cy.get('[data-qa="last_name"]')
    }

    get companyInput() {
        return cy.get('[data-qa="company"]')
    }

    get address1Input() {
        return cy.get('[data-qa="address"]')
    }

    get address2Input() {
        return cy.get('[data-qa="address2"]')
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

    // ─── Selectores - Confirmacion ───────────────────────────────────────────

    get accountCreatedTitle() {
        return cy.get('[data-qa="account-created"]')
    }

    get continueButton() {
        return cy.get('[data-qa="continue-button"]')
    }

    // ─── Selectores - Delete account ─────────────────────────────────────────

    get deleteAccountLink() {
        return cy.get('a[href="/delete_account"]')
    }

    get accountDeletedTitle() {
        return cy.get('[data-qa="account-deleted"]')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    fillSignupName(name) {
        this.signupNameInput.should('be.visible').type(name)
    }

    fillSignupEmail(email) {
        this.signupEmailInput.should('be.visible').type(email)
    }

    clickSignupButton() {
        this.signupButton.click()
    }

    fillAccountDetails(userData) {
        this.titleMr.check()
        this.passwordInput.type(userData.password)
        this.firstNameInput.type(userData.firstName)
        this.lastNameInput.type(userData.lastName)
        this.address1Input.type(userData.address1)
        this.countrySelect.select(userData.country)
        this.stateInput.type(userData.state)
        this.cityInput.type(userData.city)
        this.zipcodeInput.type(userData.zipcode)
        this.mobileNumberInput.type(userData.mobile)
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
