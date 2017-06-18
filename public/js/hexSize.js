//all death locations are matches played from blue side
var dataset = [
                //Nick - 10 games hec jungle
                [6821, 7588], [6889, 2809], [7105, 9327], [11603, 7948], [11000, 4712], [3710, 9764], [10335, 10835], [1590, 6389], [1900, 3647], [5176, 3206], [7468, 7298], [8428, 7937], [12749, 12773], [6943, 4798], [13744, 3906], [3699, 13701], [5146, 9218], [9116, 9518], [8318, 5439], [2648, 11984], [6672, 7945], [5364, 13829], [8605, 5174], [4590, 7258], [1226, 5097],[5740, 9333], [7680, 8249], [11061, 4656], [6798, 6596], [12251, 1662], [5524, 5075], [4875, 1463], [11491, 3839], [6004,7313], [3594, 4265], [6278, 4880], [1607, 7986], [1470, 954], [13994, 7274], [12531, 7235], [7914, 10798], [5998, 11143], [12844, 13107], [7424, 1215], [11789, 1434], [7250, 4853], [7328, 9108], [2969, 7680], [9915, 13637], [3832, 3806], [12277, 10475], [4598, 10432], [8116, 8335], [13500, 6386], [6033, 9100], [12286, 5364], [7472, 7900]
              ];
/* variables that hold summoner data - code block changes summoner info based on user*/

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

//rotate the inputed Dataset
var rotatedDataset = rotate(dataset);

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
  .attr("xlink:href","images/minimap.png")
  .attr("width", 512)
  .attr("height", 512)

// scale data to match SR image
scaledData = scale(rotatedDataset);

console.log(scaledData);

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
  .range([0.3,0.8]);

//function for scaling hexagon size by hexagonal binning
var radius = d3.scaleLinear()
  // max input domain will be the most number of locations within a bin
  .domain([0, d3.max(maxArray, function(d) { return d; })])

  // max output range will be the x* the most number of locations within a bin
  // ***** important***** to do: need to establish a minimum that it can't go below.
  .range([0, d3.max(maxArray, function(d) { return 4*d; })]);


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
