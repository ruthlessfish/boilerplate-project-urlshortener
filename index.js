require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { URL } = require("url");
const dns = require("dns");
const bodyParser = require('body-parser');
const { get } = require('express/lib/response');
const mongoose = require('mongoose');
const { Schema } = mongoose;

const shorturlSchema = new Schema({
  original_url: String,
  short_url: String
});

const shorturlModel = mongoose.model("shorturl", shorturlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

async function connect() {
  await mongoose.connect(process.env.MONGO_URI);
}
connect()
  .then(() => console.log('connected to MongoDB'))
  .catch(err => console.log(err));

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use('/public', express.static(`${process.cwd()}/public`));

const validateUrl = (url) => {
  return /^(http(s):\/\/.)[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/g.test(
    url
  );
};

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', (req, res) => {
  const url = req.body.url;

  if (! validateUrl(url)) {
    return res.json({error: "invalid url"});
  }

  const urlObj = new URL(url);
  dns.lookup(urlObj.hostname, async (err, addr, fam) => {
    if (! addr) {
      return res.json({errorL: "invalid url"});
    }

    const count = await shorturlModel.countDocuments()+1;
    const shorturl = new shorturlModel({
      original_url: url,
      short_url: count
    });

    await shorturl.save();

    return res.json({
      original_url: url,
      short_url: count
    });
  });
});

app.get("/api/shorturl/:short_url", async (req, res) => {
  const shorturl = req.params.short_url;
  const urlDoc = await shorturlModel.findOne({ short_url: +shorturl });
  res.redirect(urlDoc.original_url);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
