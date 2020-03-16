odoo.define('customer_order_view.order_history', function (require) {
"use strict";
	var AbstractView = require('web.AbstractView');
	var AbstractController = require('web.AbstractController');
	var AbstractModel = require('web.AbstractModel');
	var AbstractRenderer = require('web.AbstractRenderer');
	var viewRegistry = require('web.view_registry');
	var session = require('web.session');
	var WebClient = require('web.WebClient');
	var core = require('web.core');
	var _t = core._t;
	var QWeb = core.qweb;
	var OrderViewController = AbstractController.extend({});
	var rpc = require('web.rpc');
	var id = []
	var args
	var products = false
	var unit_html
	var unit_price
	var qty_html
	var qty
	var amount_html
	var currentAmount
	var new_qty = 0.00
	var new_price = 0.00
	var partner_list
	var filter_products = false
	var partner_id
	var next_render = false
	var brands = []
	var partner_info = []
	var categories = []
    localStorage.setItem("order_data", JSON.stringify([]));
    if(!localStorage.getItem('current_order_data')){
	    localStorage.setItem("current_order_data", JSON.stringify([])); /*set current data */
	}

	var offset = 0
	var start_limit 
    var end_limit 
    var limit = 80
    var length
    var old_products = false

	$(document).ready(function(){
		if(location.hash.includes('order.history.view') == true)
		{
		    window.onbeforeunload = function() {
		      return "Are you sure you want to leave?";
		    }
		    window.onbeforeunload = confirmExit;
		      function confirmExit() {
		        return "You have attempted to leave this page. Are you sure?";
		    }
		}

		// get all products
	  	rpc.query({
		  	model : 'order.history.view',
		  	method : 'get_all_product',
		  	args : [id, offset]
		}).then(function(res){
			localStorage.setItem("prod_list", JSON.stringify(res));
		})

	  	// get all products
	  	rpc.query({
		  	model : 'order.history.view',
		  	method : 'get_product_list',
		  	args : [id, offset]
		}).then(function(res){
		  	products = res[0];
		  	old_products = res[0];
		  	length = res[1]
		  	start_limit = offset
		  	end_limit = parseInt(offset) + res[0].length
		})

		// get all partners
	   	rpc.query({
	        model: 'order.history.view',
	        method: 'get_all_partner',
	        args: [id],
	    }).then(function(res) {
	        partner_list = res;   
	        localStorage.setItem("allPartner", JSON.stringify(res));  
	    });

	$('a:contains("Salesman Quotation")').addClass('update_view');

	setTimeout(function(){
		if(location.hash.includes('order.history.view') == true)
			{
				$('#render').trigger('click')
				$('.f_launcher_content').hide()				
				$('#oe_main_menu_navbar').hide()
				$('.close_order_view').show()
				$('.start_record').text(offset)
		  		$('.end_record').text(products.length)
			}
 		}, 900);
	});

	$(document).on('click', '.update_view', function(e){
		next_render = false;
		$('li#f_menu_toggle a').trigger('click')
		$('#render').trigger('click')
		$('#oe_main_menu_navbar').hide()
		$('.close_order_view').show()
		$('.start_record').text(offset)
		$('.end_record').text(products.length)
	});



	$(document).on('click', '.close-icon', function(e)
		{
			$(this).siblings().val('');
			$(this).hide();	
			$(this).siblings().change();
		});


	var OrderViewRenderer = AbstractRenderer.extend({
		className : "o_order_history_view",
		_render: function(res){
			var local_product = JSON.parse(localStorage.getItem("prod_list") || "[]");
			if(products == false && local_product.length > 0)
			{
				products = local_product
			}
			if(products == 'searchFalse')
			{
				products = []
			}
			if(res)
			{
				filter_products = res
			}
			else
			{
				filter_products = []
			}
			// check if model is not a customer view model then need to render 
			// both template by set next_render false
			if(location.hash)
			{
				if(location.hash.includes('order.history.view') == true)
				{
					next_render = false;
				}
			}
			if(next_render == false){
					this.$el.append(QWeb.render("headerTemplate", {
					'partners' : partner_list,
					'categories' : categories,
					'brands' : brands,
					}));
					this.$el.append(QWeb.render("orderHistoryTemplate", {
					'product_list' : products,
					'filter_products' : filter_products,
					'partner_info' : partner_info,
					'partners' : partner_list,
					'start_limit' : start_limit, 
    				'end_limit' : end_limit, 
    				'length' : length
				}));
				$('.o_order_history_view  .headers').last().remove()
				$('.o_order_history_view .containers').first().remove()
			}
			if(next_render == true)
			{
				this.$el.append(QWeb.render("orderHistoryTemplate", {
					'product_list' : products,
					'filter_products' : filter_products,
					'partner_info' : partner_info,
					'partners' : partner_list,
					'start_limit' : start_limit, 
    				'end_limit' : end_limit, 
    				'length' : length,
				}));
				$('.o_order_history_view .containers').first().remove()
			}
		var current_order_data = JSON.parse(localStorage.getItem("current_order_data") || "[]");
		$('.product_shop').html(current_order_data);
		return $.when();
		},

		events : {
			'click .dynamic_product' : '_added_product_to_card',
			'click .add_qty' : '_add_quantity',
			'click .remove_qty' : '_remove_quantity',
			'click .create_quotation' : '_create_sale_quotation',
			'click .added_product' : 'do_select_card_line',
			'click .number-char' : 'do_calcutation',
			'click .numpad-backspace' : 'remove_card_additions',
			'click .customer_orders' : 'check_order_history',
			'click .remove_card' : 'remove_all_card',
			'click .removeSingle' : 'remove_single_card',
			'change #filter' : 'call_product_groupBy_method',
			'keyup #searchProduct' : "searchProducts",
			'change #customerIds' : 'get_partner', 
			'click #render' : "call_render",
			'click .save_note' : "save_order_note",
			'click .offline_quotation' : 'save_offline_quotation',
			'click .previous_page' : 'get_previous_product',
			'click .next_page' : 'get_next_product',
			'click .searching > i' : 'remove_search_text',


		},

		remove_search_text : function(){
			$('#searchProduct').val('');
			$('.searching > i').removeClass('fa-times');
			$('.searching > i').addClass('fa-search');
			this.searchProducts();
		},

		
		get_previous_product : function()
		{
			self = this
			offset = $('.start_record').text() 
			offset = parseInt(offset) - limit

			var value = $('#customerIds').val()
			partner_id = $('#customer_list [value="' + value + '"]').data('id')
			if(partner_id == undefined)
			{
				partner_id = false
			}
			if(offset >= 0)
			{
				if(navigator.onLine == true)
				{
				  	rpc.query({
					  	model : 'order.history.view',
					  	method : 'get_product_list',
					  	args : [id, offset, partner_id]
					}).then(function(res){
					  	products = res[0];
					  	start_limit = offset
				  		end_limit = offset + limit
					  	self._render();
				        return $.when(); 
					})
				}
				else
				{
					var prod_list = JSON.parse(localStorage.getItem("prod_list") || "[]");
					products = prod_list.slice(parseInt(offset),parseInt(offset) + limit);
					start_limit = offset
					end_limit = offset + limit
					self._render();
					return $.when();
				}
			}
		},

		get_next_product : function()
		{
			self = this
			offset = $('.end_record').text()
			var value = $('#customerIds').val()
			partner_id = $('#customer_list [value="' + value + '"]').data('id')
			if(partner_id == undefined)
			{
				partner_id = false
			}
			if(offset != $('.total_record').text())
			{
				if(navigator.onLine == true)
				{
					offset = $('.end_record').text() 
				  	rpc.query({
					  	model : 'order.history.view',
					  	method : 'get_product_list',
					  	args : [id, parseInt(offset), partner_id]
					}).then(function(res){
					  	products = res[0];
				        start_limit = offset
				  		end_limit = parseInt(offset) + res[0].length
					  	self._render();
				        return $.when();
					})
				}
				else
				{
					var prod_list = JSON.parse(localStorage.getItem("prod_list") || "[]");
					products = prod_list.slice(parseInt(offset),parseInt(offset)+limit);
					start_limit = offset
					end_limit = parseInt(offset) + products.length
					self._render();
					return $.when();
				}
			}
		},
		// save offline quotation
		save_offline_quotation : function()
		{
			self = this
			if(navigator.onLine == true)
			{
				var offline_order = JSON.parse(localStorage.getItem("order_data") || "[]");
				rpc.query({
					model : 'order.history.view',
					method : 'save_offline_quotation',
					args : [id, offline_order]
				}).then(function(res){
					if(res != undefined)
					{
		        		localStorage.setItem("order_data", JSON.stringify([]));
		        		$(".quotation").show();
					    setTimeout(function(){
					        $(".quotation").hide();
					    }, 1000);
						self._render();
		        		return $.when(); 
					}
				});
			}
		},

		// trigger render
		call_render : function(event, filter_products)
		{
			next_render = true;
			self = this
			self._render(filter_products);
		    return $.when(); 
		},

		// get partner data
		get_partner : function()
		{	

			self = this
			var value = $('#customerIds').val()
			partner_id = $('#customer_list [value="' + value + '"]').data('id')
			if(partner_id != undefined)
			{
				if(navigator.onLine == true) //when online
				{
					rpc.query({
			        model: 'order.history.view',
			        method: 'get_partner_data',
			        args: [id, offset, partner_id],
				    }).then(function(res) {
				    	if(res)
				    	{
					    	$('.street').text(res[0]['street'])
					    	$('.street2').text(res[0]['street2'])
					    	$('.city').text(res[0]['city'])
					    	$('.country_id').text( res[0]['country_id'])
					    	$('.phone').text(res[0]['mobile'])
				    	}
				 		var all_prod = $(".product-list").children()
				 		if(res[1].length > 0)
				 		{
					 		for(var p=0; p<all_prod.length; p++)
					 		{
					 			if(all_prod[p].classList.contains("dynamic_product") == true)
					 			{
						 			var product = res[1].filter(function(e) {
					                  return e.id == parseInt(all_prod[p].dataset.id)
					                });
					                if (product.length > 0)
					                {
					                	all_prod[p].lastElementChild.lastElementChild.innerText = product[0]['date']
					                }
					 			}
					 		}
				 		}
				 		else
				 		{
				 			for(var p=0; p<all_prod.length; p++)
					 		{
					 			if(all_prod[p].classList.contains("dynamic_product") == true)
					 			{
					                all_prod[p].lastElementChild.lastElementChild.innerText = ''
					 			}
					 		}
				 		}
				    });
				}
				else  //offline
				{
					$('.street').text('')
			    	$('.street2').text('')
			    	$('.city').text('')
			    	$('.country_id').text( '')
			    	$('.phone').text('')
			    	var all_prod = $(".product-list").children()
			 		for(var p=0; p<all_prod.length; p++)
			 		{
			 			if(all_prod[p].classList.contains("dynamic_product") == true)
				 		{
			 				all_prod[p].lastElementChild.lastElementChild.innerText = ''
			 			}
			 		}
				}
			}
		$('.close-icon').show();

		},


		// product search
		searchProducts : function()
		{
			self = this
			var input, filter, ul, li, a, i, txtValue;
		    input = document.getElementById("searchProduct");
		    filter = input.value.toUpperCase();
			var filterArr = filter.split(' ')
			var prod_list = JSON.parse(localStorage.getItem("prod_list") || "[]");
			// prod_list = prod_list.slice(0,10);
			if(filter)
			{
				var productList = prod_list.filter(function(e) {
					var is_all = []
		        	for(var j= 0;  j<filterArr.length; j++)
		        	{
			        	if(e.name.toUpperCase().includes(filterArr[j]) || e.barcode.toUpperCase().includes(filterArr[j]) || e.default_code.toUpperCase().includes(filterArr[j]))
			        	{
			        		is_all.push(true)
			        	}
			        	else 
				        {
				            is_all.push(false)
				        }
		        	}
		        	function allEqual(arr) {
					  return new Set(arr).size == 1;
					}
	                return allEqual(is_all) == true && is_all[0] == true
	            });

            	products = productList
            	if(products.length == 0)
            	{	
            		products = 'searchFalse'
            	}
			}
			else
			{
				products = old_products
			}
			self._render();
			$('.searching > i').removeClass('fa-search');
			$('.searching > i').addClass('fa-times');
			return $.when();
		},

		// call method for group by
		call_product_groupBy_method : function(event)
		{
		    self = this;
			var groupBy = $('#filter option:selected').text()
		    var select = []
            var selected = $('.octofilter-input').children()
            for(var chil=0; chil<= selected.length; chil++)
            {
	            if(selected[chil] != undefined)
	            {
	              selected[chil].classList.value == 'octofilter-label'
	              select.push(selected[chil].dataset)
	            }
            }
			var value = $('#customerIds').val()
			partner_id = $('#customer_list [value="' + value + '"]').data('id')
			if(partner_id == 'Select customer' && groupBy != 'Group By')
			{
				$('#customer_popup').modal('show');
			}
			else
			{
				if(groupBy == 'Group By')
				{
					next_render = true
					filter_products = []
					self._render();
			        return $.when();
				}
				else
				{
					if(navigator.onLine == true)    //online
					{
						rpc.query({
				        model: 'order.history.view',
				        method: 'compute_product_groupBy',
				        args: [id, partner_id, groupBy, select],
					    }).then(function(res){
					        filter_products = res
				        	next_render = true
							self._render(res);
					        return $.when();
					    });
					}
					else	//offline
					{
						var filter_list = []
						var select = _.filter(select,v => _.keys(v).length !== 0);
						var filter_brands = []
						var all_brand = JSON.parse(localStorage.getItem("brand_list") || "[]");
						all_brand.push(false)
						var prod_list = JSON.parse(localStorage.getItem("prod_list") || "[]");
						var all_categ = JSON.parse(localStorage.getItem("category_list") || "[]");
						all_categ.push(false)
						// compute product for seleted filter
						function compute_groupBy(select)
						{
							var prod_list = JSON.parse(localStorage.getItem("prod_list") || "[]");

							var child_categ = JSON.parse(localStorage.getItem('child_categ') || '[]')
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
			                    return categWithChild.includes(e.categ_id) || Brandlist.includes(e.brand)
			                });
			                $.each(filterObj, function() {
			                      this.filtered_by = 'Products'
			                      this.length = filterObj.length;
			                }); 
                        	prod_list = filterObj
                        	return prod_list
						}
						// do calculation for groupBy brand
						if(groupBy == 'Filter by Brand')
						{
       						prod_list = compute_groupBy(select)
       						if(prod_list < 1)
       						{
       							var prod_list = JSON.parse(localStorage.getItem("prod_list") || "[]");
       						}
							for(var b=0; b<all_brand.length; b++)
							{
								console.log(all_brand[b])
								var filterObj = prod_list.filter(function(e) {
								   return e.brand == all_brand[b];
								});
								filter_brands.push(filterObj)
								
								$.each(filterObj, function() {
		                          this.filtered_by = this.brand;
		                          this.length = filterObj.length;
		                      	});
							}
							filter_brands = filter_brands.filter(e => e.length) // remove blank list
				        	next_render = true
							self._render(filter_brands);
					        return $.when();
						}
						// do calculation for groupBy category
						if(groupBy == 'Filter by category')
						{
       						prod_list = compute_groupBy(select)
       						if(prod_list < 1)
       						{
       							var prod_list = JSON.parse(localStorage.getItem("prod_list") || "[]");
       						}

							for(var b=0; b<all_categ.length; b++)
							{
								console.log(all_categ[b])
								var filterObj = prod_list.filter(function(e) {
								   return e.categ_id == all_categ[b];
								});
								$.each(filterObj, function() {
		                          this.filtered_by = this.categ_id;
		                          this.length = filterObj.length;
		                      	});
								filter_list.push(filterObj)
							}
				        	next_render = true
							self._render(filter_list.filter(e => e.length));
					        return $.when();
						}
					}
				}
			}
		},

		// remove item from card one by one on selection
		remove_single_card : function(event)
		{
			$('.product_selected').remove()
			this.update_total_amount()
			var item_list = $('.added_product')
			if(item_list.length == 0)
			{
				$('.total').hide()
			}
		},

		// remove all item from shopping card and put empty
		remove_all_card : function(event)
		{
			$('.added_product').remove()
			$('.total').hide()
			// if(!localStorage.getItem('current_order_data')){
			var empty_html = '<div class="add_dynamic_product">' +
                    '<div id="add_dynamic_product">' +
                    '<div class="row" data-product_id="2" data-name="bag" data-list_price="1"></div><div class="row" data-product_id="1" data-name="bottal" data-list_price="100"></div><div class="row" data-product_id="3" data-name="keyborad" data-list_price="1"></div></div>' +
                    '<div class="row amount" style="display: block;">' +
                        '<div class="total pull-right" style="display: none;">' +
                            '<span>Total: </span> <span class="totalAmount">102.00₹</span>' +
                        '</div>' +
                    '</div>' +
                    '</div>' ;
	   		localStorage.setItem("current_order_data", JSON.stringify(empty_html)); /*set current data */
			// }
		},

		// check sale order created for selected customer
		check_order_history : function(event)
		{
			var value = $('#customerIds').val()
			partner_id = $('#customer_list [value="' + value + '"]').data('id')
			if(partner_id == undefined)
			{
				$('#customer_popup').modal('show');
			}
			else
			{	
				if(partner_id)
				{
					self = this ;
		            return self.do_action({
		                name : 'Select customer',
		                type: 'ir.actions.act_window',
		                view_type: 'list',
		                view_mode: 'list',
		                views: [[false, 'list']],
		                target: 'new',
		                res_model: 'sale.order',
		                domain : [['partner_id', '=', parseInt(partner_id)]]
		            });
				}
			}
		},

	
		// update price subtotal when update qty and price by calculator
		update_subtotal : function(qty, price)
		{
			if($('.product_selected').find('strong').hasClass('amount_price'))
			{
				var amount = (qty * price).toFixed(2)
				$('.product_selected').find('strong').text(amount)
			}
		},

		// remove quantity and amount which is added priviously
		remove_card_additions : function(event)
		{
			var price_code = $('.product_selected').find('code')
			var price = price_code.text()
			var qty_code = $('.product_selected').find('em')
			var qty = qty_code.text()
			if ($('.product_selected').find('em').hasClass('qty'))
			{
				if(String(parseInt(qty)).length < 2)
				{
					qty_code.text(parseFloat(0.00).toFixed(2))
					qty_code.removeClass('is_point')
					new_qty = 0.00
				}
				else
				{
					if(parseInt(qty.split('.')[1]) > 0)
					{
						qty_code.text(parseFloat(parseInt(qty)).toFixed(2))
					}
					else
					{
						new_qty = String(parseInt(qty)).slice(0,-1)
						new_qty = parseFloat(new_qty).toFixed(2)
						if(new_qty == "NaN")
						{
							new_qty = 0.00
							qty_code.removeClass('is_point')
						}
						qty_code.text(parseFloat(new_qty).toFixed(2))
					}
				}
				this.update_subtotal(new_qty, price)
				this.update_total_amount()
			}
		},

		//code for update quantity and price by calculator buttons, price subtotal
		//also will update on the basic of price or quantity values change. 
		do_calcutation : function(event)
		{
			var price_code = $('.product_selected').find('code')
			var qty_code = $('.product_selected').find('em')
			var price = price_code.text()
			var qty = qty_code.text()
			if (qty_code.hasClass('qty'))
			{
				var btn_data = event.currentTarget.textContent
				if(btn_data == '.')
				{
					qty_code.addClass('is_point')
				}
				if(qty_code.hasClass('is_point') == true)
				{
					var floats = String(parseInt(qty.split('.')[1]))
					if(floats.length < 2)
					{
						new_qty = parseFloat(parseInt(qty) + '.' + parseInt(qty.split('.')[1]) + parseInt(btn_data)).toFixed(2)
					}
				}
				if(qty_code.hasClass('is_point') == false)
				{
					new_qty = parseFloat(parseInt(qty) + btn_data).toFixed(2)
				}
				qty_code.text(new_qty)
				this.update_subtotal(new_qty, price)
				this.update_total_amount()
			}
		},

		// show selected card product when the product is add to the card
		do_card_selected : function(event)
		{
			$('.product_selected') 
             	.removeClass('product_selected')
                .addClass('added_product');
		},

		// select product card on click on any card product
		do_select_card_line : function(event)
		{
			$('.product_selected') 
             	.removeClass('product_selected')
                .addClass('added_product');
			event.currentTarget.classList.add("product_selected")
		},

		// add product quantity and amount on click on plus button
		_add_quantity : function(event)
		{
			var qty_code = $('.product_selected').find('em')
			var qty = parseFloat(qty_code.text())
			if ($('.product_selected').find('em').hasClass('qty'))
			{
				qty_code.text(parseFloat(qty + 1).toFixed(2))
				this.update_total_amount()
			}
		},

		// remove product quantity and amount on click on minus button
		_remove_quantity : function(event)
		{
			var qty_code = $('.product_selected').find('em')
			var qty = parseFloat(qty_code.text())
			if ($('.product_selected').find('em').hasClass('qty'))
			{
				qty_code.text(parseFloat(qty - 1).toFixed(2))
				this.update_total_amount()
			}
		},

		// update total price 
		update_total_amount : function(event)
		{
			$('.amount').show()
			var amount= $('.amount_price')
			var totalAmount = 0.00
			for(var am=0; am < amount.length; am++)
			{
				totalAmount = totalAmount + parseFloat(amount[am].textContent)
			}
			var symbol = $('#currency_symbol').val()
			var total_amount = (parseFloat(totalAmount)).toFixed(2) + symbol
			$('.totalAmount').text(total_amount)
		},

		// add product to the card on click on the product
		_added_product_to_card : function(event){
			$('.total').show()
			this.do_card_selected(event)
			var currency = event.currentTarget.dataset.currency  
			$('#currency_symbol').val(currency)
			var product_id = event.currentTarget.dataset.id
			var name = event.currentTarget.dataset.name
			var price = event.currentTarget.dataset.list_price

			var html = '<div class="row" data-product_id="'+product_id+'" data-name="'+name+'" data-list_price="'+price+'">'
			var update_html = '<div class="added_product product_selected">' +
			'<div class="col-md-12">' +
			'<b><span class="pull-left name">'+name+'</span></b>' +
			'<span class="price pull-right"><strong class="amount_price">'+(parseFloat(price).toFixed(2))+'</strong><b>'+currency+'</b></span>' +
			'<div class="col-md-12">'+
			'<span class="pull-left"><em class="qty">1.00</em> Unit(s) at <i><code class="unit_price">'+(parseFloat(price).toFixed(2))+'</code></i> '+currency+' / Unit(s)</span>'+
			'</div>' +
			'</div></div>'
			var end = '</div>'
			var append_html = html + update_html + end 
            var div = $("[data-product_id='" + $.trim(product_id) + "']")
            if(div.length > 0)
            {
				div.html(update_html)
            }
            else
            {
				$('#add_dynamic_product').append(append_html)
            }
			this.update_total_amount()
			/*this will store the current order data temporary in local storage **/
			var current_order = $('.product_shop').html();
			localStorage.setItem("current_order_data", JSON.stringify(current_order))
		},

		//get product data to create quotation and call method for create quotation
		_create_sale_quotation : function(event)
		{
			self = this
			var value = $('#customerIds').val()
			partner_id = $('#customer_list [value="' + value + '"]').data('id')

			if(partner_id == undefined)
			{
				$('#customer_popup').modal('show');
			}
			else
			{
				if(partner_id)
				{
					offset = $('.start_record').text()
					var product_info = []
					var productHtml = $('.added_product')
					if(productHtml.length > 0)
					{
						for(var p=0; p< productHtml.length; p++)
						{
							var product_id = productHtml[p].parentElement.dataset.product_id
							var qty = productHtml[p].firstElementChild.lastElementChild.firstElementChild.firstElementChild.textContent
							product_info.push({'product_id' : product_id,
							'qty' : qty
							})
						}
						if(navigator.onLine == true)
						{
							var offline_order = JSON.parse(localStorage.getItem("order_data") || "[]");
							rpc.query({
								model : 'order.history.view',
								method : 'create_sale_quotation',
								args : [id, product_info, partner_id, offline_order, offset]
							}).then(function(res){
								$('#order_id').val(res[0])
								products = res[1][0]
								$('#add_note').modal('show');
								$('.added_product').remove()
								$('.total').hide()
								$(".quotation").show();
							    setTimeout( function(){
							      $(".quotation").hide();
							    }, 1000);
				        		localStorage.setItem("order_data", JSON.stringify([]));
								self._render();
				        		return $.when(); 
							});
						}
						else
						{//make store offline order to local storage
							var order_data = {
							'id' : id,
							'product_info' : product_info,
							'partner_id' : partner_id
							}
							var order = JSON.parse(localStorage.getItem("order_data") || "[]");
							order.push(order_data)
							localStorage.setItem("order_data", JSON.stringify(order))
							alert('Quotation is save')
							$('.added_product').remove()
							$('.total').hide()
							$('#add_note').modal('show');
						}
						product_info = []
					}
				}
			}
		},

		// save quotation note which quotation is created recently
		save_order_note : function(event)
		{
			var note = $('#note').val()
			if(navigator.onLine == true)
			{
				var order_id = $('#order_id').val()
				rpc.query({
			  	model : 'order.history.view',
			  	method : 'save_order_note',
			  	args : [id, order_id, note]
				}).then(function(res){
					$('#note').val('')
				})
			}
			else{
				var order = JSON.parse(localStorage.getItem("order_data") || "[]");
				Object.assign(order[order.length-1], {'note': $('#note').val()});
				localStorage.setItem("order_data", JSON.stringify(order));
			}


		},
	});
	

	var OrderViewModel = AbstractModel.extend({});
	var OrderHistory = AbstractView.extend({
	config: {
	Model: OrderViewModel,
	Controller: OrderViewController,
	Renderer : OrderViewRenderer,
	},

	viewType : 'order_history_view',
	});

	viewRegistry.add('order_history_view',OrderHistory);
	return OrderHistory;

});