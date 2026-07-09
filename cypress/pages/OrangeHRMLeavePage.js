// Page Object Model - OrangeHRMLeavePage
// Encapsula selectores y acciones del modulo Leave de OrangeHRM:
// - "Apply" (formulario de solicitud de permiso)
// - "My Leave" (listado de solicitudes propias)

class OrangeHRMLeavePage {

    // ─── Selectores - Navegacion ─────────────────────────────────────────────

    get leaveMenuLink() {
        return cy.get('.oxd-main-menu-item--name').contains('Leave')
    }

    get applyTabLink() {
        return cy.get('.oxd-topbar-body-nav-tab-item, a.oxd-main-menu-item')
            .contains('Apply')
    }

    get myLeaveTabLink() {
        return cy.get('.oxd-topbar-body-nav-tab-item, a.oxd-main-menu-item')
            .contains('My Leave')
    }

    // ─── Selectores - Formulario Apply Leave ─────────────────────────────────

    get leaveTypeDropdown() {
        return cy.contains('label', 'Leave Type')
            .parents('.oxd-input-group')
            .find('.oxd-select-text')
    }

    get leaveTypeOptions() {
        return cy.get('.oxd-select-dropdown .oxd-select-option')
    }

    get fromDateInput() {
        return cy.contains('label', 'From Date')
            .parents('.oxd-input-group')
            .find('input')
    }

    get toDateInput() {
        return cy.contains('label', 'To Date')
            .parents('.oxd-input-group')
            .find('input')
    }

    get applyButton() {
        return cy.get('button[type="submit"]').contains('Apply')
    }

    get successToast() {
        return cy.get('.oxd-toast')
    }

    // ─── Selectores - My Leave ────────────────────────────────────────────────

    get myLeaveTable() {
        return cy.get('.oxd-table')
    }

    get myLeaveRows() {
        return cy.get('.oxd-table-body .oxd-table-row')
    }

    // ─── Acciones - Navegacion ────────────────────────────────────────────────

    // Navega al modulo Leave desde el menu principal
    navigateToLeave() {
        this.leaveMenuLink.should('be.visible').click()
    }

    // Navega a la pestana "Apply" dentro del modulo Leave
    navigateToApplyTab() {
        this.applyTabLink.should('be.visible').click()
    }

    // Navega a la pestana "My Leave" dentro del modulo Leave
    navigateToMyLeave() {
        this.myLeaveTabLink.should('be.visible').click()
    }

    // Verifica que el formulario de Apply Leave este visible
    verifyApplyFormVisible() {
        cy.location('pathname', { timeout: 30000 }).should('contain', '/leave/applyLeave')
        this.leaveTypeDropdown.should('be.visible')
        this.fromDateInput.should('be.visible')
        this.toDateInput.should('be.visible')
    }

    // ─── Acciones - Formulario Apply Leave ───────────────────────────────────

    // Abre el dropdown "Leave Type" y selecciona la primera opcion disponible
    // (no vacia). Devuelve (via .then) el texto del tipo de permiso seleccionado
    // para poder validarlo luego en "My Leave". Se selecciona dinamicamente en
    // lugar de un valor fijo porque el entorno demo publico y compartido puede
    // tener distintos tipos de permiso disponibles/con saldo en cada ejecucion.
    selectAvailableLeaveType() {
        this.leaveTypeDropdown.should('be.visible').click()

        return this.leaveTypeOptions.should('have.length.greaterThan', 0).then(($options) => {
            const validOption = Array.from($options)
                .map((el) => Cypress.$(el).text().trim())
                .find((text) => text.length > 0 && text !== '-')

            expect(validOption, 'Existe al menos un tipo de permiso disponible para seleccionar').to.exist

            cy.wrap($options).contains(validOption).click()

            return cy.wrap(validOption)
        })
    }

    // Calcula un rango de fechas futuras dinamico (relativo a la fecha de
    // ejecucion) para minimizar colisiones con solicitudes de otros usuarios
    // en el entorno demo publico compartido. Devuelve fechas en formato
    // yyyy-MM-dd, que es el formato por defecto que acepta el input de OrangeHRM.
    _getFutureDateRange(daysFromToday = 10, durationDays = 1) {
        const formatDate = (date) => {
            const yyyy = date.getFullYear()
            const mm = String(date.getMonth() + 1).padStart(2, '0')
            const dd = String(date.getDate()).padStart(2, '0')
            return `${yyyy}-${mm}-${dd}`
        }

        const fromDate = new Date()
        fromDate.setDate(fromDate.getDate() + daysFromToday)

        const toDate = new Date(fromDate)
        toDate.setDate(toDate.getDate() + durationDays)

        return {
            fromDate: formatDate(fromDate),
            toDate: formatDate(toDate)
        }
    }

    // Ingresa la fecha de inicio y fin del permiso. Limpia el input antes de
    // escribir y cierra el datepicker emergente presionando escape para que
    // no tape otros campos ni el boton de envio.
    enterDates(fromDate, toDate) {
        this.fromDateInput.should('be.visible').clear().type(fromDate).type('{esc}')
        this.toDateInput.should('be.visible').clear().type(toDate).type('{esc}')
    }

    // Envia la solicitud de permiso, sincronizando con la respuesta del backend
    // antes de continuar con las validaciones posteriores.
    submitApplyLeave() {
        cy.intercept('POST', '**/api/v2/leave/employees/**/leave-requests**').as('applyLeave')

        this.applyButton.should('be.visible').click()

        cy.wait('@applyLeave', { timeout: 30000 })
    }

    // Verifica que el sistema muestre confirmacion de que la solicitud fue registrada
    verifyConfirmationVisible() {
        this.successToast.should('be.visible')
    }

    // ─── Acciones - My Leave ──────────────────────────────────────────────────

    // Verifica que el listado "My Leave" este visible
    verifyMyLeaveListVisible() {
        cy.location('pathname', { timeout: 30000 }).should('contain', '/leave/viewMyLeaveList')
        this.myLeaveTable.should('be.visible')
    }

    // Verifica que exista una solicitud en "My Leave" que coincida con el tipo
    // de permiso indicado y cuyo estado sea "Pending Approval"
    verifyLeaveRequestPending(leaveTypeText) {
        this.myLeaveRows.should('have.length.greaterThan', 0)

        cy.contains('.oxd-table-body .oxd-table-row', leaveTypeText, { timeout: 30000 })
            .should('be.visible')
            .within(() => {
                cy.contains('Pending Approval').should('be.visible')
            })
    }
}

export default OrangeHRMLeavePage
