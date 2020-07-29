const mqtt = require('mqtt')
const client = mqtt.connect('mqtt://test.mosquitto.org')

client.on('connect', () => {
    console.log("connected!!!!");
    client.subscribe('garage/open')
    client.subscribe('garage/close')

    // Inform controllers that garage is connected
    client.publish('garage/connected', 'true')
})

client.on('message', (topic, message) => {
    console.log('received message %s %s', topic, message)
    switch (topic) {
        case 'garage/open':
            return console.log(message)
        case 'garage/close':
            return console.log(message)
    }
})

function handleAppExit (options, err) {
    if (err) {
        console.log(err.stack)
    }

    if (options.cleanup) {
        client.publish('garage/connected', 'false')
    }

    if (options.exit) {
        process.exit()
    }
}

/**
 * Handle the different ways an application can shutdown
 */
process.on('exit', handleAppExit.bind(null, {
    cleanup: true
}))
process.on('SIGINT', handleAppExit.bind(null, {
    exit: true
}))
process.on('uncaughtException', handleAppExit.bind(null, {
    exit: true
}))
