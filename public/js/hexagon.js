window.addEventListener('load', getDataset("blue"));

document.getElementById('switchData').addEventListener('click', function() {
  var text = document.getElementById('switchData').textContent;
  //var svg = d3.select("#map");
  var svg = d3.select("svg");
  if (text == "Purple Side") {
    document.getElementById('switchData').textContent = "Blue Side";
    svg.selectAll("#blue").remove();
    changeData("purple", svg);
  }
  else {
    document.getElementById('switchData').textContent = "Purple Side";
    svg.selectAll("#purple").remove();
    changeData("blue", svg);
  }
})

/*****************
Function: rotate - This function rotates the dataset to set origin at top right corner instead of
top left which is default of svg. rotates data clockwise.
******************/
function rotate(array)
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


function changeData(side, svg)
{
  var summName = document.getElementById('summoner').textContent;
  var champName = document.getElementById('champion').textContent;

  console.log(summName);
  console.log(champName);

  var req = new XMLHttpRequest();
  req.open("GET", "http://lolheatmap.com/returnData?name="+ summName +"&champ="+ champName + "&side=" + side, true);
  req.addEventListener('load', function()
  {
    var res = JSON.parse(req.response);
    var dataset = [];
    for (var i = 0; i < res.length; i++) {
      dataset.push(JSON.parse(res[i].coordinate));
    }

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

    // scale data so now both rotatedDataset array and new scaledData array have locations corresponding to
    // 512x512 png image SR
    scaledData = scale(rotatedDataset);
    console.log("data", scaledData)

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

    //var svg = d3.select("#image");

    //encodes hexagonal binning by color and by area.
    svg.append("g")
      .selectAll(".hexagon")
      .data(hexbin(scaledData))
      .enter()
      .append("path")
      .attr("class","hexagon")
      .attr("d", hexbin.hexagon())
      .attr("id", side)
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

  });
  req.send(null);
}

function getDataset(side)
{

  //create the svg that will be used to place SR image and corresponding data on top of image
  var svg = d3.select("#map").append("svg")
    .attr("width", 512)
    .attr("height", 512)
    .style("border-style", "solid")
    .style("border-width", "5px")
    .style("border-color", "#000000");

  console.log(side);

  var summName = document.getElementById('summoner').textContent;
  var champName = document.getElementById('champion').textContent;

  console.log(summName);
  console.log(champName);

  var req = new XMLHttpRequest();
  req.open("GET", "http://lolheatmap.com/returnData?name="+ summName +"&champ="+ champName + "&side=" + side, true);
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

    // add png image (SR) to svg
    var img = svg.append("image")
      .attr("xlink:href","/images/minimap.png")
      .attr("width", 512)
      .attr("height", 512)
      .attr("id", "image")

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
      .attr("id", side)
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

  });
  req.send(null);
}
