let viewportHeight = window.innerHeight;
let viewportWidth = window.innerWidth;
// set the dimensions and margins of the graph
var margin = {top: 10, right: 10, bottom: 10, left: 10},
  width = viewportWidth*0.4 - margin.left - margin.right,
  height = viewportHeight*0.4 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#treemap")
.append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
.append("g")
  .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

var root
d3.csv('/home').then( function(data) {
    console.log(data)
    //groups = d3.groups(data, d => d.Genre, d=> d.Platform)
    let groups = d3.rollup(data,
        function(d) { return  d3.sum(d, v => v.Global_Sales)},
        function(d) { return d.Genre; },
        function(d) { return d.Platform; },
        function(d) { return d.Publisher; }
       );
    console.log(groups)
    let root = d3.hierarchy(groups);
    root.sum(function(d){return d[1]})
    console.log(root)
    d3.treemap()
    .size([width, height])
    .padding(2)
    (root)

  // use this information to add rectangles:
  svg
    .selectAll("rect")
    .data(root.children)
    .enter()
    .append("rect")
      .attr('x', function (d) { return d.x0; })
      .attr('y', function (d) { return d.y0; })
      .attr('width', function (d) { return d.x1 - d.x0; })
      .attr('height', function (d) { return d.y1 - d.y0; })
      .style("stroke", "black")
      .style("fill", "slateblue")

  // and to add the text labels
  svg
    .selectAll("text")
    .data(root.leaves())
    .enter()
    .append("text")
      .attr("x", function(d){ return d.x0+5})    // +10 to adjust position (more right)
      .attr("y", function(d){ return d.y0+20})    // +20 to adjust position (lower)
      .text(function(d){ return d.data.name })
      .attr("font-size", "15px")
      .attr("fill", "white")

    })