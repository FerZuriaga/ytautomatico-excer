const FIXTURE = 'selectors/restful-booker-platform/reservas.json'

const T = { timeout: 15000 }

const JSON_HEADERS = { Accept: 'application/json' }

const fill = (template, values) => Object.entries(values).reduce((text, [key, value]) => text.replace(`{${key}}`, value), template)

// Fecha YYYY-MM-DD a `days` días de hoy (formato que usan la dirección y la
// confirmación).
export const dayFromToday = days => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    return date.toISOString().slice(0, 10)
}

// Rango de fechas futuras al azar para un test: la demo es compartida y una
// corrida anterior dejaría ocupadas las mismas fechas (se reinicia cada
// pocos minutos, no al instante).
export const randomFutureStay = (nights = 2) => {
    const start = 400 + Math.floor(Math.random() * 2500)
    return { checkin: dayFromToday(start), checkout: dayFromToday(start + nights), nights }
}

// Pantalla de una habitación: "Book This Room", calendario, formulario del
// huésped y resumen de precio. Las reglas de los datos las valida el
// servidor (400 con la lista de avisos).
class RoomBookingPage {

    // ─── Precondiciones por API ───────────────────────────────────────────────

    // Reserva de otro huésped para esas fechas (como la hace el sitio).
    bookByApi({ checkin, checkout }) {
        return cy.fixture(FIXTURE).then(sel => cy.request({
            method: 'POST', url: `https://${sel.api.host}${sel.api.bookingPath}`, headers: JSON_HEADERS,
            body: {
                roomid: sel.room.id, firstname: 'Qa Previa', lastname: 'Tester', depositpaid: false,
                email: 'qa.previa@example.com', phone: '01234567890', bookingdates: { checkin, checkout }
            }
        }).its('status').should('eq', 201))
    }

    // ─── Pantalla ─────────────────────────────────────────────────────────────

    // Abre la habitación con las fechas. Espera la disponibilidad de la
    // habitación (la pide la pantalla ya montada): un clic durante la
    // re-hidratación de Next.js se pierde (ver docs/discovery).
    open({ checkin, checkout, nights }) {
        cy.fixture(FIXTURE).then(sel => {
            cy.intercept({ method: 'POST', hostname: sel.api.host, pathname: sel.api.bookingPath }).as('booking')
            cy.intercept({ method: 'GET', hostname: sel.api.host, pathname: `${sel.api.roomReportPath}${sel.room.id}` }).as('roomReport')
            cy.gotoRestfulBookerPlatformUrl(fill(sel.paths.room, { roomId: sel.room.id, checkin, checkout }))
            cy.wait('@roomReport', T)
            cy.contains(sel.texts.bookThisRoom, T).should('be.visible')
            cy.contains(sel.texts.perNight).should('be.visible')
            cy.contains(fill(sel.texts.nights, { price: sel.room.price, nights })).should('be.visible')
            this.reserveButton(sel).should('be.visible')
        })
    }

    reserveButton(sel) {
        return cy.contains(sel.form.button, sel.texts.reserveNow)
    }

    openForm() {
        cy.fixture(FIXTURE).then(sel => {
            this.reserveButton(sel).click()
            ;['firstname', 'lastname', 'email', 'phone'].forEach(field => cy.get(sel.form[field], T).should('be.visible'))
            cy.contains(sel.form.button, sel.texts.cancel).should('be.visible')
        })
    }

    // Resumen: precio x noches + limpieza + servicio.
    verifyPriceSummary(nights) {
        cy.fixture(FIXTURE).then(sel => {
            const stay = sel.room.price * nights
            cy.contains(sel.texts.priceSummary).parent().within(() => {
                cy.contains(fill(sel.texts.nights, { price: sel.room.price, nights })).next().should('have.text', `£${stay}`)
                cy.contains(sel.texts.cleaningFee).next().should('have.text', `£${sel.fees.cleaning}`)
                cy.contains(sel.texts.serviceFee).next().should('have.text', `£${sel.fees.service}`)
                cy.contains(sel.texts.total).next().should('have.text', `£${stay + sel.fees.cleaning + sel.fees.service}`)
            })
        })
    }

    // Solo completa lo indicado: un campo sin valor queda vacío.
    fillGuest(data) {
        cy.fixture(FIXTURE).then(sel => {
            Object.entries(data).forEach(([field, value]) => {
                if (!value) return
                cy.get(sel.form[field]).type(value, { delay: 0 })
                cy.get(sel.form[field]).should('have.value', value)
            })
        })
    }

    submit() {
        cy.fixture(FIXTURE).then(sel => this.reserveButton(sel).click())
    }

    cancel() {
        cy.fixture(FIXTURE).then(sel => {
            cy.contains(sel.form.button, sel.texts.cancel).click()
            cy.get(sel.form.firstname).should('not.exist')
            this.reserveButton(sel).should('be.visible')
            cy.get('@booking.all').should('have.length', 0)
        })
    }

    verifyConfirmed({ checkin, checkout }) {
        cy.fixture(FIXTURE).then(sel => {
            cy.wait('@booking', T).its('response.statusCode').should('eq', 201)
            cy.contains(sel.texts.confirmed, T).should('be.visible')
            cy.contains(sel.texts.confirmedDates).should('be.visible')
            cy.contains(`${checkin} - ${checkout}`).should('be.visible')
        })
    }

    // Rechazo del servidor (400): la alerta muestra exactamente los avisos que
    // devolvió el servicio, y entre ellos los esperados (por significado).
    // La reserva no se confirma y el formulario sigue visible.
    verifyRejected(expected) {
        cy.fixture(FIXTURE).then(sel => {
            cy.wait('@booking', T).then(({ response }) => {
                expect(response.statusCode, 'reserva rechazada').to.eq(400)
                const notices = response.body.errors
                expect(notices, 'avisos del servicio').to.be.an('array').and.not.be.empty
                expected.forEach(pattern => expect(notices.some(n => pattern.test(n)), `aviso ${pattern}`).to.eq(true))
                cy.get(sel.form.errors).should('have.length', notices.length)
                    .then($items => expect([...$items].map(li => li.innerText.trim())).to.have.members(notices))
            })
            cy.contains(sel.texts.confirmed).should('not.exist')
            cy.get(sel.form.firstname).should('be.visible')
        })
    }

    // Fechas no disponibles: la reserva no se hace y el huésped sigue en la
    // pantalla de la habitación con un aviso (hoy la página se rompe: SCRUM-714;
    // las fechas pasadas se confirman: SCRUM-715).
    verifyNotAvailable() {
        cy.fixture(FIXTURE).then(sel => {
            cy.wait('@booking', T).its('response.statusCode').should('be.within', 400, 499)
            cy.contains(sel.texts.confirmed).should('not.exist')
            cy.get(sel.form.firstname).should('be.visible')
            cy.get('.alert-danger', T).should('be.visible')
        })
    }
}

export default RoomBookingPage
