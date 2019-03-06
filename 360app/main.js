const cheerio = require('cheerio')
const request = require('request')
const fs = require('fs')
const ProgressBar = require('progress')
let url = 'http://zhushou.360.cn/list/?page='
let flag = 1 // 当前页
let data = [] // 爬取到的数据
let page = 10 // 爬取页数
let total = page * 49 // 爬取总条数spider

let bar = new ProgressBar('爬取进度[:bar] :percent :elapsed秒', {
  head: '🕷',
  complete: '=',
  incomplete: ' ',
  width: 20,
  total: total // 总进度 tick调用一次默认进度加1
})

getHtml(flag)

function getData (html) {
  let $ = cheerio.load(html)
  let list = $('#iconList li')
  list.each(function (item) {
    let obj = formatUrl($(this).find('.dbtn').attr('href'))
    data.push(obj)
    bar.tick()
  })
}

function formatUrl (url) {
  let str = url.replace('zhushou360://', '')
  let arr = str.split('&')
  let data = {}
  arr.forEach(item => {
    let keyVakue = item.split('=')
    data[keyVakue[0]] = keyVakue[1]
  })
  return data
}

function saveData (text) {
  fs.appendFile(__dirname + '/data.json', text, 'utf-8', function (err) {
    if(err){
      console.log(err, 'err: 文件写入错误！');
    }
  })
}

function getHtml (n) {
  request(url + n, function (err, res, body) {
    if (!err && res.statusCode == 200) {
      getData(body)
      flag ++;
      if (flag > page) return saveData(JSON.stringify(data,"","\t"));
      getHtml(flag);
    } else {
      console.log('err: 请求发生错误！')
    }
  })
}
