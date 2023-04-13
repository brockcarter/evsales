// Demensions of sunburst
var width = 750;
var height = 600;
var radius = Math.min(width, height) / 2;

// Breadcrumb dimensions: width, height, spacing, width of tip/tail
var b = {
    w: 150, h: 30, s: 3, t: 10
};

//Mapping of step names to colors
var colors = {
    "Tesla": "#5687d1",
    "Model_S": "#5687d1",
    "Model_X": "#5687d1",
    "Model_3": "#5687d1",

    "Chevrolet": "#de783b",
    "Volt": "#de783b",
    "Bolt_EV": "#de783b",
    "Spark_EV": "#de783b",

    "Toyota": "#5687d1",
    "Prius_Prime": "#5687d1",

    "Nissan": "#b4c8e8",
    "LEAF": "#b4c8e8",

    "Ford": "#2d7eff",
    "Fusion_Energi": "#2d7eff",
    "CMAX_Energi": "#2d7eff",
    "Focus_Electric": "#2d7eff",

    "Fiat": "#ff4747",
    "500e": "#ff4747",

    "BMW": "#e6ff59",
    "i3": "#e6ff59",
    "X5_xDrive40e": "#e6ff59",
    "330e": "#e6ff59",
    "530e": "#e6ff59",
    "740e": "#e6ff59",
    "i8": "#e6ff59",

    "VW": "#7c59ff",
    "eGolf": "#7c59ff",

    "Audi": "#e46dff",
    "A3_Sprtbk_etron": "#e46dff",

     "Chrysler": "#b7b5b7",
     "Pacifica_Hybrid": "#b7b5b7",

     "Hyundai": "#c0f9f8",
     "Sonata_PHV": "#c0f9f8",
     "IONIQ_Electric": "#c0f9f8",

     "Kia": "#dfadff",
     "Soul_EV": "#dfadff",
     "Optima_PHV": "#dfadff",

     "Volvo": "#c97e9c",
     "XC90_T8_PHEV": "#c97e9c",
     "XC60_PHEV": "#c97e9c",

     "Porsche": "#9b8890",
     "Cayenne_SE": "#9b8890",
     "Panamera_SE": "#9b8890",

     "Mercedez": "#b5ffad",
     "C350e": "#b5ffad",
     "S550e": "#b5ffad",
     "GLE_550e": "#b5ffad",
     "B250e": "#b5ffad",

     "Smart": "#99d8db",
     "ED": "#99d8db",

     "Mini": "#5f54a3",
     "Countryman_SE_PHV": "#5f54a3",

     "Cadillac": "#6a54f7",
     "CT6_PHV": "#6a54f7",
     "ELR": "#6a54f7",

     "Honda": "#c8e5b7",
     "Clarity_Electric": "#c8e5b7",

     "Mitsubishi": "#e5d9b7",
     "iMiEV": "#e5d9b7",







    "January": "#7d33fb",
    "February": "#649f5f",
    "March": "#97ac79",
    "April": "#4deaf4",
    "May": "#63ecc7",
    "June": "#3fa290",
    "July": "#ffe69a",
    "August": "#fa5948",
    "September": "#343209",
    "October": "#bd8b2e",
    "November": "#6fb5f6",
    "December": "#a173d1",

    "end": "#bbbbbb"
};

// Total size of all segments
var totalSize = 0;

var vis = d3.select("#chart").append("svg:svg")
    .attr("width", width)
    .attr("height", height)
    .append("svg:g")
    .attr("id", "container")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

var partition = d3.layout.partition()
    .size([2 * Math.PI, radius * radius])
    .value(function(d) {return d.size; });

var arc = d3.svg.arc()
    .startAngle(function(d) {return d.x;})
    .endAngle(function(d) {return d.x + d.dx;})
    .innerRadius(function(d) {return Math.sqrt(d.y);})
    .outerRadius(function(d) {return Math.sqrt(d.y + d.dy);});

// Use d3.text and d3.csv.parseRows so that we do not need to have a header
// row, and can receive the csv as an array of arrays. From bl.ocks.org/keryyrodden/
d3.text("evsales.csv", function(text) {
  var csv = d3.csv.parseRows(text);
  var json = buildHierarchy(csv);
  createVisualization(json);
});

// Function that actually generates the circle visualization
function createVisualization(json) {
    initializeBreadcrumbTrail();
    drawLegend();
    d3.select("#togglelegend").on("click", toggleLegend);

    vis.append("svg:circle")
        .attr("r", radius)
        .style("opacity", 0);

    var nodes = partition.nodes(json)
        .filter(function(d) {
            return(d.dx > 0.005);
        });

    var path = vis.data([json]).selectAll("path")
        .data(nodes)
        .enter().append("svg:path")
        .attr("display", function(d) { return d.depth ? null : "none"; })
        .attr("d", arc)
        .attr("fill-rule", "evenodd")
        .style("fill", function(d) {return colors[d.name]; })
        .style("opacity", 1)
        .on("mouseover", mouseover);

    d3.select("#container").on("mouseleave", mouseleave);

    totalSize = path.node().__data__.value;
};

function mouseover(d) {

  var percentage = (100 * d.value / totalSize).toPrecision(3);
  var percentageString = percentage + "%";
  if (percentage < 0.1) {
    percentageString = "< 0.1%";
  }

  d3.select("#percentage")
      .text(percentageString);

  d3.select("#explanation")
      .style("visibility", "");

  var sequenceArray = getAncestors(d);
  updateBreadcrumbs(sequenceArray, percentageString);

  // Fade all the segments
  d3.selectAll("path")
      .style("opacity", 0.3);

  // Highlight only those that are an ancestor of the selected segment
  vis.selectAll("path")
      .filter(function(node) {
                return (sequenceArray.indexOf(node) >= 0);
              })
      .style("opacity", 1);
}

function mouseleave(d) {

  // Remove breadcrumbs
  d3.select("#trail")
      .style("visibility", "hidden");

  // Deactivate all segments
  d3.selectAll("path").on("mouseover", null);

  // Transition each segment to full opacity and then reactivate it
  d3.selectAll("path")
      .transition()
      .duration(1000)
      .style("opacity", 1)
      .each("end", function() {
              d3.select(this).on("mouseover", mouseover);
            });

  d3.select("#explanation")
      .style("visibility", "hidden");
}

function getAncestors(node) {
    var path = [];
    var current = node;
    while (current.parent) {
        path.unshift(current);
        current = current.parent;
    }
    return path;
}

function initializeBreadcrumbTrail() {
    var trail = d3.select("#sequence").append("svg:svg")
        .attr("width", width)
        .attr("height", 50)
        .attr("id", "trail");
    trail.append("svg:text")
        .attr("id", "endlabel")
        .style("fill", "#000");
}


function breadcrumbPoints(d, i) {
    var points = [];
    points.push("0,0");
    points.push(b.w + ",0");
    points.push(b.w + b.t + "," + (b.h / 2));
    points.push(b.w + "," + b.h);
    points.push("0," + b.h);
    if (i>0) {
        points.push(b.t + "," + (b.h / 2));
    }
    return points.join(" ");
}

function updateBreadcrumbs(nodeArray, percentageString) {

  // Data join; key function combines name and depth (= position in sequence)
  var g = d3.select("#trail")
      .selectAll("g")
      .data(nodeArray, function(d) { return d.name + d.depth; });

  // Add breadcrumb and label for entering nodes
  var entering = g.enter().append("svg:g");

  entering.append("svg:polygon")
      .attr("points", breadcrumbPoints)
      .style("fill", function(d) { return colors[d.name]; });

  entering.append("svg:text")
      .attr("x", (b.w + b.t) / 2)
      .attr("y", b.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(function(d) { return d.name; });

  // Set position for entering and updating nodes
  g.attr("transform", function(d, i) {
    return "translate(" + i * (b.w + b.s) + ", 0)";
  });

  // Remove exiting nodes
  g.exit().remove();

  // Now move and update the percentage at the end
  d3.select("#trail").select("#endlabel")
      .attr("x", (nodeArray.length + 0.5) * (b.w + b.s))
      .attr("y", b.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(percentageString);

  // Make the breadcrumb trail visible, if it's hidden
  d3.select("#trail")
      .style("visibility", "");

}

function drawLegend() {

  // Dimensions of legend item: width, height, spacing, radius of rounded rect
  var li = {
    w: 150, h: 30, s: 3, r: 3
  };

  var legend = d3.select("#legend").append("svg:svg")
      .attr("width", li.w)
      .attr("height", d3.keys(colors).length * (li.h + li.s));

  var g = legend.selectAll("g")
      .data(d3.entries(colors))
      .enter().append("svg:g")
      .attr("transform", function(d, i) {
              return "translate(0," + i * (li.h + li.s) + ")";
           });

  g.append("svg:rect")
      .attr("rx", li.r)
      .attr("ry", li.r)
      .attr("width", li.w)
      .attr("height", li.h)
      .style("fill", function(d) { return d.value; });

  g.append("svg:text")
      .attr("x", li.w / 2)
      .attr("y", li.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(function(d) { return d.key; });
}

function toggleLegend() {
  var legend = d3.select("#legend");
  if (legend.style("visibility") == "hidden") {
    legend.style("visibility", "");
  } else {
    legend.style("visibility", "hidden");
  }
}

// Take a 2-column CSV and transform it into a hierarchical structure suitable
// for a partition layout. The first column is a sequence of step names, from
// root to leaf, separated by hyphens. The second column is a count of how
// often that sequence occurred. From Kerry Rodden's Sequence Sunburst
function buildHierarchy(csv) {
  var root = {"name": "root", "children": []};
  for (var i = 0; i < csv.length; i++) {
    var sequence = csv[i][0];
    var size = +csv[i][1];
    if (isNaN(size)) { // e.g. if this is a header row
      continue;
    }
    var parts = sequence.split("-");
    var currentNode = root;
    for (var j = 0; j < parts.length; j++) {
      var children = currentNode["children"];
      var nodeName = parts[j];
      var childNode;
      if (j + 1 < parts.length) {
   // Not yet at the end of the sequence; move down the tree.
    var foundChild = false;
    for (var k = 0; k < children.length; k++) {
      if (children[k]["name"] == nodeName) {
        childNode = children[k];
        foundChild = true;
        break;
      }
    }
  // If we don't already have a child node for this branch, create it
    if (!foundChild) {
      childNode = {"name": nodeName, "children": []};
      children.push(childNode);
    }
    currentNode = childNode;
      } else {
    // Reached the end of the sequence; create a leaf node
    childNode = {"name": nodeName, "size": size};
    children.push(childNode);
      }
    }
  }
  return root;
}

