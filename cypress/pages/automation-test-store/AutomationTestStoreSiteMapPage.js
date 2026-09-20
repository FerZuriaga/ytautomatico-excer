class AutomationTestStoreSiteMapPage {

    get pageTitle() { return cy.get('h1.heading1 .maintext') }
    get categoriesColumn() { return cy.get('.contentpanel .col-md-6.pull-left').first() }
    get generalColumn() { return cy.get('.contentpanel .col-md-6.pull-left').last() }
    get makeupCategoryLink() { return cy.contains('.contentpanel a', 'Makeup') }
    get specialOffersLink() { return cy.contains('.contentpanel a', 'Special Offers') }

    visit() {
        cy.gotoATSUrl('/index.php?rt=content/sitemap')
    }
}

export default AutomationTestStoreSiteMapPage
