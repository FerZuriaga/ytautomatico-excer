class ProductDetailPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get detailPrice() {
        return cy.get('.product-information span span')
    }

    get detailName() {
        return cy.get('.product-information h2')
    }

    get productInfoLabels() {
        return cy.get('.product-information p')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    verifyOnDetailPage() {
        cy.validateAEUrl('product_detail')
    }

    verifyPriceMatches(expectedPrice) {
        this.detailPrice.invoke('text').should('eq', expectedPrice)
    }

    verifyNameMatches(expectedName) {
        this.detailName.invoke('text').should('eq', expectedName)
    }

    verifyProductInfoLabels() {
        const labels = ['Category:', 'Availability', 'Condition', 'Brand']
        this.productInfoLabels.each((label, index) => {
            if (index < labels.length) {
                cy.wrap(label).should('contain.text', labels[index])
            }
        })
    }
}

export default ProductDetailPage
