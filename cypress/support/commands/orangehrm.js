// ─── OrangeHRM Commands ─────────────────────────────────────────────────────

import OrangeHRMLoginPage from '../../pages/orangehrm/OrangeHRMLoginPage'

Cypress.Commands.add("gotoOHUrl", (route) => {
   cy.visit(`https://opensource-demo.orangehrmlive.com${route}`, { timeout: 120000 })
})

// Login con el usuario Admin de la demo, hasta confirmar que el Dashboard
// esta visible. Reemplaza el bloque de login duplicado en el beforeEach de
// cada spec de la suite OrangeHRM.
Cypress.Commands.add("loginAsOHAdmin", () => {
   const loginPage = new OrangeHRMLoginPage()

   cy.gotoOHUrl('/web/index.php/auth/login')
   loginPage.enterCredentials('Admin', 'admin123')
   loginPage.clickLoginButton()
   loginPage.verifyDashboardVisible()
})
