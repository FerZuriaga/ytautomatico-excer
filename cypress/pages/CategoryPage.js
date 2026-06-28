// Page Object Model - CategoryPage
// Encapsula selectores y acciones del sidebar de categorías de automationexercise.com

class CategoryPage {

    // ─── Selectores — Sidebar ─────────────────────────────────────────────────

    get categoriesSidebar() {
        return cy.get('#accordian')
    }

    getCategoryHeader(categoryName) {
        return cy.get(`#accordian a[href="#${categoryName}"]`)
    }

    get categoryPageTitle() {
        return cy.get('h2.title')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    verifyCategoriesSidebarVisible() {
        this.categoriesSidebar.should('be.visible')
    }

    clickCategory(categoryName) {
        this.getCategoryHeader(categoryName).should('be.visible').click()
    }

    clickSubCategory(subCategoryName) {
        cy.contains('#accordian .panel-body a', subCategoryName)
            .should('be.visible')
            .click()
    }

    verifyCategoryPageTitle(expectedText) {
        this.categoryPageTitle
            .should('be.visible')
            .and('contain.text', expectedText)
    }
}

export default CategoryPage
