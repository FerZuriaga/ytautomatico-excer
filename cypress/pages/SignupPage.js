// Page Object Model - SignupPage
// Encapsula selectores y acciones del flujo de registro de usuario en automationexercise.com

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

    get genderMrRadio() {
        return cy.get('#id_gender1')
    }

    // Alias de genderMrRadio (nombre usado en TC1)
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

    get addressInput() {
        return cy.get('[data-qa="address"]')
    }

    // Alias de addressInput (nombre usado en TC1)
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

    // ─── Selectores — Confirmación de cuenta creada ───────────────────────────

    get accountCreatedTitle() {
        return cy.get('[data-qa="account-created"]')
    }

    get continueButton() {
        return cy.get('[data-qa="continue-button"]')
    }

    // ─── Selectores — Eliminación de cuenta ──────────────────────────────────

    get deleteAccountLink() {
        return cy.get('a[href="/delete_account"]')
    }

    // Alias de deleteAccountLink (nombre usado en TC1)
    get deleteAccountButton() {
        return cy.get('a[href="/delete_account"]')
    }

    get accountDeletedTitle() {
        return cy.get('[data-qa="account-deleted"]')
    }

    // ─── Acciones — API granular (TC1) ────────────────────────────────────────

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
        if (data.company) this.companyInput.type(data.company)
        this.address1Input.type(data.address1)
        if (data.address2) this.address2Input.type(data.address2)
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
        this.accountCreatedTitle.should('be.visible').and('have.text', 'Account Created!')
    }

    clickContinue() {
        this.continueButton.click()
    }

    clickDeleteAccount() {
        this.deleteAccountLink.click()
    }

    verifyAccountDeleted() {
        this.accountDeletedTitle.should('be.visible').and('have.text', 'Account Deleted!')
    }

    // ─── Acciones — API de compatibilidad hacia atrás (TC14, TC15 y tests mergeados) ─

    // wrapper → enterSignupNameAndEmail() — alias usado en TC14
    enterSignupDetails(name, email) {
        this.enterSignupNameAndEmail(name, email)
    }

    // wrapper → accountInfoTitle assert + fillAccountInfo() — usado en TC14
    fillAccountInformation(password) {
        this.accountInfoTitle.should('be.visible')
        this.fillAccountInfo(password)
    }

    // wrapper → enterSignupNameAndEmail() + clickSignupButton()
    fillSignupNameAndEmail(name, email) {
        this.enterSignupNameAndEmail(name, email)
        this.clickSignupButton()
    }

    // wrapper → verifyAccountInfoFormVisible()
    verifyAccountInfoForm() {
        this.verifyAccountInfoFormVisible()
    }

    // Completa el formulario completo de cuenta con datos variables (fecha incluida).
    // No se reemplaza por fillAccountInfo() porque esa versión hardcodea la fecha.
    fillAccountDetails({ password, day, month, year, firstName, lastName, address, country, state, city, zipcode, mobile }) {
        this.genderMrRadio.check()
        this.passwordInput.should('be.visible').type(password)
        this.daySelect.select(day)
        this.monthSelect.select(month)
        this.yearSelect.select(year)
        this.firstNameInput.should('be.visible').type(firstName)
        this.lastNameInput.should('be.visible').type(lastName)
        this.addressInput.should('be.visible').type(address)
        this.countrySelect.select(country)
        this.stateInput.should('be.visible').type(state)
        this.cityInput.should('be.visible').type(city)
        this.zipcodeInput.should('be.visible').type(zipcode)
        this.mobileNumberInput.should('be.visible').type(mobile)
    }

    // wrapper → verifyAccountCreated() + clickContinue()
    verifyAccountCreatedAndContinue() {
        this.verifyAccountCreated()
        this.clickContinue()
    }

    // wrapper → verifyAccountDeleted() + clickContinue()
    verifyAccountDeletedAndContinue() {
        this.verifyAccountDeleted()
        this.clickContinue()
    }
}

export default SignupPage
