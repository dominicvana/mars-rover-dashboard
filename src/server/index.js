require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');
const { ESRCH } = require('constants');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/', express.static(path.join(__dirname, '../public')));

// ------------------------------------------------------  UTILS

const upperFirstChar = (str) => str[0].toUpperCase() + str.slice(1);

const parseKey = (key) => {
  const splitKey = key.split('');
  const upperChars = key.match(/[A-Z]/g);
  if (upperChars) {
    upperChars
      .map((char) => key.indexOf(char))
      .map((charIdx, i) => charIdx + i)
      .forEach((i) => splitKey.splice(i, 0, ' '));

    key = splitKey.join('');
  }
  return upperFirstChar(key);
};

const formatEntries = (o, cb) => Object.entries(o).map(cb);

const parseRoverData = (raw) => {
  return raw.json().then((parsed) => {
    const {
      name,
      landing_date: landingDate,
      launch_date: launchDate,
      status,
      max_date: lastPhotoDate,
      total_photos: totalPhotos,
    } = parsed.photo_manifest;

    const o = {
      name,
      landingDate,
      launchDate,
      status,
      lastPhotoDate,
      totalPhotos,
    };

    o.formattedEntries = formatEntries(o, (entry) => {
      entry[0] = parseKey(entry[0]);
      return entry;
    });

    return o;
  });
};

// CARD COMPONENT GENERATED HERE ON BACKEND
const BgImage = (className, data) => `
    <div 
      class="${className}" 
      style="background-image: url('./assets/media/${data.name.toLowerCase()}.jpeg');"
    >
    </div>
  `;

const GalleryBtn = (className) => {
  return `<button class="${className}">
    <i class="material-icons">add</i>Expand gallery</button>`;
};

const InfoHeading = (labelClass, headingClass, roverName) => {
  return `
    <label 
      class="${labelClass}"
    >Name
      <h2 class="${headingClass}">${roverName}</h2>
    </label>
  `;
};

const InfoItem = (labelClass, itemClass, data) => {
  return `
    <label 
      class="${labelClass}"
    >${data[0]}
      <li class="${itemClass}">${data[1]}</li>
    </label>
  `;
};

const CardInfo = (data) => {
  const { name, formattedEntries } = data;

  let output = InfoHeading('card__label', 'card__info-heading', name);

  output = formattedEntries.slice(1).reduce((accum, entry) => {
    return accum + InfoItem('card__label', 'card__entry', entry);
  }, output);
  console.log('CardInfo output', output);

  return output;
};

const Card = (data) =>
  [
    BgImage('card__bg-image', data),
    GalleryBtn('card__gallery-btn'),
    CardInfo(data),
  ].reduce((accum, child) => accum + child, ``);

// ------------------------------------------------------  API CALLS

app.get('/rover-info/:rover', async (req, res) => {
  const rover = req.params.rover;
  const manifestsEndpoint = `https://api.nasa.gov/mars-photos/api/v1/manifests/${rover}/?api_key=${process.env.API_KEY}`;

  try {
    const data = await fetch(manifestsEndpoint).then((raw) =>
      parseRoverData(raw)
    );
    console.log(data);
    data.card = Card(data);
    res.send(data);
  } catch (error) {
    console.log('Something went wrong fetching rover data', error);
  }
});

app.get('/apod', async (req, res) => {
  try {
    let image = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=${process.env.API_KEY}`
    ).then((res) => res.json());
    res.send({ image });
  } catch (err) {
    console.log('error:', err);
  }
});

app.listen(port, () => console.log(`Mars rover app listening on port ${port}`));
