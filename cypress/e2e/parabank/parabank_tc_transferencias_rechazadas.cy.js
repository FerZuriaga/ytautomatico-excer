// Modulo: Banca - Transferencias que no se hacen
// Sitio bajo prueba: https://parabank.parasoft.com/parabank (ParaBank, demo de Parasoft)
// Ticket Jira: SCRUM-883 (CA-14..CA-16, Test Cycle SCRUM-884)
//
// Cada test registra su cliente con la sesión iniciada; salvo el de una
// sola cuenta, le abre una segunda por API: inicial $415.50, segunda $100.00.
// La app acepta casi todo lo que estas reglas rechazan: esos TC quedan en
// it.skip con su bug.

import ParabankTransferPage from '../../pages/parabank/ParabankTransferPage'

const transfer = new ParabankTransferPage()

const openWithTwoAccounts = () => cy.pbRegisterCustomer({ keepSession: true })
    .then(customer => cy.pbOpenSecondAccount(customer))
    .then(accounts => {
        transfer.open(2)
        return cy.wrap(accounts)
    })

// Monto (si hay), segunda cuenta como destino, "Transfer" no confirmado y
// saldos sin cambios en "Accounts Overview".
const rejectedToSecond = (accounts, amount) => {
    if (amount) transfer.typeAmount(amount)
    transfer.selectTo(accounts.second)
    transfer.submit()
    transfer.verifyNotComplete()
    transfer.openOverview()
    transfer.verifyBalances({ [accounts.initial]: '$415.50', [accounts.second]: '$100.00' })
}

describe('[SCRUM-883] ParaBank - Transferencias que no se hacen', () => {

    // CA-14: Al transferir, un monto que no es un importe mayor a cero con hasta dos decimales se rechaza y los saldos quedan como estaban.

    it('[CA-14][TC-14.1][SCRUM-885] Transferir sin monto', () => {
        openWithTwoAccounts().then(accounts => rejectedToSecond(accounts, null))
    })

    it('[CA-14][TC-14.2][SCRUM-886] Transferir un monto con letras', () => {
        openWithTwoAccounts().then(accounts => rejectedToSecond(accounts, 'abc'))
    })

    it.skip('[CA-14][TC-14.3][SCRUM-887] Transferir un monto de cero (bug conocido: SCRUM-897)', () => {
        openWithTwoAccounts().then(accounts => rejectedToSecond(accounts, '0'))
    })

    it.skip('[CA-14][TC-14.4][SCRUM-888] Transferir un monto negativo (bug conocido: SCRUM-896)', () => {
        openWithTwoAccounts().then(accounts => rejectedToSecond(accounts, '-50'))
    })

    it.skip('[CA-14][TC-14.5][SCRUM-889] Transferir un monto con tres decimales (bug conocido: SCRUM-894)', () => {
        openWithTwoAccounts().then(accounts => rejectedToSecond(accounts, '10.555'))
    })

    // CA-15: Al transferir, un monto mayor al saldo de la cuenta de origen se rechaza y los saldos quedan como estaban.

    it.skip('[CA-15][TC-15.1][SCRUM-890] Transferir más que el saldo de la cuenta de origen (bug conocido: SCRUM-895)', () => {
        openWithTwoAccounts().then(accounts => rejectedToSecond(accounts, '5000'))
    })

    it.skip('[CA-15][TC-15.2][SCRUM-891] Transferir el saldo más un centavo (bug conocido: SCRUM-895)', () => {
        openWithTwoAccounts().then(accounts => rejectedToSecond(accounts, '415.51'))
    })

    // CA-16: Al transferir, una misma cuenta como origen y destino se rechaza sin mostrar "Transfer Complete!".

    it.skip('[CA-16][TC-16.1][SCRUM-892] Transferir a la misma cuenta de origen (bug conocido: SCRUM-898)', () => {
        openWithTwoAccounts().then(() => {
            transfer.typeAmount('5')
            transfer.submit()
            transfer.verifyNotComplete()
        })
    })

    it.skip('[CA-16][TC-16.2][SCRUM-893] Transferir con una sola cuenta (bug conocido: SCRUM-898)', () => {
        cy.pbRegisterCustomer({ keepSession: true })
        transfer.open(1)
        transfer.typeAmount('5')
        transfer.submit()
        transfer.verifyNotComplete()
    })
})
