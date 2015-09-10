

var chartResult;

var statusColors = {
    "passed" :"#92D050",
    "failed" :"#F37A7A",
    "skipped" :"#FDED72",
    "total" :"#67A4F5",
    "na" :""
};
function generateChart(chartType) {
    var finalResult = {};

    if($j("#tree input[type='checkbox']").size() == 0) {
        $j("#linechart").html("Please get build report to generate the chart.")
        return;
    }
    if(reevaluateChartData){
        chartResult = getChartData(getSelectedRows());
        reevaluateChartData = false;
    }
    resetCharts();
    switch (chartType){
        case "all":
            generateLineChart();
            generateBarChart();
            generatePieChart();
            break;
        case "line":
            generateLineChart();
            break;
        case "bar":
            generateBarChart();
            break;
        case "pie":
            generatePieChart();
            break;
    }

}

function resetCharts(){
    $j("#linechart").html("");
    $j("#barchart").html("");
    $j("#piechart").html("");
}

function _getCategory(buildNumber, buildInfo){
    var category = "";
    if(showBuildDate) {
        var d = new Date(buildInfo.startTime);
            category = d.toLocaleDateString() + " \n " + d.toLocaleTimeString();
        } else {
            category = buildNumber;
        }
    return category;
}

function generateLineChart(){
    var chartCategories = [];
    var chartData ={
        "Failed" : [],
        "Passed" : [],
        "Skipped" : [],
        "Total" : [],
        "Build Id" : []
    };

    for(var key in chartResult) {
        if(chartResult.hasOwnProperty(key)){
            var buildResult = chartResult[key];
            //chartCategories.push(_getCategory(key, buildResult["buildInfo"]));
            var buildInfo = buildResult["buildInfo"];
            chartData["Failed"].push({x: buildInfo["startTime"], y: buildResult["Failed"], buildId: buildInfo["buildNumber"]});
            chartData["Passed"].push({x: buildInfo["startTime"], y: buildResult["Passed"], buildId: buildInfo["buildNumber"]});
            chartData["Skipped"].push({x: buildInfo["startTime"], y:buildResult["Skipped"], buildId: buildInfo["buildNumber"]});
            chartData["Total"].push({x: buildInfo["startTime"], y:buildResult["Total"], buildId: buildInfo["buildNumber"]});
            /*chartData["Build Id"].push([buildResult["buildInfo"]["startTime"],buildResult["buildInfo"]["buildNumber"]]);*/
        }
    }
    $j(function () {$j("#linechart").highcharts('StockChart', getLineChartConfig(chartCategories, chartData))});

}

function generateBarChart(){
    var chartCategories = [];
    var chartData ={
        "Failed" : [],
        "Passed" : [],
        "Skipped" : []
    };

    for(var key in chartResult) {
        if(chartResult.hasOwnProperty(key)){
            var buildResult = chartResult[key];
            chartCategories.push(key);
            chartData["Failed"].push(buildResult["Failed"]);
            chartData["Passed"].push(buildResult["Passed"]);
            chartData["Skipped"].push(buildResult["Skipped"]);
        }
    }

    var barChartData = [
        {
            name: "Passed",
            data: chartData["Passed"]
        },
        {
            name: "Failed",
            data: chartData["Failed"]
        },
        {
            name: "Skipped",
            data: chartData["Skipped"]
        },
    ];
    $j(function () {$j("#barchart").highcharts(getBarChartConfig(chartCategories, barChartData))});
}

function generatePieChart(inputData, resultTitle){
    if(inputData == undefined){
        var total = 0;
        var passed = 0;
        var failed = 0;
        var skipped = 0;
        for(var key in chartResult) {
            if(chartResult.hasOwnProperty(key)){
                total++;
                var buildResult = chartResult[key];
                if(buildResult["Failed"]>0){
                    failed ++;
                } else if(buildResult["Passed"]>0) {
                    passed++;
                } else {
                    skipped ++;
                }
                inputData = calculatePercentage(passed,failed,skipped,total);
            }
        }
    }
    $j(function () {$j("#piechart").highcharts(getPieChartConfig(inputData,resultTitle))})
}

function getChartData(selectedRows) {
    var chartResult = {};
    var baseRows;
    if(selectedRows.size()>0) {
        baseRows = selectedRows;
    } else {
        baseRows = $j("[parentclass='base']");
    }

    $j.each(baseRows, function(index, baseRow){
        var buildResults = $j(baseRow).find(".build-result.table-cell");
        $j.each(buildResults, function(index, buildResult){
            var jsonResult = $j.parseJSON($j(buildResult).attr("data-result"));
            var buildNumber = jsonResult["buildNumber"];
            var tempBuildResult = {
                "Failed" :   jsonResult["totalFailed"]?jsonResult["totalFailed"]:0,
                "Skipped" :   jsonResult["totalSkipped"]?jsonResult["totalSkipped"]:0,
                "Passed" :   jsonResult["totalPassed"]?jsonResult["totalPassed"]:0,
                "Total" :   jsonResult["totalTests"]?jsonResult["totalTests"]:0,
                "buildInfo": jsonResult["buildInfo"]
            };
            if(chartResult[buildNumber]){
                var tempChartBuildResult = chartResult[buildNumber];
                var result = {
                    "Failed": tempChartBuildResult["Failed"] + tempBuildResult["Failed"],
                    "Skipped": tempChartBuildResult["Skipped"] + tempBuildResult["Skipped"],
                    "Passed": tempChartBuildResult["Passed"] + tempBuildResult["Passed"],
                    "Total": tempChartBuildResult["Total"] + tempBuildResult["Total"],
                    "buildInfo": tempChartBuildResult["buildInfo"]
                }
                chartResult[buildNumber] = result;
            } else {
                chartResult[buildNumber] = tempBuildResult;
            }
        });
    });
    return chartResult;
}

function getSelectedRows(){
    var checkedRows = $j("#tree").find(":checked");
    var selectedRows = [];

    checkedRows.each(function(){
        var parentClass = $j(this).attr("parentclass");
        var parent = $j("."+parentClass).find("input[type='checkbox']")
        if($j.inArray(parent.get(0),checkedRows)<0) {
            selectedRows.push($j(this).parent().parent());
        }
    });
    return selectedRows;
}

function getLineChartConfig(chartCategories, chartData){
    var linechart = {

        title: {
            text: 'Build Status',
            x: -20 //center
        },
        rangeSelector: {
             selected: 4
        },
        yAxis: {
            title: {
                text: 'No of tests'
            },
            plotLines: [{
                value: 0,
                width: 2,
                color: '#808080'
            }]
        },
        credits: {
            enabled: false
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle',
            borderWidth: 0
        },
        colors : [statusColors["passed"], statusColors["failed"], statusColors["skipped"],statusColors["total"]]
        ,
        plotOptions: {
            series: {
                cursor: 'pointer',
                point: {
                    events: {
                        click: function (e) {
                            var x1 = this.index;
                            var passed = this.series.chart.series[0].data[x1].y;
                            var failed = this.series.chart.series[1].data[x1].y;
                            var skipped = this.series.chart.series[2].data[x1].y;
                            var total = this.series.chart.series[3].data[x1].y;
                            var resultTitle = 'Build details for build: '+this.buildId;
                            generatePieChart(calculatePercentage(passed,failed,skipped,total),resultTitle);

                        }
                    }
                }
            }
        },
        tooltip : {
            formatter: function () {
                var s = '<span style="font-size: 10px;">' + Highcharts.dateFormat('%a %e-%b-%Y %I:%M:%S %p', this.x) + '</span>';
                    s += '<br/><b>Build Id: </b>' + this.points[0].point.buildId;
                    $j.each(this.points, function () {
                        s += '<br/><b><span style="font-size: 12px;color:'+this.color+';font-weight:bold">'
                        + this.series.name + '</span></b>: '+this.y;
                    });
                    return s;
                                  },
                                  shared: true
                  },
        series: [
        {
            name: 'Passed',
            data: chartData["Passed"]
        }, {
            name: 'Failed',
            data: chartData["Failed"]
        }, {
            name: 'Skipped',
            data: chartData["Skipped"]
        }, {
            name: 'Total',
            data:  chartData["Total"]
        }],
        scrollbar : {
            enabled: true
        }
    }

    return linechart;
}

function getBarChartConfig(chartCategories, chartData){
    var barchart = {
        chart: {
            type: 'bar'
        },
        title: {
            text: 'Build Status',
            x: -20 //center
        },
        xAxis: {
            title: {
                text: 'Build number'
            },
            categories: chartCategories
        },
        yAxis: {
            title: {
                text: 'No of tests'
            },
            plotLines: [{
                value: 0,
                width: 1,
                color: '#808080'
            }]
        },
        colors : [statusColors["passed"], statusColors["failed"], statusColors["skipped"]],
        credits: {
            enabled: false
        },
        tooltip: {
            headerFormat: '<b>Build no: {point.x}</b><br>',
            shared: true,
            crosshairs: true
        },
        legend: {
            reversed: true
        },
        plotOptions: {
            series: {
                stacking: 'normal'
            }
        },
        series: chartData
    }

    return barchart;
}

function calculatePercentage(passed, failed, skipped, total){
    var failedPercentage = (failed * 100)/total;
    var skippedPercentage = (skipped * 100)/total;
    var passedPercentage = (passed * 100)/total;

    return [['Passed',   passedPercentage],
        ['Failed',       failedPercentage],
        ['Skipped',   skippedPercentage]];
}

function getPieChartConfig(inputData, resultTitle){
    var pieChart = {
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: 1,//null,
            plotShadow: false
        },
        credits: {
            enabled: false
        },
        title: {
            text: resultTitle ? resultTitle : 'Build details for all'
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                    style: {
                        color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                    }
                }
            }
        },
        colors : [statusColors["passed"], statusColors["failed"], statusColors["skipped"],statusColors["total"]],
        series: [{
            type: 'pie',
            name: 'Build Detail',
            data: inputData
        }]
    }
    return pieChart;
}