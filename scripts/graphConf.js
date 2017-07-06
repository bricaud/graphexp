
// configuration for the graph database access
const HOST = "http://ec2-52-59-243-58.eu-central-1.compute.amazonaws.com"
const PORT = "8182"
// The communication protocol with the server can be "REST" or "websocket"
const COMMUNICATION_PROTOCOL = "REST";
//const COMMUNICATION_PROTOCOL = "websocket";
// TODO: configuration for the secure server

// Graph configuration
const default_nb_of_layers = 3;
// Simulation
const force_strength = -600;
const link_strength = 0.2;
const force_x_strength = 0.1;
const force_y_strength = 0.1;
// Nodes
const default_node_size = 15;
const default_stroke_width = 2;
const default_node_color = "#80E810";
const active_node_margin = 6;
const active_node_margin_opacity = 0.3;

// Edges
const default_edge_stroke_width = 3;
const default_edge_color = "#CCC";
const edge_label_color = "#111";