var app = angular.module('test', ['smart-table','ngTagsInput','xeditable','ui.bootstrap']);
app.controller('MainCtrl', ['$scope', '$http', '$filter', '$timeout',function ($scope,$http, $filter, $timeout) 
{
    //variables to control displays
    $scope.graphingInterface = 'false';
    $scope.errorInFormEntry = 'false';
    $scope.pageLoading = 'false';

    //variables to control form entry for array id
    $scope.username="";
    $scope.password="";
    
    //variables to keep track of what is selected in the dropdowns
    $scope.yValues = [];
    $scope.xValues = [];
    
    //variables to keep track of all data sets (data_set_titles[i] corresponds with myDataSets[i])
    $scope.myDataSets = [];//array of data sets
    $scope.data_set_titles = [];//names of the data sets
    
    //variables for custom data sets and math
    $scope.customTitle = "";
    $scope.formula = "";
    
    //--------------------------------------------------------------------------------------------------- 
    //populate the x, y dropdown menus and read in the JSON data
    $scope.compiler = function()
    {
        $scope.pageLoading = 'true';//disable submit button, show loading spinner
        
        document.getElementById("submitbtn").disabled = 'true';
        $http.get('https://raw.githubusercontent.com/biobotsdev/biobots-coding-challenge-2015/master/bioprint-data.json').success(function(data) {
            if (data =='null')
            {
                //console.log ("err");
            }
            else 
            {
                $scope.data_set_titles.push("livePercent", "elasticity", "deadPercent", "input", "output", "extruder1", "extruder2", "cl_enabled", "cl_duration", "cl_intensity", "layerNum", "layerHeight", "wellplate");
                
                //create an empty array for each data set
                $scope.data_sets = [];
                for(var i = 0; i < $scope.data_set_titles.length; i ++)
                {
                    $scope.data_sets[i] = [];
                }

                //go through each object
                for (key in data)
                {
                   for (var j = 0; j < $scope.data_set_titles.length; j ++)
                    {
                        //put the data point in the correct data set
                        if (key.toString() === $scope.data_set_titles[j].toString())
                        {
                             $scope.data_sets[j].push(parseInt(val[key]));
                        }
                    }          
                }

                //push all the data sets to a class scope variable "myDataSets" 
                for(var m = 0; m < $scope.data_set_titles.length; m ++)
                {
                    $scope.myDataSets.push($scope.data_sets[m]);
                }

                //change views
                $scope.pageLoading = 'false';
                $scope.errorInFormEntry = 'false';
                $scope.graphingInterface = 'true';
            }
        })
        .error(function(xhr, status, error, message)
        {
            $scope.errorInFormEntry = 'true';
            if(status != "200")
            {
                if (document.getElementById("errStatus") != null)
                {
                    document.getElementById("errStatus").remove();
                }
                var newLabel = document.createElement('label');
                newLabel.innerHTML = '<label ng-show="errorInFormEntry" id="errStatus" class="colorRed">status '+status+', '+ xhr["message"]+'</label>';
                document.getElementById("errMsg").appendChild(newLabel);
            }
            document.getElementById("submitbtn").disabled = false;
            $scope.pageLoading = false;
        });
    }
    
    //calculate the average value for a certain dataset
    $scope.getAverage = function(variableName)
    {
        $scope.sum = 0;
        for (var j = 0; j < $scope.data_set_titles.length; j ++)
        {
            if (variableName.toString() === $scope.data_set_titles[j].toString())
            {
                for (var k = 0; k < $scope.myDataSets[0].length; k ++)
                {
                    sum = sum + $scope.myDataSets[j][k];
                }
            }
        } 
    }
    
    //functions to analyze data by wellplate number
    $scope.wellData = function(number)
    {
        $scope.wellSets = [][];
        for (var k = 0; k < $scope.myDataSets[0].length; k ++)
        {
            if(Number($scope.myDataSets[$scope.data_set_titles.length - 1][k]) == number)
            {
                newSet = [];
                for (var n = 0; n < $scope.data_set_titles.length; n++)
                {
                    newSet.push($scope.myDataSets[n][k]);
                }
                wellSets.push(newSet);
            }   
        }
    }
    
//would want to add a function to analyze samples depending on whether or not they have a crosslinker
    
    //deals with mathematical opperations performed on data sets (i.e. livePercent + deadPercent, or livePercent*100)
    $scope.customData = function()
    {   
        $scope.newSet = [];
        var pattern = $scope.formula.toString();
        for (var i = 0; i < $scope.data_set_titles.length; i ++)
        {
            var reg = new RegExp($scope.data_set_titles[i].toString(), 'g');
            pattern = pattern.replace(reg, "($scope.myDataSets["+i.toString()+"][j])");
        }
        
        for (var j = 0; j < $scope.myDataSets[0].length; j ++)
        { 
            var nextDatum = eval(pattern);
            if (nextDatum != null && isNaN(nextDatum) === false && nextDatum != Infinity)
            {
                $scope.newSet[j] = eval(pattern);
            }
            else
            {
                $scope.newSet[j] = 0;
            }
        }
        
        if($scope.newSet.length >0)
        {
            $scope.myDataSets.push($scope.newSet);
            $scope.formula = "";
        
            $scope.data_set_titles.push($scope.customTitle);
            $scope.customTitle = "";
        }
        else//need to add a GUI alert for formula errors
        {
            $scope.formula = "";
            $scope.customTitle = "";
        }
    }
    
    //creates Highcharts charts on which data sets can be plotted
    $scope.graphing = function(graphNumber)
    {
        if ($scope.xValues[graphNumber] != null && $scope.yValues[graphNumber] != null)//wait until both x and y axes are selected by the user
        {
            //determine which data sets we are using 
            for (var j = 0; j < $scope.data_set_titles.length; j ++)
            {
                if ($scope.xValues[graphNumber].toString() === $scope.data_set_titles[j].toString())
                {
                    $scope.xData = $scope.myDataSets[j];
                }
                if ($scope.yValues[graphNumber].toString() === $scope.data_set_titles[j].toString())
                {
                    $scope.yData = $scope.myDataSets[j];
                }
            }
            
        {
                 $('#container'+ (graphNumber).toString()).highcharts({
                    chart: {
                        renderTo: "container",
                        spacingLeft:40,
                        zoomType: 'xy'
                    },
                    title: {
                        text: $scope.yValues[graphNumber].toString() + ' versus ' + $scope.xValues[graphNumber].toString(),
                        x: -20 //center
                    },
                    subtitle: {
                        text: 'Array: ' + $scope.id,
                        x: -20
                    },
                    xAxis: {
                        title: { text: $scope.xValues[graphNumber].toString(),},
                    },
                    yAxis: {
                        title: {
                        text: $scope.yValues[graphNumber].toString(),
                        },
                        min: 0,
                        lineWidth: 1,
                        gridLineWidth:0
                    },
                    plotOptions:{
                        series: {
                            turboThreshold: 40000,
                            animation: false,
                            pointStart: 0,
                            marker: {
                                radius: 5
                            }
                        }
                    },
                    tooltip: {
                        enabled: true,
                        pointFormat: $scope.xValues[graphNumber].toString() + ': <b>{point.x}</b><br/>' + $scope.yValues[graphNumber].toString() + ': <b>{point.y}</b><br/>'
                    },
                    plotLines: [{
                        value: 0,
                        width: 1,
                        color: '#808080'
                    }],
                    credits: {
                        enabled: false
                    },
                    series: [{
                        showInLegend: false,
                        name: "",
                        data: $scope.getCoords($scope.xData, $scope.yData)
                    }]
                });
            }
        }
    }
    
    //returns array of (x, y) points for the charts sorted in ascending order of the x-value
    $scope.getCoords = function (xData, yData)
    {
        var coords= [];
        for (var i = 0; i < xData.length; i++)
        {
            coords.push([xData[i], yData[i]]);
        }
        coords = coords.sort(sortFunction);

        function sortFunction(a, b) {
            if (a[0] === b[0]) 
            {
                return 0;
            }
            else 
            {
                return (a[0] < b[0]) ? -1 : 1;
            }
        }
        
        return coords;
    }
    
    //delete a single graph
    $scope.deleteGraph = function(val)
    {
        document.getElementById('graphWrapper'+(val).toString()).remove();
    }

    //go back to the user entry page, reset a lot of variables
    $scope.goBack = function()
    {
        //reset the input screen
        $scope.pageLoading = 'false';
        $scope.errorInFormEntry = 'false';
        $scope.graphingInterface = 'false';
        $scope.yValues = [];
        $scope.xValues = [];
        $scope.myDataSets = [];
        $scope.data_set_titles = []; 
        $scope.customTitle = "";
        $scope.formula = "";
        document.getElementById("submitbtn").disabled = false;
        //reset the graphing screen
        if ($scope.graphCount > 0)
        {
            document.getElementById("container0").innerHTML = "";
            for(var i = 1; i <= $scope.graphCount; i ++)
            {
                if(document.getElementById("graphWrapper"+(i).toString()) != null)
                {
                    document.getElementById("graphWrapper"+(i).toString()).remove();
                }
            }
        }
        else
        {
            if(document.getElementById("container0") != null)
            {
                document.getElementById("container0").innerHTML = "";
            }
        }
        
        document.getElementById("errMsg").innerHTML = "";
        $scope.graphCount = 0;
    }
}]);

//button to add graphs, calls "addbuttons" directive on click
app.directive("addgraphsbutton", function(){
	return {
		restrict: "E",
		template: "<button class='btn btn-info btn-xs' addbuttons>Add Graph</button>"
	}
});

//appends a new graph 
app.directive("addbuttons", function($compile){
	return function(scope, element, attrs){
		element.bind("click", function(){
			scope.graphCount++;
			angular.element(document.getElementById('space-for-buttons')).append($compile(
            "<div id='graphWrapper"+scope.graphCount+"'>"+
                "<label class='padding'>  X Axis: </label>"+
                "<select class='padding' ng-model = 'xValues["+scope.graphCount+"]' ng-change = 'graphing("+scope.graphCount+")'>"+
                    "<option ng-repeat='titles in data_set_titles' value='{{titles}}'>{{titles}}</option>"+
                "</select>"+

                "<label class='padding'>  Y Axis: </label>"+
                "<select class='padding' ng-model = 'yValues["+scope.graphCount+"]' ng-change = 'graphing("+scope.graphCount+")'>"+
                    "<option ng-repeat='titles in data_set_titles' value='{{titles}}'>{{titles}}</option>"+
                "</select>"+
                "<button class='btn btn-info btn-xs padding' data-toggle='modal' data-target='#myModal'>Custom Data Set</button>"+
                "<button class='btn btn-info btn-xs padding' ng-click = 'deleteGraph("+scope.graphCount+")'>Delete Graph</button>"+
                
                "<div id='myModal' class='modal fade' role='dialog'>"+
                    "<div class='modal-dialog'>"+
                    "<div class='modal-content'>"+
                        "<div class='modal-header'>"+
                            "<h4 class='modal-title'>This will be an option in the dropdown:</h4>"+
                            "<div class='modal-body'>"+
                                "<form>"+
                                "<div class='form-group, spacer'>"+
                                    "<label>Title</label>"+
                                    "<input type='text' class='form-control' placeholder='Data Set Title' ng-model='customTitle'>"+
                                "</div>"+
                                "<div class='form-group, spacer' id='expressionBuilder'>"+
                                    "<label>Build Expression</label>"+
                                    "<input type='text' class='form-control' placeholder='Expression (example: writes/100)' id ='exp0' ng-model='formula'>"+
                                "</div>"+
                                "<br><br><button type='button' class='btn btn-success' ng-click='customData()' data-dismiss='modal'>Save</button>"+  
                                "<button type='button' class='btn btn-danger' data-dismiss='modal'>Cancel</button>"+
                                "</form>"+
                            "</div>"+
                          "</div>"+
                        "</div>"+
                    "</div>"+
                "</div>"+
                "<div id='container"+((scope.graphCount).toString())+"' class='spacer' ></div>"+
            "<div>"
            )(scope));
            scope.$apply();
		});
	};
});