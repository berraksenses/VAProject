var dataSelection = [];
var output_Sales;
viewportHeight = window.innerHeight;
viewportWidth = window.innerWidth;
var stackedData;
var colors1;
var from=1980;
var to=2020;
var tree_map_selection = {}
var hierarchy_tree_map =["Genre","Platform","Publisher"]
var dimensionNames = { "NA_Sales": "USA Sales","EU_Sales":"Europe Sales","JP_Sales":"Japan Sales", "Other_Sales":"Other Sales", "Global_Sales": "Global Sales"}

function wrap(textElements, width) {
  textElements.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 0.9, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text("").append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength()-11 > width) {
        if(word == "Entertainment"){
          word = "Ent."
        }
        else if(word == "Interactive"){
          word = "Int."
        }
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
}
      

function type(d) {
  d.value = +d.value;
  return d;
}



var Tooltip = d3.select("#barPlot")
.append("div")
.style("opacity", 1)
.style("visibility", "hidden")
.attr("class", "tooltip")
.style("background-color", "white")
.style("border", "solid")
.style("border-width", "2px")
.style("border-radius", "5px")
.style("padding", "5px")
.style("pointer-events", "none");

var circleTooltip = d3.select("#scatterplot")
.append("div")
.style("opacity", 1)
.style("visibility", "hidden")
.attr("class", "tooltip")
.style("background-color", "white")
.style("border", "solid")
.style("border-width", "2px")
.style("border-radius", "5px").style("width", "180px")
.style("pointer-events", "none");


var current_node=null
const margin_scatter = { top: 20, right: 30, bottom: 30, left: 30 },
  width_scatter = (viewportWidth * 0.4) - margin_scatter.left - margin_scatter.right,
  height_scatter = viewportHeight * 0.48 - margin_scatter.top - margin_scatter.bottom;
  
  const margin_parallel = { top: 20, right: 10, bottom: 10, left: 30 },
  width_parallel = (viewportWidth * 0.55) - margin_parallel.left - margin_parallel.right,
  height_parallel = viewportHeight * 0.48 - margin_parallel.top - margin_parallel.bottom;
  
  var width_slider = (viewportWidth -200),
  height_slider = 40 ;
  
  
  const dimNames = { "NA_Sales": 3, "EU_Sales": 4, "JP_Sales": 5, "Other_Sales": 6, "Global_Sales": 7 };
  function filterone(x){
    ret =true
    if(tree_map_selection.Genre){
      ret =ret && x.Genre == tree_map_selection.Genre
    }
    if(tree_map_selection.Platform){
      ret = ret && x.Platform == tree_map_selection.Platform
    }
    return ret 
  }
  function range(start, end) {
    var ans = [];
    for (let i = start; i <= end; i++) {
      ans.push(i);
    }
    return ans;
  }
  
  const slider_years = range(1980,2016);
  
  const mouseover = (event, d) => {
    Tooltip.transition()
    .duration(1000);
    var text = '<ul class="legend" style="padding-left: 0px;">  ';
    const keys = Object.keys(d.data);
    keys.forEach((key, index) => {
      if(d.data[key] != 0 && index!=0){
        
        component= '<li><span class='+key+'></span>'+ key + ": "+String(d.data[key]).substring(0,6)+" Million"+'</li><br>'
        text=text+component
        // text = text+" "+ color1(key)+" "+ key + ": " + String(d.data[key]).substring(0,6)+" Million<br>";
      }
    }); 
    text=text+"</ul>"
    Tooltip
    .html(text)
    .style("visibility","visible")
    .style("left", (event.layerX-220) + "px")
    .style("top", (event.layerY-120) + "px");
  }
  
  const mouseout = (event, d) => {
    Tooltip.transition()
    .duration('1000')
    .style("visibility","hidden");
  }
  function load_data(from,to){
    var NA_checked = true;
    var EU_checked = true;
    var JP_checked = true;
    var Other_checked = true;
    
    var isChecked = {"Other_Sales" : Other_checked, "NA_Sales" : NA_checked, "EU_Sales": EU_checked, "JP_Sales": JP_checked };
    
    var maxglobalSum = 0;
    const svgScatterPlot = d3.select("#scatterplot")
  .append("svg")
  .attr("width", width_scatter + margin_scatter.left + margin_scatter.right)
  .attr("height", height_scatter + margin_scatter.top + margin_scatter.bottom)
  .append("g")
  .attr("transform", `translate(${margin_scatter.left}, ${margin_scatter.top})`);
  
  const svgParallel = d3.select("#parallelCoordinates")
  .append("svg")
  .attr("width", width_parallel + margin_parallel.left + margin_parallel.right)
  .attr("height", height_parallel + margin_parallel.top + margin_parallel.bottom)
  .append("g")
  .attr("transform", `translate(${margin_parallel.left}, ${margin_parallel.top})`);

  // d3.select("#parallelCoordinates").append("text").attr("transform", `translate(200, 80)`).text("gc");

  const svgSlider = d3.select("#range-slider")
  .append("svg")
  .attr("width", width_slider)
  .attr("height", height_slider);
   
  var maxValuesForGenre = {};
  
  const sito = "/home?from=" + String(from)+"&to=" + String(to);
  
  d3.csv(sito).then(function (data) {

    function defineColor(depth, element, max= undefined) {
      var myColor = d3.scaleOrdinal().domain(["Action","Shooter","Sports", "Platform", "Role-Playing", "Misc","Racing", "Fighting", "Simulation", "Puzzle","Adventure","Strategy"])
      .range(["#ff7440", "#30592b","#f5da42", "steelblue","#373838","gray","#ffa8be", "blue","orange","purple","brown", "lightgreen"]);
  //     paintRgb = d3.scaleSqrt()
  // .range(["blue", "red"])
  // .interpolate(d3.interpolateHsl)
       
    if(depth == 1){
        // console.log(element.data[0]);
         maxValuesForGenre[element.data[0]] = element.children[0].value
        return myColor(element.data[0]);
            
    }
    else if(depth >1){
      var parent;
      if(depth==2){
       parent = element.parent
      }
      else{
        parent = element.parent.parent
      }
      m= max || maxValuesForGenre[parent.data[0]]
      paintRgb = d3.scaleLinear().domain([0,m])
      .range(["white",myColor(parent.data[0])]);

     return paintRgb(element.value);
      
          
  }
    
    }

    x = d3.scalePoint()
    .domain(slider_years)
    .range([0, width_slider])
    .padding(0.5)
    
    var xAxis = d3.axisBottom(x);
    
    const bar = svgSlider.append("g")
    
    .selectAll("rect")
    .data(x.domain())
    .join("rect").attr("padding", "5px").attr("fill", function(d) {
      if(from<=d && d<=to){
        return "orange"
      }
      else{
        return "#d4cfcf"
      }})
      
      .attr("x", d => x(d) - x.step() / 2)
      .attr("height", 18)
      .attr("width", x.step()-1)
      //
      // bar.attr("fill", (d, i) => from <= i && i < to ? "orange" : null);
      
      // svgSlider.append("g").attr("class", "axis axis--x")
      // .attr("transform", "translate(0," + 17+ ")").call(xAxis);
      const brush = d3.brushX().extent([[0, 0], [width_slider, 18]])
      .on("start brush end", brushed)
      .on("end.snap", brushended);
      svgSlider.append("g")
      .attr("font-size", "0.6em")
      .attr("text-anchor", "middle")
      .attr("transform", `translate(${x.bandwidth() / 2},8)`)
      .selectAll("text")
      .data(x.domain())
      .join("text")
      .attr("x", d => x(d))
      .attr("dy", "0.65em")
      .text(d => d);
      
      svgSlider.append("g")
      .call(brush);
      
      function brushed({selection}) {
        if (selection) {
          const range = x.domain().map(x);
          const i0 = d3.bisectRight(range, selection[0]);
          from = i0;
          
          const i1 = d3.bisectRight(range, selection[1]);
          to = i1;
          bar.attr("fill", (d, i) => from <= i && i < to ? "orange" : "#d4cfcf");
          svgSlider.property("value", x.domain().slice(i0, i1)).dispatch("input");
          
        } else {
          svgSlider.property("value", []).dispatch("input");
        }
      }
      function brushended({selection, sourceEvent}) {
        if (!sourceEvent || !selection) return;
        const range = x.domain().map(x), dx = x.step() / 2;
        const x0 = range[d3.bisectRight(range, selection[0])] - dx;
        const x1 = range[d3.bisectRight(range, selection[1]) - 1] + dx;
        d3.select(this).call(brush.move, x1 > x0 ? [x0, x1] : null);
        d3.select("#barPlot").selectAll("svg").remove();
        d3.select("#parallelCoordinates").selectAll("svg").remove();
        d3.select("#scatterplot").selectAll("svg").remove();
        d3.select("#range-slider").selectAll("svg").remove();
        d3.select("#checkbox").selectAll("input").remove();
        d3.select("#checkbox").selectAll("label").remove();
        d3.select("#treemap").selectAll("svg").remove();
        // slider_years
        load_data(slider_years[from],slider_years[to-1]);
      }
      
      //scatter plot
      //.scaleLinear()
      const x_scatter = d3.scaleSqrt()
      .domain(d3.extent(data, function (d) { return parseFloat(d.X1); }))
      .range([3, width_scatter]);
      
      
      svgScatterPlot.append("g")
      .attr("transform", `translate(0, ${height_scatter+5})`)
      .call(d3.axisBottom(x_scatter));
      
      // Add Y axis
      const y_scatter = d3.scaleLinear()
      .domain(d3.extent(data, function (d) { return parseFloat(d.X2); }))
      .range([height_scatter, 0]);
      svgScatterPlot.append("g")
      .call(d3.axisLeft(y_scatter));
      
      var color_mean = d3.scaleOrdinal()
      .domain(["red", "green"])
      .range(["#EE4B2B", "#41924B"])
      
      var legend = svgScatterPlot.selectAll(".legend")
      .data(["Below Average Sales", "Above Average sale"])//hard coding the labels as the datset may have or may not have but legend should be complete.
      .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function (d, i) { return "translate(0," + (5+i * 20) + ")"; });
      
      // draw legend colored rectangles
      legend.append("rect")
      .attr("x", width_scatter - 18)
      .attr("width", 10)
      .attr("height", 10)
      .style("fill", function (d) { return color_mean(d) });
      
      // draw legend text
      legend.append("text")
      .attr("x", width_scatter - 24)
      .attr("y", 5)
      .attr("dy", ".35em")
      .style("text-anchor", "end").style("font-size","9px")
      .text(function (d) { return d; });
      
      // Add dots
      svgScatterPlot.append('g')
      .selectAll("dot")
      .data(data)
      .join("circle")
      .attr("cx", function (d) { return x_scatter(d.X1); })
      .attr("cy", function (d) { return y_scatter(d.X2); })
      .attr("r", 2).transition().duration(500).style("opacity", ".5")
      .style("fill", function (d) { return color_mean(d.color) })

      var brushTot = d3.brush()
        .extent([[0, -10], [width_scatter+6, height_scatter+4]])
        .on("end", selected);
        
        svgScatterPlot.append("g")
        .attr("class", "brushT")
        .call(brushTot);
        
        function selected(event) {
          var selection = event.selection;
          if (selection != null) {
            svgScatterPlot.selectAll("circle").attr("r", function (d) {
              if ((x_scatter(d.X1) > selection[0][0]) && (x_scatter(d.X1) < selection[1][0]) && (y_scatter(d.X2) > selection[0][1]) && (y_scatter(d.X2) < selection[1][1])) {
                return "4"
              }
              else {
                return "2"
              }
            })
            svgScatterPlot.selectAll("circle").style("opacity", function (d) {
              if ((x_scatter(d.X1) > selection[0][0]) && (x_scatter(d.X1) < selection[1][0]) && (y_scatter(d.X2) > selection[0][1]) && (y_scatter(d.X2) < selection[1][1])) {
                return "1"
              }
              else {
                return "0.2"
              }
            })
            svgParallel.selectAll("path")
            .style("stroke", function (d) {
              if(d!=null){
                if ((x_scatter(d.X1) > selection[0][0]) && (x_scatter(d.X1) < selection[1][0]) && (y_scatter(d.X2) > selection[0][1]) && (y_scatter(d.X2) < selection[1][1])) {
                  dataSelection.push(d.id)
                  d3.select(this).raise()
                  d3.select(this).style("opacity", 1).on('mousemove', function(event,d){
              
                    var txt =   '<b>Name:</b> '+d.Name +  '<br>' +
                    '<b>Total Sales:</b> ' + d.Global_Sales + ' Million'+ '<br>'
                    circleTooltip
                    .html(txt)
                    .style("visibility","visible")
                    .style("left", (event.layerX+380) + "px")
                    .style("top", (event.layerY) + "px");
                    d3.select(this).style("stroke-width", "4px").style("stroke", "#2296f0");
                    d3.select(this).raise()

                  })
                  // Hide the tooltip when "mouseout"
                  .on('mouseout', function(event,d){

                    circleTooltip.transition()
                    .duration('1000')
                    .style("visibility","hidden");
                    d3.select(this).style("stroke-width","1.5px").style("stroke","#6d51db");
                  })      
                  return "#6d51db"
                }
                else {
                  return "#b8b8b0"
                }
              }});
            }
            else {
              svgScatterPlot.selectAll("circle").transition().duration(300).style("opacity", 0.5)
              svgScatterPlot.selectAll("circle").attr("r", 2);
              svgParallel.selectAll(".forepath").style("stroke", "#adab82").style("opacity",0.3).lower();
              svgParallel.selectAll(".backpath").style("stroke", "#adab82").style("opacity",0.3);
              // svgParallel.selectAll("path").lower();
              // d3.select(this)
              svgParallel.selectAll("path").on("mousemove",null).on("mouseout",null);
              // selected.forEach(function(d){
              //   console.log(d);
              //   svgParallel.select(d).style("pointer-events","none");
              // });
              // d3.select(this).style("opacity", 1);
            }
          }
          //---------------------------------------
          //Parallel coordinates
          // Extract the list of dimensions we want to keep in the plot. Here I keep all except the column called Species
          dimensions = Object.keys(data[0]).filter(function (d) { return (d != "X1" && d != "" && d != "X2" && d != "color" && d != "Name" && d != "Publisher") })
          // For each dimension, I build a linear scale. I store all in a y object
          const y1 = {}
          var dragging = {};
          var line = d3.line();
          for (i in dimensions) {
            if (dimensions[i] != "Platform" && dimensions[i] != "Genre" && dimensions[i] != "Year") {
              names = dimensions[i]
              y1[names] = d3.scaleLinear()
              .domain(d3.extent(data, function (d) {
                // console.log(d[names])
                return +d[names];
              }))
              .range([height_parallel, 0])
            }
            else {
              names = dimensions[i]
              domains_sorted = data.map(function (p) {
                if (names == "Year") {
                  p[names] = p[names].substring(0, p[names].length - 2);
                  }
                  return p[names];
                }).sort();
                y1[names] = d3.scalePoint().domain(domains_sorted).range([height_parallel, 0]);
              }
            }
            extents = dimensions.map(function (p) { return [0, 0]; });
            // Build the X scale -> it find the best position for each Y axis
            x1 = d3.scalePoint().range([0, width_parallel])
            .padding(0.1)
            .domain(dimensions);
            
            var background = svgParallel.append("g")
            .attr("class", "background")
            .selectAll("path")
            .data(data)
            .enter().append("path")
            .attr("class", "backpath")
            .attr("d", path).style("fill", "none")
            .style("stroke", "#C0C0C0n").style("opacity", 0.3).style("stroke-width","1.5px");
            
            // Add blue foreground lines for focus.
            var foreground = svgParallel.append("g")
            .attr("class", "foreground")
            .selectAll("path")
            .data(data)
            .enter().append("path")
            .attr("class", "forepath")
            .attr("d", path).style("fill", "none")
            .style("stroke", "#adab82").style("opacity", 0.3).style("stroke-width","1.5px");
            
            // Add a group element for each dimension.
            var g_before3 = svgParallel.selectAll(".dimension1")
            .data(dimensions.slice(0, 3))
            .enter().append("g")
            .attr("class", "dimension1").style("font-size",  "large").style("font-weight", "500").style("text-shadow", "#fff 2px 0 1px")
            .attr("transform", function (d) { return "translate(" + x1(d) + ")"; })
            
            var g_after3 = svgParallel.selectAll(".dimension2")
            .data(dimensions.slice(3))
            .enter().append("g")
            .attr("class", "dimension2").style("text-shadow", "#fff 1px 0 10px").style("font-weight","bold")
            .attr("transform", function (d) { return "translate(" + x1(d) + ")"; })
            
            // Add an axis and title.
            g_after3.append("g")
        .attr("class", "axis")
        .each(function (d) { d3.select(this).call(d3.axisLeft(y1[d])); })
        .append("text")
        .style("text-anchor", "middle")
        .attr("y", -10).attr("x",-17)
        .text(function (d) { if(d in dimensionNames){
          d = dimensionNames[d] + "*";
        }return d; }).style("fill", "black").style("font-size", "9px")
        //.style("text-shadow", "0 5px 0 #fff, 1px 0 0 #000, 0 -1px 0 #fff, -1px 0 0 #fff");
        
        g_before3.append("g")
        .attr("class", "axis")
        .each(function (d) { d3.select(this).call(d3.axisLeft(y1[d])); })
        .append("text")
        .style("text-anchor", "middle")
        .attr("y", -9)
        .text(function (d) {return d; }).style("fill", "black")
        
        // Add and store a brush for each axis.
        g_after3.append("g")
        .attr("class", "brush")
        .each(function (d) {
          d3.select(this)
          .call(y1[d].brush = d3.brushY().extent([[-5, 0], [8, height_parallel]])
          .on("brush end", brush_parallel_chart));
        })
        .selectAll("rect");
        
        
        function position(d) {
          var v = dragging[d];
          return v == null ? x1(d) : v;
        }
        
        // Returns the path for a given data point.
        function path(d) {
          return line(dimensions.map(function (p) { return [position(p), y1[p](d[p])]; }));
        }
        
        // Handles a brush event, toggling the display of foreground lines.
        function brush_parallel_chart(event, i) {
          // svgParallel.selectAll(".forepath").style("display",true)
          if (event.selection != null) {
            svgParallel.selectAll(".backpath").style("stroke", "#fbd1a2");
            svgParallel.selectAll(".forepath").style("stroke", "#2296f0").style("opacity",1)
            .on('mousemove', function(event,d){
              
              var txt =   '<b>Name:</b> '+d.Name +  '<br>' +
              '<b>Total Sales:</b> ' + d.Global_Sales + ' Million'+ '<br>'
              circleTooltip
              .html(txt)
              .style("visibility","visible")
              .style("left", (event.layerX+450) + "px")
              .style("top", (event.layerY) + "px");
              d3.select(this).style("stroke", "purple").style("stroke-width", "4px");
              d3.select(this).raise();
            })
            // Hide the tooltip when "mouseout"
            .on('mouseout', function(event,d){
              circleTooltip.transition()
              .duration('1000')
              .style("visibility","hidden");
              
              d3.select(this).style("stroke-width","1.5px").style("stroke","#2296f0").lower();
              
            });
            
            
            for (var j = 0; j < dimensions.length; ++j) {
              if (event.target == y1[dimensions[j]].brush) {
                extents[j] = event.selection.map(y1[dimensions[j]].invert, y1[dimensions[j]]);
              }
            }
            
            foreground.style("display", function (d) {
              return dimensions.every(function (p, i) {
                if (extents[i][0] == 0) {
                  return true;
                }
                return extents[i][1] <= d[p] && d[p] <= extents[i][0];
              }) ? null : "none";}
              );
              
              var bok;
              svgScatterPlot.selectAll("circle").style("opacity", function (d) {
                dimensions.every(function (p, i) {
                  if (extents[i][1] <= d[p] && d[p] <= extents[i][0] || extents[i][0] == 0) {
                    bok = true;
                    return true
                  }
                  else {
                    bok = false;
                    return false
                  }
                }
                )
                if (bok) {
                  return "1"
            }
            else {
              return "0.2"
            }
          });
          var dneme;
          svgScatterPlot.selectAll("circle").transition().duration(200).attr("r", function (d) {
            dimensions.every(function (element, index) {
              if (extents[index][1] <= d[element] && d[element] <= extents[index][0] || extents[index][0] == 0) {
    
                dneme = true;
                return true
              }
              else {
                dneme = false;
                return false
              }
            }
            )
            if (dneme) {
              return "4"
            }
            else {
              return "2"
            }
          });
          
        }
        else {
          svgParallel.selectAll(".forepath").style("display","none");
    
          extents[dimNames[i]] = [0, 0];
          var truth_val = extents.every(element => element.every(e => e == 0));
          if (truth_val) {
    
            svgParallel.selectAll(".backpath").style("stroke", "#adab82");
            svgParallel.selectAll(".forepath").style("stroke", "#adab82");
            
            svgScatterPlot.selectAll("circle").transition().duration(200).attr("r", 2);
            svgScatterPlot.selectAll("circle").style("opacity", 0.5);
          }
          else {
    
            var dneme;
            svgScatterPlot.selectAll("circle").transition().duration(200).attr("r", function (d) {
              dimensions.every(function (element, index) {
                if (extents[index][1] <= d[element] && d[element] <= extents[index][0] || extents[index][0] == 0) {
                  dneme = true;
                  return true
                }
                else {
                  dneme = false;
                  return false
                }}
              )
              if (dneme) {
                return "4"
              }
              else {
                return "2"
              }
            })
            var bok;
            svgScatterPlot.selectAll("circle").style("opacity", function (d) {
              dimensions.every(function (p, i) {
                if (extents[i][1] <= d[p] && d[p] <= extents[i][0] || extents[i][0] == 0) {
                  bok = true;
                  return true
                }
                else {
                  bok = false;
                  return false
                }
              }
              )
              if (bok) {
                return "1"
              }
              else {
                return "0.2"
              }
            })
          }
        }
      }

      //---------------------------Treemap
    
      let viewportHeight = window.innerHeight;
      let viewportWidth = window.innerWidth;
      // set the dimensions and margins of the graph
      var margin = {top: 10, right: 10, bottom: 10, left: 10},
        width = viewportWidth*0.4 - margin.left - margin.right,
        height = viewportHeight*0.4 - margin.top - margin.bottom;
      
      var x_tree = d3.scaleLinear().domain([0, viewportWidth*0.4 ]).range([-10, viewportWidth*0.4-10 ]),
          y_tree = d3.scaleLinear().domain([0,  viewportHeight*0.4]).range([-10,  viewportHeight*0.4-10])
      
      // append the svg object to the body of the page
      var svgTree = d3.select("#treemap")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");
      
      var root
      
      var currentDepth=0
      
      // let color_tree = d3.scaleSequential([8, 0], d3.interpolateCool);
      //
      function getTreeValue(xs) {
        var sum = 0;
    
        if (JP_checked) {
          sum = sum+d3.sum(xs, x => x.JP_Sales);
        }
        if (EU_checked) {
          sum = sum+d3.sum(xs, x => x.EU_Sales);
        }
        if (NA_checked) {
          sum = sum+ d3.sum(xs, x => x.NA_Sales);
        }
        if (Other_checked) {
          sum = sum+d3.sum(xs, x => x.Other_Sales);
        }
        return sum;
      }
      //
      function parseData(data){
          var root2
          let groups = d3.rollup(data,
               xs => getTreeValue(xs),
              function(d) { return d.Genre; },
              function(d) { return d.Platform; },
              function(d) { return d.Publisher; }
             );
          root2 = d3.hierarchy(groups);
          root2.sum(function(d){return d[1]}).sort((a, b) => b.height - a.height || b.value - a.value);
      
          return root2
      }
 
      function zoom(a,current){
          current_node = current
          currentDepth = (current.depth+1)%4;
          if (currentDepth==0){
            tree_map_selection = {}
            current_node=root
            currentDepth=root.depth
            render(root.descendants());
            zoom(null,current_node)
            return
          }else{
            tree_map_selection[hierarchy_tree_map[currentDepth-2]]=current.data[0]
            var t = d3.transition()
            .duration(800)
            .ease(d3.easeCubicOut);
        
            x_tree.domain([current.x0, current.x1]);
            y_tree.domain([current.y0, current.y1]); 
          }
          data_filtered = data.filter(filterone)
          
          // --------
          reduce =hierarchy_tree_map[currentDepth-2]? hierarchy_tree_map[currentDepth-1] : "Genre"
          output_Sales = d3.rollups(
            data_filtered,
            xs => rollupFnc(xs),
            d => d[reduce]
          ).map(([k, v]) => {ret = { Sales: v }; ret[reduce]=k; return ret});
          barData = [];
          for (let i = 0; i < output_Sales.length; i++) {
            var deneme = {};
            deneme[reduce] = output_Sales[i][reduce];
            deneme.JP_Sales = output_Sales[i].Sales[0].JP;
            deneme.EU_Sales = output_Sales[i].Sales[0].EU;
            deneme.NA_Sales = output_Sales[i].Sales[0].NA;
            deneme.Other_Sales = output_Sales[i].Sales[0].Other;
            deneme.Global_Sales = deneme.JP_Sales + deneme.EU_Sales  + deneme.NA_Sales + deneme.Other_Sales
            barData.push(deneme);
          }       
            stackedData = d3.stack().keys(subgroups)(barData);
            // console.log(stackedData)
            const totals= output_Sales.map(d =>d.Sales[0].JP + d.Sales[0].EU + d.Sales[0].NA + d.Sales[0].Other);
            console.log(totals)
            output_Sales.sort((a, b) => totals[output_Sales.indexOf(b)] - totals[output_Sales.indexOf(a)]);
            var ex= output_Sales.map(d =>d.Sales[0].JP + d.Sales[0].EU + d.Sales[0].NA + d.Sales[0].Other);
            maxVal = ex[0]

            // stackedData.forEach(d => d.sort((a, b) => b[1][Global] - a[1][sortCriteria]));

            let x_zoom = d3.scaleBand()
              .domain(output_Sales.map(d =>d[reduce]))
              .range([0, width_bar])
              .padding([0.2])
            let y_zoom = d3.scaleLinear()
              .domain([0,d3.extent(barData, function (d) { return parseFloat(d.Global_Sales); })[1]])
              .range([height_bar, 0]);
              
              svgBarplot.selectAll("rect").remove()
    
              
              svgBarplot.append("g").selectAll("g")
              // Enter in the stack data = loop key per key = group per group
              .data(stackedData)
              .join("g")
              .attr("fill", d => color1(d.key))
              .selectAll("rect")
              // enter a second time = loop subgroup per subgroup to add all rectangles
              .data(d => d)
              .join("rect").on('mousemove',mouseover).on('mouseout',mouseout)
              .attr("x", d => x_zoom(d.data[reduce]))
              .attr("y", d => y_zoom(d[1])).attr("width", x_zoom.bandwidth()).transition().duration(800)
              .attr("height", d => y_zoom(d[0]) - y_zoom(d[1]))
              
              
              svgBarplot.select("#y_bar_plot")
                .call(d3.axisLeft(y_zoom));
              
             const amk = svgBarplot.select("#x_bar_plot")
               .call(d3.axisBottom(x_zoom))

          amk.selectAll(".tick text")
          .style("font-size", "7.5px").style("text-anchor", "center")
          .call(wrap, x_zoom.bandwidth());
   
            //.selectAll('.x .tick text')  // select all the x tick texts
            //   .call(function(t){                
            //     t.each(function(d){ // for each one
            //       var self = d3.select(this);
            //       var s = self.text().split(' ');  // get the text and split it
            //       s.forEach(function (value, i) {
            //        console.log();
            //       });
                
                  
            //     })
            // });

              // // =========
              svgTree.selectAll("rect")    
              .transition().duration(800)
              .attr("x", function(d) { return x_tree(d.x0) ; })
              .attr("y", function(d) { return y_tree(d.y0) ; })
              .attr("width", function(d) { return x_tree(d.x1) - x_tree(d.x0) ; })
              .attr("height", function(d) { return y_tree(d.y1) - y_tree(d.y0) ; });
              
              svgTree.selectAll("text")    
              .transition(t)
              .attr("x", function(d) { return x_tree(d.x0)+5 ; })
              .attr("y", function(d) { return y_tree(d.y0)+20 ; })
              
              svgTree.selectAll("rect").filter(function(d) { return d.ancestors(); })
              .style("visibility", function(d) { return "hidden"});
              svgTree.selectAll("rect").filter(function(d) { return d.depth == currentDepth; })
              .style("visibility", function(d) { return "visible"}).style("fill", d => defineColor(d.depth,d, d3.max(totals)));
              svgTree
              .selectAll("text") .filter(function(d) { return d.ancestors(); })
              .style("visibility", function(d) { return "hidden"});
              svgTree
              .selectAll("text").filter(function(d) { return d.depth == currentDepth; })
              .style("visibility", function(d) { return "visible"}).text(function(d){ return len_tezt(d.data[0],15, x_tree(d.x1) - x_tree(d.x0),y_tree(d.y1) - y_tree(d.y0))});
            }

      
      function render(elements){
        svgTree.selectAll("rect").data(elements)
        .enter()
        .append("rect")
          .attr('x', function (d) { return d.x0; })
          .attr('y', function (d) { return d.y0; })
          .attr('width', function (d) { return d.x1 - d.x0; })
          .attr('height', function (d) { return d.y1 - d.y0; })
          .attr("id", function(d){ return "node-"+d.data[0];})
          .attr("class",function(d){ return "node-"+d.depth;})
          .style("stroke", "black")
          .style("fill", d=>defineColor(d.depth,d))
          .text(function(d){ return d.data[0]})

          .on('click',function(a,d){zoom(a,d)})
          .filter(function(d) { return d.depth!=1; })
          .style("visibility", function() {
              return "hidden"
          })
      // and to add the text labels
      
      svgTree
        .selectAll("text")
        .data(elements)
        .enter()
        .append("text")
          .attr("x", function(d){ return d.x0+5})    // +10 to adjust position (more right)
          .attr("y", function(d){ return d.y0+20})    // +20 to adjust position (lower)
          .attr("font-size", "15px")
          .attr("fill", "white").style("text-shadow", "#000 1px 0 5px")
          .attr('data-width', (d) => d.x1 - d.x0)
          .attr('font-size', '15px')
      svgTree.selectAll("text")
          .filter(function(d) {return d.depth==  1; })
          .text(function(d){ return len_tezt(d.data[0],15,  d.x1 - d.x0, d.y1-d.y0)})
      svgTree.selectAll("text")
          .filter(function(d) {return d.depth!=  1; })
          .style("visibility", function() {
              return "hidden"
          })
      }
      var tree;
          root = parseData(data)
          tree=d3.treemap()
          .size([width, height])
          .padding(0)
          .round(true)
          tree=tree(root)
          currentDepth=root.depth
          current_node=root
          render(root.descendants())
     
      function len_tezt(text,fontsize, width,height){
          if (text === undefined){
            return ""
          }
          while(text.length > 0){
            var container = d3.select('body').append('svg');
            container.append('text').attr("x", -99999).attr("y", -99999)  .text(text);
            var size = container.node().getBBox();
            container.remove();
            let s_width=size.width
      
            if(size.height>height){
              return ''
            }
            if (s_width < width){
              break
            }else{
              text = text.substring(0, text.length-1);
            }
          }
          return text
      }
      
      //----Barplots
    
      const margin_bar = { top: 30, right: 0, bottom: 35, left: 50 },
        width_bar = innerWidth * 0.5 - margin_bar.left - margin_bar.right,
        height_bar = innerHeight * 0.35 - margin_bar.top - margin_bar.bottom;
    
      // append the svg object to the body of the page
    
      const svgBarplot = d3.select("#barPlot")
        .append("svg")
        .attr("width", width_bar + margin_bar.left + margin_bar.right)
        .attr("height", height_bar + margin_bar.top + margin_bar.bottom)
        .append("g")
        .attr("transform", `translate(${margin_bar.left},${margin_bar.top})`);

        svgBarplot.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end").style("font-size", "11px").style("font-weight","medium")
        .attr("x",-10).attr("y",-37)
        .attr("transform", "rotate(-90)")
        .text("Total number of sales in millions");

      // List of subgroups = header of the csv files = soil condition here
    
      const subgroups = data.columns.slice(9, 13);
    
      color1  = d3.scaleOrdinal()
      .domain(subgroups)
      .range(['#e41a1c', '#1f77b4', '#ff7f0e', '#2ca02c'])
    
      function rollupGlobal(xs) {
  
        var sumglobal = d3.sum(xs, x => x.Global_Sales);
        if(maxglobalSum<=sumglobal){
          maxglobalSum = sumglobal;
        }
    
      return sumglobal;
    }
    var globalNumber = d3.rollups(
      data,
      xs => rollupGlobal(xs),
      d => d.Genre).map(([k, v]) => ({ Genre: k, globalSale: v }));
    
    function rollupFnc(xs) {
            datas =
            {
              "JP": 0.0,
              "EU": 0.0,
              "NA": 0.0,
              "Other": 0.0
            }
        
            if (JP_checked) {
              datas.JP = d3.sum(xs, x => x.JP_Sales);
            }
            if (EU_checked) {
              datas.EU = d3.sum(xs, x => x.EU_Sales);
            }
            if (NA_checked) {
              datas.NA = d3.sum(xs, x => x.NA_Sales);
            }
            if (Other_checked) {
              datas.Other = d3.sum(xs, x => x.Other_Sales);
            }
            return [datas];
          }
          output_Sales = d3.rollups(
            data,
            xs => rollupFnc(xs),
            d => d.Genre
          ).map(([k, v]) => ({ Genre: k, Sales: v }));
        
      d3.select("#checkbox").selectAll("input")
        .data(subgroups)
        .enter().append("label")
        .text(function (d) {d=dimensionNames[d]; return d; }).style("font-size", "11px").style("font-weight","bold")
        .style("color","black")
        // .style("background-color", function (d) { 
        //   return color1(d)})
        .append("input")
        .attr("checked", function (d){ 
          return isChecked[d];
        })
        .attr("type", "checkbox")
        .attr("transform", function (d, i) { return "translate(0," + 10 + i * 10 + ")" })
        .attr("id", function (d, i) { return i; })
        .on("click", function (d) {
          if (d.target.id == 0) {
            NA_checked = this.checked;
          }
          else if (d.target.id == 1) {
            EU_checked = this.checked;
          }
          else if (d.target.id == 2) {
            JP_checked = this.checked;
          }
          else if (d.target.id == 3) {
            Other_checked = this.checked;
          }
          output_Sales = d3.rollups(
            data,
            xs => rollupFnc(xs),
            d => d.Genre
          ).map(([k, v]) => ({ Genre: k, Sales: v }));
    
          barData = [];
          for (let i = 0; i < output_Sales.length; i++) {
            var deneme = {};
            deneme.Genre = output_Sales[i].Genre;
            deneme.JP_Sales = output_Sales[i].Sales[0].JP;
            deneme.EU_Sales = output_Sales[i].Sales[0].EU;
            deneme.NA_Sales = output_Sales[i].Sales[0].NA;
            deneme.Other_Sales = output_Sales[i].Sales[0].Other;
            barData.push(deneme);
          }
          //stack the data? --> stack per subgroup
          stackedData = d3.stack()
            .keys(subgroups)
            (barData);
          
          svgBarplot.selectAll("rect").remove();
    
          svgBarplot.append("g")
            // Enter in the stack data = loop key per key = group per group
            .data(stackedData)
            .join("g")
            .attr("fill", d => color1(d.key))
            // enter a second time = loop subgroup per subgroup to add all rectangles
            .data(d)
            .append("rect")
            .attr("x", d => x_bar(d.data.Genre))
            .attr("y", d => y_bar(d[1]))
            .attr("width", x_bar.bandwidth())
            .attr("height", d => y_bar(d[0]) - y_bar(d[1]))
            .on('mousemove',mouseover).on('mouseout',mouseout);
          
            //
          
            root = parseData(data)
            tree=d3.treemap()
            .size([width, height])
            .padding(0)
            .round(true)
            tree=tree(root)
            currentDepth=current_node.depth
            temporary_node=null
            root.each(x=> {
              if(x.parent==undefined){
                if (currentDepth == 0){
                  temporary_node=root
                  return
                }
              };
              if(x.data[0]== current_node.data[0] && x.parent.data[0]==current_node.parent.data[0]){
                temporary_node=x
              }
            })
            current_node=temporary_node
            render(root.descendants());
            zoom(null,current_node)

        })
      // List of groups = species here = value of the first column called group -> I show them on the X axis
      
      const groups = data.map(d => (d.Genre));
      
      globalNumber.sort((a, b) => b.globalSale - a.globalSale);
// output_Sales.map(d =>d[reduce])
      // Add X axis
      const x_bar = d3.scaleBand()
        .domain(globalNumber.map(d=>d.Genre))
        .range([0, width_bar])
        .padding([0.2])

      svgBarplot.append("g")
        .attr("id","x_bar_plot")
        .attr("transform", `translate(0, ${height_bar})`)
        .call(d3.axisBottom(x_bar));
    
      // Add Y axis
      const y_bar = d3.scaleLinear()
        .domain([0,maxglobalSum])
        .range([height_bar, 0]);
      svgBarplot.append("g")
      .attr("id","y_bar_plot")
        .call(d3.axisLeft(y_bar));
   

      var barData = [];
      for (let i = 0; i < output_Sales.length; i++) {
        var deneme = {};
        deneme.Genre = output_Sales[i].Genre;
        deneme.JP_Sales = output_Sales[i].Sales[0].JP;
        deneme.EU_Sales = output_Sales[i].Sales[0].EU;
        deneme.NA_Sales = output_Sales[i].Sales[0].NA;
        deneme.Other_Sales = output_Sales[i].Sales[0].Other;
        barData.push(deneme);
      }
      //stack the data? --> stack per subgroup
      stackedData = d3.stack()
        .keys(subgroups)
        (barData)
      // Show the bars
      svgBarplot.append("g")
        .selectAll("g")
        // Enter in the stack data = loop key per key = group per group
        .data(stackedData)
        .join("g")
        .attr("fill", d => color1(d.key))
        .selectAll("rect")
        // enter a second time = loop subgroup per subgroup to add all rectangles
        .data(d => d)
        .join("rect")
        .attr("x", d => x_bar(d.data.Genre))
        .attr("y", d => y_bar(d[1]))
        .attr("height", d => y_bar(d[0]) - y_bar(d[1]))
        .attr("width", x_bar.bandwidth()).on('mousemove',mouseover).on('mouseout',mouseout);
    });
}
load_data(1980,2016);