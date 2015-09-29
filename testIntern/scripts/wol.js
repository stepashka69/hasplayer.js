/* This script sends a Wake-on-LAN magic packet for the specified MAC address */

dgram = require('dgram');

if (process.argv.length < 3) {
	console.log('You must specify a MAC address.');
}

// Convert the MAC string to a byte array
var MAC = null;
var tmpMacArray = new Array();
var macChunks = process.argv[2].split(':');

for(var i = 0; i < macChunks.length; ++i) {
	tmpMacArray.push(parseInt('0x' + macChunks[i]));
}

MAC = new Uint8Array(tmpMacArray);

// Create the magic packet
var magicPacketHeader = new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);
var magicPacket = [];
var magicPacketMacCount = 16;	// The MAC address must be repeated 16 times in the packet

Array.prototype.push.apply(magicPacket, magicPacketHeader);

for(var i = 0; i < magicPacketMacCount; ++i) {
	Array.prototype.push.apply(magicPacket, MAC);
}

var buffer = new Buffer(magicPacket);

// Send the magic packet
var client = dgram.createSocket('udp4');
client.bind( function() { client.setBroadcast(true) } );

client.send(buffer, 0, buffer.length, 7, '255.255.255.255', function() {
    client.close();
});
