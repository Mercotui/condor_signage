$(document).ready(function() {
    update_date();
    init_clock();
    update_weather();
    update_transit();

    setInterval(update_date, 60000);
    setInterval(update_weather, 60000);
    setInterval(update_transit, 60000);
});

// Date and time functions
function update_date(){
    //var d_names = ['S','MON','TUE','WED','THU','FRI','SAT'];
    var d_names = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    var m_names = new Array("JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC");
    var d = new Date();
    var curr_day = d.getDay();
    var curr_date = d.getDate();
    var curr_month = d.getMonth();
    document.getElementById("date").innerHTML = (curr_date+" "+m_names[curr_month]);
    document.getElementById("day").innerHTML = d_names[curr_day];
}
var clock;
function init_clock() {
    clock = $('.clock').FlipClock({
        clockFace: 'TwentyFourHourClock',
        showSeconds: false
    });
}

// Weather data
function config_weather(){
    var key;
    var city;
    while(key == null) {
        key = prompt("Please enter your openweathermap.org API-key", localStorage.getItem("weather_key"));
    }
    while(city == null) {
        city = prompt("Please enter your openweathermap.org city-ID", localStorage.getItem("weather_city_id"));
    }
    localStorage.setItem("weather_key", key);
    localStorage.setItem("weather_city_id", city);
    update_weather();
}
function update_weather(){
    var key = localStorage.getItem("weather_key");
    var city = localStorage.getItem("weather_city_id");

    if (key != null && city != null){
        $.getJSON( "http://api.openweathermap.org/data/2.5/weather?id="+city+"&APPID="+key+"&units=metric", parse_weather_response);
    }
}
function parse_weather_response(data){
    var curr_temp;
    var max_temp;
    var min_temp;
    curr_temp = data.main.temp;
    max_temp = data.main.temp_max;
    min_temp = data.main.temp_min;

    document.getElementById("weather_curr").innerHTML = (curr_temp.toFixed(1)+" "+String.fromCharCode(176)+"C");
    document.getElementById("weather_max").innerHTML = (max_temp.toFixed(1)+" "+String.fromCharCode(176)+"C");
    document.getElementById("weather_min").innerHTML = (min_temp.toFixed(1)+" "+String.fromCharCode(176)+"C");
}

// Transit functions
var transit_api;
function transit_api_load(){
    transit_api = null;
    var key = localStorage.getItem("transit_key");
    var script = document.createElement('script');
    script.src = "https://maps.googleapis.com/maps/api/js?key="+key+"&callback=transit_api_loaded";
    document.getElementsByTagName('head')[0].appendChild(script);
}

function transit_api_loaded() {
    if(transit_api == null){
        transit_api = new google.maps.DirectionsService;
    }
    update_transit();
}

function config_transit(){
    var key;
    var origin_id;
    var destination_id;
    while(key == null) {
        key = prompt("Please enter your google API-key", localStorage.getItem("transit_key"));
    }
    while(origin_id == null) {
        origin_id = prompt("Please enter your google location id for origin", localStorage.getItem("transit_origin_id"));
    }
    while(destination_id == null) {
        destination_id = prompt("Please enter your google location id for destination", localStorage.getItem("transit_destination_id"));
    }
    localStorage.setItem("transit_key", key);
    localStorage.setItem("transit_origin_id", origin_id);
    localStorage.setItem("transit_destination_id", destination_id);
    update_transit();
}

function update_transit(){
    var key = localStorage.getItem("transit_key");
    var origin_id = localStorage.getItem("transit_origin_id");
    var destination_id = localStorage.getItem("transit_destination_id");

    if (key != null && origin_id != null && destination_id != null){
        if(transit_api == undefined){
            document.getElementById("transit_error").innerHTML = "Attempting to load API";
            transit_api_load();
        } else if (transit_api == null) {
            document.getElementById("transit_error").innerHTML = "Error API not loaded";
        } else {
            transit_api.route({
                origin: {'placeId': origin_id},
                destination: {'placeId': destination_id},
                provideRouteAlternatives: true,
                travelMode: 'TRANSIT'
            }, function(response, status) {
                if (status === 'OK') {
                    document.getElementById("transit_error").innerHTML = "";
                    parse_transit_response(response);
                } else {
                    document.getElementById("transit_error").innerHTML = "Error API Request: " + status;
                }
            });
        }
    } else {
        document.getElementById("transit_error").innerHTML = "Click HERE to configure the transit API";
    }
}

function parse_transit_response(result){
    var parsed = "<tr><th>depart</th><th>line</th><th>arive</th></tr>";
    result.routes.forEach(function(route) {
        var leg = route.legs[0]; //all of our routes (should probalby) have a single leg
        if(leg.departure_time == undefined){
            return;
            /*skip a route if theres no set departure time (happens if no transit is involved),
            since these never change, they are not relevant to display*/
        }
        function pad(value) {if(value < 10) {return '0' + value;} else {return value;}};
        var depart_time = leg.departure_time.value.getHours()+":"+pad(leg.departure_time.value.getMinutes());
        var arrive_time = leg.arrival_time.value.getHours()+":"+pad(leg.arrival_time.value.getMinutes());
        parsed += "<tr>";
        parsed += "<td>"+depart_time+"</td><td>";
        var first_step = true;
        leg.steps.forEach(function(step) {
            if(first_step == false){
                parsed += " &#8594; ";
            }
            if(step.travel_mode == "WALKING"){
                if(step.duration.value < 90){
                    return; /*walks of less than a minute and a half are irrelevant*/
                } else {
                    parsed += "<img src='"+"https://maps.gstatic.com/mapfiles/transit/iw2/6/walk.png"+"'> "+step.duration.text;
                }
            } else if(step.travel_mode == "TRANSIT"){
                parsed += "<img src='"+step.transit.line.vehicle.icon+"'> "+step.transit.line.short_name;
            } else {
                parsed += step.travel_mode+step.duration.text;
            }
            first_step = false;
        });
        parsed += "</td><td>"+arrive_time+"</td>";
        parsed += "</tr>";
    });
    document.getElementById("transit_table").innerHTML = parsed;
}
