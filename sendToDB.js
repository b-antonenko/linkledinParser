const puppeteer = require('puppeteer');

const csvFilePath='/Users/bohdan_antonenko/Documents/nodejs/maine cu - Лист2.csv';
const csv=require('csvtojson');

const sqlite = require('sqlite3').verbose();
let db = new sqlite.Database('/Users/bohdan_antonenko/Documents/nodejs/first.db');


let scrape = async (list) => {
    const wsChromeEndpointurl = 'ws://127.0.0.1:9222/devtools/browser/5c3a5d9e-767c-4ab4-b508-d95acefb8fe5';
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
                    console.log(value);
                    let dataArr = Object.values(value);
                    let name = dataArr[0];
                    let position = dataArr[1];
                    let link = dataArr[2];
                    db.run(`INSERT INTO contacts(name, position, link) VALUES ("${name}", "${position}", "${link}")`, function (err, row) {
                        if (err) {
                            console.log(err.message);
                        }

                        console.log("success");
                    });

                })
            }
        })();
    });



