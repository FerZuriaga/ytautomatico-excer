const FIXTURE = 'selectors/parabank/resumen.json'
const ACCOUNT_FIXTURE = 'selectors/parabank/cuenta.json'

const T = { timeout: 15000 }

// Mes del banco (UTC, la fecha de los movimientos) como posición en
// "Activity Period" (0 = All). La posición no depende del idioma.
const currentMonth = () => new Date().getUTCMonth() + 1
const otherMonth = () => ((currentMonth() + 5) % 12) + 1

// "Account Details" + "Account Activity" de una cuenta (activity.htm). Sin
// entrada en el menú: se llega desde el número de cuenta del resumen.
class ParabankActivityPage {

    // Antes de abrir la pantalla: fija el idioma con el que se pide al
    // servidor (traduce los meses; un clic y cy.visit mandan idiomas
    // distintos) y espera los movimientos de cada consulta.
    prepare(language = 'en-US') {
        cy.fixture(FIXTURE).then(sel => {
            cy.intercept('GET', sel.pageRequest, req => { req.headers['accept-language'] = language })
            cy.intercept('GET', sel.transactionsRequest).as('transactions')
        })
    }

    // Clic en el número de la cuenta en "Accounts Overview" (ya abierto).
    openFromOverview(accountId) {
        cy.fixture(ACCOUNT_FIXTURE).then(account => {
            cy.contains(account.overview.row, String(accountId)).find('a').click()
        })
        this.verifyShown(accountId)
    }

    // Cambiar el número de cuenta en la dirección del navegador.
    openByAddress(accountId) {
        cy.fixture(FIXTURE).then(sel => cy.gotoParabankUrl(`${sel.page}?id=${accountId}`))
    }

    // "Account Details" de esa cuenta, con sus movimientos ya cargados.
    verifyShown(accountId) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.details.title, T).should('be.visible').and('have.text', sel.texts.details)
            cy.get(sel.details.accountId, T).should('have.text', String(accountId))
            cy.wait('@transactions')
        })
    }

    // "Balance:" y, si se pasa, "Available:".
    verifyBalance(balance, available) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.details.balance, T).should('have.text', balance)
            if (available) cy.get(sel.details.available).should('have.text', available)
        })
    }

    // "Account Type:" ("CHECKING" o "SAVINGS").
    verifyType(type) {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.details.accountType, T).should('have.text', type))
    }

    // Ni el saldo ni los movimientos de la cuenta.
    verifyNotShown() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.details.balance).should('not.be.visible')
            cy.get(sel.activity.rows).should('not.be.visible')
        })
    }

    // [{ description, amount, type: 'Debit' | 'Credit' }]: exactamente esos
    // movimientos, cada monto en su columna y la otra vacía.
    verifyMovements(movements) {
        cy.fixture(FIXTURE).then(sel => {
            const col = sel.activity.columns
            cy.get(sel.activity.rows, T).should('have.length', movements.length)
            movements.forEach(({ description, amount, type }) => {
                const [filled, empty] = type === 'Debit' ? [col.debit, col.credit] : [col.credit, col.debit]
                cy.get(sel.activity.rows).filter((i, row) => {
                    const cells = row.querySelectorAll('td')
                    return cells[col.description].textContent === description && cells[filled].textContent === amount
                }).should('have.length', 1).find('td').eq(empty).should('have.text', '')
            })
        })
    }

    verifyNoTransactions() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.activity.noTransactions, T).should('be.visible').and('have.text', sel.texts.noTransactions)
            cy.get(sel.activity.table).should('not.be.visible')
        })
    }

    // "All", "Credit" o "Debit".
    selectType(type) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.activity.type).select(type)
            cy.get(sel.activity.type).should('have.value', type)
        })
    }

    // "current" (el de los movimientos) u "other" (uno sin movimientos).
    selectMonth(which) {
        const index = which === 'current' ? currentMonth() : otherMonth()
        cy.fixture(FIXTURE).then(sel => {
            cy.get(`${sel.activity.month} option`).eq(index).then(option => {
                cy.get(sel.activity.month).select(option.val())
                cy.get(sel.activity.month).should('have.value', option.val())
            })
        })
    }

    go() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.activity.go).click()
            cy.wait('@transactions')
        })
    }
}

export default ParabankActivityPage
