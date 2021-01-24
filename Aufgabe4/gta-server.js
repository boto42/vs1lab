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
const  elementsPerPage = 5;
var app;
app = express();
app.use(logger('dev'));
app.use(bodyParser.json());    // zum Parsen von Json Inhalten im Body des req
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
var idCounter = 0;  // todo id mit übergeben ?
function GeoTag(latitude, longitude, name, hashtag) {
    this.latitude = Number.parseFloat(latitude);
    this.longitude = Number.parseFloat(longitude);
    this.name = name;
    this.hashtag = hashtag;
    this.id = idCounter;
    idCounter = idCounter +1;
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
            return gtags.filter(
                tag =>
                    distance(latitude, longitude, tag.latitude, tag.longitude) <= radius
            );
        },

        findTags: function (suchbegriff = "") {
            return gtags.filter(tag =>
                tag.name.includes(suchbegriff) ||
                tag.hashtag.includes(suchbegriff) // todo übermittlung des Hashtags mit URL
            );
        },

        addTag: function (tag) {
            gtags.push(tag);
            console.log(gtags); // DEBUG
        },

        // id ist eindeutig. return nur eins (mehrere soll es nicht geben)
        getById: function(id){
            return gtags.filter(tag => tag.id == id)[0];
        },

        deleteTag: function (id) {
            gtags = gtags.filter(tag => tag.id !== Number.parseInt(id))
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

// wird nicht mehr verwendet
app.post('/tagging', function (req, res) {
    let data = req.body;
    let tag = new GeoTag(data.latitude, data.longitude, data.name, data.hashtag);
    console.log(tag)
    GeoTags.addTag(tag);
    res.render('gta', {
        taglist: GeoTags.findTagsInRadius(tag.latitude, tag.longitude, 5),
        latitude: data.client_lat,
        longitude: data.client_lon
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

// wird nicht mehr verwendet
app.post('/discovery', function (req, res) {
    var data = req.body;
    var tagsInRadius;
    var tagsSearchterm;
    var results;
    tagsInRadius = GeoTags.findTagsInRadius(data.latitude, data.longitude, 5);
    results = tagsInRadius;
    if (data.searchterm !== undefined && data.searchterm !== "") {
        tagsSearchterm = GeoTags.findTags(data.searchterm);
        results = tagsInRadius.filter(tag => tagsSearchterm.includes(tag));

    }

    res.render('gta', {
        taglist: results,
        latitude: data.latitude,
        longitude: data.longitude
    });
});


// Hinzufügen eines Tags gibt die tags im Radius zurück
app.post('/geotags', function (req, res) {
    let {latitude, longitude, page = 1} = req.body;

    let newTag = req.body.tag;
    let tag = new GeoTag(newTag.latitude, newTag.longitude, newTag.name, newTag.hashtag);
    GeoTags.addTag(tag);

    let tags = GeoTags.findTagsInRadius(latitude, longitude, 5); // verwendet die Koordinaten der Versteckten inputs
    var maxPage = Math.max(1, Math.ceil(tags.length / elementsPerPage));
    tags = tags.slice((page - 1) * elementsPerPage, page * elementsPerPage);

    //URL in header location todo testen ob header klappt
    res.header('Location', "/geotags/" + tag.id);
    res.status(201).json({ tags, maxPage });
});

// suchen der Tags
app.get('/geotags', function (req, res) {
    let {searchterm, latitude, longitude, page = 1} = req.query
    if (searchterm) {
        searchterm = decodeURIComponent(searchterm); // decode "#"
    }
    // default (searchterm undefiniert oder leer): alle GeoTags
    let tags = GeoTags.findTags(searchterm);

    // Ort optional
    if (typeof latitude !== 'undefined' && typeof longitude !== 'undefined') {
        let inRadius = GeoTags.findTagsInRadius(latitude, longitude, 5);
        tags = tags.filter(tag => inRadius.includes(tag));
    }

    var maxPage = Math.max(1, Math.ceil(tags.length / elementsPerPage));
    tags = tags.slice((page - 1) * elementsPerPage, page * elementsPerPage);
    res.json({ tags, maxPage });
});


// ein geotag ändern
app.put('/geotags/:id',function(req,res) {
    console.log("put");
    let tag = GeoTags.getById(req.params.id);
    if (tag) {
        let data = req.body.tag;
        tag.latitude = data.latitude;
        tag.longitude = data.longitude;
        tag.name = data.name;
        tag.hashtag = data.hashtag;
        res.json({ tags: [tag], maxPage: 1 });
    } else {
        res.status(404).send(null);
    }
});

//ein geotag mit id suchen
app.get('/geotags/:id',function(req,res) {
    let tag = GeoTags.getById(req.params.id);
    if (tag) {
        res.json({ tags: [tag], maxPage: 1 });
    } else {
        res.status(404).json({ tags: [], maxPage: 1 });
    }
});

// ein geotag löschen
app.delete('/geotags/:id',function(req,res) {
    GeoTags.deleteTag(req.params.id);
    res.status(200).send(null);
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
