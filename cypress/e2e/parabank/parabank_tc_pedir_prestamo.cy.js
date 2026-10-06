// Modulo: Banca - Pedir un préstamo
// Sitio bajo prueba: https://parabank.parasoft.com/parabank (ParaBank, demo de Parasoft)
// Ticket Jira: SCRUM-940 (CA-26..CA-27, Test Cycle SCRUM-941)
//
// Cada test registra su cliente con la sesión iniciada (una cuenta con
// $515.50): un préstamo aprobado crea una cuenta nueva. La aprobación
// depende de la configuración de préstamos de la demo (hoy por fondos
// disponibles); $1000 queda lejos del límite.

import ParabankLoanPage from '../../pages/parabank/ParabankLoanPage'
import ParabankOverviewPage from '../../pages/parabank/ParabankOverviewPage'

const loan = new ParabankLoanPage()
const overview = new ParabankOverviewPage()

// Pasos 1 a 4: abrir "Request Loan", monto, pie y préstamo aprobado.
// Devuelve { from, loanAccount }.
const requestApproved = (amount, downPayment) => {
    cy.pbRegisterCustomer({ keepSession: true })
    loan.open()
    loan.type('amount', amount)
    loan.type('downPayment', downPayment)
    return loan.fromAccount().then(from => {
        loan.submit()
        return loan.verifyApproved().then(loanAccount => ({ from, loanAccount }))
    })
}

describe('[SCRUM-940] ParaBank - Pedir un préstamo', () => {

    // CA-26: Al pedir un préstamo que los fondos respaldan, con un pie cubierto por el saldo, se aprueba con "Approved".

    it('[CA-26][TC-26.1][SCRUM-942] Pedir un préstamo con pie', () => {
        requestApproved('1000', '100')
    })

    it('[CA-26][TC-26.2][SCRUM-943] Pedir un préstamo sin pie', () => {
        requestApproved('1000', '0')
    })

    it('[CA-26][TC-26.3][SCRUM-944] Pedir un préstamo con un pie igual al saldo', () => {
        requestApproved('1000', '515.50')
    })

    // CA-27: Al aprobarse un préstamo, el pie se descuenta de la cuenta de origen y la cuenta del préstamo aparece en "Accounts Overview".

    it('[CA-27][TC-27.1][SCRUM-945] El resumen refleja un préstamo con pie', () => {
        requestApproved('1000', '100').then(({ from, loanAccount }) => {
            overview.verifyAccounts({ [from]: '$415.50', [loanAccount]: '$1000.00' }, 2)
        })
    })

    it('[CA-27][TC-27.2][SCRUM-946] El resumen refleja un préstamo sin pie', () => {
        requestApproved('1000', '0').then(({ from, loanAccount }) => {
            overview.verifyAccounts({ [from]: '$515.50', [loanAccount]: '$1000.00' }, 2)
        })
    })
})
