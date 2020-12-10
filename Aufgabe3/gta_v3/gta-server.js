/**
 * Template für Übungsaufgabe VS1lab/Aufgabe3
 * Das Skript soll die Serverseite der gegebenen Client Komponenten im
 * Verzeichnisbaum implementieren. Dazu müssen die TODOs erledigt werden.
 */

/**
 * Definiere Modul Abhängigkeiten und erzeuge Express app.
 */

var http = require('http');
//var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var express = require('express');

var app;
app = express();
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
    extended: false
}));

// Setze ejs als View Engine
app.set('view engine', 'ejs');

/**
 * Konfiguriere den Pfad für statische Dateien.
 * Teste das Ergebnis im Browser unter 'http://localhost:3000/'.
 */

app.use(express.static(__dirname + "/public"));

/**
 * Konstruktor für GeoTag Objekte.
 * GeoTag Objekte sollen min. alle Felder des 'tag-form' Formulars aufnehmen.
 */

function GeoTag(latitude, longitude, name, hashtag) {
    this.latitude = latitude;
    this.longitude = longitude;
    this.name = name;
    this.hashtag = hashtag;
}

/**
 * Modul für 'In-Memory'-Speicherung von GeoTags mit folgenden Komponenten:
 * - Array als Speicher für Geo Tags.
 * - Funktion zur Suche von Geo Tags in einem Radius um eine Koordinate.
 * - Funktion zur Suche von Geo Tags nach Suchbegriff.
 * - Funktion zum hinzufügen eines Geo Tags.
 * - Funktion zum Löschen eines Geo Tags.
 */

var GeoTags = (function () {
    // private
    var gtags = [];

    // distance function basiert auf https://jonisalonen.com/2014/computing-distance-between-coordinates-can-be-simple-and-fast/
    // soll OK für kleine Distanzen sein (<50km)
    function distance(lat1, lon1, lat2, lon2) {
        let deglen = 110.25;
        var x = lat2 - lat1;
        var y = (lon2 - lon1) * Math.cos(lat1 * Math.PI / 180.0);
        return deglen * Math.sqrt(x * x + y * y);
    }

    // public
    return {
        findTagsInRadius: function (latitude, longitude, radius) {
            // radius in km
            var res = [];
            gtags.forEach(function (tag) {
                if (distance(latitude, longitude, tag.latitude, tag.longitude) <= radius) {
                    res.push(tag);
                }
            });
            return res;
        },
        // TODO: testen
        findTags: function (suchbegriff) {
            return gtags.filter(function (tag) {
                return tag.name === suchbegriff || tag.hashtag === suchbegriff;
            });
        },
        addTag: function (tag) {
            gtags.push(tag);
            console.log(gtags); // DEBUG
        },
        // TODO: testen
        deleteTag: function (tag) {
            // wir nehmen an, tag taucht höchstens nur einmal auf
            for (var i = 0; i < gtags.length; ++i) {
                var g = gtags[i];
                if (g.longitude === tag.longitude &&
                    g.latitude === tag.latitude &&
                    g.name === tag.name &&
                    g.hashtag === tag.hashtag)
                {
                    gtags.splice(i, 1);
                    return;
                }
            }
        }
    };
})();

/**
 * Route mit Pfad '/' für HTTP 'GET' Requests.
 * (http://expressjs.com/de/4x/api.html#app.get.method)
 *
 * Requests enthalten keine Parameter
 *
 * Als Response wird das ejs-Template ohne Geo Tag Objekte gerendert.
 */

app.get('/', function(req, res) {
    res.render('gta', {
        taglist: []
    });
});

/**
 * Route mit Pfad '/tagging' für HTTP 'POST' Requests.
 * (http://expressjs.com/de/4x/api.html#app.post.method)
 *
 * Requests enthalten im Body die Felder des 'tag-form' Formulars.
 * (http://expressjs.com/de/4x/api.html#req.body)
 *
 * Mit den Formulardaten wird ein neuer Geo Tag erstellt und gespeichert.
 *
 * Als Response wird das ejs-Template mit Geo Tag Objekten gerendert.
 * Die Objekte liegen in einem Standard Radius um die Koordinate (lat, lon).
 */

app.post('/tagging', function (req, res) {
    var data = req.body;
    var tag = new GeoTag(data.latitude, data.longitude, data.name, data.hashtag);
    GeoTags.addTag(tag);
    res.render('gta', {
        taglist: GeoTags.findTagsInRadius(tag.latitude, tag.longitude, 5),
        latitude: data.latitude,
        longitude: data.longitude
    });
});

/**
 * Route mit Pfad '/discovery' für HTTP 'POST' Requests.
 * (http://expressjs.com/de/4x/api.html#app.post.method)
 *
 * Requests enthalten im Body die Felder des 'filter-form' Formulars.
 * (http://expressjs.com/de/4x/api.html#req.body)
 *
 * Als Response wird das ejs-Template mit Geo Tag Objekten gerendert.
 * Die Objekte liegen in einem Standard Radius um die Koordinate (lat, lon).
 * Falls 'term' vorhanden ist, wird nach Suchwort gefiltert.
 */

app.post('/discovery', function (req, res) {
    var data = req.body;
    var tags;
    if (data.searchterm !== undefined && data.searchterm !== "") {
        tags = GeoTags.findTags(data.searchterm);
    } else {
        tags = GeoTags.findTagsInRadius(data.latitude, data.longitude, 5);
    }

    res.render('gta', {
        taglist: tags,
        latitude: data.latitude,
        longitude: data.longitude
    });
});

/**
 * Setze Port und speichere in Express.
 */

var port = 3000;
app.set('port', port);

/**
 * Erstelle HTTP Server
 */

var server = http.createServer(app);

/**
 * Horche auf dem Port an allen Netzwerk-Interfaces
 */

server.listen(port);
