const cheerio = require('cheerio');
const { puppetGetWebContentWithUserArgs } = require('./puppet');
const fs = require('fs-extra');
const dayjs = require('dayjs');
const isBetween = require('dayjs/plugin/isBetween');
const { resolve } = require('path');

dayjs.extend(isBetween);

const pureString = (str) => {
  return str.replace('/\n/g', '').replace('/  系列/g', '').trim();
};

function sortDataByDate() {
  const file = fs.readFileSync(
    resolve(__dirname, '../ithome2022/articles.json'),
    'utf-8'
  );
  let fileObject = JSON.parse(file);
  Object.keys(fileObject).forEach((key) => {
    fileObject[key] = fileObject[key].sort((pre, next) => {
      return (
        new Date(pre.updateTime).getTime() - new Date(next.updateTime).getTime()
      );
    });
  });
  fs.outputFile(
    resolve(__dirname, '../ithome2022/articles.json'),
    JSON.stringify(fileObject),
    (err) => {
      if (err) console.log(err);
    }
  );
}

async function writeFiles(dataArr = null) {
  const file = fs.readFileSync(
    resolve(__dirname, '../ithome2022/articles.json'),
    'utf-8'
  );
  //   console.log(JSON.parse(file));
  let fileObject = JSON.parse(file);

  dataArr.forEach((data) => {
    let { author } = data;
    if (!fileObject[author]) {
      fileObject[author] = [data];
    } else if (Array.isArray(fileObject[author])) {
      let set = new Set();
      let arr = [...fileObject[author], data];
      fileObject[author] = arr.filter((item) =>
        !set.has(item.title) ? set.add(item.title) : false
      );
    }
  });

  fs.outputFile(
    resolve(__dirname, '../ithome2022/articles.json'),
    JSON.stringify(fileObject),
    (err) => {
      if (err) console.log(err);
    }
  );
}

async function itHomeCrawler(dateRange = null) {
  const startTime = new Date().getTime();

  const url = 'https://ithelp.ithome.com.tw/2022ironman/web';

  const content = await puppetGetWebContentWithUserArgs(url);
  const $ = cheerio.load(content);
  const eles = $('span[class="pagination-inner"] a');

  let arr = [];
  for (let i = 0; i < eles.length; i++) {
    arr.push(eles.eq(i).text());
  }

  let pageTotal = arr[arr.length - 1];
  let dateRangeBreak = false;
  let crawlerPageCount = 0;

  for (let i = 0; i < pageTotal; i++) {
    if (dateRangeBreak) break;
    const pageStartTime = new Date().getTime();

    let perPageContent = await puppetGetWebContentWithUserArgs(
      `${url}?page=${i + 1}`
    );
    let $page = cheerio.load(perPageContent);
    let pageEles = $page('div[class="articles-box"]');

    // console.log(pageEles.length);
    let dataArr = [];

    for (j = 0; j < pageEles.length; j++) {
      let data = {
        author: pureString(pageEles.eq(j).find('.ir-list__name').text()),
        topic: pureString(pageEles.eq(j).find('.articles-topic').text()),
        title: pureString(pageEles.eq(j).find('.articles-title').text()),
        href: pageEles.eq(j).find('.articles-title').find('a').attr('href'),
        updateTime: pureString(pageEles.eq(j).find('.date').text()),
      };
      dataArr.push(data);

      if (
        Array.isArray(dateRange) &&
        !dayjs(data.updateTime).isBetween(
          dateRange[0],
          dateRange[1],
          'day',
          '['
        )
      ) {
        dateRangeBreak = true;
      }
    }

    console.log(dataArr);

    await writeFiles(dataArr);

    crawlerPageCount = i + 1;
    const pageEndTime = new Date().getTime();
    console.log(
      `page${i + 1}花費時間:${Math.floor(
        (pageEndTime - pageStartTime) / 1000
      )}秒`
    );
  }

  const endTime = new Date().getTime();
  console.log(
    `${crawlerPageCount} pages 共花費時間:${Math.floor(
      (endTime - startTime) / 1000
    )}秒`
  );

  sortDataByDate();
}

// itHomeCrawler(['2022-09-22', '2022-09-22']);

module.exports = {
  itHomeCrawler,
};
