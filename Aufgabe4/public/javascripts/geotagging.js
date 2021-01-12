/* Dieses Skript wird ausgeführt, wenn der Browser index.html lädt. */

// Befehle werden sequenziell abgearbeitet ...

/**
 * "console.log" schreibt auf die Konsole des Browsers
 * Das Konsolenfenster muss im Browser explizit geöffnet werden.
 */
console.log("The script is going to start...");

// Es folgen einige Deklarationen, die aber noch nicht ausgeführt werden ...

// Hier wird die verwendete API für Geolocations gewählt
// Die folgende Deklaration ist ein 'Mockup', das immer funktioniert und eine fixe Position liefert.
GEOLOCATIONAPI = {
    getCurrentPosition: function(onsuccess) {
        onsuccess({
            "coords": {
                "latitude": 49.013790,
                "longitude": 8.390071,
                "altitude": null,
                "accuracy": 39,
                "altitudeAccuracy": null,
                "heading": null,
                "speed": null
            },
            "timestamp": 1540282332239
        });
    }
};

// Die echte API ist diese.
// Falls es damit Probleme gibt, kommentieren Sie die Zeile aus.
GEOLOCATIONAPI = navigator.geolocation;

/**
 * GeoTagApp Locator Modul
 */
var gtaLocator = (function GtaLocator(geoLocationApi) {

    // Private Member

    /**
     * Funktion spricht Geolocation API an.
     * Bei Erfolg Callback 'onsuccess' mit Position.
     * Bei Fehler Callback 'onerror' mit Meldung.
     * Callback Funktionen als Parameter übergeben.
     */
    var tryLocate = function(onsuccess, onerror) {
        if (geoLocationApi) {
            geoLocationApi.getCurrentPosition(onsuccess, function(error) {
                var msg;
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        msg = "User denied the request for Geolocation.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        msg = "Location information is unavailable.";
                        break;
                    case error.TIMEOUT:
                        msg = "The request to get user location timed out.";
                        break;
                    case error.UNKNOWN_ERROR:
                        msg = "An unknown error occurred.";
                        break;
                }
                onerror(msg);
            });
        } else {
            onerror("Geolocation is not supported by this browser.");
        }
    };

    // Auslesen Breitengrad aus der Position
    var getLatitude = function(position) {
        return position.coords.latitude;
    };

    // Auslesen Längengrad aus Position
    var getLongitude = function(position) {
        return position.coords.longitude;
    };

    // Hier Google Maps API Key eintragen
    var apiKey = "njCMGxk0vLkGoU3T6zQm3LKjlSAK9zUS";

    /**
     * Funktion erzeugt eine URL, die auf die Karte verweist.
     * Falls die Karte geladen werden soll, muss oben ein API Key angegeben
     * sein.
     *
     * lat, lon : aktuelle Koordinaten (hier zentriert die Karte)
     * tags : Array mit Geotag Objekten, das auch leer bleiben kann
     * zoom: Zoomfaktor der Karte
     */
    var getLocationMapSrc = function(lat, lon, tags, zoom) {
        zoom = typeof zoom !== 'undefined' ? zoom : 10;

        if (apiKey === "YOUR_API_KEY_HERE") {
            console.log("No API key provided.");
            return "images/mapview.jpg";
        }

        // MapQuest kann nur Zahlen und einzelne Buchstaben als Label nehmen
        var tagList = "pois=U," + lat + "," + lon;
        if (tags !== undefined) tags.forEach(function(tag, index) {
            tagList += "|" + /*tag.name*/ (index+1) + "," + tag.latitude + "," + tag.longitude;
        });

        var urlString = "https://www.mapquestapi.com/staticmap/v4/getmap?key=" +
            apiKey + "&size=600,400&zoom=" + zoom + "&center=" + lat + "," + lon + "&" + tagList;

        console.log("Generated Maps Url: " + urlString);
        return urlString;
    };

    return { // Start öffentlicher Teil des Moduls ...

        // Public Member

        readme: "Dieses Objekt enthält 'öffentliche' Teile des Moduls.",

          updateLocation: function() {
            var taglist_json = $('#result-img').attr('data-tags');
            // JQuery.data() parst data-Attribute automatisch
            // var taglist = $('#result-img').data('tags');
            var taglist = [];
            if (taglist_json) {
                taglist = JSON.parse(taglist_json);
            }
            console.log("DEBUG: taglist_json = " + taglist_json);

            // nur die Karte laden, wenn wir Koordinaten schon haben
            if ($('#tagging-latitude').val() && $('#tagging-longitude').val() &&
                $('#discovery-latitude').val() && $('#discovery-longitude').val())
            {
                // falls die koordinaten im Tagging Formular geändert wurden zurücksetzen
                $("#latitude").val( $("#tagging-latitude").val());
                $("#longitude").val( $("#tagging-longitude").val());
                console.log("DEBUG: Koordinaten schon vorhanden. Nur Karte wird geladen");
                $('#result-img').attr('src', getLocationMapSrc($('#tagging-latitude').val(), $('#tagging-longitude').val(), taglist, 13));
                return;
            }

            tryLocate(function(position){
				document.getElementById("latitude").value = getLatitude(position);
				document.getElementById("longitude").value = getLongitude(position);
				document.getElementById("tagging-latitude").value = getLatitude(position); // Client-Koordinaten speichen,
				document.getElementById("tagging-longitude").value = getLongitude(position); // falls sie manuell geändert werden.
				document.getElementById("discovery-latitude").value = getLatitude(position);
				document.getElementById("discovery-longitude").value = getLongitude(position);
				document.getElementById("result-img").src =  getLocationMapSrc(getLatitude(position),getLongitude(position),taglist,13);
				getTags();  // Tag laden bei Erstem laden.
			},
			function (errorMessage){
				alert(errorMessage);
			});
        }

    }; // ... Ende öffentlicher Teil
})(GEOLOCATIONAPI);



function GeoTag(latitude, longitude, name, hashtag) {
    this.latitude = latitude;
    this.longitude = longitude;
    this.name = name;
    this.hashtag = hashtag;
}




var ajax =new XMLHttpRequest();

ajax.onreadystatechange =function(){

if(ajax.readyState ==4){

	//console.log(ajax.response);
	console.log(ajax.getResponseHeader("Location"))
	if(ajax.response.tags){

		var taglist = (ajax.response.tags); // response besteht aus taglist und der anzahl Seiten
        $('#results').html("");
        taglist.forEach(function(tag, index) {
            listElement = document.createElement('li');
            listElement.innerHTML = tag.name+ " (  " + tag.latitude + " " +tag.longitude +" ) " +tag.hashtag +" "+tag.id;
            document.getElementById('results').appendChild(listElement);
        });
        $('#result-img').attr("data-tags" ,JSON.stringify(taglist));
        gtaLocator.updateLocation();
        document.getElementById("page-actual").value = page;
        document.getElementById("page-next").value = page+1;
        document.getElementById("page-previous").value = page-1;
        if(page == 1){
            document.getElementById("page-previous").style.visibility = "hidden";
            document.getElementById("page-left").style.visibility = "hidden";
        }else {
            document.getElementById("page-previous").style.visibility = "visible";
            document.getElementById("page-left").style.visibility = "visible";
        }
        console.log(ajax.response.maxPage);
        if(ajax.response.maxPage <= page){  // falls letzte Seite

            document.getElementById("page-next").style.visibility = "hidden";
            document.getElementById("page-right").style.visibility = "hidden";
        }else {
            document.getElementById("page-next").style.visibility = "visible";
            document.getElementById("page-right").style.visibility = "visible";
        }
		console.log("finished");
	}
// Verarbeite eingehende Daten
}
};
//Ende der Funktion



/**
 * $(function(){...}) wartet, bis die Seite komplett geladen wurde. Dann wird die
 * angegebene Funktion aufgerufen. An dieser Stelle beginnt die eigentliche Arbeit
 * des Skripts.
 */
var page = 1;

var postTag = function(){
    var tag = new GeoTag($('#latitude').val(),$('#longitude').val(),$('#name').val(),$('#hashtag').val());
    ajax.open("post","/geotags",true);
    ajax.setRequestHeader("Content-Type", "application/json");
    ajax.responseType = "json";
    console.log(tag);
    let latitude = $('#tagging-latitude').val();
    let longitude = $('#tagging-longitude').val();
    ajax.send(JSON.stringify({tag,latitude,longitude,page} ));
};
var getTags = function(){
    let lat = "latitude="+ $('#discovery-latitude').val();
    let long = "&longitude=" + $('#discovery-longitude').val();
    let search = "&searchterm=" + $('#searchterm').val();
    let url =encodeURI( "/geotags?"+lat+long+search +"&page="+page);
    console.log(url);
    ajax.open("get",url,true);
    ajax.responseType = "json";
    ajax.send(null);
};


$(function() {
	 document.getElementById("tag-submit").addEventListener("click",postTag);

	 document.getElementById("filter-submit").addEventListener("click", function (){
         page = 1;
         getTags();
     });
    document.getElementById("page-right").addEventListener("click",function (){
       page++;
       getTags();
    });
    document.getElementById("page-next").addEventListener("click",function (){
        page++;
        getTags();
    });
    document.getElementById("page-left").addEventListener("click",function (){
        if(page>1){
            page--;
        }
        getTags();
    });
    document.getElementById("page-previous").addEventListener("click",function (){
        if(page>1){
            page--;
        }
        getTags();
    });
    document.getElementById("page-actual").addEventListener("click",getTags);
	gtaLocator.updateLocation();
    //alert("Please change the script 'geotagging.js'");
    // TODO Hier den Aufruf für updateLocation einfügen
});