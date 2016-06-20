# coding=utf8
from scrapy import Spider
from scrapy.selector import Selector
from demo.items import DemoItem
import json

class DemoSpider(Spider):
	name = "demo"
	allowed_domains = ["batdongsan.com.vn"]
	start_urls = [
		"http://batdongsan.com.vn/cho-thue-can-ho-chung-cu-duong-nguyen-trai-phuong-thuong-dinh-prj-royal-city/ha-noi-noi-that-day-du-lh-0941913999-pr9610095",
	]

	def parse(self, response):
		# infos = Selector(response).xpath('//div[@class="left-detail"]/div')
		# for info in infos:
		# 	item = DemoItem()
		# 	arr = info.xpath('div[@class="right"]/text()').extract()
		# 	item['owner_email'] = arr
		# 	yield item
			# print '-----------'
			# print info.xpath('div[@class="right"]/text()').extract()
			# print '==========='

		# infors = Selector(response).xpath('//div[@class="right"]/text()')
		# for infor in infors:
		# 	item = Sta

		infos = Selector(response).xpath('//div[@class="left-detail"]/div')
		item = DemoItem()
		for info in infos:
			left = info.xpath('div[@class="left"]/text()').extract()[0].strip(' \r\t\n')
			print left
			if (left == unicode('Địa chỉ', 'utf8')):
				item['address'] = info.xpath('div[@class="right"]/text()').extract()[0].strip(' \r\t\n')
			elif (left == unicode('Số phòng ngủ', 'utf8')):
				item['bedrooms'] = info.xpath('div[@class="right"]/text()').extract()[0].strip(' \r\t\n')
			elif (left == unicode('Số toilet', 'utf8')):
				item['bathrooms'] = info.xpath('div[@class="right"]/text()').extract()[0].strip(' \r\t\n')
		yield item


