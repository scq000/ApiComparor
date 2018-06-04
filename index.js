const process = require("process");
const fs = require("fs");
const axios = require("axios");
const gitdiff = require("git-diff");

const args = process.argv.slice(2);

const originUrls = getUrls(args[0]);
const currentUrls = getUrls(args[1]);

const originPromise = createPromise(originUrls);

const currentPromise = createPromise(currentUrls);

const compareResults = [];

Promise.all([originPromise, currentPromise]).then(results => {
    const originResponse = results[0];
    const currentResponse = results[1];
    originResponse.forEach((response, i) => compareResults[i] = compare(response, currentResponse[i]));
    console.log(compareResults);
});

// get urls from path
function getUrls(path, cb) {
    if (path) {
        try {
            const content = fs.readFileSync(path, "utf8");
            const urls = content.split('\n');
            return urls;
        } catch (e) {
            console.log("Read file error: ", e);
        }
    }
}

function createPromise(urls) {
    return Promise.all(urls.map(url => {
        return axios.get(url).catch(e => {
            try {
                const errMsg = `url: ${url}, error: ${e} \n`;
                fs.writeFileSync("error.log", errMsg, {
                    encoding: "utf8",
                    flag: "a+"
                });
            } catch (err) {
                console.log("Write log file failed.");
            }
            return Promise.resolve();
        });
    }));
}

function compare(originResponse, currentResponse) {
    if(!originResponse || !currentResponse) {
        return false;
    }
    const diff = gitdiff(JSON.stringify(originResponse.data), JSON.stringify(currentResponse.data));
    if (diff) {
        return diff;
    } else {
        return true;
    }
}