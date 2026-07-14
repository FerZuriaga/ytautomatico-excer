// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

import OrangeHRMLoginPage from '../pages/OrangeHRMLoginPage'

//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
 Cypress.Commands.add("gotoAEUrl", (route) =>{
    cy.visit(`https://automationexercise.com${route}`, { timeout: 120000 })

 })

 Cypress.Commands.add("validateAEUrl", (route) =>{
    cy.location("pathname").should("contain", `${route}`)

 })

  Cypress.Commands.add("allProducts", () =>{
    cy.get("h2.title").should("exist").and("have.text", "All Products")
        cy.get(".product-image-wrapper").its("length").should("be.gt", 0)

 })

  Cypress.Commands.add("randomNum", (number) =>{
   let randomNum = Math.floor(Math.random() * number)
   return randomNum
    
 })

Cypress.Commands.add("twoRandomNum", (number) => {
   let randomNum1 = Math.floor(Math.random() * number)
   let randomNum2 = Math.floor(Math.random() * number)
   do {
      randomNum2 = Math.floor(Math.random() * number)
   } while (randomNum1 === randomNum2)
   return { randomNum1, randomNum2 }


})

// ─── BlazeDemo Commands ───────────────────────────────────────────────────────

Cypress.Commands.add("gotoBDUrl", (route) => {
   cy.visit(`https://blazedemo.com${route}`, { timeout: 120000 })
})

// ─── OrangeHRM Commands ───────────────────────────────────────────────────────

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
