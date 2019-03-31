import * as messaging from "messaging";
import * as util from "../common/utils";
import {
    outbox
} from "file-transfer";
import {
    encode
} from 'cbor';

console.log("Companion here");

let dayName=["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function zeroPad(i) {
    
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

messaging.peerSocket.onopen = function(evt) {
    messaging.peerSocket.send({
        command: "here"
    });
}

messaging.peerSocket.onmessage = function(evt) {
    console.log(`********** Companion received message: ${evt.data.command}`);
    switch (evt.data.command) {
    case "update":
        calData = [];
        dataIndex = 0; // init to nothing - yet
        for (let i = 0 ; i < 5 ; i++) {
            getCalendarData(i);
        }
        break;
    }
}

function getCalendarURL(index) {
    return urls[index];
}

function sortFunc(a,b) {
    return(a.time - b.time);
}

var newText;
function returnData(data,index){
    xmlparse(data, index);
    console.log("returning: " + text[index]);
    //  const myFileInfo = encode(text[index]);
    //  outbox.enqueue('text', myFileInfo);

    if (--dataIndex <= 0) {
        //  if (index == 1) {
        calData.sort(sortFunc);
        console.log(`sort of data:`);
        newText = "";
        for (let i = 0 ; i < calData.length ; i++) {
            console.log(`${i}: ${calData[i].time} ${calData[i].summary}`);
            let d = new Date(calData[i].time);
            if (d.getHours()) {
                newText += `${dayName[d.getDay()]}: ${d.getHours()}:${zeroPad(d.getMinutes())} ${calData[i].summary}\n`;
            } else {
                newText += `${dayName[d.getDay()]}: ${calData[i].summary}\n`;
            }
        }
        const myFileInfo = encode(newText);
        outbox.enqueue("text" + `${index}`, myFileInfo);
    } else {
        console.log(`dataIndex is ${dataIndex}`);
    }
}


let gettingCalendarData = false;
let dataIndex = 0;
function getCalendarData(index) {
    //  if (gettingCalendarData) return; // Don't do this twice overlapping
    gettingCalendarData = true;
    
    let url = getCalendarURL(index)
    if (url == undefined || url == "") return;

    let now = new Date();
    now = new Date(now.getTime() - (1 * 60 * 60 * 1000) + now.getTimezoneOffset() * 60000);  
    console.log(`now=${now}`);
    let then = new Date(now.getTime() + (3*24*60*60*1000));
    then = new Date(then.getTime() + then.getTimezoneOffset() * 60000);  

    console.log("URL is " + url);

    let nowDate = `${now.getYear()+1900}${zeroPad(now.getMonth()+1)}${zeroPad(now.getDate())}T${zeroPad(now.getHours())}${zeroPad(now.getMinutes())}${zeroPad(now.getSeconds())}Z`;
    console.log(`now is ${nowDate}`)  ;
    let thenDate = `${then.getYear()+1900}${zeroPad(then.getMonth()+1)}${zeroPad(then.getDate())}T${zeroPad(then.getHours())}${zeroPad(then.getMinutes())}${zeroPad(then.getSeconds())}Z`;

    console.log("Fetching URL...");
    dataIndex++;

    return fetch(url, {method: "REPORT",
                       headers: {
                           "Depth": 1,
                           "Prefer": "return-minimal",
                           "Content-Type": "application/xml ; charset=utf-8",
                           "Authorization": auth
                       },
                       body: `<C:calendar-query xmlns:C=\"urn:ietf:params:xml:ns:caldav\">\
     <D:prop xmlns:D=\"DAV:\">\
       <D:getetag/>\
       <C:calendar-data>\
         <C:comp name=\"VCALENDAR\">\
           <C:comp name=\"VEVENT\">\
             <C:prop name=\"SUMMARY\"/>\
             <C:prop name=\"DTSTART\"/>\
             <C:prop name=\"VTIMEZONE\"/>\
             <C:prop name=\"RRULE\"/>\
           </C:comp>\
         </C:comp>\
       </C:calendar-data>\
     </D:prop>\
          <C:filter>\
       <C:comp-filter name=\"VCALENDAR\">\
         <C:comp-filter name=\"VEVENT\">\
           <C:time-range start=\"${nowDate}\" \
                         end=\"${thenDate}\"/>\
         </C:comp-filter>\
       </C:comp-filter>\
     </C:filter>\
  </C:calendar-query>`})
        .then(function (response) {
            //     return response.json()
            return response.text();})
        .then(function(data) {
            console.log(`data is ${data}`);
            returnData(data, index);
            
            //        returnGraphData(data);
            //       sendGraphData(data);
        })
        .catch(function (err) {
            console.log("Error fetching " + err);
            gettingCalendarData = false; // error, so we're done
        });
}


var text=["", ""];
var calData=[];

function parseCalendar(string, index) {
    //  console.log(`Got Calendar data: ${string}`);
    let summaryStart = string.search(/SUMMARY:/);
    summaryStart += 8;
    let summaryEnd = string.substring(summaryStart).search(/\n/);
    summaryEnd += summaryStart;
    let summaryString = string.substring(summaryStart, summaryEnd);
    console.log(`summary is: '${summaryString}'`);
    text[index] += summaryString.trim() + "\n";
    //  text += '\n';
    
    let timeStart = string.search(/DTSTART;/);
    var timeVal;
    if (timeStart > 0) {
        timeStart += 8;
        let timeEnd = string.substring(timeStart).search(/\n/);
        timeEnd += timeStart;
        let timeString = string.substring(timeStart, timeEnd);
        //  console.log(`time is: ${timeString}`);
        
        let i = timeString.search(/TZID=America\/Los_Angeles/);
        if (i >= 0) {
            timeVal = timeString.substring(25);
        }

        let i = timeString.search(/TZID=GMT-0700/);
        if (i >= 0) {
            timeVal = timeString.substring(14);
        }

        let i = timeString.search(/VALUE=DATE:/);
        if (i >= 0) {
            timeVal = timeString.substring(11);
            console.log(`********** '${timeVal} *******`);
        }
    } else {
        let timeStart = string.search(/DTSTART:/);
        if (timeStart > 0) {
            timeStart += 8;
            let timeEnd = string.substring(timeStart).search(/\n/);
            timeEnd += timeStart;
            let timeString = string.substring(timeStart, timeEnd);
            timeVal = timeString;
            console.log(`========== '${timeVal} *******`);
        }
    }

    if (!timeVal) return; // done - for now
    
    let t = timeVal.indexOf("T");
    if (t >= 0) {
        let dateVal = timeVal.substring(0,t);
        let clockVal = timeVal.substring(t+1);
        //    console.log(`dateVal=${dateVal}`);
        //    console.log(`clockVal=${clockVal}`);
        let d = new Date(dateVal.substring(0,4),
                         parseInt(dateVal.substring(4,6))-1,dateVal.substring(6),
                         clockVal.substring(0,2),clockVal.substring(2,4),clockVal.substring(4,6));
    } else {
        let dateVal = timeVal;
        let d = new Date(dateVal.substring(0,4),
                         parseInt(dateVal.substring(4,6))-1,dateVal.substring(6));
    }
    
    let j = string.search(/RRULE:/);
    if (j >= 0) {
        var freq;
        let rruleStart = j + 6;
        let rruleEnd = string.substring(rruleStart).search(/\n/);
        rruleEnd += rruleStart;
        let rruleString = string.substring(rruleStart, rruleEnd);

        console.log(`GOT RRULE: ${rruleString}`);

        let k = rruleString.search(/FREQ=WEEKLY/);
        if (k >= 0) {
            freq = 7;
        } else {
            let k = rruleString.search(/FREQ=DAILY/);
            if (k >= 0) {
                freq = 1;
            } else {
                let k = rruleString.search(/FREQ=YEARLY/);
                if (k >= 0) {
                    let interval = "yearly";
                }
            }
        }
        
        let k = rruleString.search(/INTERVAL=/);
        if (k >= 0) {
            let f = parseInt(rruleString.substring(k+9));
            freq *= f;
        }
        console.log(`freq = ${freq}`);
        
        // Find the current occurrance
        let now = new Date();
        var a;

        if (freq > 0) {
            while (d <= now.getTime()) {
                d.setTime(d.getTime() + (freq * (24 * 60 * 60 * 1000)));
            }
        } else if (interval == "yearly") {
            d.setYear(now.getFullYear());
        }
    }

    console.log(`Date is: ${d}`);
    let now = new Date();
    var val;
    let val = dayName[d.getDay()];
    //    val = `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;
    //    text[index] += val.trim() + "\n";
    //    text += '\n';
    calData.push({time: d.getTime(), summary: summaryString.trim()});
}


function xmlparse(xml,index) {
    xml = xml.trim();

    while (xml.length > 0) {
        if (xml.indexOf("<!") == 0) {
            let e = xml.indexOf(">");
            //      console.log(`Calendar data is: ${xml.substring(2,e)}`);
            parseCalendar(xml.substring(2,e),index);
            return xml.substring(e+1);
        }
        if (xml[0] != '<') {
            let e=xml.indexOf("<");
            //    console.log(`Body='${xml.substring(0,e)}`);
            return xml.substring(e);
        }
        
        // Save the initial component name
        let comp = xml.search(/[ >]/);
        //  console.log(`comp=${comp}`);
        let component = xml.substring(1,comp);
        //  console.log(`component is '${component}'`);
        // Find the closing brace
        let compEnd = xml.search(/>/);
        
        // Now parse the rest
        let remain = xmlparse(xml.substring(compEnd+1),index);

        if (!remain || remain.length == 0) {
            return "";
        }

        remain.trim();
        if (remain.indexOf("</" + component) == 0) {
            // This is my component end
            let compEnd = remain.search(/>/) + 1;
            //    console.log(`compEnd is: '${remain.substring(compEnd)}'`);
            return remain.substring(compEnd);
        }
        
        // Parse next thing at this level
        xml = remain.trim();
        //  console.log("** Next thing at this level");
    }
}


/*
 * Retrieve settings info
 */
import * as messaging from "messaging";
import {
    settingsStorage
} from "settings";

var urls = [];

function saveURL(i, url) {
    
    if (url != "") {
        url = url.trim();
        //        url = url.replace(/\/$/, "");
        urls[i] = url;
        console.log(`url[${i}] = ${url[i]}`);
    }
}

settingsStorage.onchange = function(evt) {
    var d;
    var minUpdateStr;

    console.log(`Got settings storage change ${evt.key}`);
    console.log(`index is ${parseInt(evt.key.slice(-1))}`);
    console.log(`newvalue is ${evt.newValue}`);
    switch (evt.key) {
    case "auth":
        auth = evt.newValue.name;
        break;
    case "url0":
    case "url1":
    case "url2":
    case "url3":
    case "url4":
        saveURL(parseInt(evt.key.slice(-1)),
                JSON.parse(evt.newValue).name);
        settingsStorage.setItem("url" + i.toString(),
                                JSON.stringify({"name": url}));
        console.log(`saving ${"url" + i.toString()} as ${JSON.stringify({"name": url})}`);
        break;
    }
}

let auth;
try {
    console.log(`looking for auth`);
    auth = JSON.parse(settingsStorage.getItem("auth")).name;
} catch(err) {
    auth = "";
}

for (let i = 0 ; i < 5 ; i++) {
    try {
        console.log(`looking for ${"url" + i.toString()}`);
        let url = JSON.parse(settingsStorage.getItem("url" + i.toString())).name;
        console.log(`${i}: retrieved url of ${url}`);
        saveURL(i, url);
    }
    catch(err) {
        console.log(`${i}: not there`);
        settingsStorage.setItem("url" + i.toString(), JSON.stringify({"name": ""}));
        saveURL(i, "");
    }
}

console.log("Companion ready to start");
