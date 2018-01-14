
// configuration for the graph database access
const HOST = "localhost"
const PORT = "8182"

// for implementations like Neptune where only single commands are allowed per request
// set to true
const SINGLE_COMMANDS_AND_NO_VARS = false;


// The communication protocol with the server can be "REST" or "websocket"
const COMMUNICATION_PROTOCOL = "REST";
//const COMMUNICATION_PROTOCOL = "websocket";
// TODO: configuration for the secure server

// The communication method can be GraphSON 1.0 (used by Gremlin 3.2)
// or GraphSON 3.0 (used by Gremlin 3.3)
const COMMUNICATION_METHOD = "GraphSON1"
//const COMMUNICATION_METHOD = "GraphSON3"

// Graph configuration
const default_nb_of_layers = 3;
const node_limit_per_request = 50;
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
