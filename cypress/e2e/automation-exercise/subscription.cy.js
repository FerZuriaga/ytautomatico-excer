import HomePage from '../../pages/automation-exercise/HomePage'

describe('Test Case 10 - Verify Subscription in home page', () => {

    const homePage = new HomePage()

    beforeEach(() => {
        cy.gotoAEUrl('/')
    })

    it('Debe verificar la suscripción exitosa desde el footer de la home', () => {

        homePage.verifyHomePageVisible()

        homePage.scrollToFooter()

        homePage.verifySubscriptionTitle()

        homePage.subscribeWithEmail('testuser@example.com')

        homePage.verifySubscriptionSuccess()
    })
})
