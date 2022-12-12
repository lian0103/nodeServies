const dayjs = require('dayjs');
const { startCron } = require('./services/cron');
const { lineNotify } = require('./services/lineNotify');
const { jobsCrawler } = require('./services/jobsCrawler');
const fs = require('fs-extra');
const { resolve } = require('path');
const { flatJSON } = require('./jobs/flat');

startCron(async () => {
    console.log('啟動排程');
    await jobsCrawler();
    const file = fs.readFileSync(resolve(__dirname, `./jobs/data.json`), 'utf-8');
    const fileObject = JSON.parse(file);
    const msg = `爬取104最新資料共${Object.keys(fileObject).length}筆。更新時間:${dayjs().format(
        'YYYY-MM-DD hh:mm:ss'
    )}`;
    lineNotify(msg);
    flatJSON();
}, '0 30 8,17,21 * * *');

// async function run() {
//     console.log('啟動排程');
//     await jobsCrawler();
//     const file = fs.readFileSync(resolve(__dirname, `./jobs/data.json`), 'utf-8');
//     const fileObject = JSON.parse(file);
//     const msg = `爬取104最新資料共${Object.keys(fileObject).length}筆。更新時間:${dayjs().format(
//         'YYYY-MM-DD hh:mm:ss'
//     )}`;
//     lineNotify(msg);
//     flatJSON();
// }

// run();
