// Page Object Model - SignupPage
// Encapsula selectores y acciones del flujo de registro de usuario en automationexercise.com

class SignupPage {

    // ─── Selectores - Formulario de nombre y email (primer paso) ─────────────

    get signupNameInput() {
        return cy.get('[data-qa="signup-name"]')
    }

    get signupEmailInput() {
        return cy.get('[data-qa="signup-email"]')
    }

    get signupButton() {
        return cy.get('[data-qa="signup-button"]')
    }

    // ─── Selectores - Formulario de información de cuenta (segundo paso) ──────

    get accountInfoTitle() {
        return cy.contains('Enter Account Information')
    }

    get genderMrRadio() {
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

    // ─── Selectores - Confirmacion de cuenta creada ────────────────────────────

    get accountCreatedTitle() {
        return cy.get('[data-qa="account-created"]')
    }

    get continueButton() {
        return cy.get('[data-qa="continue-button"]')
    }

    // ─── Selectores - Eliminacion de cuenta ───────────────────────────────────

    get deleteAccountLink() {
        return cy.get('a[href="/delete_account"]')
    }

    get accountDeletedTitle() {
        return cy.get('[data-qa="account-deleted"]')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    // Completa el primer paso: nombre y email
    fillSignupNameAndEmail(name, email) {
        this.signupNameInput.should('be.visible').type(name)
        this.signupEmailInput.should('be.visible').type(email)
        this.signupButton.click()
    }

    // Verifica que el titulo "Enter Account Information" sea visible
    verifyAccountInfoForm() {
        this.accountInfoTitle.should('be.visible')
    }

    // Completa el formulario detallado de informacion de cuenta
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

    // Hace click en el boton "Create Account"
    clickCreateAccount() {
        this.createAccountButton.click()
    }

    // Verifica el mensaje "ACCOUNT CREATED!" y hace click en Continue
    verifyAccountCreatedAndContinue() {
        this.accountCreatedTitle.should('be.visible').and('have.text', 'Account Created!')
        this.continueButton.click()
    }

    // Elimina la cuenta haciendo click en el enlace del menu
    clickDeleteAccount() {
        this.deleteAccountLink.click()
    }

    // Verifica el mensaje "ACCOUNT DELETED!" y hace click en Continue
    verifyAccountDeletedAndContinue() {
        this.accountDeletedTitle.should('be.visible').and('have.text', 'Account Deleted!')
        this.continueButton.click()
    }
}

export default SignupPage
