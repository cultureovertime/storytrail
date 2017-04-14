// stMain.js
// StoryTrail main code

var bootbox = bootbox;  // Removes warnings for included file
var barChartData = barChartData;
var barChartNgramData = barChartNgramData;

var $ = $; // To avoid warnings from definitino in external library

var projectId ;
var hash ;

// put papers into lookup table, using lccn as the key.Array
// [ { "lccn": "sn1234567", "title": "Anytown Times" },  ...],

var papersLookup = {};
// HIDE var stItemsLookup = {};
var map;
var dateSlider;

var colorPickerMarkerFill = {};
var defaultColorPickerSettings = 
{
colorSelectors: {
    'Red': 'Red',
    'Orange': 'Orange',
    'Yellow': 'Yellow',
    'Green': 'Green',
    'Blue': 'Blue',
    'Indigo': 'Indigo',
    'Chartreuse': 'Chartreuse',
    'Magenta': 'Magenta',
    '#000': '#000',
    '#333': '#333',
    '#777777': '#777777',
    '#FFF': '#FFF',
    '#FF5600': '#FF5600',
    '#80A446': '#80A446',
    '#d9534f': '#d9534f'
    }
};

// allPagesPerYear is all pages in CA for a given year, 
// whether or not they contain our search terms. 
// They total a bit over 10 million pages for 1836-1922.
var allPagesPerYear = [
2247,
4473,
5584,
7502,
8510,
8026,
10034,
10369,
12394,
13579,
15089,
13122,
14322,
14283,
18609,
22425,
25122,
27739,
29065,
30904,
32873,
33076,
37203,
40093,
41335,
42904,
37852,
35778,
35041,
36284,
52298,
49623,
51100,
49141,
50047,
52828,
56205,
57799,
59583,
59741,
57824,
57579,
62682,
63628,
70003,
73239,
78228,
84972,
92538,
94701,
97321,
104744,
106643,
111440,
130006,
142856,
149642,
153162,
165633,
168827,
184887,
183188,
192420,
207831,
220488,
225808,
234830,
233212,
248773,
264103,
266666,
270307,
271602,
303674,
306065,
271022,
273849,
276488,
279478,
268630,
262935,
261043,
244499,
290071,
278005,
243415,
234624
];


//     // jQuery("#startDate").datepicker();
//     // jQuery("#endDate").datepicker();


var theChart;

var togglePlot = function(seriesLabel) {
    console.log('in togglePlot, ' + seriesLabel);
    if (seriesLabel == 'GB') {
        bootbox.alert("<H3>Google Books</H3>'GB' shows how relatively frequently your search terms show up in books of the time period. StoryTrail pulls in data from the Google Books ngram viewer, showing the relative frequency of your terms over time.");
    }
    if ((seriesLabel == 'Pages') || (seriesLabel == 'CA')) {
        bootbox.alert("<H3>Chronicling America</H3>'CA' shows how relatively frequently your search terms show up in newspaper pages indexed by the <a href='http://chroniclingamerica.loc.gov/'>Chronicling America</a> project. Since CA has indexed more pages in later years (e.g., the 1910s) than in earlier years (e.g., the 1840s), the frequency rates are scaled relative to the number of total pages indexed for that year.<hr /><B>NOTE:</B> This graph can't be considered complete unless you retrieve all the results for the given time period. Click the 'Get More' button until you have retrieved all (or nearly all) of the possible results. If you are searching by Relevance, the more results you retrieve, the better approximation to real usage patterns you will get.");
    }
};

var hoverChartLegendSeries = function(seriesLabel) {
    console.log("in hoverChartLegendSeries");
    console.log("seriesLabel = " + seriesLabel.toString());
};

var drawBarChart = function() {
    //barChartData = [[0, 3], [4, 8], [8, 5], [9, 13]];

    if (barChartData) {
//        console.log("Plotting bar chart...");
        var results = new Array();
        var epochifiedCAData = $.extend(true, [], barChartData);
//        console.log('epochifiedCAData = ' + JSON.stringify(epochifiedCAData));
        
        for(var i=0; i<epochifiedCAData.length; i++){
            var originalDate = epochifiedCAData[i][0];
            var yearsAgo = (epochifiedCAData[i][0]) - 1970;
            epochifiedCAData[i][0] = yearsAgo * 1000 * 31556926;
        }
        results.push({label: "CA", data: epochifiedCAData});

        if (barChartNgramData !== undefined){
            var epochifiedGBData = $.extend(true, [], barChartNgramData);
            for(var i=0; i<epochifiedCAData.length; i++){
                var originalDate = epochifiedGBData[i][0];
                var yearsAgo = (epochifiedGBData[i][0]) - 1970;
                epochifiedGBData[i][0] = yearsAgo * 1000 * 31556926;
            }
            results.push({label: "GB", data: epochifiedGBData});
        }
        if($("#barChartPlaceholder").width() > 0) {
            theChart = $.plot($("#barChartPlaceholder"), results, {
                xaxis: {
                    mode: "time",
                    max: epochifiedCAData[epochifiedCAData.length-1][0]
                },
                highlightColor: 'rgb(19, 200,216)',
                legend: {
                    clickable: true,
                    hoverable: true,
                    labelFormatter: function(label, series) {
                    return '<a href="#" onmouseover="hoverChartLegendSeries(' + "'" + series.label + "'" + ')" onClick="togglePlot(' + "'" + series.label + "'" + '); return false;">' + label + '</a>';
                  },
                },
                grid: {
                    clickable: true,
                    hoverable: true,
                    margin: {
                        right: 0
                    }
                }
            });
        };
        $("#barChartPlaceholder").unbind("plotclick");
        $("#barChartPlaceholder").bind("plotclick", function (event, pos, item) {
            if (item) { 
                //alert("item " + item.dataIndex + " in " + item.series + " clicked"); 
                theChart.highlight(item.series, item.datapoint);
        };
    });        
    }
    else {
        console.log("No barchart data to plot yet.");
    }

}


var handleFailureInGet = function(jqXHR, status, error){
    $('#searchMoreBtn').prop('disabled', false);
    $('#searchManyMoreBtn').prop('disabled', false);
    console.log('failure.')
    if(status == 'parseerror'){
        //not valid json
    } else {
        $('#searchGoBtnSpinner').removeClass('fa fa-refresh fa-spin');
        $('#searchMoreBtnSpinner').removeClass('fa fa-refresh fa-spin');
        $('dateSlider').tooltip.show = "hide";
        bootbox.alert({
            title: 'Hmm... No Answer',
            message: 'There was a problem reaching the server. Please try again, or request a smaller number of rows.'
        });
        $('dateSlider').tooltip.show = "always";
    }
}

// Fire off a new query. On Return, call retrieveQueryAndParse
// to get chunk of results.

var startNewQuery = function(termsURIEncoded, nrows, chunkPos, optionsAsJSON, inManyMoreLoop) {
    $('#searchMoreBtn').prop('disabled', true);
    $('#searchManyMoreBtn').prop('disabled', true);

    console.log('about to start startNewQuery with chunkPos ' + sessionStorage["chunkPos"]);
    var date1 = dateSlider.getValue()[0];
    var date2 = dateSlider.getValue()[1];
    console.log('first part: ' + 'projectId=' + projectId + '&hash=' + hash);
    var optionsAsEncoded = encodeURIComponent(JSON.stringify(optionsAsJSON));
    var queryUrl = cloudURL + '/prod/queryNew?' +
        'projectId=' + projectId +
        '&hash=' + hash +
        '&queryId=adhoc' + '&terms=' + termsURIEncoded + '&nrows=' + nrows + '&chunkPos=' + chunkPos 
        + "&dateFilterType=yearRange"
        + '&date1=' + date1 
        + '&date2=' + date2
        + '&shmoptions=' + optionsAsEncoded
        + '&ignoreme=bah';

    $('#imgPreview').html('');

    jQuery.getJSON(queryUrl,
        function(data) {
            console.log("Received for queryNew call...");
            console.log("data=" + JSON.stringify(data));
            var dataAsJson = JSON.parse(data); //  .replace("'status'", "status"));
            console.log('json says numItems: ' + dataAsJson.numItems.toString() );
            if (data.toString().includes('success')) {
                console.log("Query resulted in success.");
                
                if (inManyMoreLoop) {
                    console.log(Date.now().toString() +": inManyMoreLoop.");
                    updateManyMoreDialog(dataAsJson, true);
                } else {
                    console.log('Okay, now retrieve actual results for what we got...');
                    var query = cloudURL + '/prod/queryResults?' +
                        'projectId=' + projectId +
                        '&hash=' + hash +
                        '&queryId=adhoc';
                    retrieveQueryAndParse(query);
                    console.log('Request sent for all results.');
                }
            }
            else {
                // reset chunkPos for a reattempt
                sessionStorage["chunkPos"] = parseInt(sessionStorage["chunkPos"]) - 1;

                if (inManyMoreLoop) {
                    console.log(Date.now().toString() +': failure to get, wth chunkPos ' + chunkPos.toString() );
                    updateManyMoreDialog(dataAsJson, false);
                } else {
                    // alert(data.errorMessage.toString());
                    bootbox.alert({
                    title: 'Hmm... Some Kind of Problem',
                    message: 'There was this annoying problem: "' 
                    + data.errorMessage.toString()
                    + '". Sorry about that! Please try again.'
                    });
                    //window.location.replace('error.html?err=login');
                }
            }
            $('#searchMoreBtn').prop('disabled', false);
            $('#searchManyMoreBtn').prop('disabled', false);

        }).fail(handleFailureInGet);
}


// Retrieve query results, and parse them into our JSON.
var retrieveQueryAndParse = function(stQueryUrl) {
    var stResults = {
        "stQueryUrl": stQueryUrl
    };
    myStItemsLookup = [];
    jQuery.getJSON(stQueryUrl,
        function(data) {
            parseDataIntoStResults(data, stResults, myStItemsLookup, coordinateQueryResultsReceived);
        }).fail(handleFailureInGet);
}

var dataSetItemsLookups = {};

// Retrieve results of another dataset, not adhoc. Parse them into our JSON.
var retrieveStoredQueryAndParse = function(queryId) {
    var stQueryUrl = cloudURL + '/prod/queryResults?' +
        'projectId=' + projectId +
        '&hash=' + hash +
        '&queryId=' + queryId;

    var stResults = {
        "stQueryUrl": stQueryUrl,
        "queryId" : queryId
    };
    dataSetItemsLookups[queryId] = [];
    console.log('get stored query with ' + stQueryUrl);
    jQuery.getJSON(stQueryUrl,
        function(data) {
            parseDataIntoStResults(data, stResults, dataSetItemsLookups[queryId], coordinateStoredResultsReceived);
        }).fail(handleFailureInGet);
}

var adhocStResults;

// This is for stored results, not the adhoc tab.
var coordinateStoredResultsReceived = function(stResults) {
//    adhocStResults = stResults;
    console.log('coordinateStoredResultsReceived for ' + stResults.queryId.toString() +
            '... Data items = ' + stResults.stItems.length.toString());
    var itemsTableName = 'itemsTable-' + stResults.queryId.toString() ;
    if ($('#' + itemsTableName ).bootstrapTable) {
        $('#' + itemsTableName).bootstrapTable("destroy");
    }
    $('#' + itemsTableName).bootstrapTable({
        data: stResults.stItems
    });
    //alert('table for stored results should be populated now');
//     }).on('click-row.bs.table', function (e, row, $element) {
//         var url = row["url"];
//         var caUrl = url.replace('.json', '');

// 		var stWordsToHighlightInCA = cleanAndEncodedTerms(); //'motion+picture+Motion+Picture+pictures';
// 		stWordsToHighlightInCA = stWordsToHighlightInCA.replace('%20', '+');

//         if (stWordsToHighlightInCA !== '') {    
//             caUrl = caUrl + '/#words=' + stWordsToHighlightInCA;
//         }

//         thumbUrl = url.toString().replace('.json', '/thumbnail.jpg');
//         console.log('url == ' + url);
//         // <div class="row row-md-height">' + '<div class="col-md-2">
//         $('#imgPreview').html('Loading...');
//         $('#imgPreview').html('<a  target="_blank" href="' + caUrl + '"><img width="100%" src="' + thumbUrl + '" /></a>');
//     });
//     $('#itemsTable').bootstrapTable('refresh');
    
//     $('#retrievedBadge').html(stResults.stItems.length.toString());
//     $('#outOfPossible').html(" out of a possible " 
//     + commaSeparateNumber(stResults.totalItems.toString()) 
//     + " items. ");
    
//     // reset ngrams to undefined
//     ngramCountsFromGB = (function () { return; })();
    
//     prepareBarChartData(stResults);
//     drawBarChart();
//     generateScrubChartPlot(stResults);
//     console.log('Before generateMapObjects');
//     var start = new Date().getTime();

//     generateMapObjects(stResults);

//     setupScrubChartEvents();
//     var end = new Date().getTime();
//     var time = end - start;
//     console.log('Execution time: ' + time);
//     console.log('After generateMapObjects');
//     //alert(cleanAndEncodedTerms());
//     retrieveGBStats(cleanAndEncodedTerms(), stResults);
//     console.log('After calling retrieveGBStats.');
}

// This is for adhoc queries only
var coordinateQueryResultsReceived = function(stResults) {
    //console.log('stResults in coordinateQueryResultsReceived...');
    //console.log(JSON.stringify(stResults));
    adhocStResults = stResults;
    if ($('#itemsTable').bootstrapTable) {
        $('#itemsTable').bootstrapTable("destroy");
    }

    $('#searchGoBtnSpinner').removeClass('fa fa-refresh fa-spin');
    $('#searchMoreBtnSpinner').removeClass('fa fa-refresh fa-spin');
    $('#itemsTable').bootstrapTable({
        data: stResults.stItems
    }).on('click-row.bs.table', function (e, row, $element) {
        var url = row["url"];
        var caUrl = url.replace('.json', '');

		var stWordsToHighlightInCA = cleanAndEncodedTerms(); //'motion+picture+Motion+Picture+pictures';
		stWordsToHighlightInCA = stWordsToHighlightInCA.replace('%20', '+');

        if (stWordsToHighlightInCA !== '') {    
            caUrl = caUrl + '/#words=' + stWordsToHighlightInCA;
        }

        thumbUrl = url.toString().replace('.json', '/thumbnail.jpg');
        console.log('url == ' + url);
        // <div class="row row-md-height">' + '<div class="col-md-2">
        $('#imgPreview').html('Loading...');
        $('#imgPreview').html('<a  target="_blank" href="' + caUrl + '"><img width="100%" src="' + thumbUrl + '" /></a>');
    });
    $('#itemsTable').bootstrapTable('refresh');
    
    $('#retrievedBadge').html(stResults.stItems.length.toString());
    $('#outOfPossible').html(" out of a possible " 
    + commaSeparateNumber(stResults.totalItems.toString()) 
    + " items. ");
    
    // reset ngrams to undefined
    ngramCountsFromGB = (function () { return; })();
    
    prepareBarChartData(stResults);
    drawBarChart();
    generateScrubChartPlot(stResults);
    console.log('Before generateMapObjects');
    var start = new Date().getTime();

    generateMapObjects(stResults);

    setupScrubChartEvents();
    var end = new Date().getTime();
    var time = end - start;
    console.log('Execution time: ' + time);
    console.log('After generateMapObjects');
    //alert(cleanAndEncodedTerms());
    retrieveGBStats(cleanAndEncodedTerms(), stResults);
    console.log('After calling retrieveGBStats.');
}

// get ngram stats from Google Books
var retrieveGBStats = function(termsURIEncoded, stResults) {
    var date1 = dateSlider.getValue()[0];
    var date2 = dateSlider.getValue()[1];
    var queryUrl = cloudURL + '/prod/googleBooksStats?' +
        'terms=' + termsURIEncoded
        + '&year_start=' + date1 
        + '&year_end=' + date2;

    jQuery.getJSON(queryUrl,
        function(data) {
            // console.log("Received for googleBooksStats call...");
            // console.log("mydata=" + JSON.stringify(data));
            if (data[0]) {
                // console.log('Okay, data[0] exists...');
                // console.log('ngram = ' + JSON.stringify(data[0].ngram));
                ngramCountsFromGB = data;
                prepareBarChartData(stResults);
                drawBarChart();
                
            }
            else {
                console.log('No data from Google Books.');
            }
        }).fail( console.log('Should handle failure in retrieveGBStats.'));
}



function detailFormatter(index, row) {
    stItem = stItemsLookup[row["url"]];
    var html = [];
    html.push('<p><b>Date:</b> ' + stItem.date + '</p>');
    html.push('<p><b>Title:</b> ' + stItem.title + '</p>');
    html.push('<p><b>URL:</b> ' + stItem.url + '</p>');
    // $.each(row, function (key, value) {
    //     html.push('<p><b>' + key + ':</b> ' + value + '</p>');
    // });
    var results;
    results = html.join('');
    var url = row["url"];
    var caUrl = url.replace('.json', '');
    var thumbUrl = url.toString().replace('.json', '/thumbnail.jpg');
    console.log('url == ' + url);
    // results = '<div class="row row-md-height">' + '<div class="col-md-2"><a  target="_blank" href="' + caUrl + '"><img height="200" src="' + thumbUrl + '" /></a></div>' + '<div class="col-md-9">' + results + '</div></div>';
    results = '<div class="row row-md-height">' + '<div class="col-md-9">' + results + '</div></div>';

    return results;
}

var cleanAndEncodedTerms = function() {
    return encodeURIComponent($('#termsInput').val().trim());    
}

var manyMoreDialog;
var shouldContinueManyMoreRetrieval = false;

var updateManyMoreDialog = function(data, wasSuccess) {
    var width = $('#myprogress').width();
    var parentWidth = $('#myprogress').offsetParent().width();
    var percent = 100*width/parentWidth;

    $('#numRetrieved').text(data.numItems.toString());
    $('#numTotal').text(data.totalItems.toString());

    var realPercentDone = 100 * (data.numItems / data.totalItems);
    if (shouldContinueManyMoreRetrieval){
        document.getElementById("myprogress").style="width: " + realPercentDone.toString() + "%";
        setTimeout(requestChunkForManyMoreDialog(), 21000);
    } else {
        setTimeout(resetManyMoreDialogTexts, 1000);
        manyMoreDialog.modal('hide');
            
        var query = cloudURL + '/prod/queryResults?' +
        'projectId=' + projectId +
        '&hash=' + hash +
        '&queryId=adhoc';
        retrieveQueryAndParse(query);

    }
};

var resetManyMoreDialogTexts = function(){
    $('#manyMoreDialogTitle').text("Retrieving...");
   // $('#numChunksRequested').text("-");
    $('#numRetrieved').text("-");
    $('#numTotal').text("-");
}
var requestCloseManyMoreDialog = function () {
    shouldContinueManyMoreRetrieval = false;
    if ($('#manyMoreDialogTitle').text() == "Finishing up...") {
        // close immediately
        setTimeout(resetManyMoreDialogTexts, 1000);
        manyMoreDialog.modal('hide');
    } else {
        $('#manyMoreDialogTitle').text("Finishing up...");
    }
};
    
var requestChunkForManyMoreDialog = function(){
        // $('#searchMoreBtnSpinner').addClass('fa fa-refresh fa-spin');
        sessionStorage["chunkPos"] = parseInt(sessionStorage["chunkPos"]) + 1;
        console.log('requesting many more data for chunk ' + sessionStorage["chunkPos"]);
        var terms = $('#termsInput').val();
        terms = encodeURIComponent(terms);
        var nrows = parseInt($('#nrows').val());

        var _sort = $('#sortSelect').val();
        var _textType = $('#textTypeSelect').val();
        var optionsAsJSON = {'sort': _sort, 'textType': _textType};
        startNewQuery(terms, nrows, sessionStorage["chunkPos"], optionsAsJSON, true);

}    

var setupManyMoreDialog = function(){
    manyMoreDialog = $('#manyMoreDialog'); 
    shouldContinueManyMoreRetrieval = true;

    manyMoreDialog.modal('show');
    
    $('#manyMoreDialog').on('hidden.bs.modal', function () {
        requestCloseManyMoreDialog();
    })

    requestChunkForManyMoreDialog();
    //setTimeout(updateManyMoreDialog, 50);
};

var handleResize = function(){
    var newHeight = (Math.max(200, 0.4 * $(window).height() ));
    $('#barChartPlaceholder').height(newHeight);
    $('#resultTableDiv').height(newHeight);
    drawBarChart();
    generateScrubChartPlot();
}

window.onresize = function(event) {
    handleResize();
}

// START saving settings
var saveSettings = function(){
    // 1. Collect info into JSON
    // 2. Send off AJAX request to save.
    var settings = {};
    settings.lastSaved = Date.now();
    settings.presentation = {};
    settings.presentation.dataSets = [];
    var ds = settings.presentation.dataSets;
    var dataSet = {};
    dataSet.name = 'adhoc';
    dataSet.fillColor = $('#colorPickerMarkerFill-'+dataSet.name).colorpicker('getValue');
    dataSet.showInMap = true;
    ds.push(dataSet);
    // fake data 
    dataSet = {};
    dataSet.name = 'JWB1858_1868';
    dataSet.fillColor = 'blue';
    dataSet.showInMap = true;
    ds.push(dataSet);
    
    console.log(JSON.stringify(settings));
    console.log('keys... ' + Object.keys(ds));
    sessionStorage["settings"] = JSON.stringify(settings);
    // TBD: save in cloud
};    
// END saving settings
// https://s3.amazonaws.com/storytrailnewspapers/projects/data/testy/queries/JWB1858_1868.json

var configureFromSavedSettings = function(){
    console.log('Starting configureFromSavedSettings.');
    if (sessionStorage.getItem("settings") !== null) {
        var sraw = sessionStorage.getItem("settings");
        var mySettings = JSON.parse(sraw);
        // console.log('raw settings = ' + sraw);
        // console.log('settings = ' + s);
        // console.log('JSONsettings = ' + JSON.parse(s));
        // console.log('JSONsettingsStr = ' + JSON.stringify(JSON.parse(s)));
        console.log('setting for foo = ' + mySettings['foo']);
        
        if (mySettings !== undefined) {
            if (mySettings.presentation !== undefined) {
                console.log('TBD: set fillcolor for each query');
                var dsets = mySettings.presentation.dataSets;
                var thisColorPickerDiv = $('#colorPickerMarkerFill-adhoc');
                var last
                for (var index = 0; index < dsets.length; ++index) {
                    var name = dsets[index].name;
                    console.log('Should set fillColor of ' + name + ' to ' + dsets[index].fillColor);
                    if (name === 'adhoc') {
                        geojsonMarkerOptions.fillColor = dsets[index].fillColor;
                        //colorPickerMarkerFill[name].colorpicker('setValue', geojsonMarkerOptions.fillColor);
                        thisColorPickerDiv = $('#colorPickerMarkerFill-adhoc');
                        $('#colorPickerMarkerFill-adhoc').colorpicker('setValue', geojsonMarkerOptions.fillColor);
                        
                        // check it now 
                        var testcolor = $('#colorPickerMarkerFill-adhoc').colorpicker('getValue');
                        console.log('testcolor = ' + testcolor);
                    } else {
                        // clone #dataSetControls_adhoc, inside #dataSetControlsContainer
                        var newName = 'dataSetControls-' + name;
                        console.log('cloning to make ' + newName);
                        
//var $newDataSetControls = $('#dataSetControls-adhoc').parent().before($("#dataSetControls-adhoc").clone().attr("id",newName));
                        var $newDataSetControls = $('#dataSetControls-adhoc').clone().prop('id', newName);
                        //For each input fields contained in the cloned form...
                        $(" .colorpicker-component", $newDataSetControls).each(function(){
                            $(this).attr("name", "colorPickerMarkerFill-" + name);
                            $(this).attr("id", "colorPickerMarkerFill-" + name);
                        });
                        // dataSetTitle-adhoc
                        $(" .dataSetTitle", $newDataSetControls).each(function(){
                            $(this).attr("name", "dataSetTitle-" + name);
                            $(this).attr("id", "dataSetTitle-" + name);
                            $(this).html(name);
                        });

                        $('#dataSetControls-adhoc').after($newDataSetControls);
                        thisColorPickerDiv = $('#'+newName);
                        var cp = thisColorPickerDiv.find('.colorpicker-component');
                        // Create it
                        colorPickerMarkerFill[name] = $('#'+cp.attr('id')).colorpicker( defaultColorPickerSettings );
                        // Now set it using saved settings
                        $('#'+cp.attr('id')).colorpicker('setValue', dsets[index].fillColor);

    $('#searchTabLink').closest('li').after('<li><a data-target="#dataSetResults-' + name + '" data-toggle="tab" href="#dataSetResults-' + name + '">' + name + '</a></li>');
    var $newTabContents = $('.tab-content').append('<div class="tab-pane" id="dataSetResults-' + name + '">Contact ' + name + ' Form: New Contact  </div>');
                        var $newDataSetResults = $('#dataSetResults-adhoc').clone().prop('id', 'dataSetResults-' + name);
                        //For each input fields contained in the cloned form...
                        // ...
                        //$('#dataSetControls-adhoc').after($newDataSetControls);
                        //alert($('#dataSetResults-adhoc').prop('outerHTML'));

                        $('#dataSetResults-' + name).append($newDataSetResults.html()); // append('<div class="tab-pane" id="dataSetResults-' + name + '">Contact ' + name + ' Form: New Contact  </div>');
                            
                        $('#dataSetResults-' + name + ' #itemsTable').css('background-color', 'gray');
                        $('#dataSetResults-' + name + ' #itemsTable').attr("id","itemsTable-"+name);

                    }
                }
                
                // Fire off requests for each tab's actual data.
                for (var index = 0; index < dsets.length; ++index) {
                    name = dsets[index].name;
                    console.log('Now requesting dataSet records for ' + name + '.');
                    retrieveStoredQueryAndParse(name);
                }                
            }
        }
    }
}


jQuery(function() {
    console.log("Doc ready, preparing...");
    
    if (sessionStorage["name"] && sessionStorage["password"] ) {
        $('#loggedInLinkText').text(sessionStorage["name"]);
        hash = sessionStorage["password"];
        projectId = sessionStorage["name"];
        // alert('hash: ' + hash + ', projectId: ' + projectId);
    }
    else {
        location.href = 'login.html';
    }
    processURLRequestParams();

    dateSlider = $("#dateSlider").slider({
        id: 'projectSlider',
        tooltip: 'always',
        tooltip_position: 'top',
        tooltip_split: true,
    }).data('slider');

    dateSlider.on("slide", function(slideEvt) {
    	mapDateSlider.setAttribute('min', dateSlider.getValue()[0]);
    	mapDateSlider.setAttribute('max', dateSlider.getValue()[1]);
    	mapDateSlider.setValue(dateSlider.getValue());
    	mapDateSlider.refresh();
    	setupMapDateSlider(slideEvt);  // the new selection of dateSlider should be the new range of mapDateSlider.
    });
    
    // does not work --- dateSlider.style( " .slider-selection { background: yellow; }");
    $('#projectSlider').addClass('st-slider');

    $('#searchMoreBtn').prop('disabled', true);
    $('#searchManyMoreBtn').prop('disabled', true);
   
    setupMap(true);  //setupMap(includeDrawTools)

    jQuery('#itemsTable').on('expand-row.bs.table', function(e, index, row, $detail) {
        // console.log('could do get.);')
        // $detail.html('Loading request...');
        // $.get('http//chroniclingamerica.loc.gov/lccn/sn87057262/1920-03-19/ed-1/seq-5/ocr.txt', function (result, status) {
        //     console.log('got...');
        //     console.log(result);
        //     $detail.html(result.replace(/\n/g, '<br>'));
        // });
    });

    jQuery('#searchGoBtn').on('click', function(e) {
        $('#searchGoBtnSpinner').addClass('fa fa-refresh fa-spin');
        console.log("starting call   to retrieveQueryAndParse...");
        var terms = cleanAndEncodedTerms();
        if (terms === '') {
            bootbox.alert("You need to enter something to search for.");
        } else {
            console.log('control terms [' + terms.toString() + ']');
            console.log('about to search with terms [' + terms + ']');
            var nrows = parseInt($('#nrows').val());
            sessionStorage["chunkPos"] = 1; // !!!
    
            var _sort = $('#sortSelect').val();
            var _textType = $('#textTypeSelect').val();
            var optionsAsJSON = {'sort': _sort, 'textType': _textType};
            startNewQuery(terms, nrows, sessionStorage["chunkPos"], optionsAsJSON, false);
        }
        console.log("done with  call to retrieveQueryAndParse.");
    });

    jQuery('#searchMoreBtn').on('click', function(e) {
        $('#searchMoreBtnSpinner').addClass('fa fa-refresh fa-spin');
        sessionStorage["chunkPos"] = parseInt(sessionStorage["chunkPos"]) + 1;
        console.log('More data for chunk ' + sessionStorage["chunkPos"]);
        var terms = $('#termsInput').val();
        terms = encodeURIComponent(terms);
        var nrows = parseInt($('#nrows').val());

        var _sort = $('#sortSelect').val();
        var _textType = $('#textTypeSelect').val();
        var optionsAsJSON = {'sort': _sort, 'textType': _textType};
        startNewQuery(terms, nrows, sessionStorage["chunkPos"], optionsAsJSON, false);
    });

    jQuery('#searchManyMoreBtn').on('click', function(e) {
        setupManyMoreDialog();
    });

    

    var paperCount = papersMeta.papers.length;
    console.log("Found " + paperCount + " newspapers.");

    // generate the lookup table for reuse 
    papersMeta.papers.forEach(function(el, i, arr) {
        papersLookup[el.lccn] = el;
    });
    console.log("ready!");

    jQuery('.dropdown-toggle').dropdown();

    jQuery('.dropdown-menu > li').click(function() {
        var jQuerytoggle = jQuery(this).parent().siblings('.dropdown-toggle');
        jQuerytoggle.html("<i class=\"icon icon-envelope icon-white\"></i> " + jQuery(this).text() + "<span class=\"caret\"></span>")
    });


    colorPickerMarkerFill['adhoc'] = $('#colorPickerMarkerFill-adhoc').colorpicker(
        defaultColorPickerSettings
    );

    var thisColorPicker = $('#colorPickerMarkerFill-adhoc').colorpicker('setValue', geojsonMarkerOptions.fillColor);
    thisColorPicker.on('changeColor', function() {
        var newColor = colorPickerMarkerFill['adhoc'].colorpicker('getValue');
        console.log(Date.now().toString() + ', color changed to ' + newColor);
        geojsonMarkerOptions.fillColor = newColor;
        setMarkersFill(dataLayer['adhoc'], newColor);
        //map.invalidateSize();
        //setupMap(true); // true is showing tools
    });


    $("#barChartPlaceholder").bind("plothover", function (event, pos, item) {
        $("#tooltip").remove();
        if (item) {
        	//alert(JSON.stringify(item.series));
           var extraData = item.series.data[item.dataIndex][2];
           if (extraData) {
               var tooltipText = '---';
               if(extraData.actualPageCount) {
                   tooltipText = 
                       '<br />Pages: ' + extraData.actualPageCount.toString()
                       + '<br />Rate: ' + item.series.data[item.dataIndex][1].toString();
               }
               if(extraData.actualNgramRate) {
                   tooltipText = '<br />Ngram rate: ' + extraData.actualNgramRate.toString();
               }
                //alert(tooltip.toString());
                var dateAsEpoch = item.series.data[item.dataIndex][0];
                var properYear = (dateAsEpoch / (1000 * 31556926)) + 1970;
                var formattedDate = properYear ;
                
                $('<div id="tooltip"><b>' + formattedDate + "</b>"// year
                    + tooltipText + '</div>')
                    .css({
                        position: 'absolute',
                        display: 'block',
                        top: item.pageY + 5,
                        left: item.pageX + 5,
                        border: '1px solid #fdd',
                        padding: '2px',
                        'background-color': '#fee',
                        opacity: 0.80 })
                    .appendTo("body");  //.fadeIn(150);
    
                
           }
        }
    });
    
    
    configureFromSavedSettings(); 

    // Draw bar chart with all zeroes, to show where it will live.
    //console.log('About to call drawBarChart for First time.')
    barChartData = [];
    for (var i = 1836; i != 1923; ++i) barChartData.push([i, 0]);
    drawBarChart();
    
    if (typeof finalReadyCodeInPublishedPage === "function") { 
        // safe to use the function
        finalReadyCodeInPublishedPage();
    }
    handleResize();
    jQuery('#myTab a:first').tab('show');
    $('#searchTabLink').css('cursor', 'pointer');
    $('#presentationTabLink').css('cursor', 'pointer');
    
    // Handle any processing needed by clicking on a particular tab.
    // Here we redraw the bar chart in the search tab, because it
    // can't redraw if we resize while in another tab.
    // The bar chart has width 0 in that case.
    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
      drawBarChart();
    });
    
    console.log("Setup done!");
});