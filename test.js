const fs = require('fs')

let d = new Date();
fs.readFile('./data/dht11_hum.json', "utf-8", function(err, data){
    data = data.trim();

    var obj = {
      "date": d.getTime(),
      "temp": 66,
      "month": d.getMonth(),
      "day": d.getDate(),
      "year": d.getFullYear(),
      "minute": d.getMinutes(),
      "dayOfWeek": d.getDay()
    }

    data = JSON.parse(data);
    data.unshift(obj);
    fs.writeFile('./data/dht11_hum.json', JSON.stringify(data), function(err){
      console.log("GOT DATA");
    })
  });