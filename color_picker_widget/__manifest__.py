{
    'name': 'Color Picker',
    'sequence': 20,
    'author': 'Wangoes technology',
    'summary': 'Sync between field and color picker.',
    'version': '1.0',
    'description': "Created widget called color_widget",
    'depends': ['web'],
    'website': "https://wangoes.com/",
    'images': ['static/description/banner.png'],
    'data': [
        'views/header.xml',      
    ],
    'qweb': ['static/src/xml/*.xml'],
    'installable': True,
    'application': True,
    'images': ['static/description/banner.png'],
    'license': 'OPL-1',
}
