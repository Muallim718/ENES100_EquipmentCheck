function onFormSubmit(e) {
  var form = FormApp.openById('1dUM0xBR5VaAuWbr22dT8mGrUCzKW668Of62ETRfkUac');
  var formResponses = form.getResponses();
  var latestResponse = formResponses.length - 1;
  var formResponse = formResponses[latestResponse];
  
  var items = formResponse.getItemResponses(); 


  var table = getMethod(items[0]);
  var isMissing = getMethod(items[1]).toString();

  var time = getTimestamp();
  var dayTime = getDayTime(time);
  var militaryTime = getMilitaryTime(time);
  var dataToExport = {};
  var specificDay = (new Date()).getDay(); // Returns a number 0-6
  // 0-6, Sunday - Saturday
  var datesArray = ["Sunday", "Monday", "Tuesday", "Wesnesday", "Thursday", "Friday", "Saturday"];
  // Assign date
  var specificDayString = datesArray[specificDay];
  var sectionTime = ["1000-1150", "1200-1350", "1400-1550", "1600-1750", "1630-1820"];

  var sectionTimeSlot;
  var roomNumber = "";
  var isValid = true;

  if (table <= 5) {
    roomNumber = new String("1116");
  } else {
    roomNumber = new String("1120");
  }

  var sectionTimeSlot = findTimeAndRoom(militaryTime, sectionTime);
  if (sectionTimeSlot != null) {
    sectionTimeSlot = timeAndRoom.sectionTime;
  } else {
    sectionTimeSlot = new String("Invalid Entry");
    isValid = false;
  }

  var sectionSlot = assignSection(militaryTime, specificDay, roomNumber, isValid);

  // Write the data
  dataToExport = 
    {  
      "table": table,
      "isMissing": isMissing,
      "time": time,
      "dayTime": dayTime,
      "militaryTime": militaryTime,
      "specificDayString": specificDayString,
      "sectionTimeSlot": sectionTimeSlot,
      "roomNumber": roomNumber,
      "sectionSlot": sectionSlot
    };


  writeToFirebase(dataToExport);
}

function assignSection(time, specificDay, roomNumber, isValid) {
  if (!isValid) {
    return "No section given";
  }

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
  }

  // Determine whether it's a MW or TuTh section
  if (specificDay == 1 || specificDay == 4) {
    mW = true;
  } else {
    mW = false;
  }

  if (specificDay == 2 || specificDay == 5) {
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
  }


}

function findTimeAndRoom(militaryTime, sectionTime) {
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

// Get EST 
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
  if (timeAndTimezonePart[1] == "AM" || (timeAndTimezonePart[1] == "PM" && hourMinutesSeconds[0] == 12)) {
    hour = parseInt(hourMinutesSeconds[0]);
  } else { // "PM"
    hour = parseInt(hourMinutesSeconds[0]) + 12;
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

function writeToFirebase(dataToExport) {
  var url = 'https://check-ee399-default-rtdb.firebaseio.com/orders.json';

  var payload = JSON.stringify(dataToExport);
  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': payload
  };

  var response = UrlFetchApp.fetch(url, options);
  var responseData = JSON.parse(response.getContentText());

  if (response.getResponseCode() == 200) { // If error code
    console.log("Data written successfully to Firebase:", responseData);
  } else { // If no error
    console.error("Error writing data to Firebase:", responseData);
  }
}

function getMethod(item) {
  var value = item || "_unknown_"; // if null then "_unknown_" is assigned
  
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