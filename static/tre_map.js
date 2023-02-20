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
    .data(root.children)
    .enter()
    .append("text")
      .attr("x", function(d){ return d.x0+5})    // +10 to adjust position (more right)
      .attr("y", function(d){ return d.y0+20})    // +20 to adjust position (lower)
      .text(function(d){ return d.data[0] })
      .attr("font-size", "15px")
      .attr("fill", "white")



function zoom(d) { // http://jsfiddle.net/ramnathv/amszcymq/
	
  console.log( d );
  
  currentDepth = d.depth;
  parent.datum(d.parent || nodes);
  
  x.domain([d.x0, d.x1]);
  y.domain([d.y0, d.y1]);
  
  var t = d3.transition()
      .duration(800)
      .ease(d3.easeCubicOut);
  
  cells
      .transition(t)
      .style("left", function(d) { return x(d.x0) + "%"; })
      .style("top", function(d) { return y(d.y0) + "%"; })
      .style("width", function(d) { return x(d.x1) - x(d.x0) + "%"; })
      .style("height", function(d) { return y(d.y1) - y(d.y0) + "%"; });
  
  cells // hide this depth and above
      .filter(function(d) { return d.ancestors(); })
      .classed("hide", function(d) { return d.children ? true : false });
  
  cells // show this depth + 1 and below
      .filter(function(d) { return d.depth > currentDepth; })
      .classed("hide", false);
  
}
    })


  