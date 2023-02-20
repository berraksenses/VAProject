console.log( )

viewportHeight = window.innerHeight;
viewportWidth = window.innerWidth;

const margin_scatter = {top: 20, right: 30 , bottom: 30, left: 30},
        width_scatter = (viewportWidth*0.4) - margin_scatter.left - margin_scatter.right,
        height_scatter = viewportHeight*0.6 - margin_scatter.top - margin_scatter.bottom;

const margin_parallel = {top: 20, right: 10, bottom: 30, left: 30},
        width_parallel = (viewportWidth*0.55) - margin_parallel.left - margin_parallel.right,
        height_parallel = viewportHeight*0.6 - margin_parallel.top - margin_parallel.bottom;

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

    
///----trial for stratify

// function pre_stratify(data){
//     const dataForStratify = [{name: "root", parent: null, value: null}];

//     // add I children for unique genres
//     const genres = [...new Set(data.map(k => k.Genre))];
//     genres.forEach(k => dataForStratify.push({name: k, parent: "root", value: null}));
    
//     // add active inactive children for each color 
//     const genreCounts = genres.reduce((a, g) => {
//       const genreItems = dataset.filter(k => k.Genre === g).length; 
//     //   const actives = genreItems.filter(k => k.isActive === true).length;
//     //   const inactives = colorItems.filter(k => k.isActive === false).length;
//       a.push({
//         name: "active",
//         parent: g,
//         value: genreItems
//       });
//     //   a.push({
//     //     name: "inactive",
//     //     parent: c,
//     //     value: inactives
//     //   });
//       return a;
//     }, []);
//     genreCounts.forEach(k => dataForStratify.push(k));
    
//     console.log(dataForStratify);
// }

//trial finishes



// function create_hierarchy(data) {
//     var tree_data = [{"name": "root", "parent": null, "value": null}];
//     genres = [];
//     platform = [];
//     publisher = [];
//     for (let i = 0; i < data.length; i++) {
//         if(genres.includes(item,data[i].Genre)){
//             tree_data.n
//         }
//     } 
//     console.log(data.columns);       
// }    

d3.csv("/home").then(function(data) {
    // Add X axis
    const x_scatter = d3.scaleLinear()
    .domain([-1, 28])
    .range([ 0, width_scatter ]);
    svgScatterPlot.append("g")
    .attr("transform", `translate(0, ${height_scatter})`)
    .call(d3.axisBottom(x_scatter));

    // Add Y axis
    const y_scatter = d3.scaleLinear()
    .domain([-8, 12])
    .range([ height_scatter, 0]);
    svgScatterPlot.append("g")
    .call(d3.axisLeft(y_scatter));

    var color = d3.scaleOrdinal()
    .domain(["red", "green" ])
    .range([ "#EE4B2B", "#41924B"])


  var legend = svgScatterPlot.selectAll(".legend")
  .data(["Below Average Sales", "Above Average sale"])//hard coding the labels as the datset may have or may not have but legend should be complete.
  .enter().append("g")
  .attr("class", "legend")
  .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

// draw legend colored rectangles
legend.append("rect")
  .attr("x", width_scatter - 18)
  .attr("width", 18)
  .attr("height", 18)
  .style("fill", function(d){return color(d)});

// draw legend text
legend.append("text")
  .attr("x", width_scatter - 24)
  .attr("y", 9)
  .attr("dy", ".35em")
  .style("text-anchor", "end")
  .text(function(d) { return d;});

    // Add dots
svgScatterPlot.append('g')
    .selectAll("dot")
    .data(data)
    .join("circle")
    .attr("cx", function (d) { return x_scatter(d.X1); } )
    .attr("cy", function (d) { return y_scatter(d.X2); } )
    .attr("r", 2).style("opacity",".3")
    .style("fill", function (d) { return color(d.color) } )


//---------------------------------------
    //Parallel coordinates
      // Extract the list of dimensions we want to keep in the plot. Here I keep all except the column called Species
    dimensions = Object.keys(data[0]).filter(function(d) { return (d != "X1" && d != "" && d!="X2" && d!="color" && d!="Name" && d!="Publisher" )})
      // For each dimension, I build a linear scale. I store all in a y object
    const y1 = {}
    for (i in dimensions) {
        // console.log(i);
        if(dimensions[i] != "Platform" && dimensions[i] != "Genre" && dimensions[i] != "Year"){
            names = dimensions[i]
            // console.log(names);
            y1[names] = d3.scaleLinear()
                .domain(d3.extent(data, function(d) { 
                    // console.log(d[names])
                    return +d[names]; }) )
                .range([height_parallel, 0])
        }
        else {
            names = dimensions[i]
            domains_sorted = data.map(function(p){
                if(names == "Year"){
                    p[names] = p[names].substring(0,p[names].length-2);
                }return p[names];}).sort();
            y1[names] = d3.scalePoint().domain(domains_sorted).range([height_parallel,0]);
        }
}    
      // Build the X scale -> it find the best position for each Y axis
    x1 = d3.scalePoint()
    .range([0, width_parallel])
    .padding(0.1)
    .domain(dimensions);

      // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
    function path(d) {
        return d3.line()(dimensions.map(function(p) { 
            return [x1(p), y1[p](d[p])]; }));
    }
      // Draw the lines
    svgParallel
    .selectAll("myPath")
    .data(data)
    .join("path")
    .attr("d",  path)
    .style("fill", "none")
    .style("stroke", "#69b3a2")
    .style("opacity", 0.3)

    // Draw the axis:
    svgParallel.selectAll("myAxis")
    // For each dimension of the dataset I add a 'g' element:
    .data(dimensions).enter()
    .append("g")
    // I translate this element to its right position on the x axis
    .attr("transform", function(d) { return "translate(" + x1(d) + ")"; })
    // And I build the axis with the call function
    .each(function(d) { d3.select(this).call(d3.axisLeft().scale(y1[d])); })
    // Add axis title
    .append("text")
        .style("text-anchor", "middle")
        .attr("y", -9)
        .text(function(d) { return d; })
        .style("fill", "black")



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

const margin_bar = {top: 10, right: 30, bottom: 20, left: 50},
    width_bar = innerWidth*0.5 - margin_bar.left - margin_bar.right,
    height_bar = innerHeight *0.4 - margin_bar.top - margin_bar.bottom;

// append the svg object to the body of the page
const svg = d3.select("#barPlot")
  .append("svg")
    .attr("width", width_bar + margin_bar.left + margin_bar.right)
    .attr("height", height_bar + margin_bar.top + margin_bar.bottom)
  .append("g")
    .attr("transform", `translate(${margin_bar.left},${margin_bar.top})`);

    
// Parse the Data

  // List of subgroups = header of the csv files = soil condition here
  const subgroups = data.columns.slice(9,13);

     d3.select("#checkbox").selectAll("input")
                    .data(subgroups)
                    .enter().append("label")
                    .text(function(d) { return d; })
                    
                    .append("input")
                    .attr("checked", true)
                    .attr("type", "checkbox")
                    .attr("transform", function(d, i) { return "translate(0," + i * 10 + ")"})
                    .attr("id", function(d,i) { return i; })
                    // .attr("onClick", "change(this)")
                    .attr("for", function(d,i) { return i; })
                    
  // List of groups = species here = value of the first column called group -> I show them on the X axis
  const groups = data.map(d => (d.Genre));

  // Add X axis
  const x_bar = d3.scaleBand()
      .domain(groups)
      .range([0, width_bar])
      .padding([0.2])
  svg.append("g")
    .attr("transform", `translate(0, ${height_bar})`)
    .call(d3.axisBottom(x_bar).tickSizeOuter(0));

  // Add Y axis
  const y_bar = d3.scaleLinear()
    .domain([0, 1750])
    .range([height_bar, 0 ]);
  svg.append("g")
    .call(d3.axisLeft(y_bar));

var output_Sales = d3.rollups(
              data,
              xs => [d3.sum(xs, x => x.JP_Sales),d3.sum(xs, x => x.EU_Sales),d3.sum(xs, x => x.NA_Sales),d3.sum(xs, x => x.Other_Sales)],
              d => d.Genre
            )
            .map(([k, v]) => ({ Genre: k, Sales: v }));

var barData = [];
for (let i = 0; i < output_Sales.length; i++) {
     var deneme = {};
     deneme.Genre = output_Sales[i].Genre;
     deneme.JP_Sales = output_Sales[i].Sales[0];
     deneme.EU_Sales = output_Sales[i].Sales[1];
     deneme.NA_Sales = output_Sales[i].Sales[2];
     deneme.Other_Sales = output_Sales[i].Sales[3];
     barData.push(deneme);
 }            

console.log(subgroups);
                       
    
  // color palette = one color per subgroup
  color = d3.scaleOrdinal()
    .domain(subgroups)
    .range(['#e41a1c','#1f77b4','#ff7f0e','#2ca02c'])

  //stack the data? --> stack per subgroup
  const stackedData = d3.stack()
    .keys(subgroups)
    (barData)
    console.log(stackedData)

  // Show the bars
  svg.append("g")
    .selectAll("g")
    // Enter in the stack data = loop key per key = group per group
    .data(stackedData)
    .join("g")
      .attr("fill", d => color(d.key))
      .selectAll("rect")
      // enter a second time = loop subgroup per subgroup to add all rectangles
      .data(d=>d)
      .join("rect")
        .attr("x", d => x_bar(d.data.Genre))
        .attr("y", d => y_bar(d[1]))
        .attr("height", d => y_bar(d[0]) - y_bar(d[1]))
        .attr("width",x_bar.bandwidth())





    //checkbox
    // d3.select("#barPlot").append('input').attr('type','checkbox')
    // .data(subgroups)
    // .enter().append("label")
    // .attr("checked", true)
    // .attr("id", function(d,i) { return i; })
    // .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });


 
    
});
