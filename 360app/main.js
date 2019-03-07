const http = require('http')
const cheerio = require('cheerio')
const request = require('request')
const fs = require('fs')
const ProgressBar = require('progress')
let url = 'http://zhushou.360.cn/list/?page='
let flag = 1 // 当前页
let data = [] // 爬取到的数据
let page = 10 // 爬取页数
let total = page * 49 // 爬取总条数
let isDownload = true // 是否下载apk
let apkCount = 0 // apk下载数量

let bar = new ProgressBar('爬取进度[:bar] :percent :elapsed秒', {
  head: '🕷',
  complete: '=',
  incomplete: ' ',
  width: 20,
  total: total // 总进度 tick调用一次默认进度加1
})
console.log('\x1B[32m%s\x1B[0m', 'Crawlers start')
bar.tick(0)
getHtml(flag)

function getData(html) {
  let $ = cheerio.load(html)
  let list = $('#iconList li')
  list.each(function (item) {
    let obj = formatUrl($(this).find('.dbtn').attr('href'))
    data.push(obj)
    bar.tick()
  })
}

function formatUrl(url) {
  let str = url.replace('zhushou360://', '')
  let arr = str.split('&')
  let data = {}
  arr.forEach(item => {
    let keyVakue = item.split('=')
    data[keyVakue[0]] = keyVakue[1]
  })
  return data
}

function saveData(data) {
  fs.appendFile(__dirname + '/data.json', JSON.stringify(data, "", "\t"), 'utf-8', function (err) {
    if (err) {
      console.log(err, 'err: 文件写入错误！');
    }
    if (isDownload) {
      console.log('\x1B[32m%s\x1B[0m', 'Apk download start')
      download(0)
    }
  })
}

function download(i) {
  let obj = data[i]
  http.get(obj.url, function (response) {
    response.setEncoding('binary'); //二进制binary
    let binaryData = '';
    response.on('data', function (res) { //加载到内存
      binaryData += res;
    }).on('end', function () { //加载完
      fs.writeFile(__dirname + '/apks/' + obj.name + '.apk', binaryData, "binary", function () {
        apkCount ++
        let scale = (apkCount / data.length * 100).toFixed(2) + '%'
        console.log('\x1B[32m%s\x1B[0m', obj.name + '  ' + (binaryData.length/1024/1024).toFixed(2) + 'M  ✔  总进度' + scale)
        data[i+1] && download(i+1)
        if (i === data.length-1) {
          console.log('下载完成')
        }
      });
    })
  })
}

function getHtml(n) {
  request(url + n, function (err, res, body) {
    if (!err && res.statusCode == 200) {
      getData(body)
      flag++;
      if (flag > page) return saveData(data);
      getHtml(flag);
    } else {
      console.log('err: 请求发生错误！')
    }
  })
}
