// Comandos de Expand Testing - Notes App (https://practice.expandtesting.com/notes/app).

// Navega a una ruta de la app. Con `token` la sesion queda iniciada desde
// la primera carga: el front lee localStorage "token" (el mismo que guarda
// al hacer login).
Cypress.Commands.add("gotoNotesUrl", (route, { token } = {}) => {
    cy.visit(`${Cypress.env('expandtestingNotesUrl')}${route}`, {
        onBeforeLoad(win) {
            if (token) win.localStorage.setItem('token', token)
        }
    })
})
