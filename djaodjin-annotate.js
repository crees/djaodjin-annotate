/*
djaodjin-annotate.js v0.0.4
Copyright (c) 2015, Djaodjin Inc.
MIT License
*/
/* global document jQuery Image window:true*/

(function($) {
  'use strict';
  /**
   * Function to annotate the image
   * @param {[type]} el      [description]
   * @param {Object} options [description]
   */
  function Annotate(el, options) {
    this.options = options;
    this.$el = $(el);
    this.clicked = false;
    this.fromx = null;
    this.fromy = null;
    this.fromxText = null;
    this.fromyText = null;
    this.tox = null;
    this.toy = null;
    this.points = [];
    this.storedUndo = [];
    this.storedElement = [];
    this.images = [];
    this.img = null;
    this.selectedImage = null;
    this.currentWidth = null;
    this.currentHeight = null;
    this.selectImageSize = {};
    this.compensationWidthRate = 1;
    this.linewidth = 1;
    this.fontsize = 1;
    this.init();
  }
  Annotate.prototype = {
    init: function() {
      var self = this;
      self.linewidth = self.options.linewidth;
      self.fontsize = self.options.fontsize;
      self.$el.addClass('annotate-container');
      self.$el.css({
        cursor: 'crosshair'
      });
      self.baseLayerId = 'baseLayer_' + self.$el.attr('id');
      self.drawingLayerId = 'drawingLayer_' + self.$el.attr('id');
      self.toolOptionId = 'tool_option_' + self.$el.attr('id');
      self.$el.append($('<canvas id="' + self.baseLayerId + '"></canvas>'));
      self.$el.append($('<canvas id="' + self.drawingLayerId +
        '"></canvas>'));
      self.baseCanvas = document.getElementById(self.baseLayerId);
      self.drawingCanvas = document.getElementById(self.drawingLayerId);
      self.baseContext = self.baseCanvas.getContext('2d');
      self.drawingContext = self.drawingCanvas.getContext('2d');
      self.baseContext.lineJoin = 'round';
      self.drawingContext.lineJoin = 'round';
      var classPosition1 = 'btn-group';
      var classPosition2 = '';
      var style = '';
      if (self.options.position === 'left' || self.options.position ===
        'right' || self.options.position === 'vertical') {
        classPosition1 = 'btn-group-vertical';
        classPosition2 = 'btn-block';
        style = ' style="margin-bottom: 0;"' ;
      }
      if (self.options.bootstrap) {
    	self.$tool = '<div id="" class="btn-group" role="group" >' +
        	'<div class="' + classPosition1 + '"' + style + ' data-toggle="buttons">';
    	for (var i = 0; i < self.options.tools.length; i++) {
    		switch (self.options.tools[i]) {
    		case 'undo':
		        self.$tool += '<button id="undoaction" title="Undo the last annotation"' +
		          ' class="btn btn-primary ' + classPosition2 +
		          ' annotate-undo">' +
		          ' <span class="fa fa-undo"></span></button>';
		        break;
    		case 'unselect':
				self.$tool += '<label class="btn btn-danger active"' + style + '>' +
				  '<input type="radio" name="' + self.toolOptionId +
				  '" data-tool="null"' +
				  ' data-toggle="tooltip" data-placement="top"' +
				  ' title="No tool selected">' +
				  '<span class="fa fa-ban"></span>' +
				  '</label>';
				break;
    		case 'rectangle':
		        self.$tool += '<label class="btn btn-primary active"' + style + '>' +
		          '<input type="radio" name="' + self.toolOptionId +
		          '" data-tool="rectangle"' +
		          ' data-toggle="tooltip" data-placement="top"' +
		          ' title="Draw an rectangle">' +
		          ' <span class="fa fa-square"></span>' +
		          '</label>';
		        break;
    		case 'rectangle-filled':
		        self.$tool += '<label class="btn btn-primary active"' + style + '>' +
		          '<input type="radio" name="' + self.toolOptionId +
		          '" data-tool="rectangle-filled"' +
		          ' data-toggle="tooltip" data-placement="top"' +
		          ' title="Draw a filled rectangle (for erasing)">' +
		          ' <span class="fas fa-square"></span>' +
		          '</label>';
		        break;
    		case 'circle':
		        self.$tool += '<label class="btn btn-primary"' + style + '>' +
		          '<input type="radio" name="' + self.toolOptionId +
		          '" data-tool="circle"' +
		          ' data-toggle="tooltip"' +
		          'data-placement="top" title="Draw a circle">' +
		          ' <span class="fa fa-circle-o"></span>' +
		          '</label>';
		        break;
    		case 'text':
		        self.$tool += '<label class="btn btn-primary"' + style + '>' +
		          '<input type="radio" name="' + self.toolOptionId +
		          '" data-tool="text"' +
		          ' data-toggle="tooltip"' +
		          'data-placement="top" title="Write some text">' +
		          ' <span class="fa fa-font"></span></label>';
		        break;
    		case 'arrow':
		          self.$tool += '<label class="btn btn-primary"' + style + '>' +
		          '<input type="radio" name="' + self.toolOptionId +
		          '" data-tool="arrow"' +
		          ' data-toggle="tooltip" data-placement="top" title="Draw an arrow"' + style + '>' +
		          ' <span class="fa fa-arrow-up"></span></label>';
		          break;
    		case 'pen':
		          self.$tool += '<label class="btn btn-primary"' + style + '>' +
		          '<input type="radio" name="' + self.toolOptionId +
		          '" data-tool="pen"' +
		          ' data-toggle="tooltip" data-placement="top" title="Pen Tool">' +
		          ' <span class="fa fa-paint-brush"></span></label>';
		          break;
    		case 'redo':
		          self.$tool += '<button type="button" id="redoaction"' +
		          ' title="Redo the last undone annotation"' +
		          'class="btn btn-primary ' + classPosition2 + ' annotate-redo">' +
		          '<span class="fa fa-redo"></span></button>';
		          break;
    		case 'tick':
		          self.$tool += '<label class="btn btn-primary"' + style + '>' +
		          '<input type="radio" name="' + self.toolOptionId +
		          '" data-tool="tick"' +
		          ' data-toggle="tooltip" data-placement="top" title="Tick Tool">' +
		          ' <span class="fa fa-check"></span></label>';
		          break;
    		case 'cross':
		          self.$tool += '<label class="btn btn-primary"' + style + '>' +
		          '<input type="radio" name="' + self.toolOptionId +
		          '" data-tool="cross"' +
		          ' data-toggle="tooltip" data-placement="top" title="X Tool">' +
		          ' <span class="fas fa-times"></span></label>';
		          break;
    		default:
    			  if (String(self.options.tools[i]).startsWith('stamp_')) {
    				  self.$tool += '<label class="btn btn-primary"' + style + '>' +
    		          '<input type="radio" name="' + self.toolOptionId +
    		          '" data-tool="' + self.options.tools[i] + '"' +
    		          ' data-toggle="tooltip" data-placement="top" title="' + self.options.tools[i] + ' Tool">' +
    		          String(self.options.tools[i]).substr(6) + '</label>';
    			  }
    			  break;
    		}
	    }
        self.$tool += '</div></div>';
      } else {
        self.$tool = '<div id="" style="display:inline-block">';
      	for (var i = 0; i < self.options.tools.length; i++) {
    		switch (self.options.tools[i]) {
    		case 'undo':
    			self.$tool += '<button id="undoaction">UNDO</button>';
    			break;
    		case 'unselect':
    			self.$tool += '<input type="radio" name="' + self.toolOptionId +
		            '" data-tool="null">NO TOOL SELECTED';
    			break;
    		case 'rectangle':
		        self.$tool += '<input type="radio" name="' + self.toolOptionId +
		          '" data-tool="rectangle" checked>RECTANGLE';
		        break;
    		case 'rectangle-filled':
		        self.$tool += '<input type="radio" name="' + self.toolOptionId +
		          '" data-tool="rectangle-filled" checked>FILLED RECTANGLE';
		        break;
    		case 'circle':
		        self.$tool += '<input type="radio" name="' + self.toolOptionId +
		          '" data-tool="circle">CIRCLE';
		        break;
    		case 'text':
    			self.$tool += '<input type="radio" name="' +
    				self.toolOptionId + '" data-tool="text"> TEXT';
    			break;
    		case 'arrow':
				self.$tool += '<input type="radio" name="' + self.toolOptionId +
					'" data-tool="arrow">ARROW';
				break;
    		case 'pen':
				self.$tool += '<input type="radio" name="' + self.toolOptionId +
					'" data-tool="pen">PEN';
				break;
    		case 'redo':
    			self.$tool += '<button id="redoaction"' +
    				'title="Redo the last undone annotation">REDO</button>';
    			 break;
    		}
      	}
        self.$tool += '</div>';
      }
      self.$tool = $(self.$tool);
      if (!self.options.toolbarContainer) {
    	  self.options.toolbarContainer = '.annotate-container';
      }
      $(self.options.toolbarContainer).append(self.$tool);
      var canvasPosition = self.$el.offset();
      if (!self.options.bootstrap) {
    	  self.options.position = 'top';
      }
      switch (self.options.position) {
      default:
      case 'top':
        self.$tool.css({
          position: 'relative',
          top: -35,
          left: 0,
        });
        break;
      case 'top-inside': case 'vertical':
    	// This means the bar will be 'sunk' into the top of the image.
    	// Use this when you've redefined toolbarContainer to put it elsewhere.
    	self.$tool.css({
    	  position: 'relative',
    	  top: 0,
    	});
    	break;
      case 'left':
        self.$tool.css({
          position: 'absolute',
          top: canvasPosition.top - 35,
          left: canvasPosition.left - 20
        });
        break;
      case 'right':
        self.$tool.css({
          position: 'absolute',
          top: 35 + "px",
          right: -72 + "px"
        });
        break;
      case 'bottom':
        self.$tool.css({
          position: 'absolute',
          top: canvasPosition.top + self.baseCanvas.height + 35,
          left: canvasPosition.left
        });
        break;
      }
      self.$textbox = $('<textarea id=""' +
        ' style="position:absolute;z-index:100000;display:none;top:0;left:0;' +
        'background:transparent;border:1px dotted; line-height:' + self.options.lineheight + 'px;' +
        ';font-size:' + self.fontsize +
        ';font-family:sans-serif;color:' + self.options.color +
        ';word-wrap: break-word;outline-width: 0;overflow: hidden;' +
        'padding:0px;resize: both;"></textarea>');
      $('body').append(self.$textbox);
      if (self.options.images) {
        self.initBackgroundImages();
      } else {
        if (!self.options.width && !self.options.height) {
          self.options.width = 640;
          self.options.height = 480;
        }
        self.baseCanvas.width = self.drawingCanvas.width = self.options.width;
        self.baseCanvas.height = self.drawingCanvas.height = self.options
          .height;
      }
      self.$tool.on('change', 'input[name^="tool_option"]', function() {
        self.selectTool($(this));
      });
      $('[data-tool="' + self.options.type + '"]').trigger('click');
      self.$tool.on('click', '.annotate-redo', function(event) {
        self.redoaction(event);
      });
      self.$tool.on('click', '.annotate-undo', function(event) {
        self.undoaction(event);
      });
      $(document).on(self.options.selectEvent, '.annotate-image-select',
        function(event) {
          event.preventDefault();
          var image = self.selectBackgroundImage($(this).attr(self.options
            .idAttribute));
          self.setBackgroundImage(image);
        });
      $('#' + self.drawingLayerId).on('mousedown', function(
        event) {
      	if (self.usesTouch === undefined) {
        	self.annotatestart(event);
    	}
      });
      $('#' + self.drawingLayerId).on('touchstart', function(
        event) {
      	self.usesTouch = true;
        self.annotatestart(event);
      });
      $('#' + self.drawingLayerId).on('mouseup touchend', function(event) {
        self.annotatestop(event);
      });
      // https://developer.mozilla.org/en-US/docs/Web/Events/touchleave
      $('#' + self.drawingLayerId).on('mouseleave touchleave', function(
        event) {
        self.annotateleave(event);
      });
      $('#' + self.drawingLayerId).on('mousemove touchmove', function(
        event) {
        self.annotatemove(event);
      });
      $(window).on('resize', function() {
        self.annotateresize();
      });
      self.checkUndoRedo();
    },
    generateId: function(length) {
      var chars =
        '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split(
          '');
      var charsLen = chars.length;
      if (!length) {
        length = Math.floor(Math.random() * charsLen);
      }
      var str = '';
      for (var i = 0; i < length; i++) {
        str += chars[Math.floor(Math.random() * charsLen)];
      }
      return str;
    },
    addElements: function(newStoredElements, set, callback)
    {
      var self = this; 
      this.storedElement = newStoredElements; 
      //console.log('DJ: Adding new annotations'); 
      self.clear();
      self.redraw();
      
    },    
    pushImage: function(newImage, set, callback) {
      var self = this;
      var id = null;
      var path = null;
      if (typeof newImage === 'object') {
        id = newImage.id;
        path = newImage.path;
      } else {
        id = newImage;
        path = newImage;
      }
      if (id === '' || typeof id === 'undefined' || self.selectBackgroundImage(
          id)) {
        id = self.generateId(10);
        while (self.selectBackgroundImage(id)) {
          id = self.generateId(10);
        }
      }
      var image = {
        id: id,
        path: path,
        storedUndo: [],
        storedElement: []
      };
      self.images.push(image);
      if (set) {
        self.setBackgroundImage(image);
      }
      if (callback) {
        callback({
          id: image.id,
          path: image.path
        });
      }
      self.$el.trigger('annotate-image-added', [
        image.id,
        image.path
      ]);
    },
    initBackgroundImages: function() {
      var self = this;
      $.each(self.options.images, function(index, image) {
        var set = false;
        if (index === 0) {
          set = true;
        }
        self.pushImage(image, set);
      });
    },
    selectBackgroundImage: function(id) {
      var self = this;
      var image = $.grep(self.images, function(element) {
        return element.id === id;
      })[0];
      return image;
    },
    setBackgroundImage: function(image) {
      var self = this;
      if (self.$textbox.is(':visible')) {
        self.pushText();
      }
      var currentImage = self.selectBackgroundImage(self.selectedImage);
      if (currentImage) {
        currentImage.storedElement = self.storedElement;
        currentImage.storedUndo = self.storedUndo;
      }
      self.img = new Image();
      self.img.src = image.path;
      self.img.onload = function() {
        if ((self.options.width && self.options.height) == undefined ||
          (self.options.width && self.options.height) == 0) {
          self.currentWidth = this.width;
          self.currentHeight = this.height;
          self.selectImageSize.width = this.width;
          self.selectImageSize.height = this.height;
        } else {
          self.currentWidth = self.options.width;
          self.currentHeight = self.options.height;
          self.selectImageSize.width = self.options.width;
          self.selectImageSize.height = self.options.height;
        }
        self.baseCanvas.width = self.drawingCanvas.width = self.currentWidth;
        self.baseCanvas.height = self.drawingCanvas.height = self.currentHeight;
        self.baseContext.drawImage(self.img, 0, 0, self.currentWidth,
          self.currentHeight);
        self.$el.css({
          height: self.currentHeight,
          width: self.currentWidth
        });
        self.storedElement = image.storedElement;
        self.storedUndo = image.storedUndo;
        self.selectedImage = image.id;
        self.checkUndoRedo();
        self.clear();
        self.redraw();
        self.annotateresize();
      };
    },
    checkUndoRedo: function() {
      var self = this;
      self.$tool.children('.annotate-redo').attr('disabled', self.storedUndo
        .length === 0);
      self.$tool.children('.annotate-undo').attr('disabled', self.storedElement
        .length === 0);
    },
    undoaction: function(event) {
      event.preventDefault();
      var self = this;
      self.storedUndo.push(self.storedElement[self.storedElement.length -
        1]);
      self.storedElement.pop();
      self.checkUndoRedo();
      self.clear();
      self.redraw();
    },
    redoaction: function(event) {
      event.preventDefault();
      var self = this;
      if (self.storedUndo.length > 0) {
	      self.storedElement.push(self.storedUndo[self.storedUndo.length - 1]);
	      self.storedUndo.pop();
	      self.checkUndoRedo();
	      self.clear();
	      self.redraw();
      }
    },
    redraw: function() {
      var self = this;
      self.baseCanvas.width = self.baseCanvas.width;
      if (self.options.images) {
        self.baseContext.drawImage(self.img, 0, 0, self.currentWidth,
          self.currentHeight);
      }
      if (self.storedElement.length === 0) {
        return;
      }
      // clear each stored line
      for (var i = 0; i < self.storedElement.length; i++) {
        var element = self.storedElement[i];

        switch (element.type) {
          case 'rectangle':
            self.drawRectangle(self.baseContext, element.fromx, element.fromy,
              element.tox, element.toy);
            break;
          case 'rectangle-filled':
            self.drawRectangleFilled(self.baseContext, element.fromx, element.fromy,
              element.tox, element.toy);
            break;
          case 'arrow':
            self.drawArrow(self.baseContext, element.fromx, element.fromy,
              element.tox, element.toy);
            break;
          case 'pen':
            for (var b = 0; b < element.points.length - 1; b++) {
              var fromx = element.points[b][0];
              var fromy = element.points[b][1];
              var tox = element.points[b + 1][0];
              var toy = element.points[b + 1][1];
              self.drawPen(self.baseContext, fromx, fromy, tox, toy);
            }
            break;
          case 'text':
            self.drawText(self.baseContext, element.text, element.fromx,
              element.fromy, element.maxwidth);
            break;
          case 'circle':
            self.drawCircle(self.baseContext, element.fromx, element.fromy,
              element.tox, element.toy);
            break;
          case 'cross':
          case 'tick':
          	self.drawStamp(self.baseContext, element.type, element.fromx, element.fromy);
           	break;
          default:
          	if (String(element.type).startsWith('stamp_')) {
          		self.drawStamp(self.baseContext, String(element.type).substr(6), element.fromx, element.fromy);
               	break;
          	}
        }
      }
    },
    clear: function() {
      var self = this;
      // Clear Canvas
      self.drawingCanvas.width = self.drawingCanvas.width;
    },
    drawRectangle: function(context, x, y, w, h) {
      var self = this;
      context.beginPath();
      context.rect(x, y, w, h);
      context.fillStyle = 'transparent';
      context.fill();
      context.lineWidth = self.linewidth;
      context.strokeStyle = self.options.color;
      context.stroke();
    },
    drawRectangleFilled: function(context, x, y, w, h) {
        var self = this;
        context.beginPath();
        context.rect(x, y, w, h);
        context.fillStyle = '#FFFFFF';
        context.fill();
        context.lineWidth = self.linewidth;
        context.strokeStyle = '#FFFFFF';
        context.stroke();
    },
    drawCircle: function(context, x1, y1, x2, y2) {
      var radiusX = (x2 - x1) * 0.5;
      var radiusY = (y2 - y1) * 0.5;
      var centerX = x1 + radiusX;
      var centerY = y1 + radiusY;
      var step = 0.05;
      var a = step;
      var pi2 = Math.PI * 2 - step;
      var self = this;
      context.beginPath();
      context.moveTo(centerX + radiusX * Math.cos(0), centerY + radiusY *
        Math.sin(0));
      for (; a < pi2; a += step) {
        context.lineTo(centerX + radiusX * Math.cos(a), centerY + radiusY *
          Math.sin(a));
      }
      context.lineWidth = self.linewidth;
      context.strokeStyle = self.options.color;
      context.closePath();
      context.stroke();
    },
    drawStamp: function(context, type, x, y) {
        switch (type) {
        case 'tick':
        	var char = String.fromCharCode(parseInt('2713', 16));
        	break;
        case 'cross':
        	var char = String.fromCharCode(parseInt('D7', 16));
        	break;
        default:
        	var char = type;
        	break;
        }
    	context.font = this.fontsize + ' sans-serif';
        context.textBaseline = 'top';
        context.fillStyle = self.options.color;
        var offset = parseInt(this.fontsize.replace(/\D+/g, ''))/2;
    	context.fillText(char, x - offset/1.41, y - offset);
    },
    drawArrow: function(context, x, y, w, h) {
      var self = this;
      var angle = Math.atan2(h - y, w - x);
      context.beginPath();
      context.lineWidth = self.linewidth;
      context.moveTo(x, y);
      context.lineTo(w, h);
      context.moveTo(w - self.linewidth * 5 * Math.cos(angle + Math.PI /
        6), h - self.linewidth * 5 * Math.sin(angle + Math.PI / 6));
      context.lineTo(w, h);
      context.lineTo(w - self.linewidth * 5 * Math.cos(angle - Math.PI /
        6), h - self.linewidth * 5 * Math.sin(angle - Math.PI / 6));
      context.strokeStyle = self.options.color;
      context.stroke();
    },
    drawPen: function(context, fromx, fromy, tox, toy) {
      var self = this;
      context.lineWidth = self.linewidth;
      context.moveTo(fromx, fromy);
      context.lineTo(tox, toy);
      context.strokeStyle = self.options.color;
      context.stroke();
    },
    wrapText: function(drawingContext, text, x, y, maxWidth, lineHeight) {
      var lines = text.split('\n');
      for (var i = 0; i < lines.length; i++) {
        var words = lines[i].split(' ');
        var line = '';
        for (var n = 0; n < words.length; n++) {
          var testLine = line + words[n] + ' ';
          var metrics = drawingContext.measureText(testLine);
          var testWidth = metrics.width;
          if (testWidth > maxWidth && n > 0) {
            drawingContext.fillText(line, x, y);
            y += lineHeight;
            line = words[n] + ' ';
          } else {
            line = testLine;
          }
        }
        drawingContext.fillText(line, x, y);
        y += lineHeight;
      }
    },
    drawText: function(context, text, x, y, maxWidth) {
      var self = this;
      context.font = self.fontsize + ' sans-serif';
      context.textBaseline = 'top';
      context.fillStyle = self.options.color;
      self.wrapText(context, text, x + 3, y + 4, maxWidth, self.options.lineheight);
    },
    pushText: function() {
      var self = this;
      var text = self.$textbox.val();
      self.$textbox.val('').hide();
      if (text) {
        self.storedElement.push({
          type: 'text',
          text: text,
          fromx: self.fromx,
          fromy: self.fromy,
          maxwidth: parseInt(self.$textbox[0].style.width.replace(/\D/g,'')) - 12,
        });
        if (self.storedUndo.length > 0) {
          self.storedUndo = [];
        }
      }
      self.checkUndoRedo();
      self.redraw();
    },
    // Events
    selectTool: function(element) {
      var self = this;
      self.options.type = element.data('tool');
      if (self.$textbox.is(':visible')) {
        self.pushText();
      }
    },
    annotatestart: function(event) {
      var self = this;
      self.clicked = true;
      if (self.options.onAnnotate !== undefined) {
    	  self.options.onAnnotate(self.options.type);
      }
      var offset = self.$el.offset();
      if (self.$textbox.is(':visible')) {
        var text = self.$textbox.val();
        self.$textbox.val('').hide();
        if (text !== '') {
          if (!self.tox) {
            self.tox = 100;
          }
          self.storedElement.push({
            type: 'text',
            text: text,
            fromx: (self.fromxText - offset.left) * self.compensationWidthRate,
            fromy: (self.fromyText - offset.top) * self.compensationWidthRate,
            maxwidth: parseInt(self.$textbox[0].style.width.replace(/\D/g,'')) - 12,
          });
          if (self.storedUndo.length > 0) {
            self.storedUndo = [];
          }
        }
        self.checkUndoRedo();
        self.redraw();
        self.clear();
      }
      self.tox = null;
      self.toy = null;
      self.points = [];
      var pageX = event.pageX || event.originalEvent.touches[0].pageX;
      var pageY = event.pageY || event.originalEvent.touches[0].pageY;
      self.fromx = (pageX - offset.left) * self.compensationWidthRate;
      self.fromy = (pageY - offset.top) * self.compensationWidthRate;
      self.fromxText = pageX;
      self.fromyText = pageY;
      
      switch (self.options.type) {
      case 'text':
        self.$textbox.css({
          left: self.fromxText + 2,
          top: self.fromyText,
          width: 0,
          height: 0
        }).show();
        break;
      case 'pen':
        self.points.push([
          self.fromx,
          self.fromy
        ]);
        break;
      case 'tick':
      case 'cross':
    	 self.storedElement.push({
    		 type: self.options.type,
    		 fromx: self.fromx,
    		 fromy: self.fromy
    	 });
    	 break;
      default:
    	 if (String(self.options.type).startsWith('stamp_')) {
    		  self.storedElement.push({
    	    		 type: self.options.type,
    	    		 fromx: self.fromx,
    	    		 fromy: self.fromy
    	    	 });
    	 }
      	 break;
      }
    },
    annotatestop: function() {
      var self = this;
      self.clicked = false;
      if (self.toy !== null && self.tox !== null) {
        switch (self.options.type) {
          case 'rectangle':
            self.storedElement.push({
              type: 'rectangle',
              fromx: self.fromx,
              fromy: self.fromy,
              tox: self.tox,
              toy: self.toy
            });
            break;
          case 'rectangle-filled':
            self.storedElement.push({
              type: 'rectangle-filled',
              fromx: self.fromx,
              fromy: self.fromy,
              tox: self.tox,
              toy: self.toy
            });
            break;
          case 'circle':
            self.storedElement.push({
              type: 'circle',
              fromx: self.fromx,
              fromy: self.fromy,
              tox: self.tox,
              toy: self.toy
            });
            break;
          case 'arrow':
            self.storedElement.push({
              type: 'arrow',
              fromx: self.fromx,
              fromy: self.fromy,
              tox: self.tox,
              toy: self.toy
            });
            break;
          case 'text':
            self.$textbox.css({
              left: self.fromxText + 2,
              top: self.fromyText,
              width: self.tox - 12,
              height: self.toy
            });
            break;
          case 'pen':
            self.storedElement.push({
              type: 'pen',
              points: self.points
            });
            for (var i = 0; i < self.points.length - 1; i++) {
              self.fromx = self.points[i][0];
              self.fromy = self.points[i][1];
              self.tox = self.points[i + 1][0];
              self.toy = self.points[i + 1][1];
              self.drawPen(self.baseContext, self.fromx, self.fromy, self
                .tox,
                self.toy);
            }
            self.points = [];
            break;
          default:
        }
        if (self.storedUndo.length > 0) {
          self.storedUndo = [];
        }
        self.checkUndoRedo();
        self.redraw();
      } else if (self.options.type === 'text') {
    	self.$textbox.css({
          left: self.fromxText + 2,
          top: self.fromyText,
          width: Math.trunc(self.currentWidth * 0.8),
          height: 50
        });
      } else {
    	  self.redraw();
      }
    },
    annotateleave: function(event) {
      var self = this;
      if (self.clicked) {
        self.annotatestop(event);
      }
    },
    annotatemove: function(event) {
      var self = this;
      if (self.options.type) {
        event.preventDefault();
      }
      if (!self.clicked) {
        return;
      }
      var offset = self.$el.offset();
      var pageX = event.pageX || event.originalEvent.touches[0].pageX;
      var pageY = event.pageY || event.originalEvent.touches[0].pageY;
      switch (self.options.type) {
        case 'rectangle':
          self.clear();
          self.tox = (pageX - offset.left) * self.compensationWidthRate -
            self.fromx;
          self.toy = (pageY - offset.top) * self.compensationWidthRate -
            self.fromy;
          self.drawRectangle(self.drawingContext, self.fromx, self.fromy,
            self.tox, self.toy);
          break;
        case 'rectangle-filled':
          self.clear();
          self.tox = (pageX - offset.left) * self.compensationWidthRate -
            self.fromx;
          self.toy = (pageY - offset.top) * self.compensationWidthRate -
            self.fromy;
          self.drawRectangleFilled(self.drawingContext, self.fromx, self.fromy,
            self.tox, self.toy);
          break;
        case 'arrow':
          self.clear();
          self.tox = (pageX - offset.left) * self.compensationWidthRate;
          self.toy = (pageY - offset.top) * self.compensationWidthRate;
          self.drawArrow(self.drawingContext, self.fromx, self.fromy,
            self.tox,
            self.toy);
          break;
        case 'pen':
          self.tox = (pageX - offset.left) * self.compensationWidthRate;
          self.toy = (pageY - offset.top) * self.compensationWidthRate;
          self.fromx = self.points[self.points.length - 1][0];
          self.fromy = self.points[self.points.length - 1][1];
          self.points.push([
            self.tox,
            self.toy
          ]);
          self.drawPen(self.drawingContext, self.fromx, self.fromy, self.tox,
            self.toy);
          break;
        case 'text':
          self.clear();
          self.tox = (pageX - self.fromxText) * self.compensationWidthRate;
          self.toy = (pageY - self.fromyText) * self.compensationWidthRate;
          self.$textbox.css({
            left: self.fromxText + 2,
            top: self.fromyText,
            width: self.tox - 12,
            height: self.toy
          });
          break;
        case 'circle':
          self.clear();
          self.tox = (pageX - offset.left) * self.compensationWidthRate;
          self.toy = (pageY - offset.top) * self.compensationWidthRate;
          self.drawCircle(self.drawingContext, self.fromx, self.fromy,
            self
            .tox, self.toy);
          break;
        case 'cross':
        case 'tick':
        	self.clear();
        	self.drawStamp(self.drawingContext, self.options.type, self.fromx, self.fromy);
        	break;
        default:
        	if (String(self.options.type).startsWith('stamp_')) {
        		self.clear();
        		self.drawStamp(self.drawingContext, String(self.options.type).substr(6), self.fromx, self.fromy)
        	}
      }
    },
    annotateresize: function() {
      var self = this;
      var currentWidth = self.$el.width();
      var currentcompensationWidthRate = self.compensationWidthRate;
      self.compensationWidthRate = self.selectImageSize.width /
        currentWidth;
      if (self.compensationWidthRate < 1) {
        self.compensationWidthRate = 1;
      }
      self.linewidth = self.options.linewidth * self.compensationWidthRate;
      self.fontsize = String(parseInt(self.options.fontsize.split('px')[0],
          10) *
        self.compensationWidthRate) + 'px';
      if (currentcompensationWidthRate !== self.compensationWidthRate) {
        self.redraw();
        self.clear();
      }
    },
    destroy: function() {
      var self = this;
      $(document).off(self.options.selectEvent, '.annotate-image-select');
      self.$tool.remove();
      self.$textbox.remove();
      self.$el.children('canvas').remove();
      self.$el.removeData('annotate');
    },
    exportImage: function(options, callback) {
      var self = this;
      if (self.$textbox.is(':visible')) {
        self.pushText();
      }
      var exportDefaults = {
        imageExport: { type: 'image/jpeg', quality: 0.75, },
      };
      options = $.extend({}, exportDefaults, options.imageExport);
      var image = self.baseCanvas.toDataURL(options.imageExport.type, options.imageExport.quality);
      if (callback) {
        callback(image);
      }
    }
  };
  $.fn.annotate = function(options, cmdOption, callback) {
    var $annotate = $(this).data('annotate');
    if (options === 'destroy') {
      if ($annotate) {
        $annotate.destroy();
      } else {
        throw new Error('No annotate initialized for: #' + $(this).attr(
          'id'));
      }
    } else if (options === 'push') {
      if ($annotate) {
        $annotate.pushImage(cmdOption, true, callback);
      } else {
        throw new Error('No annotate initialized for: #' + $(this).attr(
          'id'));
      }
    
    }else if (options === 'fill') {
      if ($annotate) {
        $annotate.addElements(cmdOption, true, callback);
      } else {
        throw new Error('No annotate initialized for: #' + $(this).attr(
          'id'));
      }
    
    } else if (options === 'export') {
      if ($annotate) {
        $annotate.exportImage(cmdOption, callback);
      } else {
        throw new Error('No annotate initialized for: #' + $(this).attr(
          'id'));
      }
    } else {
      var opts = $.extend({}, $.fn.annotate.defaults, options);
      var annotate = new Annotate($(this), opts);
      $(this).data('annotate', annotate);
    }
  };
  $.fn.annotate.defaults = {
    width: null,
    height: null,
    images: [],
    color: 'red',
    type: 'rectangle',
    tools: ['undo', 'unselect', 'rectangle', 'circle', 'text', 'arrow', 'pen', 'redo'],
    linewidth: 2,
    lineheight: '20',
    fontsize: '20px',
    bootstrap: false,
    position: 'top',
    idAttribute: 'id',
    selectEvent: 'change',
    onExport: function(image) {
      console.log(image);
    },
  	onAnnotate: undefined,
  };
})(jQuery);
