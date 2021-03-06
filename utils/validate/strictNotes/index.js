const yup = require('yup')
const noteKind = require('../types/noteKind')
const schemas = require('./schemas')
const objectId = require('../types/objectId')

exports = module.exports = yup.object().shape({
    kind: noteKind.required(),
    parent: objectId.nullable(),
    note: yup.object().when('kind', kind => {
        if (!schemas[kind]) throw new Error(`Schema [kind: ${kind}] not found!`)
        return schemas[kind]
    }),
})
