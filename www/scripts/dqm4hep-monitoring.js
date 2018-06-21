/**
 * Utility class to generate a unique identifier.
 * Generated identifiers can be recycled when
 * user no longer needs it using the reUse() function
 */
UID = function() {
  var id = 0;
  var reuseids = [];

  /**
   * Generate unique identifier
   * @return {number} a unique identifier
   */
  this.getUID = function() {
    if(reuseids.length > 0) {
      return reuseids.shift();
    }
    return id++;
  };

  /**
   * Re use an already generated identifier
   * @param  {number} rid the identifier to reuse
   */
  this.reUse = function(rid) {
    if(rid < 0 || id <= rid || typeof rid != 'number' || reuseids.indexOf(rid) >= 0)
      return;
    reuseids.push(rid);
  }
};


MonitorElement = function(object) {
  this.rootObject = null;
  this.path = "";
  this.module = "";
  this.name = "";
  this.collector = "";
  this.runNumber = 0;
  this.description = "";
  this.qReports = {};
  this.updateEvent = new Event('update');
  this.updateEvent.element = this;
  this.element = document.createElement("null");
  this.update(object, false);
};

MonitorElement.prototype.addEventListener = function(type, listener, options) {
  this.element.addEventListener(type, listener, options);
};

MonitorElement.prototype.removeEventListener = function(type, listener, options) {
  this.element.removeEventListener(type, listener, options);
};

MonitorElement.prototype.update = function(object, emit) {
  this.rootObject = object.rootObject ? object.rootObject : null;
  this.path = object.path;
  this.module = object.module;
  this.name = object.rootObject ? object.rootObject.fName : (object.name ? object.name : "");
  this.collector = object.collector ? object.collector : "";
  this.runNumber = object.runNumber ? object.runNumber : 0;
  this.description = object.description ? object.description : "";
  this.qReports = object.qReports ? object.qReports : {};
  if(emit) {
    this.element.dispatchEvent(this.updateEvent);
  }
}


MonitorElement.prototype.propertiesEquals = function(other) {
  if(other === undefined || other === null) {
    return false;
  }
  if(other.path != this.path) {
    return false;
  }
  if(other.name != this.name) {
    return false;
  }
  if(other.module != this.module) {
    return false;
  }
  if(other.collector != this.collector) {
    return false;
  }
  return true;
}





CollectorTreeView = function(obj) {
  var self = this;
  this.collector = obj.collector;
  this.noHeader = typeof obj.noHeader == "boolean" ? obj.noHeader : false;
  this.container = document.createElement("div");
  this.buttonElement = null;
  if(!this.noHeader) {
    this.buttonElement = document.createElement("button");
    this.buttonElement.classList.add("dqm4hep-tree-view-button");
    this.buttonElement.innerHTML = this.collector;
  }
  this.treeElement = document.createElement("div");
  if(!this.noHeader) {
    this.treeElement.classList.add("dqm4hep-tree-view-content");
  }
  this.elementDblClick = typeof obj.elementDblClick === "function" ? obj.elementDblClick : null;
  this.updateRequested = typeof obj.updateRequested === "function" ? obj.updateRequested : null;
  this.drawRequested = typeof obj.drawRequested === "function" ? obj.drawRequested : null;

  $(this.treeElement).fancytree({
    selectMode: 2,
    collapse: function(event, data) {
      self.treeElement.style.maxHeight = self.treeElement.scrollHeight + "px";
    },
    expand: function(event, data) {
      self.treeElement.style.maxHeight = self.treeElement.scrollHeight + "px";
    },
    click: function(event, data) {
      if(data.targetType == "checkbox") {
        if(data.node) {
          var toCheck = !data.node.isSelected();
          data.node.visit(function(node) {
            if(node.isSelected() == toCheck) {
              return "skip";
            }
            node.setSelected(toCheck);
            return true;
          });
        }
      }
    },
    dblclick: function(event, data) {
      // monitor element case
      if(data.node && (data.node.children == null || data.node.children.length == 0)) {
        if(!data.node.isSelected()) {
          data.node.setSelected(true);
        }
        if(self.elementDblClick != null) {
          self.elementDblClick(event, {element: data.node.data});
        }
      }
      return true;
    },
    source: []
  });

  this.tree = $(this.treeElement).fancytree("getTree");
  
  if(!this.noHeader) {
    this.buttonElement.addEventListener("click", function() {
      this.classList.toggle("dqm4hep-tree-view-button-active");
      if (self.treeElement.style.maxHeight){
        self.treeElement.style.maxHeight = null;
      } else {
        self.treeElement.style.maxHeight = self.treeElement.scrollHeight + "px";
      }
    });
    this.container.appendChild(this.buttonElement);
  }

  this.container.appendChild(this.treeElement);
  
  if(obj.element) {
    obj.element.appendChild(this.container);
  }
  
  $(this.treeElement).contextmenu({
    delegate: "span.fancytree-node",
    menu: [
      {title: "Update", cmd: "update"},
      {title: "Draw in ...", children: [
        {title: "New area", cmd: "drawNew"},
        {title: "Current area", cmd: "drawCurrent"}
      ]},
      {title: "-----"},
      // {title: "Show info", cmd: "showInfo"},
      {title: "Remove", cmd: "remove"}
    ],
    beforeOpen: function(event, ui) {
      var node = $.ui.fancytree.getNode(ui.target);
      node.setActive();
    },
    select: function(event, ui) {
      var node = $.ui.fancytree.getNode(ui.target);
      if(!node) {
        return;
      }
      if(ui.cmd == "update") {
        if(self.updateRequested) {
          console.log("update callback");
          self.updateRequested(event, {element: node.data});
        }
      }
      else if(ui.cmd == "drawNew") {
        if(self.drawRequested) {
          console.log("drawNew callback");
          self.drawRequested(event, {element: node.data, current: false});
        }
      }
      else if(ui.cmd == "drawCurrent") {
        if(self.drawRequested) {
          console.log("drawCurrent callback");
          self.drawRequested(event, {element: node.data, current: true});
        }
      }
      else if(ui.cmd == "remove") {
        console.log("remove callback");
        node.remove();
      }
    }
  });
};

CollectorTreeView.prototype.moduleNames = function() {
  return this.tree.getRootNode().getChildren().map(function(child) {
    return child.title;
  });
};

CollectorTreeView.prototype.addModule = function(moduleName) {
  var moduleNode = this.tree.getRootNode().findFirst(moduleName);
  if(moduleNode === null) {
    moduleNode = this.tree.getRootNode().addChildren({
      title: moduleName,
      checkbox: true,
      folder: true
    });
  }
  return moduleNode;
};

CollectorTreeView.prototype.removeModule = function(moduleName) {
  var moduleNode = this.tree.getRootNode().findFirst(moduleName);
  if(moduleNode) {
    moduleNode.remove();
  }
};

CollectorTreeView.prototype.moduleExists = function(moduleName) {
  return (this.tree.getRootNode().findFirst(moduleName) === null);
};

CollectorTreeView.prototype.clear = function() {
  this.tree.clear();
};

CollectorTreeView.prototype.findDirectory = function(moduleName, directories) {
  var dirList = [moduleName].concat(directories);
  var currentNode = this.tree.getRootNode();;
  for(var index = 0 ; index<dirList.length ; index++) {
    var dirName = dirList[index];
    if(dirName.length == 0) {
      continue;
    }
    var directory = currentNode.findFirst(dirName);
    if(directory === null) {
      return null;
    }
    currentNode = directory;
  }
  return currentNode;
};

CollectorTreeView.prototype.mkdir = function(moduleName, directories) {
  var moduleNode = this.addModule(moduleName);
  var currentNode = moduleNode;
  for(var index = 0 ; index<directories.length ; index++) {
    var dirName = directories[index];
    if(dirName.length == 0) {
      continue;
    }
    var directory = currentNode.findFirst(dirName);
    if(directory === null) {
      directory = currentNode.addChildren({
        title: dirName,
        checkbox: true,
        folder: true
      });
    }
    currentNode = directory;
  }
  return currentNode;
};

CollectorTreeView.prototype.addElement = function(object) {
  var directory = this.mkdir(object.module, object.path.split("/"));
  var elementNode = directory.findFirst(object.name);
  if(elementNode === null) {
    elementNode = directory.addChildren({
      title: object.name,
      checkbox: true,
      folder: false,
      icon: false
    });
    elementNode.data = new MonitorElement(object);
  }
  else {
    elementNode.data.update(object);
  }
  elementNode.tooltip = this.generateToolTip(object);
  elementNode.data.collector = this.collector;
  return elementNode;
};

CollectorTreeView.prototype.removeElement = function(object) {
  var directory = this.findDirectory(obj.module, obj.path.split("/"));
  if(directory) {
    var elementNode = directory.findFirst(obj.name);
    if(elementNode) {
      elementNode.remove();
    }
  }
};

CollectorTreeView.prototype.selectedElements = function() {
  return this.tree.getSelectedNodes().filter(function(node) {
    return !node.isFolder();
  }).map(function(node) {
    return node.data;
  });
};

CollectorTreeView.prototype.unCheckAll = function() {
  return this.tree.selectAll(false);
};


CollectorTreeView.prototype.generateToolTip = function(element) {
  var tooltip = "";
  tooltip += "Name: " + element.name + "\n";
  tooltip += "Path: " + element.path + "\n";
  tooltip += "Module: " + element.module + "\n";
  tooltip += "Collector: " + element.collector + "\n";
  tooltip += "Run: " + element.runNumber + "\n";
  tooltip += "Description: " + element.description + "\n";
  return tooltip;
};



//-----------------------------------------------------------

MultiCollectorTreeView = function(obj) {
  var self = this;
  this.container = document.createElement("div");
  this.collectorViews = {};
  this.elementDblClick = typeof obj.elementDblClick === "function" ? obj.elementDblClick : null;
  this.updateRequested = typeof obj.updateRequested === "function" ? obj.updateRequested : null;
  this.drawRequested = typeof obj.drawRequested === "function" ? obj.drawRequested : null;
  
  // view construction
  this.container.classList.add("dqm4hep-multiview-container");
  this.header = document.createElement("p");
  this.header.innerHTML = "Monitor elements";
  this.header.classList.add("dqm4hep-multiview-header");
  this.container.appendChild(this.header);
  if(obj.element) {
    obj.element.appendChild(this.container);
  }
};


MultiCollectorTreeView.prototype.collectorNames = function() {
  return Object.keys(this.collectorViews);
};


MultiCollectorTreeView.prototype.addElement = function(element) {
  if(element == null) {
    return;
  }
  var collectorView;
  var self = this;
  if(!this.collectorViews.hasOwnProperty(element.collector)) {
    collectorView = new CollectorTreeView({
      element: self.container,
      collector: element.collector,
      elementDblClick: self.elementDblClick,
      updateRequested: self.updateRequested,
      drawRequested: self.drawRequested,
      noHeader: false
    });
    this.collectorViews[element.collector] = collectorView;
  }
  else {
    collectorView = this.collectorViews[element.collector];
  }
  collectorView.addElement(element);
};

MultiCollectorTreeView.prototype.removeCollector = function(collector) {
  if(this.collectorViews.hasOwnProperty(collector)) {
    var collectorView = this.collectorViews[collector];
    this.container.removeChild(collectorView.container);
    delete this.collectorViews[collector];
  }
};


MultiCollectorTreeView.prototype.selectedElements = function(collector) {
  if(collector != undefined) {
    if(this.collectorViews.hasOwnProperty(collector)) {
      var collectorView = this.collectorViews[collector];
      return collectorView.selectedElements();
    }
    return [];
  }
  var selected = [];
  var collectors = Object.keys(this.collectorViews);
  for(var index = 0 ; index<collectors.length ; index++ ) {
    var localSelected = this.collectorViews[collectors[index]].selectedElements();
    selected = selected.concat(localSelected);
  }
  return selected;
};


MultiCollectorTreeView.prototype.unCheckAll = function(collector) {
  if(collector != undefined) {
    if(this.collectorViews.hasOwnProperty(collector)) {
      var collectorView = this.collectorViews[collector];
      collectorView.unCheckAll();
    }
    return;
  }
  var collectors = Object.keys(this.collectorViews);
  for(var index = 0 ; index<collectors.length ; index++ ) {
    this.collectorViews[collectors[index]].unCheckAll();
  }
};

MultiCollectorTreeView.prototype.removeElement = function(object) {
  if(this.collectorViews.hasOwnProperty(object.collector)) {
    var collectorView = this.collectorViews[collector];
    collectorView.removeElement(object);
  }
};

MultiCollectorTreeView.prototype.clear = function(collector) {
  if(collector != undefined) {
    this.removeCollector(collector);
    return;
  }
  var collectors = Object.keys(this.collectorViews);
  for(var index = 0 ; index<collectors.length ; index++ ) {
    this.removeCollector([collectors[index]]);
  }
};

//-----------------------------------------------------------

RootCanvas = function(object) {
  var self = this;
  this.element = document.createElement("null");
  this.closeEvent = new Event('close');
  this.container = document.createElement("div");
  this.container.classList.add("dqm4hep-root-canvas");
  this.monitorElement = null;
  object.parent.appendChild(this.container);
  this.dialog = $(this.container).dialog({
    width: 300,
    height: 200,
    position: {my: "left top", at: "left top", of: object.parent},
    resize: function(event, ui) {
      JSROOT.resize(self.container, {width: ui.size.width, height: ui.size.height});
    },
    close: function(event, ui) {
      self.element.dispatchEvent(self.closeEvent);
      if(self.monitorElement != null) {
        self.monitorElement.removeEventListener('update', self.handleMonitorElementUpdate);
      }
    },
    appendTo: object.parent
  });
  this.update(object.element, false);
  
  JSROOT.resize(this.container, true);
};

RootCanvas.prototype.handleMonitorElementUpdate = function(event) {
  this.update(event.element);
};

RootCanvas.prototype.addEventListener = function(type, listener, options) {
  this.element.addEventListener(type, listener, options);
};

RootCanvas.prototype.removeEventListener = function(type, listener, options) {
  this.element.removeEventListener(type, listener, options);
};

RootCanvas.prototype.update = function(element) {
  if(this.monitorElement != null) {
    this.monitorElement.removeEventListener('update', this.handleMonitorElementUpdate);
  }
  this.monitorElement = element;
  if(this.monitorElement != null) {
    this.monitorElement.addEventListener('update', this.handleMonitorElementUpdate);
  }
  var drawOption = "";
  var drawObject = null;
  if(this.monitorElement !== null && this.monitorElement.rootObject) {
    drawOption = this.monitorElement.rootObject.fDrawOption ? this.monitorElement.rootObject.fDrawOption : "";
    drawObject = this.monitorElement.rootObject;
    $(this.container).dialog("option", "title", "");
  }
  else {
    drawObject = JSROOT.Create("TPaveText");
    $(this.container).dialog("option", "title", this.monitorElement.name + " (" + this.monitorElement.module + ")");
  }
  JSROOT.redraw(this.container, drawObject, drawOption);      
  JSROOT.resize(this.container, true);
  JSROOT.RegisterForResize(this.container);
};

RootCanvas.prototype.close = function() {
  $(this.container).dialog("close");
}

//-----------------------------------------------------------


CanvasArea = function(container) {
  this.container = container;
  this.container.classList.add("dqm4hep-canvas-area-container");
  this.canvases = [];
};

CanvasArea.prototype.getCanvas = function(element) {
  if(!this.checkElement(element)) {
    return null;
  }
  for(var index=0 ; index<this.canvases.length ; index++) {
    var canvas = this.canvases[index];
    if(this.checkElement(canvas.monitorElement)) {
      continue;
    }
    if(element == canvas.monitorElement) {
      return canvas;
    }
    if(element.propertiesEquals(canvas.monitorElement)) {
      return canvas;
    }
  }
  return null;
};


CanvasArea.prototype.createCanvas = function(element) {
  var canvas = this.getCanvas(element);
  if(null == canvas) {
    canvas = new RootCanvas({
      parent: this.container,
      element: element
    });
    this.canvases.push(canvas);
  }
  return canvas;
};

CanvasArea.prototype.checkElement = function(element) {
  if(element === undefined || element === null) {
    return false;
  }
  if(element.name === undefined || element.name.length == 0) {
    return false;
  }
  if(element.path === undefined) {
    return false;
  }
  if(element.module === undefined || element.module.length == 0) {
    return false;
  }
  if(element.collector === undefined || element.collector.length == 0) {
    return false;
  }
  return true;
};

CanvasArea.prototype.isElementDrawn = function(element) {
  return (null == this.getCanvas(element));
};

CanvasArea.prototype.nCanvases = function() {
  return this.canvases.length;
};

CanvasArea.prototype.draw = function(element) {
  return this.createCanvas(element);
};

CanvasArea.prototype.clear = function() {
  console.log("N canvases to clear : " + this.canvases.length.toString());
  for(var index=0 ; index<this.canvases.length ; index++) {
    var canvas = this.canvases[index];
    canvas.close();
    delete canvas;
  }
  this.canvases = [];
};

//-----------------------------------------------------------

MultiCanvasView = function(container) {
  var self = this;
  this.container = container;
  this.tabsElement = document.createElement('ul');
  this.container.appendChild(this.tabsElement);
  this.guid = new UID();
  $(this.container).tabs({
    heightStyle: "fill"
  });
  this.initContextMenu = false;
}

MultiCanvasView.prototype.setCanvasAreaTitle = function(id, title) {
  if(id >= this.nCanvasAreas()) {
    return;
  }
  var tab = this.tabsElement.children[id];
  var span = tab.querySelector("a > span").innerHTML = title;
}

MultiCanvasView.prototype.createCanvasArea = function(title) {
  if(title === undefined) {
    title = "Canvas area";
  }
  
  // canvas area id
  var canvasId = this.guid.getUID();
  var canvasTabId = this.buildCanvasTabId(canvasId);
  
  // create the ul element
  var liElement = document.createElement('li');
  var anchorElement = document.createElement('a');
  var spanElement = document.createElement('span');
  spanElement.innerHTML = title;
  anchorElement.appendChild(spanElement);
  liElement.appendChild(anchorElement);
  anchorElement.href = "#" + canvasTabId;
  $(anchorElement).data('tabElement', liElement);
  this.tabsElement.appendChild(liElement);
  
  // create the tab element
  var tabElement = document.createElement('div');
  tabElement.id = canvasTabId;
  var canvasArea = new CanvasArea(tabElement);
  $(tabElement).data('canvasArea', canvasArea);
  this.container.appendChild(tabElement);
  $(anchorElement).data('canvasArea', canvasArea);
  
  // refresh
  $(this.container).tabs("refresh");
  $(this.container).tabs("option", "active", canvasId);
  
  // create context menus if not
  if(!this.initContextMenu) {
    // $(document).contextmenu(this.contextMenuData(".ui-tabs"));  
    $(document).contextmenu(this.contextMenuData(".ui-tabs"));
    // $(document).contextmenu(this.contextMenuData(".ui-tabs-nav"));
    // $(document).contextmenu(this.contextMenuData("a.ui-tabs-anchor"));
  }
  return canvasArea;
}

MultiCanvasView.prototype.getCanvasAreaByIndex = function(index) {
  if(index < 0 || index >= this.nCanvasAreas()) {
    return null;
  }
  var tab = this.container.children[index+1];
  return $(tab).data('canvasArea');
}

MultiCanvasView.prototype.buildCanvasTabId = function(index) {
  return "canvas-area-tab-id-" + index.toString();
}

MultiCanvasView.prototype.nCanvasAreas = function() {
  return this.tabsElement.children.length;
}

MultiCanvasView.prototype.currentCanvasArea = function() {
  if(this.nCanvasAreas() > 0) {
    var canvasId = $(this.container).tabs("option", "active");
    // +1 because at 0 we have the list of tabs in a <ul> element
    // Real tab div ids start at 1
    var canvasElement = this.container.children[canvasId+1];
    console.log(canvasElement);
    return $(canvasElement).data('canvasArea');
  }
  return null;
}

MultiCanvasView.prototype.closeTab = function(closeIndex) {
  if(closeIndex === undefined || closeIndex < 0 || closeIndex >= this.nCanvasAreas()) {
    return;
  }
  var tabElement = this.tabsElement.querySelectorAll("li")[closeIndex];
  var canvasElement = this.container.children[closeIndex+1];
  var canvasArea = $(canvasElement).data('canvasArea');
  canvasArea.clear();
  this.tabsElement.removeChild(tabElement);
  this.container.removeChild(canvasElement);
  $(this.container).tabs("refresh");
  if(this.nCanvasAreas() == 0) {
    this.createCanvasArea();
  }
}

MultiCanvasView.prototype.closeAll = function(exceptId) {
  var tabElements = this.tabsElement.querySelectorAll("li");
  var exceptTabElement = null;
  var exceptCanvasElement = null;
  var exceptCanvasArea = null;
  
  for(var index=0 ; index<tabElements.length ; index++) {
    
    var tabElement = tabElements[index];
    var canvasElement = this.container.children[index+1];
    var canvasArea = $(canvasElement).data('canvasArea');
    
    if(exceptId !== undefined && exceptId == index) {
      exceptTabElement = tabElement;
      exceptCanvasElement = canvasElement;
      exceptCanvasArea = canvasArea;
      continue;
    }
    
    canvasArea.clear();
  }
  
  if(exceptTabElement != null) {
    // close all except one
    // close all and restore initial state with one canvas area
    while (this.tabsElement.firstChild) {
      this.tabsElement.removeChild(this.tabsElement.firstChild);
    }
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    this.container.appendChild(this.tabsElement);
    this.container.appendChild(exceptCanvasElement);
    this.tabsElement.appendChild(exceptTabElement);
    $(this.container).tabs("refresh");
  }
  else {
    // close all and restore initial state with one canvas area
    while (this.tabsElement.firstChild) {
      this.tabsElement.removeChild(this.tabsElement.firstChild);
    }
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    this.container.appendChild(this.tabsElement);
    this.createCanvasArea();    
  }
}

MultiCanvasView.prototype.contextMenuData = function(delegate) {
  var self = this;
  return {
    delegate: delegate,
    menu: [
      {title: "Close area", cmd: "close"},
      {title: "Close all areas", cmd: "closeAll"},
      {title: "Close others areas", cmd: "closeOthers"},
      {title: "-----"},
      {title: "Rename area", cmd: "rename"},
      {title: "New area", cmd: "new"},
      {title: "Clear area", cmd: "clear"}
    ],
    select: function(event, ui) {
      var target = ui.target[0];
      if(ui.cmd == "rename") {
        var reply = prompt("Canvas area name:");
        if(null != reply && reply.trim().length > 0) {
          var newName = reply.trim();
          // right click on the tab directly
          if(target.nodeName.toLowerCase() == "span") {
            target.innerHTML = newName;
          }
          // any other place means the current canvas id
          else {
            var currentId = $(self.container).tabs("option", "active");
            self.setCanvasAreaTitle(currentId, newName);
          }
        }
      }
      if(ui.cmd == "new") {
        self.createCanvasArea();
      }
      if(ui.cmd == "clear") {
        // right click on the tab directly
        if(target.nodeName.toLowerCase() == "span") {
          var index = self.tabsElement.children.indexOf(target.parentElement.parentElement);
          var canvasArea = self.getCanvasAreaByIndex(index);
          if(canvasArea != null) {
            canvasArea.clear();
          }
        }
        // any other place means the current canvas id
        else {
          var current = self.currentCanvasArea();
          if(null != current) {
            console.log("clear current canvas area !");
            current.clear();
          }
        }
      }
      else if(ui.cmd == "close") {
        var index = -1;
        // right click on the tab directly
        if(target.nodeName.toLowerCase() == "span") {
          var element = target.parentElement.parentElement;
          if(element === undefined) {
            return;
          }
          var counting = 0;
          while( (element = element.previousSibling) != null ) {
            counting++;
          }
          index = counting;
        }
        else {
          index = $(self.container).tabs("option", "active");
        }
        self.closeTab(index);
      }
      else if(ui.cmd == "closeAll") {
        self.closeAll();
      }
      else if(ui.cmd == "closeOthers") {
        // right click on the tab directly
        if(target.nodeName.toLowerCase() == "span") {
          var element = target.parentElement.parentElement;
          if(element === undefined) {
            return;
          }
          var index = 0;
          while( (element = element.previousSibling) != null ) {
            index++;
          }
          console.log("closeOthers : index is " + index.toString());
          self.closeAll(index);
        }
        // any other place means the current canvas id
        else {
          var currentId = $(self.container).tabs("option", "active");
          self.closeAll(currentId);
        }
      }
    }
  };
}

//-----------------------------------------------------------

DataTable = function(data) {
  // ui
  var filterElement = document.createElement('input');
  filterElement.classList.add("dqm4hep-datatable-filter");
  filterElement.type = "text";
  filterElement.placeholder = "Filter";
  
  var tableElement = document.createElement('table');
  var dummyInput = document.createElement('input');
  dummyInput.style.display = "none";
  dummyInput.addEventListener('keydown', function(evt) {
    console.log('evt.key is ' + evt.key);
  });
  tableElement.appendChild(dummyInput);
  tableElement.classList.add("dqm4hep-datatable");
  var theadElement = document.createElement('thead');

  tableElement.appendChild(theadElement);
  var tbodyElement = document.createElement('tbody');
  tbodyElement.addEventListener('onclick', function() {
    dummyInput.focus();
    console.log('set focus !');
  });
  tableElement.appendChild(tbodyElement);
  var trtheadElement = document.createElement('tr');
  theadElement.appendChild(trtheadElement);
  
  var width = 100. / data.headerLabels.length;
  
  var setHeaderLabels = function(labels) {
    while(trtheadElement.firstChild) {
      trtheadElement.removeChild(trtheadElement.firstChild);
    }
    for(var index=0 ; index<labels.length ; index++) {
      var headerLabel = document.createElement('td');
      headerLabel.innerHTML = labels[index];
      headerLabel.style.width = width.toString() + "%";
      trtheadElement.appendChild(headerLabel);
    }
  };
  
  this.addRow = function(row) {
    var tableRow = document.createElement('tr');
    $(tableRow).dblclick(function() {
      var checkbox = tableRow.firstChild.firstChild;
      checkbox.checked = ! checkbox.checked;
    });
    $(tableRow).click(function() {
      dummyInput.focus();
      console.log('set focus !');
    });
    tbodyElement.appendChild(tableRow);
    for(var index=0 ; index<row.length ; index++) {
      var rowData = document.createElement('td');
      if(index == 0) {
        var checkbox = document.createElement('input');
        checkbox.type = "checkbox";
        rowData.appendChild(checkbox);
        var text = document.createTextNode(row[index]);
        rowData.appendChild(text);
      }
      else {
        rowData.innerHTML = row[index];
      }
      
      rowData.style.width = width.toString() + "%";
      tableRow.appendChild(rowData);
    }
  }
  
  this.removeRow = function(index) {
    var rows = tbodyElement.querySelectorAll('tr');
    if(rows.length >= index) {
      return;
    }
    var row = rows[index];
    tbodyElement.removeChild(row);
  };
  
  data.parent.appendChild(filterElement);
  data.parent.appendChild(tableElement);
  setHeaderLabels(data.headerLabels);
  
  filterElement.onkeyup = function() {
    var filter = filterElement.value.toUpperCase();
    var tr = tbodyElement.getElementsByTagName('tr');
    for(var index=0 ; index<tr.length ; index++) {
      var currentTr = tr[index];
      var td = currentTr.getElementsByTagName('td');
      if(td) {
        for(var index2=0 ; index2<td.length ; index2++) {
          var currentTd = td[index2];
          var textString = currentTd.innerText;
          var found = textString.toUpperCase().indexOf(filter);
          if(found > -1) {
            currentTr.style.display = "";
            break;
          }
          else {
            currentTr.style.display = "none";
          }
        }
      }
    }
  };
  

}


Browser = function(parent) {
  this.parent = parent;
  this.container = document.createElement('div');
  this.container.classList.add('dqm4hep-browser-container');
  this.parent.appendChild(this.container);
  
  // The connexion area
  var connectionContainer = document.createElement('fieldset');
  connectionContainer.classList.add('dqm4hep-browser-connect');
  var connectionLegend = document.createElement('legend');
  connectionLegend.innerHTML = "Connexion";
  connectionContainer.appendChild(connectionLegend);
  
  // "Host" label
  var connectionHostLabel = document.createElement('p');
  connectionHostLabel.innerHTML = "Host: ";
  connectionContainer.appendChild(connectionHostLabel);
  // host input text
  var connectionHostInput = document.createElement('input');
  connectionHostInput.innerHTML = "localhost";
  connectionContainer.appendChild(connectionHostInput);
  
  // "Port" label
  var connectionPortLabel = document.createElement('p');
  connectionPortLabel.innerHTML = "Port: ";
  connectionContainer.appendChild(connectionPortLabel);
  // Port text input
  var connectionPortInput = document.createElement('input');
  connectionPortInput.type = "number";
  connectionPortInput.min = 0;
  connectionPortInput.max = 65535;
  connectionPortInput.pattern = '/^\d+$/';
  connectionPortInput.value = "0";
  connectionContainer.appendChild(connectionPortInput);
  
  // connect button
  var connectionConnectButton = document.createElement('button');
  connectionConnectButton.innerHTML = "Connect";
  connectionContainer.appendChild(connectionConnectButton);
  this.container.appendChild(connectionContainer);
  
  // The search option area
  var tableContainer = document.createElement('fieldset');
  tableContainer.classList.add('dqm4hep-browser-table');
  var tableLegend = document.createElement('legend');
  tableLegend.innerHTML = "Search result";
  tableContainer.appendChild(tableLegend);
  
  var datatable = new DataTable({
    parent: tableContainer,
    headerLabels: ["Module", "Path", "Name", "Type"]
  });
  // 
  this.container.appendChild(tableContainer);

  var buttonsContainer = document.createElement('div');
  buttonsContainer.classList.add('dqm4hep-browser-buttons');
  var replaceButton = document.createElement('button');
  replaceButton.innerHTML = "Replace";
  buttonsContainer.appendChild(replaceButton);
  var appendButton = document.createElement('button');
  appendButton.innerHTML = "Append";
  buttonsContainer.appendChild(appendButton);
  var closeButton = document.createElement('button');
  closeButton.innerHTML = "Close";
  buttonsContainer.appendChild(closeButton);
  tableContainer.appendChild(buttonsContainer);
  
  var addRow = function(mod, path, name, type) {
    datatable.addRow([mod, path, name, type]);
  }
  
  addRow("BeamAnalysis", "/", "SpotXY", "TH2F");
  addRow("BeamAnalysis", "/", "TrigTime", "TH1F");
  addRow("BeamAnalysis", "/", "PartRate", "TH1F");
  addRow("SlowControl", "/Sensors", "Temperature", "TDynamicGraph");
  addRow("SlowControl", "/Sensors", "Pressure", "TDynamicGraph");
  addRow("BeamAnalysis", "/", "SpotXY", "TH2F");
  addRow("BeamAnalysis", "/", "TrigTime", "TH1F");
  addRow("BeamAnalysis", "/", "PartRate", "TH1F");
  addRow("SlowControl", "/Sensors", "Temperature", "TDynamicGraph");
  addRow("SlowControl", "/Sensors", "Pressure", "TDynamicGraph");
  addRow("BeamAnalysis", "/", "SpotXY", "TH2F");
  addRow("BeamAnalysis", "/", "TrigTime", "TH1F");
  addRow("BeamAnalysis", "/", "PartRate", "TH1F");
  // addRow("SlowControl", "/Sensors", "Temperature", "TDynamicGraph");
  // addRow("SlowControl", "/Sensors", "Pressure", "TDynamicGraph");
  // addRow("BeamAnalysis", "/", "PartRate", "TH1F");
  // addRow("SlowControl", "/Sensors", "Temperature", "TDynamicGraph");
  // addRow("SlowControl", "/Sensors", "Pressure", "TDynamicGraph");
  // addRow("BeamAnalysis", "/", "PartRate", "TH1F");
  // addRow("SlowControl", "/Sensors", "Temperature", "TDynamicGraph");
  // addRow("SlowControl", "/Sensors", "Pressure", "TDynamicGraph");
}








