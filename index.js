const { chromium, firefox, webkit } = require('playwright');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
// Allows Script to be run on a schedule
// const cron = require('node-cron');

async function saveHackerNewsArticles(browserType) {
    let browser;
    try {
        // Launch browser
        browser = await browserType.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();

        // Go to Hacker News
        await page.goto("https://news.ycombinator.com");
        await page.waitForSelector('.athing', { timeout: 10000 });

        // Extract the top 10 articles
        const articles = await page.$$eval('.athing', rows => {
        return rows.slice(0, 10).map((row, index) => {
            const titleElement = row.querySelector('.titleline > a');
            const title = titleElement ? titleElement.innerText : 'No title';
            const link = titleElement ? titleElement.href : 'No link';
            return { rank: index + 1, title, link };
        });
        });

        // Define the CSV writer
        const csvWriter = createCsvWriter({
        path: `hacker_news_top_10_${browserType.name()}.csv`,
        header: [
            { id: 'rank', title: 'Rank' },
            { id: 'title', title: 'Title' },
            { id: 'link', title: 'Link' },
        ],
        append: false,
        });

        // Write the articles to the CSV file
        await csvWriter.writeRecords(articles);
        console.log(`Top 10 articles saved to hacker_news_top_10_${browserType.name()}.csv`);

        // Save data in JSON format
        fs.writeFileSync(`hacker_news_top_10_${browserType.name()}.json`, JSON.stringify(articles, null, 2));
        console.log(`Top 10 articles saved to hacker_news_top_10_${browserType.name()}.json`);

        return true; // Indicate success

    } catch (error) {
        // Log any errors
        console.error(`An error occurred with ${browserType.name()}:`, error.message);
        return false; // Indicate failure

    } finally {
        // Close the browser instance
        if (browser) {
            await browser.close();
        }
    }
}

// Function to run the script with fallback browsers
async function runWithFallbackBrowsers() {
    const browsers = [chromium, firefox, webkit];
    for (const browserType of browsers) {
        const success = await saveHackerNewsArticles(browserType);
        if (success) {
            break; // Exit the loop if the script runs successfully
        }
    }
}
  
  // Call the function to save Hacker News articles
(async () => {
    await runWithFallbackBrowsers();
})();

  // Schedule to run the script every day at 8:00 AM
/*
    cron.schedule('0 8 * * *', async () => {
        await runWithFallbackBrowsers();
    });
*/