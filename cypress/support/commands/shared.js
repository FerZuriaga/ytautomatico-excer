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

// Reconocimiento de comportamiento dinamico: complementa a reconPage (que
// solo lee estructura estatica via GET) para el caso en que hace falta
// saber que responde un formulario al enviarlo -- mensajes de exito/error
// reales, no supuestos. Navega a `url` (absoluta, igual que reconPage),
// completa `fields` (mapa selector -> valor) detectando el tipo real de
// cada control -- texto/textarea: value es el string a tipear (vacio/
// undefined deja el campo vacio a proposito, para casos de campo
// obligatorio faltante); checkbox/radio: value es true/false (marcar/
// desmarcar; undefined = no tocarlo); select: value es la opcion a elegir
// por texto visible u value (vacio/undefined = no tocarlo, queda la
// opcion por defecto). Hace click en `submitSelector` (OBLIGATORIO: la
// pagina puede tener mas de un <form> -- ej. buscador, newsletter -- asi
// que adivinar un selector generico tipo 'form button[type="submit"]'
// matchea de mas; el llamador ya conoce el id exacto del form por
// reconPage, ej. '#forgottenFrm button[type="submit"]') y vuelca el
// resultado a un objeto plano. Generico y agnostico de aplicacion, igual
// que reconPage: no asume nombres de campos ni mensajes de ninguna app
// en particular.
//
// Limitacion conocida: no resuelve selects encadenados que dependen de
// AJAX (ej. Pais -> Provincia/Estado, donde las opciones del segundo
// select se repueblan recien despues de elegir el primero) -- para ese
// caso puntual seguir usando un metodo propio del Page Object con
// cy.intercept (ver AutomationTestStoreRegisterPage.selectCountry), este
// comando es para reconocimiento rapido, no reemplaza esa logica.
//
// Pensado para usarse junto a reconPage en un unico spec descartable que
// recorra TODA la matriz de escenarios (exito, cada campo vacio, variantes
// de formato, etc.) en una sola corrida de `cypress run` -- no un spec por
// escenario. Un formulario que hace submit real (no AJAX) recarga la
// pagina completa; Cypress espera esa recarga automaticamente al encadenar
// cy.get() despues del click, sin necesidad de cy.wait(ms) fijo.
//
// Convencion obligatoria para evitar 2 fuentes reales de perdida de tiempo
// ya repetidas en este proyecto (ver ats_recon_recuperar_login_name.cy.js):
// 1. UN it() POR ESCENARIO, nunca varias llamadas a reconSubmit anidadas
//    en el mismo it() -- si una falla, un solo it() con 4 llamadas no deja
//    saber cual sin releer stacks confusos. Aislar = diagnostico inmediato.
// 2. Para juntar los resultados de todos los it() en un unico archivo,
//    acumular en un objeto JS plano declarado en el describe() (persiste
//    entre it() de la misma corrida, sin volver a leer disco) y hacer un
//    unico cy.writeFile en un after() al final. NUNCA encadenar
//    cy.readFile().then(prev => cy.writeFile({...prev, ...})) entre
//    it() para "acumular" -- un archivo _recon_*.json viejo de una corrida
//    anterior con contenido parcial/corrupto rompe el readFile siguiente
//    en silencio. Si no hace falta un unico archivo consolidado, alternativa
//    valida y mas simple: un archivo _recon_<escenario>.json por it().
Cypress.Commands.add("reconSubmit", (label, url, fields, submitSelector, options = {}) => {
   const messageSelector = options.messageSelector || '.alert, .messages, .alert-danger, .alert-success, .text-danger, .text-success, .error'

   cy.visit(url, { timeout: 120000 })

   // Chequeo temprano: si la app redirige (ej. sesion activa que ya no
   // deja acceder a un formulario de "recuperar credencial"), fallar aca
   // con un mensaje claro de URL en vez de dejar que cy.get(selector) mas
   // abajo agote su timeout con un generico "elemento no encontrado" que
   // no dice por que. No aborta el reconocimiento: solo adelanta el
   // diagnostico real.
   cy.url({ timeout: 10000 }).should('include', url)

   Object.entries(fields).forEach(([selector, value]) => {
      cy.get(selector).then($el => {
         const tag = $el.prop('tagName').toLowerCase()
         const type = ($el.attr('type') || '').toLowerCase()

         if (tag === 'select') {
            if (value) cy.wrap($el).select(value)
         } else if (type === 'checkbox') {
            if (value === true) cy.wrap($el).check()
            else if (value === false) cy.wrap($el).uncheck()
         } else if (type === 'radio') {
            if (value === true) cy.wrap($el).check()
         } else {
            cy.wrap($el).clear()
            if (value) cy.wrap($el).type(value, { parseSpecialCharSequences: false })
         }
      })
   })

   cy.get(submitSelector).click()

   return cy.url().then(urlAfter => cy.get('body').then($body => ({
      label,
      url: urlAfter,
      heading: $body.find('h1').first().text().trim(),
      message: $body.find(messageSelector).first().text().trim()
   })))
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
