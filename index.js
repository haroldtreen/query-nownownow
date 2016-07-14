'use strict';

const cheerio = require('cheerio');
const openurl = require('openurl');
const ProgressBar = require('progress');

const requestPromise = require('request-promise');
const request = requestPromise.defaults({
    pool: { maxSockets: Infinity },
    gzip: true,
    forever: true,
});

const NOW_HOME = 'http://nownownow.com/';
const PROFILES_LIMIT = 100;
let profileDownloadBar;

const textAt = (elems, index) => elems.eq(index).text().trim().replace(new RegExp('\n', 'g'), ' ');

const filterProfiles = (queries, profiles) => {
    let reducedProfileSet = profiles.filter((profile) => profile && profile.name); // Only successful profiles
    Object.keys(queries).forEach((key) => {
        const regex = queries[key];
        reducedProfileSet = reducedProfileSet.filter((profile) => regex.test(profile[key]));
    });
    return reducedProfileSet;
};

const getProfileDetails = (body) => {
    const $ = cheerio.load(body);
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

const getProfilesList = () => {
    console.log('Fetching Profiles List...');

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
            if (profile.path) {
                profiles.push(profile);
            }
        });
        return Promise.resolve(profiles);
    });
};

const getProfile = (path) => {
    const url = NOW_HOME + path;
    return request(url).then((body) => {
        profileDownloadBar.tick();
        const profileDetails = getProfileDetails(body);
        profileDetails.url = url;
        return Promise.resolve(profileDetails);
    })
    .catch(() => {
        profileDownloadBar.tick();
        return Promise.resolve({});
    });
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

const getProfiles = (profilesList) => {
    console.log('Fetching Profiles...');

    const lessProfiles = limitProfiles(profilesList);
    profileDownloadBar = new ProgressBar('[:bar] :percent', { total: lessProfiles.length });

    const profilePromises = lessProfiles.map((profile) => getProfile(profile.path));

    return Promise.all(profilePromises);
};

const openProfiles = (queries) => {
    getProfilesList()
    .then((profilesList) => getProfiles(profilesList))
    .then((profiles) => {
        const matchedProfiles = filterProfiles(queries, profiles);
        matchedProfiles.forEach((matchedProfile) => openurl.open(matchedProfile.url));
        console.log(`\nDone - ${matchedProfiles.length} profiles found.`);
    })
    .catch((error) => {
        console.log(error);
    });
    return true;
};

module.exports = openProfiles;
