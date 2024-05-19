import { Interpreter } from '/imports/client/lib/interpreter'
import { Utilities } from '/imports/client/platform/js/utilities/utils.js'
import { Elements, Compartments, ElementTypes, CompartmentTypes  } from '/imports/db/platform/collections'
import { Dialog } from '/imports/client/platform/js/interpretator/Dialog'
import { genAbstractQueryForElementList, resolveTypesAndBuildSymbolTable } from './genAbstractQuery';
import { getPathFullGrammarChangeDirection } from './parser.js';
import { Create_VQ_Element, VQ_Element, VQ_Schema } from './VQ_Element';
import * as vq_property_path_grammar_parser from '/imports/client/custom/vq/js/vq_property_path_grammar_parser.js'
import { dataShapes } from '/imports/client/custom/vq/js/DataShapes.js'
import { Tools, Projects, DiagramTypes } from '/imports/db/platform/collections'


import getStream from 'get-stream'
import rdf from '@zazuko/env-node'
//const rdf = Npm.require('@zazuko/env-node').rdf
 import SHACLValidator from 'rdf-validate-shacl'
 import { toSparql } from 'clownface-shacl-path'

 import clownface from 'clownface'
// import { createRequire } from "module";

import formats from '@rdfjs/formats-common'
import stringToStream from "string-to-stream"




const FILE = 'OR';
const VERSION = '3';

const INDENT = '   '

//const require = createRequire(import.meta.url);


var config = null;
var sample_data = null;

// var fs = require('fs');

// var data = fs.readFileSync('extracted_config.json', 'utf-8');
// config = JSON.parse(data);


var diagramTypeId =  null // config.types[0].object._id; // TODO
var diagramId =  null //config.types[0].object.diagramId
var projectId = null
var versionId = null
var toolName = null
var toolId = null


var shapes = null
var validator = null

var sh = rdf.namespace('http://www.w3.org/ns/shacl#') // TODO


var objects = []
var links = []
var shape_links = []
var processed = {}
var idx = 0;

function get_id() {
    idx = idx + 1;
    let ret = 10000 + idx;
    return '111111111111' + ret.toString();
}

/*
@prefix dash: <http://datashapes.org/dash#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix schema: <http://schema.org/> .
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .


*/
function get_without_prefix(predicate, use_alias=true) {

    const dash_str = "http://datashapes.org/dash#"
    const rdf_str = "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    const rdfs_str = "http://www.w3.org/2000/01/rdf-schema#"
    const schema_str = "http://schema.org/"
    const dot_str = "http://example.org/"
    const sh_str = "http://www.w3.org/ns/shacl#"
    const xsd_str = "http://www.w3.org/2001/XMLSchema#"
    const dbp_str = "http://dbpedia.org/property/"
    const dbo_str = "http://dbpedia.org/ontology/"
    const dbr_str = "http://dbpedia.org/resource/"
    const foaf_str = "http://xmlns.com/foaf/0.1/"  
    const ub_str = "http://swat.cse.lehigh.edu/onto/univ-bench.owl#" 

    var ret = predicate;

    console.log("get_without_prefix:")
    console.log(predicate);
    //console.log(shrink(predicate));


    if (predicate.startsWith(schema_str)) {
        ret = predicate.substring(schema_str.length)
        if (use_alias) {
            ret = "schema:" + ret; 
        }
    } else if (predicate.startsWith(sh_str)) {
        ret = predicate.substring(sh_str.length);
        if (use_alias) {
            ret = "sh:" + ret; 
        }
    } else if (predicate.startsWith(dash_str)) {
        ret = predicate.substring(dash_str.length)
        if (use_alias) {
            ret = "dash:" + ret; 
        }
    } else if (predicate.startsWith(rdf_str)) {
        ret = predicate.substring(rdf_str.length)
        if (use_alias) {
            ret = "rdf:" + ret; 
        }
    } else if (predicate.startsWith(rdfs_str)) {
        ret = predicate.substring(rdfs_str.length)
        if (use_alias) {
            ret = "rdfs:" + ret; 
        }
    } else if (predicate.startsWith(xsd_str)) {
        ret = predicate.substring(xsd_str.length)
        if (use_alias) {
            ret = "xsd:" + ret; 
        }
    } else if (predicate.startsWith(dbp_str)) {
        ret = predicate.substring(dbp_str.length)
        if (use_alias) {
            ret = "dbp:" + ret; 
        }
    } else if (predicate.startsWith(dbo_str)) {
        ret = predicate.substring(dbo_str.length)
        if (use_alias) {
            ret = "dbo:" + ret; 
        }
    } else if (predicate.startsWith(dot_str)) {
        ret = predicate.substring(dot_str.length)
        if (use_alias) {
            ret = ":" + ret; 
        }
    } else if (predicate.startsWith(dbr_str)) {
        ret = predicate.substring(dbr_str.length)
        if (use_alias) {
            ret = "dbr:" + ret; 
        }
    } else if (predicate.startsWith(foaf_str)) {
        ret = predicate.substring(foaf_str.length)
        if (use_alias) {
            ret = "foaf:" + ret; 
        }
    } else if (predicate.startsWith(ub_str)) {
        ret = predicate.substring(ub_str.length)
        if (use_alias) {
            ret = "ub:" + ret; 
        }
    } else {
        console.log("WANRIGN: unknown prefix!");
        console.log(predicate);
    }

    return ret;
}


function is_simple(predicate) {
    // console.log(sh.datatype);
    // console.log(validator.ns.rdf.type);
     //console.log(predicate);
    return [sh.datatype.value, 
            sh.nodeKind.value,
            sh.name.value, 
            sh.maxCount.value, 
            sh.minCount.value,
            sh.lessThan.value,
            sh.lessThanOrEquals.value,
            sh.equals.value,
            sh.disjoint.value,
            sh.maxExclusive.value,
            sh.minExclusive.value,
            sh.maxInclusive.value,
            sh.minInclusive.value,
            sh.minLength.value,
            sh.maxLength.value,
            sh.pattern.value,
            sh.uniqueLang.value,
            sh.severity.value,
            sh.message.value,
          //  sh.class.value, // TODO check
            sh.hasValue.value, // TODO check
            sh.flags.value,
            sh.ignored.value, // TODO think
            sh.qualifiedValueShapesDisjoint.value,
            sh.qualifiedMinCount.value,
            sh.qualifiedMaxCount.value,
        ].includes(predicate.value);
}

function convertable_to_compartment(predicate) {
    return is_simple(predicate) || predicate.value == sh.in.value || predicate.value == sh.languageIn.value;
}

function get_simple_compartment(quad) {
    return new Compartment(quad.predicate.value, quad.object.value);
}

function process_object(quad, parent) {
    switch (quad.predicate.value) {
        case sh.property.value:
            if (processed[quad.object.value]) {
                links.push([parent, processed[quad.object.value]]);
                return processed[quad.object.value];
            } else {
                var prop = new PropertyShape(quad.object);
                links.push([parent, prop]);
                return prop
            }
        case sh.or.value:
        case sh.and.value:
        case sh.xone.value:
        case sh.not.value:
                return process_logical_el(parent, quad.object, quad.predicate.value);
        case sh.class.value:
            if (!processed[quad.object.value]) {
                var class_obj = new Class(quad.object.value);
                links.push([parent, class_obj]);
                // objects.push(prop_obj);
            } else {
                links.push([parent, processed[quad.object.value]]);
            }
            break;            
        default:
            console.log(quad);
            throw "Unexpected SHACL construction while process link to SHACL object"
    }
}

function get_all(node) {
    // console.log(validator.$shapes.node(node_pointer));
    //console.log(node);
    var node_pointer = validator.$shapes.node(node);
    console.log(node_pointer.term);

    if (node_pointer.value == undefined) {
        throw "undefined in get_all";
    }

    //console.log(validator.ns.rdf.nil);
    
    if (node_pointer.value == validator.ns.rdf.nil.value) {
        return [];
    }
    //console.log(node_pointer.out(validator.ns.rdf.rest).terms.length);
    if (node_pointer.out(validator.ns.rdf.first).terms.length == 0) {
        return [node_pointer];
    }
  
    return [node_pointer.out(validator.ns.rdf.first)].concat(get_all(node_pointer.out(validator.ns.rdf.rest).term));
    

}

function get_in_str(in_obj) {
    var ss = "\n";

    get_all(in_obj).forEach((obj) => {
       ss = ss + INDENT + get_without_prefix(obj.value) + "\n"; 
    });
    return ss;
}

// TODO combine into one method

function process_in(parent, in_obj) {
    parent.compartments.push(new Compartment(sh.in.value, get_in_str(in_obj)));
   // throw "LOL";
}

function process_languageIn(parent, in_obj) {
    parent.compartments.push(new Compartment(sh.languageIn.value, get_in_str(in_obj)));
}

function process_ignoredProperties(parent,ip_obj) {
    parent.compartments.push(new Compartment(sh.ignoredProperties.value, get_in_str(ip_obj)))
}

function process_logical_el(parent, logical_obj, logical_type) {
    var non_simple_found = false;


    console.log("process_logical_el");
    // console.log(parent);
    // console.log(logical_obj);
    // console.log(logical_type);

    //  console.log("ALL LOGICAL ELEMENTS");
    //  var lol = get_all(logical_obj).terms
    //  console.log("ALL LOGICAL ELEMENTS lol");
    //  console.log(lol);
    //  console.log("ALL LOGICAL ELEMENTS starpterms");
    // get_all(logical_obj).forEach((o) => {
    //     console.log(o.term);

    //     console.log("-----");
        
    //     validator.$shapes.dataset.match(o.term, null, null, null)._quads.forEach((quad) => {
    //     console.log(quad);
    //     });

    //     console.log("-----");
        
    //     validator.$shapes.dataset.match(null, null,o.term, null)._quads.forEach((quad) => {
    //     console.log(quad);
    //     });

    //     console.log("-----");


    // });

    //  console.log("ALL LOGICAL ELEMENTS OUT");



    get_all(logical_obj).forEach((obj) => {
        console.log(obj.value);
        if (validator.$shapes.dataset.match(obj.term, null, null, null)._quads.size > 1) {
            non_simple_found = true;
        }
        validator.$shapes.dataset.match(obj.term, null, null, null)._quads.forEach((quad) => {
             console.log("LOGICAL EL LOOP");
             console.log(quad);
            // console.log(quad.predicate);
            
            if (!convertable_to_compartment(quad.predicate)) {
                non_simple_found = true;
            }
        });
    });

    console.log("non_simple_found: " + non_simple_found);

    if (non_simple_found) {
        var el = new LogicalEl(logical_type);
        objects.push(el);
        get_all(logical_obj).forEach((obj) => {
            var quads = validator.$shapes.dataset.match(obj.term, null, null, null)._quads;
            // console.log("quads.length");
            // console.log(quads.size);
            if (quads.size == 0) {
                throw "Something is wrong";
            }
            
            if (quads.size == 1) {
                quads.forEach((quad) => {
                    console.log("LOL: " + el.id);
                    console.log(quad);
                    process_object(quad, el);
                });
         
            } else {
                console.log("HERE");
                console.log(obj.term);
                //console.log(obj.has(validator.ns.rdf.type, sh.NodeShape).terms.length);
                if (obj.has(validator.ns.rdf.type, sh.NodeShape).terms.length > 0) {
                    if (processed[obj.value]) {
                        links.push([el, processed[obj.value]]);
                    } else {
                        var nodeshape = new NodeShape(obj.term);
                        links.push([el, nodeshape]);
                    }
                   // objects.push(nodeshape);
                } else {
                    // Assume it is property
                    if (processed[obj.value]) {
                        links.push([el, processed[obj.value]]);
                    } else {
                        var propertyshape = new PropertyShape(obj.term);
                        links.push([el, propertyshape]);
                        // objects.push(propertyshape);
                    }
                }
            }
        });
        links.push([parent, el]);  
        return el; // TODO do we need return ? 
        
    } else {
        var ss = "\n";
        get_all(logical_obj).forEach((obj) => {
            validator.$shapes.dataset.match(obj.term, null, null, null)._quads.forEach((quad) => {
            if (is_simple(quad.predicate)) {
                ss = ss + INDENT + get_without_prefix(quad.predicate.value) + " " + get_without_prefix(quad.object.value) + "\n"; 
            } else if (quad.predicate.value == sh.in.value || quad.predicate.value == sh.languageIn.value) {
                ss = ss + INDENT + get_without_prefix(quad.predicate.value) + " " + get_in_str(quad.object) + "\n"; 
            } else {
                throw "Unexpected SHACL construction inside logical element"
            }
            });
        });

        parent.compartments.push(new Compartment(logical_type, ss));
    }
}

class Compartment {
    constructor(type, value) {
        this.type = get_without_prefix(type);
        this.value = get_without_prefix(value);
    }

    toString() {
        return "[" + this.type + ": " + this.value + "]";
    }

    toJSON(boxName) {
        return get_compartment_JSON(this.type, this.value, boxName);
    }
}

function get_compartment_JSON(name, value, boxName) {
    var comp_type = get_by_name(get_by_name(config.types[0].boxTypes, boxName).compartmentTypes, name).object

    comp_obj = {
        _id: get_id(),
        projectId: projectId, // TODO
        diagramId: diagramId,
        elementId: comp_type.elementId,
        diagramTypeId: comp_type.diagramTypeId,
        elementTypeId: comp_type.elementTypeId,
        versionId: versionId,
        compartmentTypeId: comp_type._id,
        input: value,
        value: comp_type.prefix + value,
        index: comp_type.index,
        isObjectRepresentation: false,
        type: "text",
        styleId: comp_type.styles[0].id,
        style: comp_type.styles[0].style, 
        valueLC: (comp_type.prefix + value).toLowerCase(),
        compartmentTypeName: name,
        toolName: toolName, // TODO
        toolId: toolId // TODO
    }
    //Compartments.insert(comp_obj);
    return comp_obj;

}

class Predicate {
    constructor(value) {
        this.value = get_without_prefix(value);
        this.id = get_id();
    }

    toString() {
        return "PREDICATE: " + this.value + "| id: " + this.id + "\n";
    }

    toJSON() {
        var box = get_empy_box("Relation", "Default", this.id);
        box.compartments.push(get_compartment_JSON("Name", this.value, "Relation"))
        return box;
    }
}

class NodeShape {
    constructor(shape) {
        this.id = get_id();


        console.log("PROCESS SHAPE!");
        console.log(shape.value);
        console.log(shape);
        console.log(validator.$shapes.dataset.match(shape, null, null, null)._quads);

        this.name = get_without_prefix(shape.value);
        console.log(this.name);
        this.compartments = [];

        processed[shape.value] = this;

        validator.$shapes.dataset.match(shape, null, null, null)._quads.forEach((quad) => {
            console.log(quad);
            console.log(quad.predicate);
            
            if (is_simple(quad.predicate)) {
                this.compartments.push(get_simple_compartment(quad));
            } else {
                switch(quad.predicate.value) {
                    case sh.property.value:
                        // console.log("quad.object.value");
                        // console.log(quad.object.value);
                        // throw "remove me";
                        if (!processed[quad.object.value]) {
                            var prop_obj = new PropertyShape(quad.object);
                            links.push([this, prop_obj]);
                           // objects.push(prop_obj);
                        } else {
                            links.push([this, processed[quad.object.value]]);
                        }
                        break;
                    case sh.targetClass.value:
                        if (processed[quad.object.value]) {
                            links.push([processed[quad.object.value], this]);
                        } else {
                            var target_obj = new Class(quad.object.value);
                            links.push([target_obj, this]);
                        }
                        //objects.push(target_obj);
                        break;
                    // case sh.targetClass.value:
                    //     var target_obj = new Class(quad.object.value);
                    //     links.push([target_obj, this]);
                    //     objects.push(target_obj);
                    //     break;
                    case sh.targetNode.value:
                        var target_obj = new Object(quad.object.value);
                        links.push([this, target_obj]);
                        objects.push(target_obj);
                        break;
                    case sh.targetSubjectsOf.value:
                        var pred_obj = new Predicate(quad.object.value);
                        links.push([pred_obj, this]); // TODO\
                        objects.push(pred_obj);
                        break;
                    case sh.targetObjectsOf.value:
                        var pred_obj = new Predicate(quad.object.value);
                        links.push([this, pred_obj]); // TODO
                        objects.push(pred_obj);
                        break;
                    case sh.target.value:
                        break; // TODO
                    // case sh.ignored.value:
                    //     this.ignored = true;
                    //     break;
                    case sh.deactivated.value:
                        this.deactivated = true;
                        break;
                    case sh.closed.value:
                        this.closed = true;
                        break;
                    case sh.in.value:
                        process_in(this, quad.object);
                        break;
                    case sh.languageIn.value:
                        process_languageIn(this, quad.object);
                        break;
                    case sh.ignoredProperties.value:
                        process_ignoredProperties(this, quad.object);
                        break;   
                    case sh.or.value:
                    case sh.and.value:
                    case sh.xone.value:
                    case sh.not.value:
                        process_logical_el(this, quad.object, quad.predicate.value);           
                        break;
                    case sh.node.value:
                        if (processed[quad.object.value]) {
                            shape_links.push([this, processed[quad.object.value]]);
                        } else {
                            // TODO check it is node shape
                            shape_links.push([this, new NodeShape(quad.object)]);
                        } 
                    case validator.ns.rdf.type.value:
                        if (quad.object.value == validator.ns.rdfs.Class.value) {
                            this.name = this.name + "\n<<Class>>"
                        }
                        break;    
                    default:
                        console.log(quad);
                        throw "Unexpected SHACL construction inside Node Shape"; 
            }
        }
        });

        objects.push(this);
    }

    toString() {
        var ss =  "NodeShape: " + this.name + "| id: " + this.id + "\n";
        ss = ss + "Compartments: [ \n";
        this.compartments.forEach((comp) => {
            ss = ss + INDENT + comp.toString() +  "\n";
        });
        ss = ss + "]\n";
        return ss;
    }

    toJSON() {
        var style = "Default";
        if (this.closed) {
            style = "Closed";
        }
        var box = get_empy_box("NodeShape", style, this.id);
        box.compartments.push(get_compartment_JSON("Name", this.name, "NodeShape"))

        if (this.closed) {
            box.compartments.push(get_compartment_JSON("Closed", "true", "NodeShape"))
        }

        this.compartments.forEach((comp) => {
            box.compartments.push(comp.toJSON("NodeShape"));
        });

    
        return box;
    }

}

function process_path(path_obj) {
    console.log("process_path");
    console.log(path_obj);
    console.log(toSparql(validator.$shapes.node(path_obj)).toString(({ prologue: false })));

    return toSparql(validator.$shapes.node(path_obj));
}

class PropertyShape {
    constructor(property, qualified) {
        this.id = get_id();

        console.log("PROCESS PROPERTY!");
        console.log(property.term);
        console.log(property.value);

        //console.log(validator.$shapes.dataset.match(property.term, null, null, null)._quads);

        //this.name = get_without_prefix(property.value);
        this.compartments = [];

        if (qualified) {
            this.qualified = true;
        }

        processed[property.value] = this;

        validator.$shapes.dataset.match(property, null, null, null)._quads.forEach((quad) => {
           // console.log(quad);
            if (is_simple(quad.predicate)) {
                console.log("SIMPLE!!!");
                this.compartments.push(get_simple_compartment(quad));
            } else {
                switch(quad.predicate.value) {
                    case sh.path.value: // TODO non trivial path
                        this.path = process_path(quad.object);
                        break;
                    case sh.class.value:
                        if (!processed[quad.object.value]) {
                            var class_obj = new Class(quad.object.value);
                            links.push([this, class_obj]);
                            // objects.push(prop_obj);
                        } else {
                            links.push([this, processed[quad.object.value]]);
                        }
                        break;       
                    case sh.in.value:
                        process_in(this, quad.object);
                        break;
                    case sh.languageIn.value:
                        process_languageIn(this, quad.object);
                        break;    
                    case sh.or.value:
                    case sh.and.value:
                    case sh.xone.value:
                    case sh.not.value: 
                        process_logical_el(this, quad.object, quad.predicate.value); 
                        break;
                    case sh.node.value:     
                        if (processed[quad.object.value]) {
                            shape_links.push([this, processed[quad.object.value]]);
                        } else {
                            // TODO check it is node shape
                            shape_links.push([this, new NodeShape(quad.object)]);
                        }        
                        break; 
                    case validator.ns.rdf.type.value:
                        break;
                    case sh.qualifiedValueShape.value:
                        if (validator.$shapes.dataset.match(quad.object, null, null, null)._quads.size > 1) {
                            var propertyshape = new PropertyShape(quad.object, true);
                            links.push([this, propertyshape]);
                        } else {
                            var link = validator.$shapes.node(quad.object).out(sh.node).term;
                            if (link) {
                                if (processed[link.value]) {
                                    shape_links.push([this, processed[link.value]]);
                                } else {
                                    // TODO check it is node shape
                                    shape_links.push([this, new NodeShape(link)]);
                                }      
                            } else {
                                throw "Unknown construction inside qualified node"
                            }
                        }
                        break;  
                    default:
                        console.log(quad);
                        throw "Unexpected SHACL construction in property"; 
            }
        }
        });

        objects.push(this);
        
    }

    toString() {
        var ss =  "PropertyShape: " + this.path.toString(({ prologue: false }))  +  " (" + this.qualified + ") " +"| id: " + this.id  + "\n";
        ss = ss + "Compartments: [ \n";
        this.compartments.forEach((comp) => {
            ss = ss + INDENT + comp.toString() +  "\n";
        });
        ss = ss + "]\n";
        return ss;
    }

    toJSON() {
        var style = "Default";
        if (this.qualified) {
            style = "Qualified";
        }
        var box = get_empy_box("PropertyShape", style, this.id);
        box.compartments.push(get_compartment_JSON("Path", this.path.toString(({ prologue: false })), "PropertyShape"))

        this.compartments.forEach((comp) => {
            box.compartments.push(comp.toJSON("PropertyShape"));
        });

        return box;
    }
}

class Object {
    constructor(name) {
        this.name = get_without_prefix(name);
        this.id = get_id();
    }

    toString() {
        return "Object: " + this.name + "| id: " + this.id;
    }

    toJSON() {
        var box = get_empy_box("Object", "Default", this.id);
        box.compartments.push(get_compartment_JSON("Name", this.name, "Object"))
        return box;
    }
}

class Class {
    constructor(name) {
        processed[name] = this;
        this.name =  get_without_prefix(name);
        this.id = get_id();
        objects.push(this);
    }

    toString() {
        return "Class: " + this.name + "| id: " + this.id;
    }

    toJSON() {
        var box = get_empy_box("Class", "Default", this.id);
        box.compartments.push(get_compartment_JSON("Name", this.name, "Class"))
        return box;
    }
}


class LogicalEl {
    constructor(type) {
        this.type = get_without_prefix(type, false).toUpperCase();
        this.id = get_id();
    }

    toString() {
        return "LogicalEl: " + this.type + "| id: " + this.id;
    }

    toJSON() {
        var box = get_empy_box("LogicalElement", "Default", this.id);
        box.compartments.push(get_compartment_JSON("TYPE", this.type, "LogicalElement"))
        return box;
    }
}



function get_empty_diagram() {
    return {
        _id: get_id(),
        name: FILE + '_v' + VERSION,
        projectId: projectId , // TODO 
        versionId: versionId,
        isLayoutComputationNeededOnLoad: 1,
        style: {
            fillPriority: "color",
            fill: "#ffffff",
            fillLinearGradientStartPointX: 0.5,
            fillLinearGradientStartPointY: 0,
            fillLinearGradientEndPointX: 0.5,
            fillLinearGradientEndPointY: 1,
            fillLinearGradientColorStops: [
                0,
                "white",
                1,
                "black"
            ],
            fillRadialGradientStartPointX: 0.5,
            fillRadialGradientStartPointY: 0.5,
            fillRadialGradientEndPointX: 0.5,
            fillRadialGradientEndPointY: 0.5,
            fillRadialGradientStartRadius: 0,
            fillRadialGradientEndRadius: 1,
            fillRadialGradientColorStops: [
                0,
                "white",
                1,
                "black"
            ]
        },
        diagramTypeId: diagramTypeId,
        editorType: "ajooEditor",
        createdAt: "2024-04-11T04:17:43.004Z",
        createdBy: "c3TBoLRFSdGzyXsJ9",
        imageUrl: "http://placehold.it/770x347",
        edit: {
            action: "new",
            time: "2024-04-11T04:17:43.004Z",
            userId: "c3TBoLRFSdGzyXsJ9"
        },
        parentDiagrams: [],
        allowedGroups: [],
        seenCount: 1,
        diagramTypeName: config.types[0].object.name,
        toolName: toolName, // TODO
        toolId: toolId, // TODO
        elements: []
        }
}

function getLinkJSON(link, link_type) {
    var element_obj = get_by_name(config.types[0].lineTypes, link_type);
    var style_obj = get_by_name(element_obj.object.styles, "Default");
    return {
        _id: get_id(),
        startElement: link[0].id,
        endElement: link[1].id,
        diagramId: diagramId, // TODO
        diagramTypeId: diagramTypeId,
        elementTypeId:  element_obj.object._id,
        style: {
            elementStyle: style_obj.elementStyle,
            "startShapeStyle": {
                "fill": "rgb(65,113,156)",
                "fillPriority": "color",
                "stroke": "rgb(65,113,156)",
                "strokeWidth": 1,
                "shadowColor": "red",
                "shadowBlur": 0,
                "shadowOpacity": 1,
                "shadowOffsetX": 0,
                "shadowOffsetY": 0,
                "tension": 0,
                "opacity": 1,
                "dash": [],
                "radius": 7,
                "shape": "None"
            },
            "endShapeStyle": {
                "fill": "rgb(65,113,156)",
                "fillPriority": "color",
                "stroke": "rgb(65,113,156)",
                "strokeWidth": 1,
                "shadowColor": "red",
                "shadowBlur": 0,
                "shadowOpacity": 1,
                "shadowOffsetX": 0,
                "shadowOffsetY": 0,
                "tension": 0,
                "opacity": 1,
                "dash": [],
                "radius": 12,
                "shape": "Triangle"
            },
            "lineType": "Orthogonal"
        },
        styleId: style_obj.id,
        type: "Line",
        points: [
            345,
            538,
            345,
            601,
            380,
            601,
            380,
            663
        ],
        projectId: projectId, // TODO
        versionId: versionId,
        elementTypeName: "Connection",
        toolName: toolName,
        toolId: toolId,
        compartments: []
    };
}



function get_by_name(arr, name) {
    console.log("get_by_name");
    console.log(arr);
    console.log(name);
    var ret = null;
    arr.forEach((obj) => {
        // console.log(obj.object.name == name);
         console.log(obj.name);
         console.log(name);
        if (obj.name == name) {
            ret = obj;
        }
        
        if (obj.object) {
            console.log(obj.object.name);
            console.log(obj.object.name.length);
            console.log(name.length);
            console.log(obj.object.name == name);
            if (obj.object.name == name) {
                ret = obj;
            }
        }
    });
    console.log("ret:");
    console.log(ret);
    return ret;
}

function get_empy_box(boxTypeName, style, id) {
    console.log(config.types[0].boxTypes);
    var element_obj = get_by_name(config.types[0].boxTypes, boxTypeName)
    console.log(element_obj);
    var style_obj = get_by_name(element_obj.object.styles, style)
    return {
        _id: id,
        diagramId: diagramId,
        diagramTypeId: diagramTypeId,
        type: "Box",
        elementTypeId: element_obj.object._id,
        elementTypeName: boxTypeName,
        style: {elementStyle: style_obj.elementStyle },
        styleId: style_obj.id,
        location: {x: 333, y: 195, width: 130, height: 83},
        projectId: projectId,
        versionId: versionId,
        toolName: toolName,
        toolId: toolId,
        compartments: []
    }
}

function getCompartmentTypes(elem_type_id) {
    return CompartmentTypes.find({elementTypeId: elem_type_id}).map(function(compart_type) {
        return {object: compart_type,};
    });
}

function getBoxTypes(diagram_type_id) {
    return ElementTypes.find({diagramTypeId: diagram_type_id, type: "Box"}).map(function(elem_type) {

        var elem_type_id = elem_type._id

        return {object: elem_type,
                compartmentTypes: getCompartmentTypes(elem_type_id),
            };
    });
}

function getLineTypes(diagram_type_id) {
    return ElementTypes.find({diagramTypeId: diagram_type_id, type: "Line"}).map(function(elem_type) {

        var elem_type_id = elem_type._id

        return {object: elem_type,
                compartmentTypes: getCompartmentTypes(elem_type_id),
            };
    });
}

function smartInsert(elements, diagram_type) {
    var elem_map = {};
    _.each(elements, function(element) {

        var old_elem_id = element._id;

        var compartments = element.compartments;
        delete element.compartments;
        delete element._id;

        var elem_type_id = element.elementTypeId;

        var element_type = ElementTypes.findOne({_id: elem_type_id, toolId: toolId,});
        if (!element_type) {

            //element_type = ElementTypes.findOne({_id: elem_type_id,});
            if (!element_type) {

                var element_type_name = element.elementTypeName;
                element_type = ElementTypes.findOne({name: element_type_name,
                                                        toolId: toolId,
                                                        diagramTypeId: diagram_type._id,
                                                    });

                if (!element_type) {
                    console.error("No ElementType", elem_type_id);
                    return;
                }
            }
        }

        _.extend(element, {projectId: projectId,
                            versionId: versionId,
                            diagramId: diagramId,
                            elementTypeId: element_type._id,
                            diagramTypeId: diagram_type._id,
                            toolId: toolId,
                        });
        
        if (element.type == "Line") {
            _.extend(element, {startElement: elem_map[element.startElement],
                                endElement: elem_map[element.endElement],
                            });
        }

        var element_id = Elements.insert(element);
        
        elem_map[old_elem_id] = element_id;

        _.each(compartments, function(compartment) {
            delete compartment._id;

            var compart_type_id = compartment.compartmentTypeId;

            var compart_type = CompartmentTypes.findOne({_id: compart_type_id, toolId: toolId,});
            if (!compart_type) {

                //compart_type = CompartmentTypes.findOne({_id: compart_type_id,});
                if (!compart_type) {

                    var compart_type_name = compartment.compartmentTypeName;
                    compart_type = CompartmentTypes.findOne({name: compart_type_name,
                                                                toolId: toolId,
                                                                diagramTypeId: diagram_type._id,
                                                                elementTypeId: element_type._id,
                                                            });

                    if (!compart_type) {
                        console.error("No CompartmentType", compart_type_id);
                        return;
                    }
                }
            }

            _.extend(compartment, {projectId: projectId,
                                    versionId: versionId,
                                    diagramId: diagramId,
                                    elementId: element_id,
                                    compartmentTypeId: compart_type._id,

                                    elementTypeId: element_type._id,
                                    diagramTypeId: diagram_type._id,
                                    toolId: toolId,
                                });

            Compartments.insert(compartment);
        });
    
    });
}

Interpreter.customMethods({
 generateVisualSHACL: async function(shacl_text) {

    console.log(shacl_text);

    
    var contentStream = stringToStream(shacl_text)
    var parser = formats.parsers.get('text/turtle')
    var lolS = parser.import(contentStream)

    
     shapes = await rdf.dataset().import(lolS);

     console.log(shapes.toCanonical);
  

    //    shapes =  rdf.dataset().import(rdf.fromFile('./data.ttl'))
    validator = new SHACLValidator(shapes, { factory: rdf })
    validator = new SHACLValidator(shapes, { factory: rdf })
    


    
    // sh = validator.ns


    objects = []
    links = []
    shape_links = []
    processed = {}



    var diagram_type = DiagramTypes.findOne({_id: Session.get("diagramType")});

    
    diagramTypeId = diagram_type._id; // TODO
    
    //diagramId = diagram_type.diagramId

    diagramId = Session.get("activeDiagram");

    projectId = Session.get("activeProject")
    versionId = Session.get("versionId")

    config = {types : [{
        object: diagram_type,
        boxTypes: getBoxTypes(diagramTypeId),
        lineTypes: getLineTypes(diagramTypeId)
        }] };



    var project = Projects.findOne({_id: projectId,});
    var tool = Tools.findOne({_id: project["toolId"]});

    toolName = tool["name"]
    toolId = project["toolId"]



    //idx = 0;

   // console.log(shapes);

    console.log(validator);
    console.log('----------------------------------');
   // console.log(validator.shapesGraph.shapeNodesWithConstraints);

   // validator.shapesGraph.shapesWithTarget.forEach(kek => console.log(kek.constraints[0].shapeNodePointer))
  
//    console.log(validator.$shapes.has(rdf.type, sh.NodeShape).terms);
//    console.log('-----+++++++++++++++++++++++++++++');
    console.log(validator.$shapes.dataset._quads.size);

    //throw "KEK";

//    var shapeNodes = validator.$shapes.has(rdf.type, sh.NodeShape);

//    console.log(shapeNodes);

validator.$shapes.has(rdf.type, sh.NodeShape).toArray().forEach((shape) => {
    console.log(shape.term);
});
console.log('-----+++++++++++++++++++++++++++++');
    validator.$shapes.has(rdf.type, sh.NodeShape).toArray().forEach((shape) => {
        if (!processed[shape.value] && (shape.value.startsWith('http://schema.org') || shape.value.startsWith('http://example.org'))) {
            console.log(shape.term);
            var shape_obj = new NodeShape(shape.term);
            //objects.push(shape_obj);
        }
        
   });
    // console.log(score.out(sh.targetClass).term);
        // console.log(score.out().toString());
        // console.log(validator.$shapes._context.dataset);

    console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
    console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
    console.log('++++++++++++++++++++++++FINISH++++++++++++++++++++++++++');
    console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
    console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++');

    objects.forEach((obj) => {
        console.log(obj.toString());
    });
    console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
    links.forEach((link) => {
        console.log(link[0].id + " --> " + link[1].id);
    });

    // return;
    
    //data = fs.readFileSync('sample_data.json', 'utf-8');
    
    //sample_data = JSON.parse(data);
    
    var diagram_obj = get_empty_diagram();

    var boxes = []
    var lines = []
    var elements = []
    objects.forEach((obj) => {
        // if (obj.toJSON() == null) {
        //     console.log(obj);
        //     throw "LOL"
        // }
        var box = obj.toJSON();
        //Elements.insert(box);
        diagram_obj.elements.push(box);
       // elements.push(box);
    });

    links.forEach((link) => {
        var l = getLinkJSON(link, "Connection")
        //Elements.insert(l);
        diagram_obj.elements.push(l);
        //elements.push(l);
    })

    shape_links.forEach((link) => {
        var l = getLinkJSON(link, "ShapeLine")
        //Elements.insert(l);
        diagram_obj.elements.push(l);
        //elements.push(l);
    })

    var list = { diagram: diagram_obj, tool_id: toolId, project_id: projectId, version_id: versionId, diagram_id: diagramId, diagram_type: diagram_type};
   

    // console.log("Length: " +  Elements.find({diagramId:diagramId}).length);
    // var els = Elements.find({diagramId:diagramId})

    // console.log("before")
    // els.forEach((el) => {
    //     console.log(el);
    //     if (el.name == "Box") {
    //         boxes.push(el);
    //     }
    //     else {
    //         lines.push(el);
    //     }
    // });
    // console.log("after")

    // boxes =  _.filter(els, function(elem) {
    //     console.log(elem);
    //     return elem.type == "Box";
    // });

    // lines =  _.filter(els, function(elem) {
    //     return elem.type == "Line";
    // });

    //smartInsert(elements, diagram_type);

    // fs.writeFile('diagram_' + FILE + '_v' + VERSION + '.json', JSON.stringify({diagrams : [diagram_obj], project : sample_data.project}, null, "\t"), (err) => {
    //     if (err) throw err;
    // })

    Meteor.call("insertElementsData", list)

    const delay = ms => new Promise(res => setTimeout(res, ms));
    await delay(2000);

    var compartments = Compartments.find({diagramId:diagramId });
   
    compartments.forEach(function(c){
        Compartments.update({_id: c._id, diagramId:diagramId},{$set: { value: c.value + "+" ,}});
    })  
    

    //Interpreter.execute("ComputeLayout");
   // Interpreter.execute("ComputeLayout", [0, 0, boxes, lines]);

}
})

