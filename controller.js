// controller.js
const mqtt = require('mqtt')
const client = mqtt.connect('mqtt://test.mosquitto.org')

client.on('connect', () => {
    console.log("Connected!");
    client.subscribe('garage/connected')
    client.subscribe('garage/state')
})

client.on('message', (topic, message) => {
    switch (topic) {
        case 'garage/connected':
            return console.log(message);
        case 'garage/state':
            return console.log(message);
    }
    console.log('No handler for topic %s', topic)
})


// --- For Demo Purposes Only ----//

// simulate opening garage door
setInterval(() => {
    console.log('open door');
    client.publish('garage/close', 'true')
}, 2000);

// // simulate closing garage door
// setTimeout(() => {
//     console.log('close door')
//     closeGarageDoor()
// }, 3000)
