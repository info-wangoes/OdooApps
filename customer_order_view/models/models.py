# -*- coding: utf-8 -*-
from odoo import models, fields, api
from dateutil import relativedelta
from datetime import datetime
class customer_order_view(models.Model):
    _name = 'order.history.view'
    
    # save note on quotation which is created
    @api.multi
    def save_order_note(self, order_id, note):
        if order_id and note:
            order = self.env['sale.order'].browse(int(order_id))
            order.note = note

    @api.multi
    def compute_child_categ(self):
        categs = self.env['product.category'].search([])
        child_categ = []
        for categ in categs:
            read_group_res = self.env['product.template'].read_group([
            ('categ_id', 'child_of', categ.ids)], 
            ['categ_id'], ['categ_id'])
            name_categs = [(self.env['product.category'].browse(data['categ_id'][0]).name) for data in read_group_res]
            child_categ.append({categ.name : name_categs})
        return child_categ

    @api.multi
    def get_all_product(self):
        products = self.env['product.product'].search([])
        product_list = self.prepare_product_data(products)
        return product_list
        
    # get all product 
    @api.multi
    def get_product_list(self, offset, partner_id=False):
        if not offset:
            offset = 0
        length = len(self.env['product.product'].search([]))
        products = self.env['product.product'].search([], offset=int(offset), limit=80)
        product_list = self.prepare_product_data(products, partner_id)
        return [product_list, length]

    # prepare product dict
    @api.multi
    def prepare_product_data(self, products, partner_id=False):
        order_line = self.env['sale.order.line']
        product_list = []
        def _prodcut_data(product):
            latest_date = ''
            if partner_id:
                order_product = order_line.search([('product_id', '=', product.id), 
                ('order_partner_id', '=', int(partner_id))])
                if order_product:
                    date = order_product.mapped('create_date')
                    latest_date = max(date) if date else ''
            return {
            'id' : product.id,
            'name' : product.name,
            'list_price' : round(product.list_price),
            'image_medium' : product.image_medium,
            'categ_id' : product.categ_id.name,
            'brand' : product.brand_id.name,
            'date' : latest_date[:10] if latest_date else '',
            'qty_available' : product.qty_available ,
            'length' : len(products) if products else 0,
            'currency_id' : product.currency_id.symbol,
            'default_code': product.default_code if product.default_code else '',
            'barcode' : product.barcode if product.barcode else '',
            }
        return list(map(lambda product: _prodcut_data(product), products))
 
    @api.multi
    def save_offline_quotation(self, offline_order):
        if offline_order:
            for data in offline_order:
                order_line = []
                for product in data['product_info']:
                    if 'product_id' in product:
                        product_obj = self.env['product.product'].browse(int(product['product_id']))
                        order_line.append((0,0,{
                        'product_id' : product_obj.id,
                        'name' : product_obj.name,
                        'product_uom_qty' : product['qty'],
                        'price_unit' : round(product_obj.list_price),
                        'tax_id' : 0
                        }))
                vals = {
                'partner_id' : int(data['partner_id']),
                'order_line' : order_line
                }
                order = self.env['sale.order'].create(vals)
                order.note = data['note'] if 'note' in data else ''
            return order.id


    # create quatation after add product to the card
    @api.multi
    def create_sale_quotation(self, product_list, partner_id, offline_order, offset):
        if offline_order:
            self.save_offline_quotation(offline_order)
        order_line = []
        for product in product_list:
            if 'product_id' in product:
                product_obj = self.env['product.product'].browse(int(product['product_id']))
                order_line.append((0,0,{
                'product_id' : product_obj.id,
                'name' : product_obj.name,
                'product_uom_qty' : product['qty'],
                'price_unit' : round(product_obj.list_price),
                'tax_id' : 0
                }))
        vals = {
        'partner_id' : int(partner_id),
        'order_line' : order_line
        }
        order = self.env['sale.order'].create(vals)
        order.action_confirm()
        products = self.get_product_list(offset, int(partner_id))
        return [order.id, products]
        
    # get all partners 
    @api.multi
    def get_all_partner(self):
        partners = self.env['res.partner'].search([('customer', '=', True)])
        partner_list = [
        {'name' : partner.name, 
        'partner_id' : partner.id,
        'street' : partner.street if partner.street else '',
        'street2' : partner.street2 if partner.street2 else '',
        'city' : partner.city if partner.city else '',
        'state_id' : partner.state_id.name if partner.state_id else '',
        'country_id' : partner.country_id.name if partner.country_id else '',
        } 
        for partner in partners]
        return partner_list

    # get selected partner data
    @api.multi
    def get_partner_data(self, offset, partner_id):
        if partner_id:
            partner = self.env['res.partner'].search([('id', '=', int(partner_id))])
            products = self.get_product_list(offset, partner.id)
            order_product = [{'id' : prod['id'], 'date' : prod['date']} for prod in products[0] if prod['date']]
            partner_info = {
            'street' : partner.street if partner.street else '',
            'street2' : partner.street2 if partner.street2 else '',
            'city' : partner.city if partner.city else '',
            'state_id' : partner.state_id.name if partner.state_id.name else '', 
            'country_id' : partner.country_id.name if partner.country_id.name else '',
            'mobile' : partner.phone if partner.phone else '',
            }
            return [partner_info, order_product]
    
    @api.multi
    def make_product_list(self, products, filter_type, partner_id=False):
        order_line = self.env['sale.order.line']
        product_list = []
        def _prodcut_data(product):
            if filter_type == 'Filter by Brand':
                if product.brand_id.name != False:
                    filtered_by = product.brand_id.name
                else:
                    filtered_by = 'Product contains no brand' 
            else:
                filtered_by = product.categ_id.name
            latest_date = ''
            if partner_id:
                order_product = order_line.search([('product_id', '=', product.id), 
                ('order_partner_id', '=', int(partner_id))])
                if order_product:
                    date = order_product.mapped('create_date')
                    latest_date = max(date) if date else ''
            return {
            'id' : product.id,
            'name' : product.name,
            'list_price' : round(product.list_price),
            'filter_type' : filter_type,
            'image_medium' : product.image_medium,
            'filtered_by' : filtered_by,
            'date' : latest_date[:10] if latest_date else '',
            'qty_available' : product.qty_available,
            'length' : len(products) if products else 0,
            'currency_id' : product.currency_id.symbol,
            'default_code': product.default_code if product.default_code else '',
            'barcode' : product.barcode if product.barcode else '',
            }
        return list(map(lambda product: _prodcut_data(product), products))


    #Method for compute product on the basic of group selected 
    @api.multi
    def compute_product_groupBy(self, partner_id, filter_type, records):
        list_product = []
        filter_products = []
        productIds = False
        product_data = self.update_product_list(records, partner_id)
        if product_data:
            productIds = [self.env['product.product'].browse(dic['id']) for dic in product_data[0]]
        
        all_product = self.env['product.product'].search([])
        if filter_type == 'Filter by Brand':
            records = self.env['product.brand'].search([])
            def compute_brans(record):
                if not productIds:
                    products = self.env['product.product'].search([
                    ('brand_id', '=', record.id)])
                else:
                    products = [prod for prod in productIds if prod.brand_id.id == record.id]
                for prod in products:
                    list_product.append(prod)
                productList = self.make_product_list(products, filter_type, partner_id)
                return productList            
            productList = list(map(lambda record: compute_brans(record), records))
            filter_products = productList

            # product which does not contains brand
            if not productIds:
                products = [prod for prod in all_product if prod not in list_product]
            else:
                products = [prod for prod in productIds if prod not in list_product]
            productNoBrand = self.make_product_list(products, filter_type, partner_id)
            filter_products.append(productNoBrand)

        if filter_type == 'Filter by category':
            records = self.env['product.category'].search([])
            def compute_category(record):
                if not productIds:
                    products = self.env['product.product'].search([
                    ('categ_id', '=', record.id)])
                else: 
                    products = [prod for prod in productIds if prod.categ_id.id == record.id]
                productList = self.make_product_list(products, filter_type, partner_id)
  
                return productList            
            productList = list(map(lambda record: compute_category(record), records))
            filter_products = productList

        filter_products =  [p for p in filter_products if p]
        if filter_products == []:
            filter_products = 'No data'
        return filter_products

    #get all category and brand
    @api.multi
    def get_records(self):
        categories = self.env['product.category'].search([])
        brands = self.env['product.brand'].search([])
        location = self.env['location.sellable'].search([])
        categories = [record.name for record in categories]
        brands = [record.name for record in brands]
        location =[record.location for record in location]
        records = [categories, brands,location]
        return records

    # compute category ids on the basic of category name seleted in view filter
    @api.multi
    def get_category_records(self, records):
        all_category = []
        def category_records(record):
            if 'value' in record:
                if record['category'] == 'Category': #if brand dict will get
                    categ = self.env['product.category'].search([('name', '=', record['value'])])
                    read_group_res = self.env['product.template'].read_group([('categ_id', 'child_of', categ.ids)], ['categ_id'], ['categ_id'])
                    categs = [(data['categ_id'][0]) for data in read_group_res]
                    return categs
        all_category = list(map(lambda record:category_records(record), records))
        all_category = [item for sublist in all_category if sublist != None for item in sublist]
        all_category = list(dict.fromkeys(all_category))
        return all_category
    
    # compute brand ids on the basic of brand name seleted in view filter
    @api.multi
    def get_brand_records(self,records):
        all_brand = []
        def brand_records(record):
            if 'value' in record:
                if record['category'] == 'Brand': 
                    brand = self.env['product.brand'].search(
                    [('name', '=', record['value'])])
                    return brand.id
        all_brand = list(map(lambda record:brand_records(record), records))
        all_brand = [brand for brand in all_brand if brand != None]
        return all_brand

    @api.multi
    def get_location_records(self,records):
        all_location = []
        def location_records(record):
            if 'value' in record:
                if record['category'] == 'Location': 
                    location = self.env['location.sellable'].search(
                    [('location', '=', record['value'])])
                    return location.id
        all_location = list(map(lambda record:location_records(record), records))
        all_location = [location for location in all_location if location != None]
        return all_location
           
    # get orders product for selected customer
    @api.multi 
    def check_order_product(self, orders):
        order_product = []
        for order in orders:
            if order.order_line:
                for line in order.order_line:
                    order_product.append(line.product_id)
        return order_product

    # check products which never sold for selected customer
    @api.multi
    def product_naver_sold(self, partner_id):
        orders = self.env['sale.order'].search([('partner_id', '=', int(partner_id))])
        if partner_id:
            order_product = self.check_order_product(orders)
        products = self.env['product.product'].search([])
        products = [prod for prod in products if prod not in order_product]
        return products        
            
    # check products which not sold for selected customer in last 6 month
    @api.multi
    def product_not_Sold6Month(self, partner_id):
        products = self.env['product.product'].search([])
        orders = self.env['sale.order'].search([('partner_id', '=', int(partner_id))])
        current_date = datetime.now()
        end_date = current_date - relativedelta.relativedelta(months=6)
        orders = self.env['sale.order'].search([
                ('partner_id', '=', int(partner_id)),
                ('create_date', '<=', str(current_date)[:19]),
                ('create_date', '>=', str(end_date)[:19])])
        order_product = self.check_order_product(orders)
        products = [prod for prod in products if prod not in order_product]
        return products
            
    # check products which sold for selected customer in last 6 month
    @api.multi
    def product_Sold6Month(self, partner_id):
        products = self.env['product.product'].search([])
        orders = self.env['sale.order'].search([('partner_id', '=', int(partner_id))])
        current_date = datetime.now()
        end_date = current_date - relativedelta.relativedelta(months=6)
        orders = self.env['sale.order'].search([
                ('partner_id', '=', int(partner_id)),
                ('create_date', '<=', str(current_date)[:19]),
                ('create_date', '>=', str(end_date)[:19])])
        order_product = self.check_order_product(orders)
        order_product = list(dict.fromkeys(order_product))
        products = [product for product in order_product]
        return products
        
    # check products which new arrival 
    @api.multi
    def new_arrival_products(self):
        products = self.env['product.product'].search([('is_arrival', '=', True)])
        return products

    # check product calegary and brands 
    @api.multi
    def check_categoriesBrands(self, productList, brands, categories):
        if brands or categories:
            if not brands or not categories:
                products = [product for product in productList
                if product.categ_id.id in categories or 
                product.brand_id in brands]
            elif brands and categories:
                products = [product for product in productList 
                if product.categ_id.id in categories and 
                product.brand_id in brands]
        else:
            products = productList
        return products

    # send filter product data on the template
    @api.multi
    def update_product_list(self, records, partner_id):
        filter_products = []
        products = []
        categories = self.get_category_records(records)
        brands = self.get_brand_records(records)
        locations = self.get_location_records(records)
        typeC = [dic['category'] for dic in records if 'value' in dic]
        if 'Other' in typeC:
           typeVal = [dic['value'] for dic in records if 'value' in dic]

        # filters = ['NeverSold', 'Sold6Month', 'NotSold6Month', 'NewArrival']
        # check =  all(item not in typeC for item in filters)
        if categories or brands or locations or typeC:
            if len(set(typeC))==1 and 'Other' not in typeC:
                products = self.env['product.product'].search(['|','|', 
                ('categ_id', 'in', categories), 
                ('brand_id', 'in', brands),
                ('location_sellable', 'in', locations)])
            else:
                products = self.env['product.product'].search([
                ('categ_id', 'in', categories), 
                ('brand_id', 'in', brands),
                ('location_sellable', 'in', locations)])
                
                if 'Other' not in typeC:
                    products = products
                else:
                    if 'Product which never sold' in typeVal:
                        if not partner_id:
                            return 'select partner'
                        productList = self.product_naver_sold(partner_id)
                        products = self.check_categoriesBrands(productList, brands, categories)
                    
                    if 'Product which sold in last 6 month' in typeVal:
                        if not partner_id:
                            return 'select partner'
                        productList = self.product_Sold6Month(partner_id)
                        products = self.check_categoriesBrands(productList, brands, categories)

                    if 'Product did not sold last 6 month' in typeVal:
                        if not partner_id:
                            return 'select partner'
                        productList = self.product_not_Sold6Month(partner_id)
                        products = self.check_categoriesBrands(productList, brands, categories)

                    if 'New arrival item this month' in typeVal:
                        productList = self.new_arrival_products()
                        products = self.check_categoriesBrands(productList, brands, categories)
            filters = self.prepare_product_data(products, partner_id)
            if filters:
                filter_products.append(filters) #append list inside list for data match inside qweb
            if filter_products == []:
                filter_products = 'No data'
        else:
            filter_products = False
        return filter_products


        

       
        
  