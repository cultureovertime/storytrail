var $ = $;
var cloudURL = 'https://b1jg99vnq6.execute-api.us-east-1.amazonaws.com';
var mapDateSlider = mapDateSlider;
var setDateFromSlider = setDateFromSlider;
// https://b1jg99vnq6.execute-api.us-east-1.amazonaws.com/prod/saveSettings
var barChartData;
var barChartNgramData;
var ngramCountsFromGB;
    
var ToggleRouter = function() {
    var featureConfig = {};

    return {
           setFeature : function(featureName,isEnabled) {   
               featureConfig[featureName] = isEnabled;
           },
           featureIsEnabled : function(featureName) {
                var fie = featureConfig[featureName];
                if (fie === undefined) {
                	return false;
                } else {
                	return fie;
                }
           }
     }
};

var toggleRouter = new ToggleRouter();
// myToggleRouter.setFeature('foo',true);
// alert('foo is ' + myToggleRouter.featureIsEnabled('foo').toString());

var stopwatchNameStarts = {}; // {'myfuncname': 12345464564}
var startStopwatch = function(swName) {
    stopwatchNameStarts[swName] = Date.now();
}   
var endStopwatch = function(swName) {
    var startTime = stopwatchNameStarts[swName];
    var ticks = Date.now() - startTime;
    console.log(Date.now().toString() + '  ' + swName +': ' + ticks.toString()+'.');
}   

var prepareBarChartData = function(stQueryResults) {
    barChartData = [];
    //    for (var i = 1836; i != 1923; ++i) barChartData.push([i, 3+Math.random()+Math.sin(i)]);
    var tmpDateBins = [];
    var startingYear = parseInt(stQueryResults.date1);
    var endingYear = parseInt(stQueryResults.date2);
    //console.log('start:' + startingYear.toString());
    //console.log('end:' + endingYear.toString());
    //console.log('end+1:' + endingYear+1);
    var numYears = endingYear - startingYear;
    for (var i = 0; i < numYears+1; ++i) {
        tmpDateBins[i] = 0;
    }

    var numItems = stQueryResults.stItems.length;
    if (numItems > 0) {
        for (var i = 0; i != stQueryResults.stItems.length; ++i) {
            var item = stQueryResults.stItems[i];
            //console.log('prepareBarChartData loop:' + JSON.stringify(item));
            var year = parseInt(item["date"].toString().substr(0,4));
            //console.log('prepareBarChartData year:' + year);
            var tmpDateBin = year - startingYear;
            //console.log('bin=' + tmpDateBin.toString());
            if ((tmpDateBin >= 0) && (tmpDateBin <= numYears)) {
                tmpDateBins[tmpDateBin] = tmpDateBins[tmpDateBin] + 1 ;
                
                //console.log('tmpDateBins[' + tmpDateBin.toString() + '] = ' + tmpDateBins[tmpDateBin].toString());
            }
            else {
                alert('Error in years in prepareBarChartData');
            }
        }
    }
    barChartData = [];
    var maxPageCount = 0;
    var maxScaledPageCountAsRate = 0;
    for (var yr = startingYear; yr != endingYear; ++yr) {
        var thisPageCount = tmpDateBins[yr - startingYear];
        var scaledPageCountAsRate = thisPageCount / allPagesPerYear[yr - 1836];
        barChartData.push([yr, scaledPageCountAsRate, {"actualPageCount": thisPageCount}]);
        if (thisPageCount > maxPageCount) {
            maxPageCount = thisPageCount;
        }
        if (scaledPageCountAsRate > maxScaledPageCountAsRate) {
            maxScaledPageCountAsRate = scaledPageCountAsRate;
            // console.log('new maxScaledPageCountAsRate = ' + maxScaledPageCountAsRate.toString());
        }
    }

    if (ngramCountsFromGB !== undefined) {
        var maxNgramRate = 0;
        // Let's add ngrams.
        barChartNgramData = [];
        // Fnd maximum value, so we can scale
        for (var yrBin = 0; yrBin != numYears; ++yrBin) {
            var thisNgramRate = ngramCountsFromGB[0].timeseries[yrBin];
            if (thisNgramRate > maxNgramRate) {
                maxNgramRate = thisNgramRate;
            }
        }
        // Save the data in scaled form.
        console.log('calc with maxScaledPageCountAsRate = ' + maxScaledPageCountAsRate.toString());
        console.log('calc with maxNgramRate = ' + maxNgramRate.toString());
        
        var ngramToPageScale = maxScaledPageCountAsRate / maxNgramRate;
        for (var yrBin = 0; yrBin != numYears; ++yrBin) {
            thisNgramRate = ngramCountsFromGB[0].timeseries[yrBin];
            // console.log('xyz thisNgramRate = ' + thisNgramRate.toString());
            barChartNgramData.push([yrBin+startingYear, ngramToPageScale * thisNgramRate, {"actualNgramRate": thisNgramRate}]);
            // console.log('xyz ngramToPageScale * thisNgramRate = ' + (ngramToPageScale * thisNgramRate).toString());
        }


    };
};


function commaSeparateNumber(val){
    while (/(\d+)(\d{3})/.test(val.toString())){
      val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
    }
    return val;
  }
  
//   function getRange(start, end) {
//   var range = [];

//   for (var i = start; i < end; i++) {
//     range.push(i);
//   }

//   return range;
// }

// var years = getRange(1950, 1961); // [1950,..., 1960]

var stWordsToHighlightInCA = '';

// Take URL in form http://chroniclingamerica.loc.gov/lccn/sn83030431/1917-02-11/ed-1/seq-17.json
// and break it into date, lccn, and seg.
// Then do papersLookup[lccn].title to get the title.
var parseChronAmURL = function(chronAmPageUrl, stItemsLookup) {
    //console.log("chronAmPageUrl = " + chronAmPageUrl + "<hr />");
    var parts = chronAmPageUrl.split("\/");
    // &#8209; is a non-breaking hyphen.
    // parts[5].toString().replace(/\-/g, "&#8209;"
    
    // If a new paper is added at LOC, we need to not die on it.
    var paper = papersLookup[parts[4]];
    var displayTitle = "unknown:" + parts[4];
    if (paper) {
        displayTitle = paper.title;
    }
    
    var stItem = {
        "date": parts[5],
        "lccn": parts[4],
        "seg": parts[7],
        "title": displayTitle,
        "url": chronAmPageUrl
    }
    //console.log("TITLE = " + stItem.title);
    stItemsLookup[stItem.url] = stItem;
    return stItem;
}

var processURLRequestParams = function() {
    var $_GET = {};
    document.location.search.replace(/\??(?:([^=]+)=([^&]*)&?)/g, function() {
        function decode(s) {
            return decodeURIComponent(s.split("+").join(" "));
        }

        $_GET[decode(arguments[1])] = decode(arguments[2]);
    });

    // projectId = $_GET["projectId"];
    // hash = $_GET["hash"];
    //alert('Test. projectId=' + projectId);
    //alert('Test. hash=' + hash);
}

function parseDataIntoStResults(data, stResults, stItemsLookup, coordinationFunction){
    stResults.stItems = new Array();
    stResults.totalItems = data.totalItems;
    stResults.date1 = data.date1;
    stResults.date2 = data.date2;
    stResults.terms = data.terms;
    stResults.numChunks = data.numChunks;
    stResults.queryTimeUTC = data.queryTimeUTC;
    //alert(stResults.terms + ", chunks=" + stResults.numChunks.toString() +", data UTC=" + data.queryTimeUTC);
    // console.log('=====> stResults = ' + JSON.stringify(stResults));
    // console.log('=====> data = ' + JSON.stringify(data));
    //alert(data.items.length.toString() +", data UTC=" + data.queryTimeUTC);

    //alert('wrote stResults to console');
    var items = data.items;
    if (items && items.length) {
        for (var i = 0; i < items.length; i++) {
            var stItem = parseChronAmURL(items[i], stItemsLookup); // was ".url"
            stResults.stItems.push(stItem);
        }
        //coordinateQueryResultsReceived(stResults, stItemsLookup);
        coordinationFunction(stResults, stItemsLookup);
    }
    else {
        console.log("ERROR??? No results.")
        console.log('Attempted parseDataIntoStResults with ' + stResults.queryId );
        console.log("Examine Data: " + JSON.stringify(data));
    }
}

// BEGIN Scrub Chart

var currentScrubHighightIndex = -1;
var scrubChartPlot;

var generateScrubChartPlot = function() {
    var a1 = [
        [0, 100],
        [1, 200],
        [2, 300],
        [3, 320],
        [4, 500],
        [5, 470],
        [6, 440],
        [7, 465],
        [8, 463],
        [9, 460],
        [10, 451],
        [11, 437]

    ];


    //var ticks=[[0,"Overall"],[1,"SEA"],[2,"INDIA"],[3,"NEA"],[4,"PZ"]];
    var data = [{
        label: "Pre Transformation",
        data: a1
    }];

    if(barChartData) {
        //console.log("bcd in genscrub " + JSON.stringify(barChartData));
        a1 = barChartData;
        // data[0][0]=0;
        // data[1][0]=1;
        // data[2][0]=2;
        data = [{
            label: "Pre Transformation",
            data: a1
        }];
        //console.log("bcd cleaned in genscrub " + JSON.stringify(barChartData));
        scrubChartPlot = $.plot($("#scrubChart"), data, {
            series: {
                bars: {
                    show: true,
                    order: 1
                }
            },
            grid: {
                hoverable: true,
                clickable: true
            },
            legend: {
                show: false
            },
            yaxis: {
                show: false
            },
            xaxis: {
                show: false
            }
        });
    } else {
        console.log('no bcd in genscrub');
    }
        
}

var oldMapSliderRange;
var scrubClickSelection = function(index) {
      console.log('scrubClickSelection with ' + index + ' at ' + Date.now().toString());
    // If we click on a scrubbed column, treat that as the new range.
    oldMapSliderRange = mapDateSlider.getValue();
}

var scrubRememberOldSelection = function() {
    console.log('scrubRememberOldSelection at ' + Date.now().toString());
    oldMapSliderRange = mapDateSlider.getValue();
}

var scrubSetNewSelection = function(index) {
    console.log('scrubSetNewSelection to ' + index + ' at ' + Date.now().toString());
    mapDateSlider.setValue([index,index], false, true);
    setDateFromSlider(mapDateSlider);
}

var scrubClearSelection = function() {
    console.log('scrubClearSelection at ' + Date.now().toString());
    mapDateSlider.setValue(oldMapSliderRange, false, true);
    setDateFromSlider(mapDateSlider);
}

var setupScrubChartEvents = function() {

    $( "#scrubChart" ).click(function() {
      if (currentScrubHighightIndex >= 0) {
      	scrubClickSelection(currentScrubHighightIndex);
      };
    });
    
    $( "#scrubChart" ).mouseenter(function() {
      scrubRememberOldSelection();
    });
    
    $( "#scrubChart" ).mouseleave(function() {
      scrubChartPlot.unhighlight(); 
      currentScrubHighightIndex = -1;
      scrubClearSelection();
    });
    
    $("#scrubChart").on("plothover", function (event, pos, item) {
//            console.log('hover ' + Date.now().toString());
        var dataset = scrubChartPlot.getData();
        var series = dataset[0];
        var seriesDataLength = dataset[0].data.length;
    
        var itemIndex = Math.floor(pos.x);
        var sliderRange = [mapDateSlider.options.min, mapDateSlider.options.max];

    	if ((itemIndex >= sliderRange[0]) && (itemIndex <= sliderRange[1])) {
          if (itemIndex != currentScrubHighightIndex) {
    		scrubChartPlot.unhighlight(); 
          	currentScrubHighightIndex = itemIndex;
            scrubChartPlot.highlight(dataset[0], series.data[currentScrubHighightIndex-sliderRange[0]][0]);
            scrubSetNewSelection(itemIndex);
          };
    	}
    });
};

// END Scrub Chart


