// Comandos genericos, sin dependencia de ninguna aplicacion especifica.
// Reutilizables por cualquier proyecto que se agregue a la suite.
//
// El reconocimiento de pantallas ya no vive aca: cy.reconPage y
// cy.reconSubmit se eliminaron (CLAUDE.md) y la exploracion con navegador
// es solo v3/scripts/explore-page.js en el PASO 1.

Cypress.Commands.add("randomNum", (number) => {
   let randomNum = Math.floor(Math.random() * number)
   return randomNum

})
