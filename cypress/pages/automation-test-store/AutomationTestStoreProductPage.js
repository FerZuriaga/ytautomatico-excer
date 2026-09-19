class AutomationTestStoreProductPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get productName() { return cy.get('h1').first() }
    get quantityInput() { return cy.get('#product_quantity') }
    get addToCartLink() { return cy.get('#product a.cart') }
    get unitPrice() { return cy.get('.productfilneprice') }
    get oldPrice() { return cy.get('.productpageoldprice') }
    get totalPrice() { return cy.get('.total-price') }
    get descriptionTabLink() { return cy.get('a[href="#description"]') }
    get reviewsTabLink() { return cy.get('a[href="#review"]') }
    get tagsTabLink() { return cy.get('a[href="#producttag"]') }
    get descriptionInfo() { return cy.get('#description .productinfo') }
    get tagsList() { return cy.get('#producttag ul.tags li a') }
    get reviewForm() { return cy.get('#review .content') }
    get ratingRadio() { return cy.get('input[name="rating"]') }
    get reviewNameInput() { return cy.get('#name') }
    get reviewTextArea() { return cy.get('#text') }
    get captchaImage() { return cy.get('#captcha_img') }
    get captchaInput() { return cy.get('#captcha') }
    get reviewSubmitButton() { return cy.get('#review_submit') }
    get reviewErrorAlert() { return cy.get('#review .alert-danger') }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    visit(productId) {
        cy.gotoATSUrl(`/index.php?rt=product/product&product_id=${productId}`)
    }

    setQuantity(quantity) {
        this.quantityInput.clear().type(String(quantity))
    }

    addToCart() {
        this.addToCartLink.click()
    }

    openTab(tab) {
        const links = { description: this.descriptionTabLink, reviews: this.reviewsTabLink, tags: this.tagsTabLink }
        links[tab].click()
    }

    fetchNoReviewsText(productId) {
        return cy.request(`/index.php?rt=product/review/review&product_id=${productId}`).its('body')
    }

    fillReviewForm({ rating, name, text, captcha }) {
        if (rating) this.ratingRadio.filter(`[value="${rating}"]`).check({ force: true })
        if (name !== undefined) this.reviewNameInput.clear().type(name)
        if (text !== undefined) this.reviewTextArea.clear().type(text)
        if (captcha !== undefined) this.captchaInput.clear()
        if (captcha) this.captchaInput.type(captcha)
    }

    submitReview() {
        this.reviewSubmitButton.click()
    }
}

export default AutomationTestStoreProductPage
