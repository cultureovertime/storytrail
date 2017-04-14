// stMain.js
// StoryTrail main code

var projectId ;
var $ = $;
var stResults = {};  // we will request

// put papers into lookup table, using lccn as the key.Array
// [ { "lccn": "sn1234567", "title": "Anytown Times" },  ...],

var papersLookup = {};
var myStItemsLookup = {};
var map;

var coordinateQueryResultsReceived = function(stResults) {
    console.log('Before generateMapObjects');
    var start = new Date().getTime();

    generateMapObjects(stResults);

    var end = new Date().getTime();
    var time = end - start;
    console.log('Execution time: ' + time);
    console.log('After generateMapObjects');
}

var doGutsOfReady = function(){
    console.log("View ready, preparing...");
    processURLRequestParams();

    window.onresize = function(event) {
        // resize anything?
    }

    setupMap(false); //setupMap(includeDrawTools)

    var paperCount = papersMeta.papers.length;
    console.log("Found " + paperCount + " newspapers.");

    // generate the lookup table for reuse 
    papersMeta.papers.forEach(function(el, i, arr) {
        papersLookup[el.lccn] = el;
    });

    parseDataIntoStResults(rawResultsData, stResults, myStItemsLookup, coordinateQueryResultsReceived);
    
    console.log("stDemoMain ready!");
    generateMapObjects(stResults);
    
    if(finalReadyCodeInPublishedPage === undefined) {
    } else {
        finalReadyCodeInPublishedPage();
    }
    console.log("stDemoMain Setup done.!");
}

jQuery(function() {
    doGutsOfReady();    
});