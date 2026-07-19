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

    // Enlace "View Product" del primer producto de la lista
    get firstProductViewLink() {
        return cy.get('.product-image-wrapper').first().find('a').contains('View Product')
    }

    // Nombre del producto en la página de detalle (usado por TC8)
    get productDetailName() {
        return cy.get('.product-information h2')
    }

    // Párrafos de información del detalle: categoría, disponibilidad, condición, marca (usado por TC8)
    get productDetailInfo() {
        return cy.get('.product-information p')
    }

    // Precio del producto en la página de detalle (usado por TC8)
    get productDetailPrice() {
        return cy.get('.product-information span span')
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

    // ─── API granular por índice (TC2) ────────────────────────────────────────

    // Retorna el precio del producto en la posición dada dentro del listado
    getProductPriceAt(index) {
        return this.productCards.find('.productinfo h2').eq(index).should('exist').invoke('text')
    }

    // Retorna el nombre del producto en la posición dada dentro del listado
    getProductNameAt(index) {
        return this.productCards.find('.productinfo p').eq(index).should('exist').invoke('text')
    }

    // Hace click en "View Product" del producto en la posición dada
    clickViewProductAt(index) {
        this.productCards.find('.choose').eq(index).contains('View Product').click()
    }

    // Hace click en "View Product" del primer producto (TC22)
    clickViewProduct() {
        cy.get('.choose').first().contains('View Product').click()
    }

    // ─── Acciones de hover y modal de carrito (TC12) ──────────────────────────

    // Hace hover sobre el producto en el indice dado y hace click en "Add to cart" via overlay
    hoverAndAddToCart(index) {
        cy.get('.product-image-wrapper').eq(index).trigger('mouseover')
        cy.get('.product-image-wrapper').eq(index).find('.add-to-cart').first().click({ force: true })
    }

    // Hace click en "Continue Shopping" dentro del modal de confirmacion
    clickContinueShopping() {
        cy.get('#cartModal .modal-footer button').contains('Continue Shopping').click()
    }

    // Hace click en "View Cart" dentro del modal de confirmacion
    clickViewCartFromModal() {
        cy.get('#cartModal .modal-body a[href="/view_cart"]').should('be.visible').click()
    }

    // ─── Selectores y acciones: Filtros por categoria y marca (TC18/TC19) ─────

    get categoryHeadings() {
        return cy.get('.category-products [data-toggle="collapse"]')
    }

    get brandLinks() {
        return cy.get('.brands_products li a')
    }

    // Hace click en una categoria aleatoria del panel lateral (la expande) y luego
    // hace click en una subcategoria aleatoria dentro de ese panel, que es lo que
    // dispara la navegacion a /category_products
    clickRandomCategory() {
        this.categoryHeadings.should('be.visible').then((categories) => {
            cy.randomNum(categories.length).then((randomIndex) => {
                cy.wrap(categories).eq(randomIndex).invoke('text').as('categoryName')
                cy.wrap(categories).eq(randomIndex).click()
            })
        })
        cy.get('@categoryName').then((categoryName) => {
            cy.get(`#${categoryName.trim()} .panel-body ul li a`).then((subcategories) => {
                cy.randomNum(subcategories.length).then((randomIndex) => {
                    cy.wrap(subcategories).eq(randomIndex).click()
                })
            })
        })
    }

    // Verifica que la navegacion aterrizo en la pagina de productos filtrados por categoria
    verifyCategoryProductsPage() {
        cy.location('pathname').should('contain', '/category_products')
        this.productCards.its('length').should('be.gt', 0)
    }

    // Hace click en una marca aleatoria del panel lateral y guarda su nombre y cantidad esperada de productos
    clickRandomBrand() {
        this.brandLinks.should('be.visible').then((brands) => {
            cy.randomNum(brands.length).then((randomIndex) => {
                cy.wrap(brands).eq(randomIndex).then((brand) => {
                    const href = brand.attr('href')
                    cy.wrap(href.split('/brand_products/')[1]).as('brandName')
                })
                cy.wrap(brands).eq(randomIndex).find('span').invoke('text').then((countText) => {
                    const expectedCount = Number(countText.slice(1, countText.length - 1))
                    cy.wrap(expectedCount).as('brandProductCount')
                })
                cy.wrap(brands).eq(randomIndex).click()
            })
        })
    }

    // Verifica que la navegacion aterrizo en la pagina de la marca filtrada,
    // que el titulo coincide con la marca elegida y que la cantidad de productos coincide
    verifyBrandProductsPage() {
        cy.location('pathname').should('contain', '/brand_products/')
        cy.get('@brandName').then((brandName) => {
            this.pageTitle.should('contain', brandName)
        })
        cy.get('@brandProductCount').then((expectedCount) => {
            this.productCards.its('length').should('eq', expectedCount)
        })
    }
}

export default ProductsPage
