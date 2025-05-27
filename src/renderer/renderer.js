var data = {
  websiteUrl: [ 'https://www.zoho.com',  'https://www.copper.com','https://www.bitrix24.com','https://www.hubspot.com','https://attio.com' ],
  keywords: [],
  pagesPerSession: 1,
  averageSessionDuration: 1,
  mobileSessionRate: 50,
  bounceRate: 50,
  scrollDepth: 50,
  monday: 50,
  tuesday: 50,
  wednesday: 50,
  thursday: 50,
  friday: 50,
  saturday: 50,
  sunday: 50,
};

$(document).ready(function () {
  const getKeywords = () => {
    $("#keywordsList").html("");
    $localStorageKeywords = JSON.parse(localStorage.getItem("keywords"));
    $localStorageKeywords?.map((keyword) => {
      $("#keywordsList")
        .append(`<div class="badge rounded-pill bg-primary" data-id="${keyword.id}">
                ${keyword.keyword}, ${keyword.clicksPerDay} clicks <i class="bi bi-x-circle-fill removeKeyword" role="button" id></i>
            </div>`);
    });
    data.keywords = $localStorageKeywords;
  };

  getKeywords();

  $("body").on("click", ".removeKeyword", (e) => {
    $keywordId = $(e.target).parents("div").attr("data-id");
    $localStorageKeywords = JSON.parse(localStorage.getItem("keywords"));
    $keywords = $localStorageKeywords.filter((key) => key.id != $keywordId);
    localStorage.setItem("keywords", JSON.stringify($keywords));

    getKeywords();
  });

  $("#keywordsForm").on("submit", (e) => {
    e.preventDefault();

    $localStorageKeywords = localStorage.getItem("keywords");
    $keywords =
      $localStorageKeywords === null ? [] : JSON.parse($localStorageKeywords);
    $keyword = $("#keyword").val();
    $clicksPerDay = $("#clicksPerDay").val();

    $item = {
      id: new Date().getTime(),
      keyword: $keyword,
      clicksPerDay: $clicksPerDay,
    };
    $keywords = [...$keywords, $item];
    localStorage.setItem("keywords", JSON.stringify($keywords));
    getKeywords();
  });

  $("#websiteUrl").on("change", (e) => {
    data.websiteUrl = e.target.value;
  });

  $("#pagesPerSession").on("change", (e) => {
    data.pagesPerSession = e.target.value;
  });

  $("#averageSessionDuration").on("change, input", (e) => {
    data.averageSessionDuration = e.target.value;
  });

  $("#mobileSessionRate").on("change, input", (e) => {
    $("#mobileSessionRateLabel").text(`${e.target.value} %`);
    data.mobileSessionRate = e.target.value;
  });

  $("#bounceRate").on("change, input", (e) => {
    $("#bounceRateLabel").text(`${e.target.value} %`);
    data.bounceRate = e.target.value;
  });

  $("#scrollDepth").on("change, input", (e) => {
    $("#scrollDepthLabel").text(`${e.target.value} %`);
    data.scrollDepth = e.target.value;
  });

  $("#monday").on("change, input", (e) => {
    $("#mondayLabel").text(`${e.target.value}%`);
    data.monday = e.target.value;
  });

  $("#tuesday").on("change, input", (e) => {
    $("#tuesdayLabel").text(`${e.target.value}%`);
    data.tuesday = e.target.value;
  });

  $("#wednesday").on("change, input", (e) => {
    $("#wednesdayLabel").text(`${e.target.value}%`);
    data.wednesday = e.target.value;
  });

  $("#thursday").on("change, input", (e) => {
    $("#thursdayLabel").text(`${e.target.value}%`);
    data.thursday = e.target.value;
  });

  $("#friday").on("change, input", (e) => {
    $("#fridayLabel").text(`${e.target.value}%`);
    data.friday = e.target.value;
  });

  $("#saturday").on("change, input", (e) => {
    $("#saturdayLabel").text(`${e.target.value}%`);
    data.saturday = e.target.value;
  });

  $("#sunday").on("change, input", (e) => {
    $("#sundayLabel").text(`${e.target.value}%`);
    data.sunday = e.target.value;
  });

  $("#startProject").on("click", (e) => {
    run();
  });
});

const run = () => {
  return new Promise((resolve, reject) => {
    console.log("All data is: ", JSON.stringify(data));
    api.send("run", JSON.stringify(data));
    api.receive("ran", (event) => {
      resolve(true);
    });
    api.receive("run-error", (event, errorMessage) => {
      console.log(errorMessage);
      reject(false);
    });
  });
};
