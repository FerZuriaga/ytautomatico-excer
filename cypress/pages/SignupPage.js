// Page Object Model - SignupPage
// Encapsula selectores y acciones del flujo de registro de usuario en automationexercise.com
// Cubre: formulario "New User Signup!", "ENTER ACCOUNT INFORMATION" y confirmaciones

class SignupPage {

    // ─── Selectores — Sección "New User Signup!" ─────────────────────────────

    get newUserSignupTitle() {
        return cy.contains('New User Signup!')
    }

    get signupNameInput() {
        return cy.get('[data-qa="signup-name"]')
    }

    get signupEmailInput() {
        return cy.get('[data-qa="signup-email"]')
    }

    get signupButton() {
        return cy.get('[data-qa="signup-button"]')
    }

    // ─── Selectores — Sección "ENTER ACCOUNT INFORMATION" ────────────────────

    get accountInfoTitle() {
        return cy.contains('Enter Account Information')
    }

    get titleMrRadio() {
        return cy.get('#id_gender1')
    }

    get passwordInput() {
        return cy.get('[data-qa="password"]')
    }

    get daySelect() {
        return cy.get('[data-qa="days"]')
    }

    get monthSelect() {
        return cy.get('[data-qa="months"]')
    }

    get yearSelect() {
        return cy.get('[data-qa="years"]')
    }

    get newsletterCheckbox() {
        return cy.get('#newsletter')
    }

    get specialOffersCheckbox() {
        return cy.get('#optin')
    }

    // ─── Selectores — Datos de dirección ─────────────────────────────────────

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

    // ─── Selectores — Confirmaciones ─────────────────────────────────────────

    get accountCreatedTitle() {
        return cy.contains('Account Created!')
    }

    get continueButton() {
        return cy.get('[data-qa="continue-button"]')
    }

    get deleteAccountButton() {
        return cy.get('a[href="/delete_account"]')
    }

    get accountDeletedTitle() {
        return cy.contains('Account Deleted!')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    verifyNewUserSignupVisible() {
        this.newUserSignupTitle.should('be.visible')
    }

    enterSignupNameAndEmail(name, email) {
        this.signupNameInput.should('be.visible').type(name)
        this.signupEmailInput.should('be.visible').type(email)
    }

    clickSignupButton() {
        this.signupButton.click()
    }

    verifyAccountInfoFormVisible() {
        this.accountInfoTitle.should('be.visible')
    }

    fillAccountInfo(password) {
        this.titleMrRadio.check()
        this.passwordInput.should('be.visible').type(password)
        this.daySelect.select('10')
        this.monthSelect.select('January')
        this.yearSelect.select('1990')
    }

    selectNewsletterAndOffers() {
        this.newsletterCheckbox.check()
        this.specialOffersCheckbox.check()
    }

    fillAddressDetails(data) {
        this.firstNameInput.should('be.visible').type(data.firstName)
        this.lastNameInput.type(data.lastName)
        this.companyInput.type(data.company)
        this.address1Input.type(data.address1)
        this.address2Input.type(data.address2)
        this.countrySelect.select(data.country)
        this.stateInput.type(data.state)
        this.cityInput.type(data.city)
        this.zipcodeInput.type(data.zipcode)
        this.mobileNumberInput.type(data.mobileNumber)
    }

    clickCreateAccount() {
        this.createAccountButton.click()
    }

    verifyAccountCreated() {
        this.accountCreatedTitle.should('be.visible')
    }

    clickContinue() {
        this.continueButton.click()
    }

    clickDeleteAccount() {
        this.deleteAccountButton.click()
    }

    verifyAccountDeleted() {
        this.accountDeletedTitle.should('be.visible')
    }
}

export default SignupPage
