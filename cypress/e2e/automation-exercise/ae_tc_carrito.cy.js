// Modulo: Carrito de Compras - AutomationExercise
// Sitio bajo prueba: https://automationexercise.com
// Agrupa: TC12 [SCRUM-23], TC13 [SCRUM-22], TC17 [SCRUM-12], TC20 [SCRUM-9]

import ProductsPage from '../../pages/automation-exercise/ProductsPage'
import CartPage from '../../pages/automation-exercise/CartPage'
import HomePage from '../../pages/automation-exercise/HomePage'
import ProductDetailPage from '../../pages/automation-exercise/ProductDetailPage'
import LoginPage from '../../pages/automation-exercise/LoginPage'
import CheckoutPage from '../../pages/automation-exercise/CheckoutPage'

const productsPage = new ProductsPage()
const cartPage = new CartPage()
const homePage = new HomePage()
const productDetailPage = new ProductDetailPage()
const loginPage = new LoginPage()
const checkoutPage = new CheckoutPage()

describe('[SCRUM-23] TC12 - Add Products in Cart', () => {

    beforeEach(() => {
        // Step 1 & 2: Launch browser and navigate to automationexercise.com
        cy.gotoAEUrl('/')
    })

    it('should add two products to cart and verify prices, quantity and total', () => {

        // Step 3: Verify that home page is visible successfully
        homePage.verifyHomePageVisible()

        // Step 4: Click on 'Products' button
        productsPage.clickAllProductsButton()
        productsPage.verifyAllProductsPage()

        // Step 5: Hover over first product and click 'Add to cart'
        productsPage.hoverAndAddToCart(0)

        // Step 6: Click 'Continue Shopping' button
        productsPage.clickContinueShopping()

        // Step 7: Hover over second product and click 'Add to cart'
        productsPage.hoverAndAddToCart(1)

        // Step 8: Click 'View Cart' button
        productsPage.clickViewCartFromModal()

        // Step 9: Verify both products are added to Cart
        cartPage.verifyCartPageVisible()
        cartPage.verifyCartHasProducts(2)

        // Step 10: Verify prices, quantity and total price for each product
        // Quantity of each product must be 1
        cartPage.verifyAllProductsQuantityIsOne()

        // Total price of each product must match its unit price (quantity = 1)
        cartPage.verifyProductTotalMatchesUnitPrice(0)
        cartPage.verifyProductTotalMatchesUnitPrice(1)
    })
})

describe('[SCRUM-22] TC13 - Verify Product quantity in Cart', () => {

    const EXPECTED_QUANTITY = 4

    beforeEach(() => {
        // Step 1 & 2: Launch browser and navigate to automationexercise.com
        cy.gotoAEUrl('/')
    })

    it('should display the product in cart with the exact quantity set on detail page', () => {

        // Step 3: Verify that home page is visible successfully
        homePage.verifyHomePageVisible()

        // Step 4: Click 'View Product' for the first product on home page
        cy.get('.features_items .product-image-wrapper').first().within(() => {
            cy.contains('View Product').click()
        })

        // Step 5: Verify product detail is opened
        productDetailPage.verifyProductDetailVisible()

        // Step 6: Increase quantity to 4
        productDetailPage.setQuantity(EXPECTED_QUANTITY)

        // Verify the input reflects the new quantity before submitting
        productDetailPage.quantityInput.should('have.value', String(EXPECTED_QUANTITY))

        // Step 7: Click 'Add to cart' button
        productDetailPage.clickAddToCart()

        // Step 8: Click 'View Cart' button (inside the confirmation modal)
        productDetailPage.clickViewCart()

        // Step 9: Verify that product is displayed in cart page with exact quantity
        cartPage.verifyCartPageVisible()
        cartPage.verifyCartNotEmpty()
        cartPage.verifyProductQuantity(EXPECTED_QUANTITY)
    })
})

describe('Test Case 17 - Remove Products From Cart', () => {
  it('Should remove a product from cart and verify cart is empty', () => {
    // Step 1-3: Navigate to home page and verify it loads
    cy.gotoAEUrl('/')
    cy.get('body').should('be.visible')
    cy.get('.logo').should('be.visible')

    // Step 4: Add a product to cart from the products page
    cy.gotoAEUrl('/products')
    cy.get('.product-image-wrapper').should('have.length.greaterThan', 0)

    // Add the first product to cart
    cy.get('.product-image-wrapper').first().within(() => {
      cy.get('.productinfo a.btn').click()
    })

    // Dismiss the modal
    cy.get('#cartModal .modal-confirm').should('be.visible')
    cy.get('#cartModal .modal-confirm [data-dismiss="modal"]').click()

    // Step 5: Click Cart button
    cy.get('.shop-menu ul li a[href*="cart"]').click()

    // Step 6: Verify Cart page is shown
    cy.validateAEUrl('/view_cart')
    cy.get('#cart_info').should('be.visible')
    cy.get('#cart_info_table tbody tr').should('have.length.greaterThan', 0)

    // Step 7: Click 'X' button to remove the product
    cy.get('#cart_info_table tbody tr').first().within(() => {
      cy.get('.cart_delete a.cart_quantity_delete').click()
    })

    // Step 8: Verify product is removed - cart should be empty
    cy.get('#empty_cart').should('be.visible')
    cy.get('#empty_cart p').should('contain', 'Cart is empty!')
  })
})

describe('TC20 - Search Products and Verify Cart After Login', () => {

    // Datos de prueba: credenciales de usuario existente
    const USER = {
        email: 'testops@test.com',
        password: 'password123',
        username: 'testOps'
    }

    // Producto a buscar: término específico que garantiza resultados consistentes
    const PRODUCT_TO_SEARCH = 'Blue Top'

    beforeEach(() => {
        // Interceptar recursos innecesarios para mejorar performance
        cy.intercept({ resourceType: /fetch/ }, { log: false })
        // Navegar a la home antes de cada test
        cy.gotoAEUrl('/')
    })

    it('Debe iniciar sesión, buscar un producto, agregarlo al carrito y verificar que esté en el carrito', () => {

        // Paso 1-2: Verificar que la home page es visible
        homePage.verifyHomePageVisible()

        // Paso 3: Click en "Signup / Login"
        homePage.clickSignupLogin()

        // Paso 4: Verificar que el formulario de login es visible
        loginPage.verifyLoginFormVisible()

        // Paso 5: Ingresar credenciales y hacer login
        loginPage.enterCredentials(USER.email, USER.password)
        loginPage.clickLoginButton()

        // Paso 6: Verificar que el usuario está logueado
        loginPage.verifyLoggedIn(USER.username)

        // Paso 7: Navegar a la página de productos
        productsPage.clickAllProductsButton()

        // Paso 8: Verificar que la página "All Products" cargó correctamente
        productsPage.verifyAllProductsPage()

        // Paso 9: Guardar el nombre del primer resultado antes de buscar
        // (se realiza la búsqueda y luego se guarda el nombre del primer resultado)
        productsPage.searchProduct(PRODUCT_TO_SEARCH)

        // Paso 10: Verificar que el título cambió a "Searched Products"
        productsPage.verifySearchedProductsTitle()

        // Paso 11: Verificar que los productos encontrados contienen el término buscado
        productsPage.verifyProductsContain(PRODUCT_TO_SEARCH)

        // Paso 12-13: Guardar el nombre del primer producto y agregarlo al carrito
        productsPage.saveFirstProductNameAndAddToCart()

        // Paso 14: Navegar al carrito
        checkoutPage.clickCartButton()

        // Paso 15: Verificar que la página del carrito está visible
        checkoutPage.verifyCartPageDisplayed()

        // Paso 16: Verificar que el carrito contiene el producto correcto
        productsPage.verifyCartContainsProduct()
    })
})
