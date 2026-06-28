// Test Case 18 - View Category Products
// Sitio bajo prueba: https://automationexercise.com
// Ticket Jira: SCRUM-36

import CategoryPage from '../pages/CategoryPage'
import HomePage from '../pages/HomePage'

describe('[SCRUM-36] TC18 - View Category Products', () => {

    const homePage = new HomePage()
    const categoryPage = new CategoryPage()

    const CATEGORIES = {
        women: 'Women',
        womenSub: 'Dress',
        men: 'Men',
        menSub: 'Tshirts'
    }

    beforeEach(() => {
        cy.intercept({ resourceType: /fetch/ }, { log: false })
        cy.gotoAEUrl('/')
    })

    it('Debe navegar por categorías Women y Men y verificar las páginas de productos', () => {

        // Paso 3: Verificar que la home page y el sidebar de categorías son visibles
        homePage.verifyHomePageVisible()
        categoryPage.verifyCategoriesSidebarVisible()

        // Paso 4: Click en categoría Women
        categoryPage.clickCategory(CATEGORIES.women)

        // Paso 5: Click en sub-categoría Dress
        categoryPage.clickSubCategory(CATEGORIES.womenSub)

        // Paso 6: Verificar página de categoría Women - Dress
        cy.validateAEUrl('/category_products/')
        categoryPage.verifyCategoryPageTitle('Women - Dress Products')

        // Paso 7: Expandir categoría Men y click en sub-categoría Tshirts
        categoryPage.clickCategory(CATEGORIES.men)
        categoryPage.clickSubCategory(CATEGORIES.menSub)

        // Paso 8: Verificar navegación a página de categoría Men
        cy.validateAEUrl('/category_products/')
        categoryPage.verifyCategoryPageTitle('Men - Tshirts Products')
    })
})
