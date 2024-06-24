function onFormSubmit(e) {
  // Initalize variables
  var dataToExport = {};
  var form = FormApp.openById('1dUM0xBR5VaAuWbr22dT8mGrUCzKW668Of62ETRfkUac');
  var formResponses = form.getResponses();
  var latestResponse = formResponses.length - 1;
  var formResponse = formResponses[latestResponse];
  var items = formResponse.getItemResponses(); 
  

  // Get the 3 form responses
  var table = getMethod(items[0]);
  var isMissing = getMethod(items[1]).toString();
  var teamType = getMethod(items[2]).toString();

  // Time variables
  var time = getTimestamp();
  var militaryTime = getMilitaryTime(time);
  var tmp = time.split(' ');
  var date = tmp[0];
  var dateNoForwardSlash = date.replace(/\//g, ':');

  // Date specific variables
  var specificDay = (new Date()).getDay(); // Returns a number 0-6
  // 0-6, Sunday - Saturday
  var datesArray = ["Sunday", "Monday", "Tuesday", "Wesnesday", "Thursday", "Friday", "Saturday"];
  // Assign date
  var specificDayString = datesArray[specificDay];
  var datePlusDay = dateNoForwardSlash + " " +specificDayString;


  // Section information
  var sectionTime = ["1000-1150", "1200-1350", "1400-1550", "1600-1750", "1630-1820"];
  var sectionTimeSlot;
  var roomNumber = "";

  // Determine room number
  if (table <= 5) {
    roomNumber = new String("1116");
  } else {
    roomNumber = new String("1120");
  }

  // Determine if the request is a valid entry
  var sectionTimeSlot = findSectionTime(militaryTime, sectionTime);
  if (sectionTimeSlot == null) {
    sectionTimeSlot = new String("Invalid Entry");
  }

  // Assign section
  var sectionNumber = assignSection(militaryTime, specificDay, roomNumber);

  // Fill fields to be exported
  dataToExport = {
    "missingTools": isMissing,
    "missionType": teamType
  }

  // Get table number in string format
  var tableNumber = getTableNumber(table);

  // Write data to the firebase
  writeToFirebase(sectionNumber, datePlusDay, dataToExport, tableNumber);
}

function assignSection(time, specificDay, roomNumber) {
  var testingPeriod = false;

  var mW, tuTh;

  var isTenToTwelve = false;
  var isTwelveToTwo = false;
  var isTwoToFour = false;
  var isFourToSix = false;
  var isFCTime = false;


  var is1116 = false;
  var is1120 = false;

  // Determine time
  if (time >= 1000 && time <= 1150) { // 10:00 - 11:50
    isTenToTwelve = true;
  } else if (time >= 1200 && time <= 1350) { // 12:00 - 1:50
    isTwevleToTwo = true;
  } else if (time >= 1400 && time <= 1550) { // 2:00 - 3:50
    isTwoToFour = true;
  } else if (time >= 1600 && time <= 1750) { // 4:00 - 5:50
    isFourToSix = true;
  } else if (time >= 1630 && time <= 1820) { // 4:30 - 6:20
    isFCTime = true;
  } else {
    testingPeriod = true;
  }

  // Determine whether it's a MW or TuTh section
  if (specificDay == 1 || specificDay == 3) {
    mW = true;
  } else {
    mW = false;
  }

  if (specificDay == 2 || specificDay == 4) {
    tuTh = true;
  } else {
    tuTh = false;
  }

  // Determine room number
  if (roomNumber.localeCompare("1116") == 0) {
    is1116 = true;
  } else if (roomNumber.localeCompare("1120") == 0) {
    is1120 = true;
  }

  // Based on time slot, MW/TuTh section, and room number, assign section
  if (mW && isTenToTwelve && is1116) {
    return "0301";
  } else if (mW && isTenToTwelve && is1120) {
    return "0302";
  } else if (tuTh && isTenToTwelve && is1116) {
    return "0401";
  } else if (tuTh && isTenToTwelve && is1120) {
    return "0402";
  } else if (mW && isTwelveToTwo && is1116) {
    return "0501";
  } else if (mW && isTwelveToTwo && is1120) {
    return "0502";
  } else if (tuTh && isTwelveToTwo && is1116) {
    return "0601";
  } else if (tuTh && isTwelveToTwo && is1120) {
    return "0602";
  } else if (mW && isTwoToFour && is1116) {
    return "0701";
  } else if (mW && isTwoToFour && is1120) {
    return "0702";
  } else if (tuTh && isTwoToFour && is1116) {
    return "0801";
  } else if (tuTh && isTwoToFour && is1120) {
    return "0802";
  } else if (tuTh && isFourToSix && is1116) {
    return "1001";
  } else if (mW && isFCTime && is1116) {
    return "FC01";
  } else if (mW && isFCTime && is1116) {
    return "FC02";
  } else if (testingPeriod) {
    return "0000";
  } else {
    return "Out!";
  }

}

// Point behind this function is to see if the user gave a response
// more than 20 minutes after the start of class
function findSectionTime(militaryTime, sectionTime) {
  var beginningTimes = new Array(sectionTime.length);
  var endTimes = new Array(sectionTime.length);

  for (let i = 0; i < sectionTime.length; i++) {
    let tmp = sectionTime[i].split("-");
    beginningTimes[i] = parseInt(tmp[0]);
    endTimes[i] = parseInt(tmp[1]);
  }

  var invalidCount = 0;
  var marker = 0;
  var militaryTimeInt = parseInt(militaryTime);

  for (let i = 0; i < sectionTime.length; i++) {
    var inRange = militaryTimeInt > beginningTimes[i] && militaryTimeInt < endTimes[i];
    if (!inRange) {
      invalidCount++;
    } else {
      if (militaryTimeInt > beginningTimes[i] + 20) {
        invalidCount++;
      } else {
        marker = i;
      }
    }
  }

  if (invalidCount == sectionTime.length) {
    return null;
  }

  return sectionTime[marker];
}

function getTableNumber(table) {
  return "Table" + table.toString();
}

// Get EST Time
function getTimestamp() {
  var timestamp = new Date();
  return timestamp.toLocaleString('en-us', {timeZone: 'America/New_York', timeZoneName: 'short'});
}

function getDayTime(time) {
  var dateAndTime = time.split(',');
  return dateAndTime[1].trim();
}

// Convert specific day time into military time
function getMilitaryTime(time) {
  var dateAndTime = time.split(',');
  dateAndTime = dateAndTime[1].trim();
  var timeAndTimezonePart = dateAndTime.split(" ");
  var hourMinutesSeconds = timeAndTimezonePart[0].split(":");
  
  var hour;
  if (timeAndTimezonePart[1] == "AM" && hourMinutesSeconds[0] == 12) { // If midnight (added if testing around that time)
    hour = 0;
  } else if (timeAndTimezonePart[1] == "PM" && hourMinutesSeconds[0] == 12) { // If noon
    hour = 12;
  } else if (timeAndTimezonePart[1] == "AM") {
    hour = parseInt(hourMinutesSeconds[1]);
  } else if (timeAndTimezonePart[1] == "PM") {
    hour = parseInt(hourMinutesSeconds[1]) + 12;
  }
  var minutes = parseInt(hourMinutesSeconds[1]);

  var hourString = hour.toString();
  var minutesString = minutes.toString();

  if (hourString.length == 1) {
    hourString = "0" + hourString;
  }

  if (minutesString.length == 1) {
    minutesString = "0" + minutesString;
  }

  return hourString + minutesString;
}

function getMethod(item) {
  var value = item || "_unknown_"; // If null then "_unknown_" is assigned
  
  function check(x) {
    if(x == "")
      return "_unknown_";
    else 
      return x;
  }
  
  if(value != "_unknown_") {
    return check(value.getResponse());
  } else {
    return value;
  }
}

function writeToFirebase(sectionNumber, date, dataToExport, tableNumber) {
  var firebaseConfig = {
    apiKey: "AIzaSyCIHukYa07oKC159AJV7RGN1Z-ZMOZQA2k",
    authDomain: "check-ee399.firebaseapp.com",
    databaseURL: "https://check-ee399-default-rtdb.firebaseio.com",
    projectId: "check-ee399",
    storageBucket: "check-ee399.appspot.com",
    messagingSenderId: "616595701207",
    appId: "1:616595701207:web:ee4e998307f445b65f9f92",
    measurementId: "G-8LLFPR7BDT"
  };


  // Make URL for database
  var databaseUrl = firebaseConfig.databaseURL;
  var path = '/orders/' + sectionNumber + '/' + date + '/' + tableNumber + '/';
  var url = databaseUrl + path + '.json?auth=' + firebaseConfig.apiKey;

  var payload = JSON.stringify(dataToExport);

  // POST request to Database
  var options = {
    method: 'put',
    contentType: 'application/json',
    payload: payload
  };

  var response = UrlFetchApp.fetch(url, options);
  Logger.log(response.getContentText());
}