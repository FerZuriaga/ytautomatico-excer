// Page Object Model - ProductsPage
// Encapsula selectores y acciones de la página de productos de automationexercise.com

class ProductsPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    // Botón "Products" en la barra de navegación superior
    get allProductsBtn() {
        return cy.get('.navbar-nav a[href="/products"]')
    }

    // Título h2 de la página (sirve para "All Products" y "Searched Products")
    get pageTitle() {
        return cy.get('h2.title')
    }

    // Listado de tarjetas de producto
    get productCards() {
        return cy.get('.product-image-wrapper')
    }

    // Campo de texto para búsqueda
    get searchInput() {
        return cy.get('input#search_product')
    }

    // Botón para ejecutar la búsqueda
    get searchBtn() {
        return cy.get('button#submit_search')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    // Hace click en el enlace "Products" del menú de navegación
    clickAllProductsButton() {
        this.allProductsBtn.should('be.visible').click()
    }

    // Verifica que estamos en la página "All Products"
    // Comprueba el título y que exista al menos un producto cargado
    verifyAllProductsPage() {
        this.pageTitle.should('be.visible').and('have.text', 'All Products')
        this.productCards.its('length').should('be.gt', 0)
    }

    // Escribe el nombre del producto en el buscador y hace click en buscar
    searchProduct(productName) {
        this.searchInput.should('be.visible').type(productName)
        this.searchBtn.click()
    }

    // Verifica que el título de resultados sea "Searched Products"
    verifySearchedProductsTitle() {
        this.pageTitle.should('be.visible').and('have.text', 'Searched Products')
    }

    // Recorre con each() todos los productos del resultado
    // y verifica que el nombre de cada uno contenga el término buscado
    verifyProductsContain(productName) {
        this.productCards.should('have.length.gt', 0)
        this.productCards.each((productCard) => {
            cy.wrap(productCard)
                .find('.productinfo p')
                .should('be.visible')
                .invoke('text')
                .then((name) => {
                    expect(name.toLowerCase()).to.include(productName.toLowerCase())
                })
        })
    }

    // Guarda el nombre del primer producto del listado en una variable de Cypress
    // y luego agrega ese producto al carrito cerrando el modal de confirmacion
    saveFirstProductNameAndAddToCart() {
        // Recuperar el nombre antes de hacer click para tenerlo disponible como alias
        this.productCards.first()
            .find('.productinfo p')
            .should('be.visible')
            .invoke('text')
            .then((name) => {
                cy.wrap(name.trim()).as('firstProductName')
            })
        this.productCards.first()
            .find('.productinfo a')
            .should('have.text', 'Add to cart')
            .click()
        cy.get('#cartModal').should('be.visible')
        cy.get('#cartModal [data-dismiss="modal"]').click()
    }

    // Verifica que el carrito contenga el producto cuyo nombre fue guardado como @firstProductName
    verifyCartContainsProduct() {
        cy.get('#cart_info_table').should('exist').and('be.visible')
        cy.get('#cart_info_table tbody tr').should('have.length.gte', 1)
        cy.get('@firstProductName').then((productName) => {
            cy.get('#cart_info_table tbody tr').first()
                .find('.cart_description h4 a')
                .should('be.visible')
                .invoke('text')
                .then((cartName) => {
                    expect(cartName.trim()).to.include(productName)
                })
        })
    }

    // Enlace "View Product" del primer producto de la lista
    get firstProductViewLink() {
        return cy.get('.product-image-wrapper').first().find('a').contains('View Product')
    }

    // Nombre del producto en la página de detalle
    get productDetailName() {
        return cy.get('.product-information h2')
    }

    // Párrafos de información del detalle (categoría, disponibilidad, condición, marca)
    get productDetailInfo() {
        return cy.get('.product-information p')
    }

    // Precio del producto en la página de detalle
    get productDetailPrice() {
        return cy.get('.product-information span span')
    }

    // Hace click en "View Product" del primer producto
    clickFirstProductViewLink() {
        this.firstProductViewLink.should('be.visible').click()
    }

    // Verifica que la página de detalle del producto contiene todos los campos requeridos
    verifyProductDetailPage() {
        this.productDetailName.should('be.visible').and('not.be.empty')
        this.productDetailPrice.should('be.visible').and('not.be.empty')
        this.productDetailInfo.contains('Category').should('exist')
        this.productDetailInfo.contains('Availability').should('exist')
        this.productDetailInfo.contains('Condition').should('exist')
        this.productDetailInfo.contains('Brand').should('exist')
    }
}

export default ProductsPage
