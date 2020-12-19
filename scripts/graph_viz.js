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

// Main module. Handle the visualization, display data and layers.

var graph_viz = (function () {
	"use strict";

	var _svg = {};
	var _svg_width = 0;
	var _svg_height = 0;
	var _nodes = {};
	var _links = {};
	var _simulation = {};
	var _Nodes = [];
	var _Links = [];





	function init(label) {
		_svg = d3.select(label).select("svg");
		_svg_width = +d3.select(label).node().getBoundingClientRect().width
		_svg_height = +d3.select(label).node().getBoundingClientRect().height;
		_svg.attr("width", _svg_width).attr("height", _svg_height);
		//console.log([_svg_width,_svg_height])

	}


	function get_simulation_handle() {
		return _simulation;
	}

	function svg_handle() {
		return _svg;
	}

	function nodes() {
		return _nodes;
	}

	function nodes_data() {
		return _Nodes;
	}

	function node_data(id) {
		// return data associated to the node with id 'id'
		for (var node in _Nodes) {
			//console.log(_Nodes[node])
			if (_Nodes[node].id == id) {
				var match = _Nodes[node];
				break;
			}
		}
		return match;
	}

	function links() {
		return _links;
	}

	function links_data() {
		return _Links;
	}

	function create_arrows(edge_in) {
		var edge_data = edge_in.data();
		var arrow_data = _svg.selectAll('.arrow').data();
		var data = arrow_data.concat(edge_data);

		_svg.selectAll('.arrow')
			.data(data)
			.enter()
			.append('marker')
			.attr('class', 'arrow')
			.attr('id', function (d) { return 'marker_' + d.id })
			.attr('markerHeight', 5)
			.attr('markerWidth', 5)
			.attr('markerUnits', 'strokeWidth')
			.attr('orient', 'auto')
			.attr('refX', function (d) {
				var node = node_data(d.target);
				return graphShapes.node_size(node) + graphShapes.node_stroke_width(node);
			})
			.attr('refY', 0)
			.attr('viewBox', "0 -5 10 10")
			.append('svg:path')
			.attr('d', "M0,-5L10,0L0,5")
			.style('fill', function (d) { return graphShapes.edge_color(d) });
	}

	///////////////////////////////////////
	// Remove force layout and data
	function clear() {
		console.log(_simulation)
		if (Object.keys(_simulation).length != 0) {
			_simulation.stop();
			_simulation.nodes([]);
			_simulation.force("link").links([]);
		}
		_svg.selectAll("*").remove();
		_Nodes = [], _Links = [];
		layers.clear_old();
		_simulation = {};
	}


	function addzoom() {
		// Add zoom to the svg object
		_svg.append("rect")
			.attr("width", _svg_width).attr("height", _svg_height)
			.style("fill", "none").style("pointer-events", "all")
			.call(d3.zoom().scaleExtent([1 / 2, 4]).on("zoom", zoomed));
		_svg = _svg.append("g");

		function zoomed() {
			_svg.attr('transform', d3.event.transform);
		}
		return _svg;
	}

	//////////////////////////////////////////////////////////////
	var layers = (function () {
		// Submodule that handles layers of visualization

		var nb_layers = default_nb_of_layers;
		var old_Nodes = [];
		var old_Links = [];

		function set_nb_layers(nb) {
			nb_layers = nb;
		}

		function depth() {
			return nb_layers;
		}

		function push_layers() {
			// old links and nodes become older
			// and are moved to the next deeper layer
			for (var k = nb_layers; k > 0; k--) {
				var kp = k - 1;
				_svg.selectAll(".old_edge" + kp).classed("old_edge" + k, true);
				_svg.selectAll(".old_node" + kp).classed("old_node" + k, true);
				_svg.selectAll(".old_edgepath" + kp).classed("old_edgepath" + k, true);
				_svg.selectAll(".old_edgelabel" + kp).classed("old_edgelabel" + k, true);
			};
		}

		function clear_old() {
			old_Nodes = [];
			old_Links = [];
		}

		function update_data(d) {
			// Save the data
			var previous_nodes = _svg.selectAll("g").filter(".active_node");
			var previous_nodes_data = previous_nodes.data();
			old_Nodes = updateAdd(old_Nodes, previous_nodes_data);
			var previous_links = _svg.selectAll(".active_edge");
			var previous_links_data = previous_links.data();
			old_Links = updateAdd(old_Links, previous_links_data);

			// handle the pinned nodes
			var pinned_Nodes = _svg.selectAll("g").filter(".pinned");
			var pinned_nodes_data = pinned_Nodes.data();
			// get the node data and merge it with the pinned nodes
			_Nodes = d.nodes;
			_Nodes = updateAdd(_Nodes, pinned_nodes_data);
			// add coordinates to the new active nodes that already existed in the previous step
			_Nodes = transfer_coordinates(_Nodes, old_Nodes);
			// retrieve the links between nodes and pinned nodes
			_Links = d.links.concat(previous_links_data); // first gather the links
			_Links = find_active_links(_Links, _Nodes); // then find the ones that are between active nodes
			
			// Sort links by source, then target, then label
			// This is used to set linknum
			_Links.sort(function (a, b) {
				if (a.source > b.source) { return 1; }
				else if (a.source < b.source) { return -1; }
				else {
					if (a.target > b.target) { return 1; }
					if (a.target < b.target) { return -1; }
					else {
						if (a.label > b.label) { return 1; }
						if (a.label < b.label) { return -1; }
						else { return 0; }
					}
				}
			});

			// Any links with duplicate source and target get an incremented 'linknum'
			for (var i = 0; i < _Links.length; i++) {
				if (i != 0 &&
					_Links[i].source == _Links[i - 1].source &&
					_Links[i].target == _Links[i - 1].target) {
					_Links[i].linknum = _Links[i - 1].linknum + 1;
				}
				else { _Links[i].linknum = 1; };
			};
		}

		function updateAdd(array1, array2) {
			// Update lines of array1 with the ones of array2 when the elements' id match
			// and add elements of array2 to array1 when they do not exist in array1
			var arraytmp = array2.slice(0);
			var removeValFromIndex = [];
			array1.forEach(function (d, index, thearray) {
				for (var i = 0; i < arraytmp.length; i++) {
					if (d.id == arraytmp[i].id) {
						thearray[index] = arraytmp[i];
						removeValFromIndex.push(i);
					}
				}
			});
			// remove the already updated values (in reverse order, not to mess up the indices)
			removeValFromIndex.sort();
			for (var i = removeValFromIndex.length - 1; i >= 0; i--)
				arraytmp.splice(removeValFromIndex[i], 1);
			return array1.concat(arraytmp);
		}

		function find_active_links(list_of_links, active_nodes) {
			// find the links in the list_of_links that are between the active nodes and discard the others
			var active_links = [];
			list_of_links.forEach(function (row) {
				for (var i = 0; i < active_nodes.length; i++) {
					for (var j = 0; j < active_nodes.length; j++) {
						if (active_nodes[i].id == row.source.id && active_nodes[j].id == row.target.id) {
							var L_data = { source: row.source.id, target: row.target.id, type: row.type, value: row.value, id: row.id };
							var L_data = row;
							L_data['source'] = row.source.id;
							L_data['target'] = row.target.id;
							active_links = active_links.concat(L_data);
						}
						else if (active_nodes[i].id == row.source && active_nodes[j].id == row.target) {
							var L_data = row;
							active_links = active_links.concat(L_data);
						}
					}
				}
			});
			// the active links are in active_links but there can be some duplicates
			// remove duplicates links
			var dic = {};
			for (var i = 0; i < active_links.length; i++)
				dic[active_links[i].id] = active_links[i]; // this will remove the duplicate links (with same id)
			var list_of_active_links = [];
			for (var key in dic)
				list_of_active_links.push(dic[key]);
			return list_of_active_links;
		}


		function transfer_coordinates(Nodes, old_Nodes) {
			// Transfer coordinates from old_nodes to the new nodes with the same id
			for (var i = 0; i < old_Nodes.length; i++) {
				var exists = 0;
				for (var j = 0; j < Nodes.length; j++) {
					if (Nodes[j].id == old_Nodes[i].id) {
						Nodes[j].x = old_Nodes[i].x;
						Nodes[j].y = old_Nodes[i].y;
						Nodes[j].fx = old_Nodes[i].x;
						Nodes[j].fy = old_Nodes[i].y;
						Nodes[j].vx = old_Nodes[i].vx;
						Nodes[j].vy = old_Nodes[i].vy;
					}
				}
			}
			return Nodes;
		}

		function remove_duplicates(elem_class, elem_class_old) {
			// Remove all the duplicate nodes and edges among the old_nodes and old_edges.
			// A node or an edge can not be on several layers at the same time.
			d3.selectAll(elem_class).each(function (d) {
				var ID = d.id;
				for (var n = 0; n < nb_layers; n++) {
					var list_old_elements = d3.selectAll(elem_class_old + n);
					//list_old_nodes_data = list_old_nodes.data();
					list_old_elements.each(function (d) {
						if (d.id == ID) {
							d3.select(this).remove();
							//console.log('Removed!!')
						}
					})
				}
			});
		}

		return {
			set_nb_layers: set_nb_layers,
			depth: depth,
			push_layers: push_layers,
			clear_old: clear_old,
			update_data: update_data,
			remove_duplicates: remove_duplicates
		}
	})();

	////////////////////////////////////////////////////////////////////////////////////
	function simulation_start(center_f) {
		// Define the force applied to the nodes
		_simulation = d3.forceSimulation()
			.force("charge", d3.forceManyBody().strength(force_strength))
			.force("link", d3.forceLink().strength(link_strength).id(function (d) { return d.id; }));

		if (center_f == 1) {
			var force_y = force_x_strength;
			var force_x = force_y_strength;
			_simulation.force("center", d3.forceCenter(_svg_width / 2, _svg_height / 2));
		}
		else {
			var force_y = 0;
			var force_x = 0;
		}
		_simulation.force("y", d3.forceY().strength(function (d) {
			return force_y;
		}))
			.force("x", d3.forceX().strength(function (d) {
				return force_x;
			}));
		return _simulation;
	}



	//////////////////////////////////////
	function refresh_data(d, center_f, with_active_node) {
		// Main visualization function
		var svg_graph = svg_handle();
		layers.push_layers();
		layers.update_data(d);

		//////////////////////////////////////
		// link handling

		//attach the data
		var all_links = svg_graph.selectAll(".active_edge")
			.data(_Links, function (d) { return d.id; });
		var all_edgepaths = svg_graph.selectAll(".active_edgepath")
			.data(_Links, function (d) { return d.id; });
		var all_edgelabels = svg_graph.selectAll(".active_edgelabel")
			.data(_Links, function (d) { return d.id; });

		// links not active anymore are classified old_links
		all_links.exit().classed("old_edge0", true).classed("active_edge", false);
		all_edgepaths.exit().classed("old_edgepath0", true).classed("active_edgepath", false);
		all_edgelabels.exit().classed("old_edgelabel0", true).classed("active_edgelabel", false);


		// handling active links associated to the data
		var edgepaths_e = all_edgepaths.enter(),
			edgelabels_e = all_edgelabels.enter(),
			link_e = all_links.enter();
		var decor_out = graphShapes.decorate_link(link_e, edgepaths_e, edgelabels_e);
		_links = decor_out[0];

		var edgepaths = decor_out[1],
			edgelabels = decor_out[2];


		// previous links plus new links are merged
		_links = _links.merge(all_links);
		edgepaths = edgepaths.merge(all_edgepaths);
		edgelabels = edgelabels.merge(all_edgelabels);

		///////////////////////////////////
		// node handling

		var all_nodes = svg_graph.selectAll("g").filter(".active_node")
			.data(_Nodes, function (d) { return d.id; });

		//console.log(data_node);
		// old nodes not active any more are tagged
		all_nodes.exit().classed("old_node0", true).classed("active_node", false);//;attr("class","old_node0");


		// nodes associated to the data are constructed
		_nodes = all_nodes.enter();

		// add node decoration
		var node_deco = graphShapes.decorate_node(_nodes, with_active_node);

		var _nodes = node_deco.merge(all_nodes);




		//////////////////////////////////
		// Additional clean up
		graphShapes.decorate_old_elements(layers.depth());
		svg_graph.selectAll("g").filter(".pinned").moveToFront();


		layers.remove_duplicates(".active_node", ".old_node");
		layers.remove_duplicates(".active_edge", ".old_edge");
		layers.remove_duplicates(".active_edgepath", ".old_edgepath");
		layers.remove_duplicates(".active_edgelabel", ".old_edgelabel");


		///////////////////////////////
		// Force simulation
		// simulation model and parameters


		_simulation = simulation_start(center_f);
		// Associate the simulation with the data
		_simulation.nodes(_Nodes).on("tick", ticked);
		_simulation.force("link").links(_Links);
		_simulation.alphaTarget(0);

		////////////////////////
		// handling simulation steps
		// move the nodes and links at each simulation step, following this rule:
		function ticked() {
			_links.attr('d', function (d) {
				if (use_curved_edges) {
					var dx = d.target.x - d.source.x;
					var dy = d.target.y - d.source.y;
					var dr = Math.sqrt((dx * dx + dy * dy) / d.linknum);
					return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
				} else {
					return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
				}
			});
			_nodes
				.attr("transform", function (d) { return "translate(" + d.x + ", " + d.y + ")"; });

			edgepaths.attr('d', function (d) {
				if (use_curved_edges) {
					var dx = d.target.x - d.source.x;
					var dy = d.target.y - d.source.y;
					var dr = Math.sqrt((dx * dx + dy * dy) / d.linknum);
					return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
				} else {
					return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
				}
			});

			edgelabels.attr('transform', function (d) {
				if (d.target.x < d.source.x) {
					var bbox = this.getBBox();

					var rx = bbox.x + bbox.width / 2;
					var ry = bbox.y + bbox.height / 2;
					return 'rotate(180 ' + rx + ' ' + ry + ')';
				}
				else {
					return 'rotate(0)';
				}
			});
		}

	}


	function get_node_edges(node_id) {
		// Return the in and out edges of node with id 'node_id'
		var connected_edges = d3.selectAll(".edge").filter(
			function (item) {
				if (item.source == node_id || item.source.id == node_id) {
					return item;
				}
				else if (item.target == node_id || item.target.id == node_id) {
					return item;
				}
			});
		return connected_edges;
	}


	var graph_events = (function () {
		//////////////////////////////////
		// Handling mouse events

		function dragstarted(d) {
			if (!d3.event.active) _simulation.alphaTarget(0.3).restart();
			d.fx = d.x;
			d.fy = d.y;
		}

		function dragged(d) {
			var connected_edges = get_node_edges(d.id);
			var f_connected_edges = connected_edges.filter("*:not(.active_edge)")
			if (f_connected_edges._groups[0].length == 0) {
				d.fx = d3.event.x;
				d.fy = d3.event.y;
			}
			else {
				f_connected_edges
					.style("stroke-width", function () { return parseInt(d3.select(this).attr("stroke-width")) + 2; })
					.style("stroke-opacity", 1)
					.classed("blocking", true)
			}
		}

		function dragended(d) {
			if (!d3.event.active) _simulation.alphaTarget(0);
			d3.selectAll(".blocking")
				.style("stroke-width", function () { return d3.select(this).attr("stroke-width"); })
				.style("stroke-opacity", function () { return d3.select(this).attr("stroke-opacity"); })
				.classed("blocking", false)
			// d.fx = null;
			// d.fy = null;
		}

		function clicked(d) {
			d3.select(".focus_node").remove();
			var input = document.getElementById("freeze-in");
			var isChecked = input.checked;
			if (isChecked) infobox.display_info(d);
			else {
				_simulation.stop();
				// remove the oldest links and nodes
				var stop_layer = layers.depth() - 1;
				_svg.selectAll(".old_node" + stop_layer).remove();
				_svg.selectAll(".old_edge" + stop_layer).remove();
				_svg.selectAll(".old_edgepath" + stop_layer).remove();
				_svg.selectAll(".old_edgelabel" + stop_layer).remove();
				infobox.display_info(d);
				graphioGremlin.click_query(d);
				console.log('event!!')
			}
		}


		function pin_it(d) {
			d3.event.stopPropagation();
			var node_pin = d3.select(this);
			var pinned_node = d3.select(this.parentNode);
			//console.log('Pinned!')
			//console.log(pinned_node.classed("node"));
			if (pinned_node.classed("active_node")) {
				if (!pinned_node.classed("pinned")) {
					pinned_node.classed("pinned", true);
					console.log('Pinned!');
					node_pin.attr("fill", "#000");
					pinned_node.moveToFront();
				}
				else {
					pinned_node.classed("pinned", false);
					console.log('Unpinned!');
					node_pin.attr("fill", graphShapes.node_color);
				}
			}
		}

		return {
			dragstarted: dragstarted,
			dragged: dragged,
			dragended: dragended,
			clicked: clicked,
			pin_it: pin_it
		}

	})();

	return {
		svg_handle: svg_handle,
		nodes: nodes,
		links: links,
		nodes_data: nodes_data,
		node_data: node_data,
		links_data: links_data,
		init: init,
		create_arrows: create_arrows,
		addzoom: addzoom,
		clear: clear,
		get_simulation_handle: get_simulation_handle,
		simulation_start: simulation_start,
		refresh_data: refresh_data,
		layers: layers,
		graph_events: graph_events
	};

})();
