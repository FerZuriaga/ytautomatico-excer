class AutomationTestStoreAccountPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get welcomeMenu() { return cy.get('.menu_account') }
    get logoutLink() { return cy.get('a[href*="rt=account/logout"]').first() }
    get logoutConfirmationHeading() { return cy.get('h1.heading1') }
    get continueButton() { return cy.contains('a', 'Continue') }
    get cartTable() { return cy.get('#cart') }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    logout() {
        this.logoutLink.click({ force: true })
    }

    goToAccountViaNavigation() {
        this.welcomeMenu.find('a').first().click({ force: true })
    }

    addProductToCart(productId) {
        cy.gotoATSUrl(`/index.php?rt=product/product&product_id=${productId}`)
        cy.contains('a, button', 'Add to Cart').click({ force: true })
    }

    goToCart() {
        cy.gotoATSUrl('/index.php?rt=checkout/cart')
    }

    verifyLoggedInHeader() {
        this.welcomeMenu.should('be.visible').and('contain.text', 'Welcome back')
    }

    verifyLoggedOut() {
        cy.url().should('include', 'rt=account/logout')
        this.logoutConfirmationHeading.should('contain.text', 'Account Logout')
        cy.contains('You have been logged off your account').should('be.visible')
    }

    verifyRedirectedToLogin() {
        cy.url().should('include', 'rt=account/login')
    }

    verifyNoAuthenticatedNavigationAvailable() {
        cy.contains('a', 'Login or register').should('be.visible')
        cy.get('.menu_account').should('not.contain.text', 'Welcome back')
    }

    verifyCartContainsProduct(productName) {
        this.cartTable.should('be.visible').and('contain.text', productName)
    }

    verifyCartIsEmpty() {
        cy.contains('Your shopping cart is empty').should('be.visible')
    }
}

export default AutomationTestStoreAccountPage
