const FIXTURE = 'selectors/practicesoftwaretesting/alquileres.json'

const T = { timeout: 15000 }

const normalize = (text) => text.replace(/\s+/g, ' ').trim()

// Sección Rentals (se entra desde el menú Categories).
class PSTRentalsPage {

    verifyTitle() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.pageTitle, T).should($t => expect(normalize($t.text())).to.equal(sel.texts.title))
        })
    }

    verifyExactRentals() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(`${sel.rentalItem} ${sel.rentalName}`, T).should($n => {
                expect([...$n].map(el => normalize(el.innerText)).sort()).to.deep.equal([...sel.data.rentals].sort())
            })
        })
    }

    openRental(name) {
        cy.fixture(FIXTURE).then(sel => cy.contains(`${sel.rentalItem} ${sel.rentalName}`, name, T).click())
    }
}

export default PSTRentalsPage
