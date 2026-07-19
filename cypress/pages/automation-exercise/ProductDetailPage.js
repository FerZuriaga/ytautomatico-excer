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

    // Heading "Write Your Review" usado para scroll y visibilidad (TC22)
    get writeYourReviewHeading() {
        return cy.contains('Write Your Review')
    }

    // Titulo de la seccion de resena (enlace anchor)
    get writeReviewTitle() {
        return cy.get('a[href="#reviews"]')
    }

    // Campo nombre del reviewer
    get reviewNameInput() {
        return cy.get('#name')
    }

    // Alias de reviewNameInput (nombre usado en TC22)
    get nameInput() {
        return cy.get('#name')
    }

    // Campo email del reviewer
    get reviewEmailInput() {
        return cy.get('#email')
    }

    // Alias de reviewEmailInput (nombre usado en TC22)
    get emailInput() {
        return cy.get('#email')
    }

    // Campo texto de la resena
    get reviewTextInput() {
        return cy.get('#review')
    }

    // Alias de reviewTextInput (nombre usado en TC22)
    get reviewTextarea() {
        return cy.get('#review')
    }

    // Boton Submit de la resena
    get reviewSubmitBtn() {
        return cy.get('#button-review')
    }

    // Alias de reviewSubmitBtn (nombre usado en TC22)
    get submitReviewBtn() {
        return cy.get('#button-review')
    }

    // Mensaje de exito tras enviar la resena (selector sobre el span interno)
    get reviewSuccessMessage() {
        return cy.get('.alert-success span')
    }

    // Mensaje de exito sobre el contenedor completo (TC22)
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

    // Verifica que el heading "Write Your Review" sea visible con scroll (TC22)
    verifyWriteYourReviewVisible() {
        this.writeYourReviewHeading.scrollIntoView().should('be.visible')
    }

    // Verifica que la seccion "Write Your Review" sea visible (TC21)
    verifyWriteReviewVisible() {
        this.writeReviewTitle
            .should('be.visible')
            .and('contain.text', 'Write Your Review')
    }

    // Completa el formulario de review sin hacer submit (TC22)
    fillReviewForm(name, email, review) {
        this.nameInput.should('be.visible').type(name)
        this.emailInput.should('be.visible').type(email)
        this.reviewTextarea.should('be.visible').type(review)
    }

    // Completa y envía el formulario de resena.
    // Con argumentos (TC21): llena los campos y hace click en Submit.
    // Sin argumentos (TC22): solo hace click en Submit (campos ya llenados por fillReviewForm).
    submitReview(name, email, review) {
        if (name !== undefined) {
            this.reviewNameInput.should('be.visible').type(name)
            this.reviewEmailInput.should('be.visible').type(email)
            this.reviewTextInput.should('be.visible').type(review)
        }
        this.reviewSubmitBtn.click()
    }

    // Verifica que el mensaje de exito sea visible (TC21 — selector sobre span)
    verifyReviewSuccessMessage() {
        this.reviewSuccessMessage
            .should('be.visible')
            .and('contain.text', 'Thank you for your review.')
    }

    // Verifica que el mensaje de exito sea visible (TC22 — selector sobre contenedor)
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
