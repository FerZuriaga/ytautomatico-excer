// Page Object Model - OrangeHRMTimePage
// Encapsula selectores y acciones del modulo Time > Attendance de OrangeHRM:
// - "Punch In/Out" (registro de entrada/salida del usuario logueado)
// - "My Records" (historial de registros de asistencia)

class OrangeHRMTimePage {

    // ─── Selectores - Navegacion ─────────────────────────────────────────────

    get timeMenuLink() {
        return cy.get('.oxd-main-menu-item--name').contains('Time')
    }

    get attendanceTabLink() {
        return cy.contains('.oxd-topbar-body-nav-tab-item, a.oxd-main-menu-item', 'Attendance')
    }

    get punchInOutMenuOption() {
        return cy.contains('Punch In/Out')
    }

    get myRecordsMenuOption() {
        return cy.contains('My Records')
    }

    // ─── Selectores - Punch In/Out ────────────────────────────────────────────

    get punchSubmitButton() {
        return cy.get('button[type="submit"]')
    }

    get punchDateInput() {
        return cy.contains('label', 'Date')
            .parents('.oxd-input-group')
            .find('input')
    }

    get punchTimeInput() {
        return cy.contains('label', 'Time')
            .parents('.oxd-input-group')
            .find('input')
    }

    get punchNoteInput() {
        return cy.contains('label', 'Note')
            .parents('.oxd-input-group')
            .find('textarea')
    }

    // ─── Selectores - My Records ──────────────────────────────────────────────

    get myRecordsRows() {
        return cy.get('.oxd-table-body .oxd-table-row')
    }

    // ─── Acciones - Navegacion ────────────────────────────────────────────────

    // Navega a Time > Attendance > Punch In/Out. Entra siempre desde el menu
    // principal (no asume que el caller ya este en el modulo Time), para que
    // este metodo sea invocable de forma independiente.
    navigateToPunchInOut() {
        this.timeMenuLink.should('be.visible').click()
        this.attendanceTabLink.should('be.visible').click()
        this.punchInOutMenuOption.should('be.visible').click()
        cy.location('pathname', { timeout: 15000 }).should('contain', 'punch')
    }

    // Navega a Time > Attendance > My Records
    navigateToMyRecords() {
        this.timeMenuLink.should('be.visible').click()
        this.attendanceTabLink.should('be.visible').click()
        this.myRecordsMenuOption.should('be.visible').click()
        cy.location('pathname', { timeout: 15000 }).should('contain', 'viewMyAttendanceRecord')
    }

    // ─── Acciones - Punch In/Out ──────────────────────────────────────────────

    // Devuelve (via .then) el estado actual del formulario ("In" si no hay
    // marca de entrada abierta, "Out" si ya la hay), leyendo el texto del
    // boton de accion en vez de asumir un estado fijo: la cuenta admin del
    // entorno demo publico y compartido puede quedar con una marca abierta
    // de una corrida anterior propia o de otro usuario.
    getPunchState() {
        return this.punchSubmitButton.should('be.visible').invoke('text').then((text) => text.trim())
    }

    // Confirma el registro (Entrada o Salida, segun el estado actual) sin
    // modificar la fecha/hora sugerida por el sistema. Espera de forma
    // dinamica a que el texto del boton cambie respecto al estado previo
    // (In->Out o Out->In) en lugar de interceptar el endpoint real: el
    // formulario re-renderiza el boton recien despues de que el backend
    // confirma el registro, asi que ese cambio es una senal fiable sin
    // depender de conocer la URL exacta del PUT.
    // El toast de confirmacion se verifica primero, inmediatamente despues
    // del click (aparece de inmediato pero se auto-cierra en pocos
    // segundos), y recien despues se espera el cambio de estado del boton
    // (que puede tardar mas, ya que el formulario se re-renderiza tras
    // consultar el estado real al backend). Verificar en el orden inverso
    // dejaba el toast ya cerrado para cuando se lo consultaba.
    confirmPunch() {
        this.getPunchState().then((stateBefore) => {
            this.punchSubmitButton.click()
            this.verifyPunchConfirmationVisible()
            cy.get('button[type="submit"]', { timeout: 15000 }).should(($btn) => {
                expect($btn.text().trim(), 'el boton cambia de estado tras confirmar').not.to.eq(stateBefore)
            })
        })
    }

    // Garantiza que el usuario no tenga una marca de entrada abierta antes de
    // un test de CA-01: si el formulario esta en estado "Out" (marca
    // abierta, residuo de una corrida anterior), la cierra primero.
    ensurePunchedOut() {
        this.navigateToPunchInOut()
        this.getPunchState().then((state) => {
            if (state === 'Out') {
                this.confirmPunch()
            }
        })
    }

    // Garantiza que el usuario tenga una marca de entrada abierta antes de un
    // test de CA-02/CA-03: si el formulario esta en estado "In" (sin marca
    // abierta), registra una entrada primero.
    ensurePunchedIn() {
        this.navigateToPunchInOut()
        this.getPunchState().then((state) => {
            if (state === 'In') {
                this.confirmPunch()
            }
        })
    }

    // Verifica que el formulario de Punch In/Out este mostrando el estado
    // esperado ("In" o "Out")
    verifyPunchState(expectedState) {
        this.getPunchState().should('eq', expectedState)
    }

    // Verifica que se muestre una confirmacion de registro exitoso
    verifyPunchConfirmationVisible() {
        cy.get('.oxd-toast, .oxd-alert').should('be.visible')
    }

    // ─── Acciones - My Records ────────────────────────────────────────────────

    // La celda de "Punch Out" trae siempre una etiqueta responsive oculta
    // ("Punch Out   GMT -00:00") aunque no haya hora cargada, por lo que
    // buscar texto vacio no sirve para distinguir una marca abierta de una
    // cerrada. En su lugar se busca un patron de hora real (ej. "05:47 PM").
    _cellHasTimeValue(cellText) {
        return /\d{1,2}:\d{2}\s*(AM|PM)/i.test(cellText)
    }

    // Verifica que la primera fila del historial (la mas reciente) tenga
    // hora de Entrada cargada y la celda de Salida sin hora (marca abierta)
    verifyLatestRecordIsOpen() {
        this.myRecordsRows.should('have.length.greaterThan', 0)
        this.myRecordsRows.first().within(() => {
            cy.get('.oxd-table-cell').eq(1).invoke('text').should((text) => {
                expect(this._cellHasTimeValue(text), 'la celda de Entrada tiene una hora cargada').to.be.true
            })
            cy.get('.oxd-table-cell').eq(3).invoke('text').should((text) => {
                expect(this._cellHasTimeValue(text), 'la celda de Salida no tiene una hora cargada').to.be.false
            })
        })
    }

    // Verifica que la primera fila del historial (la mas reciente) tenga
    // hora de Entrada Y de Salida cargadas (marca cerrada)
    verifyLatestRecordIsClosed() {
        this.myRecordsRows.should('have.length.greaterThan', 0)
        this.myRecordsRows.first().within(() => {
            cy.get('.oxd-table-cell').eq(1).invoke('text').should((text) => {
                expect(this._cellHasTimeValue(text), 'la celda de Entrada tiene una hora cargada').to.be.true
            })
            cy.get('.oxd-table-cell').eq(3).invoke('text').should((text) => {
                expect(this._cellHasTimeValue(text), 'la celda de Salida tiene una hora cargada').to.be.true
            })
        })
    }
}

export default OrangeHRMTimePage
