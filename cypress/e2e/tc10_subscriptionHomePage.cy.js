/**
 * Test Case 10 - Verify Subscription in home page
 * JIRA: SCRUM-5
 * Branch: feature/SCRUM-5-tc10-subscription-homepage
 *
 * Steps:
 * 1. Launch browser
 * 2. Navigate to url 'http://automationexercise.com'
 * 3. Verify that home page is visible successfully
 * 4. Scroll down to footer
 * 5. Verify text 'SUBSCRIPTION'
 * 6. Enter email address in input and click arrow button
 * 7. Verify success message 'You have been successfully subscribed!' is visible
 */

import HomePage from '../pages/HomePage'

describe('Test Case 10 - Verify Subscription in home page', () => {

    const homePage = new HomePage()

    const SUBSCRIBER_EMAIL = 'testuser@example.com'

    beforeEach(() => {
        // Step 1-3: Navigate to home page and verify it is visible
        cy.gotoAEUrl('/')
        homePage.verifyHomePageVisible()
    })

    it('Should subscribe successfully via the footer newsletter form', () => {

        // Step 4: Scroll down to footer
        homePage.scrollToFooter()

        // Step 5: Verify text 'SUBSCRIPTION' is visible
        homePage.verifySubscriptionTitle()

        // Step 6: Enter email address in input and click arrow button
        homePage.subscribeWithEmail(SUBSCRIBER_EMAIL)

        // Step 7: Verify success message is visible
        homePage.verifySubscriptionSuccess()
    })
})
