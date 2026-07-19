// Page Object Model - ProductDetailPage
// Encapsula selectores y acciones de la pagina de detalle de producto
// Incluye acciones de cantidad/carrito y la seccion "Write Your Review"

class ProductDetailPage {

    // ─── Selectores: Detalle de Producto ──────────────────────────────────────

    // Contenedor de informacion del producto
    get productInformation() {
        return cy.get('.product-information')
    }

    // Titulo h2 del producto
    get productTitle() {
        return cy.get('.product-information h2')
    }

    // Alias de productTitle (nombre usado en TC2)
    get detailName() {
        return cy.get('.product-information h2')
    }

    // Precio del producto en detalle (TC2)
    get detailPrice() {
        return cy.get('.product-information span span')
    }

    // Párrafos de información: categoría, disponibilidad, condición, marca (TC2)
    get productInfoLabels() {
        return cy.get('.product-information p')
    }

    // Input de cantidad
    get quantityInput() {
        return cy.get('input#quantity')
    }

    // Boton Add to cart en pagina de detalle
    get addToCartBtn() {
        return cy.get('button.cart')
    }

    // Modal de confirmacion tras agregar al carrito
    get cartModal() {
        return cy.get('#cartModal')
    }

    // Enlace "View Cart" dentro del modal
    get viewCartLink() {
        return cy.get('#cartModal .modal-body a[href="/view_cart"]')
    }

    // ─── Selectores: Review Form ───────────────────────────────────────────────

    // Heading "Write Your Review" usado para scroll y visibilidad
    get writeYourReviewHeading() {
        return cy.contains('Write Your Review')
    }

    // Campo nombre del reviewer
    get nameInput() {
        return cy.get('#name')
    }

    // Campo email del reviewer
    get emailInput() {
        return cy.get('#email')
    }

    // Campo texto de la resena
    get reviewTextarea() {
        return cy.get('#review')
    }

    // Boton Submit de la resena
    get submitReviewBtn() {
        return cy.get('#button-review')
    }

    // Mensaje de exito tras enviar la resena
    get successMessage() {
        return cy.get('.alert-success')
    }

    // ─── Acciones: Cantidad y Carrito ─────────────────────────────────────────

    // Verifica que la pagina de detalle del producto sea visible
    verifyProductDetailVisible() {
        this.productInformation.should('be.visible')
        cy.url().should('include', '/product_details/')
    }

    // Establece la cantidad deseada en el input
    setQuantity(quantity) {
        this.quantityInput.should('be.visible').clear().type(String(quantity))
    }

    // Hace click en el boton Add to cart
    clickAddToCart() {
        this.addToCartBtn.should('be.visible').click()
    }

    // Verifica que el modal de carrito aparezca y hace click en View Cart
    clickViewCart() {
        this.cartModal.should('be.visible')
        this.viewCartLink.should('be.visible').click()
    }

    // ─── Acciones: Review ─────────────────────────────────────────────────────

    // Verifica que el heading "Write Your Review" sea visible con scroll
    verifyWriteYourReviewVisible() {
        this.writeYourReviewHeading.scrollIntoView().should('be.visible')
    }

    // Completa el formulario de review sin hacer submit
    fillReviewForm(name, email, review) {
        this.nameInput.should('be.visible').type(name)
        this.emailInput.should('be.visible').type(email)
        this.reviewTextarea.should('be.visible').type(review)
    }

    // Hace click en Submit (campos ya llenados por fillReviewForm)
    submitReview() {
        this.submitReviewBtn.click()
    }

    // Verifica que el mensaje de exito sea visible
    verifySuccessMessage() {
        this.successMessage
            .should('be.visible')
            .and('contain.text', 'Thank you for your review.')
    }

    // ─── Acciones: API granular de verificación de detalle (TC2) ──────────────

    // Verifica que la URL corresponde a una página de detalle de producto
    verifyOnDetailPage() {
        cy.validateAEUrl('product_detail')
    }

    // Verifica que el precio en detalle coincide con el valor esperado
    verifyPriceMatches(expectedPrice) {
        this.detailPrice.invoke('text').should('eq', expectedPrice)
    }

    // Verifica que el nombre en detalle coincide con el valor esperado
    verifyNameMatches(expectedName) {
        this.detailName.invoke('text').should('eq', expectedName)
    }

    // Verifica que los 4 campos informativos del producto están presentes
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
