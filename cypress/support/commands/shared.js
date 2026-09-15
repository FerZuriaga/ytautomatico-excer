// Comandos genericos, sin dependencia de ninguna aplicacion especifica.
// Reutilizables por cualquier proyecto que se agregue a la suite.

// Reconocimiento tecnico de una pagina: navega a `url` (debe ser absoluta,
// con dominio incluido -- este comando es generico y no conoce el baseUrl
// de ninguna app en particular) y vuelca forms/campos/botones/links/
// mensajes visibles a un objeto plano. Si la pagina requiere sesion
// iniciada, loguearse antes con el mecanismo propio de esa app. Pensado
// para explorar pantallas reales antes de escribir un Page Object, en vez
// de escribir specs de debug descartables desde cero cada vez. No
// reemplaza la corrida real de un Test Case: solo acelera saber que
// selectores/estructura existen antes de escribirlo.
Cypress.Commands.add("reconPage", (label, url) => {
   cy.visit(url, { timeout: 120000 })
   return cy.get('body').then($body => {
      const forms = [...$body.find('form')].map(f => ({
         id: f.id || null,
         action: f.action || null,
         method: f.method || null,
         fields: [...f.querySelectorAll('input, select, textarea')].map(el => ({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            name: el.name || null,
            type: el.type || null,
            placeholder: el.placeholder || null
         }))
      }))

      const buttons = [...$body.find('button, input[type="submit"]')]
         .map(b => ({ id: b.id || null, text: (b.innerText || b.value || '').trim().slice(0, 60) }))
         .filter(b => b.text)

      const links = [...$body.find('a')]
         .map(a => ({ text: a.innerText.trim().slice(0, 60), href: a.href }))
         .filter(l => l.text)
         .filter((l, i, arr) => arr.findIndex(x => x.text === l.text && x.href === l.href) === i)

      const heading = $body.find('h1').first().text().trim()
      const visibleMessages = [...$body.find('.alert, .messages')]
         .map(m => m.innerText.trim()).filter(t => t && t.length < 300).slice(0, 5)

      return { label, url, heading, forms, buttons, links, visibleMessages }
   })
})

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
