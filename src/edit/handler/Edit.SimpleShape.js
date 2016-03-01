L.Edit = L.Edit || {};

L.Edit.isFixture = function (projector, latlngs) {
  if (latlngs.length == 4) {
	  // if look like a rectangle: disable resize for fixtures
	  // to preserve shape

  }
  return false;
};

L.Edit.SimpleShape = L.Handler.extend({
  SHAPE_TYPE: 'Simple',

	isRectangle: function() {
	  if (this._shape.getLatLngs().length != 4) {
		return false;
	  }
	  var angle0 = this._guessAngle(0).angle, angle1 = this._guessAngle(2).angle;
	  return (
		(angle1 - angle0) < 0.001 ||
		(0 <= (Math.PI - (angle1 + angle0)) && (Math.PI - (angle1 + angle0)) < 0.001)
	  )
	},

	_guessAngle: function(index) {
	  var c, p1, p2, mid, center, dx, dy, projector, points;
	  center = this._getCenter();
	  points = this._shape.getLatLngs();
	  projector = this._getPrjs();
	  c = projector.pre(center);
	  p1 = projector.pre(points[index % 4]);
	  p2 = projector.pre(points[(index + 1) % 4]);
	  mid = {
		x: (p1.x + p2.x) / 2,
		y: (p1.y + p2.y) / 2
	  };
	  dy = mid.y - c.y;
	  dx = mid.x - c.x;
	  angle = Math.atan(dy / dx) + (Math.PI / 2);
	  console.log('Guessed angle', rad2deg(angle));
	  return {
		  angle: angle,
		  dy: dy,
		  dx: dx
	  }
	},

	options: {
		moveIcon: new L.DivIcon({
			iconSize: new L.Point(8, 8),
			className : 'fa fa-arrows',
			html: ''
		}),
		resizeIcon: new L.DivIcon({
		  iconSize: new L.Point(8, 8),
		  className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-resize',
		  html: ""
		}),
		rotateIcon : new L.DivIcon({
			iconSize : new L.Point(8, 8),
			className : 'fa fa-rotate-left',
			html: ''
		}),
		edgeIcon : new L.DivIcon({
			iconSize: new L.Point(8, 8),
			className: 'leaflet-div-icon leaflet-editing-icon'
		})
	},

	initialize: function (shape, options) {
		this._shape = shape;
		L.Util.setOptions(this, options);
	},

	addHooks: function () {
		var shape = this._shape;


		shape.setStyle(L.Edit.SHAPE_STYLER ? L.Edit.SHAPE_STYLER(this) : shape.options.editing);

		if (shape._map) {
			this._map = shape._map;
			this._isRectangle = this.isRectangle();

			if (!this._markerGroup) {
				this._initMarkers();
			}
			this._map.addLayer(this._markerGroup);
		}
	},

	removeHooks: function () {
		var shape = this._shape;

		shape.setStyle(shape.options.original);

		if (shape._map) {
			if (this._moveMarker) {
			  this._unbindMarker(this._moveMarker);
			}
			if (this._rotateMarker) {
			  this._unbindMarker(this._rotateMarker);
			}
			if (this._resizeMarkers) {
			  for (var i = 0, l = this._resizeMarkers.length; i < l; i++) {
				  this._unbindMarker(this._resizeMarkers[i]);
			  }
			}
			this._resizeMarkers = null;

			this._map.removeLayer(this._markerGroup);
			delete this._markerGroup;
		}

		this._map = null;
	},

	updateMarkers: function () {
		this._markerGroup.clearLayers();
		this._initMarkers();
	},

	_initMarkers: function () {
		if (!this._markerGroup) {
			this._markerGroup = new L.LayerGroup();
		}

        // Create center marker
        this._createMoveMarker();

        // Create rotate marker
        this._createRotateMarker();

		// Create edge marker
		this._createResizeMarker();
	},

	_createRotateMarker: function () {
        // Children override
    },

    _createMoveMarker: function () {
        // Children override
    },

	_createResizeMarker: function () {
		// Children override
	},

	_createMarker: function (latlng, icon, dx, dy) {
		if(dx === undefined) {
			dx = 0;
			dy = 0;
		}
		var marker = new L.MarkerExt(latlng, {
			draggable: true,
			icon: icon,
			zIndexOffset: 10,
			dx: dx,
			dy: dy
		});

		this._bindMarker(marker);

		this._markerGroup.addLayer(marker);

		return marker;
	},

	_bindMarker: function (marker) {
		marker
			.on('dragstart', this._onMarkerDragStart, this)
			.on('drag', this._onMarkerDrag, this)
			.on('dragend', this._onMarkerDragEnd, this);
	},

	_unbindMarker: function (marker) {
		marker
			.off('dragstart', this._onMarkerDragStart, this)
			.off('drag', this._onMarkerDrag, this)
			.off('dragend', this._onMarkerDragEnd, this);
	},

	_onMarkerDragStart: function (e) {
		var marker = e.target;
		marker.setOpacity(0);

		this._shape.fire('editstart');
	},

	_fireEdit: function () {
		this._shape.edited = true;
		this._shape.fire('edit');
	},

	_onMarkerDrag: function (e) {
		var marker = e.target,
			latlng = marker.getLatLng();

		if (marker === this._moveMarker) {
			this._move(latlng);
		} else if (marker === this._rotateMarker) {
			this._rotate(latlng);
		} else {
            this._resize(latlng);
		}
		this._shape.redraw();
	},

	_onMarkerDragEnd: function (e) {
		var marker = e.target;
		marker.setOpacity(1);

		this._fireEdit();
	},

	_move: function () {
		// Children override
	},

    _resize: function () {
        // Children override
    },

    _rotate: function () {
        // Children override
    }
});
