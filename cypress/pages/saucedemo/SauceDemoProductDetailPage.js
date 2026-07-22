class SauceDemoProductDetailPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get productName() {
        return cy.get('.inventory_details_name')
    }

    get productDescription() {
        return cy.get('.inventory_details_desc')
    }

    get productPrice() {
        return cy.get('.inventory_details_price')
    }

    get backButton() {
        return cy.get('#back-to-products')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    verifyProductDetail(name, price) {
        this.productName.should('have.text', name)
        this.productDescription.should('be.visible').and('not.be.empty')
        this.productPrice.should('have.text', price)
    }

    goBackToProducts() {
        this.backButton.click()
    }
}

export default SauceDemoProductDetailPage
