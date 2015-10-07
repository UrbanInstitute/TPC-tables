var TABLE_ID = "1787"
var JSON_PATH = "data/sample2.json"

var promise = new Promise(function(resolve, reject){
	d3.json(JSON_PATH, function(resp){
		var table = resp["tables"][TABLE_ID]["table_data"]
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
	var resp = buildTable(result);
	return resp;
})
.then(function(result){
	var resp = tdClasses(result);
	return resp;
})
.then(function(result){
	styleTable(result);
})




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
							// rows[parseInt(cell["data-row"])][parseInt(cell["data-col"])] = writeCell(cell, "data")
						}
					}
				}
			}
		}
	}
	return rows
	// window.setTimeout(function(){
	// 	buildTable(rows)}, 10);
}

function buildTable(rows){
	rows = rows.filter(function(n){
		n = n.filter(function(m){
			return m != undefined;
		})
		return n.length > 0;
	}); 

	var table = d3.select("#testTable")
		// .append("table")
	// if(table.selectAll("table")[0].length != 100){
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
			return (cellW - textW -22)/2
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