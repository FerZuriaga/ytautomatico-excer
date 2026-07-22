// ─── SauceDemo Commands ─────────────────────────────────────────────────────

import SauceDemoLoginPage from '../../pages/saucedemo/SauceDemoLoginPage'

Cypress.Commands.add("gotoSDUrl", (route) => {
   cy.visit(`https://www.saucedemo.com${route}`, { timeout: 120000 })
})

// Login con el usuario estandar de la demo, hasta confirmar que el
// inventario esta visible. Reemplaza el bloque de login duplicado en el
// beforeEach de cada spec de la suite SauceDemo que requiera sesion iniciada.
Cypress.Commands.add("loginAsSDStandardUser", () => {
   const loginPage = new SauceDemoLoginPage()

   cy.gotoSDUrl('/')
   loginPage.enterCredentials('standard_user', 'secret_sauce')
   loginPage.clickLoginButton()
   loginPage.verifyInventoryVisible()
})
