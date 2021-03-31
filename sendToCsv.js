const puppeteer = require('puppeteer');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
    path: 'GeneratedLeads.csv',
    header: [
        {id: 'name', title: 'Name'},
        {id: 'position', title: 'position'},
        {id: 'link', title: 'link'}
    ]
});
const csvFilePath='/Users/bohdan_antonenko/Documents/nodejs/maine cu - Лист2.csv';
const csv=require('csvtojson');


let scrape = async (list) => {
    const wsChromeEndpointurl = 'ws://127.0.0.1:9222/devtools/browser/0838a450-23cf-43df-adbf-3fb6ec59bfdb';
    const browser = await puppeteer.connect({
        browserWSEndpoint: wsChromeEndpointurl,
    });

    const page = await browser.newPage();

    await page.goto(`http://www.google.com/search?q=${list.companyName}+${list.title}`);
    await page.setViewport({ width: 1440, height: 714 });
    const link = await page.$('a[href*="linkedin.com/in"]');
    if (link) {
        await link.click();

    } else {
        page.close();
        return;
    }
    await page.waitFor(6000);
    const result = await page.evaluate(() => {
        let name = document.querySelector('#ember51 > div.ph5.pb5 > div.display-flex.mt2 > div.flex-1.mr5 > ul.pv-top-card--list.inline-flex.align-items-center > li.inline.t-24.t-black.t-normal.break-words').innerText;
        let position = document.querySelector('section.pv-top-card h2').innerText;
        return {
            name,
            position
        }

    });

    let url = page.url();
    result.link = `${url}`;

    page.close();
    return result;
};


csv()
    .fromFile(csvFilePath)
    .then((listOfCompanies)=>{
        console.log(listOfCompanies);

        (async function() {
            for await (let item of listOfCompanies) {
                await scrape(item).then((value) => {
                    let personInfo = [];
                    personInfo.push(value);
                    console.log(personInfo);

                    csvWriter
                        .writeRecords(personInfo)
                        .then(()=> console.log('The CSV file was written successfully'));


                })
            }
        })();
    });



