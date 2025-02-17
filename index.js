const { chromium } = require("playwright");

async function sortHackerNewsArticles() {
  // Launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Go to Hacker News newest articles page
  await page.goto("https://news.ycombinator.com/newest");
  
  let articles = [];
  while (articles.length < 100) {
    // Extract article timestamps and titles
    const newArticles = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("tr.athing"));
      return rows.map(row => {
        const id = row.getAttribute("id");
        const title = row.querySelector("td.title > a")?.innerText || "";
        const ageElement = document.querySelector(`#score_${id} + span`);
        const age = ageElement ? ageElement.innerText : "";
        return { title, age };
      });
    });

    articles = articles.concat(newArticles);
    
    if (articles.length >= 100) break;

    // Click 'More' to load next set of articles
    const moreButton = await page.$("a.morelink");
    if (moreButton) {
      await moreButton.click();
      await page.waitForTimeout(2000); // Wait for new content to load
    } else {
      break; // No more pages available
    }
  }

  articles = articles.slice(0, 100); // Ensure we have exactly 100 articles

  // Validate articles are sorted from newest to oldest
  const sorted = articles.every((article, index, arr) => {
    if (index === 0) return true; // Skip first element
    return article.age <= arr[index - 1].age;
  });

  if (sorted) {
    console.log("✅ The articles are sorted correctly from newest to oldest.");
  } else {
    console.error("❌ The articles are NOT sorted correctly.");
  }

  await browser.close();
}

(async () => {
  await sortHackerNewsArticles();
})();
