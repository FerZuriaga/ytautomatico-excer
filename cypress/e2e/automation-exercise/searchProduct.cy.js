// Test: Búsqueda de producto con Page Object Model
// Sitio bajo prueba: https://automationexercise.com

import ProductsPage from '../../pages/automation-exercise/ProductsPage'

describe('Search Product - Page Object Model', () => {

    // Instancia de la clase Page Object
    const productsPage = new ProductsPage()

    // Dato de prueba: producto a buscar
    const PRODUCT_TO_SEARCH = 'Blue Top'

    beforeEach(() => {
        // Navegar a la home antes de cada test usando el comando custom del proyecto
        cy.gotoAEUrl('/')
    })

    it('Debe buscar "Blue Top" y verificar que todos los resultados lo contienen', () => {

        // Paso 1: Hacer click en el botón "Products" del menú de navegación
        productsPage.clickAllProductsButton()

        // Paso 2: Verificar que la página "All Products" cargó correctamente
        productsPage.verifyAllProductsPage()

        // Paso 3: Buscar el producto por nombre
        productsPage.searchProduct(PRODUCT_TO_SEARCH)

        // Paso 4: Confirmar que el título cambió a "Searched Products"
        productsPage.verifySearchedProductsTitle()

        // Paso 5: Recorrer cada tarjeta de resultado y verificar
        // que su nombre contiene el texto buscado
        productsPage.verifyProductsContain(PRODUCT_TO_SEARCH)
    })
})
