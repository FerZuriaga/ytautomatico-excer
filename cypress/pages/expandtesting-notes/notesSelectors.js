const COMUNES = 'selectors/expandtesting-notes/comunes.json'
const REF = '@comun.'

// Reemplaza cada "@comun.<ruta>" por su valor de comunes.json. Una
// referencia que no existe frena con su nombre: nunca se usa el texto
// "@comun..." como selector.
const resolve = (value, comunes, file) => {
    if (typeof value === 'string' && value.startsWith(REF)) {
        const found = value.slice(REF.length).split('.').reduce((node, key) => (node == null ? undefined : node[key]), comunes)
        if (found === undefined) throw new Error(`${file}: la referencia "${value}" no existe en comunes.json`)
        return found
    }
    if (Array.isArray(value)) return value.map(v => resolve(v, comunes, file))
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v, comunes, file)]))
    }
    return value
}

// Carga los selectores de un módulo de Notes App con los valores
// compartidos ya resueltos (comunes.json). Reemplaza a cy.fixture(FIXTURE):
// un elemento que usan varias pantallas (el aviso, el error de campo, el
// diálogo de confirmación, el menú, la API) se cambia en un solo archivo.
export const notesSelectors = (fixture) =>
    cy.fixture(COMUNES).then(comunes =>
        cy.fixture(fixture).then(module => resolve(module, comunes, fixture)))
