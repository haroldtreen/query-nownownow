'use strict';

const cheerio = require('cheerio');
const requestPromise = require('request-promise');
const openurl = require('openurl');

const request = requestPromise.defaults({
    pool: { maxSockets: Infinity },
    gzip: true,
    forever: true,
});

const NOW_HOME = 'http://nownownow.com/';
const PROFILES_LIMIT = 100;

const textAt = (elems, index) => elems.eq(index).text().trim().replace(new RegExp('\n', 'g'), ' ');

const filterProfiles = (queries, profiles) => {
    let reducedProfileSet = profiles;
    Object.keys(queries).forEach((key) => {
        const regex = queries[key];
        reducedProfileSet = reducedProfileSet.filter((profile) => regex.test(profile[key]));
    });
    return reducedProfileSet;
};

const getProfileDetails = ($) => {
    const paragraphs = $('p');
    return {
        name: $('h1.name').text().trim(),
        location: textAt(paragraphs, 0),
        title: textAt(paragraphs, 1),
        do: textAt(paragraphs, 2),
        why: textAt(paragraphs, 3),
        read: textAt(paragraphs, 4),
    };
};

const getAllProfiles = () => {
    const profiles = [];
    return request(NOW_HOME).then((body) => {
        const $ = cheerio.load(body);
        const profileElements = $('li');
        profileElements.each((index, el) => {
            const profile = {
                path: $(el).find('.name').find('a')
                        .attr('href'),
                description: $(el).find('.subtitle').text(),
            };
            profiles.push(profile);
        });
        return Promise.resolve(profiles);
    });
};

const getProfile = (path) => {
    if (!path) {
        return Promise.resolve({});
    }
    const url = NOW_HOME + path;
    console.log(`Requesting ${url}`);
    return request(url).then((body) => {
        console.log(`Done Requesting ${url}`);
        const $ = cheerio.load(body);
        const profileDetails = getProfileDetails($);
        profileDetails.url = url;
        return Promise.resolve(profileDetails);
    })
    .catch((error) => Promise.resolve({}));
};

const shuffleArray = (array) => {
    let j;
    let x;
    let i;
    const shuffledArray = array;
    for (i = shuffledArray.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = shuffledArray[i - 1];
        shuffledArray[i - 1] = shuffledArray[j];
        shuffledArray[j] = x;
    }
    return shuffledArray;
};

const limitProfiles = (profiles) => shuffleArray(profiles).slice(0, PROFILES_LIMIT);

const openProfiles = (queries) => {
    getAllProfiles().then((profiles) => {
        const lessProfiles = limitProfiles(profiles);
        const profilePromises = lessProfiles.map((profile) => getProfile(profile.path));
        return Promise.all(profilePromises);
    })
    .then((profileResults) => {
        const successfulProfiles = profileResults.filter((profile) => profile.name);
        const matchedProfiles = filterProfiles(queries, successfulProfiles);
        matchedProfiles.forEach((matchedProfile) => openurl.open(matchedProfile.url));
    })
    .catch((error) => {
        console.log(error);
    });
};

module.exports = openProfiles;
