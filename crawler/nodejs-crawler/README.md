# Crawl houses' data from batdongsan.com.vn

- Config HOUSE_TYPE and HOUSE_FOR in crawl-exact-urls.js and run ```node crawl-exact-urls.js``` to generate batdongsan1.json
- Run ```node crawl-urls.js``` to generate file houses.json
- Run ```npm start``` to crawl data and save to file data.json
- Run ```node crawl-geo.js``` to modify Geo location of houses in data.json