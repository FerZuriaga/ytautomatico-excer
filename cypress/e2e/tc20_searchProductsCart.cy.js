// Test Case 20 - Search Products and Verify Cart After Login
// Sitio bajo prueba: https://automationexercise.com
// SCRUM-9

import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import ProductsPage from '../pages/ProductsPage'
import CheckoutPage from '../pages/CheckoutPage'

describe('TC20 - Search Products and Verify Cart After Login', () => {

    // Instancias de los Page Objects
    const homePage = new HomePage()
    const loginPage = new LoginPage()
    const productsPage = new ProductsPage()
    const checkoutPage = new CheckoutPage()

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
