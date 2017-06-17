
var graphioGremlin = (function(){
	"use strict";
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
		var message = "<p> Graph info</p>"
		run_ajax_request(gremlin_query,'graphInfo',null,message)
	}



	function search_query() {
		// Preprocess query
		var input_string = $('#search_value').val();
		var input_field = $('#search_field').val();
		console.log(input_field)
	 	var filtered_string = input_string; //input_string.replace(/[^a-zA-Z]+/g, ''); //refuse any character not in the alphabet
	 	if (filtered_string.length>50) filtered_string = filtered_string.substring(0,50); // shorten long strings
		// Translate to Gremlin query
	  	if (input_string==""){
	  		var gremlin_query_nodes = "nodes = g.V()"
	  		var gremlin_query_edges = "edges = g.V().aggregate('node').outE().as('edge').inV().where(within('node')).select('edge')"
	  		var gremlin_query = gremlin_query_nodes+"\n"+gremlin_query_edges+"\n"+"[nodes.toList(),edges.toList()]"
	  			  	}
	  	else{
	  		var has_str = "has('"+input_field+"','"+filtered_string+"')"
			var gremlin_query = "g.V()."+has_str
	  		var gremlin_query_nodes = "nodes = g.V()."+has_str
	  		var gremlin_query_edges = "edges = g.V()."+has_str
	  			+".aggregate('node').outE().as('edge').inV().where(within('node')).select('edge')"
	  		var gremlin_query = gremlin_query_nodes+"\n"+gremlin_query_edges+"\n"+"[nodes.toList(),edges.toList()]"
	  		console.log(gremlin_query)
		}

	  	// while busy, show we're doing something in the messageArea.
	  	$('#messageArea').html('<h3>(loading)</h3>');
		var message = "<p>Query: '"+ filtered_string +"'</p>"
		run_ajax_request(gremlin_query,'search',null,message)	  	
	}


	function click_query(d) {
		// Gremlin query
		var gremlin_query = "g.V("+d.id+").bothE().bothV().path()"
		// while busy, show we're doing something in the messageArea.
		$('#messageArea').html('<h3>(loading)</h3>');
		var message = "<p>Query ID: "+ d.id +"</p>"
		run_ajax_request(gremlin_query,'click',d.id,message)
	}


	function run_ajax_request(gremlin_query,query_type,active_node,message){
		// while busy, show we're doing something in the messageArea.
		$('#messageArea').html('<h3>(loading)</h3>');

		// get the data from the server
		$.ajax({
			type: "POST",
			accept: "application/json",
			//contentType:"application/json; charset=utf-8",
			url: GRAPH_DATABASE_URL,
			//headers: GRAPH_DATABASE_AUTH,
			Timeout:2000,
			data: JSON.stringify({"gremlin" : gremlin_query}),
			success: function(data, textStatus, jqXHR){
				var Data = data.result.data;
				//console.log(Data)
				if (query_type=='click'){
					var graph = arrange_data_path(Data);
					//console.log(graph)
					var center_f = 0;
					refresh_data(graph,center_f,active_node); //center_f=0 mean no attraction to the center for the nodes  
				}
				else if (query_type=='search'){
					var graph = arrange_data(Data);
					//console.log(graph)
					var center_f = 1;
					refresh_data(graph,center_f,active_node);
				}
				else if (query_type=='graphInfo'){
					console.log(Data);
					infobox.display_graph_info(Data);
					var node_properties = make_properties_list(Data[1][0]);
					console.log(node_properties);
					var edge_properties = make_properties_list(Data[3][0]);
					console.log(edge_properties);
					change_nav_bar(node_properties,edge_properties);
				}
            $('#outputArea').html(message);
			$('#messageArea').html('');
			},
			failure: function(msg){
			console.log("failed");
			$('#outputArea').html("<p> Can't access database </p>");
			$('#messageArea').html('');
			}
		});
	}


	function make_properties_list(data){
		var prop_dic = {};
		for (var prop_str in data){
			prop_str = prop_str.slice(0,-1);
			var prop_list = prop_str.split(',');
			prop_list = prop_list.map(function (e){e=e.slice(1); return e;});
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
	function arrange_data(data) {
	  	// Extracting node and edges from the data
	  	// to create the graph object
	  	var nodes=[], links=[];
	  	for (var key in data){
	  		data[key].forEach(function (item) {
	  		if (item.type=="vertex" && idIndex(nodes,item.id) == null) // if vertex and not already in the list
	  			nodes.push(extract_info(item));
	  		if (item.type=="edge" && idIndex(links,item.id) == null)
	  			links.push(extract_info(item));
			});
	  	}
	  return {nodes:nodes, links:links};
	}

	function arrange_data_path(data) {
	  	// Extracting node and edges from the data
	  	// to create the graph object
	  	var nodes=[], links=[];
	  	for (var key in data){
	  		data[key].objects.forEach(function (item) {
	  		if (item.type=="vertex" && idIndex(nodes,item.id) == null) // if vertex and not already in the list
	  			nodes.push(extract_info(item));
	  		if (item.type=="edge" && idIndex(links,item.id) == null)
	  			links.push(extract_info(item));
			});
	  	}
	  return {nodes:nodes, links:links};
	}

	function extract_info(data) {
		var data_dic = {id:data.id,label:data.label,properties:{}}
		var prop_dic = data.properties
		for (var key in prop_dic) {
  			if (prop_dic.hasOwnProperty(key)) {
				data_dic.properties[key] = prop_dic[key]}
		}
		if (data.type=="edge"){
			data_dic.source = data.inV
			data_dic.target = data.outV
		}
		return data_dic
	}



	return {
		get_graph_info : get_graph_info,
		search_query : search_query,
		click_query :click_query
	}
})();