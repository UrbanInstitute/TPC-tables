function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
}

var SCROLL = false;
var RESIZE = false;
function render(resize){
	RESIZE = resize;
	var nodeID = getQueryVariable("node")
	var tableID = getQueryVariable("table")
	var promise = new Promise(function(resolve, reject){
		d3.json("data/sample2.json", function(resp){
			console.log(resp)
			var name = resp["tables"][tableID]["table_name"];
			d3.select("#tableTitle").text(name);
			var footnotes = resp["sheet_notes"];
			renderNotes(footnotes);
			var table = resp["tables"][tableID]["table_data"];
		//Top level keys are col numbers, but bc of nesting number of keys != number of columns
		//however largest(integer) key == number of columns
			var colCount = Math.max.apply(null, Object.keys(table).map(function(n){ return parseInt(n)+1 }))
			var rows =[]

			var initializer = table[0]
			var initRows = parseInt(initializer["header_cell"]["data-row"])
			for(var i = 0; i < initRows+1; i++){
				rows.push(new Array(colCount))
			}
			var tmp = rows[initRows]
			tmp.splice(0, 0, writeCell(initializer["header_cell"], "header"));
			for (ind in initializer["label_cells"]){
				var cell = initializer["label_cells"][ind]
				var row = parseInt(cell["data-row"])
				if(row < rows.length){
					tmp = rows[row]
					tmp.splice(0,0,writeCell(cell, "label"))
				}else{
					for(var j = rows.length; j < row+1; j++){
						rows.push(new Array(colCount))
						if(j == row){
							tmp = rows[row]
							tmp.splice(0,0,writeCell(cell, "label"))
						}
					}
				}
			}

			var resp = buildRows(rows, table)
			resolve(resp)

		})
	})
	promise.then(function(result){
		return buildTable(result);
	})
	.then(function(table){
		return tdClasses(table)
	})
	.then(function(table){
		return styleTable(table)
	})
	.then(function(table){
		return responsiveTable(table);
	})
	.then(function(table){
		return scrollTable(table);
	})
	.then(function(result){
		d3.selectAll("svg").attr("height", d3.select("table").node().getBoundingClientRect().height);
	})
}
render(true);
window.onresize=throttle;

var throttleTimer;
function throttle() {
  window.clearTimeout(throttleTimer);
    throttleTimer = window.setTimeout(function() {
      render(false);
    }, 100);
}


function checkScroll(){
	return d3.select("table").node().getBoundingClientRect().width > d3.select("table").node().parentNode.getBoundingClientRect().width;
}

function buildRows(rows, table){
	for(obj in table){
		if(table.hasOwnProperty(obj)){
			if (parseInt(obj)==0){
				continue
			}else{
				var data = table[obj]
				var header = data["header_cell"]
				var tmp = rows[parseInt(header["data-row"])]
				tmp.splice(parseInt(header["data-col"]), 0, writeCell(header, "header"))
				if(data.hasOwnProperty("nested")){
					buildRows(rows, data["nested"])
				}
				else{
					for(c in data["data_cells"]){
						if( (data["data_cells"]).hasOwnProperty(c)){
							var cell = data["data_cells"][c]
							var tmp = rows[parseInt(cell["data-row"])]
							tmp.splice(parseInt(cell["data-col"]), 0, writeCell(cell, "data"))
						}
					}
				}
			}
		}
	}
	return rows
}

function buildTable(rows){
	rows = rows.filter(function(n){
		n = n.filter(function(m){
			return m != undefined;
		})
		return n.length > 0;
	}); 
	d3.selectAll("table").remove();

	var table = d3.select("#testTable")
		table = table
			.append("table")
		var section = table.append("thead")
		table.append("tbody")

		for(var r = 0; r < rows.length; r++){
			var row = rows[r]
			var rowObj = section.append("tr")
			for(var c = 0; c < row.length; c++){
				var cell = row[c];
				if(cell == undefined){
					continue;
				}
				else if(cell.tag == "th"){
					rowObj.append("th")
						.datum(cell)
						.attr("rowspan", cell.rowspan)
						.attr("colspan", cell.colspan)
						.attr("data-col", cell["data-col"])
						.attr("data-row", cell["data-row"])
						.html(function(){
							if(cell.notesymbol != null){
								return cell.value + "<span class = \"symbol body_" + cell.notesymbol + "\"><sup>" + cell.notesymbol + "</sup></span>"
							}else{ return cell.value}
						})
				}
				else{
					section = table.select("tbody")
					section.node().appendChild(rowObj.node())
					rowObj.append("td")
						.datum(cell)
						.attr("rowspan", cell.rowspan)
						.attr("colspan", cell.colspan)
						.attr("data-col", cell["data-col"])
						.attr("data-row", cell["data-row"])
						.append("span")
						.classed("innerText", true)
						.text(cell.value)
				}
			}
		}
	// }
	return table
}

function tdClasses(table){
	table.selectAll("td")
		// .append("span")
		.attr("class", function(d){
			var col = d3.selectAll("td[data-col='" + d["data-col"] + "']").data();
			col = col.filter(function(o){ return( !isNaN(parseFloat(o.num))) });
			var max = Math.max.apply(Math,col.map(function(o){return parseFloat(o.num);}))
			var min = Math.min.apply(Math,col.map(function(o){return parseFloat(o.num);}))
			d.min = min;
			d.max = max;
			var pos = col.filter(function(o){ return( parseFloat(o.num) > 0);  }).length;
			var neg = col.filter(function(o){ return( parseFloat(o.num) < 0);  }).length;
			var zero = col.filter(function(o){ return( parseFloat(o.num) == 0);  }).length;
			if(pos == 0 && neg == 0){
				return false;
			}
			else if(d.num == null || isNaN(parseFloat(d.num))){
				return false;
			}
			else if(neg == 0){
				return "bar pos";
			}
			else if(pos == 0){
				return "bar neg";
			}
			else{
				if(parseFloat(d.num) < 0){
					return "splitBar neg";
				}
				else if(parseFloat(d.num) > 0){
					return "splitBar pos";
				}
				else{
					return false;
				}
			}
		})
		.append("span")
		.classed("barContainer", true)
	return table;
}

function styleTable(table){
	d3.selectAll(".symbol")
		.on("mouseover", function(){
			var symbol = d3.select(this).attr("class").replace("symbol","").replace("highlight").replace(/ /g,"").split("_")[1]
			console.log(symbol)
			d3.selectAll(".footer_" + symbol)
				.classed("highlight", true)
			d3.selectAll(".body_" + symbol)
				.classed("highlight", true)
		})
		.on("mouseout", function(){
			d3.selectAll(".highlight")
				.classed("highlight", false)
		})
	d3.selectAll(".footnote")
		.on("mouseover", function(){
			var symbol = d3.select(this).attr("class").replace("footnote","").replace("highlight").replace(/ /g,"").split("_")[1]
			console.log(symbol)
			d3.selectAll(".footer_" + symbol)
				.classed("highlight", true)
			d3.selectAll(".body_" + symbol)
				.classed("highlight", true)
		})
		.on("mouseout", function(){
			d3.selectAll(".highlight")
				.classed("highlight", false)
		})
	var duration = (RESIZE) ? 250 : 0;
	table.selectAll("td.bar.pos .barContainer")
		.transition()
		.duration(duration)
		.style("width", function(d){
			var cellWidth = this.parentNode.offsetWidth*.8
			return cellWidth * (parseFloat(d.num)/ d.max)
		})
		.style("opacity",1)
	table.selectAll("td.bar.neg .barContainer")
		.transition()
		.duration(duration)
		.style("width", function(d){
				var cellWidth = this.parentNode.offsetWidth*.8
			var width = cellWidth * (parseFloat(d.num)/ d.min)
			d3.select(this)
				// .transition()
				.style("margin-left", function(){
					return cellWidth/.8 - width - 20;
				})
			return width;
		})
		.style("opacity",1)
	table.selectAll("td.splitBar.pos .barContainer")
		.transition()
		.duration(duration)
		.style("margin-left", function(d){
			var cellWidth = this.parentNode.offsetWidth*.8
			return cellWidth/2
		})
		// .transition()
		.style("width", function(d){
			var cellWidth = this.parentNode.offsetWidth*.8/2
			return cellWidth * (parseFloat(d.num)/ Math.max(d.max, Math.abs(d.min)))
		})
		.style("opacity",1)
	table.selectAll("td.splitBar.neg .barContainer")
		.transition()
		.duration(duration)
		.style("margin-left", function(d){
			var cellWidth = this.parentNode.offsetWidth*.8
			return cellWidth/2 - (cellWidth/2 * (Math.abs(parseFloat(d.num))/ Math.max(d.max, Math.abs(d.min))))
		})
		.style("width", function(d){
			var cellWidth = this.parentNode.offsetWidth*.8/2
			return cellWidth * (Math.abs(parseFloat(d.num))/ Math.max(d.max, Math.abs(d.min)))
		})
		.style("opacity",1)


//center all text within cells
	table.selectAll(".innerText")
		.style("padding-right", function(){
			var textW = d3.select(this).node().getBoundingClientRect().width;
			var cellW = d3.select(this).node().parentNode.getBoundingClientRect().width;
			return (cellW - textW -21)/2
		})
//then, line up all right edges of text
	table.selectAll(".innerText")
		.style("padding-right", function(){
			var pads = []
			var col = d3.select(d3.select(this).node().parentNode).attr("data-col")
			var tds = d3.selectAll("td[data-col='" + col +"']")
			tds[0].forEach(function(td){
				pads.push(parseFloat(d3.select(td).select("span").style("padding-right").replace("px","")))
			})
			return Math.min.apply(Math, pads);
		})
	return table;

}
function scrollTable(table){
	window.addEventListener("scroll", function(){
		var pos = window.pageXOffset || document.documentElement.scrollLeft
		var posLeft =  window.pageXOffset || document.documentElement.scrollRight
		var overlap = d3.select("table").node().getBoundingClientRect().width - d3.select("table").node().parentNode.getBoundingClientRect().width;
		if(overlap-pos <=20){
		d3.select("#panRight img")
				.classed("enabled", false)
				.transition()
				.duration(100)
				.style("opacity", 0.1)
		}
		else if(overlap-pos <=50){
			d3.select(".rightFader")
				.style("right", -(50-(overlap-pos)))
		} else{
			d3.select("#panRight img")
				.classed("enabled", true)
				.style("opacity", 0.3)
			d3.select(".rightFader")
				.style("right", 0)			
		}

		if(posLeft <= 20 || typeof(posLeft) == "undefined"){
			d3.select("#panLeft img")
					.classed("enabled", false)
					.transition()
					.duration(100)
					.style("opacity", 0.1)
		}else{
			d3.select("#panLeft img")
				.classed("enabled", true)
				.style("opacity", 0.3)
		}



	});
	return table;
}
function responsiveTable(table){
	SCROLL = checkScroll();
	var headRows = d3.selectAll("thead tr")[0].length
	var headHeight = d3.select("thead").node().getBoundingClientRect().height;

	if(SCROLL){
		for(var r = 2; r < headRows+1; r++){
			d3.select("thead tr:nth-child(" + r + ")")
				.insert("th", "th:nth-child(1)")
				.classed("spacer", true)
		}
	}
	else{
		d3.selectAll(".spacer").remove()
	}
	d3.select("thead tr:nth-child(1) th:nth-child(1)")
		.style("height", headHeight-32 + "px")


	d3.selectAll("tbody tr")
		.style("height", function(){
			var rowHeight = d3.select(this).node().getBoundingClientRect().height;
			return rowHeight + "px"
		})
	d3.selectAll("tbody tr td:nth-child(1)")
		.style("height", function(){
			var row = d3.select(this).node().parentNode
			var rowHeight = d3.select(row).node().getBoundingClientRect().height -20;
			return rowHeight + "px"
		})
	if(SCROLL){
		d3.select("#headerWrapper").style("height", function(){
			return (d3.select("#tableTitle").node().getBoundingClientRect().height + 49) + "px"
		})
		d3.select("#chartToggle").style("top", function(){
			return (d3.select("#tableTitle").node().getBoundingClientRect().height + 2) + "px"
		})
		d3.select("#scrollArrows").style("top", function(){
			return (d3.select("#tableTitle").node().getBoundingClientRect().height -2) + "px"
		})
		.transition()
		.style("opacity",1)

		d3.selectAll(".headerElement").classed("scroll", true)
		var rightShadow = table.append("svg")
			.classed("rightFader", true)
			.style("top", function(){
				return d3.select("table").node().getBoundingClientRect().top - d3.select("body").node().getBoundingClientRect().top			
		   })
			.append("g")
		  var gradient = rightShadow.append("svg:defs")
		    .append("svg:linearGradient")
		      .attr("id", "rightGradient")
		      .attr("x1", "0%")
		      .attr("y1", "0%")
		      .attr("x2", "100%")
		      .attr("y2", "0%")
		      .attr("spreadMethod", "pad");

		  gradient.append("svg:stop")
		      .attr("offset", "0%")
		      .attr("stop-color", "#fff")
		      .attr("stop-opacity", 0);
		  gradient.append("svg:stop")
		      .attr("offset", "100%")
		      .attr("stop-color", "#fff")
		      .attr("stop-opacity", 1);

		  rightShadow.append("rect")
		      .attr("class", "scrollFade gradient")
		      .attr("x",0)
		      .attr("y",0)
		      .attr("width", 80)
		      .attr("height", "100%")
		      .attr("fill", "url(#rightGradient)")


		var leftShadow = table.append("svg")
			.classed("leftFader", true)
			.style("top", function(){
				return d3.select("table").node().getBoundingClientRect().top - d3.select("body").node().getBoundingClientRect().top			
			})
			.append("g")
		  var gradient = leftShadow.append("svg:defs")
		    .append("svg:linearGradient")
		      .attr("id", "leftGradient")
		      .attr("x1", "0%")
		      .attr("y1", "0%")
		      .attr("x2", "100%")
		      .attr("y2", "0%")
		      .attr("spreadMethod", "pad");

  //first-column gradient: simple linear gradient, going from 30% to 0% over the width
		  gradient.append("svg:stop")
		      .attr("offset", "00%")
		      .attr("stop-color", "#000")
		      .attr("stop-opacity", .3);

		  gradient.append("svg:stop")
		      .attr("offset", "100%")
		      .attr("stop-color", "#000")
		      .attr("stop-opacity", 0);

		  leftShadow.append("rect")
		      .attr("class", "scrollFade gradient")
		      .attr("x",0)
		      .attr("y",0)
		      .attr("width", 5)
		      .attr("height", "100%")
		      .attr("fill", "url(#leftGradient)")

	}
	else{
		d3.select("#scrollArrows").style("top", function(){
			return (d3.select("#tableTitle").node().getBoundingClientRect().height + 4) + "px"
		})
		.transition()
		.style("opacity",0)
	}

	table.classed("scrolling", SCROLL)
	return table;
}

function writeCell(cell, type){
	var obj = {}
	var tag = (type == "header") ? "th" : "td";
	obj.tag = tag
	var classes = cell["class"]
	var newClasses = []
	for(var i =0; i< classes.length; i++){
		if(classes[i] == "" || isNaN(classes[i]) == false){
			continue
		}else{
			newClasses.push(classes[i])

		}
	}
	obj["classes"] = newClasses
	if(parseInt(cell["colspan"]) != 1 && cell["colspan"] != null){ obj.colspan = cell.colspan }
	if(parseInt(cell["rowspan"]) != 1 && cell["rowspan"] != null){ obj.rowspan = cell.rowspan }
	if(cell["data-notesymbol"] != null){ obj.notesymbol = cell["data-notesymbol"]}
	obj["data-row"] = cell["data-row"]
	obj["data-col"] = cell["data-col"]
	obj["value"] = (cell["data"] == null) ? "" : cell["data"]
	obj["num"] = (cell["data"] == null) ? "" : cell["data"].replace(/,/g,"")
	return obj
}


var show1 = 1;

d3.select("#s1").on("click", function () {
    if (show1 == 1) {
        d3.select("#s1.switch")
            .attr("class", "switch off");
        d3.select("#onoff")
            .style("color", "#F0F0F0");
        d3.selectAll(".barContainer")
	        .transition()
	        .style("width", "0px")
	        .style("opacity",0)
        show1 = 0;
    } else {
        d3.select("#s1.switch")
            .attr("class", "switch on");
        d3.select("#onoff")
            .style("color", "#666");
        show1 = 1;
        var table = d3.select("table")
        RESIZE = true;
        styleTable(table)
    }
});

function renderNotes(notes){
	var noteHTML = ""
	for(var i = 0; i < notes.length; i++){
		noteHTML += "<div class =\"footnote footer_" + notes[i]["note_symbol"] + "\">"
		noteHTML += "<span class = \"notesymbol\">(" + notes[i]["note_symbol"] + ")" + "</span>"
		noteHTML += "<div class = \"notetext\">" + notes[i]["note_text"] + "</div>"
		noteHTML += "</div>"
	}
	d3.select("#tableNotes")
		.html(noteHTML)
}



$(document).ready(function () {
	(function () {

		var scrollHandle = 0,
		    scrollStep = 5,
		    fixTable = $("body");

		//Start the scrolling process
		$(".panner").on("mousedown", function () {
		    var data = $(this).data('scrollModifier'),
		        direction = parseInt(data, 10);

		    $(this).addClass('active');

		    startScrolling(direction, scrollStep);
		});

		//Kill the scrolling
		$(".panner").on("mouseup", function () {
		    stopScrolling();
		    $(this).removeClass('active');
		});

		//Actual handling of the scrolling
		function startScrolling(modifier, step) {
		    if (scrollHandle === 0) {
		        scrollHandle = setInterval(function () {
		            var newOffset = fixTable.scrollLeft() + (scrollStep * modifier);

		            fixTable.scrollLeft(newOffset);
		        }, 10);
		    }
		}

		function stopScrolling() {
		    clearInterval(scrollHandle);
		    scrollHandle = 0;
		}

	}());
	
});