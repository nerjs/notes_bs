const { User } = require('@nbs/db')
const ValidationGqlError = require('@nerjs/errors/ValidationGqlError')
const { filter, UPDATE_AUTH } = require('../lib/triggers')
const pubsub = require('../lib/pubsub')

const Query = {
    me: (_, args, { session }) => (session.user ? { is: true, user: session.user } : { is: false }),
}

const Mutation = {
    registration: async (_, { login, password }, { session }) => {
        if (await User.exists({ login }))
            throw new ValidationGqlError('This user already exists', {
                map: { login: 'This user already exists.' },
            })

        const user = new User({ login, password })

        await user.save()

        session.user = user.toObject()

        const auth = { is: true, user }

        pubsub.publish(UPDATE_AUTH, { sessionId: session.id, auth })

        return auth
    },
    login: async (_, { login, password }, { session }) => {
        const user = await User.findOne({ login })

        if (!user || !user.checkPassword(password))
            throw new ValidationGqlError('Invalid username or password')

        session.user = user.toObject()

        const auth = { is: true, user }

        pubsub.publish(UPDATE_AUTH, { sessionId: session.id, auth })

        return auth
    },
    logout: async (_, args, { session }) => {
        const sessionId = session.id
        session.destroy()
        pubsub.publish(UPDATE_AUTH, { sessionId, auth: { is: false } })
        return true
    },
}

const Subscription = {
    auth: filter(UPDATE_AUTH, ({ sessionId }, __, { session }) => sessionId === session.id),
}

module.exports = {
    Query,
    Mutation,
    Subscription,
}