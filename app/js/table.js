function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    console.log('Query variable %s not found', variable);
}

var SCROLL = false;
function render(){
	d3.selectAll("table").remove();
	var promise = new Promise(function(resolve, reject){
		d3.json("http://tpctables-stg.urban.org/node/29637/table_feed", function(resp){
			var table = resp["tables"]["29497"]["table_data"]
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
		d3.selectAll("svg").attr("height", result.node().parentNode.getBoundingClientRect().height);
	})
}
render();
window.onresize=render;

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
						.text(cell.value)
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
			col = col.filter(function(o){ return( !isNaN(parseFloat(o.value))) });
			var max = Math.max.apply(Math,col.map(function(o){return parseFloat(o.value);}))
			var min = Math.min.apply(Math,col.map(function(o){return parseFloat(o.value);}))
			d.min = min;
			d.max = max;
			var pos = col.filter(function(o){ return( parseFloat(o.value) > 0);  }).length;
			var neg = col.filter(function(o){ return( parseFloat(o.value) < 0);  }).length;
			var zero = col.filter(function(o){ return( parseFloat(o.value) == 0);  }).length;
			// if()
			console.log(d)
			// if(d["data-col"])
			if(pos == 0 && neg == 0){
				return false;
			}
			else if(d.value == null || isNaN(parseFloat(d.value))){
				return false;
			}
			else if(neg == 0){
				return "bar pos";
			}
			else if(pos == 0){
				return "bar neg";
			}
			else{
				if(parseFloat(d.value) < 0){
					return "splitBar neg";
				}
				else if(parseFloat(d.value) > 0){
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


	table.selectAll("td.bar.pos .barContainer")
		.style("width", function(d){
			var cellWidth = this.parentNode.offsetWidth*.8
			return cellWidth * (parseFloat(d.value)/ d.max)
		})
	table.selectAll("td.bar.neg .barContainer")
		.style("width", function(d){
				var cellWidth = this.parentNode.offsetWidth*.8
			var width = cellWidth * (parseFloat(d.value)/ d.min)
			d3.select(this)
				.style("margin-left", function(){
					return cellWidth/.8 - width - 20;
				})
			return width;
		})
	table.selectAll("td.splitBar.pos .barContainer")
		.style("margin-left", function(d){
			var cellWidth = this.parentNode.offsetWidth*.8
			return cellWidth/2
		})
		.style("width", function(d){
			var cellWidth = this.parentNode.offsetWidth*.8/2
			return cellWidth * (parseFloat(d.value)/ Math.max(d.max, Math.abs(d.min)))
		})
	table.selectAll("td.splitBar.neg .barContainer")
		.style("margin-left", function(d){
			var cellWidth = this.parentNode.offsetWidth*.8
			return cellWidth/2 - (cellWidth/2 * (Math.abs(parseFloat(d.value))/ Math.max(d.max, Math.abs(d.min))))
		})
		.style("width", function(d){
			var cellWidth = this.parentNode.offsetWidth*.8/2
			return cellWidth * (Math.abs(parseFloat(d.value))/ Math.max(d.max, Math.abs(d.min)))
		})
	return table;

}
function scrollTable(table){
	window.addEventListener("scroll", function(){
		var pos = window.pageXOffset || document.documentElement.scrollLeft
		var overlap = d3.select("table").node().getBoundingClientRect().width - d3.select("table").node().parentNode.getBoundingClientRect().width;
		if(overlap-pos <=50){
			d3.select(".rightFader")
				.style("right", -(50-(overlap-pos)))
		} else{
			d3.select(".rightFader")
				.style("right", 0)			
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
	.style("height", headHeight-12 + "px")

	d3.selectAll("tbody tr")
		.style("height", function(){
			var rowHeight = d3.select(this).node().getBoundingClientRect().height;
			return rowHeight + "px"
		})
	if(SCROLL){
		var rightShadow = table.append("svg")
			.classed("rightFader", true)
			.attr("height", function(){
				return table.node().parentNode.getBoundingClientRect().height
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
			.attr("height", function(){
				return table.node().parentNode.getBoundingClientRect().height
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
	obj["data-row"] = cell["data-row"]
	obj["data-col"] = cell["data-col"]
	obj["value"] = cell["data"]
	return obj
}