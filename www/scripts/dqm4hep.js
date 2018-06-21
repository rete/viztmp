/** @file dqm4hep.js
 * Main file to include for web interface */

/** @namespace dqm4hep
  * Holder of all dqm4hep functions and classes */
  
var dqm4hep = (function() {
  var dqm4hep = {};
  dqm4hep.loadMonitoring = function(element) {
    if(null == element) {
      element = document.createElement("div");
      document.body.appendChild(element);
    }
    element.fancytree({});
    // element.appendChild(tree);
    // element.appendChild(document.createTextNode("Hello world"));
    return element;
  };
  return dqm4hep;
})();