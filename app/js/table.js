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

var promise = new Promise(function(resolve, reject){
	d3.json("data/sample2.json", function(resp){
		var table = resp["tables"]["1787"]["table_data"]
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
	return table;
}

function styleTable(table){
	table.selectAll("td.bar.pos span")
		.style("width", function(d){
			var cellWidth = this.parentNode.offsetWidth*.8
			return cellWidth * (parseFloat(d.value)/ d.max)
		})
	table.selectAll("td.bar.neg span")
		.style("width", function(d){
			console.log(d)
			var cellWidth = this.parentNode.offsetWidth*.8
			var width = cellWidth * (parseFloat(d.value)/ d.min)
			d3.select(this)
				.style("margin-left", function(){
					return cellWidth/.8 - width - 20;
				})
			return width;
		})
	table.selectAll("td.splitBar.pos span")
		.style("margin-left", function(d){
			var cellWidth = this.parentNode.offsetWidth*.8
			return cellWidth/2
		})
		.style("width", function(d){
			var cellWidth = this.parentNode.offsetWidth*.8/2
			return cellWidth * (parseFloat(d.value)/ Math.max(d.max, Math.abs(d.min)))
		})
	table.selectAll("td.splitBar.neg span")
		.style("margin-left", function(d){
			var cellWidth = this.parentNode.offsetWidth*.8
			return cellWidth/2 - (cellWidth/2 * (Math.abs(parseFloat(d.value))/ Math.max(d.max, Math.abs(d.min))))
		})
		.style("width", function(d){
			var cellWidth = this.parentNode.offsetWidth*.8/2
			// console.log(Math.max(d.max, Math.abs(d.min)))
			return cellWidth * (Math.abs(parseFloat(d.value))/ Math.max(d.max, Math.abs(d.min)))
		})
	// table.selectAll("td")
	// 	.style("background-color", function(d){
	// 		if(parseInt(d["data-col"]) % 2 == 1){
	// 			return "rgba(0,0,0,.1)";
	// 		}
	// 	})
	// table.selectAll("th")
	// 	.style("background-color", function(d){
	// 		if(parseInt(d["data-col"]) % 2 == 1){
	// 			return "rgba(0,0,0,.1)";
	// 		}
	// 	})

}
function addRow(rows, colCount){
	rows.push(new Array(colCount))
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