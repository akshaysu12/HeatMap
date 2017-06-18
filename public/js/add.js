//create the svg that will be used to place SR image and corresponding data on top of image
var svg = d3.select("body").append("svg")
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
