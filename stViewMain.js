// stMain.js
// StoryTrail main code

var projectId ;

var stResults = {};  // we will request

// put papers into lookup table, using lccn as the key.Array
// [ { "lccn": "sn1234567", "title": "Anytown Times" },  ...],

var papersLookup = {};
var stItemsLookup = {};
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

var rawResultsData = 
 {"totalItems":2430297,"terms":"France",
"date1":"1836",
"date2":"1922",
"numChunks":1,"queryTimeUTC":"Tue, 14 Jun 2016 00:22:16 GMT",
"items":["http://chroniclingamerica.loc.gov/lccn/sn83045462/1914-01-04/ed-1/seq-25.json",
"http://chroniclingamerica.loc.gov/lccn/sn83030214/1919-07-13/ed-1/seq-44.json",
"http://chroniclingamerica.loc.gov/lccn/sn83030272/1915-02-14/ed-1/seq-34.json",
"http://chroniclingamerica.loc.gov/lccn/sn83030214/1915-07-25/ed-1/seq-43.json"

,"http://chroniclingamerica.loc.gov/lccn/sn85049554/1905-06-27/ed-1/seq-7.json"
,"http://chroniclingamerica.loc.gov/lccn/sn83045462/1905-06-28/ed-1/seq-16.json"
,"http://chroniclingamerica.loc.gov/lccn/sn88085947/1905-06-28/ed-1/seq-3.json"
,"http://chroniclingamerica.loc.gov/lccn/sn84026749/1905-06-29/ed-1/seq-9.json"
,"http://chroniclingamerica.loc.gov/lccn/sn99063957/1905-06-29/ed-1/seq-5.json"
,"http://chroniclingamerica.loc.gov/lccn/sn83045462/1905-06-29/ed-1/seq-16.json"
,"http://chroniclingamerica.loc.gov/lccn/sn88085947/1905-06-29/ed-1/seq-3.json"
,"http://chroniclingamerica.loc.gov/lccn/sn84026749/1905-06-30/ed-1/seq-6.json"
,
"http://chroniclingamerica.loc.gov/lccn/sn83045462/1915-03-18/ed-1/seq-34.json",
"http://chroniclingamerica.loc.gov/lccn/45043535/1902-09-01/ed-1/seq-27.json",
"http://chroniclingamerica.loc.gov/lccn/sn83045462/1919-05-25/ed-1/seq-76.json",
"http://chroniclingamerica.loc.gov/lccn/sn83045433/1917-11-10/ed-1/seq-9.json"
]}
;
  
var rawResultsData2 = 
 {"totalItems":2430297,"terms":"France",
"date1":"1836",
"date2":"1922",
"numChunks":1,"queryTimeUTC":"Tue, 14 Jun 2016 00:22:16 GMT",
"items":["http://chroniclingamerica.loc.gov/lccn/sn83045462/1914-01-04/ed-1/seq-25.json",
"http://chroniclingamerica.loc.gov/lccn/sn83045433/1917-11-10/ed-1/seq-9.json",
"http://chroniclingamerica.loc.gov/lccn/sn84026749/1918-09-29/ed-1/seq-7.json",
"http://chroniclingamerica.loc.gov/lccn/sn83030214/1918-12-01/ed-1/seq-48.json",
"http://chroniclingamerica.loc.gov/lccn/sn83045433/1917-11-10/ed-1/seq-9.json",
"http://chroniclingamerica.loc.gov/lccn/sn84026749/1918-09-29/ed-1/seq-7.json",
"http://chroniclingamerica.loc.gov/lccn/sn83030214/1918-12-01/ed-1/seq-48.json",
"http://chroniclingamerica.loc.gov/lccn/sn83045433/1917-11-10/ed-1/seq-9.json",
"http://chroniclingamerica.loc.gov/lccn/sn84026749/1918-09-29/ed-1/seq-7.json"
]}
;
  
    
jQuery(function() {
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

    parseDataIntoStResults(rawResultsData, stResults, stItemsLookup, coordinateQueryResultsReceived);
    console.log("stViewMain ready!");
    generateMapObjects(stResults);
    
    // geojsonMarkerOptions.fillColor = 'green';

    if (typeof finalReadyCodeInPublishedPage === "function") { 
        // safe to use the function
        finalReadyCodeInPublishedPage();
    }
    
    console.log("stViewMain Setup done.!");
});