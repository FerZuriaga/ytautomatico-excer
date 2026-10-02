// Comandos de Expand Testing - Notes App (https://practice.expandtesting.com/notes/app).

// Publicidad y analítica de Google que la app carga en todas las pantallas
// y no necesita para funcionar: un anuncio de video empujó el formulario de
// registro y SCRUM-832 pasó recién en el reintento (2026-10-02). Se bloquea
// solo en Notes (no en cypress.config.js): las otras apps no tienen
// publicidad relevada.
const AD_HOSTS = /(^|\.)(googlesyndication\.com|doubleclick\.net|2mdn\.net|adtrafficquality\.google|googleadservices\.com|google-analytics\.com|googletagmanager\.com)$|^(analytics|fundingchoicesmessages)\.google\.com$/

// Navega a una ruta de la app. Con `token` la sesion queda iniciada desde
// la primera carga: el front lee localStorage "token" (el mismo que guarda
// al hacer login).
Cypress.Commands.add("gotoNotesUrl", (route, { token } = {}) => {
    cy.intercept({ hostname: AD_HOSTS }, req => req.reply({ statusCode: 204, body: '' }))
    cy.visit(`${Cypress.env('expandtestingNotesUrl')}${route}`, {
        onBeforeLoad(win) {
            if (token) win.localStorage.setItem('token', token)
        }
    })
})
