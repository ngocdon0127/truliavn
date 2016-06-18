# -*- coding: utf-8 -*-

# Define here the models for your scraped items
#
# See documentation in:
# http://doc.scrapy.org/en/latest/topics/items.html

import scrapy


class DemoItem(scrapy.Item):
	# define the fields for your item here like:
	# name = scrapy.Field()
	
	address = scrapy.Field()
	bedrooms = scrapy.Field()
	bathrooms = scrapy.Field()
	# owner_name = scrapy.Field()
	# owner_addr = scrapy.Field()
	# owner_phone = scrapy.Field()
	owner_email = scrapy.Field()
	pass
