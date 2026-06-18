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

    // ─── Selectores: Review Form ───────────────────────────────────────────────

    // Titulo de la seccion de resena
    get writeReviewTitle() {
        return cy.get('a[href="#reviews"]')
    }

    // Campo nombre del reviewer
    get reviewNameInput() {
        return cy.get('#name')
    }

    // Campo email del reviewer
    get reviewEmailInput() {
        return cy.get('#email')
    }

    // Campo texto de la resena
    get reviewTextInput() {
        return cy.get('#review')
    }

    // Boton Submit de la resena
    get reviewSubmitBtn() {
        return cy.get('#button-review')
    }

    // Mensaje de exito tras enviar la resena
    get reviewSuccessMessage() {
        return cy.get('.alert-success span')
    }

    // ─── Acciones: Review ─────────────────────────────────────────────────────

    // Verifica que la seccion "Write Your Review" sea visible
    verifyWriteReviewVisible() {
        this.writeReviewTitle
            .should('be.visible')
            .and('contain.text', 'Write Your Review')
    }

    // Completa y envia el formulario de resena
    submitReview(name, email, review) {
        this.reviewNameInput.should('be.visible').type(name)
        this.reviewEmailInput.should('be.visible').type(email)
        this.reviewTextInput.should('be.visible').type(review)
        this.reviewSubmitBtn.click()
    }

    // Verifica que el mensaje de exito sea visible
    verifyReviewSuccessMessage() {
        this.reviewSuccessMessage
            .should('be.visible')
            .and('contain.text', 'Thank you for your review.')
    }
}

export default ProductDetailPage
