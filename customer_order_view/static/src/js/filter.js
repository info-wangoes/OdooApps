odoo.define(function(require){
"use strict";
  var rpc = require('web.rpc');
  var id = []
  var args = [id]
  var categories = []
  var brands = []
  var location = []


  $(document).ready(function(){
      // get all category and brand
      rpc.query({
          model: 'order.history.view',
          method: 'get_records',
          args: [id],
      }).then(function(res) {
          categories = res[0];
          localStorage.setItem('category_list', JSON.stringify(res[0]))
          brands = res[1]      
          localStorage.setItem('brand_list', JSON.stringify(res[1]))
          location = res[2]
          localStorage.setItem('location_list', JSON.stringify(res[2]))
      });

      rpc.query({
          model: 'order.history.view',
          method: 'compute_child_categ',
          args: [id],
      }).then(function(res) {
          localStorage.setItem('child_categ', JSON.stringify(res))      
      });
  });

  setTimeout(function(){
    $('#input').octofilter({
      source: {
        Category : categories,
        Brand : brands,
        Location : location,
        Other : ['Product which never sold', 'Product which sold in last 6 month', 'Product did not sold last 6 month', 'New arrival item this month']
              }
    });
 }, 1000);

 });