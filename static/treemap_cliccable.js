let viewportHeight = window.innerHeight;
let viewportWidth = window.innerWidth;
// set the dimensions and margins of the graph
var margin = {top: 10, right: 10, bottom: 10, left: 10},
  width = viewportWidth*0.4 - margin.left - margin.right,
  height = viewportHeight*0.4 - margin.top - margin.bottom;

var x = d3.scaleLinear().domain([0, width]).range([0, width]),
  y = d3.scaleLinear().domain([0, height]).range([0, height])

// append the svg object to the body of the page
var svg = d3.select("#treemap")
.append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
.append("g")
  .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

var root

var currentDepth=0

let color = d3.scaleSequential([8, 0], d3.interpolateCool);

function parseData(data){
    var root2
    let groups = d3.rollup(data,
        function(d) { return  d3.sum(d, v => v.Global_Sales)},
        function(d) { return d.Genre; },
        function(d) { return d.Platform; },
        function(d) { return d.Publisher; }
       );
    console.log(groups)
    root2 = d3.hierarchy(groups);
    root2.sum(function(d){return d[1]}).sort((a, b) => b.height - a.height || b.value - a.value);

    return root2
}

function zoom(a,current){
    currentDepth = current.depth+1;
    var t = d3.transition()
    .duration(800)
    .ease(d3.easeCubicOut);

    x.domain([current.x0, current.x1]);
    y.domain([current.y0, current.y1]); 

    svg.selectAll("rect")    
    .transition(t)
    .attr("x", function(d) { return x(d.x0) ; })
    .attr("y", function(d) { return y(d.y0) ; })
    .attr("width", function(d) { return x(d.x1) - x(d.x0) ; })
    .attr("height", function(d) { return y(d.y1) - y(d.y0) ; });

    svg.selectAll("text")    
    .transition(t)
    .attr("x", function(d) { return x(d.x0)+5 ; })
    .attr("y", function(d) { return y(d.y0)+20 ; })

    svg.selectAll("rect").filter(function(d) { return d.ancestors(); })
    .style("visibility", function(d) { return "hidden"});
    svg.selectAll("rect").filter(function(d) { return d.depth == currentDepth; })
     .style("visibility", function(d) { return "visible"});
    svg
     .selectAll("text") .filter(function(d) { return d.ancestors(); })
     .style("visibility", function(d) { return "hidden"});
     svg
     .selectAll("text").filter(function(d) { return d.depth == currentDepth; })
     .style("visibility", function(d) { return "visible"});
}
function render(elements){
  svg.selectAll("rect").data(elements)
  .enter()
  .append("rect")
    .attr('x', function (d) { return d.x0; })
    .attr('y', function (d) { return d.y0; })
    .attr('width', function (d) { return d.x1 - d.x0; })
    .attr('height', function (d) { return d.y1 - d.y0; })
    .attr("id", function(d){ return "node-"+d.data[0];})
    .attr("class",function(d){ return "node-"+d.depth;})
    .style("stroke", "black")
    .style("fill", "slateblue")
    .text(function(d){ return d.data[0] })
    .on('click',function(a,d){ zoom(a,d)})
    .filter(function(d) { return d.depth!=1; })
    .style("visibility", function() {
        return "hidden"
    })
  

// and to add the text labels
svg
  .selectAll("text")
  .data(elements)
  .enter()
  .append("text")
    .attr("x", function(d){ return d.x0+5})    // +10 to adjust position (more right)
    .attr("y", function(d){ return d.y0+20})    // +20 to adjust position (lower)
    .text(function(d){ return d.data[0] })
    .attr("font-size", "15px")
    .attr("fill", "white")  
    .filter(function(d) {return d.depth!=  1; })
    .style("visibility", function() {
        return "hidden"
    })
}
var tree
d3.csv('/home').then( function(data) {
    root = parseData(data)
    console.log("rot")
    console.log(root)
    tree=d3.treemap()
    .size([width, height])
    .padding(2)
    .round(true)

    tree(root)
    console.log("descendants")
    console.log(root.descendants())
    console.log("descendants")
    currentDepth=root.depth
    render(root.descendants())
})