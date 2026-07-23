function parsePrice(text) {
    return Number(text.replace(/[^0-9.]/g, ''))
}

class SauceDemoCheckoutPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get firstNameInput() {
        return cy.get('#first-name')
    }

    get lastNameInput() {
        return cy.get('#last-name')
    }

    get postalCodeInput() {
        return cy.get('#postal-code')
    }

    get continueButton() {
        return cy.get('#continue')
    }

    get finishButton() {
        return cy.get('#finish')
    }

    get errorMessage() {
        return cy.get('[data-test="error"]')
    }

    get subtotalLabel() {
        return cy.get('.summary_subtotal_label')
    }

    get taxLabel() {
        return cy.get('.summary_tax_label')
    }

    get totalLabel() {
        return cy.get('.summary_total_label')
    }

    get completeHeader() {
        return cy.get('.complete-header')
    }

    get backHomeButton() {
        return cy.get('#back-to-products')
    }

    get cartItemPrices() {
        return cy.get('.cart_item .inventory_item_price')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    fillBuyerInformation(firstName, lastName, postalCode) {
        this.firstNameInput.clear()
        if (firstName) this.firstNameInput.type(firstName)

        this.lastNameInput.clear()
        if (lastName) this.lastNameInput.type(lastName)

        this.postalCodeInput.clear()
        if (postalCode) this.postalCodeInput.type(postalCode)
    }

    clickContinue() {
        this.continueButton.click()
    }

    clickFinish() {
        this.finishButton.click()
    }

    verifyErrorMessage(expectedText) {
        this.errorMessage.should('be.visible').and('contain.text', expectedText)
    }

    verifyOnOrderSummary() {
        cy.location('pathname').should('contain', '/checkout-step-two.html')
    }

    verifySubtotalMatchesItemsSum() {
        this.cartItemPrices.then(($prices) => {
            const sum = [...$prices].reduce((acc, el) => acc + parsePrice(el.textContent), 0)

            this.subtotalLabel.invoke('text').then((text) => {
                expect(parsePrice(text)).to.be.closeTo(sum, 0.01)
            })
        })
    }

    verifyTotalEqualsSubtotalPlusTax() {
        this.subtotalLabel.invoke('text').then((subtotalText) => {
            const subtotal = parsePrice(subtotalText)

            this.taxLabel.invoke('text').then((taxText) => {
                const tax = parsePrice(taxText)

                this.totalLabel.invoke('text').then((totalText) => {
                    const total = parsePrice(totalText)

                    expect(total).to.be.closeTo(subtotal + tax, 0.01)
                })
            })
        })
    }

    verifyOrderConfirmation() {
        cy.location('pathname').should('contain', '/checkout-complete.html')
        this.completeHeader.should('be.visible').and('contain.text', 'Thank you for your order!')
    }

    goBackToProducts() {
        this.backHomeButton.click()
    }
}

export default SauceDemoCheckoutPage
