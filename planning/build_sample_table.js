


if (!Array.prototype.find) {
  Array.prototype.find = function(predicate) {
    if (this == null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}

// ********************************************************************************************************************************************************

d3.json("complex_table.json", function(error, json) {
  if (error) return console.warn(error);
  build_table(json);
});




Object.prototype.findKey = function(keyObj) {
    var p, key, val, tRet;
    for (p in keyObj) {
        if (keyObj.hasOwnProperty(p)) {
            key = p;
            val = keyObj[p];
        }
    }

    for (p in this) {
        if (p == key) {
            if (this[p] == val) {
                return this;
            }
        } else if (this[p] instanceof Object) {
            if (this.hasOwnProperty(p)) {
                tRet = this[p].findKey(keyObj);
                if (tRet) { return tRet; }
            }
        }
    }

    return false;
};







function build_table(json){
	var table = d3.select("body").append("table"),
        thead = table.append("thead"),
        tbody = table.append("tbody");
	var components = decompose_json(json)
	build_title(components.title);
	var columns =
		build_column_array(
			generateIds(components.columns)
		);

	col_array.map(function(c){return c.header_row = depthOfId(columns,c.id)});
	col_array.map(function(c){return c.colspan = objColSpan(columns,c.id)})
	var max_depth = Math.max.apply(Math, DEPTHS)
	//if element has no children, its rowspan = max_depth - row_number + 1
	//otherwise it equals 1
	col_array.map(function(c){return c.rowspan = objRowSpan(columns, c.id, max_depth)})
	// console.log(depthOfId(columns,"A_2"))
	// var tmp = ["A_2","B_5","C_8","D_9","E_6","F_3","G_6","H_7","I_8","J_4"]
	// tmp.map(function(c){return console.log(c, objColSpan(columns,c))});
	// console.log(generateIds(components.columns))
	build_columns(col_array,thead)
	build_rows(components.rows);
	build_footnotes(components.footnotes);
}

function decompose_json(json){
	var tmp_table = json["tables"][0];
	var components = {
		"title": tmp_table["title"],
		"columns": tmp_table["columns"],
		"rows": tmp_table["rows"],
		"footnotes": tmp_table["footnotes"],
		"conditional styles": tmp_table["conditional styles"]
	}
	return components
}


var autoIncrement = 0;
function generateIds(data){
	var cols = data.map(function(c){autoIncrement++; return objId(c, autoIncrement)});
	return cols;
}

// Functions to generate html attributes need unique identifier, which is constructed from the object label + 
// an autoincrementing integer
var objId = function(obj, id){
	for(key in obj){
		if(key === "label"){
			id++
			obj["id"] = obj["label"] + "_" + id.toString();
		}
		else if(key === "children"){
			id++
			obj["children"].map(function(c){id++; return objId(c,id)})
		}
		else{
			id++
		}
	}
	return obj
}

function build_title(title){

}


function notEmpty(element){
	if(typeof element !== "undefined" && element !== null){
		return element
	}
}

var DEPTHS = []
var depthOfId = function(columns,id) {
	var cols = columns.map(function(c){return objDepth(c,id,1)});
	var d = cols.find(notEmpty)
	DEPTHS.push(d)
	return d;

}


var objDepth = function(parent,id,row){
	var depth;
	if(parent["id"]==id){
		depth = [row];
	}
	else if(parent["id"] !== id && parent.hasOwnProperty("children")){
		row++
		depth = parent["children"].map(function(c){ return objDepth(c,id,row)});
	}
	else{
		depth = []
	}
	return depth.find(notEmpty)
}

var colspan;
var objColSpan = function(columns,id){
	var obj = columns.findKey({id:id})
	colspan = 0;
	noChildren(obj)
	return colspan;
}

var objRowSpan = function(columns, id, max_depth){
	var obj = columns.findKey({id:id})
	if(!obj.hasOwnProperty("children")){
		return max_depth - obj.header_row + 1
	}
	else{
		return 1
	}
}
var noChildren = function(obj){
	if(obj.hasOwnProperty("children")){
		obj["children"].map(function(c){return noChildren(c)})
	}
	else{
		colspan++;
	}
}


var col_array =[];
var build_column_array = function(columns){
	for(var i = 0; i< columns.length; i++){
		col_array.push(columns[i]);
		if(columns[i].hasOwnProperty("children")){
			build_column_array(columns[i]["children"]);
		}
	}
	return(columns)
}

// function build_columns(columns){
	
// 	for(var i = 0; i < columns.length; i++) {
// 		promises.push(function(){
// 			col = columns[i]
// 			var header = {"label":col["label"]}
// 			header.row_span = 1
// 			header.col_span = 1
// 			header.row = 1
// 			if(col.hasOwnProperty("children")){
// 				counter++
// 				console.log("header", [header])
// 				console.log(col["children"])
// 				var children = promises.push(drill_down([header],col["children"]))
// 			}
// 			return headers.push(header)
// 			// return console.log("test")
// 			})
// 		promises.push(function(){
// 				if(typeof children !== "undefined"){
// 					for(var j = 0; j < children.length; j++){
// 						headers.push(children[i])
// 					}
// 				}
// 			});
// 	}
// 	Q.all(promises).then(console.log(promises))

// }

// 	// promises.push(console.log(headers))

// function drill_down(parents,children){
// 	var output = [];
// 	console.log("counter",counter);
// 	console.log("parents",parents);
// 	console.log("children",children);	
// 	for(var i = 0; i < children.length; i++){
// 		if(!children[i].hasOwnProperty("children")){
// 			for(var j = 0; j < parents.length; j++){
// 				parents[j].col_span++
// 				parents[j].row += j
// 			}
// 			var header = {"label":children[i]["label"], "col_span":1,"row_span":1,"row":j}
// 			output.push(header)
// 		}
// 		else{
// 			counter++
// 			parents.push(children[i])
// 			promises.push(drill_down(parents, children[i]["children"]))
// 		}
// 	}
// 	return output;
// }
function build_columns(col_array,thead){
	for(var i = 0; i< Math.max.apply(Math, DEPTHS); i++){
		thead.append('tr')
		.attr('class','header_row_'+(i+1).toString())
	}
	console.log(col_array)
	col_array.map(function(c){
		d3.select('.header_row_'+c.header_row.toString())
		.append('td')
		.attr('rowspan',c.rowspan)
		.attr('colspan',c.colspan)
		.text(c.label)

	})
}

function build_rows(rows){

}

function build_footnotes(footnotes){

}

