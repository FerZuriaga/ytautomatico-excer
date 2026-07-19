// ─── AutomationExercise Commands ───────────────────────────────────────────

Cypress.Commands.add("gotoAEUrl", (route) => {
    cy.visit(`https://automationexercise.com${route}`, { timeout: 120000 })

})

Cypress.Commands.add("validateAEUrl", (route) => {
    cy.location("pathname").should("contain", `${route}`)

})

Cypress.Commands.add("allProducts", () => {
    cy.get("h2.title").should("exist").and("have.text", "All Products")
    cy.get(".product-image-wrapper").its("length").should("be.gt", 0)

})
