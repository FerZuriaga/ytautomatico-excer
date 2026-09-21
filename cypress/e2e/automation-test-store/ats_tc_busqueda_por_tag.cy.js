import AutomationTestStoreProductPage from '../../pages/automation-test-store/AutomationTestStoreProductPage'
import AutomationTestStoreSearchPage from '../../pages/automation-test-store/AutomationTestStoreSearchPage'

const productPage = new AutomationTestStoreProductPage()
const searchPage = new AutomationTestStoreSearchPage()

const PRODUCT_WITH_TAGS_ID = 50
const PRODUCT_WITHOUT_TAGS_ID_1 = 52
const PRODUCT_WITHOUT_TAGS_ID_2 = 65

describe('Automation Test Store - Buscar productos mediante un tag del producto', () => {

    it('[CA-01][TC-01.1][SCRUM-283] hacer clic en el tag "cheeks" navega a los resultados reales de busqueda', () => {
        productPage.visit(PRODUCT_WITH_TAGS_ID)
        productPage.openTab('tags')
        productPage.tagsList.should('have.length', 2)

        productPage.clickTag('cheeks')

        searchPage.resultItems.should('have.length.greaterThan', 0)
        cy.url().should('include', 'rt=product/search').and('include', 'keyword=cheeks')
    })

    it('[CA-01][TC-01.2][SCRUM-284] hacer clic en el tag "makeup" navega a resultados distintos de los de "cheeks"', () => {
        productPage.visit(PRODUCT_WITH_TAGS_ID)
        productPage.openTab('tags')

        productPage.clickTag('makeup')

        searchPage.resultItems.should('have.length.greaterThan', 0)
        cy.url().should('include', 'rt=product/search').and('include', 'keyword=makeup')
    })

    it('[CA-02][TC-02.1][SCRUM-285] un producto sin tags no muestra la pestaña Tags', () => {
        productPage.visit(PRODUCT_WITHOUT_TAGS_ID_1)

        productPage.availableTabs.should('have.length', 2)
        productPage.tagsTabLink.should('not.exist')
    })

    it('[CA-02][TC-02.2][SCRUM-286] un segundo producto sin tags confirma que no es un caso aislado', () => {
        productPage.visit(PRODUCT_WITHOUT_TAGS_ID_2)

        productPage.availableTabs.should('have.length', 2)
        productPage.tagsTabLink.should('not.exist')
    })
})
