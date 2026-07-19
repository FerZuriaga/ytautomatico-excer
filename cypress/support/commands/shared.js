// Comandos genericos, sin dependencia de ninguna aplicacion especifica.
// Reutilizables por cualquier proyecto que se agregue a la suite.

Cypress.Commands.add("randomNum", (number) => {
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
