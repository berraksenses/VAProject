var dataSelection = [];
var output_Sales;
viewportHeight = window.innerHeight;
viewportWidth = window.innerWidth;
var stackedData;
var colors1;
var NA_checked = true;
var EU_checked = true;
var JP_checked = true;
var Other_checked = true;
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
.style("pointer-events", "none")

const margin_scatter = { top: 20, right: 30, bottom: 30, left: 30 },
  width_scatter = (viewportWidth * 0.4) - margin_scatter.left - margin_scatter.right,
  height_scatter = viewportHeight * 0.5 - margin_scatter.top - margin_scatter.bottom;

const margin_parallel = { top: 20, right: 10, bottom: 10, left: 30 },
  width_parallel = (viewportWidth * 0.55) - margin_parallel.left - margin_parallel.right,
  height_parallel = viewportHeight * 0.55 - margin_parallel.top - margin_parallel.bottom;


  var width_slider = (viewportWidth -200),
  height_slider = 40 ;

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

const svgSlider = d3.select("#range-slider")
  .append("svg")
  .attr("width", width_slider)
  .attr("height", height_slider);

const dimNames = { "NA_Sales": 3, "EU_Sales": 4, "JP_Sales": 5, "Other_Sales": 6, "Global_Sales": 7 };

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
  .duration('10');
  var text = '<ul class="legend" style="padding-left: 0px;">  ';
  const keys = Object.keys(d.data);
  keys.forEach((key, index) => {
    if(d.data[key] != 0 && index!=0){
      console.log(key, color1(key))
      component= '<li><span class='+key+'></span>'+ key + ": "+String(d.data[key]).substring(0,6)+" Million"+'</li><br>'
      text=text+component
     // text = text+" "+ color1(key)+" "+ key + ": " + String(d.data[key]).substring(0,6)+" Million<br>";
    }
   
  }); 
  text=text+"</ul>"
  console.log(text);
  Tooltip
    .html(text)
    .style("visibility","visible")
    .style("left", (event.layerX-180) + "px")
    .style("top", (event.layerY-120) + "px");
}

const mouseout = (event, d) => {
  Tooltip.transition()
         .duration('10')
         .style("visibility","hidden");
}

var mySlider;
var dateExtnt;

d3.csv("/home").then(function (data) {
//slider

x = d3.scalePoint()
    .domain(slider_years)
    .range([0, width_slider])
    .padding(0.5)

var xAxis = d3.axisBottom(x);

  const bar = svgSlider.append("g")
      .attr("fill", "#d4cfcf")
    .selectAll("rect")
    .data(x.domain())
    .join("rect").attr("padding", "5px")
      .attr("x", d => x(d) - x.step() / 2)
      .attr("height", 17)
      .attr("width", x.step()-1);
      
svgSlider.append("g").attr("class", "axis axis--x")
.attr("transform", "translate(0," + 17+ ")").call(xAxis);
  const brush = d3.brushX().extent([[0, 0], [width_slider, 16]])
      .on("start brush end", brushed)
      .on("end.snap", brushended);
    // svgSlider.append("g")
    //   .attr("font-size", "0.6em")
    //   .attr("text-anchor", "middle")
    //   .attr("transform", `translate(${x.bandwidth() / 2},${height_slider-8})`)
    // .selectAll("text")
    // .data(x.domain())
    // .join("text")
    //   .attr("x", d => x(d))
    //   .attr("dy", "0.65em")
    //   .text(d => d);

      svgSlider.append("g")
      .call(brush);

  function brushed({selection}) {
    if (selection) {
      const range = x.domain().map(x);
      const i0 = d3.bisectRight(range, selection[0]);
      const i1 = d3.bisectRight(range, selection[1]);
      bar.attr("fill", (d, i) => i0 <= i && i < i1 ? "orange" : null);
      svgSlider.property("value", x.domain().slice(i0, i1)).dispatch("input");
    } else {
      bar.attr("fill", null);
      svgSlider.property("value", []).dispatch("input");
    }
  }

  function brushended({selection, sourceEvent}) {
    if (!sourceEvent || !selection) return;
    const range = x.domain().map(x), dx = x.step() / 2;
    const x0 = range[d3.bisectRight(range, selection[0])] - dx;
    const x1 = range[d3.bisectRight(range, selection[1]) - 1] + dx;
    d3.select(this).transition().call(brush.move, x1 > x0 ? [x0, x1] : null);
  }

  //scatter plot
  const x_scatter = d3.scaleSqrt()
    .domain(d3.extent(data, function (d) { return parseFloat(d.X1); }))
    .range([3, width_scatter]);
  svgScatterPlot.append("g")
    .attr("transform", `translate(0, ${height_scatter})`)
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
    .attr("transform", function (d, i) { return "translate(0," + i * 20 + ")"; });

  // draw legend colored rectangles
  legend.append("rect")
    .attr("x", width_scatter - 18)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", function (d) { return color_mean(d) });

  // draw legend text
  legend.append("text")
    .attr("x", width_scatter - 24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("text-anchor", "end")
    .text(function (d) { return d; });

  // Add dots
  svgScatterPlot.append('g')
    .selectAll("dot")
    .data(data)
    .join("circle")
    .attr("cx", function (d) { return x_scatter(d.X1); })
    .attr("cy", function (d) { return y_scatter(d.X2); })
    .attr("r", 2).style("opacity", ".3")
    .style("fill", function (d) { return color_mean(d.color) })

  var brushTot = d3.brush()
    .extent([[0, 0], [width_scatter, height_scatter]])
    .on("end", selected);

  svgScatterPlot.append("g")
    .attr("class", "brushT")
    .call(brushTot);

  function selected(event) {
    var selection = event.selection;

    // svgParallel.selectAll("path").style("stroke","steelblue").lower()

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
            d3.select(this).style("opacity", 1);
            return "red"
          }
          else {
            // d3.select(this).lower()
            return "#69b3a2"
          }
        }})
    }
    else {
      svgScatterPlot.selectAll("circle").style("opacity", 0.3);
      svgScatterPlot.selectAll("circle").attr("r", 2);
      // svgParallel.selectAll(".forepath").style("display",false);
      svgParallel.selectAll(".forepath").style("stroke", "#69b3a2").style("opacity",0.5);
      svgParallel.selectAll(".backpath").style("stroke", "#69b3a2").style("opacity",0.5);
      
      svgParallel.selectAll("path").lower();
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
    .style("stroke", "#C0C0C0n").style("opacity", 0.5);

  // Add blue foreground lines for focus.
  var foreground = svgParallel.append("g")
    .attr("class", "foreground")
    .selectAll("path")
    .data(data)
    .enter().append("path")
    .attr("class", "forepath")
    .attr("d", path).style("fill", "none")
    .style("stroke", "#69b3a2").style("opacity", 0.5);

  // Add a group element for each dimension.
  var g_before3 = svgParallel.selectAll(".dimension1")
    .data(dimensions.slice(0, 3))
    .enter().append("g")
    .attr("class", "dimension1")
    .attr("transform", function (d) { return "translate(" + x1(d) + ")"; })


  var g_after3 = svgParallel.selectAll(".dimension2")
    .data(dimensions.slice(3))
    .enter().append("g")
    .attr("class", "dimension2")
    .attr("transform", function (d) { return "translate(" + x1(d) + ")"; })
    
  // Add an axis and title.
  g_after3.append("g")
    .attr("class", "axis")
    .each(function (d) { d3.select(this).call(d3.axisLeft(y1[d])); })
    .append("text")
    .style("text-anchor", "middle")
    .attr("y", -10)
    .text(function (d) { console.log(d);return d; }).style("fill", "black")
    //.style("text-shadow", "0 5px 0 #fff, 1px 0 0 #000, 0 -1px 0 #fff, -1px 0 0 #fff");

  g_before3.append("g")
    .attr("class", "axis")
    .each(function (d) { d3.select(this).call(d3.axisLeft(y1[d])); })
    .append("text")
    .style("text-anchor", "middle")
    .attr("y", -9)
    .text(function (d) { return d; }).style("fill", "black")

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

  function transition(g) {
    return g.transition().duration(500);
  }

  // Returns the path for a given data point.
  function path(d) {
    return line(dimensions.map(function (p) { return [position(p), y1[p](d[p])]; }));
  }
 
  // Handles a brush event, toggling the display of foreground lines.
  function brush_parallel_chart(event, i) {
    // svgParallel.selectAll(".forepath").style("display",true)
    if (event.selection != null) {
      svgParallel.selectAll(".backpath").style("stroke", "#C0C0C0");
      svgParallel.selectAll(".forepath").style("stroke", "#ff3349").style("opacity",1);

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
        }) ? null : "none";
      }
      );

      var dneme;
      svgScatterPlot.selectAll("circle").attr("r", function (d) {
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
          return "3"
        }
        else {
          return "1"
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
          return "0.3"
        }
      })

    }
    else {
      svgParallel.selectAll(".forepath").style("display","none");

      extents[dimNames[i]] = [0, 0];
      var truth_val = extents.every(element => element.every(e => e == 0));
      if (truth_val) {

        svgParallel.selectAll(".backpath").style("stroke", "#69b3a2");
        svgParallel.selectAll(".forepath").style("stroke", "#69b3a2");
        svgScatterPlot.selectAll("circle").style("opacity", 0.3);
        svgScatterPlot.selectAll("circle").attr("r", 2);

      }
      else {

        var dneme;
        svgScatterPlot.selectAll("circle").attr("r", function (d) {
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
            return "3"
          }
          else {
            return "1"
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
            return "0.3"
          }
        })
      }
    }
  }

  //   // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
  // function path(d) {
  //     return d3.line()(dimensions.map(function(p) { 
  //         return [x1(p), y1[p](d[p])]; }));
  // }
  //   // Draw the lines
  // svgParallel
  // .selectAll("myPath")
  // .data(data)
  // .join("path")
  // .attr("d",  path)
  // .style("fill", "none")
  // .style("stroke", "#69b3a2")
  // .style("opacity", 0.3)

  // // Draw the axis:
  // svgParallel.selectAll("myAxis")
  // // For each dimension of the dataset I add a 'g' element:
  // .data(dimensions).enter()
  // .append("g")
  // // I translate this element to its right position on the x axis
  // .attr("transform", function(d) { return "translate(" + x1(d) + ")"; })
  // // And I build the axis with the call function
  // .each(function(d) { d3.select(this).call(d3.axisLeft().scale(y1[d])); })
  // // Add axis title
  // .append("text")
  //     .style("text-anchor", "middle")
  //     .attr("y", -9)
  //     .text(function(d) { return d; })
  //     .style("fill", "black")

  //usttekini trial ende kadar uncomment

  //---------------------------Treemap

  // var margin_tree = {top: 10, right: 10, bottom: 10, left: 10},
  //   width_tree = 445 - margin_tree.left - margin_tree.right,
  //   tree_height = 445 - margin_tree.top - margin_tree.bottom;

  // // append the svg object to the body of the page
  // var svg = d3.select("#treemap")
  // .append("svg")
  //   .attr("width", width_tree + margin_tree.left + margin_tree.right)
  //   .attr("height", tree_height + margin_tree.top + margin_tree.bottom)
  // .append("g")
  //   .attr("transform",
  //         "translate(" + margin_tree.left + "," + margin_tree.top + ")");

  //         let groups = d3.rollup(data,
  //             function(d) { return d.length; },
  //             function(d) { return d.Genre; },
  //             function(d) { return d.Platform; },
  //             function(d) { return d.Publisher; }
  //            );
  //     console.log(groups);
  //     let root = d3.hierarchy(groups);
  //     // console.log(root[0])
  //     root.sum(function(d) {
  //         // console.log(d[1]);
  //         return d[1];
  //       });

  //         d3.treemap()
  //         .size([width_tree, height_parallel])
  //         .padding(0.1)
  //         (root);

  //       // use this information to add rectangles:
  //       svg
  //         .selectAll("rect")
  //         .data(root.leaves())
  //         .enter()
  //         .append("rect")
  //           .attr('x', function (d) { return d.x0; })
  //           .attr('y', function (d) { return d.y0; })
  //           .attr('width', function (d) { return d.x1 - d.x0; })
  //           .attr('height', function (d) { return d.y1 - d.y0; })
  //           .style("stroke", "black")
  //           .style("fill", "#69b3a2");

  //       // and to add the text labels
  //       svg
  //         .selectAll("text")
  //         .data(root.leaves())
  //         .enter()
  //         .append("text")
  //           .attr("x", function(d){ return d.x0+10})    // +10 to adjust position (more right)
  //           .attr("y", function(d){ return d.y0+20})    // +20 to adjust position (lower)
  //           .text(function(d){ return d.data.name})
  //           .attr("font-size", "15px")
  //           .attr("fill", "white");

  //----Barplots

  const margin_bar = { top: 30, right: 0, bottom: 20, left: 50 },
    width_bar = innerWidth * 0.5 - margin_bar.left - margin_bar.right,
    height_bar = innerHeight * 0.35 - margin_bar.top - margin_bar.bottom;



  // append the svg object to the body of the page

  const svgBarplot = d3.select("#barPlot")
    .append("svg")
    .attr("width", width_bar + margin_bar.left + margin_bar.right)
    .attr("height", height_bar + margin_bar.top + margin_bar.bottom)
    .append("g")
    .attr("transform", `translate(${margin_bar.left},${margin_bar.top})`);


  // Parse the Data

  // List of subgroups = header of the csv files = soil condition here

  var rollupDatas = [];
  const subgroups = data.columns.slice(9, 13);

  color1  = d3.scaleOrdinal()
  .domain(subgroups)
  .range(['#e41a1c', '#1f77b4', '#ff7f0e', '#2ca02c'])


  d3.select("#checkbox").selectAll("input")
    .data(subgroups)
    .enter().append("label")
    .text(function (d) { return d; })
    .style("color","white")
    .style("background-color", function (d) {  
    
      return color1(d)})
    .append("input")
    .attr("checked", true)
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
        
        // svg.selectAll("rect.negative").remove()
      svgBarplot.selectAll("rect").remove();

      svgBarplot.append("g").selectAll("g")
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
        .attr("width", x_bar.bandwidth()).on('mousemove',mouseover).on('mouseout',mouseout)
        // .on("mousemove",mousemove);
    })

  // List of groups = species here = value of the first column called group -> I show them on the X axis
  const groups = data.map(d => (d.Genre));

  // Add X axis
  const x_bar = d3.scaleBand()
    .domain(groups)
    .range([0, width_bar])
    .padding([0.2])
  svgBarplot.append("g")
    .attr("transform", `translate(0, ${height_bar})`)
    .call(d3.axisBottom(x_bar).tickSizeOuter(0));

  // Add Y axis
  const y_bar = d3.scaleLinear()
    .domain([0, 1000])
    .range([height_bar, 0]);
  svgBarplot.append("g")
    .call(d3.axisLeft(y_bar));

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
  )
    .map(([k, v]) => ({ Genre: k, Sales: v }));

  // console.log(output_Sales);
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
