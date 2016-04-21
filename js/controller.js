(function (window) {
	'use strict';

	/**
	 * Takes a model and view and acts as the controller between them
	 *
	 * @constructor
	 * @param {object} model The model instance
	 * @param {object} view The view instance
	 */
	function Controller(model, view) {
		var that = this;
		that.model = model;
		that.view = view;

		that.view.bind('newTodo', function (title) {
			that.addItem(title);
		});

		that.view.bind('itemEdit', function (item) {
			that.editItem(item.id);
		});

		that.view.bind('itemEditDone', function (item) {
			that.editItemSave(item.id, item.title);
		});

		that.view.bind('itemEditCancel', function (item) {
			that.editItemCancel(item.id);
		});

		that.view.bind('itemRemove', function (item) {
			that.removeItem(item.id);
		});
		that.view.bind('removeCompleted', function () {
			that.removeCompleted();
		});
		that.view.bind('select', function (item) {
			that.selects(item.id, item.completed);
		});
	}

	/**
	 * Remove all compeleted item as removeItem method.
	 *
	 */
	Controller.prototype.removeCompleted = function () {
		var that = this;
		var i;
		// read all completed items
		that.model.read({completed : !''}, function (data) {
			for(i = 0; i< data.length; i++){
				that.removeItem(data[i].id);
			}
		});

		that._filter();
	};

	/**
	 * change selected item state to completed
	 * @param {number} id The ID of the item to remove from the DOM and
	 * storage
	 * @param {string} completed current state of the check box
	 */
	Controller.prototype.selects = function (id, completed) {
		var that = this;
		
		that.model.update(id, {completed : completed}, function () {
			that.view.render('selected', {
				id: id,completed: completed
			});
		});

	};


	/**
	 * Loads and initialises the view
	 *
	 * @param {string} '' | 'active'
	 */
	Controller.prototype.setView = function (locationHash) {
		var route = locationHash.split('/')[1];
		var page = route || '';
		this._updateFilterState(page);
	};

	/**
	 * An event to fire on load. Will get all items and display them in the
	 * todo-list
	 */
	Controller.prototype.showAll = function () {
		var that = this;
		that.model.read(function (data) {
			that.view.render('showEntries', data);
		});
	};

	/**
	 * Renders all active tasks
	 */
	Controller.prototype.showActive = function () {
		var that = this;
		that.model.read({ completed: false},function (data) {
			that.view.render('showEntries', data);
		});
	};

	/**
	 * An event to fire whenever you want to add an item. Simply pass in the event
	 * object and it'll handle the DOM insertion and saving of the new item.
	 */
	Controller.prototype.addItem = function (title) {
		var that = this;

		if (title.trim() === '') {
			return;
		}

		that.model.create(title, function () {
			that.view.render('clearNewTodo');
			that._filter(true);
		});
	};

	/*
	 * Triggers the item editing mode.
	 */
	Controller.prototype.editItem = function (id) {
		var that = this;
		that.model.read(id, function (data) {
			that.view.render('editItem', {id: id, title: data[0].title});
		});
	};

	/*
	 * Finishes the item editing mode successfully.
	 */
	Controller.prototype.editItemSave = function (id, title) {
		var that = this;
		if (title.trim()) {
			that.model.update(id, {title: title}, function () {
				that.view.render('editItemDone', {id: id, title: title});
			});
		} else {
			that.removeItem(id);
		}
	};

	/*
	 * Cancels the item editing mode.
	 */
	Controller.prototype.editItemCancel = function (id) {
		var that = this;
		that.model.read(id, function (data) {
			that.view.render('editItemDone', {id: id, title: data[0].title});
		});
	};

	/**
	 * By giving it an ID it'll find the DOM element matching that ID,
	 * remove it from the DOM and also remove it from storage.
	 *
	 * @param {number} id The ID of the item to remove from the DOM and
	 * storage
	 */
	Controller.prototype.removeItem = function (id) {
		var that = this;
		that.model.remove(id, function () {
			that.view.render('removeItem', id);
		});

		that._filter();
	};


	/**
	 * Updates the pieces of the page which change depending on the remaining
	 * number of todos.
	 */
	Controller.prototype._updateCount = function () {
		var that = this;
		that.model.getCount(function (todos) {
			that.view.render('updateElementCount', todos.active);
			that.view.render('contentBlockVisibility', {visible: todos.total > 0});

		});
	};

	/**
	 * Re-filters the todo items, based on the active route.
	 * @param {boolean|undefined} force  forces a re-painting of todo items.
	 */
	Controller.prototype._filter = function (force) {
		var activeRoute = this._activeRoute.charAt(0).toUpperCase() + this._activeRoute.substr(1);

		this._updateCount();

		// If the last active route isn't "All", or we're switching routes, we
		// re-create the todo item elements, calling:
		//   this.show[All|Active]();
		if (force || this._lastActiveRoute !== 'All' || this._lastActiveRoute !== activeRoute) {
			this['show' + activeRoute]();
		}

		this._lastActiveRoute = activeRoute;
	};

	/**
	 * Simply updates the filter nav's selected states
	 */
	Controller.prototype._updateFilterState = function (currentPage) {
		// Store a reference to the active route, allowing us to re-filter todo
		this._activeRoute = currentPage;

		if (currentPage === '') {
			this._activeRoute = 'All';
		}

		this._filter();

		this.view.render('setFilter', currentPage);
	};

	// Export to window
	window.app = window.app || {};
	window.app.Controller = Controller;
})(window);
