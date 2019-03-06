var cheerio = require('cheerio')
var request = require('request')
var fs = require('fs')
var ProgressBar = require('progress')
var url = 'http://zhushou.360.cn/list/?page='
var flag = 1
var data = []
var page = 10 // 爬取页数
var total = page * 49 // 爬取总条数spider

var bar = new ProgressBar('爬取进度[:bar] :percent :elapsed秒', {
  head: '🕷',
  complete: '=',
  incomplete: ' ',
  width: 20,
  total: total
})

var filterHtml = function (html) {
  var $ = cheerio.load(html)
  var list = $('#iconList li')
  list.each(function (item) {
    let obj = formatUrl($(this).find('.dbtn').attr('href'))
    data.push(obj)
    bar.tick()
  })
}


var formatUrl = function (url) {
  let str = url.replace('zhushou360://', '')
  let arr = str.split('&')
  let data = {}
  arr.forEach(item => {
    let keyVakue = item.split('=')
    data[keyVakue[0]] = keyVakue[1]
  })
  return data
}

var filltxt = function (text) {
  fs.appendFile(__dirname + '/data.json', text, 'utf-8', function (err) {
    if(err){
      console.log(err, 'err');
    }
  })
}

var getHtml = function (n) {
  request(url + n, function (err, res, body) {
    if (!err && res.statusCode == 200) {
      filterHtml(body)
      flag ++;
      if (flag > page) return filltxt(JSON.stringify(data,"","\t"));
      getHtml(flag);
    } else {
      console.log('err')
    }
  })
}

getHtml(flag)