// Test Case 8 - Verify All Products and Product Detail Page
// Sitio bajo prueba: https://automationexercise.com
// Pasos:
//   1. Launch browser
//   2. Navigate to url 'http://www.automationexercise.com'
//   3. Verify that home page is visible successfully
//   4. Click on 'Products' button
//   5. Verify user is navigated to ALL PRODUCTS page successfully
//   6. The products list is visible
//   7. Click on 'View Product' of first product
//   8. User is landed on product detail page
//   9. Verify detail: product name, category, price, availability, condition, brand

import HomePage from '../pages/HomePage'
import ProductsPage from '../pages/ProductsPage'

describe('TC8 - Verify All Products and Product Detail Page', () => {

    // Instancias de los Page Objects
    const homePage = new HomePage()
    const productsPage = new ProductsPage()

    beforeEach(() => {
        // Paso 1-2: Launch browser y navegar a la home
        cy.gotoAEUrl('/')
    })

    it('Debe navegar a All Products, listar productos y verificar el detalle del primer producto', () => {

        // Paso 3: Verificar que la home page es visible
        homePage.verifyHomePageVisible()

        // Paso 4: Click en botón 'Products' en la barra de navegación
        productsPage.clickAllProductsButton()

        // Paso 5: Verificar que el usuario navega a la página ALL PRODUCTS
        cy.validateAEUrl('/products')

        // Paso 6: Verificar que el título es 'All Products' y la lista de productos es visible
        productsPage.verifyAllProductsPage()

        // Paso 7: Click en 'View Product' del primer producto
        productsPage.clickFirstProductViewLink()

        // Paso 8: Verificar que el usuario llega a la página de detalle del producto
        cy.validateAEUrl('/product_details')

        // Paso 9: Verificar que el detalle contiene: nombre, categoría, precio, disponibilidad, condición, marca
        productsPage.verifyProductDetailPage()
    })
})
