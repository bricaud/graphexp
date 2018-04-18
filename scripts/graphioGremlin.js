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

// Interface between the visualization and the Gremlin server.

var graphioGremlin = (function(){
	"use strict";

	var _node_properties = [];
	var _edge_properties = [];


	function get_node_properties(){
		return _node_properties;
	}
	function get_edge_properties(){
		return _edge_properties;
	}
		
		function create_single_command(query){
			var equalIndex = query.indexOf("=");
			var semiColonIndex = query.indexOf(";");
			if( equalIndex >= 0){
				if(semiColonIndex < 0){
					query = query.substring(equalIndex+1);
				} else {
					query = query.substring(equalIndex+1,semiColonIndex);
				}
			}
			var returnQuery = query.trim()+".toList();";
			return returnQuery;
		}

	function get_graph_info(){
		var gremlin_query_nodes = "nodes = g.V().groupCount().by(label);"
		var gremlin_query_edges = "edges = g.E().groupCount().by(label);"
		var gremlin_query_nodes_prop = "nodesprop = g.V().valueMap().select(keys).groupCount();"
		var gremlin_query_edges_prop = "edgesprop = g.E().valueMap().select(keys).groupCount();"
		
		var gremlin_query = gremlin_query_nodes+gremlin_query_nodes_prop
			+gremlin_query_edges+gremlin_query_edges_prop
			+ "[nodes.toList(),nodesprop.toList(),edges.toList(),edgesprop.toList()]"
		// while busy, show we're doing something in the messageArea.
		$('#messageArea').html('<h3>(loading)</h3>');
		var message = ""
				if(SINGLE_COMMANDS_AND_NO_VARS){
					var node_label_query = create_single_command(gremlin_query_nodes);
					var edge_label_query = create_single_command(gremlin_query_edges);
					var node_prop_query = create_single_command(gremlin_query_nodes_prop);
					var edge_prop_query = create_single_command(gremlin_query_edges_prop);
					send_to_server(node_label_query, null, null, null, function(nodeLabels){
					   send_to_server(edge_label_query, null, null, null, function(edgeLabels){
						   send_to_server(node_prop_query, null, null, null, function(nodeProps){
							   send_to_server(edge_prop_query, null, null, null, function(edgeProps){
								   var combinedData = [nodeLabels, nodeProps, edgeLabels, edgeProps];
								   console.log("Combined data", combinedData);
								   handle_server_answer(combinedData,'graphInfo',null,message);
							   });
						   });
					   });
					});
				} else {
					send_to_server(gremlin_query,'graphInfo',null,message)
				}
	}



	function search_query() {
		// Preprocess query
		let input_string = $('#search_value').val();
		let input_field = $('#search_field').val();
		let label_field = $('#label_field').val();
		let limit_field = $('#limit_field').val();
		let search_type = $('#search_type').val();
		//console.log(input_field)
		var filtered_string = input_string;//You may add .replace(/\W+/g, ''); to refuse any character not in the alphabet
		if (filtered_string.length>50) filtered_string = filtered_string.substring(0,50); // limit string length
		// Translate to Gremlin query
		let has_str = "";
		if (label_field !== "") {
			has_str = ".hasLabel('" + label_field + "')";
		}
		if (input_field !== "" && input_string !== "") {
			has_str += ".has('" + input_field + "',";
			switch (search_type) {
				case "eq":
					if (isInt(input_string)){
						has_str += filtered_string + ")"
					} else {
						has_str += "'" + filtered_string + "')"
					}
					break;
				case "contains":
					has_str += "textContains('" + filtered_string + "'))";
					break;
			}
		} else if (limit_field === "" || limit_field < 0) {
				limit_field = node_limit_per_request;
		}

		let gremlin_query_nodes = "nodes = g.V()" + has_str;
		if (limit_field !== "" && isInt(limit_field) && limit_field > 0) {
			gremlin_query_nodes += ".limit(" + limit_field + ").toList();";
		} else {
			gremlin_query_nodes += ".toList();";
		}
		let gremlin_query_edges = "edges = g.V(nodes).aggregate('node').outE().as('edge').inV().where(within('node')).select('edge').toList();";
		let gremlin_query = gremlin_query_nodes + gremlin_query_edges + "[nodes,edges]";
		console.log(gremlin_query);

		// while busy, show we're doing something in the messageArea.
		$('#messageArea').html('<h3>(loading)</h3>');
		// To display the queries in the message area:
		//var message_nodes = "<p>Node query: '"+gremlin_query_nodes+"'</p>";
		//var message_edges = "<p>Edge query: '"+gremlin_query_edges+"'</p>";
		//var message = message_nodes + message_edges;
		var message = "";
		if (SINGLE_COMMANDS_AND_NO_VARS) {
			var nodeQuery = create_single_command(gremlin_query_nodes);
			var edgeQuery = create_single_command(gremlin_query_edges);
			console.log("Node query: "+nodeQuery);
			console.log("Edge query: "+edgeQuery);
			send_to_server(nodeQuery, null, null, null, function(nodeData){
				send_to_server(edgeQuery, null, null, null, function(edgeData){
					var combinedData = [nodeData,edgeData];
					handle_server_answer(combinedData, 'search', null, message);
				});
			});
		} else {
			send_to_server(gremlin_query,'search',null,message);
		}
	}

	function isInt(value) {
	  return !isNaN(value) && 
			 parseInt(Number(value)) == value && 
			 !isNaN(parseInt(value, 10));
	}
	function click_query(d) {
		var edge_filter = $('#edge_filter').val();
		// Gremlin query
		//var gremlin_query = "g.V("+d.id+").bothE().bothV().path()"
		// 'inject' is necessary in case of an isolated node ('both' would lead to an empty answer)
		var id = d.id;
		if(isNaN(id)){ // Add quotes if id is a string (not a number).
			id = '"'+id+'"';
		}
		var gremlin_query_nodes = 'nodes = g.V('+id+').as("node").both('+(edge_filter?'"'+edge_filter+'"':'')+').as("node").select(all,"node").inject(g.V('+id+')).unfold()'
		var gremlin_query_edges = "edges = g.V("+id+").bothE("+(edge_filter?"'"+edge_filter+"'":"")+")";
		var gremlin_query = gremlin_query_nodes+'\n'+gremlin_query_edges+'\n'+'[nodes.toList(),edges.toList()]'
		// while busy, show we're doing something in the messageArea.
		$('#messageArea').html('<h3>(loading)</h3>');
		var message = "<p>Query ID: "+ d.id +"</p>"
				if(SINGLE_COMMANDS_AND_NO_VARS){
					var nodeQuery = create_single_command(gremlin_query_nodes);
					var edgeQuery = create_single_command(gremlin_query_edges);
					send_to_server(nodeQuery, null, null, null, function(nodeData){
						send_to_server(edgeQuery, null, null, null, function(edgeData){
							var combinedData = [nodeData,edgeData];
							handle_server_answer(combinedData, 'click', d.id, message);
						});
					});
				} else {
					send_to_server(gremlin_query,'click',d.id,message);
				}
	}

	function send_to_server(gremlin_query,query_type,active_node,message, callback){

		let server_address = $('#server_address').val();
		let server_port = $('#server_port').val();
		let COMMUNICATION_PROTOCOL = $('#server_protocol').val();
			if (COMMUNICATION_PROTOCOL == 'REST'){
				let server_url = "http://"+server_address+":"+server_port;
				run_ajax_request(gremlin_query,server_url,query_type,active_node,message,callback);
			}
			else if (COMMUNICATION_PROTOCOL == 'websocket'){
				let server_url = "ws://"+server_address+":"+server_port+"/gremlin"
				run_websocket_request(gremlin_query,server_url,query_type,active_node,message,callback);
			}
			else {
				console.log('Bad communication protocol. Check configuration file. Accept "REST" or "websocket" .')
			}
				
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////
	// AJAX request for the REST API
	////////////////////////////////////////////////////////////////////////////////////////////////
	function run_ajax_request(gremlin_query,server_url,query_type,active_node,message, callback){
		// while busy, show we're doing something in the messageArea.
		$('#messageArea').html('<h3>(loading)</h3>');

		// Get the data from the server
		$.ajax({
			type: "POST",
			accept: "application/json",
			//contentType:"application/json; charset=utf-8",
			url: server_url,
			//headers: GRAPH_DATABASE_AUTH,
			timeout: REST_TIMEOUT,
			data: JSON.stringify({"gremlin" : gremlin_query}),
			success: function(data, textStatus, jqXHR){
							var Data = data.result.data;
							//console.log(Data)
							if(callback){
								callback(Data);
							} else {				
								handle_server_answer(Data,query_type,active_node,message);
							}
			},
			error: function(result, status, error){
				console.log("Connection failed. "+status);
				$('#outputArea').html("<p> Can't access database using REST at "+server_url+"</p>"+
					"<p> Message: "+status+ ", "+error+" </p>"+
					"<p> Check the server configuration "+
					"or try increasing the REST_TIMEOUT value in the config file.</p>");
				$('#messageArea').html('');
			}
		});
	}

	//////////////////////////////////////////////////////////////////////////////////////////////////////
	// Websocket connection
	/////////////////////////////////////////////////////////////////////////////////////////////////////
	function run_websocket_request(gremlin_query,server_url,query_type,active_node,message,callback){
		$('#messageArea').html('<h3>(loading)</h3>');

		var msg = { "requestId": uuidv4(),
			"op":"eval",
			"processor":"",
			"args":{"gremlin": gremlin_query,
				"bindings":{},
				"language":"gremlin-groovy"}}

		var data = JSON.stringify(msg);

		var ws = new WebSocket(server_url);
		ws.onopen = function (event){
			ws.send(data,{ mask: true});	
		};
		ws.onerror = function (err){
			console.log('Connection error using websocket');
			console.log(err);
			$('#outputArea').html("<p> Connection error using websocket</p>"
				+"<p> Cannot connect to "+server_url+ " </p>");
			$('#messageArea').html('');

		};
		ws.onmessage = function (event){
			var response = JSON.parse(event.data);
			var data = response.result.data;
			if (data == null){
				$('#outputArea').html(response.status.message);
				$('#messageArea').html('Server error. No data.');
				return 1;}
			//console.log(data)
			if(callback){
				callback(data);
			} else {
				handle_server_answer(data,query_type,active_node,message);
			}
		};		
	}

	// Generate uuid for websocket requestId. Code found here:
	// https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
	function uuidv4() {
	  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	  });
	}

	//////////////////////////////////////////////////////////////////////////////////////////////////
	function handle_server_answer(data,query_type,active_node,message){
		let COMMUNICATION_METHOD = $('#communication_method').val();
		//console.log(COMMUNICATION_METHOD)
		if (COMMUNICATION_METHOD == 'GraphSON3'){
			//console.log(data)
			data = graphson3to1(data);
			var arrange_data = arrange_datav3;
		} else if (COMMUNICATION_METHOD == 'GraphSON2'){
			var arrange_data = arrange_datav2;
		} else {
			console.log('Bad communication protocol. Accept "GraphSON2" or "GraphSON3".'
				+' Using default GraphSON3.')
			data = graphson3to1(data);
			var arrange_data = arrange_datav3;
		}
		if (!(0 in data)) {
			message = 'No data. Check the communication protocol. (Try changing Gremlin version to 3.3.*).'
			console.log(message)
			$('#outputArea').html(message);
			$('#messageArea').html('');

		}
		if (query_type=='graphInfo'){
			infobox.display_graph_info(data);
			_node_properties = make_properties_list(data[1][0]);
			_edge_properties = make_properties_list(data[3][0]);
			change_nav_bar(_node_properties,_edge_properties);
			display_properties_bar(_node_properties,'nodes','Node properties:');
			display_properties_bar(_edge_properties,'edges','Edge properties:');
			display_color_choice(_node_properties,'nodes','Node color by:');
		} else {
			//console.log(data);
			var graph = arrange_data(data);
			//console.log(graph)
			if (query_type=='click') var center_f = 0; //center_f=0 mean no attraction to the center for the nodes 
			else if (query_type=='search') var center_f = 1;
			else return;
			graph_viz.refresh_data(graph,center_f,active_node);
		}

		$('#outputArea').html(message);
		$('#messageArea').html('');
	}



	//////////////////////////////////////////////////////////////////////////////////////////////////
	function make_properties_list(data){
		var prop_dic = {};
		for (var prop_str in data){
			prop_str = prop_str.replace(/[\[\ \"\'\]]/g,''); // get rid of symbols [,",',] and spaces
			var prop_list = prop_str.split(',');
			//prop_list = prop_list.map(function (e){e=e.slice(1); return e;});
			for (var prop_idx in prop_list){
				prop_dic[prop_list[prop_idx]] = 0;
			}
		}
		var properties_list = [];
		for (var key in prop_dic){
			properties_list.push(key);
		}
		return properties_list;
	}

	///////////////////////////////////////////////////
	function idIndex(list,elem) {
	  // find the element in list with id equal to elem
	  // return its index or null if there is no
	  for (var i=0;i<list.length;i++) {
		if (list[i].id == elem) return i;
	  }
	  return null;
	}  

	/////////////////////////////////////////////////////////////
	function arrange_datav2(data) {
		// Extract node and edges from the data returned for 'search' and 'click' request
		// Create the graph object
		var nodes=[], links=[];
		for (var key in data){
			data[key].forEach(function (item) {
			if (item.type=="vertex" && idIndex(nodes,item.id) == null) // if vertex and not already in the list
				nodes.push(extract_infov2(item));
			if (item.type=="edge" && idIndex(links,item.id) == null)
				links.push(extract_infov2(item));
			});
		}
	  return {nodes:nodes, links:links};
	}

	function arrange_datav3(data) {
		// Extract node and edges from the data returned for 'search' and 'click' request
		// Create the graph object
		var nodes=[], links=[];
		for (var key in data){
			data[key].forEach(function (item) {
				if (!("inV" in item) && idIndex(nodes,item.id) == null){ // if vertex and not already in the list
					item.type = "vertex";
					nodes.push(extract_infov3(item));
				}
				if (("inV" in item) && idIndex(links,item.id) == null){
					item.type = "edge";
					links.push(extract_infov3(item));
				}
			});
		}
	  return {nodes:nodes, links:links};
	}


	function extract_infov2(data) {
		var data_dic = {id:data.id, label:data.label, type:data.type, properties:{}}
		var prop_dic = data.properties
		for (var key in prop_dic) {
			if (prop_dic.hasOwnProperty(key)) {
				data_dic.properties[key] = prop_dic[key]
			}
		}
		if (data.type=="edge"){
			data_dic.source = data.outV
			data_dic.target = data.inV
		}
		return data_dic
	}

	function extract_infov3(data) {
	var data_dic = {id:data.id, label:data.label, type:data.type, properties:{}}
	var prop_dic = data.properties
	//console.log(prop_dic)
	for (var key in prop_dic) { 
		if (prop_dic.hasOwnProperty(key)) {
			if (data.type == 'vertex'){// Extracting the Vertexproperties (properties of properties for vertices)
				var property = prop_dic[key];
				property['summary'] = get_vertex_prop_in_list(prop_dic[key]).toString();
			} else {
				var property = prop_dic[key]['value'];
			}
			//property = property.toString();
			data_dic.properties[key] = property;
			if (key == 'graphexpx') {
				data_dic.fx = prop_dic['graphexpx']['0']['value'];
			}
			if (key == 'graphexpy') {
				data_dic.fy = prop_dic['graphexpy']['0']['value'];
			}
		}
	}
	if (data.type=="edge"){
		data_dic.source = data.outV
		data_dic.target = data.inV
	}
	return data_dic
}

function get_vertex_prop_in_list(vertexProperty){
	var prop_value_list = [];
	for (var key in vertexProperty){
		//console.log(vertexprop);
		prop_value_list.push(vertexProperty[key]['value']);
	}
	return prop_value_list;
}

	function graphson3to1(data){
		// Convert data from graphSON v2 format to graphSON v1
		if (!(Array.isArray(data) || ((typeof data === "object") && (data !== null)) )) return data;
		if ('@type' in data) {
			if (data['@type']=='g:List'){
				data = data['@value'];
				return graphson3to1(data);
			} else if (data['@type']=='g:Set'){
				data = data['@value'];
				return data;
			} else if(data['@type']=='g:Map'){
				var data_tmp = {}
				for (var i=0;i<data['@value'].length;i+=2){
					var data_key = data['@value'][i];
					if( (typeof data_key === "object") && (data_key !== null) ) data_key = graphson3to1(data_key);
					//console.log(data_key);
					if (Array.isArray(data_key)) data_key = JSON.stringify(data_key).replace(/\"/g,' ');//.toString();
					data_tmp[data_key] = graphson3to1(data['@value'][i+1]);
				}
				data = data_tmp;
				return data;
			} else {
				data = data['@value'];
				if ( (typeof data === "object") && (data !== null) ) data = graphson3to1(data);
				return data;
			}
		} else if (Array.isArray(data) || ((typeof data === "object") && (data !== null)) ){
			for (var key in data){
				data[key] = graphson3to1(data[key]);
			}
			return data;
		}
		return data;
	}

	return {
		get_node_properties : get_node_properties,
		get_edge_properties : get_edge_properties,
		get_graph_info : get_graph_info,
		search_query : search_query,
		click_query :click_query
	}
})();