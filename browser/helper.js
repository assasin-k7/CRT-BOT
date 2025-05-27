const axios = require("axios");
const path = require("path");

const { 
  MAX_CLICKS_PER_DAY,
  DAYS,
} = require(path.join(__dirname, "./config"));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchData = async (url) => {
  try {
    const { data } = await axios.get(url);
    return data;
  } catch (error) {
    console.error(`Error fetching data from ${url}`, error.message);
    throw error;
  }
};

const getRandomInteger = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const searchKeys2Array = (searchKeys) => {
  let res = [];
  searchKeys.map(searchKey => {
    const item = Array(Number(searchKey.clicksPerDay)).fill(searchKey.keyword);
    res = [...res, ...item]
  })
  return res;
}

const getAvailableClicksByDay = (config) => {
  const day = DAYS[new Date().getDay()];
  const availableClicks = Math.floor(MAX_CLICKS_PER_DAY * config[day] / 100);
  return availableClicks;
}

const getPercentArray = (percent, type) => {
  let res = [];

  if (type == "mobileSessionRate") {
    res = [...res, ...Array(Number(percent)).fill("mobile")];
    res = [...res, ...Array(100 - Number(percent)).fill("desktop")]
  } else {
    res = [...res, ...Array(Number(percent)).fill(true)];
    res = [...res, ...Array(100 - Number(percent)).fill(false)];
  }

  return res;
}

module.exports = {
  sleep,
  fetchData,
  getRandomInteger,
  searchKeys2Array,
  getAvailableClicksByDay,
  getPercentArray
};
