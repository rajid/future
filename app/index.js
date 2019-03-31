import {
    inbox
} from "file-transfer";
import {
    readFileSync
} from "fs";
import {
    writeFileSync
} from "fs";
import {
    statSync
} from "fs";
import document from "document";
import { display } from "display";
import * as messaging from "messaging";

/*
 * Entry point for the watch app
 */


var myData;
let asof = document.getElementById("AsOf");


/*
  messaging.peerSocket.onmessage = function(evt) {

  console.log(`Got here`);
  //  console.log(`key=${evt.data.command}`);
  switch (evt.data.command) {
  case "here":
  sendCommand("update");
  return;
  }
  }
*/

// console.log(`${xml}`);
var note = document.getElementById("note");
note.text = ""; // init.

inbox.onnewfile = () => {
    let fileName;
    console.log("Got a new file");
    do {
        // If there is a file, move it from staging into the application folder
        fileName = inbox.nextFile();
        if (fileName) {
            console.log(`Got info: ${fileName}`);
            
            readSGVFile(fileName);
        }
    } while (fileName);
};


function readSGVFile(fileName) {
    let now = new Date();

    myData = readFileSync(fileName, 'cbor');

    setText(now, myData);
    asof.style.fill = "green";

    writeFileSync("Future", {time: now.getTime(),
                             data: note.text}, "json");
    fetching = false;
}


function setText(now, data) {

    asof.text = `As of ${now.getMonth()+1}/${now.getDate()} ${now.getHours()}:${zeroPad(now.getMinutes())}:`;

    note.text += data;
    note.style.display ="inline";
    display.poke();
}

let saveCommand="";

try {
    let now = new Date();
    let t = readFileSync("Future", "json");
    if (now.getTime() - t.time > Hour2ms(1) ) {
        sendCommand("update");
    } else {
        setText(now, t.data);
        asof.style.fill = "grey";
    }
} catch (err) {
    console.log(`*** err = ${err}`);
    sendCommand("update");
}
console.log("starting");


messaging.peerSocket.onopen = function() {

    console.log(`open... command is ${saveCommand}`);
    if (saveCommand) {
        console.log("sending saved command");
        sendCommand(saveCommand);
    }
}

let fetching = false;
function sendCommand(cmd) {
    
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        // Send a command to the companion
        messaging.peerSocket.send({
            command: cmd
        });
        saveCommand = null;
    } else {
        console.log(`Saving command ${cmd}`);
        saveCommand = cmd;
    }
    fetching = true;
}


asof.onclick = function(e) {
    note.text = "";
    sendCommand("update");
}

//xmlparse(xml);

function zeroPad(i) {
    
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

function Hour2ms(x) {
    return (60 * Min2ms(x));
}
function Min2ms(x) {
    return (x * 60 * 1000);
}
