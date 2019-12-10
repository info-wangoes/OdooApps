# -*- coding: utf-8 -*-
{
    'name': "Stock Negative Quantity",
    'summary': """ Disallow negative stock """,
    'description': """ 

Stock Negative Quantity
========================

Disallow negative quantity when creating sale, purchse and inventory. 
---------------------------------------------------------------------""",

    'author': "Wangoes Technology",
    'website': "http://www.wangoes.com",
    'category': 'Sale Purchse Inventory',
    'version': '12.0.1.0',
    'images': ['static/description/banner.png'],


    'depends': ['base','sale','stock','purchase','sale_management',],
    'installable': True,
}