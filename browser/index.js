const puppeteer = require("puppeteer");
const path = require("path");
const { web } = require("webpack");
const { timeout } = require("puppeteer");

const {
  sleep,
  fetchData,
  getRandomInteger,
  searchKeys2Array,
  getAvailableClicksByDay,
  getPercentArray,
} = require(path.join(__dirname, "./helper"));

const { API_URL, MAX_SCROLL_DEPTH } = require(path.join(__dirname, "./config"));

let _config;

const smoothScroll = async (page, targetY, duration = 1000) => {
  await page.evaluate(
    (targetY, duration) => {
      return new Promise((resolve) => {
        const start = window.scrollY;
        const startTime = performance.now();

        const animateScroll = (currentTime) => {
          const elapsedTime = currentTime - startTime;
          const progress = Math.min(elapsedTime / duration, 1);
          const easeInOut =
            progress < 0.5
              ? 4 * progress * progress * progress
              : (progress - 1) * (2 * progress - 2) * (2 * progress - 2) + 1;
          window.scrollTo(0, start + (targetY - start) * easeInOut);

          if (progress < 1) {
            requestAnimationFrame(animateScroll);
          } else {
            resolve();
          }
        };

        requestAnimationFrame(animateScroll);
      });
    },
    targetY,
    duration
  );
};

const moveMouse = async (page) => {
  try {
    const dimensions = await page.evaluate(() => {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    });

    const scrollDepth = _config.scrollDepth;
    const scrollDepthCount = Math.floor((MAX_SCROLL_DEPTH * Number(scrollDepth)) / 100);

    for (let i = 0; i < scrollDepthCount; i++) {
      const randomX = Math.floor(Math.random() * dimensions.width);
      const randomY = Math.floor(Math.random() * dimensions.height);
      await page.mouse.move(randomX, randomY, { delay: 100 });

      await page.evaluate(() => {
        window.scrollBy(0, document.body.scrollHeight / 10);
      });
      await sleep(2000);

      console.log("page scolled:", i + 1, "time(s) and Mouse moved in the background:", randomX, randomY);
    }
  } catch (error) {
    console.error(`Erorr in moveMouse:`, error.message);
    await page.close();
  }
};

const navigateMenu = async (page) => {
  const websiteUrl = _config.targetUrls[getRandomInteger(0, _config.targetUrls.length - 1)];
  console.log('this is target website', websiteUrl)
  const menus = await page.$$(`a[href^="${websiteUrl}"]`);
  const menu = menus[0];
  try {
    console.log(`Menu ${await (await menu.getProperty("textContent")).jsonValue()} clicked`);
    await menu.evaluate((b) => b.click());
    await sleep(500);
  } catch (error) {
    console.log(`Error clicking ${menu}:`, error.message);
  }
};

const navigateWebsite = async (page) => {
  try {
    console.log("running navigatewebsite function...")
    const pagesPerSession = Number(_config.pagesPerSession);
    await moveMouse(page);
    await sleep(1000);

    for (let i = 1; i < pagesPerSession; i++) {
      await navigateMenu(page);
      await page.waitForNavigation();
      await moveMouse(page);
      await sleep(1000);
    }
    await page.close();
  } catch (error) {
    console.error(`Erorr in navigateWebsite:`, error.message);
    await page.close();
  }
};

const searchTargetWebsite = async (page, searchKey) => {
  try {
    const ignoreButton = await page.waitForSelector('#L2AGLb', { timeout: 1000 }).catch(() => {
      console.log("ignoreButton not found, proceeding without clicking");
    });
    if (ignoreButton) {
      await ignoreButton.click();
    }
    console.log("this is searchKey:", searchKey)
    const searchBar = await page.$("textarea");
    if (!searchBar) {
      throw new Error("Search bar not found on Goolgle page");
    }
    await searchBar.type(searchKey, { delay: 50 });
    await page.keyboard.press("Enter");
    // Wait for navigation with a custom timeout
    await page.waitForNavigation({ timeout: 30000, waitUntil: "domcontentloaded" }).catch(() => {
      console.log("Navigation took too long, proceeding anyway;")
    });

    const dimensions = await page.evaluate(() => {
      return {
        height: document.body.scrollHeight,
      };
    });

    let pageNumber = 1;
    // const urlIndex = getRandomInteger(0, _config.websiteUrl.length - 1);
    while (true) {
      try {
        for (const url of _config.websiteUrl) {
          console.log('this is target url', url)
          const targetElement = await page.$$(`a[href^="${url}"]`);

          if (targetElement.length > 0) {
            await sleep(3000);
            await targetElement[0].click();
            await page.waitForNavigation({ timeout: 30000, waitUntil: "domcontentloaded" }).catch(() => {
              console.log("Target URL navigation failed, continuing");
            });
            await sleep(2000);
            await navigateWebsite(page);
            return; // Exit after successfully navigating to a matching URL
          }
        }
        // If no target URL is found, scroll and check for next page 
        await smoothScroll(page, dimensions.height, 5000);
        const nextPageLink = await page.$(`a[aria-label="Page ${pageNumber + 1}"]`);
        if (nextPageLink) {
          await nextPageLink.click();
          await page.waitForNavigation({ timeout: 30000, waitUntil: "domcontentloaded" }).catch(() => {
            console.log("Pagination navigation failed, continuing");
          });
          pageNumber++;
          if (pageNumber === 7) {
            await navigateWebsite(page);
            break;
          }
        } else {
          await navigateWebsite(page);
          break;
        }
      }
      catch (error) {
        console.error(`Error processing :`, error.message)
        // break;
      }
    }
  } catch (error) {
    console.error(`Error in searchTargetWebsite:`, error.message)
    await page.close();
  }
}
const executeProfile = async (profileId, searchKey) => {
  let browser;
  try {
    const response = await fetchData(`${API_URL}/profile/start/${profileId}`);
    if (!response?.data?.websocket_link) {
      throw new Error(`Invalid response for profileId: ${profileId}`);
    }

    browser = await puppeteer.connect({
      browserWSEndpoint: response.data.websocket_link,
      defaultViewport: null,
    });
    const pages = await browser.pages();
    const page = pages[0];
    await page.goto("https://google.com");
    await searchTargetWebsite(page, searchKey)
    // await browser.close();
  } catch (error) {
    console.error(`Error in executeProfile for profileId ${profileId}:`, error.message);
    if (browser) await browser.close(); // Close browser if it exists
  }
};

const run = async (config) => {
  _config = config;
  try {
    const response = await fetchData(`${API_URL}/list`);
    const profiles = response?.data;
    if (!profiles || typeof profiles !== "object" || Object.keys(profiles).length === 0) {
      throw new Error("No valid profiles available");
    }

    let searchKeys = searchKeys2Array(config.keywords);
    const availableClicks = getAvailableClicksByDay(config);
    const mobileSessionRateArr = getPercentArray(config.mobileSessionRate, "mobileSessionRate");

    for (let i = 0; i < availableClicks; i++) {
      const deviceType = mobileSessionRateArr[getRandomInteger(0, 100)];
      const filteredProfiles = Object.entries(profiles)
        .filter(([_, profile]) => profile.tags?.includes(deviceType))
        .map(([key, profile]) => ({ [key]: profile }));
      if (filteredProfiles.length === 0) {
        console.log(`No profiles found for device type: ${deviceType}`);
        continue;
      }

      const profile = filteredProfiles[getRandomInteger(0, filteredProfiles.length - 1)];
      const profileId = Object.keys(profile)[0];

      const searchKeyIndex = getRandomInteger(0, searchKeys.length - 1);
      const searchKey = searchKeys[searchKeyIndex];
      searchKeys = searchKeys.filter((_, index) => index !== searchKeyIndex);
      await executeProfile(profileId, searchKey);

      if (searchKeys.length === 0) {
        console.log("No more search keys available, stopping execution");
        break;
      }
    }
  } catch (error) {
    console.error("Error in run:", error.message);
  }
};

module.exports = {
  run,
};
