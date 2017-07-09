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

// Attempt to generate an interface between the visualization and a Neo4j database.
// This is not working. It is kept only in the hypothesis of a future development.

var graphioNeo4j = (function(){
	// NOT WORKING
	function post_cypherquery() {
	  // Neo4j CYPHER query
	  var input_string = $('#cypher-in').val();
	  var filtered_string = input_string.replace(/[^a-zA-Z]+/g, ''); //refuse any character not in the alphabet
	  if (filtered_string.length>30) filtered_string = filtered_string.substring(0,30); // shorten long strings
	  // save the query in a file using PHP
	  user_action = "user_action=query&request="+filtered_string;
	  request = $.ajax({
		url: "/monitor.php",
		type: "POST",
		//contentType:"text/plain; charset=utf-8",
		data: user_action
	  });
	  // Callback handler that will be called on success
	  request.done(function (response, textStatus, jqXHR){
		// Log a message to the console
		console.log("Hooray, it worked!");
	  });

	  // call the graph database
	  if ($('#n_type').val()==1){
		var neo_query = "MATCH path = (n:Artist)--(m:Concert) WHERE (n.firstname =~ '(?i)"+filtered_string+".*' OR n.lastname =~ '(?i)"+filtered_string+".*') RETURN n,m,path ";}
	  else if ($('#n_type').val()==2){
		var neo_query = "MATCH path = (n:Artist)--(m:Band) WHERE (n.firstname =~ '(?i)"+filtered_string+".*' OR n.lastname =~ '(?i)"+filtered_string+".*') RETURN n,m,path ";}
	  else if ($('#n_type').val()==3){
		var neo_query = "MATCH path = (n:Artist)--(m) WHERE (n.firstname =~ '(?i)"+filtered_string+".*' OR n.lastname =~ '(?i)"+filtered_string+".*') RETURN n,m,path ";}

	  // while busy, show we're doing something in the messageArea.
	  $('#messageArea').html('<h3>(loading)</h3>');

	  var post_request = {"statements":[{"statement": neo_query,"resultDataContents":["graph"]}]};

	  // get the data from neo4j
	  $.ajax({
		type: "POST",
		accept: "application/json",
		contentType:"application/json; charset=utf-8",
		url: GRAPH_DATABASE_URL,
		headers: GRAPH_DATABASE_AUTH,
		Timeout: 2000,
		data: JSON.stringify(post_request),
		success: function(data, textStatus, jqXHR){
		  //console.log(data,data.results[0].data.length);
		  //if (!jQuery.isEmptyObject(data)){
		  if (data.results[0].data.length>0){
			$('#outputArea').html("<p>Query: name starting with '"+ filtered_string +"'</p>");
			$('#messageArea').html('');
			//console.log(data);
			Data = data;
			graph = arrange_data(Data);
			//console.log(graph);
			//Nodes = graph.nodes;
			//Links = graph.links;
			//Nodes.push(graph.nodes);
			//Links.push(graph.links);
			refresh_data(graph,center_f=1,active_node=null); //center_f=0 mean no attraction to the center for the nodes
		  }
		  else {
			$('#outputArea').html("<p>Query '"+ filtered_string +"' not found</p>");
			$('#messageArea').html('');
		  }
		},
		failure: function(msg){
		  console.log("failed",msg);
		  $('#outputArea').html("<p> Can't access database </p>");
		  $('#messageArea').html('');
		}
	  });
	}


	function click_query(d) {
	  // Neo4j query
	  if (d.labelV === "Artist") 
		var neo_query = "MATCH path = (n:Artist)--(m) WHERE (n.id = "+d.MJFid+") RETURN m,path ";
	  else if (d.labelV === "Concert") 
		var neo_query = "MATCH path = (n:Concert)--(m) WHERE (n.id = "+d.MJFid+") RETURN m,path ";
	  else if (d.labelV === "Band") 
		var neo_query = "MATCH path = (n:Band)--(m) WHERE (n.id = "+d.MJFid+") RETURN m,path "; 
	  //console.log(neo_query)
	  //var neo_query = "MATCH path = (n)--(m) WHERE (n.id = "+d.MJFid+") RETURN m,path "; 
	  // while busy, show we're doing something in the messageArea.
	  $('#messageArea').html('<h3>(loading)</h3>');

	  var post_request = {"statements":[{"statement": neo_query,"resultDataContents":["graph"]}]};

	  // get the data from neo4j
	  $.ajax({
		type: "POST",
		accept: "application/json",
		contentType:"application/json; charset=utf-8",
		url: GRAPH_DATABASE_URL,
		headers: GRAPH_DATABASE_AUTH,
		Timeout:2000,
		data: JSON.stringify(post_request),
		success: function(data, textStatus, jqXHR){
		  //console.log(graph);
		  //console.log(data);
		  //Data.results[0].data = Data.results[0].data.concat(data.results[0].data);
		  //console.log(Data);
		  Data = data;
		  graph = arrange_data(Data);
		  refresh_data(graph,center_f=0,active_node=d.id); //center_f=0 mean no attraction to the center for the nodes              
		},
		failure: function(msg){
		  console.log("failed");
		  $('#outputArea').html("<p> Can't access database </p>");
		  $('#messageArea').html('');
		}
	  });
	  $('#outputArea').html("<p>Query ID: "+ d.MJFid +"</p>");
	  $('#messageArea').html('');
	}

	///////////////////////////////////////////////////
	function idIndex(a,id) {
	  // find the element in a with id id
	  // return its index or null if there is no
	  for (var i=0;i<a.length;i++) {
		if (a[i].id == id) return i;
	  }
	  return null;
	}  

	/////////////////////////////////////////////////////////////
	function arrange_data(data) {
	  // Extracting node and edges from the data
	  // to create the graph object
	  var nodes=[], links=[];
	  data.results[0].data.forEach(function (row) {
		row.graph.nodes.forEach(function (n) {
		  if (idIndex(nodes,n.id) == null)
			nodes.push({id:n.id,labelV:n.labels[0],Firstname:n.properties.firstname,Lastname:n.properties.lastname, MJFid:n.properties.id, name:n.properties.name, Date:n.properties.date,
			genre:n.properties.genre,genreW:n.properties.genreW,genreT:n.properties.genreT,genreF:n.properties.genreF,degree:n.properties.degree});
		});
		links = links.concat( row.graph.relationships.map(function(r) {
		  //return {source:idIndex(nodes,r.startNode),target:idIndex(nodes,r.endNode),type:r.type, value:1, id:r.id};
		  return {source:r.startNode,target:r.endNode,type:r.type, value:1, id:r.id};
		}));
	  });
	  graph = {nodes:nodes, links:links};
	  return graph;
	}
})();