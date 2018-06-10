/*
Copyright 2017 Benjamin RICAUD

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// Module to display information on the side bars of the visualization page.

var infobox = (function(){
	"use strict";

	//private variables
	var _table_IDinfo = {};
	var _table_DBinfo = {};
	var _table_Graphinfo = {};
	var _side_image = {};
	var _font_size = "12px";

	////////////////////////
	// Public function
	function create(label_graph,label_graphElem){
		var graph_bar = d3.select(label_graph);
		graph_bar.append("h2").text("Graph Info")
		_table_Graphinfo = graph_bar.append("table").attr("id","tableGraph");
		init_table(_table_Graphinfo,["Type","Count"]);

		var graphElem_bar = d3.select(label_graphElem);
		graphElem_bar.append("h2").text("Item Info")
		_table_IDinfo = graphElem_bar.append("table").attr("id","tableIdDetails");
		init_table(_table_IDinfo,["Key","Value"]);
		_table_DBinfo = graphElem_bar.append("table").attr("id","tableDBDetails");
		init_table(_table_DBinfo,["Key","Value","Property"]);
		hide_element(label_graph);

	}

	function init_table(table_handle,entries){
		var table_head = table_handle.append("thead");
	  	var row = table_head.append("tr");
	  	for (var key in entries){
	 		row.append("th").text(entries[key]);
	 	}
	 	var table_body = table_handle.append("tbody");
	  	var row = table_body.append("tr");
	  	for (var key in entries){
	 		row.append("td").text("");
	 	}
	}

	function display_graph_info(data){
		_table_Graphinfo.select("tbody").remove();
	  	var info_table = _table_Graphinfo.append("tbody");
	  	var data_to_display = data[0][0];
	  	append_keysvalues(info_table,{"Node labels":""},"bold");
	  	append_keysvalues(info_table,data_to_display,"normal");
	  	data_to_display = data[1][0];
	  	append_keysvalues(info_table,{"Nodes properties":""},"bold");
	  	append_keysvalues(info_table,data_to_display,"normal");
	  	var data_to_display = data[2][0];
	  	append_keysvalues(info_table,{"Edge labels":""},"bold");
	  	append_keysvalues(info_table,data_to_display,"normal");
	  	data_to_display = data[3][0];
	  	append_keysvalues(info_table,{"Edge properties":""},"bold");
	  	append_keysvalues(info_table,data_to_display,"normal");
	}

	function append_keysvalues(table_body,data,type){
		for (var key in data){
			var info_row = table_body.append("tr");
	 		var key_text = info_row.append("td").text(key).style("font-size",_font_size);
	 		var value_text = info_row.append("td").text(data[key]).style("font-size",_font_size);
	 		if (type=="bold") {
	 			key_text.style('font-weight','bolder');}
		}
	}

	function hide_element(element_label){
		var element = d3.select(element_label);
		element.style('display','none');
	}
	function show_element(element_label){
		var element = d3.select(element_label);
		element.style('display','inline');
	}

	function show_graph_info(){
		show_element(_)
	}

	function display_info(node_data){
		// remove previous info		
		_display_IDinfo(node_data)
		_display_DBinfo(node_data);
	}

	//////////////////////
	// Private functions
	function _display_IDinfo(d){
		_table_IDinfo.select("tbody").remove();
	  	var info_table = _table_IDinfo.append("tbody");
	  	// Keep only the entries in id_keys, to display
	  	var id_keys = ["id","label"];
	  	var data_dic = {}
	  	for (var key in id_keys){
	  		data_dic[id_keys[key]] = d[id_keys[key]]
	  	}
	  	append_keysvalues(info_table,data_dic)
	}

	function _display_DBinfo(d){
		_table_DBinfo.select("tbody").remove();
	 	var info_table = _table_DBinfo.append("tbody");
	 	if (d.type=='vertex'){
		 	for (var key in d.properties){
		 		_display_vertex_properties(key,d.properties[key],info_table)
		 	}
		}
		else {
		 	for (var key in d.properties){
		 		var new_info_row = info_table.append("tr");
	 			new_info_row.append("td").text(key);
	 			new_info_row.append("td").text(d.properties[key]);
	 			new_info_row.append("td").text("")
			}
		}
	}

	function _display_vertex_properties(key,value,info_table) {
 		for (var subkey in value){
			// Ignore the summary field, which is set in graphioGremlin.extract_infov3()
			if (subkey === "summary") {
				continue;
			}
 			if ( ((typeof value[subkey] === "object") && (value[subkey] !== null)) && ('properties' in value[subkey]) ){
 				for (var subsubkey in value[subkey].properties){
 					var new_info_row = info_table.append("tr");
 					new_info_row.append("td").text(key).style("font-size",_font_size);
 					new_info_row.append("td").text(value[subkey].value).style("font-size",_font_size);
 					new_info_row.append("td").text(subsubkey + ' : '+ value[subkey].properties[subsubkey]).style("font-size",_font_size);
 				}
 			} else {
 				var new_info_row = info_table.append("tr");
 				new_info_row.append("td").text(key).style("font-size",_font_size);
 				new_info_row.append("td").text(value[subkey].value).style("font-size",_font_size);
 				new_info_row.append("td").text('').style("font-size",_font_size);
 			}
		}
	}


	return {
		create : create,
		display_info : display_info,
		display_graph_info : display_graph_info,
		hide_element : hide_element,
		show_element : show_element
	};
})();
