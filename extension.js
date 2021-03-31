const puppeteer = require('puppeteer');
const path = require('path')
const loginHelper = require('../helpers/login.js')
const config = require('../config.json')
const expect = require('chai').expect;

let browser = null;
let page;

beforeEach(async () => {
    const pathToExtension = path.resolve('./build');

    browser = await puppeteer.launch({
        headless: false,
        defaultViewport: {
            width: 1024,
            height: 768
        },
        args: [
            `--disable-extensions-except=${pathToExtension}`,
            `--load-extension=${pathToExtension}`
        ]
    })

    page = await browser.newPage()
    await page.goto(config.baseUrl)

    // enable browser extension
    await page.evaluate(() => {
        localStorage.setItem('Tweddle-LiveAgent-IS_VISIBLE', 'true')
    })
    await page.reload({ waitUntil: ['networkidle0', 'domcontentloaded'] })

    await page.waitForSelector('[name=username]')
    await loginHelper.defaultLogin(page)
});

describe('Chrome Extension basic functionality:', () => {
    it ('Check if you are logged', async() => {
        const title = await page.evaluate(() => document.querySelector("div.Tabs__header-item--active").textContent.trim());
        console.log(title);
        expect(title).to.equal("Suggested");

    }).timeout(10000);

    it ('Check if you are logged out', async()=>{
        await page.evaluate(() => {
            document.querySelector('button.IconButton').click();
        });

        let div = await page.$('div.Menu > div.menu-item:last-of-type');
        div.click();

        await page.waitFor(3000);

        const name = await page.$eval('h4', el => el.textContent.trim())
        expect(name).to.equal("PubHub");

    }).timeout(10000);

    it('Switching between tabs: from Suggested to Search', async() => {
        let result;
        let search = await page.$('div.Tabs__header-item:last-of-type');
        search.click();
        await page.waitForSelector('form.Search__form');
        if (await page.$('form.Search__form') !== null)
            result = 'true';
        else
            result = 'false';
        expect(result).to.equal("true");
    });


    it('Switching between tabs: from Search to Suggested', async() => {
        let result;
        let search = await page.$('div.Tabs__header-item:last-of-type');
        search.click();
        await page.waitForSelector('form.Search__form');
        let suggested = await page.$('div.Tabs__header-item:first-of-type');
        suggested.click();
        await page.waitForSelector('div.SuggestedContent');
        if (await page.$('div.SuggestedContent') !== null)
            result = 'true';
        else
            result = 'false';
        expect(result).to.equal("true");
    });

    it('Clicking menu option Help/FAQ', async()=>{
      let result;
        await page.evaluate(() => {
            document.querySelector('button.IconButton').click();
        });
        let helpButton = await page.$('div.Menu > div.menu-item:first-of-type');
        const newPagePromise = new Promise(x => page.once('popup', x));
        await helpButton.click();
        const newPage = await newPagePromise;
        result = newPage.url();
        expect(result).to.equal("https://www.pubhub.help/faq");
    });

    it('Clicking menu option Submit Feedback', async() => {
        let result;
        await page.evaluate(() => {
            document.querySelector('button.IconButton').click();
        });
        let feedback = await page.$('div.Menu > div.menu-item:nth-of-type(2)');
        const newPagePromise = new Promise(x => page.once('popup', x));
        await feedback.click();
        const newPage = await newPagePromise;
        result = newPage.url();
        expect(result).to.equal("https://www.pubhub.help/feedback");
    })

    it("Check the possibility to minimize extension", async () =>{
        let result;
        await page.evaluate(() => {
            document.querySelector('[title="Minimize"]').click()
        });
        await page.waitForSelector('div.SuggestedContentMinimized');
        if (await page.$('div.SuggestedContentMinimized') !== null)
            result = 'true';
        else
            result = 'false';
        expect(result).to.equal("true");
    });

    it("Check the possibility to expand extension", async () =>{
        let result;
        await page.evaluate(() => {
            document.querySelector('[title="Minimize"]').click()
        });
        await page.waitForSelector('div.SuggestedContentMinimized');
        await page.evaluate(() => {
            document.querySelector('[title="Full view"]').click()
        });
        await page.waitForSelector('div.item-container');
        if (await page.$('div.item-container') !== null)
            result = 'true';
        else
            result = 'false';
        expect(result).to.equal("true");
    });
});

afterEach(async () => {
    await browser.close()
});