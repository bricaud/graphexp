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

// Module for setting the shape and actions of the nodes and edges.

var graphShapes = (function(){
	"use strict";

	var color_palette = d3.scaleOrdinal(d3.schemeCategory20);
	var colored_prop = "none";
	var node_code_color = [];

	function node_size(d){
		if ('size' in d) {return d.size;}
		else {return default_node_size;}
	}

	function node_stroke_width(d){
		if ('stroke_width' in d) {return d.stroke_width;}
		else {return default_stroke_width;}
	}

	function node_color(d){
		if (colored_prop!="none"){
			if (colored_prop == "label"){
				return color_palette(node_code_color(d.label));	
			}
			else if (typeof d.properties[colored_prop] !=="undefined"){
				if ('summary' in d.properties[colored_prop]){
					return color_palette(node_code_color(d.properties[colored_prop]['summary']));
				}else {
					return color_palette(node_code_color(d.properties[colored_prop][0].value));
				}	
			}
			else if ('color' in d.properties) {return d.properties.color[0].value;}
			else {return default_node_color;}
		}
		else if ('color' in d.properties) {return d.properties.color[0].value;}
		else {return default_node_color;}
	}

	function node_title(d){
		if ('node_title' in d){return d.node_title;}
		else {return d.label;}
	}

	function node_text(d){
		if ('node_text' in d){return d.node_text;}
		else {return d.id;}
	}

	function node_subtext(d){
		if ('node_subtext' in d){return d.node_subtext;}
		else {return d.label;}
	}

	function edge_stroke_width(d){
		if ('stroke_width' in d) {return d.stroke_width;}
		else {return default_edge_stroke_width;}
	}

	function edge_text(d){
		if ('text' in d){return d.text;}
		else {return d.properties.weight;}
	}

	function edge_color(d){
		if ('color' in d){return d.color;}
		else {return default_edge_color;}
	}




	/////////////////////////////////////////////////////////////
	// decorate the node
	function decorate_node(node,with_active_node){
	// the node layout is defined here
	// node: the selection of nodes with their data
	// with_active_node: the Id of the active node if any

		var node_deco = node.append("g")
			.attr("class", "active_node").attr("ID",function(d) { return d.id;})
			.classed("node",true);


		// Attach the event listener
		attach_node_actions(node_deco)

		node_deco.moveToFront();

		// Create the circle shape
		var node_base_circle = node_deco.append("circle").classed("base_circle",true)
			.attr("r",node_size)
			.style("stroke-width",node_stroke_width)
			.style("stroke","black")
			.attr("fill", node_color);
		node_base_circle.append("title").text(node_title);

		// Add the text to the nodes
		node_deco.append("text").classed("text_details",true)
		  .attr("x",function(d){return node_size(d)+2;})
		  .text(node_text)
		  .style("visibility", "hidden");

		node_deco.append("text").classed("text_details",true)
		  .attr("x",function(d){return node_size(d)+2;})
		  .attr("y",node_size)
		  .text(node_subtext)
		  .style("visibility", "hidden");


		// Add the node pin
		var node_pin = node_deco.append("circle").classed("Pin",true)
			.attr("r", function(d){return node_size(d)/2;})
			.attr("transform", function(d) { return "translate("+(node_size(d)*3/4)+","+(-node_size(d)*3/4)+")"; })
			.attr("fill", node_color)
			.moveToBack()
			.style("visibility", "hidden");

		node_pin.on("click",graph_viz.graph_events.pin_it);

		// spot the active node and draw additional circle around it
		if(with_active_node){
			d3.selectAll(".active_node").each(function(d){
				if(d.id==with_active_node){
					var n_radius = Number(d3.select(this).select(".base_circle").attr("r"))+active_node_margin;
					d3.select(this)
						.append("circle").classed("focus_node",true)
						.attr("r", n_radius)
						.attr("fill", node_color)
						.attr("opacity",active_node_margin_opacity)
						.moveToBack();
				}
			});
		}

		// add property info if checkbox checked
		add_checkbox_prop('nodes',node_deco)

		return node_deco;
	}

	function attach_node_actions(node){
		node.call(d3.drag()
				.on("start", graph_viz.graph_events.dragstarted)
				.on("drag", graph_viz.graph_events.dragged)
				.on("end", graph_viz.graph_events.dragended));


	  	node.on("click", graph_viz.graph_events.clicked)
			.on("mouseover", function(){
				d3.select(this).select(".Pin").style("visibility", "visible");
				d3.select(this).selectAll(".text_details").style("visibility", "visible");
		  	})
			.on("mouseout", function(){
				var chosen_node = d3.select(this);
				if(!chosen_node.classed("pinned"))
					d3.select(this).select(".Pin").style("visibility", "hidden");
				var show_checked = document.getElementById ("showName").checked;
				if (!show_checked)
					d3.select(this).selectAll(".text_details").style("visibility", "hidden");
		  });

	}

	function decorate_link(edges,edgepaths,edgelabels){

		var edges_deco = edges.append("path").attr("class", "edge").classed("active_edge",true)
			.attr("source_ID",function(d) { return d.source;})
			.attr("target_ID",function(d) { return d.target;})
			.attr("ID",function(d) { return d.id;});
	 

		graph_viz.create_arrows(edges_deco);
		// Attach the arrows
		edges_deco.attr("marker-end", function(d) {return "url(#marker_" + d.id + ")"})
		.attr('stroke-width', edge_stroke_width)
		.append('title').text(function(d){return d.properties.weight;});

		// Attach the edge labels
		var e_label = create_edge_label(edgepaths,edgelabels);
		var edgepaths_deco = e_label[0];
		var edgelabels_deco = e_label[1];

		edgelabels_deco.append('textPath')
			.attr('class','edge_text')
			.attr('href', function (d, i) {return '#edgepath' + d.id})
			.style("text-anchor", "middle")
			.style("pointer-events", "none")
			.attr("startOffset", "50%")
			.text(function (d) {return d.label});

		// Attach the edge actions
		attach_edge_actions(edges_deco)

		// Add property info if checkbox checked
		add_checkbox_prop('edges',edgelabels_deco)

		return [edges_deco,edgepaths_deco,edgelabels_deco]

	}

	function add_checkbox_prop(item,selected_items){
		// Add text from a property if the checkbox is checked on the sidebar
		if (item=='edges'){
			var item_properties = graphioGremlin.get_edge_properties();
		} else if (item=='nodes'){
			var item_properties = graphioGremlin.get_node_properties();
		}
		for (var prop_idx in item_properties){
			var prop_name = item_properties[prop_idx];
			var prop_id_nb = prop_idx;
			var prop_id = item+"_"+prop_name;
			if((!d3.select("#"+prop_id).empty()) && d3.select("#"+prop_id).property("checked")){
				attach_property(selected_items,prop_name,prop_id_nb,item);
			}
		}		
	}

	function create_edge_label(edgepaths,edgelabels){
		var edgepaths_deco = edgepaths.append('path')
			.attr('class','edgepath').classed("active_edgepath",true)
			.attr('fill-opacity',0)
			.attr('stroke-opacity',0)
			.attr('id',function (d, i) {return 'edgepath' + d.id;})
			.attr("ID",function(d) { return d.id;})
			.style("pointer-events", "none");

		var edgelabels_deco = edgelabels.append('text')
			.attr('dy',-3)
			.style("pointer-events", "none")
			.attr('class','edgelabel').classed("active_edgelabel",true)
			.attr('id',function (d, i) {return 'edgelabel' + d.id})
			.attr("ID",function(d) { return d.id;})
			.attr('font-size', 10)
			.attr('fill', edge_label_color);

		return [edgepaths_deco,edgelabels_deco];
 

	}

	function attach_edge_actions(edge){
		edge.on("mouseover", function(){
			console.log('mouse over!!');
			d3.select(this).selectAll(".text_details").style("visibility", "visible");
		  })
		  .on("mouseout", function(){
			d3.select(this).selectAll(".text_details").style("visibility", "hidden");
		  })
		  .on("click", function(d){console.log('edge clicked!');infobox.display_info(d);});

	}



	function decorate_old_elements(nb_layers){
		// Decrease the opacity of nodes and edges when they get old
		for (var k=0;k<nb_layers;k++) {
			d3.selectAll(".old_edge"+k)
			 	.style("opacity",function(){return 0.8*(1-k/nb_layers)});
			d3.selectAll(".old_node"+k)
				.style("opacity",function(){return 0.8*(1-k/nb_layers)});
			d3.selectAll(".old_edgelabel"+k)
				.style("opacity",function(){return 0.8*(1-k/nb_layers)});

		};
	}

	function colorize(prop_name){
		// Color the nodes according the value of the property 'prop_name'
		colored_prop = prop_name;
		var value_list = d3.selectAll(".node").data();
		if (prop_name =="none"){
			d3.selectAll(".base_circle").style("fill",function(d){
				return node_color(d);	
			});
			d3.selectAll(".Pin").style("fill",function(d){
				return node_color(d);	
			});
		}
		else if (prop_name=="label"){
			var value_set = new Set(value_list.map(function(d){	return d.label;}));
			node_code_color = d3.scaleOrdinal().domain(value_set).range(d3.range(0,value_set.size));
			d3.selectAll(".base_circle").style("fill",function(d){
				return color_palette(node_code_color(d.label));	
			});
			d3.selectAll(".Pin").style("fill",function(d){
				return color_palette(node_code_color(d.label));	
			});
		}
		else{
			var value_set = new Set(value_list.map(function(d){
				if (typeof d.properties[prop_name]!=="undefined"){
					return d.properties[prop_name][0].value;
				}
			}));
			node_code_color = d3.scaleOrdinal().domain(value_set).range(d3.range(0,value_set.size))//value_set.length])
			d3.selectAll(".base_circle").style("fill",function(d){
				if (typeof d.properties[prop_name] !=="undefined"){
					return color_palette(node_code_color(d.properties[prop_name][0].value));	
				}
				return node_color(d);
			});
			d3.selectAll(".Pin").style("fill",function(d){
				if (typeof d.properties[prop_name] !=="undefined"){
					return color_palette(node_code_color(d.properties[prop_name][0].value));	
				}
				return node_color(d);
			});
		}
	}
	///////////////////////////////////////
	// https://github.com/wbkd/d3-extended
	d3.selection.prototype.moveToFront = function() {
	// move the selection to the front  
	return this.each(function(){
	  this.parentNode.appendChild(this);
	});
	};
	////////////////////////////////////
	d3.selection.prototype.moveToBack = function() {
	// move the selection to the back  
	return this.each(function() { 
	  var firstChild = this.parentNode.firstChild; 
	  if (firstChild) { 
		this.parentNode.insertBefore(this, firstChild); 
	  } 
	});
	};


	//////////////////////////////////////////////
	function show_names(){
		var text_to_show = d3.selectAll(".text_details");
		var input = document.getElementById ("showName");
		var isChecked = input.checked;
		if (isChecked) text_to_show.style("visibility", "visible");
		else {text_to_show.style("visibility", "hidden");}
	}	
	return {
		show_names : show_names,
		decorate_node : decorate_node,
		decorate_link : decorate_link,
		node_color : node_color,
		node_size : node_size,
		edge_color : edge_color,
		node_stroke_width : node_stroke_width,
		create_edge_label : create_edge_label,
		decorate_old_elements : decorate_old_elements,
		colorize : colorize
	};

})();
