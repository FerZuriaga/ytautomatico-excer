// Comandos de Restful Booker Platform (https://automationintesting.online).

// Errores de hidratación de React (#418, #423, #425): la app es Next.js con
// renderizado del servidor y, dentro de Cypress, el documento que hidrata
// React ya trae los scripts que inyecta Cypress, así que React avisa que el
// <html> no coincide y lo vuelve a renderizar del lado del cliente (visto en
// todas las pantallas el 2026-09-29, args "HTML"). Solo se ignoran esos: cualquier
// otra excepción de la app sigue haciendo fallar el test.
const HYDRATION_ERROR = /Minified React error #(418|423|425)\b/

// Navega a una ruta de la app. Con `token` la sesión de administrador queda
// iniciada desde la primera carga: el panel lee la cookie "token" (la misma
// que deja el login).
Cypress.Commands.add("gotoRestfulBookerPlatformUrl", (route, { token } = {}) => {
    cy.on('uncaught:exception', err => (HYDRATION_ERROR.test(err.message) ? false : undefined))
    const base = Cypress.env('restfulBookerPlatformUrl')
    if (token) cy.setCookie('token', token, { domain: new URL(base).hostname })
    cy.visit(`${base}${route}`)
})
