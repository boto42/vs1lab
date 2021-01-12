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
    this.latitude = latitude;
    this.longitude = longitude;
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
            var res = [];
            gtags.forEach(function (tag) {
                if (distance(latitude, longitude, tag.latitude, tag.longitude) <= radius) {
                    res.push(tag);
                }
            });
            return res;
        },

        findTags: function (suchbegriff) {
            return gtags.filter(function (tag) {
                return tag.name === suchbegriff || tag.hashtag === "#"+suchbegriff;  // todo übermittlung des Hashtags mit URL
            });
        },
        addTag: function (tag) {
            gtags.push(tag);
            console.log(gtags); // DEBUG
        },

        searchById: function(id){
            return gtags.filter(tag => tag.id == id);
        },

        // TODO: testen
        deleteTag: function (id) {
            for (var i = 0; i < gtags.length; ++i) {
                var g = gtags[i];
                if (g.id == id)
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
    let newTag = req.body.tag;
    let tag = new GeoTag(newTag.latitude, newTag.longitude, newTag.name, newTag.hashtag);
    GeoTags.addTag(tag);

    let page = req.body.page;
    let tags = GeoTags.findTagsInRadius(req.body.latitude,req.body.longitude,5); // verwendet die Koordinaten der Versteckten inputs
    let maxPage = tags.length/elementsPerPage;
    tags = tags.slice((page-1)*elementsPerPage,page*elementsPerPage);

    //URL in header location todo testen ob header klappt
    res.header('Location',"/geotags/"+tag.id);
    res.status(201).json({tags,maxPage});
});

// suchen der Tags
app.get('/geotags', function (req, res) {
    let searchterm = req.query.searchterm;
    let latitude = req.query.latitude;
    let longitude = req.query.longitude;
    let page = req.query.page;
    let tags;
    let tagsInRadius = GeoTags.findTagsInRadius(latitude, longitude, 5);
    tags = tagsInRadius;
    if (searchterm !== undefined && searchterm !== "") {
        let tagsSearchterm = GeoTags.findTags(searchterm);
        tags = tagsInRadius.filter(tag => tagsSearchterm.includes(tag));

    }

    var maxPage = tags.length/elementsPerPage;
    tags = tags.slice((page-1)*elementsPerPage,page*elementsPerPage);
    res.json({tags,maxPage});
});


// ein geotag ändern
app.put('/geotags/:id',function(req,res) {
    console.log("put");
    let tag = GeoTags.searchById(req.params.id)[0];
    let data = req.body.tag;
    tag.latitude = data.latitude;
    tag.longitude = data.longitude;
    tag.name = data.name;
    tag.hashtag = data.hashtag;
    let page = req.body.page;
    let tags = {tag};
    let maxPage = 1;
    res.status(201).json({tags,maxPage});
});

//ein geotag mit id suchen
app.get('/geotags/:id',function(req,res) {
    let tags = GeoTags.searchById(req.params.id);
    let maxPage = 1;
    res.json({tags,maxPage});
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
