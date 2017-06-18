window.addEventListener('load', addImage);

function addImage()
{
  var svg = d3.select("#map").append("svg")
    .attr("width", 512)
    .attr("height", 512)
    .style("border-style", "solid")
    .style("border-width", "5px")
    .style("border-color", "#000000");

  var img = svg.append("image")
    .attr("xlink:href","images/minimap.png")
    .attr("width", 512)
    .attr("height", 512)

  var svg2 = d3.select("#legend").append("svg")
    .attr("x", 512)
    .attr("y", 0)
    .attr("width", 100)
    .attr("height", 512)
    .style("border-style", "solid")
    .style("border-width", "5px")
    .style("border-color", "#000000");
}
