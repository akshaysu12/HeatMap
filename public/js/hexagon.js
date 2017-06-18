window.addEventListener('load', getDataset);

function getDataset()
{
  var summName = document.getElementById('summoner').textContent;
  var champName = document.getElementById('champion').textContent;

  console.log(summName);
  console.log(champName);

  var req = new XMLHttpRequest();
  req.open("GET", "http://dev.akshaysubramanian.com/returnData?name="+ summName +"&champ="+ champName, true);
  req.addEventListener('load', function()
  {
    var res = JSON.parse(req.response);
    var dataset = [];
    for (var i = 0; i < res.length; i++) {
      dataset.push(JSON.parse(res[i].coordinate));
    }
    /*****************
    Function: rotate - This function rotates the dataset to set origin at top right corner instead of
    top left which is default of svg. rotates data clockwise.
    ******************/
    var rotate = function(array)
    {
      var rotatedDataset = []
      for (var i = 0; i < array.length; i++)
      {
        //midpoint = (7325,7280)
        //quadrant 1 rotation
        if (array[i][0] <= 7325  &&  array[i][1] <= 7280)
         {
           var coordinate = []
           coordinate.push(array[i][1])
           coordinate.push(2*(7325 - array[i][0]) + array[i][0])
           rotatedDataset.push(coordinate)
         }
         //quadrant 2 rotation
        else if (array[i][0] <= 7325 &&  array[i][1] >= 7280)
         {
           var coordinate = []
           coordinate.push(array[i][0])
           coordinate.push(2*(7325 - array[i][1]) + array[i][1])
           rotatedDataset.push(coordinate)
         }
         //quadrant 3 rotation
        else if (array[i][0] >= 7325 &&  array[i][1] >= 7280)
         {
           var coordinate = []
           coordinate.push(array[i][1])
           coordinate.push(array[i][0] - 2*(array[i][0] - 7325))
           rotatedDataset.push(coordinate)
         }
         //quadrant 4 rotation
         else
          {
            var coordinate = []
            coordinate.push(array[i][0])
            coordinate.push(array[i][1] - 2*(array[i][1] - 7280))
            rotatedDataset.push(coordinate)
          }
      }
      return rotatedDataset;
    };

    rotatedDataset = rotate(dataset);

    //scales y values from summoner's rift data to corresponding locations on png image
    var xScale = d3.scaleLinear()
                        .domain([-570, 15220])
                        .range([0, 512]);

    //scales y values from summoner's rift data to corresponding locations on png image
    var yScale = d3.scaleLinear()
                        .domain([-420, 14980])
                        .range([0, 512]);


    /*****************
    Function: scale - this function takes the rotated Dataset with inputs from rift points and scales
    them to the 512x512 png image
    *****************/
    var scale = function(array)
    {
      for (var i = 0; i < array.length; i++)
      {
      array[i][0] = xScale(array[i][0]);
      array[i][1] = yScale(array[i][1]);
      }
      return array;
    };

    //create the svg that will be used to place SR image and corresponding data on top of image
    var svg = d3.select("#map").append("svg")
      .attr("width", 512)
      .attr("height", 512)
      .style("border-style", "solid")
      .style("border-width", "5px")
      .style("border-color", "#000000");

    // add png image (SR) to svg
    var img = svg.append("image")
      .attr("xlink:href","/images/minimap.png")
      .attr("width", 512)
      .attr("height", 512)

    // scale data so now both rotatedDataset array and new scaledData array have locations corresponding to
    // 512x512 png image SR
    scaledData = scale(rotatedDataset);

    /*********
    code below is to generate hexagonal binning for points allocated by dataset
    *********/
    //area of hexagon being drawn to encompass points included for hexagonal binning
    var hexbin = d3.hexbin()
      .radius(30);

    //creates arrays of bins that will be used to determine size of hexagons
    var bins = hexbin(scaledData);

    //this creates a new array holding the number of points within each hexagon
    var hexMax = function(binData)
    {
      var max = [];
      for (var i = 0; i < binData.length; i++)
      {
        max.push(binData[i].length)
      }
      return max;
    }
    var maxArray = hexMax(bins);

    //based on maxArray create array that will be used for generating the legend
    var createLegendArray = function(array)
    {
      legendArray = [];
      for(var i = 0; i < array.length; i++)
      {
        var search = false;
        element = array[i];
        for(var r = 0; r < legendArray.length; r++)
        {
          if( array[i] == legendArray[r])
          {
            search = true;
          }
        }

        if (search == false)
        {
          legendArray.push(array[i])
        }
      }

      function sortNumber(a,b)
      {
        return b - a
      }

      legendArray = legendArray.sort(sortNumber);
      return legendArray;
    }

    //creates array with numbers according to legend
    var legendNumbers = createLegendArray(maxArray);

    //create duplicate legend array to use to create the text next to the legend hexagons
    var dupLegNum = legendNumbers;
    dupLegNum.unshift(0);

    //function that uses the unique number of points in bins array to create a dataset that will generate the legends
    var createLegend = function(array)
    {
      var yPos = 50;
      var legend = [];
      for(var i = 0; i < array.length; i++)
      {
        for(var r = 0; r < array[i]; r++)
        {
          legend.push([30, yPos])
        }
        yPos = yPos + 45;
      }
      return legend;
    }

    var legend = createLegend(legendNumbers);

    //hexagon color based on diverging scale of red and blue
    var color = d3.scaleSequential(d3.interpolateRdYlGn )
      .domain([d3.max(bins, function(d) { return d.length; }), 0]);

    //function for scaling opacity by hexagonal binning
    var opacity = d3.scaleSqrt()
      .domain([0, d3.max(maxArray, function(d) { return d; })])
      .range([0.7,0.8]);

    //function for scaling hexagon size by hexagonal binning
    var radius = d3.scaleLinear()
      // max input domain will be the most number of locations within a bin
      .domain([0, d3.max(maxArray, function(d) { return d; })])

      // max output range will be the double the most number of locations within a bin
      // ***** important***** to do: need to establish a minimum that it can't go below.
      .range([0, d3.max(maxArray, function(d) { return 3*d; })]);


    //encodes hexagonal binning by color and by area.
    svg.append("g")
      .selectAll(".hexagon")
      .data(hexbin(scaledData))
      .enter()
      .append("path")
      .attr("class","hexagon")
      .attr("d", hexbin.hexagon())
      .attr("d", function(d)
      {
        return hexbin.hexagon(radius(d.length));
      })
      .attr("transform", function(d)
      {
        return "translate(" + d.x + "," + d.y + ")";
      })
      .style("fill", function(d)
      {
        return color(d.length);
      })
      .style("opacity", function(d)
      {
        return opacity(d.length);
      });

    /*****************************************************************************************************************
    Code for second svg used to create the legend
    *****************************************************************************************************************/
      //create the svg that will hold the legend figures
      /*
      var svg2 = d3.select("#legend").append("svg")
        .attr("x", 512)
        .attr("y", 0)
        .attr("width", 100)
        .attr("height", 512)

      svg2.append("g")
        .selectAll(".hexagon")
        .data(hexbin(legend))
        .enter()
        .append("path")
        .attr("class","hexagon")
        .attr("d", hexbin.hexagon())
        .attr("d", function(d)
        {
          return hexbin.hexagon(radius(d.length));
        })
        .attr("transform", function(d)
        {
          return "translate(" + d.x + "," + d.y + ")";
        })
        .style("fill", function(d)
        {
          return color(d.length);
        })
        ;

      var count = 0;
      var createTextLegend = function(array)
      {
        var yPos = 95;
        var legend = [];
        for(var r = 0; r < array.length; r++)
        {
          legend.push([60, yPos]);
          yPos = yPos + 45;
        }

        return legend;
      }

      var textData = createTextLegend(dupLegNum);

      svg2.selectAll("text")
        .data(textData)
        .enter()
        .append("text")
        .text(function(d)
        {
          count = count + 1;
          return dupLegNum[count];
        })
        .attr("x", function(d)
        {
          return d[0];
        })
        .attr("y", function(d)
        {
          return d[1];
        })
        .style("font-size", "20px");

        */
  });
  req.send(null);
}
