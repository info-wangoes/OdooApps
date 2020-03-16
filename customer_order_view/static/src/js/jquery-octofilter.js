odoo.define('customer_order_view.Filter', function (require) {
"use strict";
var rpc = require('web.rpc');
(function($) {
  'use strict';
  // Class definition
  // ==============================

  var Octofilter = function(element, options) {
    this.$input   = $(element);
    this.options  = options;

    this.init();
  };

  Octofilter.defaults = {
    source: {},
    categories: {},
    paramName: 'query',
    minChars: 3
  };

  Octofilter.prototype.cacheData = {};
  Octofilter.prototype.currentData = {};
  Octofilter.prototype.selectedFilters = {};

  Octofilter.prototype.init = function() {
    var self = this;

    self.$input.attr({ autocomplete: 'off' });
    self.$container = self.$input.wrap('<div class="octofilter-input"/>').parent();

    // Focus when click on input container
    self.$container.on('click', function() {
      self.$input.focus();
    });

    self.$input
      .on('focus', function() {
        self.$filtersContainer.show();
      })

      .on('keydown', function(event) {
        switch (event.keyCode || event.which) {
          // Return if tab is pressed
          case 9:
          case 13:
            event.preventDefault();
            break;
          // Clear the last filter if backspace is pressed
          case 8:
            if (!this.value.length) {
              self.clear(self.$container.find('.octofilter-label:last').data('value'));
            }
            break;
          // Clear search if esc is pressed
          case 27:
            self.$input.val('').blur();
            self.$filtersContainer.hide();
            break;
        }
      })

      .on('keyup', function(event) {
        switch (event.keyCode || event.which) {
          // Enter and tab
          case 9:
          case 13:
            var $filter = self.$filtersContainer.find('.octofilter-link.octofilter-active:first'); // Finds the first active filter
            if ($filter.length) {
              self.select($filter.data('value'));
            }
            break;
          default:
            if (this.value.length >= self.options.minChars) {
              self.search(this.value);
            } else {
              self.search('');
            }
        }
      });
 

    // Make the initial search
    // Triggerable filter events
    self.search('', function() {
      // Select filter
      self.$filtersContainer.on('click', '.octofilter-link', function(event) {
        event.preventDefault();
        event.stopPropagation();
        self.select($(this).data('value'));
        var value = $('#customerIds').val()
        var partner_id = $('#customer_list [value="' + value + '"]').data('id')
        // code for get filter data 
        var select = []
        var selected = self.$container[0].children
        for(var chil=0; chil<= selected.length; chil++)
        {
          if(selected[chil] != undefined)
          {
            if(selected[chil].previousSibling != null)
            {
              var check = selected[chil].previousSibling.dataset.category
              if((check == 'NeverSold') || (check == 'Sold6Month')
              || (check == 'NotSold6Month')
              || (check == 'NeverSold'))
              {
                $('#last_filter').modal('show');
              }
            }
            selected[chil].classList.value == 'octofilter-label'
            select.push(selected[chil].dataset)
          }
        }
          var id = [];
          if(navigator.onLine == true)
          {
            rpc.query({
            model: 'order.history.view',
            method: 'update_product_list',
            args: [id, select, partner_id],
            }).then(function(res) {
                if(res == 'select partner')
                {
                  $('#customer_popup').modal('show');
                }
                else
                {
                  var filter_products = res;
                  $('#render').trigger('click', [res])     
                }
            });
          }
          else
          {
            var select = _.filter(select,v => _.keys(v).length !== 0);
            var prod_list = JSON.parse(localStorage.getItem("prod_list") || "[]");
            var child_categ = JSON.parse(localStorage.getItem('child_categ') || '[]')
            var filter_categ = []
              //run when category and brand select for filter to perform 'and' operation on selcted categ and brand 
              var all_filters = _.map(select,"category")  // get filter category list
              if(all_filters.every( (val, i, arr) => val === arr[0]) == false)  // check all are same value is list
              {
                var allCategList = []
                var categWithChild = []
                var brandData = []

                var allCategList = select.filter(function(e) {
                  return e.category == 'Category'
                });
                
                var listCateg = _.map(allCategList,"value") 
                for(var c=0; c<listCateg.length; c++)
                {
                  categWithChild.push.apply(categWithChild, _.map(child_categ,listCateg[c]).filter(Boolean)[0]);
                }

                var brandData = select.filter(function(e) {
                  return e.category == 'Brand'
                });
                var Brandlist = _.map(brandData,"value") 
                var filterObj = prod_list.filter(function(e) {
                    return categWithChild.includes(e.categ_id) && Brandlist.includes(e.brand)
                });
                $.each(filterObj, function() {
                      this.filtered_by = 'Products'
                      this.length = filterObj.length;
                }); 
                filter_categ.push(filterObj)
              }
              else
              {
                // run when select multiple brand or when select, multiple categories 
                var listCategs = {'categs' : [], 'brand': []}
                var listband = []
                for(var b=0; b<select.length; b++)
                {
                  if(select[b]['category']== "Category" || select[b]['category']== "Brand")
                  {
                    if(select[b]['category']== "Category")
                    {
                      // listCategs['categs'].push(select[b]['value'])
                      listCategs['categs'].push.apply(listCategs['categs'], _.map(child_categ,select[b]['value']).filter(Boolean)[0]);
                    }
                    if(select[b]['category']== "Brand")
                    {
                      listCategs['brand'].push(select[b]['value'])
                    }
                  }
                }
                var filterObj = prod_list.filter(function(e) {
                    if(listCategs['brand'].length > 0)
                    {
                      return listCategs['brand'].includes(e.brand)
                    }
                    else
                    {
                      return listCategs['categs'].includes(e.categ_id)
                    }
                });
                $.each(filterObj, function() {
                  if(listCategs['brand'].length > 0)
                  {
                    this.filtered_by = this.brand;
                  }
                  else
                  {
                    this.filtered_by = 'Products'
                  }
                  this.length = filterObj.length;
                });
                filter_categ.push(filterObj)
                // filter_categ.filter(e => e.length) // remove blank list
              }
              if(filter_categ[0].length == 0)
              {
                filter_categ = 'No data'
              }
              $('#render').trigger('click', [filter_categ])     
          }
          // code end
      });


      // Clear filter
      self.$container.on('click', '.octofilter-clear', function(event) {
        event.preventDefault();
        event.stopPropagation();
        self.clear($(this).closest('.octofilter-label').data('value'));
          var value = $('#customerIds').val()
          var partner_id = $('#customer_list [value="' + value + '"]').data('id')
          var select = []
          var selected = self.$container[0].children
          for(var chil=0; chil<= selected.length; chil++)
          {
            if(selected[chil] != undefined)
            {
              selected[chil].classList.value == 'octofilter-label'
              select.push(selected[chil].dataset)
            }
          }
          var id = [];
          if(navigator.onLine == true)
          {
            rpc.query({
            model: 'order.history.view',
            method: 'update_product_list',
            args: [id, select, partner_id],
            }).then(function(res) {
                if(res == 'select partner')
                {
                  $('#customer_popup').modal('show');
                }
                else
                {
                  var filter_products = res;
                  $('#render').trigger('click', [res])     
                }
            });
          }
          else
          {
            var select = _.filter(select,v => _.keys(v).length !== 0);  // remove {} object from list
            var prod_list = JSON.parse(localStorage.getItem("prod_list") || "[]");
            var filter_categ = []
            var child_categ = JSON.parse(localStorage.getItem('child_categ') || '[]')
            
            if(select.length < 1)
            {
               filter_categ = false
            }
            else
            {
              //run when category and brand select for filter to perform 'and' operation on selcted categ and brand 
              var all_filters = _.map(select,"category")  // get filter category list
              if(all_filters.every( (val, i, arr) => val === arr[0]) == false)  // check all are same value is list
              {
                var allCategList = []
                var categWithChild = []
                var brandData = []
                var allCategList = select.filter(function(e) {
                  return e.category == 'Category'
                });
                var listCateg = _.map(allCategList,"value") 
                for(var c=0; c<listCateg.length; c++)
                {
                  categWithChild.push.apply(categWithChild, _.map(child_categ,listCateg[c]).filter(Boolean)[0]);
                }

                var brandData = select.filter(function(e) {
                  return e.category == 'Brand'
                });
                var Brandlist = _.map(brandData,"value") 
                var filterObj = prod_list.filter(function(e) {
                    return categWithChild.includes(e.categ_id) && Brandlist.includes(e.brand)
                });
                $.each(filterObj, function() {
                      this.filtered_by = 'Products'
                      this.length = filterObj.length;
                }); 
                filter_categ.push(filterObj)
              }
              else
              {
                // run when select multiple brand or when select, multiple categories 
                var listCategs = {'categs' : [], 'brand': []}
                var listband = []
                for(var b=0; b<select.length; b++)
                {
                  if(select[b]['category']== "Category" || select[b]['category']== "Brand")
                  {
                    if(select[b]['category']== "Category")
                    {
                      listCategs['categs'].push.apply(listCategs['categs'], _.map(child_categ,select[b]['value']).filter(Boolean)[0]);
                    }
                    if(select[b]['category']== "Brand")
                    {
                      listCategs['brand'].push(select[b]['value'])
                    }
                  }
                }
                var filterObj = prod_list.filter(function(e) {
                    if(listCategs['brand'].length > 0)
                    {
                      return listCategs['brand'].includes(e.brand)
                    }
                    else
                    {
                      return listCategs['categs'].includes(e.categ_id)
                    }
                });
                $.each(filterObj, function() {
                  if(listCategs['brand'].length > 0)
                  {
                    this.filtered_by = this.brand;
                  }
                  else
                  {
                    this.filtered_by = 'Products'
                  }
                  this.length = filterObj.length;
                });
                filter_categ.push(filterObj)
                // filter_categ.filter(e => e.length) // remove blank list
              }
              if(filter_categ[0].length == 0)
              {
                filter_categ = 'No data'
              }
            }
            $('#render').trigger('click', [filter_categ])     
          }
      });

      // When you click outside of filter area, it should hide
      $(document).on('click', function(event) {
        var $target  = $(event.target),
            $parents = $target.parents().add($target);

        if($(event.target).attr("id") != "render")
        {
          if ($parents.index(self.$container) === -1 && $parents.index(self.$filtersContainer) === -1) {
            self.$filtersContainer.hide();
          }
        }
      });
    });
  };

  Octofilter.prototype.makeFilterContainer = function() {
    var self = this;

    if (!self.$filtersContainer) {
      self.$filtersContainer = $(
        '<div class="octofilter-container">' +
          '<ul class="nav nav-tabs"></ul>' +
          '<div class="tab-content"></div>' +
        '</div>'
      ).insertAfter(self.$input);
    }

    var containerNav = [];

    for (var category in self.options.categories) {
      var label = self.options.categories[category];
      containerNav.push(
        '<li>' +
          '<a href="#octofilter-' + category + '" class="nav-' + category + '" data-toggle="tab">' + label + '</a>' +
        '</li>'
      );
    }

    self.$filtersContainer
      .find('.nav').html(containerNav)
      .find('li:first').addClass('active');
  };

  Octofilter.prototype.populateFilterContainer = function(data) {
    var self = this;

    data = $.extend({}, data); // Cloning the data

    if ($.isEmptyObject(self.options.categories)) {
      $.each(data, function(key) {
        self.options.categories[key] = key;
      });

      self.makeFilterContainer();
    }

    var containerContent = [],
        inputContains = function(category) {
          var name = category.name || category.value || category;
          return name.toLowerCase().indexOf(self.$input.val().toLowerCase()) !== -1;
        };

    self.currentData = {};

    for (var category in self.options.categories) {
      if (typeof data[category] === 'string') {
        data[category] = $.parseJSON(data[category]);
      }

      // Performs the search and returns the values found
      if (self.$input.val().length >= self.options.minChars) {
        data[category] = $.grep(data[category], inputContains);
      }

      var filters = [];

      if (data[category].length) {
        for (var item in data[category]) {
          var klass = 'octofilter-link',
              value = item.name || item.value || data[category][item];

          if ($.inArray(value, self.selectedFilters[category]) !== -1) {
            klass += ' octofiltered';
          }

          filters.push($('<a/>', { text: value, 'class': klass, 'data-category': category, 'data-value': value }));
        }

        self.currentData[category] = data[category];
      } else {
        filters.push($('<span/>', { text: self.options.categories[category].toLowerCase() + ' not found.', 'class': 'octofilter-not-found' }));
      }

      containerContent.push($('<div/>', { id: 'octofilter-' + category, 'class': 'tab-pane' }).html(filters));
    }

    self.$filtersContainer.find('.tab-content').html(containerContent);

    var $firstFilter = self.$filtersContainer.find('.octofilter-link:not(.octofiltered):first'); // Return the first filter which isn't filtered

    // Define what is the active tab
    var tabActive;

    if ($firstFilter.length) {
      tabActive = $firstFilter.closest('.tab-pane').addClass('active');
    } else {
      tabActive = self.$filtersContainer.find('.tab-pane:first').addClass('active');
    }

    self.$filtersContainer.find('[href="#' + tabActive.attr('id') + '"]').tab('show');

    // Define the active link
    if (self.$input.val().length >= self.options.minChars) {
      $firstFilter.addClass('octofilter-active');
    }
  };

  Octofilter.prototype.search = function(query, callback) {
    if (this.cacheData[query]) {
      this.populateFilterContainer(this.cacheData[query]);

      // Callbacks
      if (typeof callback === 'function') { callback(); }
      this.$input.trigger('octofilter.search', [this.cacheData[query]]);
    } else {
      if (typeof this.options.source === 'string') {
        var self = this,
            params = {};

        params[this.options.paramName] = query;

        $.getJSON(this.options.source, params, function (data) {
          self.cacheData[query] = data; // Stores the query in cache

          if (!self.$filtersContainer) { self.makeFilterContainer(); }
          self.populateFilterContainer(data);

          // Callbacks
          if (typeof callback === 'function') { callback(); }
          self.$input.trigger('octofilter.search', [data]);
        });
      } else {
        if (!this.$filtersContainer) { this.makeFilterContainer(); }
        this.populateFilterContainer(this.options.source);

        // Callbacks
        if (typeof callback === 'function') { callback(); }
        this.$input.trigger('octofilter.search', [this.currentData]);
      }
    }
  };

  Octofilter.prototype.select = function(value) {
    var self = this,
        $filter = self.$filtersContainer.find('.octofilter-link[data-value="' + value + '"]'),
        category = $filter.data('category');

    // Return when the filter isn't selected
    if ($.inArray(value, self.selectedFilters[category]) !== -1) {
      self.$input.focus();
      return;
    }

    if (!self.selectedFilters[category]) { self.selectedFilters[category] = []; }
    self.selectedFilters[category].push(value); // Store the selected value

    var $filterLabel = $('<span/>', { 'class': 'octofilter-label', text: $filter.text(), 'data-value': value, 'data-category': category });
    $('<a/>', { 'class': 'octofilter-clear', html: 'X' }).appendTo($filterLabel);

    var $filtersLabels = self.$container.find('.octofilter-label');

    // Add filter in selecteds filters
    if ($filtersLabels.length) {
      $filtersLabels.last().after($filterLabel);
    } else {
      self.$container.prepend($filterLabel);
    }

    // Clear input value and seach
    self.$input.val('').focus();
    self.search('');

    // Callback
    self.$input.trigger('octofilter.select', [self.selectedFilters]);
  };

  Octofilter.prototype.clear = function(value) {
    var self = this,
        removedFilter = {};

    if (!value) {
      self.$container.find(".octofilter-label").remove();
      self.selectedFilters = {};
      self.$input.val('');
    } else {
      var $filterLabel = self.$container.find('.octofilter-label[data-value="' + value + '"]').remove(),
          category = $filterLabel.data('category');

      removedFilter[category] = self.selectedFilters[category].splice(self.selectedFilters[category].indexOf(value), 1); // Clean the filters selected
    }

    self.$input.focus();
    self.search(self.$input.val()); // Remake the search to clear the filter

    // Callbacks
    self.$input.trigger('octofilter.clear', [removedFilter]);
  };

  $.fn.octofilter = function(option) {
    return this.each(function() {
      var $this   = $(this),
          data    = $this.data('octofilter'),
          options = $.extend({}, Octofilter.defaults, $this.data(), typeof option === 'object' && option);

      if (!data) { $this.data('octofilter', new Octofilter(this, options)); }
      if (typeof option === 'string') { data[option](); }
    });
  };

  $.fn.octofilter.Constructor = Octofilter;

})(window.jQuery);

})
