var $ = $;
var L = L;   // Leaflet library

var paperItems = {};
var dataLayer = {};
dataLayer['adhoc'] = {};
var layersControl;
var currentBaseLayer = '';
var mapDateSlider;

var countsByPaperByDate_startingYear = 1836;
var countsByPaperByDate_endingYear = 1922;

var playStateStopped = 'stopped';
var playStatePlaying = 'playing';

var mapSliderPlayState = playStateStopped;

var mapAnimationTimer;
var mapAnimationTimerDelay = 200;
var mapAnimationTimerIncrAmount = 1;  // Number of bins/steps (years) to increment

var initMapData; // A demo can create a function here if they want
var mapTicks; // leave undefined unless we want ticks
var mapTicksPositions; // leave undefined unless we want ticks
var mapTicksLabels; // leave undefined unless we want ticks

// Try Map Warper,  http://maps.nypl.org/warper/maps/tile/27562/{z}/{x}/{y}.png
// http://maps.nypl.org/warper/maps/tile/27562/{z}/{x}/{y}.png
//    otmUrl = '//{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
var 
    otmMap = L.tileLayer.provider('OpenTopoMap'),
    landMap = L.tileLayer.provider('Thunderforest.Landscape'),
    pioMap = L.tileLayer.provider('Stamen.TerrainBackground'),
    wtrMap = L.tileLayer.provider('Stamen.Watercolor'),
    tnrMap = L.tileLayer.provider('Stamen.Toner'),
    tnbMap = L.tileLayer.provider('Stamen.TonerBackground'),
    mqaMap = L.tileLayer.provider('MapQuestOpen.Aerial'),
    tftMap = L.tileLayer.provider('Thunderforest.Transport'),
    tftdMap = L.tileLayer.provider('NASAGIBS.ViirsEarthAtNight2012');

var mapWarper_Boston1860MapURL = "http://maps.nypl.org/warper/maps/tile/7642/{z}/{x}/{y}.png";
var mapWarper_Boston1860Map = L.tileLayer(
        mapWarper_Boston1860MapURL, {foo: 'bar'});

var baseLayers = {
    "<img  height='30' src='images/map/Landscape.png' /> Landscape": landMap,
    "<img  height='30' src='images/map/OpenTopoMap.png' /> OpenTopoMap": otmMap,
    "<img  height='30' src='images/map/Watercolor.png' /> Watercolor": wtrMap,
    "<img  height='30' src='images/map/Pioneer.png' /> Pioneer": pioMap,
    "<img  height='30' src='images/map/Toner.png' /> Toner": tnrMap,
    "<img  height='30' src='images/map/TonerBackground.png' /> TonerBackground": tnbMap,
    "<img  height='30' src='images/map/Aerial.png' /> Aerial": mqaMap,
    "<img  height='30' src='images/map/Transport.png' /> Transport": tftMap,
    "<img  height='30' src='images/map/TransportDark.png' /> TransportDark": tftdMap
};

var geojsonMarkerOptions = {
    radius: 6,
    fillColor: "#ff7800",
    color: "#000",
    weight: 1,
    opacity: 0.5,
    fillOpacity: 0.5
};

var markerArray = new Array();
var countsByPaperByDate = new Array();

var animateMapFromTimer = function(){
    // If we are playing, move us forward.
    if (mapSliderPlayState == playStatePlaying) {
        incrementMapSliderDueToAnimation(mapDateSlider);
    }

    mapAnimationTimer = setTimeout(animateMapFromTimer, mapAnimationTimerDelay);
}

function mapSliderAtMapTick(aMapDateSlider){
    if (mapTicks === undefined) {
        return false;
    } else {
        var dateValParts = aMapDateSlider.getValue().toString().split(',');
        console.log(dateValParts[1]);
        var outerVal = dateValParts[1];
        console.log('outerVal in  mapSliderAtMapTick = ' + outerVal);
        var indexInTicks = mapTicks.indexOf(parseInt(outerVal));
        console.log('For ' + outerVal + ", indexInTicks = " + indexInTicks.toString());
        return (indexInTicks >= 0);
    }
}

function mapSliderAtMaxDate(aMapDateSlider){
    var dateValParts = aMapDateSlider.getValue().toString().split(',');
    var outerVal = dateValParts[1];
    var maxVal = parseInt(aMapDateSlider.options.max);
    if (outerVal < maxVal) {
        return false;
    } else {
        return true;
    }
}

function setMapSliderOuterValue(aMapDateSlider, newOuterValue){
        console.log(Date.now().toString() + " setMapSliderOuterValue");
        var dateValParts = aMapDateSlider.getValue().toString().split(',');
        var hh = [parseInt(dateValParts[0]), newOuterValue ];
        aMapDateSlider.setValue(hh, false, true); // no slide event, but yes change event
        setDateFromSlider(aMapDateSlider);
}

function incrementMapSliderDueToAnimation(aMapDateSlider){
    if (mapSliderAtMaxDate(aMapDateSlider)) {
        // No where to go, so turn off the playback.
        clickMapSliderPlayPause(false);
    } else {
        console.log(Date.now().toString() + " incrementMapSliderDueToAnimation");
        // We can increment to the next date bin.
        var dateValParts = aMapDateSlider.getValue().toString().split(',');
        var outerVal = dateValParts[1];
        var newOuterValue = parseInt(dateValParts[1]) + mapAnimationTimerIncrAmount;
        var hh = [parseInt(dateValParts[0]), newOuterValue ]        ;
        aMapDateSlider.setValue(hh, false, true); // no slide event, but yes change event
        setDateFromSlider(aMapDateSlider);
        if ((mapTicks !== undefined) &&(mapSliderAtMapTick(aMapDateSlider))) {
            clickMapSliderPlayPause(false);
            scrollToToNugget(mapTicks.indexOf(newOuterValue));
        };
        
    }
}
    //alert(map.getCenter().toString() + ", zoom = " + map.getZoom().toString());



// manual - A human clicked the play/pause button, rather than triggered by code.
function clickMapSliderPlayPause(manual){
    if (mapSliderPlayState == playStateStopped) {
        mapSliderPlayState = playStatePlaying;
        $('#mapSliderPlayPause').removeClass('fa-play');
        $('#mapSliderPlayPause').addClass('fa-pause');
        // If we are already at the end, either notify the user, or start from beginning again.
        var dateValParts = mapDateSlider.getValue().toString().split(',');
        var rangeStart = parseInt(dateValParts[0]);
        if (parseInt(dateValParts[1]) >= parseInt(mapDateSlider.options.max)){
            // bootbox.alert({title: 'At end of timeline',
            //         message: 'Drag the right knob to the left to be able to play the animation.'
            //         });
            var hh = [rangeStart, rangeStart];
            console.log('hh = ' + hh.toString());
            
            mapDateSlider.setValue(hh, false, true); // no slide event, but yes change event
            setDateFromSlider(mapDateSlider);
        }
      // if ( == )

    } else {
        mapSliderPlayState = playStateStopped;
        $('#mapSliderPlayPause').removeClass('fa-pause');
        $('#mapSliderPlayPause').addClass('fa-play');
    }

}

var setMarkersFill = function(thisDataLayer, newColor) {
    console.log('want to set markerfill to ' + newColor);

    for (var key in markerArray) {
        console.log('adjusting marker for ' + key.toString());
        markerArray[key].setStyle('{fillcolor: "' + newColor + '"}');
    }
    
    if(dataLayer['adhoc'] === undefined) {
            // Do nothing, we don't have markers to update yet.
    } else {
        // dataLayer['adhoc'].setStyle('{fillColor : "blue"}');    
        // dataLayer['adhoc'].eachLayer(function(layer) {
        //     console.log('insidelayer');
        //     layer.setStyle('{fillColor : "blue"}');
        // });
        generateMapObjects(adhocStResults);
    }    

}

    
function onEachFeatureBindPaperPopup(feature, layer) {
    if (feature.properties && feature.properties.lccn) {
        var thisPaper = papersLookup[feature.properties.lccn];
        var basicCarousel = '<div style="container" id="carousel-popup" class="carousel slide" data-ride="carousel"><ol class="carousel-indicators"></ol><div class="carousel-inner"></div><a class="left carousel-control" href="#carousel-popup" data-slide="prev" ><span class="glyphicon glyphicon-chevron-left"></span></a><a class="right carousel-control" href="#carousel-popup" data-slide="next"><span class="glyphicon glyphicon-chevron-right"></span></a></div><script>var thisMarkerPaper';
        
        var popupContent = "<h3>" + thisPaper.title + "</h3>" +
            thisPaper.origin + ",&nbsp;&nbsp;&nbsp;<span id='popupPageCount'>" +
            paperItems[feature.properties.lccn].length.toString() + '</span> pages.<div id="carouselLCCN" lccnVal="'+ feature.properties.lccn +'" />'
            + basicCarousel;
        layer.bindPopup(popupContent);

    }
}

// Nuggets
var nuggets = []; // Time points of each nugget

var setAllNuggetsDim = function(){
    for(var i=0; i < nuggets.length; i++) {
        $('#nuggetId' + i).removeClass('page-section-active');
    }
};

var scrollToToNugget = function(id) {
    setAllNuggetsDim();
    $('#nuggetId' + id).addClass('page-section-active');
    console.log(id);
    $('#nuggetsDiv').scrollTo('#nuggetId' + id, {duration:500});
};

var handleNuggetClick = function(id){
    scrollToToNugget(id);
    var newOuterDate = nuggets[id].startDate;
    console.log('startdate = ' + newOuterDate.toString());
    setMapSliderOuterValue(mapDateSlider, newOuterDate);
}

function radiusFromPageCount(pageCount){
    var radius = 0;
    if (pageCount > 1) {
        radius = 1 + Math.ceil(Math.log(50 * pageCount * pageCount * pageCount));
    } else {
        if (pageCount == 1) {
            radius = 3;
        }
    }
    return radius;
}

function createCountsByPaperByDate(stQueryResults){
    countsByPaperByDate = new Array();
    // Figure out how many bins (years) each paper (with >0 results) needs.
    var startingYear = parseInt(stQueryResults.date1);
    var endingYear = parseInt(stQueryResults.date2);
    console.log('start:' + startingYear.toString());
    console.log('end:' + endingYear.toString());
    console.log('end+1:' + (endingYear+1));
    var numYears = endingYear - startingYear;

    for (var i = 0; i < stQueryResults.stItems.length; ++i) {
        var stItem = stQueryResults.stItems[i];
        var lccn = stItem["lccn"];
        if(countsByPaperByDate[lccn] === undefined) {
            // console.log('Creating bins for ' + lccn);
            var tmpDateBins = [];
            for (var b = 0; b < numYears+1; ++b) {
                tmpDateBins[b] = 0;
            }
            countsByPaperByDate[lccn] = tmpDateBins;
//            console.log('Created ' + numYears + 'bins for lccn ' + lccn);
        }
        var dateOffset = parseInt(stItem.date.substr(0,4)) - startingYear;
        
//        console.log('TBD: inc bin for each year ' + dateOffset) ;
//        console.log('Old val for countsByPaperByDate['+lccn+']['+dateOffset+'] = ' + countsByPaperByDate[lccn][dateOffset]);
        countsByPaperByDate[lccn][dateOffset] = countsByPaperByDate[lccn][dateOffset] +1;
//        console.log('New val for countsByPaperByDate['+lccn+']['+dateOffset+'] = ' + countsByPaperByDate[lccn][dateOffset]);
    }
    countsByPaperByDate_startingYear = startingYear;
    countsByPaperByDate_endingYear = endingYear;
}

function setDateFromSlider(aMapDateSlider) {
    var dateVal = aMapDateSlider.getValue();
    var dateValParts = dateVal.toString().split(',');
    // startingDateBin is 0 for 1836, 1 for 1837, etc., ASSUMING 1836 is first year in our query.
    var startingDateBin = parseInt(dateValParts[0]) - countsByPaperByDate_startingYear;
    var endingDateBin   = parseInt(dateValParts[1]) - countsByPaperByDate_startingYear;
    
    for (var key in countsByPaperByDate) {
        var thisPaperByYear = countsByPaperByDate[key];
        var newval = 0;
        for (var i=endingDateBin; i>=startingDateBin; i--){
            newval = newval + thisPaperByYear[i];
        }
        if (newval >0) {
            //console.log('newval = ' + newval);
        }
        //console.log('old radius = ' + markerArray[key].getRadius());
        if(markerArray[key] === undefined) {
            //console.log("In countsByPaperByDate, no marker for key " + key);
        } else {
            markerArray[key].setRadius( radiusFromPageCount(newval) );
        }
    }    
}

function addDataToMap(stResults, geoJSONData, map) {
    console.log("wubba 001");
    if (stResults !== undefined) {
        markerArray = new Array();  // reset
        
        var adhocLayerExists = false;
        for (var key in dataLayer['adhoc']) {
            console.log("Adhoc has props");
            adhocLayerExists = true;
        }
        
        //if ((!adhocLayerExists) || (typeof dataLayer['adhoc'] === "undefined")) {
        if (typeof dataLayer['adhoc'] === "undefined") {
            console.log("Adhoc data layer undefined :-)");
        } else {
            var myAdhocLayer;
            myAdhocLayer = dataLayer['adhoc'];
    console.log("wubba 002");
            layersControl.removeLayer(myAdhocLayer);
            console.log("Hidden layersControl.removeLayer call");
            map.removeLayer(dataLayer['adhoc']);
        }
        dataLayer['adhoc'] = L.geoJson(geoJSONData, {
            onEachFeature: onEachFeatureBindPaperPopup,
            pointToLayer: function(feature, latlng) {
                var marker = L.circleMarker(latlng, geojsonMarkerOptions);
                // marker.options.radius = 10;
                //console.log('pointToLayer, feature : ' + JSON.stringify(feature));
                var itemsForThisPaper = paperItems[feature.properties.lccn];
                marker.options.radius = radiusFromPageCount(itemsForThisPaper.length);
                markerArray[feature.properties.lccn] = marker;
                return marker;
            }
        });
        dataLayer['adhoc'].addTo(map);
        layersControl.addOverlay(dataLayer['adhoc'], 'AdHoc');
        createCountsByPaperByDate(stResults);
    }
        console.log("wubba end of adddatatomap");

}

function generateMapObjects(stResults) {
    startStopwatch('generateMapObjects');    
    var geoJSONData = [];
    // e.g.  paperItems["sn89070104"].length.toString());
    var featurePerPaper = true; // Do feature per newspaper.
    if (featurePerPaper) {
        paperItems = {}; // paperItems['sn1234'] might = 32, meaning 32 pages matched for that paper.
        if (stResults !== undefined){
            for (var i = 0; i < stResults.stItems.length; i++) {
                var stItem = stResults.stItems[i];
                var id = stItem.lccn.toString();
                if (paperItems.hasOwnProperty(id)) {}
                else {
                    paperItems[id] = new Array();
                }
                paperItems[id].push(stItem);
            }
        }
        $.each(paperItems, function(key, value) {
            var paper = papersLookup[key];
            if (paper) {
                var loc = paper.location;

                var geojsonFeature = {
                    "type": "Feature",
                    "properties": {
                        "lccn": key
                    },
                    "geometry": {
                        "type": "Point",
                        "coordinates": [loc.lng, loc.lat]
                    }
                };

                geoJSONData.push(geojsonFeature);
            }
        });
        // for (var i = 0; i < stResults.stItems.length; i++) {
        //     stItem = stResults.stItems[i];
        //     // var lat = 37;
        //     // var lon = -102;
        //     var paper = papersLookup[stItem.lccn];
        //     // Only attempt to make a point if we have a paper that corresponds.
        //     // If we don't, it is a new paper we don't know about.
        //     if (paper) {
        //         var loc = paper.location;

        //         var geojsonFeature = {...};
        //         geoJSONData.push(geojsonFeature);
        //         //console.log(geoJSONData);    
        //     }
        // }
    }
    else {
        // feature per page
    }
    addDataToMap(stResults, geoJSONData, map); // map is a global var.)
    
    mapAnimationTimer = setTimeout(animateMapFromTimer, mapAnimationTimerDelay);
    endStopwatch('generateMapObjects');    
}

function listenForPopupOpen(e){
    
    var lccn = e.popup._source.feature.properties.lccn;
    //alert('lccn = ' + JSON.stringify(lccn));

    var dateValParts = mapDateSlider.getValue().toString().split(',');
    //alert(dateValParts[0]);
    var startingDate = parseInt(dateValParts[0]);
    var endingDate  = parseInt(dateValParts[1]);
    console.log('startingdate=' + startingDate.toString());
    console.log('endingDate=' + endingDate.toString());

    var totalPages = paperItems[lccn].length;
    var maxPages = Math.min(30, totalPages);  // TOD: fix. Just for now, we don't want to allow a broad search to stick 1,000s of hits in the carousel.
    var numPagesInDateRange = 0;
	var stWordsToHighlightInCA = cleanAndEncodedTerms(); //'motion+picture+Motion+Picture+pictures';
	stWordsToHighlightInCA = stWordsToHighlightInCA.replace('%20', '+');
    for(var i=0 ; ((i< totalPages) && (numPagesInDateRange < maxPages)) ; i++) {
        var thisDate = paperItems[lccn][i].date;
        var thisDateYear = thisDate.substr(0,4);
        if ((thisDateYear >= startingDate) && (thisDateYear <= endingDate)) {
            numPagesInDateRange++;
            var url = paperItems[lccn][i].url;
            var thumbUrl = url.toString().replace('.json', '/thumbnail.jpg');        
            var caUrl = url.replace('.json', '');
            if (stWordsToHighlightInCA !== '') {    
                caUrl = caUrl + '/#words=' + stWordsToHighlightInCA;
            }
            
            $('<div class="item"><a href="' + caUrl + '" target="_blank" ><img class="img-responsive center-block" alt="loading..." height="90" src="'+ thumbUrl +'"></a><br /><center><a target="_blank" href="' + url + '">'+thisDate+'</a></center>   </div>').appendTo('.carousel-inner');
            $('<li data-target="#carousel-popup" data-slide-to="'+i+'"></li>').appendTo('.carousel-indicators')
        }
    }
    $('.item').first().addClass('active');
    $('.carousel-indicators > li').first().addClass('active');
    $('#carousel-popup').carousel({ interval: 0});

    // startingDateBin is 0 for 1836, 1 for 1837, etc., ASSUMING 1836 is first year in our query.
    var startingDateBin = startingDate - countsByPaperByDate_startingYear;
    var endingDateBin   = endingDate - countsByPaperByDate_startingYear;

    var thisPaperByYear = countsByPaperByDate[lccn];
    var newval = 0;
    for (var i=endingDateBin; i>=startingDateBin; i--){
        newval = newval + thisPaperByYear[i];
    }

    $('#popupPageCount').text(newval.toString() );
//    $('#popupPageCount').text(numPagesInDateRange.toString() );
}

var setupMap = function(includeDrawTools) {
    map = L.map('map' );
    var terrainTiles = L.tileLayer.provider('OpenStreetMap'); //OpenTopoMap

    terrainTiles.addTo(map);
    // make it roughly 4:3 or 16:9 ratio wide
    var newHeight = (Math.round($('#map').width() * .65));
    $('#map').height(newHeight);
    if (nuggetsDiv ===undefined) {
    //  Do nothing, we don't have a nuggets pane. Perhaps we are in project.html.
    } else {
        $('#nuggetsDiv').height(newHeight);
    }
    map.setView([38, -94.9005222], 4);
    layersControl = L.control.layers(baseLayers);
    layersControl.addTo(map);

    if (includeDrawTools) {
        console.log('map002');
        // Initialise the FeatureGroup to store editable layers
        var drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);
        console.log('map003');

        // Initialise the draw control and pass it the FeatureGroup of editable layers
        var drawControl = new L.Control.Draw({
            edit: {
                featureGroup: drawnItems
            }
        });
        map.addControl(drawControl);
    
        map.on('draw:created', function (e) {
            var type = e.layerType,
                layer = e.layer;
        
            if (type === 'marker') {
                // Do marker specific actions
            }
        
            // Do whatever else you need to. (save to db, add to map etc)
            //   var shape = layer.toGeoJSON()
            //   var shape_for_db = JSON.stringify(shape);
    //            console.log(shape_for_db);
                map.addLayer(layer);
            
            var shapes = getShapes(drawnItems);
            console.log('Shapes...');
            console.log(JSON.stringify(shapes));
        });
    }
    map.on('popupopen',listenForPopupOpen);

    if(initMapData === undefined) {
    } else {
        initMapData();
    }

    setupMapDateSlider([1836,1922])  ;
}

var setupMapDateSlider = function(aRange){
    $('#startDateLabel').text(aRange[0].toString() );
    $('#endDateLabel').text(aRange[1].toString() );
    console.log("mapTicks = " + JSON.stringify(mapTicks));
    if (mapTicks === undefined) {
        console.log('ticks NOT in use');
        mapDateSlider = $("#mapDateSlider").slider({
            id: 'mapSlider',
            min: aRange[0],
            max: aRange[1],
            range: true,
            tooltip: 'show',
            tooltip_position: 'top',
            tooltip_split: false,
        }).data('slider');
    } else {
        console.log('ticks in use');
        mapDateSlider = $("#mapDateSlider").slider({
            id: 'mapSlider',
            ticks: mapTicks,
            ticks_positions: mapTicksPositions,
            ticks_labels: mapTicksLabels,
            min: aRange[0],
            max: aRange[1],
            range: true,
            tooltip: 'show',
            tooltip_position: 'bottom',
            tooltip_split: false,
        }).data('slider');
    }
    $('#mapSlider').addClass('st-slider');
    $('#mapSlider').addClass('mapSliderClass');
    mapDateSlider.on("slide", function(slideEvt) {
        console.log(JSON.stringify('slide ' + slideEvt));
    	setDateFromSlider(mapDateSlider);
    });      
    mapDateSlider.on("change", updateBigFinalDateTextFromChange);      

}
var updateBigFinalDateTextFromChange = function(changeEvt){
    $('#bigFinalDateText').text(changeEvt.newValue[1]);
}

var getShapes = function(drawnItems) {

    var shapes = [];

    drawnItems.eachLayer(function(layer) {

        // Note: Rectangle extends Polygon. Polygon extends Polyline.
        // Therefore, all of them are instances of Polyline
        if (layer instanceof L.Polyline) {
            shapes.push(layer.getLatLngs());
        }

        if (layer instanceof L.Circle) {
            shapes.push([layer.getLatLng()]);
        }

        if (layer instanceof L.Marker) {
            shapes.push([layer.getLatLng()]);
        }

    });

    return shapes;
};
