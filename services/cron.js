require('dotenv').config();
const CronJob = require('cron').CronJob;

function startCron(task) {
  new CronJob({
    cronTime: process.env.CRONJOB_TIME,
    onTick: async function () {
      console.log(`開始執行爬蟲排程作業： ${new Date()}`);
      await task();
    },
    start: true,
    timeZone: 'Asia/Taipei',
  });
}

module.exports = {
  startCron,
};